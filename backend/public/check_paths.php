<?php
/**
 * Script ultra-simple pour vérifier les chemins réels
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Vérification Chemins</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        h2 { color: #ff0; }
        .path { background: #111; padding: 10px; margin: 5px 0; border-left: 3px solid #0f0; }
        .exists { color: #0f0; }
        .missing { color: #f00; }
    </style>
</head>
<body>
    <h1>🔍 Vérification des chemins</h1>

    <h2>1️⃣ Chemins de base</h2>
    <div class="path">
        <strong>__FILE__ (ce script) :</strong><br>
        <?php echo __FILE__; ?>
    </div>
    <div class="path">
        <strong>__DIR__ (dossier de ce script) :</strong><br>
        <?php echo __DIR__; ?>
    </div>
    <div class="path">
        <strong>$_SERVER['DOCUMENT_ROOT'] :</strong><br>
        <?php echo $_SERVER['DOCUMENT_ROOT']; ?>
    </div>
    <div class="path">
        <strong>$_SERVER['SCRIPT_FILENAME'] :</strong><br>
        <?php echo $_SERVER['SCRIPT_FILENAME']; ?>
    </div>
    <div class="path">
        <strong>dirname(__DIR__) :</strong><br>
        <?php echo dirname(__DIR__); ?>
    </div>

    <h2>2️⃣ Fichiers à vérifier</h2>
    <?php
    $files = [
        '.env' => __DIR__ . '/.env',
        'index.php' => __DIR__ . '/index.php',
        'vendor/autoload.php' => __DIR__ . '/vendor/autoload.php',
        'config/Database.php' => __DIR__ . '/config/Database.php',
        'routes/api.php' => __DIR__ . '/routes/api.php',
    ];

    foreach ($files as $name => $path) {
        $exists = file_exists($path);
        echo "<div class='path'>";
        echo "<strong>$name :</strong><br>";
        echo "Chemin: <code>$path</code><br>";
        echo "Existe: <span class='" . ($exists ? 'exists' : 'missing') . "'>" . ($exists ? '✅ OUI' : '❌ NON') . "</span>";
        echo "</div>";
    }
    ?>

    <h2>3️⃣ Contenu du dossier actuel (__DIR__)</h2>
    <div class="path">
        <?php
        if (is_dir(__DIR__)) {
            $files = scandir(__DIR__);
            echo "<strong>Fichiers dans " . __DIR__ . " :</strong><br>";
            echo "<ul>";
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') continue;
                $isDir = is_dir(__DIR__ . '/' . $file);
                echo "<li>" . ($isDir ? '📁 ' : '📄 ') . htmlspecialchars($file) . "</li>";
            }
            echo "</ul>";
        } else {
            echo "<span class='missing'>❌ Le dossier n'existe pas</span>";
        }
        ?>
    </div>

    <h2>4️⃣ Vérification vendor/ spécifique</h2>
    <?php
    $vendorPath = __DIR__ . '/vendor';
    $autoloadPath = __DIR__ . '/vendor/autoload.php';
    ?>
    <div class="path">
        <strong>Dossier vendor/ :</strong><br>
        Chemin: <code><?php echo $vendorPath; ?></code><br>
        Existe: <span class="<?php echo is_dir($vendorPath) ? 'exists' : 'missing'; ?>">
            <?php echo is_dir($vendorPath) ? '✅ OUI' : '❌ NON'; ?>
        </span>
    </div>

    <?php if (is_dir($vendorPath)): ?>
    <div class="path">
        <strong>Contenu de vendor/ :</strong><br>
        <?php
        $vendorFiles = scandir($vendorPath);
        echo "<ul>";
        foreach ($vendorFiles as $file) {
            if ($file === '.' || $file === '..') continue;
            $isDir = is_dir($vendorPath . '/' . $file);
            echo "<li>" . ($isDir ? '📁 ' : '📄 ') . htmlspecialchars($file) . "</li>";
        }
        echo "</ul>";
        ?>
    </div>
    <?php endif; ?>

    <div class="path">
        <strong>Fichier autoload.php :</strong><br>
        Chemin: <code><?php echo $autoloadPath; ?></code><br>
        Existe: <span class="<?php echo file_exists($autoloadPath) ? 'exists' : 'missing'; ?>">
            <?php echo file_exists($autoloadPath) ? '✅ OUI' : '❌ NON'; ?>
        </span><br>
        <?php if (file_exists($autoloadPath)): ?>
        Lisible: <span class="<?php echo is_readable($autoloadPath) ? 'exists' : 'missing'; ?>">
            <?php echo is_readable($autoloadPath) ? '✅ OUI' : '❌ NON'; ?>
        </span><br>
        Taille: <?php echo filesize($autoloadPath); ?> octets
        <?php endif; ?>
    </div>

    <h2>5️⃣ Structure attendue vs réelle</h2>
    <div class="path">
        <strong>ATTENDU :</strong><br>
        <pre>
/home/najo1022/staging.yarnflow.fr/
└── api/
    ├── check_paths.php (ce fichier)
    ├── .env
    ├── index.php
    ├── vendor/
    │   └── autoload.php
    └── config/
        └── Database.php
        </pre>
    </div>

    <div class="path">
        <strong>CE QUE JE VOIS :</strong><br>
        Le dossier actuel (__DIR__) est : <code><?php echo __DIR__; ?></code><br>
        <?php
        if (strpos(__DIR__, '/home/najo1022/staging.yarnflow.fr/api') !== false) {
            echo "<span class='exists'>✅ Chemin correct !</span>";
        } else {
            echo "<span class='missing'>❌ Chemin incorrect ! Le script n'est pas dans /api/</span>";
        }
        ?>
    </div>

    <hr>
    <p>💡 <strong>Instructions :</strong></p>
    <ul>
        <li>Si le dossier vendor/ n'existe pas → Uploadez-le dans le même dossier que ce script</li>
        <li>Si le chemin __DIR__ est bizarre → Le script n'est pas au bon endroit</li>
        <li>Si vendor/ existe mais pas autoload.php → L'upload est incomplet</li>
    </ul>

</body>
</html>
