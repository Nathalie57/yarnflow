<?php
/**
 * @file PasswordResetController.php
 * @brief Contrôleur pour la réinitialisation de mot de passe
 * @author Claude AI Assistant
 * @created 2025-12-07
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Services\PasswordResetService;
use App\Utils\Response;

class PasswordResetController
{
    private PasswordResetService $resetService;

    public function __construct()
    {
        $this->resetService = new PasswordResetService();
    }

    /**
     * POST /api/auth/forgot-password
     * Demander une réinitialisation de mot de passe
     */
    public function requestReset(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['email'])) {
                Response::error('Email requis', HTTP_BAD_REQUEST);
                return;
            }

            $result = $this->resetService->requestPasswordReset($data['email']);

            if ($result['success']) {
                Response::success($result);
            } else {
                Response::error($result['error'] ?? 'Erreur lors de la demande', HTTP_SERVER_ERROR);
            }

        } catch (\Exception $e) {
            error_log('[PASSWORD RESET] Erreur requestReset: ' . $e->getMessage());
            Response::error('Erreur serveur', HTTP_SERVER_ERROR);
        }
    }

    /**
     * POST /api/auth/verify-reset-token
     * Vérifier qu'un token de reset est valide
     */
    public function verifyToken(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['token'])) {
                http_response_code(400);
                header('Content-Type: application/json');
                echo json_encode(['valid' => false, 'error' => 'Token requis']);
                exit;
            }

            // Nettoyer le token (enlever espaces, retours à la ligne)
            $token = preg_replace('/\s+/', '', $data['token']);

            $result = $this->resetService->verifyToken($token);

            // Retourner le résultat (valid, email, etc.)
            http_response_code(200);
            header('Content-Type: application/json');
            echo json_encode($result);
            exit;

        } catch (\Exception $e) {
            error_log('[PASSWORD RESET] Erreur verifyToken: ' . $e->getMessage());
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['valid' => false, 'error' => 'Erreur serveur']);
            exit;
        }
    }

    /**
     * POST /api/auth/reset-password
     * Réinitialiser le mot de passe avec un token
     */
    public function resetPassword(): void
    {
        try {
            $data = json_decode(file_get_contents('php://input'), true) ?? [];

            if (!isset($data['token']) || !isset($data['password'])) {
                Response::error('Token et mot de passe requis', HTTP_BAD_REQUEST);
                return;
            }

            // Nettoyer le token (enlever espaces, retours à la ligne)
            $token = preg_replace('/\s+/', '', $data['token']);

            $result = $this->resetService->resetPassword($token, $data['password']);

            if ($result['success']) {
                Response::success($result);
            } else {
                Response::error($result['error'] ?? 'Erreur lors de la réinitialisation', HTTP_BAD_REQUEST);
            }

        } catch (\Exception $e) {
            error_log('[PASSWORD RESET] Erreur resetPassword: ' . $e->getMessage());
            Response::error('Erreur serveur', HTTP_SERVER_ERROR);
        }
    }
}
