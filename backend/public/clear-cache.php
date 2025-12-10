<?php
/**
 * Clear OpCache and verify file versions
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== CLEAR CACHE & VERIFY FILES ===\n\n";

// Clear OpCache
if (function_exists('opcache_reset')) {
    if (opcache_reset()) {
        echo "✅ OpCache cleared successfully\n";
    } else {
        echo "❌ Failed to clear OpCache\n";
    }
} else {
    echo "⚠️  OpCache not enabled\n";
}

echo "\n";

// Clear realpath cache
clearstatcache(true);
echo "✅ Stat cache cleared\n\n";

// Verify AuthController
$authPath = __DIR__ . '/../controllers/AuthController.php';
if (file_exists($authPath)) {
    echo "📄 AuthController.php:\n";
    echo "   Size: " . filesize($authPath) . " bytes\n";
    echo "   Modified: " . date('Y-m-d H:i:s', filemtime($authPath)) . "\n";

    $content = file_get_contents($authPath);

    // Chercher notre message spécifique
    if (strpos($content, 'Ce code beta est réservé à une autre adresse email') !== false) {
        echo "   ✅ Message d'erreur beta présent\n";
    } else {
        echo "   ❌ Message d'erreur beta ABSENT\n";
    }

    if (strpos($content, 'Inscription réussie ! Bienvenue dans la beta YarnFlow') !== false) {
        echo "   ✅ Message de succès beta présent\n";
    } else {
        echo "   ❌ Message de succès beta ABSENT\n";
    }
} else {
    echo "❌ AuthController.php not found\n";
}

echo "\n";

// Verify BetaCodeService
$betaPath = __DIR__ . '/../services/BetaCodeService.php';
if (file_exists($betaPath)) {
    echo "📄 BetaCodeService.php:\n";
    echo "   Size: " . filesize($betaPath) . " bytes\n";
    echo "   Modified: " . date('Y-m-d H:i:s', filemtime($betaPath)) . "\n";
    echo "   ✅ File exists\n";
} else {
    echo "❌ BetaCodeService.php not found\n";
}

echo "\n=== DONE ===\n";
echo "\nNow test the real API again:\n";
echo "https://yarnflow.fr/api/auth/register\n";
