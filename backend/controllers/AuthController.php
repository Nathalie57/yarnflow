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
use App\Services\OAuthService;
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
     *
     * Paramètres optionnels :
     * - early_bird_code : Code d'accès prioritaire Early Bird (72h d'accès exclusif)
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

        // [AI:Claude] Vérifier le code Beta si fourni (prioritaire sur Early Bird)
        $betaAccess = null;
        $earlyBirdAccess = null;

        if (!empty($data['beta_code'])) {
            try {
                $db = \App\Config\Database::getInstance()->getConnection();
                $betaCodeService = new \App\Services\BetaCodeService($db);
                $codeValidation = $betaCodeService->validateCode($data['beta_code']);

                if (!$codeValidation['valid']) {
                    Response::error($codeValidation['message'], HTTP_UNPROCESSABLE);
                }

                // Vérifier que le code correspond bien à l'email
                if ($codeValidation['email'] !== $data['email']) {
                    Response::error('Ce code beta est réservé à une autre adresse email', HTTP_FORBIDDEN);
                }

                $betaAccess = $codeValidation;
            } catch (\Exception $e) {
                error_log('[AuthController] Erreur validation code beta : ' . $e->getMessage());
                Response::error('Impossible de valider le code beta. Veuillez réessayer.', HTTP_SERVER_ERROR);
            }
        }
        // [AI:Claude] Sinon vérifier le code Early Bird si fourni
        elseif (!empty($data['early_bird_code'])) {
            $earlyBirdService = new \Services\EarlyBirdCodeService($this->userModel->getDb());
            $codeValidation = $earlyBirdService->validateCode($data['early_bird_code']);

            if (!$codeValidation['valid']) {
                Response::error($codeValidation['message'], HTTP_UNPROCESSABLE);
            }

            // Vérifier que le code correspond bien à l'email
            if ($codeValidation['email'] !== $data['email']) {
                Response::error('Ce code est réservé à une autre adresse email', HTTP_FORBIDDEN);
            }

            $earlyBirdAccess = $codeValidation;
        }

        try {
            $userId = $this->userModel->createUser(
                $data['email'],
                $data['password'],
                $data['first_name'] ?? null,
                $data['last_name'] ?? null
            );

            // [AI:Claude] Si code Beta valide, appliquer les bénéfices
            if ($betaAccess) {
                try {
                    $betaCodeService->markCodeAsUsed($data['beta_code'], $userId);
                    $betaCodeService->applyBetaBenefits($userId, $betaAccess['beta_type']);
                } catch (\Exception $e) {
                    error_log('[AuthController] Erreur application bénéfices beta : ' . $e->getMessage());
                    // Compte créé mais bénéfices non appliqués - on continue quand même
                }
            }
            // [AI:Claude] Sinon si code Early Bird valide, marquer comme utilisé
            elseif ($earlyBirdAccess) {
                try {
                    $earlyBirdService->markCodeAsUsed($data['early_bird_code'], $userId);

                    // Mettre à jour l'utilisateur avec l'éligibilité Early Bird
                    $this->userModel->update($userId, [
                        'early_bird_eligible_until' => $earlyBirdAccess['expires_at']
                    ]);
                } catch (\Exception $e) {
                    error_log('[AuthController] Erreur application code Early Bird : ' . $e->getMessage());
                    // Compte créé mais code Early Bird non appliqué - on continue quand même
                }
            }

            $user = $this->userModel->findById($userId);
            $token = $this->jwtService->generateToken($user);

            unset($user['password']);

            $responseData = [
                'user' => $user,
                'token' => $token
            ];

            // [AI:Claude] Ajouter infos Early Bird si applicable
            if ($earlyBirdAccess) {
                $responseData['early_bird_access'] = [
                    'eligible' => true,
                    'expires_at' => $earlyBirdAccess['expires_at'],
                    'hours_remaining' => $earlyBirdAccess['hours_remaining']
                ];
            }

            // [AI:Claude] Message personnalisé selon le type d'accès
            if ($betaAccess) {
                $message = $betaAccess['beta_type'] === 'pro'
                    ? 'Inscription réussie ! Votre accès PRO beta est activé pour 1 mois 🎉'
                    : 'Inscription réussie ! Bienvenue dans la beta YarnFlow 🧶';
            } elseif ($earlyBirdAccess) {
                $message = 'Inscription réussie ! Vous avez ' . $earlyBirdAccess['hours_remaining'] . 'h pour profiter de l\'offre Early Bird.';
            } else {
                $message = 'Inscription réussie';
            }

            Response::created($responseData, $message);

        } catch (\PDOException $e) {
            error_log('[AuthController] Erreur base de données inscription : ' . $e->getMessage());
            Response::error('Une erreur est survenue avec la base de données. Veuillez réessayer.', HTTP_SERVER_ERROR);
        } catch (\Exception $e) {
            error_log('[AuthController] Erreur inscription : ' . $e->getMessage());
            Response::error('Une erreur est survenue lors de l\'inscription. Veuillez réessayer ou contacter le support.', HTTP_SERVER_ERROR);
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

        // [AI:Claude] Enregistrer la date/heure de connexion
        $this->userModel->updateLastLogin($user['id']);

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
        // [AI:Claude] Récupérer le token depuis le header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $token = $this->jwtService->extractTokenFromHeader($authHeader);

        if ($token === null) {
            Response::error('Token manquant', HTTP_UNAUTHORIZED);
            return;
        }

        // [AI:Claude] Décoder le token SANS validation d'expiration pour permettre le refresh
        try {
            $decoded = \Firebase\JWT\JWT::decode(
                $token,
                new \Firebase\JWT\Key($_ENV['JWT_SECRET'], 'HS256')
            );

            $userData = (array)$decoded->data;

            // [AI:Claude] Vérifier que le token n'est pas trop vieux (max 7 jours après expiration)
            $expirationTime = $decoded->exp;
            $gracePeriod = 7 * 24 * 60 * 60; // 7 jours en secondes
            $maxRefreshTime = $expirationTime + $gracePeriod;

            if (time() > $maxRefreshTime) {
                Response::error('Token trop ancien pour être rafraîchi', HTTP_UNAUTHORIZED);
                return;
            }

            // [AI:Claude] Récupérer les données utilisateur à jour depuis la base
            $user = $this->userModel->findById($userData['user_id']);

            if ($user === null) {
                Response::notFound('Utilisateur introuvable');
                return;
            }

            // [AI:Claude] Générer un nouveau token avec les données à jour
            $newToken = $this->jwtService->generateToken($user);

            Response::success([
                'token' => $newToken
            ], HTTP_OK, 'Token rafraîchi');

        } catch (\Firebase\JWT\ExpiredException $e) {
            // [AI:Claude] Token expiré mais on continue pour vérifier la grace period
            // Décoder sans validation pour récupérer les données
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                Response::error('Format de token invalide', HTTP_UNAUTHORIZED);
                return;
            }

            $payload = json_decode(base64_decode($parts[1]), true);

            // Vérifier grace period
            $expirationTime = $payload['exp'] ?? 0;
            $gracePeriod = 7 * 24 * 60 * 60;
            $maxRefreshTime = $expirationTime + $gracePeriod;

            if (time() > $maxRefreshTime) {
                Response::error('Token trop ancien pour être rafraîchi', HTTP_UNAUTHORIZED);
                return;
            }

            // Token expiré mais dans la grace period, on peut refresh
            $user = $this->userModel->findById($payload['data']['user_id']);

            if ($user === null) {
                Response::notFound('Utilisateur introuvable');
                return;
            }

            $newToken = $this->jwtService->generateToken($user);

            Response::success([
                'token' => $newToken
            ], HTTP_OK, 'Token rafraîchi');

        } catch (\Exception $e) {
            error_log('[AUTH] Erreur refresh token : ' . $e->getMessage());
            Response::error('Token invalide', HTTP_UNAUTHORIZED);
        }
    }

    /**
     * [AI:Claude] Callback OAuth Google
     * GET /api/auth/google/callback?code=xxx
     */
    public function googleCallback(): void
    {
        $code = $_GET['code'] ?? null;

        if (!$code) {
            Response::error('Code d\'autorisation manquant', HTTP_BAD_REQUEST);
        }

        $oauthService = new OAuthService();
        $oauthData = $oauthService->handleGoogleCallback($code);

        if (!$oauthData) {
            Response::error('Erreur lors de l\'authentification Google', HTTP_UNAUTHORIZED);
        }

        if (!$oauthData['email']) {
            Response::error('Email non fourni par Google. Veuillez autoriser l\'accès à votre email.', HTTP_BAD_REQUEST);
        }

        try {
            // [AI:Claude] Créer ou récupérer l'utilisateur OAuth
            $user = $this->userModel->findOrCreateOAuthUser(
                $oauthData['provider'],
                $oauthData['provider_id'],
                $oauthData['email'],
                $oauthData['first_name'],
                $oauthData['last_name'],
                $oauthData['avatar']
            );

            // [AI:Claude] Enregistrer la date/heure de connexion
            $this->userModel->updateLastLogin($user['id']);

            $token = $this->jwtService->generateToken($user);

            unset($user['password']);

            Response::success([
                'user' => $user,
                'token' => $token
            ], HTTP_OK, 'Connexion Google réussie');

        } catch (\Exception $e) {
            error_log('[AuthController] Erreur Google OAuth : ' . $e->getMessage());
            Response::serverError('Erreur lors de l\'authentification');
        }
    }

    /**
     * [AI:Claude] Callback OAuth Facebook
     * GET /api/auth/facebook/callback?code=xxx
     */
    public function facebookCallback(): void
    {
        $code = $_GET['code'] ?? null;

        if (!$code) {
            Response::error('Code d\'autorisation manquant', HTTP_BAD_REQUEST);
        }

        $oauthService = new OAuthService();
        $oauthData = $oauthService->handleFacebookCallback($code);

        if (!$oauthData) {
            Response::error('Erreur lors de l\'authentification Facebook', HTTP_UNAUTHORIZED);
        }

        if (!$oauthData['email']) {
            Response::error('Email non fourni par Facebook. Veuillez autoriser l\'accès à votre email.', HTTP_BAD_REQUEST);
        }

        try {
            // [AI:Claude] Créer ou récupérer l'utilisateur OAuth
            $user = $this->userModel->findOrCreateOAuthUser(
                $oauthData['provider'],
                $oauthData['provider_id'],
                $oauthData['email'],
                $oauthData['first_name'],
                $oauthData['last_name'],
                $oauthData['avatar']
            );

            // [AI:Claude] Enregistrer la date/heure de connexion
            $this->userModel->updateLastLogin($user['id']);

            $token = $this->jwtService->generateToken($user);

            unset($user['password']);

            Response::success([
                'user' => $user,
                'token' => $token
            ], HTTP_OK, 'Connexion Facebook réussie');

        } catch (\Exception $e) {
            error_log('[AuthController] Erreur Facebook OAuth : ' . $e->getMessage());
            Response::serverError('Erreur lors de l\'authentification');
        }
    }

    /**
     * [AI:Claude] Obtenir l'URL d'autorisation Google
     * GET /api/auth/google/url
     */
    public function googleAuthUrl(): void
    {
        $oauthService = new OAuthService();
        $url = $oauthService->getGoogleAuthUrl();

        Response::success([
            'auth_url' => $url
        ]);
    }

    /**
     * [AI:Claude] Obtenir l'URL d'autorisation Facebook
     * GET /api/auth/facebook/url
     */
    public function facebookAuthUrl(): void
    {
        $oauthService = new OAuthService();
        $url = $oauthService->getFacebookAuthUrl();

        Response::success([
            'auth_url' => $url
        ]);
    }
}
