<?php
/**
 * Fix des variations orphelines - les regrouper sous une nouvelle photo parent
 * http://patron-maker.local/fix_orphan_variations.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: text/plain; charset=utf-8');

use App\Config\Database;

$db = Database::getInstance()->getConnection();

echo "═══════════════════════════════════════════════════════════════\n";
echo "FIX VARIATIONS ORPHELINES - Projet 25\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Photos concernées (anciennes variations devenues "originales")
$orphanIds = [17, 19, 52, 74, 75, 77, 78, 80];

echo "Étape 1 : Promouvoir la photo ID 17 comme nouvelle photo originale\n";
echo "───────────────────────────────────────────────────────────────\n";

// Promouvoir la première variation (ID 17) en photo originale
// Son enhanced_path devient son original_path
$promoteQuery = "UPDATE user_photos
                 SET original_path = enhanced_path,
                     parent_photo_id = NULL,
                     item_name = 'Photo de couverture (IA)'
                 WHERE id = 17";
$db->exec($promoteQuery);

echo "✅ Photo ID 17 promue en photo originale\n";
echo "   Nouveau original_path = enhanced_path\n\n";

echo "Étape 2 : Attacher les autres variations à la photo ID 17\n";
echo "───────────────────────────────────────────────────────────────\n";

// Les autres deviennent des variations de ID 17
$otherIds = array_diff($orphanIds, [17]);

foreach ($otherIds as $id) {
    $updateQuery = "UPDATE user_photos
                    SET parent_photo_id = 17
                    WHERE id = :id";

    $stmt = $db->prepare($updateQuery);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    echo "✅ Photo ID {$id} rattachée à la photo parent ID 17\n";
}

echo "\n═══════════════════════════════════════════════════════════════\n";
echo "RÉSULTAT\n";
echo "═══════════════════════════════════════════════════════════════\n";
echo "Photo originale : ID 17 (utilisera son enhanced_path)\n";
echo "Variations : ID " . implode(', ', $otherIds) . "\n";
echo "\n✅ FIX TERMINÉ - Les photos devraient maintenant s'afficher correctement\n";
echo "═══════════════════════════════════════════════════════════════\n";
