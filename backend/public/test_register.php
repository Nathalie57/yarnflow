<?php
// Test simplifié de l'inscription pour debug

require_once __DIR__ . '/../config/bootstrap.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // 1. Vérifier la connexion DB
    $db = \App\Config\Database::getInstance()->getConnection();
    
    // 2. Lire les données POST
    $data = json_decode(file_get_contents('php://input'), true);
    
    // 3. Log de debug
    error_log('[TEST_REGISTER] Données reçues: ' . json_encode($data));
    
    // 4. Test création user
    $userModel = new \App\Models\User();
    
    $userId = $userModel->createUser(
        $data['email'],
        $data['password'],
        $data['first_name'] ?? null,
        $data['last_name'] ?? null
    );
    
    // 5. Récupérer l'user créé
    $user = $userModel->findById($userId);
    
    // 6. Générer le token
    $jwtService = new \App\Services\JWTService();
    $token = $jwtService->generateToken($user);
    
    unset($user['password']);
    
    // 7. Renvoyer la réponse
    echo json_encode([
        'success' => true,
        'status' => 201,
        'message' => 'Test inscription OK',
        'data' => [
            'user' => $user,
            'token' => $token
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
