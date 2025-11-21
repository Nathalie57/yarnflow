<?php
/**
 * @file health.php
 * @brief Health check endpoint (no dependencies)
 * @created 2025-11-21
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

http_response_code(200);

echo json_encode([
    'success' => true,
    'message' => 'API is running',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
