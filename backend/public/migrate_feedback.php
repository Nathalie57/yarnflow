<?php
/**
 * Migration: Fix photo_feedback table structure
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/../config/Database.php';

echo "<h1>Migration photo_feedback</h1>";

try {
    $db = \App\Config\Database::getInstance()->getConnection();

    echo "<h2>1. Drop foreign key constraint from credit_refunds</h2>";
    try {
        $db->exec("ALTER TABLE credit_refunds DROP FOREIGN KEY credit_refunds_ibfk_3");
        echo "✅ Foreign key supprimée<br>";
    } catch (\Exception $e) {
        echo "⚠️ Foreign key n'existe pas ou déjà supprimée<br>";
    }

    echo "<h2>2. Drop old photo_feedback table</h2>";
    $db->exec("DROP TABLE IF EXISTS photo_feedback");
    echo "✅ Table supprimée<br>";

    echo "<h2>3. Create new table with star rating</h2>";
    $sql = "CREATE TABLE IF NOT EXISTS photo_feedback (
        id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        photo_id INT UNSIGNED NOT NULL,
        rating TINYINT UNSIGNED NOT NULL COMMENT 'Note de 1 à 5 étoiles',
        comment TEXT DEFAULT NULL COMMENT 'Commentaire optionnel',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE CASCADE,

        INDEX idx_user_feedback (user_id, created_at DESC),
        INDEX idx_photo_feedback (photo_id),
        INDEX idx_rating (rating, created_at DESC),

        UNIQUE KEY unique_photo_feedback (photo_id),

        CHECK (rating >= 1 AND rating <= 5)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notes et commentaires sur photos IA générées (1-5 étoiles)'";

    $db->exec($sql);
    echo "✅ Table créée<br>";

    echo "<h2>4. Verify structure</h2>";
    $stmt = $db->query("DESCRIBE photo_feedback");
    echo "<pre>";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    echo "</pre>";

    echo "<h2>5. Test INSERT</h2>";
    $testQuery = "INSERT INTO photo_feedback (user_id, photo_id, rating, comment) VALUES (1, 221, 5, 'Test migration')";
    $db->exec($testQuery);
    echo "✅ INSERT réussi<br>";

    $db->exec("DELETE FROM photo_feedback WHERE comment = 'Test migration'");
    echo "✅ Nettoyage OK<br>";

    echo "<h2 style='color: green;'>✅ Migration terminée avec succès !</h2>";

} catch (\Exception $e) {
    echo "<h2 style='color: red;'>❌ Erreur</h2>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
