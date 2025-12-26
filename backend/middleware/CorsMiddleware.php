<?php
/**
 * @file CorsMiddleware.php
 * @brief Middleware CORS pour autoriser les requêtes du frontend
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Middleware;

/**
 * [AI:Claude] Middleware pour gérer les CORS (Cross-Origin Resource Sharing)
 */
class CorsMiddleware
{
    /**
     * [AI:Claude] Configurer les headers CORS
     * SÉCURITÉ: Les origines sont strictement contrôlées même en développement
     */
    public static function handle(): void
    {
        // Récupérer l'origine de la requête
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        $isDev = ($_ENV['APP_ENV'] ?? 'production') === 'development';

        // [AI:Claude] SÉCURITÉ: Whitelist stricte d'origines autorisées
        if ($isDev) {
            // Mode développement : origines de développement autorisées
            $allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://localhost:8080',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5173',
                'http://127.0.0.1:8080',
                $_ENV['FRONTEND_URL'] ?? ''
            ];
        } else {
            // Mode production : restreindre aux domaines autorisés
            $allowedOrigins = [
                $_ENV['FRONTEND_URL'] ?? 'https://yarnflow.fr',
                'https://yarnflow.fr',
                'https://www.yarnflow.fr',
                'https://staging.yarnflow.fr'
            ];
        }

        // [AI:Claude] SÉCURITÉ: Valider l'origine avant de l'accepter
        // CRITIQUE: Ne JAMAIS utiliser Access-Control-Allow-Origin: * avec Access-Control-Allow-Credentials: true
        if (!empty($origin) && in_array($origin, $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            // [AI:Claude] Si l'origine n'est pas autorisée, ne pas set le header
            // Cela empêchera le navigateur d'envoyer les credentials
            error_log("[CORS] Origin non autorisée: $origin");
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        // Gérer la requête OPTIONS (preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204); // No Content
            exit;
        }
    }
}
