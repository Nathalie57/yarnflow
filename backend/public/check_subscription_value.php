<?php
require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';
use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');
echo "<style>body{font-family:monospace;padding:20px;} .error{color:red;} .ok{color:green;}</style>";

$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT id, email, subscription_type FROM users WHERE id = 8");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo "<h2>Valeur EXACTE de subscription_type</h2>";
echo "<p>User ID: {$user['id']}</p>";
echo "<p>Email: {$user['email']}</p>";
echo "<p>subscription_type = '<strong style='background:yellow;'>{$user['subscription_type']}</strong>'</p>";
echo "<p>Longueur: " . strlen($user['subscription_type']) . " caractères</p>";
echo "<p>Bytes: " . bin2hex($user['subscription_type']) . "</p>";

echo "<hr>";
echo "<h2>Tests de correspondance</h2>";
echo "<p>" . ($user['subscription_type'] === 'plus' ? "✅" : "❌") . " subscription_type === 'plus'</p>";
echo "<p>" . ($user['subscription_type'] === 'subscription_plus' ? "✅" : "❌") . " subscription_type === 'subscription_plus'</p>";
echo "<p>" . (strpos($user['subscription_type'], 'plus') !== false ? "✅" : "❌") . " contient 'plus'</p>";

if ($user['subscription_type'] !== 'plus') {
    echo "<hr>";
    echo "<h2 class='error'>❌ Problème détecté !</h2>";
    echo "<p>La valeur devrait être '<strong>plus</strong>' mais elle est '<strong>{$user['subscription_type']}</strong>'</p>";
    echo "<p><a href='?fix=1' style='background:#6366f1;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>Corriger → plus</a></p>";
}

if (isset($_GET['fix'])) {
    $db->prepare("UPDATE users SET subscription_type = 'plus' WHERE id = 8")->execute();
    echo "<p class='ok'>✅ Corrigé ! Rechargez YarnFlow.</p>";
}
?>
