<?php
/**
 * Script pour nettoyer la photo orpheline ID 16 du projet 25
 * http://patron-maker.local/cleanup_orphan_photo.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

header('Content-Type: text/plain; charset=utf-8');

use App\Config\Database;

$db = Database::getInstance()->getConnection();

echo "═══════════════════════════════════════════════════════════════\n";
echo "NETTOYAGE PHOTO ORPHELINE - Projet 25\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

// Supprimer UNIQUEMENT la photo ID 16 (la photo originale qui n'a plus de fichier)
// Les 8 variations (ID 17, 19, 52, 74, 75, 77, 78, 80) fonctionnent et seront conservées

$photoId = 16;

$deleteQuery = "DELETE FROM user_photos WHERE id = :id";
$stmt = $db->prepare($deleteQuery);
$stmt->bindValue(':id', $photoId, PDO::PARAM_INT);
$stmt->execute();

echo "✅ Photo ID {$photoId} supprimée de la base de données\n";
echo "\nLes 8 variations générées sont conservées et fonctionnent normalement.\n";
echo "Vous pouvez maintenant uploader une nouvelle photo pour le projet.\n";

echo "\n═══════════════════════════════════════════════════════════════\n";
echo "NETTOYAGE TERMINÉ\n";
echo "═══════════════════════════════════════════════════════════════\n";
