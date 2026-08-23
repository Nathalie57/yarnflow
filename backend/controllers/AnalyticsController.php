<?php
/**
 * @file AnalyticsController.php
 * @brief Endpoint de journalisation des jalons du parcours produit
 *
 * [AI:Claude] 2026-08-23 — le frontend (ProjectCounter.jsx) appelait déjà
 * POST /analytics/track-event pour first_row_counted et project_worked_again,
 * mais cette route n'a jamais existé côté backend : chaque appel échouait en
 * silence (404 avalé par le try/catch appelant) depuis sa mise en place. Aucun
 * de ces deux événements n'a donc jamais été enregistré nulle part.
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Middleware\AuthMiddleware;
use App\Services\AnalyticsService;

class AnalyticsController
{
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->authMiddleware = new AuthMiddleware();
    }

    public function trackEvent(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            $eventName = $data['event_name'] ?? null;
            if (!$eventName) {
                $this->sendResponse(400, ['success' => false, 'error' => 'event_name requis']);
                return;
            }

            $projectId = isset($data['project_id']) ? (int)$data['project_id'] : null;
            unset($data['event_name'], $data['project_id']);

            AnalyticsService::log($userId, $projectId, (string)$eventName, $data);

            $this->sendResponse(200, ['success' => true]);
        } catch (\Exception $e) {
            // [AI:Claude] Best-effort : un souci ici ne doit jamais bloquer le
            // parcours utilisateur qui a déclenché l'événement.
            error_log('[Analytics] Erreur trackEvent: ' . $e->getMessage());
            $this->sendResponse(200, ['success' => false]);
        }
    }

    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();

        if ($userData === null)
            throw new \Exception('Non authentifié');

        return (int)$userData['user_id'];
    }

    private function getJsonInput(): array
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE)
            throw new \InvalidArgumentException('JSON invalide');

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
