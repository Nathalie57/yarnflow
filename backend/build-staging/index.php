<?php
/**
 * @file index.php
 * @brief Point d'entrée de l'API
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

require_once __DIR__.'/../config/bootstrap.php';
require_once __DIR__.'/../routes/api.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uri = parse_url($uri, PHP_URL_PATH);

// [AI:Claude] Debug - afficher TOUJOURS ce qui arrive
error_log("========== REQUEST DEBUG ==========");
error_log("Method: " . $method);
error_log("URI: " . $uri);
error_log("Full REQUEST_URI: " . $_SERVER['REQUEST_URI']);
error_log("===================================");

route($method, $uri);
