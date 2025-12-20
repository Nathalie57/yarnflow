<?php
/**
 * Script de diagnostic pour vérifier les photos du projet 25
 * Accessible via HTTP: http://patron-maker.local/debug_photos.php?project_id=25
 */

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: text/plain; charset=utf-8');

use App\Config\Database;

$projectId = $_GET['project_id'] ?? 25;

$db = Database::getInstance()->getConnection();

echo "═══════════════════════════════════════════════════════════════\n";
echo "DIAGNOSTIC PHOTOS PROJET {$projectId}\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Récupérer toutes les photos du projet
$query = "SELECT id, user_id, project_id, original_path, enhanced_path,
                 item_name, parent_photo_id, ai_style, created_at
          FROM user_photos
          WHERE project_id = :project_id
          ORDER BY parent_photo_id IS NULL DESC, id ASC";

$stmt = $db->prepare($query);
$stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
$stmt->execute();
$photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Nombre total de photos: " . count($photos) . "\n\n";

if (empty($photos)) {
    echo "❌ Aucune photo trouvée pour ce projet.\n";
    exit;
}

foreach ($photos as $photo) {
    $isOriginal = empty($photo['parent_photo_id']);
    $type = $isOriginal ? "📷 ORIGINALE" : "✨ VARIATION";

    echo "───────────────────────────────────────────────────────────────\n";
    echo "{$type} - ID: {$photo['id']}\n";
    echo "  User ID: {$photo['user_id']}\n";
    echo "  Nom: {$photo['item_name']}\n";
    echo "  Original path: {$photo['original_path']}\n";

    // Vérifier si le fichier original existe
    $originalFullPath = __DIR__ . $photo['original_path'];
    $originalExists = file_exists($originalFullPath);
    echo "  Fichier original existe: " . ($originalExists ? "✅ OUI" : "❌ NON") . "\n";
    if (!$originalExists) {
        echo "    Chemin complet attendu: {$originalFullPath}\n";
    } else {
        echo "    Taille: " . filesize($originalFullPath) . " octets\n";
    }

    if (!empty($photo['enhanced_path'])) {
        echo "  Enhanced path: {$photo['enhanced_path']}\n";
        $enhancedFullPath = __DIR__ . $photo['enhanced_path'];
        $enhancedExists = file_exists($enhancedFullPath);
        echo "  Fichier enhanced existe: " . ($enhancedExists ? "✅ OUI" : "❌ NON") . "\n";
        if (!$enhancedExists) {
            echo "    Chemin complet attendu: {$enhancedFullPath}\n";
        } else {
            echo "    Taille: " . filesize($enhancedFullPath) . " octets\n";
        }
    }

    if (!$isOriginal) {
        echo "  Parent photo ID: {$photo['parent_photo_id']}\n";
        echo "  Style IA: {$photo['ai_style']}\n";
    }

    echo "  Créé le: {$photo['created_at']}\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n";
echo "FIN DU DIAGNOSTIC\n";
echo "═══════════════════════════════════════════════════════════════\n";
