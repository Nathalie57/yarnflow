<?php
/**
 * Script de test pour vérifier la structure de la table projects
 */

require_once __DIR__.'/config/Database.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();

    echo "✅ Connexion DB OK\n\n";

    // Vérifier la structure de la table projects
    $stmt = $db->query("DESCRIBE projects");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "📋 Colonnes de la table 'projects':\n";
    echo "================================\n\n";

    $hasPatternPath = false;
    $hasPatternUrl = false;

    foreach ($columns as $col) {
        echo "- {$col['Field']} ({$col['Type']})";
        if ($col['Null'] === 'YES') echo " NULL";
        echo "\n";

        if ($col['Field'] === 'pattern_path') $hasPatternPath = true;
        if ($col['Field'] === 'pattern_url') $hasPatternUrl = true;
    }

    echo "\n================================\n";
    echo "Résultat:\n";
    echo $hasPatternPath ? "✅ pattern_path existe\n" : "❌ pattern_path MANQUANT\n";
    echo $hasPatternUrl ? "✅ pattern_url existe\n" : "❌ pattern_url MANQUANT\n";

    if (!$hasPatternPath || !$hasPatternUrl) {
        echo "\n⚠️  MIGRATION SQL REQUISE!\n";
        echo "Exécutez: backend/database/migrations/add_pattern_import_columns.sql\n";
    } else {
        echo "\n✅ Base de données prête pour l'import patron!\n";
    }

} catch (Exception $e) {
    echo "❌ Erreur: ".$e->getMessage()."\n";
}
