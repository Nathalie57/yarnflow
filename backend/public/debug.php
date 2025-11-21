<?php
// Script de debug pour voir ce que reçoit le serveur
header('Content-Type: application/json');

echo json_encode([
    'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
    'REQUEST_URI' => $_SERVER['REQUEST_URI'],
    'SCRIPT_NAME' => $_SERVER['SCRIPT_NAME'],
    'PATH_INFO' => $_SERVER['PATH_INFO'] ?? 'N/A',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? 'N/A',
    'HTTP_HOST' => $_SERVER['HTTP_HOST'],
    'ALL_SERVER' => $_SERVER
], JSON_PRETTY_PRINT);
