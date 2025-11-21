<?php
/**
 * @file check_database_status.php
 * @brief Script de vérification de l'état complet de la base de données
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création du script de vérification
 */

// [AI:Claude] Charger l'autoloader de Composer
require_once __DIR__.'/vendor/autoload.php';

// [AI:Claude] Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__.'/config');
$dotenv->load();

use App\Config\Database;

echo "=== VÉRIFICATION COMPLÈTE DE LA BASE DE DONNÉES ===\n\n";

try {
    $db = Database::getInstance()->getConnection();
    echo "✅ Connexion à la base de données réussie\n\n";

    // Tables principales
    echo "--- TABLES PRINCIPALES ---\n";
    $mainTables = [
        'users',
        'patterns',
        'pattern_templates',
        'pattern_categories',
        'payments',
        'api_logs',
        'password_resets'
    ];

    foreach ($mainTables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->rowCount() > 0;

        if ($exists) {
            $countStmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "✅ $table ($count enregistrement(s))\n";
        } else {
            echo "❌ $table (manquante)\n";
        }
    }

    // Tables du système de projets
    echo "\n--- SYSTÈME DE PROJETS (CROCHET HUB) ---\n";
    $projectTables = [
        'projects',
        'project_rows',
        'project_sessions',
        'project_stats'
    ];

    $projectSystemComplete = true;
    foreach ($projectTables as $table) {
        $stmt = $db->query("SHOW TABLES LIKE '$table'");
        $exists = $stmt->rowCount() > 0;

        if ($exists) {
            $countStmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
            echo "✅ $table ($count enregistrement(s))\n";
        } else {
            echo "❌ $table (manquante)\n";
            $projectSystemComplete = false;
        }
    }

    // Vérifier les vues
    echo "\n--- VUES ---\n";
    $views = ['v_projects_with_stats', 'v_project_sessions_formatted'];
    foreach ($views as $view) {
        $stmt = $db->query("SHOW FULL TABLES WHERE Table_Type = 'VIEW' AND Tables_in_patron_maker = '$view'");
        $exists = $stmt->rowCount() > 0;
        echo ($exists ? "✅" : "❌")." $view\n";
    }

    // Vérifier les triggers
    echo "\n--- TRIGGERS ---\n";
    $triggers = ['after_project_row_insert', 'after_project_completed'];
    foreach ($triggers as $trigger) {
        $stmt = $db->query("SHOW TRIGGERS WHERE `Trigger` = '$trigger'");
        $exists = $stmt->rowCount() > 0;
        echo ($exists ? "✅" : "❌")." $trigger\n";
    }

    // Vérifier la structure critique
    echo "\n--- STRUCTURE CRITIQUE ---\n";

    // Vérifier pattern_id nullable dans projects
    $stmt = $db->query("SHOW COLUMNS FROM projects WHERE Field = 'pattern_id'");
    if ($stmt->rowCount() > 0) {
        $col = $stmt->fetch(PDO::FETCH_ASSOC);
        $nullable = $col['Null'] === 'YES' ? '✅' : '❌';
        echo "$nullable projects.pattern_id est ".($col['Null'] === 'YES' ? 'NULLABLE (correct)' : 'NOT NULL (problème!)')." - Permet tracker sans patron\n";
    }

    // Statistiques globales
    echo "\n--- STATISTIQUES GLOBALES ---\n";

    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "👥 Utilisateurs : $userCount\n";

    $stmt = $db->query("SELECT COUNT(*) as count FROM patterns");
    $patternCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "📄 Patrons générés : $patternCount\n";

    $stmt = $db->query("SELECT COUNT(*) as count FROM pattern_templates");
    $templateCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "📚 Patrons de référence : $templateCount\n";

    $stmt = $db->query("SELECT COUNT(*) as count FROM pattern_categories");
    $categoryCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "🏷️ Catégories : $categoryCount\n";

    if ($projectSystemComplete) {
        $stmt = $db->query("SELECT COUNT(*) as count FROM projects");
        $projectCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "🧶 Projets trackés : $projectCount\n";

        $stmt = $db->query("SELECT COUNT(*) as count FROM project_rows");
        $rowCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "📊 Rangs enregistrés : $rowCount\n";
    }

    echo "\n=== RÉSUMÉ ===\n";

    if (!$projectSystemComplete) {
        echo "\n⚠️  SYSTÈME DE PROJETS NON INSTALLÉ\n";
        echo "Importer le fichier : database/add_projects_system.sql\n\n";
        echo "Via phpMyAdmin :\n";
        echo "1. Ouvrir phpMyAdmin (http://localhost/phpmyadmin)\n";
        echo "2. Sélectionner la base 'patron_maker'\n";
        echo "3. Onglet 'Importer'\n";
        echo "4. Choisir database/add_projects_system.sql\n";
        echo "5. Cliquer sur 'Exécuter'\n\n";
    } else {
        echo "\n✅ SYSTÈME COMPLET ET OPÉRATIONNEL\n";
        echo "L'application est prête à être testée !\n\n";
    }

} catch (Exception $e) {
    echo "❌ Erreur : ".$e->getMessage()."\n";
    echo "\nVérifiez que :\n";
    echo "1. WAMP est démarré\n";
    echo "2. Le fichier backend/config/.env existe et est configuré\n";
    echo "3. La base de données 'patron_maker' existe\n";
}
