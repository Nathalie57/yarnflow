<?php
/**
 * Script de vérification du schéma de base de données
 * Détecte les tables et colonnes manquantes pour la v0.15.0
 */

// Connexion à la base de données
$db = new PDO(
    "mysql:host=127.0.0.1;port=3306;dbname=patron_maker;charset=utf8mb4",
    "root",
    "",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "═══════════════════════════════════════════════════════════════\n";
echo "  🔍 VÉRIFICATION SCHÉMA BASE DE DONNÉES - YarnFlow v0.15.0\n";
echo "═══════════════════════════════════════════════════════════════\n\n";

$errors = [];
$warnings = [];
$success = [];

// ============================================================================
// FONCTION HELPER
// ============================================================================

function checkTable($db, $tableName) {
    $stmt = $db->prepare("SHOW TABLES LIKE ?");
    $stmt->execute([$tableName]);
    return $stmt->rowCount() > 0;
}

function checkColumn($db, $tableName, $columnName) {
    $stmt = $db->prepare("SHOW COLUMNS FROM `$tableName` LIKE ?");
    $stmt->execute([$columnName]);
    return $stmt->rowCount() > 0;
}

function getColumnType($db, $tableName, $columnName) {
    $stmt = $db->prepare("SHOW COLUMNS FROM `$tableName` LIKE ?");
    $stmt->execute([$columnName]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ? $result['Type'] : null;
}

// ============================================================================
// VÉRIFICATIONS DES TABLES
// ============================================================================

echo "📋 VÉRIFICATION DES TABLES\n";
echo "─────────────────────────────────────────────────────────────\n";

$requiredTables = [
    'users' => 'Table des utilisateurs',
    'projects' => 'Table des projets',
    'project_rows' => 'Table des rangs de projets',
    'project_sections' => 'Table des sections de projets',
    'project_tags' => 'Table des tags personnalisés (v0.15.0)',
    'user_photos' => 'Table des photos utilisateurs',
    'user_photo_credits' => 'Table des crédits photos',
    'payments' => 'Table des paiements',
    'waitlist' => 'Table de la waitlist',
];

foreach ($requiredTables as $table => $description) {
    if (checkTable($db, $table)) {
        $success[] = "✅ Table `$table` existe ($description)";
    } else {
        $errors[] = "❌ Table `$table` MANQUANTE ! ($description)";
    }
}

echo implode("\n", $success) . "\n";
if (!empty($errors)) {
    echo "\n" . implode("\n", $errors) . "\n";
}

// ============================================================================
// VÉRIFICATIONS DES COLONNES - PROJECTS
// ============================================================================

echo "\n\n📊 VÉRIFICATION DES COLONNES - TABLE PROJECTS\n";
echo "─────────────────────────────────────────────────────────────\n";

$projectColumns = [
    'id' => 'ID du projet',
    'user_id' => 'ID utilisateur',
    'name' => 'Nom du projet',
    'type' => 'Type de projet',
    'current_row' => 'Compteur de rangs actuel',
    'total_rows' => 'Total de rangs prévus',
    'current_section_id' => 'Section en cours',
    'is_favorite' => 'Marqueur favori (v0.15.0)',
    'status' => 'Statut du projet',
    'created_at' => 'Date de création',
    'updated_at' => 'Date de mise à jour',
];

$projectErrors = [];
$projectSuccess = [];

foreach ($projectColumns as $column => $description) {
    if (checkColumn($db, 'projects', $column)) {
        $projectSuccess[] = "  ✅ Colonne `$column` ($description)";
    } else {
        $projectErrors[] = "  ❌ Colonne `$column` MANQUANTE ! ($description)";
    }
}

echo implode("\n", $projectSuccess) . "\n";
if (!empty($projectErrors)) {
    echo "\n" . implode("\n", $projectErrors) . "\n";
    $errors = array_merge($errors, $projectErrors);
}

// ============================================================================
// VÉRIFICATIONS DES COLONNES - USER_PHOTOS
// ============================================================================

echo "\n\n📸 VÉRIFICATION DES COLONNES - TABLE USER_PHOTOS\n";
echo "─────────────────────────────────────────────────────────────\n";

$photoColumns = [
    'id' => 'ID de la photo',
    'user_id' => 'ID utilisateur',
    'project_id' => 'ID projet',
    'parent_photo_id' => 'ID photo parente (variations)',
    'file_path' => 'Chemin du fichier',
    'style_code' => 'Code du style appliqué',
    'status' => 'Statut de la photo',
    'satisfaction_rating' => 'Note de satisfaction 1-5 (v0.15.0)',
    'feedback_comment' => 'Commentaire optionnel (v0.15.0)',
    'feedback_submitted_at' => 'Date du feedback (v0.15.0)',
    'created_at' => 'Date de création',
];

$photoErrors = [];
$photoSuccess = [];

foreach ($photoColumns as $column => $description) {
    if (checkColumn($db, 'user_photos', $column)) {
        $photoSuccess[] = "  ✅ Colonne `$column` ($description)";
    } else {
        $photoErrors[] = "  ❌ Colonne `$column` MANQUANTE ! ($description)";
    }
}

echo implode("\n", $photoSuccess) . "\n";
if (!empty($photoErrors)) {
    echo "\n" . implode("\n", $photoErrors) . "\n";
    $errors = array_merge($errors, $photoErrors);
}

// ============================================================================
// VÉRIFICATIONS DES COLONNES - PAYMENTS
// ============================================================================

echo "\n\n💳 VÉRIFICATION DES COLONNES - TABLE PAYMENTS\n";
echo "─────────────────────────────────────────────────────────────\n";

$paymentColumns = [
    'id' => 'ID du paiement',
    'user_id' => 'ID utilisateur',
    'stripe_payment_intent_id' => 'ID Stripe',
    'amount' => 'Montant',
    'currency' => 'Devise',
    'payment_type' => 'Type de paiement',
    'status' => 'Statut',
    'created_at' => 'Date de création',
    'completed_at' => 'Date de complétion (v0.15.0)',
];

$paymentErrors = [];
$paymentSuccess = [];

foreach ($paymentColumns as $column => $description) {
    if (checkColumn($db, 'payments', $column)) {
        $paymentSuccess[] = "  ✅ Colonne `$column` ($description)";

        // Vérifier le type ENUM de payment_type
        if ($column === 'payment_type') {
            $type = getColumnType($db, 'payments', 'payment_type');
            if (strpos($type, 'photo_credits') !== false) {
                $paymentSuccess[] = "     ✅ ENUM payment_type contient 'photo_credits'";
            } else {
                $paymentErrors[] = "     ❌ ENUM payment_type ne contient PAS 'photo_credits' ! Type actuel: $type";
            }
        }
    } else {
        $paymentErrors[] = "  ❌ Colonne `$column` MANQUANTE ! ($description)";
    }
}

echo implode("\n", $paymentSuccess) . "\n";
if (!empty($paymentErrors)) {
    echo "\n" . implode("\n", $paymentErrors) . "\n";
    $errors = array_merge($errors, $paymentErrors);
}

// ============================================================================
// VÉRIFICATIONS DES COLONNES - PROJECT_ROWS
// ============================================================================

echo "\n\n📏 VÉRIFICATION DES COLONNES - TABLE PROJECT_ROWS\n";
echo "─────────────────────────────────────────────────────────────\n";

$rowColumns = [
    'id' => 'ID du rang',
    'project_id' => 'ID projet',
    'section_id' => 'ID section (optionnel)',
    'row_num' => 'Numéro du rang',
    'stitch_count' => 'Nombre de mailles',
    'duration' => 'Durée',
    'notes' => 'Notes',
    'completed_at' => 'Date de complétion',
    'created_at' => 'Date de création',
];

$rowErrors = [];
$rowSuccess = [];

foreach ($rowColumns as $column => $description) {
    if (checkColumn($db, 'project_rows', $column)) {
        $rowSuccess[] = "  ✅ Colonne `$column` ($description)";
    } else {
        $rowErrors[] = "  ❌ Colonne `$column` MANQUANTE ! ($description)";
    }
}

echo implode("\n", $rowSuccess) . "\n";
if (!empty($rowErrors)) {
    echo "\n" . implode("\n", $rowErrors) . "\n";
    $errors = array_merge($errors, $rowErrors);
}

// ============================================================================
// STATISTIQUES
// ============================================================================

echo "\n\n📊 STATISTIQUES DE LA BASE DE DONNÉES\n";
echo "─────────────────────────────────────────────────────────────\n";

// Nombre d'utilisateurs
$stmt = $db->query("SELECT COUNT(*) as count FROM users");
$userCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "👥 Utilisateurs: $userCount\n";

// Nombre de projets
$stmt = $db->query("SELECT COUNT(*) as count FROM projects");
$projectCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "📦 Projets: $projectCount\n";

// Nombre de projets favoris
if (checkColumn($db, 'projects', 'is_favorite')) {
    $stmt = $db->query("SELECT COUNT(*) as count FROM projects WHERE is_favorite = 1");
    $favCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "⭐ Projets favoris: $favCount\n";
}

// Nombre de tags
if (checkTable($db, 'project_tags')) {
    $stmt = $db->query("SELECT COUNT(*) as count FROM project_tags");
    $tagCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "🏷️  Tags: $tagCount\n";

    // Top 5 tags
    $stmt = $db->query("SELECT tag_name, COUNT(*) as count FROM project_tags GROUP BY tag_name ORDER BY count DESC LIMIT 5");
    $topTags = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($topTags)) {
        echo "   Top tags: ";
        echo implode(', ', array_map(fn($t) => "{$t['tag_name']} ({$t['count']})", $topTags));
        echo "\n";
    }
}

// Nombre de photos
if (checkTable($db, 'user_photos')) {
    $stmt = $db->query("SELECT COUNT(*) as count FROM user_photos");
    $photoCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "📸 Photos: $photoCount\n";

    // Photos avec feedback
    if (checkColumn($db, 'user_photos', 'satisfaction_rating')) {
        $stmt = $db->query("SELECT COUNT(*) as count FROM user_photos WHERE satisfaction_rating IS NOT NULL");
        $feedbackCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        echo "⭐ Photos avec feedback: $feedbackCount\n";

        // Note moyenne
        $stmt = $db->query("SELECT AVG(satisfaction_rating) as avg FROM user_photos WHERE satisfaction_rating IS NOT NULL");
        $avgRating = $stmt->fetch(PDO::FETCH_ASSOC)['avg'];
        if ($avgRating) {
            echo "   Note moyenne: " . number_format($avgRating, 2) . "/5\n";
        }
    }
}

// Nombre de paiements
if (checkTable($db, 'payments')) {
    $stmt = $db->query("SELECT COUNT(*) as count FROM payments");
    $paymentCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "💰 Paiements: $paymentCount\n";

    // Paiements complétés
    $stmt = $db->query("SELECT COUNT(*) as count FROM payments WHERE status = 'completed'");
    $completedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    echo "   Complétés: $completedCount\n";
}

// ============================================================================
// RÉSUMÉ FINAL
// ============================================================================

echo "\n\n═══════════════════════════════════════════════════════════════\n";
echo "  📊 RÉSUMÉ DE LA VÉRIFICATION\n";
echo "═══════════════════════════════════════════════════════════════\n";

$totalErrors = count($errors);
$totalWarnings = count($warnings);

if ($totalErrors === 0 && $totalWarnings === 0) {
    echo "✅ TOUT EST OK ! Votre base de données est à jour pour la v0.15.0\n";
} else {
    if ($totalErrors > 0) {
        echo "❌ $totalErrors ERREUR(S) DÉTECTÉE(S)\n";
        echo "\nACTION REQUISE:\n";
        echo "1. Exécutez le script de migration:\n";
        echo "   mysql -u root -p patron_maker < database/MIGRATION_PRODUCTION_v0.15.0.sql\n\n";
        echo "2. Ou importez le fichier via phpMyAdmin\n\n";
    }
    if ($totalWarnings > 0) {
        echo "⚠️  $totalWarnings AVERTISSEMENT(S)\n";
    }
}

echo "\n═══════════════════════════════════════════════════════════════\n";
