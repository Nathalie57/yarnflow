#!/usr/bin/env php
<?php
/**
 * @file oneshot-backfill-photo-types.php
 * @brief Script ONE-SHOT pour associer item_type et technique aux photos sans catégorie
 * @author YarnFlow Team + AI:Claude
 * @created 2026-03-08
 *
 * ATTENTION: Ce script est prévu pour être exécuté UNE SEULE FOIS.
 * Il met à jour les user_photos qui ont un project_id mais pas d'item_type,
 * en récupérant le type et la technique du projet associé.
 *
 * Usage: php oneshot-backfill-photo-types.php [--dry-run]
 *   --dry-run : Affiche les photos concernées sans modifier la base
 */

declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$dryRun = in_array('--dry-run', $argv ?? []);

echo "=== Backfill item_type/technique sur user_photos ===" . PHP_EOL;
echo "Mode : " . ($dryRun ? "DRY-RUN (aucune modification)" : "RÉEL") . PHP_EOL;
echo str_repeat('-', 50) . PHP_EOL;

try {
    $db = Database::getInstance()->getConnection();

    // Compter les photos concernées
    $countStmt = $db->query("
        SELECT COUNT(*) as total
        FROM user_photos up
        INNER JOIN projects p ON up.project_id = p.id
        WHERE up.item_type IS NULL
          AND up.project_id IS NOT NULL
          AND p.type IS NOT NULL
    ");
    $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'];

    echo "Photos sans item_type avec un projet associé : {$total}" . PHP_EOL . PHP_EOL;

    if ($total === 0) {
        echo "Rien à faire, toutes les photos ont déjà un item_type." . PHP_EOL;
        exit(0);
    }

    // Récupérer les photos à mettre à jour (pour affichage)
    $selectStmt = $db->query("
        SELECT up.id, up.item_name, up.item_type, up.technique,
               p.id as project_id, p.name as project_name,
               p.type as project_type, p.technique as project_technique
        FROM user_photos up
        INNER JOIN projects p ON up.project_id = p.id
        WHERE up.item_type IS NULL
          AND up.project_id IS NOT NULL
          AND p.type IS NOT NULL
        ORDER BY up.id
    ");
    $photos = $selectStmt->fetchAll(PDO::FETCH_ASSOC);

    echo sprintf("%-6s %-30s %-25s %-20s", "ID", "Nom photo", "Projet", "Type → Technique") . PHP_EOL;
    echo str_repeat('-', 85) . PHP_EOL;

    foreach ($photos as $photo) {
        $type      = $photo['project_type'] ?? '(vide)';
        $technique = $photo['project_technique'] ?? '(vide)';
        echo sprintf(
            "%-6s %-30s %-25s %s → %s",
            $photo['id'],
            mb_substr($photo['item_name'] ?? '(sans nom)', 0, 28),
            mb_substr($photo['project_name'], 0, 23),
            $type,
            $technique
        ) . PHP_EOL;
    }

    echo PHP_EOL;

    if ($dryRun) {
        echo "DRY-RUN : aucune modification effectuée." . PHP_EOL;
        echo "Relancez sans --dry-run pour appliquer les changements." . PHP_EOL;
        exit(0);
    }

    // Mise à jour réelle
    $updateStmt = $db->prepare("
        UPDATE user_photos up
        INNER JOIN projects p ON up.project_id = p.id
        SET up.item_type  = p.type,
            up.technique  = COALESCE(up.technique, p.technique)
        WHERE up.item_type IS NULL
          AND up.project_id IS NOT NULL
          AND p.type IS NOT NULL
    ");
    $updateStmt->execute();
    $updated = $updateStmt->rowCount();

    echo "✅ {$updated} photo(s) mise(s) à jour." . PHP_EOL;

} catch (Exception $e) {
    echo "❌ Erreur : " . $e->getMessage() . PHP_EOL;
    exit(1);
}
