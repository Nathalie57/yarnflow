<?php
/**
 * @file PatternTranslatorController.php
 * @brief Traduction de patrons tricot/crochet via IA
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Middleware\AuthMiddleware;
use App\Services\PatternTranslatorService;
use App\Config\Database;

class PatternTranslatorController
{
    private User $userModel;
    private AuthMiddleware $authMiddleware;
    private PatternTranslatorService $translatorService;
    private \PDO $db;

    private const UPLOAD_DIR = __DIR__ . '/../../uploads/patterns/';
    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    public function __construct()
    {
        $this->userModel = new User();
        $this->authMiddleware = new AuthMiddleware();
        $this->translatorService = new PatternTranslatorService();
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * GET /api/pattern-translator/quota
     */
    public function getQuota(): void
    {
        try {
            $userId = $this->getUserId();
            $user = $this->userModel->findById($userId);
            if (!$user) { $this->json(['error' => 'Utilisateur introuvable'], 404); return; }

            $plan = $this->getPlan($user['subscription_type'], $userId);
            $this->json(['success' => true, 'quota' => $this->buildQuotaResponse($userId, $plan)]);

        } catch (\Exception $e) {
            $this->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * POST /api/pattern-translator/translate
     * Body: { url: string } OU { text: string }
     * Multipart: { file: PDF }
     */
    public function translate(): void
    {
        try {
            $userId = $this->getUserId();
            $user = $this->userModel->findById($userId);
            if (!$user) { $this->json(['error' => 'Utilisateur introuvable'], 404); return; }

            $plan = $this->getPlan($user['subscription_type'], $userId);

            // Vérifier quota
            if (!$this->checkQuota($userId, $plan)) {
                $message = $plan['tier'] === 'free'
                    ? 'Vos 3 traductions gratuites sont épuisées. Passez à PLUS ou PRO pour continuer.'
                    : "Limite mensuelle atteinte ({$plan['monthly_limit']} traductions/mois). Renouvellement le 1er du mois.";
                $this->json(['error' => $message, 'quota_exceeded' => true, 'upgrade_required' => $plan['tier'] === 'free'], 403);
                return;
            }

            // Déterminer la source
            $sourceType = null;
            $result = null;
            $sourceName = null;

            if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                // PDF uploadé
                $file = $_FILES['file'];
                if ($file['size'] > self::MAX_FILE_SIZE) {
                    $this->json(['error' => 'Fichier trop volumineux (max 10 MB)'], 400); return;
                }
                if (mime_content_type($file['tmp_name']) !== 'application/pdf') {
                    $this->json(['error' => 'Seuls les fichiers PDF sont acceptés'], 400); return;
                }
                $tempPath = self::UPLOAD_DIR . uniqid('trans_') . '.pdf';
                if (!is_dir(self::UPLOAD_DIR)) mkdir(self::UPLOAD_DIR, 0755, true);
                move_uploaded_file($file['tmp_name'], $tempPath);

                $sourceType = 'pdf';
                $sourceName = $file['name'];
                $result = $this->translatorService->translateFromPdf($tempPath);
                unlink($tempPath);

            } elseif (!empty($_POST['url'] ?? '')) {
                $url = trim($_POST['url']);
                $sourceType = 'url';
                $sourceName = $url;
                $result = $this->translatorService->translateFromUrl($url);

            } elseif (!empty($_POST['text'] ?? '')) {
                $text = trim($_POST['text']);
                $sourceType = 'text';
                $sourceName = 'texte direct';
                $result = $this->translatorService->translateFromText($text);

            } else {
                $this->json(['error' => 'Fournissez une URL, un fichier PDF ou un texte à traduire'], 400);
                return;
            }

            if (!$result['success']) {
                $this->json(['success' => false, 'error' => $result['error']], 422);
                return;
            }

            // Logger l'utilisation
            $this->logUsage($userId, $sourceType, $sourceName);

            // Quota restant
            $quota = $this->buildQuotaResponse($userId, $plan);

            $this->json([
                'success' => true,
                'translation' => $result['translation'],
                'source_type' => $sourceType,
                'source_name' => $sourceName,
                'truncated' => $result['truncated'] ?? false,
                'quota' => $quota,
            ]);

        } catch (\Throwable $e) {
            error_log('[PatternTranslator] translate() error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            $this->json(['error' => 'Erreur lors de la traduction', 'detail' => $e->getMessage()], 500);
        }
    }

    /**
     * Retourne le plan effectif de l'utilisateur
     */
    private function getPlan(string $subscriptionType, int $userId): array
    {
        $proTypes  = ['pro', 'pro_annual', 'early_bird', 'monthly', 'yearly', 'standard', 'premium', 'starter'];
        $plusTypes = ['plus', 'plus_annual'];

        if (in_array($subscriptionType, $proTypes) && $this->userModel->hasActiveSubscription($userId)) {
            return ['tier' => 'pro', 'monthly_limit' => 15];
        }
        if (in_array($subscriptionType, $plusTypes) && $this->userModel->hasActiveSubscription($userId)) {
            return ['tier' => 'plus', 'monthly_limit' => 3];
        }
        return ['tier' => 'free', 'monthly_limit' => 0];
    }

    /**
     * Vérifie si l'utilisateur peut encore traduire
     */
    private function checkQuota(int $userId, array $plan): bool
    {
        if ($plan['monthly_limit'] > 0) {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM ai_pattern_translations WHERE user_id = :uid AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
            $stmt->execute(['uid' => $userId]);
            return (int)$stmt->fetchColumn() < $plan['monthly_limit'];
        }
        // FREE : 3 à vie
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM ai_pattern_translations WHERE user_id = :uid");
        $stmt->execute(['uid' => $userId]);
        return (int)$stmt->fetchColumn() < 3;
    }

    /**
     * Construit la réponse quota
     */
    private function buildQuotaResponse(int $userId, array $plan): array
    {
        if ($plan['monthly_limit'] > 0) {
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM ai_pattern_translations WHERE user_id = :uid AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
            $stmt->execute(['uid' => $userId]);
            $used = (int)$stmt->fetchColumn();
            return ['tier' => $plan['tier'], 'used' => $used, 'limit' => $plan['monthly_limit'], 'remaining' => max(0, $plan['monthly_limit'] - $used), 'is_lifetime' => false];
        }
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM ai_pattern_translations WHERE user_id = :uid");
        $stmt->execute(['uid' => $userId]);
        $used = (int)$stmt->fetchColumn();
        return ['tier' => 'free', 'used' => $used, 'limit' => 3, 'remaining' => max(0, 3 - $used), 'is_lifetime' => true];
    }

    /**
     * Enregistre l'utilisation
     */
    private function logUsage(int $userId, string $sourceType, string $sourceName): void
    {
        try {
            $stmt = $this->db->prepare("INSERT INTO ai_pattern_translations (user_id, source_type, source_name, created_at) VALUES (:uid, :type, :name, NOW())");
            $stmt->execute(['uid' => $userId, 'type' => $sourceType, 'name' => mb_substr($sourceName, 0, 500)]);
        } catch (\Exception $e) {
            error_log('[PatternTranslator] Erreur logUsage: ' . $e->getMessage());
        }
    }

    private function getUserId(): int
    {
        $userData = $this->authMiddleware->authenticate();
        if (!$userData) throw new \Exception('Non authentifié');
        return (int)$userData['user_id'];
    }

    private function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
