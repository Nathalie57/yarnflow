<?php
/**
 * Générer un token expiré VALIDE pour tester le refresh
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/JWTService.php';

use App\Config\Database;
use Firebase\JWT\JWT;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = Database::getInstance()->getConnection();

// Récupérer user 8
$stmt = $db->prepare("SELECT * FROM users WHERE id = 8");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

// Créer un token expiré il y a 1 heure (mais avec signature valide)
$secret = $_ENV['JWT_SECRET'];
$issuedAt = time() - 7200; // Il y a 2h
$expirationTime = $issuedAt + 3600; // Expiré depuis 1h

$payload = [
    'iat' => $issuedAt,
    'exp' => $expirationTime,
    'data' => [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'subscription_type' => $user['subscription_type'],
        'subscription_expires_at' => $user['subscription_expires_at'] ?? null
    ]
];

$expiredToken = JWT::encode($payload, $secret, 'HS256');

echo json_encode([
    'success' => true,
    'expired_token' => $expiredToken,
    'expires_at' => date('Y-m-d H:i:s', $expirationTime),
    'expired_since' => '1 heure'
]);
?>
