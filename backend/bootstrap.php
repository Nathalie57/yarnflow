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

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

date_default_timezone_set('Europe/Paris');

error_reporting(E_ALL);
ini_set('display_errors', $_ENV['APP_DEBUG'] === 'true' ? '1' : '0');

header('Content-Type: application/json; charset=utf-8');

use App\Middleware\CorsMiddleware;
CorsMiddleware::handle();

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    error_log("[Error] {$errstr} in {$errfile} on line {$errline}");
    if ($_ENV['APP_DEBUG'] === 'true') {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Erreur serveur',
            'debug' => [
                'error' => $errstr,
                'file' => $errfile,
                'line' => $errline
            ]
        ]);
        exit;
    }
});

set_exception_handler(function ($exception) {
    error_log("[Exception] ".$exception->getMessage());
    http_response_code(500);

    $response = [
        'success' => false,
        'message' => 'Erreur serveur'
    ];

    if ($_ENV['APP_DEBUG'] === 'true') {
        $response['debug'] = [
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];
    }

    echo json_encode($response);
    exit;
});
