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

    // Jalons envoyés par le frontend qui ne doivent exister qu'une fois par utilisatrice
    private const ONCE_PER_USER_EVENTS = ['onboarding_started', 'demo_completed'];

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

            $eventName = (string)$eventName;
            if (!preg_match('/^[a-z0-9_]{2,50}$/', $eventName)) {
                $this->sendResponse(400, ['success' => false, 'error' => 'event_name invalide']);
                return;
            }

            $projectId = isset($data['project_id']) ? (int)$data['project_id'] : null;
            unset($data['event_name'], $data['project_id']);

            // [AI:Claude] 2026-09-25 — Le plan courant est lu en base plutôt que fourni par
            // le frontend (état local possiblement périmé après un changement de plan).
            if ($eventName === 'paywall_shown') {
                $user = (new \App\Models\User())->findById($userId);
                $data['current_plan'] = $user['subscription_type'] ?? 'free';
            }

            // Écran "0 projet" revu par quelqu'un qui a déjà créé un projet (puis tout
            // supprimé) : ce n'est pas un début d'onboarding.
            if ($eventName === 'onboarding_started' && AnalyticsService::hasEvent($userId, 'project_created')) {
                $this->sendResponse(200, ['success' => true]);
                return;
            }

            if (in_array($eventName, self::ONCE_PER_USER_EVENTS, true)) {
                AnalyticsService::logOnce($userId, $projectId, $eventName, $data);
            } else {
                AnalyticsService::log($userId, $projectId, $eventName, $data);
            }

            // [AI:Claude] Premier rang réellement compté sur un projet non démo → jalon
            // d'activation (une seule fois par utilisatrice, voir AnalyticsService).
            // project_worked_again aussi : si la progression de départ a été saisie à
            // l'onboarding, le premier rang compté n'émet jamais first_row_counted.
            // activation_reached renvoyé dans la réponse uniquement quand il vient d'être
            // enregistré : le compteur affiche alors la célébration du premier rang.
            $activationReached = false;
            if ($projectId && in_array($eventName, ['first_row_counted', 'project_worked_again'], true)) {
                $activationReached = AnalyticsService::logActivationIfFirst($userId, $projectId);
            }

            $this->sendResponse(200, $activationReached
                ? ['success' => true, 'activation_reached' => true]
                : ['success' => true]);
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
