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
     */
    public static function handle(): void
    {
        // Récupérer l'origine de la requête
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

        $isDev = ($_ENV['APP_ENV'] ?? 'production') === 'development';

        // En développement, accepter TOUTES les origines
        // En production, n'accepter que le frontend configuré
        if ($isDev) {
            // Mode développement : accepter n'importe quelle origine
            header('Access-Control-Allow-Origin: ' . $origin);
        } else {
            // Mode production : restreindre aux domaines autorisés
            $allowedOrigins = [
                $_ENV['FRONTEND_URL'] ?? 'https://yarnflow.fr',
                'https://yarnflow.fr',
                'https://www.yarnflow.fr'
            ];

            if (in_array($origin, $allowedOrigins)) {
                header('Access-Control-Allow-Origin: ' . $origin);
            }
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
