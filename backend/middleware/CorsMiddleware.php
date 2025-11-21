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
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:5173';

        header('Access-Control-Allow-Origin: '.$frontendUrl);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }
}
