<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

echo "=== DEBUG ÉTAPE PAR ÉTAPE ===\n\n";

// Étape 1 : Vérifier que PHP fonctionne
echo "✅ 1. PHP fonctionne (version " . phpversion() . ")\n";

// Étape 2 : Vérifier __DIR__
echo "✅ 2. Dossier actuel : " . __DIR__ . "\n";

// Étape 3 : Vérifier autoload
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
echo "   Chemin autoload : $autoloadPath\n";

if (file_exists($autoloadPath)) {
    echo "✅ 3. Autoload existe\n";
    try {
        require_once $autoloadPath;
        echo "✅ 4. Autoload chargé\n";
    } catch (Exception $e) {
        echo "❌ 4. ERREUR autoload : " . $e->getMessage() . "\n";
        exit;
    }
} else {
    echo "❌ 3. ERREUR : autoload manquant !\n";
    echo "   Fichiers dans " . dirname(__DIR__) . " :\n";
    $files = scandir(dirname(__DIR__));
    foreach ($files as $f) {
        if ($f != '.' && $f != '..') {
            echo "   - $f\n";
        }
    }
    exit;
}

// Étape 4 : Vérifier .env
$envPath = dirname(__DIR__) . '/.env';
echo "   Chemin .env : $envPath\n";
if (file_exists($envPath)) {
    echo "✅ 5. .env existe\n";
} else {
    echo "⚠️ 5. .env manquant (peut être normal)\n";
}

// Étape 5 : Vérifier Database class
try {
    $db = \App\Config\Database::getInstance()->getConnection();
    echo "✅ 6. Connexion DB OK\n";
} catch (Exception $e) {
    echo "❌ 6. ERREUR DB : " . $e->getMessage() . "\n";
    echo "   Trace : " . $e->getTraceAsString() . "\n";
    exit;
}

// Étape 6 : Vérifier User model
try {
    $userModel = new \App\Models\User();
    echo "✅ 7. User model instancié\n";
} catch (Exception $e) {
    echo "❌ 7. ERREUR User model : " . $e->getMessage() . "\n";
    exit;
}

// Étape 7 : Vérifier JWTService
try {
    $jwtService = new \App\Services\JWTService();
    echo "✅ 8. JWTService instancié\n";
} catch (Exception $e) {
    echo "❌ 8. ERREUR JWTService : " . $e->getMessage() . "\n";
    exit;
}

echo "\n=== TOUS LES TESTS PASSÉS ! ===\n";
echo "Le backend est prêt à fonctionner.\n";
?>
