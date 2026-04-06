<?php
/**
 * @file AiAssistantController.php
 * @brief Assistant IA tricot/crochet — réservé aux abonnés PLUS et PRO
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Middleware\AuthMiddleware;
use App\Config\Database;
use GuzzleHttp\Client;
use PDO;

class AiAssistantController
{
    private PDO $db;
    private User $userModel;
    private AuthMiddleware $authMiddleware;
    private Client $httpClient;
    private string $apiKey;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->userModel = new User();
        $this->authMiddleware = new AuthMiddleware();
        $this->httpClient = new Client([
            'timeout' => 30,
            'verify' => !($_ENV['APP_ENV'] === 'local' || $_ENV['APP_DEBUG'] === 'true'),
        ]);
        $this->apiKey = $_ENV['GEMINI_API_KEY'] ?? '';
    }

    private const LIMITS = ['plus' => 50, 'pro' => 150];

    /**
     * POST /api/ai/assistant
     * Body: { messages: [{role, content}], context?: string }
     * Réservé aux abonnés PLUS et PRO.
     */
    public function chat(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $this->sendResponse(401, ['error' => 'Utilisateur non trouvé']);
                return;
            }

            // Vérifier abonnement PLUS ou PRO
            if (!$this->hasActiveSubscription($user)) {
                $this->sendResponse(403, [
                    'error' => 'Cette fonctionnalité est réservée aux abonnés PLUS et PRO.',
                    'upgrade_required' => true
                ]);
                return;
            }

            // Vérifier quota mensuel
            $plan = $user['subscription_type'];
            $limit = self::LIMITS[$plan] ?? 50;
            $month = date('Y-m');
            $used = $this->getMonthlyUsage($userId, $month);

            if ($used >= $limit) {
                $this->sendResponse(429, [
                    'error' => "Limite mensuelle atteinte ({$limit} messages). Revenez le mois prochain.",
                    'limit_reached' => true,
                    'limit' => $limit,
                    'used' => $used
                ]);
                return;
            }

            $data = $this->getJsonInput();
            $messages = $data['messages'] ?? [];

            if (empty($messages)) {
                $this->sendResponse(400, ['error' => 'Messages manquants']);
                return;
            }

            // Limiter l'historique à 20 messages pour contrôler les coûts
            $messages = array_slice($messages, -20);

            $geminiContents = array_map(function ($msg) {
                return [
                    'role' => $msg['role'] === 'assistant' ? 'model' : 'user',
                    'parts' => [['text' => $msg['content']]]
                ];
            }, $messages);

            $response = $this->httpClient->post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $this->apiKey,
                [
                    'headers' => ['content-type' => 'application/json'],
                    'json' => [
                        'systemInstruction' => [
                            'parts' => [['text' => $this->getSystemPrompt()]]
                        ],
                        'contents' => $geminiContents,
                        'generationConfig' => ['maxOutputTokens' => 1024]
                    ]
                ]
            );

            $result = json_decode($response->getBody()->getContents(), true);
            $reply = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Incrémenter le compteur après succès
            $this->incrementUsage($userId, $month);
            $remaining = $limit - $used - 1;

            $this->sendResponse(200, [
                'reply' => $reply,
                'usage' => ['used' => $used + 1, 'limit' => $limit, 'remaining' => $remaining]
            ]);

        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $this->sendResponse(502, ['error' => 'Erreur API IA : ' . $e->getMessage()]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['error' => $e->getMessage()]);
        }
    }

    private function getSystemPrompt(): string
    {
        return <<<PROMPT
Tu es un assistant expert en tricot et crochet, intégré dans YarnFlow, une application de suivi de projets textile.

Ton rôle :
- Répondre aux questions sur les techniques de tricot et crochet (points, augmentations, diminutions, montages, etc.)
- Expliquer les abréviations des patrons (FR, US, UK)
- Aider à résoudre des problèmes concrets ("mon tricot tire", "mes mailles tombent", etc.)
- Faire des calculs avec des formules et des exemples chiffrés (nombre de mailles, répartition, échantillon)
- Suggérer des techniques adaptées au niveau de l'utilisateur

Règles STRICTES sur le format des réponses :
- Va DIRECTEMENT à l'essentiel — pas de phrase d'introduction inutile ("Bonjour !", "Bonne question !", "C'est tout à fait faisable !")
- Donne des réponses CONCRÈTES avec des chiffres, des formules, des étapes numérotées
- Si une question implique un calcul, montre la formule et un exemple chiffré
- Si tu as besoin de données manquantes (échantillon, nombre de mailles, etc.), demande-les directement
- Réponds en français, sois précis et concis
- Si tu ne sais pas, dis-le clairement plutôt que d'inventer
- Ne parle que de tricot, crochet et textile — redirige poliment si hors sujet
- Utilise les termes français en priorité avec l'équivalent anglais entre parenthèses si utile
PROMPT;
    }

    /**
     * GET /api/ai/usage
     * Retourne le quota du mois en cours.
     */
    public function usage(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $this->sendResponse(401, ['error' => 'Utilisateur non trouvé']);
                return;
            }

            $plan = $user['subscription_type'] ?? 'free';
            $limit = self::LIMITS[$plan] ?? 0;
            $used = $limit > 0 ? $this->getMonthlyUsage($userId, date('Y-m')) : 0;

            $this->sendResponse(200, [
                'used' => $used,
                'limit' => $limit,
                'remaining' => max(0, $limit - $used)
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, ['error' => $e->getMessage()]);
        }
    }

    private function getMonthlyUsage(int $userId, string $month): int
    {
        $stmt = $this->db->prepare('SELECT count FROM ai_usage WHERE user_id = ? AND month = ?');
        $stmt->execute([$userId, $month]);
        return (int)($stmt->fetchColumn() ?: 0);
    }

    private function incrementUsage(int $userId, string $month): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO ai_usage (user_id, month, count) VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE count = count + 1'
        );
        $stmt->execute([$userId, $month]);
    }

    private function hasActiveSubscription(array $user): bool
    {
        $type = $user['subscription_type'] ?? 'free';

        if ($type === 'free') return false;

        // Vérifier expiration
        if (isset($user['subscription_expires_at']) && $user['subscription_expires_at'] !== null) {
            if (strtotime($user['subscription_expires_at']) <= time()) {
                return false;
            }
        }

        return true;
    }

    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();
        if ($userData === null) throw new \Exception('Non authentifié');
        return (int)$userData['user_id'];
    }

    private function getJsonInput(): array
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        if (json_last_error() !== JSON_ERROR_NONE) throw new \InvalidArgumentException('JSON invalide');
        return $data ?? [];
    }

    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
