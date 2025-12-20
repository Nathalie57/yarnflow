<?php
/**
 * Script de nettoyage des photos orphelines (fichiers manquants)
 * http://patron-maker.local/cleanup_orphan_photos.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: text/plain; charset=utf-8');

use App\Config\Database;

$db = Database::getInstance()->getConnection();

echo "═══════════════════════════════════════════════════════════════\n";
echo "NETTOYAGE DES PHOTOS ORPHELINES\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Récupérer toutes les photos du projet 25
$query = "SELECT id, user_id, project_id, original_path, enhanced_path,
                 item_name, parent_photo_id, created_at
          FROM user_photos
          WHERE project_id = 25
          ORDER BY id ASC";

$stmt = $db->prepare($query);
$stmt->execute();
$photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

$toDelete = [];
$toKeep = [];

foreach ($photos as $photo) {
    $isOriginal = empty($photo['parent_photo_id']);
    $originalFullPath = __DIR__ . $photo['original_path'];
    $originalExists = file_exists($originalFullPath);

    // Si c'est une photo originale et que le fichier n'existe pas
    if ($isOriginal && !$originalExists) {
        $toDelete[] = $photo;
    } else {
        $toKeep[] = $photo;
    }
}

echo "Photos à supprimer (fichier original manquant) :\n";
echo "───────────────────────────────────────────────────────────────\n";

if (empty($toDelete)) {
    echo "✅ Aucune photo orpheline trouvée !\n";
} else {
    foreach ($toDelete as $photo) {
        echo "  ❌ ID {$photo['id']} - {$photo['item_name']}\n";
        echo "     Créée le: {$photo['created_at']}\n";
        echo "     Chemin manquant: {$photo['original_path']}\n\n";
    }

    // Suppression
    echo "\nSuppression en cours...\n";

    foreach ($toDelete as $photo) {
        $deleteQuery = "DELETE FROM user_photos WHERE id = :id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindValue(':id', $photo['id'], PDO::PARAM_INT);
        $deleteStmt->execute();

        echo "  ✅ Photo ID {$photo['id']} supprimée\n";
    }
}

echo "\n═══════════════════════════════════════════════════════════════\n";
echo "Photos conservées (fichiers valides) :\n";
echo "───────────────────────────────────────────────────────────────\n";

foreach ($toKeep as $photo) {
    $isOriginal = empty($photo['parent_photo_id']);
    $type = $isOriginal ? "📷 ORIGINALE" : "✨ VARIATION";
    echo "  ✅ {$type} - ID {$photo['id']} - {$photo['item_name']}\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n";
echo "RÉSUMÉ\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "Photos supprimées : " . count($toDelete) . "\n";
echo "Photos conservées : " . count($toKeep) . "\n";
echo "\n✅ NETTOYAGE TERMINÉ\n";
echo "═══════════════════════════════════════════════════════════════\n";
