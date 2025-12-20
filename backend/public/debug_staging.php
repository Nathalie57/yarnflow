<?php
/**
 * Script de debug pour environnement staging
 * À placer dans backend/public/debug_staging.php
 * Accessible via : https://staging.yarnflow.fr/api/debug_staging.php
 */

// Activer l'affichage des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>YarnFlow - Debug Staging</title>
    <style>
        body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
        h2 { color: #ffff00; border-bottom: 2px solid #ffff00; padding-bottom: 5px; }
        .success { color: #00ff00; }
        .error { color: #ff0000; }
        .warning { color: #ff9900; }
        .info { color: #00ccff; }
        pre { background: #000; padding: 10px; border-left: 3px solid #00ff00; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #333; }
        .structure { background: #000; padding: 15px; border: 2px solid #00ff00; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🔍 YarnFlow Staging Debug</h1>
    <p class='info'>Date: " . date('Y-m-d H:i:s') . "</p>
    <hr>

    <h2>📁 Structure attendue sur le serveur</h2>
    <div class='structure'>
<pre>
/home/najo1022/staging.yarnflow.fr/
├── index.html              ← Frontend (React build)
├── assets/                 ← JS/CSS frontend
├── style-examples/         ← Images d'exemples
├── api/                    ← Backend PHP (TOUT au même niveau!)
│   ├── .env               ← ⚠️ Configuration (MÊME NIVEAU que index.php!)
│   ├── index.php          ← Point d'entrée API
│   ├── debug_staging.php  ← Ce script
│   ├── .htaccess          ← Config Apache
│   ├── controllers/       ← Dossiers backend
│   ├── models/
│   ├── services/
│   ├── config/
│   │   └── Database.php
│   ├── routes/
│   │   └── api.php
│   └── vendor/            ← ⚠️ Composer dependencies (MÊME NIVEAU!)
│       └── autoload.php
└── uploads/               ← Photos utilisateurs
    └── photos/
</pre>
    </div>
    <p class='warning'>⚠️ Sur staging, TOUT le backend est dans /api/ (pas de sous-dossier public/)</p>
    <p class='warning'>⚠️ .env et vendor/ sont au MÊME NIVEAU que index.php dans /api/</p>
    <hr>
";

// ============================================================================
// 1. ENVIRONNEMENT PHP
// ============================================================================
echo "<h2>1️⃣ Environnement PHP</h2>";
echo "<table>";
echo "<tr><th>Item</th><th>Valeur</th><th>Statut</th></tr>";

$phpVersion = phpversion();
$phpOk = version_compare($phpVersion, '8.1.0', '>=');
echo "<tr><td>Version PHP</td><td>$phpVersion</td><td class='" . ($phpOk ? 'success' : 'error') . "'>" . ($phpOk ? '✅ OK' : '❌ Trop ancien (requis: 8.1+)') . "</td></tr>";

$extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'openssl'];
foreach ($extensions as $ext) {
    $loaded = extension_loaded($ext);
    echo "<tr><td>Extension $ext</td><td>" . ($loaded ? 'Chargée' : 'Manquante') . "</td><td class='" . ($loaded ? 'success' : 'error') . "'>" . ($loaded ? '✅' : '❌') . "</td></tr>";
}

echo "<tr><td>Memory Limit</td><td>" . ini_get('memory_limit') . "</td><td class='info'>ℹ️</td></tr>";
echo "<tr><td>Upload Max</td><td>" . ini_get('upload_max_filesize') . "</td><td class='info'>ℹ️</td></tr>";
echo "<tr><td>Post Max</td><td>" . ini_get('post_max_size') . "</td><td class='info'>ℹ️</td></tr>";
echo "</table>";

// ============================================================================
// 2. CHEMINS ET FICHIERS
// ============================================================================
echo "<h2>2️⃣ Chemins et Fichiers</h2>";
echo "<table>";
echo "<tr><th>Item</th><th>Valeur</th><th>Statut</th></tr>";

echo "<tr><td>Document Root</td><td>" . $_SERVER['DOCUMENT_ROOT'] . "</td><td class='info'>ℹ️</td></tr>";
echo "<tr><td>Script Filename</td><td>" . __FILE__ . "</td><td class='info'>ℹ️</td></tr>";

$criticalFiles = [
    '.env' => __DIR__ . '/.env',
    'index.php' => __DIR__ . '/index.php',
    'Database.php' => __DIR__ . '/config/Database.php',
    'routes/api.php' => __DIR__ . '/routes/api.php',
    'vendor/autoload.php' => __DIR__ . '/vendor/autoload.php',
];

foreach ($criticalFiles as $name => $path) {
    $exists = file_exists($path);
    $readable = $exists && is_readable($path);
    echo "<tr><td>$name</td><td>" . ($exists ? '✅ Existe' : '❌ Manquant') . "</td><td class='" . ($readable ? 'success' : 'error') . "'>" . ($readable ? '✅ Lisible' : '❌ Non lisible') . "</td></tr>";
}

echo "</table>";

// ============================================================================
// 3. FICHIER .ENV
// ============================================================================
echo "<h2>3️⃣ Configuration .env</h2>";

// Le .env est dans le même dossier que ce script (api/.env)
$envPath = __DIR__ . '/.env';
echo "<p class='info'>ℹ️ Recherche du .env dans : $envPath</p>";

if (file_exists($envPath)) {
    echo "<p class='success'>✅ Fichier .env trouvé</p>";

    // Charger les variables d'environnement
    $envContent = file_get_contents($envPath);
    $envLines = explode("\n", $envContent);

    foreach ($envLines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }

        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }

    echo "<table>";
    echo "<tr><th>Variable</th><th>Définie</th><th>Valeur (masquée)</th></tr>";

    $envVars = [
        'DB_HOST',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET',
        'APP_ENV',
        'STRIPE_SECRET_KEY',
        'GEMINI_API_KEY',
        'CONTACT_EMAIL'
    ];

    foreach ($envVars as $var) {
        $defined = isset($_ENV[$var]) && !empty($_ENV[$var]);
        $value = $defined ? $_ENV[$var] : '';

        // Masquer les valeurs sensibles
        if (in_array($var, ['DB_PASSWORD', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'GEMINI_API_KEY'])) {
            $displayValue = $defined ? str_repeat('*', min(strlen($value), 20)) : '';
        } else {
            $displayValue = $defined ? htmlspecialchars($value) : '';
        }

        echo "<tr><td>$var</td><td class='" . ($defined ? 'success' : 'error') . "'>" . ($defined ? '✅' : '❌') . "</td><td>$displayValue</td></tr>";
    }

    echo "</table>";
} else {
    echo "<p class='error'>❌ Fichier .env NON TROUVÉ à : $envPath</p>";
    echo "<p class='warning'>⚠️ Créez un fichier .env en copiant .env.example</p>";
}

// ============================================================================
// 4. CONNEXION BASE DE DONNÉES
// ============================================================================
echo "<h2>4️⃣ Connexion Base de Données</h2>";

if (isset($_ENV['DB_HOST']) && isset($_ENV['DB_NAME']) && isset($_ENV['DB_USER'])) {
    try {
        $dsn = "mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_NAME']};charset=utf8mb4";
        $pdo = new PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASSWORD'] ?? '');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        echo "<p class='success'>✅ Connexion MySQL réussie</p>";
        echo "<table>";
        echo "<tr><th>Info</th><th>Valeur</th></tr>";
        echo "<tr><td>Host</td><td>" . htmlspecialchars($_ENV['DB_HOST']) . "</td></tr>";
        echo "<tr><td>Database</td><td>" . htmlspecialchars($_ENV['DB_NAME']) . "</td></tr>";
        echo "<tr><td>User</td><td>" . htmlspecialchars($_ENV['DB_USER']) . "</td></tr>";

        // Tester une requête
        $stmt = $pdo->query("SELECT VERSION() as version");
        $version = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<tr><td>MySQL Version</td><td>" . htmlspecialchars($version['version']) . "</td></tr>";

        // Compter les tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "<tr><td>Nombre de tables</td><td>" . count($tables) . "</td></tr>";
        echo "</table>";

        // Vérifier les tables critiques
        echo "<h3>Tables critiques</h3>";
        echo "<table>";
        echo "<tr><th>Table</th><th>Statut</th><th>Nombre de lignes</th></tr>";

        $criticalTables = ['users', 'projects', 'user_photos', 'payments', 'contact_messages'];
        foreach ($criticalTables as $table) {
            if (in_array($table, $tables)) {
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                    echo "<tr><td>$table</td><td class='success'>✅ Existe</td><td>$count</td></tr>";
                } catch (Exception $e) {
                    echo "<tr><td>$table</td><td class='warning'>⚠️ Erreur comptage</td><td>" . htmlspecialchars($e->getMessage()) . "</td></tr>";
                }
            } else {
                echo "<tr><td>$table</td><td class='error'>❌ Manquante</td><td>-</td></tr>";
            }
        }
        echo "</table>";

    } catch (PDOException $e) {
        echo "<p class='error'>❌ Échec connexion MySQL</p>";
        echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
        echo "<p class='warning'>⚠️ Vérifiez vos credentials dans .env</p>";
    }
} else {
    echo "<p class='error'>❌ Variables DB_ manquantes dans .env</p>";
}

// ============================================================================
// 5. AUTOLOAD COMPOSER
// ============================================================================
echo "<h2>5️⃣ Autoload Composer</h2>";

// Sur staging, vendor/ est dans /api/vendor/ (même niveau que ce script)
$autoloadPath = __DIR__ . '/vendor/autoload.php';

echo "<p class='info'>ℹ️ Recherche autoload dans : $autoloadPath</p>";

if (file_exists($autoloadPath)) {
    echo "<p class='success'>✅ Autoload Composer trouvé</p>";
    require_once $autoloadPath;

    // Tester le chargement d'une classe
    try {
        if (class_exists('App\\Config\\Database')) {
            echo "<p class='success'>✅ Classe App\\Config\\Database chargeable</p>";
        } else {
            echo "<p class='error'>❌ Classe App\\Config\\Database non trouvée</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>❌ Erreur chargement classe: " . htmlspecialchars($e->getMessage()) . "</p>";
    }
} else {
    echo "<p class='error'>❌ Autoload Composer manquant à : $autoloadPath</p>";
    echo "<p class='warning'>⚠️ Lancez 'composer install' dans le dossier backend/</p>";
}

// ============================================================================
// 6. TEST ROUTE /health
// ============================================================================
echo "<h2>6️⃣ Test Route /health</h2>";

echo "<p class='info'>ℹ️ Tentative de simulation de la route /health...</p>";

try {
    // Simuler une requête vers /health
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/health';

    // Capturer la sortie
    ob_start();

    // Inclure le routeur si possible
    $indexPath = __DIR__ . '/index.php';
    if (file_exists($indexPath)) {
        // Ne pas exécuter, juste tester la syntaxe
        echo "<p class='success'>✅ index.php existe et est accessible</p>";
        echo "<p class='info'>ℹ️ Pour tester réellement /health, allez sur : <a href='/api/health' style='color:#00ccff;'>/api/health</a></p>";
    } else {
        echo "<p class='error'>❌ index.php non trouvé</p>";
    }

    ob_end_clean();

} catch (Exception $e) {
    ob_end_clean();
    echo "<p class='error'>❌ Erreur lors du test: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<pre>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}

// ============================================================================
// 7. LOGS D'ERREURS PHP
// ============================================================================
echo "<h2>7️⃣ Logs d'erreurs PHP</h2>";

$errorLog = ini_get('error_log');
echo "<p class='info'>Fichier de log configuré : " . htmlspecialchars($errorLog) . "</p>";

// Rechercher les logs récents
$possibleLogs = [
    __DIR__ . '/error_log',  // Dans /api/
    dirname($_SERVER['DOCUMENT_ROOT']) . '/error_log',  // Un niveau au-dessus de la racine web
    $_SERVER['DOCUMENT_ROOT'] . '/error_log',  // À la racine du site
    '/home/najo1022/logs/error_log',  // Logs O2switch
    '/var/log/php_errors.log',
    $errorLog
];

echo "<p class='info'>ℹ️ Recherche de logs dans plusieurs emplacements...</p>";

foreach ($possibleLogs as $logPath) {
    if (file_exists($logPath) && is_readable($logPath)) {
        echo "<p class='success'>✅ Log trouvé : $logPath</p>";
        $lines = file($logPath);
        $recentLines = array_slice($lines, -20); // 20 dernières lignes

        echo "<h3>20 dernières lignes :</h3>";
        echo "<pre style='max-height: 300px; overflow-y: scroll;'>";
        echo htmlspecialchars(implode('', $recentLines));
        echo "</pre>";
        break;
    }
}

// ============================================================================
// 8. VARIABLES SERVEUR
// ============================================================================
echo "<h2>8️⃣ Variables Serveur</h2>";

echo "<table>";
echo "<tr><th>Variable</th><th>Valeur</th></tr>";
$serverVars = [
    'HTTP_HOST',
    'SERVER_SOFTWARE',
    'SERVER_NAME',
    'DOCUMENT_ROOT',
    'REQUEST_URI',
    'SCRIPT_FILENAME',
    'REMOTE_ADDR',
    'HTTP_USER_AGENT'
];

foreach ($serverVars as $var) {
    echo "<tr><td>$var</td><td>" . htmlspecialchars($_SERVER[$var] ?? 'N/A') . "</td></tr>";
}
echo "</table>";

// ============================================================================
// FIN
// ============================================================================
echo "<hr>";
echo "<h2>✅ Debug terminé</h2>";
echo "<p class='info'>💡 Conseils :</p>";
echo "<ul>";
echo "<li>Si connexion BDD échoue → Vérifiez .env (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)</li>";
echo "<li>Si autoload manquant → Lancez 'composer install' dans backend/</li>";
echo "<li>Si erreur 500 persiste → Consultez les logs d'erreurs ci-dessus</li>";
echo "<li>Si tables manquantes → Importez les migrations SQL dans le bon ordre</li>";
echo "</ul>";

echo "<p class='warning'>⚠️ <strong>IMPORTANT :</strong> Supprimez ce fichier après debug (sécurité)</p>";
echo "<pre>rm " . __FILE__ . "</pre>";

echo "</body></html>";
?>
