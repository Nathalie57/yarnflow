<?php
/**
 * @file SmartProjectController.php
 * @brief Contrôleur pour la création intelligente de projets via IA
 * @author Nathalie + AI Assistants
 * @created 2026-01-07
 * @modified 2026-01-07 by [AI:Claude] - Création Smart Project V1
 *
 * @history
 *   2026-01-07 [AI:Claude] Endpoints d'analyse PDF/URL et création assistée IA
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Services\AIPatternExtractorService;
use App\Services\PricingService;
use App\Middleware\AuthMiddleware;

class SmartProjectController
{
    private Project $projectModel;
    private User $userModel;
    private AIPatternExtractorService $extractorService;
    private PricingService $pricingService;
    private AuthMiddleware $authMiddleware;

    private const UPLOAD_DIR = __DIR__ . '/../../uploads/patterns/';
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    public function __construct()
    {
        $this->projectModel = new Project();
        $this->userModel = new User();
        $this->extractorService = new AIPatternExtractorService();
        $this->pricingService = new PricingService();
        $this->authMiddleware = new AuthMiddleware();

        // Créer le dossier uploads si nécessaire
        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }
    }

    /**
     * GET /api/projects/smart-create/quota
     * Récupère le quota d'imports IA restants pour l'utilisateur
     */
    public function getQuota(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $this->jsonResponse(['error' => 'Utilisateur introuvable'], 404);
                return;
            }

            $subscriptionType = $user['subscription_type'] ?? 'free';
            $maxQuota = $this->pricingService->getLimit($subscriptionType, 'ai_pattern_imports_monthly');

            // Compter les imports du mois en cours
            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                SELECT COUNT(*) as count
                FROM ai_pattern_imports
                WHERE user_id = :user_id
                  AND MONTH(created_at) = MONTH(NOW())
                  AND YEAR(created_at) = YEAR(NOW())
            ");
            $stmt->execute(['user_id' => $userId]);
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);

            $usedQuota = (int)$result['count'];
            $remainingQuota = max(0, $maxQuota - $usedQuota);

            $this->jsonResponse([
                'success' => true,
                'quota' => [
                    'total' => $maxQuota,
                    'used' => $usedQuota,
                    'remaining' => $remainingQuota,
                    'unlimited' => $maxQuota >= 999999,
                    'plan' => $subscriptionType
                ]
            ]);

        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur getQuota: ' . $e->getMessage());
            $this->jsonResponse(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * POST /api/projects/smart-create/analyze
     * Analyse un PDF ou une URL et extrait les informations du patron
     *
     * Body (multipart): {file: File} OU {url: string}
     */
    public function analyze(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $this->jsonResponse(['error' => 'Utilisateur introuvable'], 404);
                return;
            }

            // Vérifier le quota
            if (!$this->hasRemainingQuota($userId, $user['subscription_type'])) {
                $this->jsonResponse([
                    'error' => 'Quota d\'imports IA atteint pour ce mois',
                    'upgrade_required' => true
                ], 403);
                return;
            }

            // Déterminer le type d'import (PDF ou URL)
            $sourceType = null;
            $sourceName = null;
            $filePath = null;
            $fileSize = null;

            if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                // Upload PDF
                $sourceType = 'pdf';
                $filePath = $_FILES['file']['tmp_name'];
                $sourceName = $_FILES['file']['name'];
                $fileSize = $_FILES['file']['size'];

                // Validation
                if ($fileSize > self::MAX_FILE_SIZE) {
                    $this->jsonResponse(['error' => 'Fichier trop volumineux (max 10 MB)'], 400);
                    return;
                }

                $mimeType = mime_content_type($filePath);
                if ($mimeType !== 'application/pdf') {
                    $this->jsonResponse(['error' => 'Seuls les fichiers PDF sont acceptés'], 400);
                    return;
                }

                // Copier le fichier temporairement
                $tempPath = self::UPLOAD_DIR . uniqid('pattern_') . '.pdf';
                move_uploaded_file($filePath, $tempPath);
                $filePath = $tempPath;

            } elseif (isset($_POST['url']) && !empty($_POST['url'])) {
                // Import URL
                $sourceType = 'url';
                $sourceName = $_POST['url'];

            } else {
                $this->jsonResponse(['error' => 'Fichier PDF ou URL requis'], 400);
                return;
            }

            // Extraire avec IA
            $extractionStart = microtime(true);

            if ($sourceType === 'pdf') {
                $result = $this->extractorService->extractFromPDF($filePath);
            } else {
                $result = $this->extractorService->extractFromURL($sourceName);
            }

            $processingTime = isset($result['processing_time_ms']) ? $result['processing_time_ms'] : round((microtime(true) - $extractionStart) * 1000);

            // Logger l'import (même si échec partiel)
            $this->logImport($userId, null, $sourceType, $sourceName, $fileSize, $result['ai_status'] ?? 'failed', $result['raw_response'] ?? null, $processingTime, $result['error'] ?? null);

            // Nettoyer le fichier temp
            if ($sourceType === 'pdf' && file_exists($filePath)) {
                unlink($filePath);
            }

            // Retourner le résultat
            if (!$result['success']) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => $result['error'],
                    'ai_status' => $result['ai_status']
                ], $result['ai_status'] === 'failed' ? 422 : 200);
                return;
            }

            $this->jsonResponse([
                'success' => true,
                'data' => $result['data'],
                'ai_status' => $result['ai_status'],
                'processing_time_ms' => $processingTime,
                'source_type' => $sourceType,
                'source_name' => $sourceName
            ]);

        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur analyze: ' . $e->getMessage());
            error_log('[SmartProject] Stack trace: ' . $e->getTraceAsString());
            $this->jsonResponse(['error' => 'Erreur lors de l\'analyse: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/projects/smart-create/confirm
     * Crée le projet après validation par l'utilisateur
     *
     * Body JSON: {
     *   project: {...},
     *   sections: [{...}],
     *   source_type: 'pdf'|'url',
     *   source_url: string
     * }
     */
    public function confirm(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['project']) || !isset($data['sections'])) {
                $this->jsonResponse(['error' => 'Données projet et sections requises'], 400);
                return;
            }

            $projectData = $data['project'];
            $sectionsData = $data['sections'];
            $sourceType = $data['source_type'] ?? 'manual';
            $sourceUrl = $data['source_url'] ?? null;

            // Créer le projet
            $db = \App\Config\Database::getInstance()->getConnection();
            $db->beginTransaction();

            try {
                // Préparer les données du projet
                $insertData = [
                    'user_id' => $userId,
                    'name' => $projectData['title'] ?? 'Nouveau projet',
                    'type' => $this->mapCategoryToType($projectData['category'] ?? null),
                    'craft_type' => $projectData['craft_type'] ?? null,
                    'description' => $projectData['description'] ?? null,
                    'pattern_notes' => $projectData['pattern_notes'] ?? null,
                    'source_type' => $sourceType,
                    'source_url' => $sourceUrl,
                    'status' => 'in_progress'
                ];

                // Détails techniques
                if (isset($projectData['yarn']['brand'])) {
                    $insertData['yarn_brand'] = $projectData['yarn']['brand'];
                }
                if (isset($projectData['yarn']['color'])) {
                    $insertData['yarn_color'] = $projectData['yarn']['color'];
                }
                if (isset($projectData['yarn']['weight'])) {
                    $insertData['yarn_weight'] = $projectData['yarn']['weight'];
                }
                if (isset($projectData['hook_or_needles']['size'])) {
                    $insertData['hook_size'] = $projectData['hook_or_needles']['size'];
                }
                if (isset($projectData['gauge']['stitches'])) {
                    $insertData['gauge_stitches'] = $projectData['gauge']['stitches'];
                }
                if (isset($projectData['gauge']['rows'])) {
                    $insertData['gauge_rows'] = $projectData['gauge']['rows'];
                }
                if (isset($projectData['gauge']['size_cm'])) {
                    $insertData['gauge_size_cm'] = $projectData['gauge']['size_cm'];
                }

                // Insérer le projet
                $projectId = $this->projectModel->create($insertData);

                // Créer les sections
                if (!empty($sectionsData)) {
                    $stmt = $db->prepare("
                        INSERT INTO project_sections
                        (project_id, name, unit, target_value, description, display_order)
                        VALUES (:project_id, :name, :unit, :target_value, :description, :display_order)
                    ");

                    foreach ($sectionsData as $index => $section) {
                        $stmt->execute([
                            'project_id' => $projectId,
                            'name' => $section['name'],
                            'unit' => $section['unit'] ?? 'rangs',
                            'target_value' => $section['target'] ?? null,
                            'description' => $section['description'] ?? null,
                            'display_order' => $index + 1
                        ]);
                    }
                }

                // Mettre à jour le log d'import avec le project_id
                $stmt = $db->prepare("
                    UPDATE ai_pattern_imports
                    SET project_id = :project_id
                    WHERE user_id = :user_id
                      AND project_id IS NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                ");
                $stmt->execute([
                    'project_id' => $projectId,
                    'user_id' => $userId
                ]);

                $db->commit();

                // Récupérer le projet complet
                $project = $this->projectModel->findById($projectId);

                $this->jsonResponse([
                    'success' => true,
                    'project' => $project,
                    'message' => 'Projet créé avec succès'
                ], 201);

            } catch (\Exception $e) {
                $db->rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur confirm: ' . $e->getMessage());
            $this->jsonResponse(['error' => 'Erreur lors de la création du projet'], 500);
        }
    }

    /**
     * Vérifie si l'utilisateur a du quota restant
     */
    private function hasRemainingQuota(int $userId, string $subscriptionType): bool
    {
        $maxQuota = $this->pricingService->getLimit($subscriptionType, 'ai_pattern_imports_monthly');

        if ($maxQuota >= 999999) {
            return true; // Illimité
        }

        $db = \App\Config\Database::getInstance()->getConnection();
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM ai_pattern_imports
            WHERE user_id = :user_id
              AND MONTH(created_at) = MONTH(NOW())
              AND YEAR(created_at) = YEAR(NOW())
        ");
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return (int)$result['count'] < $maxQuota;
    }

    /**
     * Logger un import IA (succès ou échec)
     */
    private function logImport(
        int $userId,
        ?int $projectId,
        string $sourceType,
        string $sourceName,
        ?int $fileSize,
        string $aiStatus,
        ?array $aiResponse,
        int $processingTime,
        ?string $error
    ): void {
        try {
            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO ai_pattern_imports
                (user_id, project_id, source_type, source_name, file_size_bytes, ai_status, ai_response_json, processing_time_ms, error_message, ip_address)
                VALUES (:user_id, :project_id, :source_type, :source_name, :file_size, :ai_status, :ai_response, :processing_time, :error, :ip)
            ");

            $stmt->execute([
                'user_id' => $userId,
                'project_id' => $projectId,
                'source_type' => $sourceType,
                'source_name' => $sourceName,
                'file_size' => $fileSize,
                'ai_status' => $aiStatus,
                'ai_response' => $aiResponse ? json_encode($aiResponse) : null,
                'processing_time' => $processingTime,
                'error' => $error,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur logImport: ' . $e->getMessage());
        }
    }

    /**
     * Map catégorie détectée → type projet (hat, scarf, etc.)
     */
    private function mapCategoryToType(?string $category): ?string
    {
        if (!$category) return null;

        $mapping = [
            'bonnet' => 'hat',
            'écharpe' => 'scarf',
            'amigurumi' => 'amigurumi',
            'sac' => 'bag',
            'pull' => 'garment',
            'vêtements' => 'garment',
            'vêtements bébé' => 'baby_garment',
            'accessoires bébé' => 'other',
            'jouets/peluches' => 'toy',
            'maison/déco' => 'home_decor',
            'couverture' => 'other'
        ];

        return $mapping[$category] ?? 'other';
    }

    /**
     * Récupère l'ID utilisateur depuis le token JWT
     */
    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();

        if ($userData === null) {
            throw new \Exception('Non authentifié');
        }

        return (int)$userData['user_id'];
    }

    /**
     * Envoie une réponse JSON
     */
    private function jsonResponse(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
