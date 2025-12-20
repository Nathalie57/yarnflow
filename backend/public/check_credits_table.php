<?php
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

// Charger les variables d'environnement
$envFile = __DIR__ . '/../config/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

$database = Database::getInstance();
$db = $database->getConnection();

echo "<pre>";
echo "Structure de la table user_photo_credits:\n\n";

$result = $db->query('SHOW COLUMNS FROM user_photo_credits');
$columns = [];
while ($col = $result->fetch(PDO::FETCH_ASSOC)) {
    echo sprintf("%-30s %-20s %-10s\n", $col['Field'], $col['Type'], $col['Null']);
    $columns[] = $col['Field'];
}

echo "\n---\n";
echo "Colonnes attendues par le code:\n";
$expected = [
    'monthly_credits',
    'purchased_credits',
    'credits_used_this_month',
    'total_credits_used',
    'last_purchase_at',
    'last_monthly_reset_at'
];

foreach ($expected as $col) {
    if (in_array($col, $columns)) {
        echo "✅ $col\n";
    } else {
        echo "❌ $col MANQUANTE\n";
    }
}

echo "</pre>";
