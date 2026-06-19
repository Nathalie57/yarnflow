<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\PushService;
use App\Middleware\AuthMiddleware;

class PushController
{
    private PushService $pushService;
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->pushService    = new PushService();
        $this->authMiddleware = new AuthMiddleware();
    }

    /**
     * GET /api/push/vapid-public-key
     * Retourne la clé publique VAPID (pas besoin d'être authentifié)
     */
    public function getVapidPublicKey(): void
    {
        $this->jsonResponse([
            'success'    => true,
            'public_key' => $_ENV['VAPID_PUBLIC_KEY'] ?? '',
        ]);
    }

    /**
     * POST /api/push/subscribe
     * Enregistre la subscription push de l'utilisateur connecté
     */
    public function subscribe(): void
    {
        $userId = $this->getUserIdFromAuth();
        $data   = json_decode(file_get_contents('php://input'), true);

        if (empty($data['endpoint']) || empty($data['keys']['p256dh']) || empty($data['keys']['auth'])) {
            $this->jsonResponse(['success' => false, 'error' => 'Subscription invalide'], 400);
            return;
        }

        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        $ok = $this->pushService->saveSubscription($userId, $data, $userAgent);

        $this->jsonResponse(['success' => $ok]);
    }

    /**
     * DELETE /api/push/subscribe
     * Supprime la subscription push de l'utilisateur
     */
    public function unsubscribe(): void
    {
        $userId = $this->getUserIdFromAuth();
        $data   = json_decode(file_get_contents('php://input'), true);

        if (empty($data['endpoint'])) {
            $this->jsonResponse(['success' => false, 'error' => 'Endpoint manquant'], 400);
            return;
        }

        $ok = $this->pushService->deleteSubscription($userId, $data['endpoint']);
        $this->jsonResponse(['success' => $ok]);
    }

    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();
        if (!$userData) {
            $this->jsonResponse(['success' => false, 'error' => 'Non authentifié'], 401);
            exit;
        }
        return (int)$userData['user_id'];
    }

    private function jsonResponse(array $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
