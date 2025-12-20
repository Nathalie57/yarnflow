<?php
/**
 * Migration : Ajouter la colonne completed_at à la table payments
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔄 Migration : completed_at</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;} .error{color:red;}</style>";

try {
    $db = Database::getInstance()->getConnection();

    // Vérifier si la colonne existe déjà
    $stmt = $db->query("SHOW COLUMNS FROM payments LIKE 'completed_at'");
    $exists = $stmt->fetch();

    if ($exists) {
        echo "<p class='ok'>✅ La colonne 'completed_at' existe déjà</p>";
    } else {
        echo "<p>➡️ Ajout de la colonne 'completed_at'...</p>";
        $db->exec("ALTER TABLE payments ADD COLUMN completed_at DATETIME DEFAULT NULL AFTER status");
        echo "<p class='ok'>✅ Colonne 'completed_at' ajoutée avec succès</p>";
    }

    // Ajouter les index
    echo "<p>➡️ Ajout des index...</p>";

    try {
        $db->exec("CREATE INDEX idx_payments_status ON payments(status)");
        echo "<p class='ok'>✅ Index idx_payments_status créé</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "<p class='ok'>✅ Index idx_payments_status existe déjà</p>";
        } else {
            throw $e;
        }
    }

    try {
        $db->exec("CREATE INDEX idx_payments_completed_at ON payments(completed_at)");
        echo "<p class='ok'>✅ Index idx_payments_completed_at créé</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "<p class='ok'>✅ Index idx_payments_completed_at existe déjà</p>";
        } else {
            throw $e;
        }
    }

    echo "<hr>";
    echo "<p class='ok'><strong>✅ Migration terminée avec succès !</strong></p>";
    echo "<p><a href='check_credits.php'>➡️ Aller vérifier les crédits</a></p>";

} catch (Exception $e) {
    echo "<p class='error'>❌ Erreur : " . $e->getMessage() . "</p>";
}
?>
