<?php
/**
 * @file bootstrap.php
 * @brief Fichier de démarrage de l'application
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

require_once __DIR__.'/../vendor/autoload.php';

require_once __DIR__.'/constants.php';

use Dotenv\Dotenv;

// [AI:Claude] Charger .env seulement s'il existe (local dev)
// Sur Railway/production, les variables sont déjà injectées
// Le .env est à la racine du backend (un niveau au-dessus de config/)
$envPath = __DIR__.'/../';
if (file_exists($envPath.'.env')) {
    $dotenv = Dotenv::createImmutable($envPath);
    $dotenv->load();
}

date_default_timezone_set('Europe/Paris');

error_reporting(E_ALL);
ini_set('display_errors', $_ENV['APP_DEBUG'] === 'true' ? '1' : '0');

header('Content-Type: application/json; charset=utf-8');

// [AI:Claude] SÉCURITÉ: Appliquer les middlewares de sécurité
use App\Middleware\CorsMiddleware;
use App\Middleware\SecurityHeadersMiddleware;

SecurityHeadersMiddleware::handle();
SecurityHeadersMiddleware::hideServerInfo();
CorsMiddleware::handle();

// [AI:Claude] SÉCURITÉ: Error handler qui ne révèle pas d'informations sensibles
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    // [AI:Claude] Toujours logger l'erreur complète côté serveur
    error_log("[Error] {$errstr} in {$errfile} on line {$errline}");

    // [AI:Claude] SÉCURITÉ: En production, ne jamais révéler les chemins de fichiers ou détails techniques
    $isDebug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';

    if ($isDebug) {
        // [AI:Claude] Mode debug: montrer les détails (dev uniquement)
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur serveur',
            'debug' => [
                'error' => $errstr,
                'file' => basename($errfile),  // Seulement le nom du fichier, pas le chemin complet
                'line' => $errline
            ]
        ]);
        exit;
    } else {
        // [AI:Claude] Mode production: message générique uniquement
        // Ne rien afficher ici, laisser l'application continuer
        return false;  // Laisser le error handler par défaut gérer si nécessaire
    }
});

set_exception_handler(function ($exception) {
    // [AI:Claude] Logger l'exception complète avec stack trace
    error_log("[Exception] " . $exception->getMessage());
    error_log("[Exception Stack] " . $exception->getTraceAsString());

    http_response_code(500);

    $isDebug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';

    $response = [
        'success' => false,
        'message' => 'Une erreur est survenue. Veuillez réessayer ultérieurement.'
    ];

    // [AI:Claude] SÉCURITÉ: Ne montrer les détails qu'en mode debug
    if ($isDebug) {
        $response['debug'] = [
            'message' => $exception->getMessage(),
            'file' => basename($exception->getFile()),  // Seulement le nom du fichier
            'line' => $exception->getLine(),
            'trace' => explode("\n", $exception->getTraceAsString())  // Format tableau pour meilleure lisibilité
        ];
        $response['warning'] = 'DEBUG MODE: Ces informations ne doivent pas être visibles en production';
    }

    echo json_encode($response);
    exit;
});
