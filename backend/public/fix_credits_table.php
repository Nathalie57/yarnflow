<?php
/**
 * Migration : Vérifier et corriger la structure de user_photo_credits
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔄 Migration : user_photo_credits</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;} .error{color:red;} .warning{color:orange;}</style>";

try {
    $db = Database::getInstance()->getConnection();

    // Vérifier la structure actuelle
    echo "<h2>📋 Structure actuelle</h2>";
    $stmt = $db->query("SHOW COLUMNS FROM user_photo_credits");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "<ul>";
    foreach ($columns as $col) {
        echo "<li>$col</li>";
    }
    echo "</ul>";

    // Liste des colonnes requises
    $requiredColumns = [
        'user_id' => 'INT NOT NULL',
        'monthly_credits' => 'INT DEFAULT 0',
        'purchased_credits' => 'INT DEFAULT 0',
        'used_credits' => 'INT DEFAULT 0',
        'last_monthly_reset_at' => 'DATETIME DEFAULT NULL',
        'last_purchase_at' => 'DATETIME DEFAULT NULL'
    ];

    echo "<h2>🔧 Ajout des colonnes manquantes</h2>";

    foreach ($requiredColumns as $colName => $colDef) {
        if (!in_array($colName, $columns)) {
            echo "<p class='warning'>➡️ Ajout de la colonne '$colName'...</p>";
            $db->exec("ALTER TABLE user_photo_credits ADD COLUMN $colName $colDef");
            echo "<p class='ok'>✅ Colonne '$colName' ajoutée</p>";
        } else {
            echo "<p class='ok'>✅ Colonne '$colName' existe déjà</p>";
        }
    }

    // Vérifier/ajouter la clé primaire
    echo "<h2>🔑 Vérification de la clé primaire</h2>";
    $stmt = $db->query("SHOW KEYS FROM user_photo_credits WHERE Key_name = 'PRIMARY'");
    $hasPrimary = $stmt->fetch();

    if (!$hasPrimary) {
        echo "<p class='warning'>➡️ Ajout de la clé primaire sur user_id...</p>";
        try {
            $db->exec("ALTER TABLE user_photo_credits ADD PRIMARY KEY (user_id)");
            echo "<p class='ok'>✅ Clé primaire ajoutée</p>";
        } catch (PDOException $e) {
            echo "<p class='error'>❌ Impossible d'ajouter la clé primaire : " . $e->getMessage() . "</p>";
            echo "<p class='warning'>⚠️ Il y a peut-être des doublons. Nettoyage...</p>";

            // Supprimer les doublons en gardant le plus récent
            $db->exec("
                DELETE t1 FROM user_photo_credits t1
                INNER JOIN user_photo_credits t2
                WHERE t1.user_id = t2.user_id AND t1.id < t2.id
            ");

            // Réessayer
            $db->exec("ALTER TABLE user_photo_credits ADD PRIMARY KEY (user_id)");
            echo "<p class='ok'>✅ Clé primaire ajoutée après nettoyage</p>";
        }
    } else {
        echo "<p class='ok'>✅ Clé primaire existe déjà</p>";
    }

    // Initialiser les crédits mensuels pour les utilisateurs existants
    echo "<h2>🎁 Initialisation des crédits mensuels</h2>";
    $db->exec("
        INSERT INTO user_photo_credits (user_id, monthly_credits, purchased_credits, used_credits)
        SELECT id,
            CASE
                WHEN subscription_type = 'free' THEN 5
                WHEN subscription_type LIKE '%plus%' THEN 15
                WHEN subscription_type LIKE '%pro%' OR subscription_type = 'early_bird' THEN 30
                ELSE 5
            END,
            0,
            0
        FROM users
        WHERE id NOT IN (SELECT user_id FROM user_photo_credits)
    ");
    $count = $db->exec("SELECT ROW_COUNT()");
    echo "<p class='ok'>✅ Crédits initialisés pour les nouveaux utilisateurs</p>";

    echo "<hr>";
    echo "<p class='ok'><strong>✅ Migration terminée avec succès !</strong></p>";
    echo "<p><a href='check_credits.php'>➡️ Aller vérifier les crédits</a></p>";

} catch (Exception $e) {
    echo "<p class='error'>❌ Erreur : " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
