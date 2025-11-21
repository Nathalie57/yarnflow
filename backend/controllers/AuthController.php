<?php
/**
 * @file AuthController.php
 * @brief Contrôleur pour l'authentification (login, register, etc.)
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Services\JWTService;
use App\Utils\Response;
use App\Utils\Validator;

/**
 * [AI:Claude] Contrôleur d'authentification
 */
class AuthController
{
    private User $userModel;
    private JWTService $jwtService;

    public function __construct()
    {
        $this->userModel = new User();
        $this->jwtService = new JWTService();
    }

    /**
     * [AI:Claude] Inscription d'un nouvel utilisateur
     * POST /api/auth/register
     */
    public function register(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['email'] ?? null, 'email')
            ->email($data['email'] ?? null, 'email')
            ->required($data['password'] ?? null, 'password')
            ->minLength($data['password'] ?? null, 6, 'password');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        if ($this->userModel->emailExists($data['email']))
            Response::error('Cet email est déjà utilisé', HTTP_UNPROCESSABLE);

        try {
            $userId = $this->userModel->createUser(
                $data['email'],
                $data['password'],
                $data['first_name'] ?? null,
                $data['last_name'] ?? null
            );

            $user = $this->userModel->findById($userId);
            $token = $this->jwtService->generateToken($user);

            unset($user['password']);

            Response::created([
                'user' => $user,
                'token' => $token
            ], 'Inscription réussie');

        } catch (\Exception $e) {
            error_log('[AuthController] Erreur inscription : '.$e->getMessage());
            Response::serverError('Erreur lors de l\'inscription');
        }
    }

    /**
     * [AI:Claude] Connexion d'un utilisateur
     * POST /api/auth/login
     */
    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['email'] ?? null, 'email')
            ->email($data['email'] ?? null, 'email')
            ->required($data['password'] ?? null, 'password');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->verifyPassword($data['email'], $data['password']);

        if ($user === null)
            Response::error('Email ou mot de passe incorrect', HTTP_UNAUTHORIZED);

        $token = $this->jwtService->generateToken($user);

        unset($user['password']);

        Response::success([
            'user' => $user,
            'token' => $token
        ], HTTP_OK, 'Connexion réussie');
    }

    /**
     * [AI:Claude] Obtenir le profil de l'utilisateur connecté
     * GET /api/auth/me
     */
    public function me(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        unset($user['password']);

        $remainingPatterns = $this->userModel->getRemainingPatterns($user['id']);
        $hasActiveSubscription = $this->userModel->hasActiveSubscription($user['id']);

        Response::success([
            'user' => $user,
            'subscription' => [
                'type' => $user['subscription_type'],
                'is_active' => $hasActiveSubscription,
                'expires_at' => $user['subscription_expires_at'],
                'patterns_remaining' => $remainingPatterns
            ]
        ]);
    }

    /**
     * [AI:Claude] Rafraîchir le token JWT
     * POST /api/auth/refresh
     */
    public function refresh(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        $newToken = $this->jwtService->generateToken($user);

        Response::success([
            'token' => $newToken
        ], HTTP_OK, 'Token rafraîchi');
    }
}
