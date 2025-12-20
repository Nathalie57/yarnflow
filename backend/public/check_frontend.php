<?php
header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html><html><head><title>Diagnostic Staging YarnFlow</title>";
echo "<style>body{font-family:Arial;padding:20px;background:#f5f5f5;}";
echo ".box{background:white;padding:20px;margin:10px 0;border-radius:5px;box-shadow:0 2px 5px rgba(0,0,0,0.1);}";
echo ".success{color:#10b981;} .error{color:#ef4444;} .warning{color:#f59e0b;}";
echo "pre{background:#f3f4f6;padding:10px;border-radius:4px;overflow-x:auto;}</style></head><body>";

echo "<h1>🔍 Diagnostic Frontend Staging</h1>";

// 1. Vérifier le chemin actuel
echo "<div class='box'>";
echo "<h2>1. Chemin actuel (ce script PHP)</h2>";
echo "<pre>" . __DIR__ . "</pre>";
echo "</div>";

// 2. Vérifier le document root
echo "<div class='box'>";
echo "<h2>2. Document Root Apache</h2>";
echo "<pre>" . ($_SERVER['DOCUMENT_ROOT'] ?? 'Non défini') . "</pre>";
echo "</div>";

// 3. Chemin attendu du frontend
$frontendPath = dirname(dirname(__DIR__)) . '/staging.yarnflow.fr';
echo "<div class='box'>";
echo "<h2>3. Chemin attendu du frontend</h2>";
echo "<pre>$frontendPath</pre>";
echo "<p>Existe ? " . (is_dir($frontendPath) ? "<span class='success'>✅ OUI</span>" : "<span class='error'>❌ NON</span>") . "</p>";
echo "</div>";

// 4. Lister les fichiers dans staging.yarnflow.fr
echo "<div class='box'>";
echo "<h2>4. Fichiers dans staging.yarnflow.fr/</h2>";
if (is_dir($frontendPath)) {
    $files = scandir($frontendPath);
    echo "<pre>";
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            $fullPath = $frontendPath . '/' . $file;
            $type = is_dir($fullPath) ? '[DIR]' : '[FILE]';
            $size = is_file($fullPath) ? ' (' . round(filesize($fullPath)/1024, 2) . ' KB)' : '';
            echo "$type $file$size\n";
        }
    }
    echo "</pre>";
} else {
    echo "<p class='error'>❌ Le dossier n'existe pas</p>";
}
echo "</div>";

// 5. Vérifier index.html
$indexPath = $frontendPath . '/index.html';
echo "<div class='box'>";
echo "<h2>5. Fichier index.html</h2>";
echo "<p>Chemin : <code>$indexPath</code></p>";
echo "<p>Existe ? " . (file_exists($indexPath) ? "<span class='success'>✅ OUI</span>" : "<span class='error'>❌ NON</span>") . "</p>";
if (file_exists($indexPath)) {
    echo "<p>Taille : " . round(filesize($indexPath)/1024, 2) . " KB</p>";
    echo "<p>Dernière modification : " . date('Y-m-d H:i:s', filemtime($indexPath)) . "</p>";
}
echo "</div>";

// 6. Vérifier .htaccess
$htaccessPath = $frontendPath . '/.htaccess';
echo "<div class='box'>";
echo "<h2>6. Fichier .htaccess</h2>";
echo "<p>Chemin : <code>$htaccessPath</code></p>";
echo "<p>Existe ? " . (file_exists($htaccessPath) ? "<span class='success'>✅ OUI</span>" : "<span class='warning'>⚠️ NON (peut être normal)</span>") . "</p>";
if (file_exists($htaccessPath)) {
    echo "<pre>" . htmlspecialchars(file_get_contents($htaccessPath)) . "</pre>";
}
echo "</div>";

// 7. Vérifier le dossier assets
$assetsPath = $frontendPath . '/assets';
echo "<div class='box'>";
echo "<h2>7. Dossier assets/</h2>";
echo "<p>Existe ? " . (is_dir($assetsPath) ? "<span class='success'>✅ OUI</span>" : "<span class='error'>❌ NON</span>") . "</p>";
if (is_dir($assetsPath)) {
    $files = scandir($assetsPath);
    echo "<p>Nombre de fichiers : " . (count($files) - 2) . "</p>";
    echo "<pre>";
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            $size = filesize($assetsPath . '/' . $file);
            echo "$file (" . round($size/1024, 2) . " KB)\n";
        }
    }
    echo "</pre>";
}
echo "</div>";

// 8. Informations serveur
echo "<div class='box'>";
echo "<h2>8. Informations serveur</h2>";
echo "<p>Serveur : " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Inconnu') . "</p>";
echo "<p>PHP Version : " . PHP_VERSION . "</p>";
echo "<p>Host : " . ($_SERVER['HTTP_HOST'] ?? 'Inconnu') . "</p>";
echo "</div>";

echo "</body></html>";
?>
