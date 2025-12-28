<?php
/**
 * @file AuthMiddleware.php
 * @brief Middleware d'authentification JWT
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Services\JWTService;
use App\Utils\Response;
use App\Models\User;

/**
 * [AI:Claude] Middleware pour protéger les routes avec JWT
 */
class AuthMiddleware
{
    private JWTService $jwtService;
    private User $userModel;

    public function __construct()
    {
        $this->jwtService = new JWTService();
        $this->userModel = new User();
    }

    /**
     * [AI:Claude] Vérifier l'authentification de l'utilisateur
     *
     * @return array|null Données utilisateur ou null si non authentifié
     */
    public function authenticate(): ?array
    {
        // [AI:Claude] Récupérer le header Authorization de différentes manières possibles
        $authHeader = null;

        // Méthode 1 : $_SERVER['HTTP_AUTHORIZATION']
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }
        // Méthode 2 : getallheaders()
        elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }
        // Méthode 3 : apache_request_headers()
        elseif (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        if ($authHeader === null) {
            Response::error('Token manquant', HTTP_UNAUTHORIZED);
            return null;
        }

        $token = $this->jwtService->extractTokenFromHeader($authHeader);

        if ($token === null) {
            Response::error('Format de token invalide', HTTP_UNAUTHORIZED);
            return null;
        }

        $userData = $this->jwtService->validateToken($token);

        if ($userData === null) {
            Response::error('Token invalide ou expiré', HTTP_UNAUTHORIZED);
            return null;
        }

        // [AI:Claude] Mettre à jour last_seen_at à chaque requête authentifiée
        // Permet de tracker l'activité réelle (pas seulement les connexions)
        if (isset($userData['user_id'])) {
            $this->userModel->updateLastSeen($userData['user_id']);
        }

        return $userData;
    }

    /**
     * [AI:Claude] Vérifier que l'utilisateur est admin
     *
     * @param array $userData Données utilisateur du token
     * @return bool True si admin
     */
    public function requireAdmin(array $userData): bool
    {
        if ($userData['role'] !== ROLE_ADMIN) {
            Response::error('Accès réservé aux administrateurs', HTTP_FORBIDDEN);
            return false;
        }

        return true;
    }

    /**
     * [AI:Claude] Vérifier que l'utilisateur a un abonnement actif
     *
     * @param array $userData Données utilisateur du token
     * @return bool True si abonnement actif
     */
    public function requireActiveSubscription(array $userData): bool
    {
        // [AI:Claude] Vérifier si l'utilisateur est en FREE
        if ($userData['subscription_type'] === SUBSCRIPTION_FREE) {
            Response::error('Abonnement PRO requis pour accéder à cette fonctionnalité', HTTP_FORBIDDEN);
            return false;
        }

        // [AI:Claude] Vérifier la date d'expiration si elle existe
        if (isset($userData['subscription_expires_at']) && $userData['subscription_expires_at'] !== null) {
            $expiresAt = strtotime($userData['subscription_expires_at']);

            if ($expiresAt <= time()) {
                Response::error('Votre abonnement a expiré. Veuillez renouveler pour continuer', HTTP_FORBIDDEN);
                return false;
            }
        }

        return true;
    }
}
