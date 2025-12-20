<?php
/**
 * Debug : Tester la création d'une session d'abonnement PLUS
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Debug Abonnement PLUS</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;} .error{color:red;} .warning{color:orange;} pre{background:white;padding:15px;border-radius:5px;overflow:auto;}</style>";

$db = Database::getInstance()->getConnection();

// Vérifier user 8
echo "<h2>👤 Utilisateur 8</h2>";
$stmt = $db->prepare("SELECT id, email, subscription_type, stripe_customer_id FROM users WHERE id = 8");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "<p>Email : <strong>{$user['email']}</strong></p>";
    echo "<p>Plan actuel : <strong>{$user['subscription_type']}</strong></p>";
    echo "<p>Stripe Customer ID : <strong>" . ($user['stripe_customer_id'] ?? 'NULL') . "</strong></p>";
} else {
    echo "<p class='error'>❌ Utilisateur 8 introuvable</p>";
    exit;
}

// Vérifier les variables d'environnement Stripe
echo "<h2>🔑 Configuration Stripe</h2>";
echo "<p>STRIPE_SECRET_KEY : <code>" . substr($_ENV['STRIPE_SECRET_KEY'] ?? '', 0, 20) . "...</code></p>";
echo "<p>Mode : <strong>" . (strpos($_ENV['STRIPE_SECRET_KEY'] ?? '', 'test') !== false ? 'TEST' : 'PRODUCTION') . "</strong></p>";

echo "<p>STRIPE_PRICE_ID_PLUS_MONTHLY : <code>" . ($_ENV['STRIPE_PRICE_ID_PLUS_MONTHLY'] ?? 'NOT SET') . "</code></p>";
echo "<p>STRIPE_PRICE_ID_PLUS_ANNUAL : <code>" . ($_ENV['STRIPE_PRICE_ID_PLUS_ANNUAL'] ?? 'NOT SET') . "</code></p>";

// Simuler la requête
echo "<h2>📝 Simulation de la requête</h2>";

$requestData = [
    'type' => 'plus'
];

echo "<p>Données envoyées :</p>";
echo "<pre>" . json_encode($requestData, JSON_PRETTY_PRINT) . "</pre>";

// Vérifier la validation
echo "<h2>✅ Validation</h2>";

$validTypes = ['plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird'];
$type = $requestData['type'];

if (in_array($type, $validTypes)) {
    echo "<p class='ok'>✅ Type '$type' est valide</p>";
} else {
    echo "<p class='error'>❌ Type '$type' n'est pas dans la liste autorisée</p>";
    echo "<p>Types autorisés : " . implode(', ', $validTypes) . "</p>";
}

// Vérifier si le StripeService peut créer la session
echo "<h2>🔧 Test création session Stripe</h2>";

try {
    require_once __DIR__ . '/../services/StripeService.php';

    $stripeService = new App\Services\StripeService();

    echo "<p class='warning'>➡️ Tentative de création d'une session PLUS mensuelle...</p>";

    $result = $stripeService->createPlusMonthlySession(8, $user['email']);

    if ($result['success']) {
        echo "<p class='ok'>✅ Session créée avec succès !</p>";
        echo "<p>Session ID : <code>{$result['session_id']}</code></p>";
        echo "<p>Checkout URL : <a href='{$result['checkout_url']}' target='_blank'>Ouvrir</a></p>";
    } else {
        echo "<p class='error'>❌ Échec de création : " . ($result['error'] ?? 'Erreur inconnue') . "</p>";
    }

} catch (Exception $e) {
    echo "<p class='error'>❌ Exception : " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

// Vérifier les derniers logs d'erreur PHP
echo "<h2>📋 Derniers logs d'erreur</h2>";
$logFile = 'D:/wamp64/logs/php_error.log';
if (file_exists($logFile)) {
    $logs = file($logFile);
    $recentLogs = array_slice($logs, -20);
    echo "<pre style='max-height:300px;overflow:auto;'>";
    foreach ($recentLogs as $log) {
        if (stripos($log, 'stripe') !== false || stripos($log, 'payment') !== false || stripos($log, 'subscription') !== false) {
            echo htmlspecialchars($log);
        }
    }
    echo "</pre>";
} else {
    echo "<p class='warning'>⚠️ Fichier de log PHP introuvable</p>";
}
?>
