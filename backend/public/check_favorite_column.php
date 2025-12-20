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
echo "Vérification des colonnes favorite dans la table projects:\n\n";

// Vérifier 'favorite'
$result = $db->query("SHOW COLUMNS FROM projects LIKE 'favorite'");
if ($result->rowCount() > 0) {
    echo "✅ Colonne 'favorite' existe\n";
    $col = $result->fetch(PDO::FETCH_ASSOC);
    print_r($col);
} else {
    echo "❌ Colonne 'favorite' n'existe PAS\n";
}

echo "\n";

// Vérifier 'is_favorite'
$result2 = $db->query("SHOW COLUMNS FROM projects LIKE 'is_favorite'");
if ($result2->rowCount() > 0) {
    echo "✅ Colonne 'is_favorite' existe\n";
    $col = $result2->fetch(PDO::FETCH_ASSOC);
    print_r($col);
} else {
    echo "❌ Colonne 'is_favorite' n'existe PAS\n";
}

echo "\n---\n";
echo "SOLUTION:\n";
echo "Si seule 'is_favorite' existe, il faut soit:\n";
echo "1. Renommer is_favorite en favorite en BDD\n";
echo "2. OU modifier le code backend pour utiliser is_favorite\n";
echo "</pre>";
