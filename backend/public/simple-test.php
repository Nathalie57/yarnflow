<?php
header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'PHP fonctionne !',
    'method' => $_SERVER['REQUEST_METHOD'],
    'uri' => $_SERVER['REQUEST_URI']
]);
