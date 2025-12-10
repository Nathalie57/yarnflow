<?php
/**
 * Lister tous les fichiers d'uploads pour les localiser
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/plain; charset=utf-8');

echo "=== LOCALISATION DES FICHIERS UPLOADS ===\n\n";

// Différents dossiers possibles
$dirs = [
    'public/uploads/patterns' => __DIR__ . '/uploads/patterns',
    'public/uploads/pattern-library' => __DIR__ . '/uploads/pattern-library',
    'api/uploads/patterns' => __DIR__ . '/../uploads/patterns',
    'api/uploads/pattern-library' => __DIR__ . '/../uploads/pattern-library',
];

foreach ($dirs as $label => $dir) {
    echo "📂 $label\n";
    echo "   Chemin: $dir\n";

    if (is_dir($dir)) {
        echo "   ✅ Dossier existe\n";

        $files = array_diff(scandir($dir), ['.', '..']);
        echo "   Fichiers: " . count($files) . "\n";

        if (count($files) > 0) {
            echo "   Listing:\n";
            foreach ($files as $file) {
                $fullPath = $dir . '/' . $file;
                $size = filesize($fullPath);
                echo "     - $file (" . number_format($size) . " bytes)\n";
            }
        } else {
            echo "   (vide)\n";
        }
    } else {
        echo "   ❌ Dossier n'existe pas\n";
    }

    echo "\n";
}

echo "=== FIN ===\n";
