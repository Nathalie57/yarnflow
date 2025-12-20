<?php
/**
 * Test debug feedback API
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/../config/Database.php';

echo "<h1>Test photo_feedback</h1>";

try {
    $db = \App\Config\Database::getInstance()->getConnection();

    echo "<h2>1. Table existe ?</h2>";
    $stmt = $db->query("SHOW TABLES LIKE 'photo_feedback'");
    $exists = $stmt->fetch();
    echo $exists ? "✅ OUI<br>" : "❌ NON<br>";

    if ($exists) {
        echo "<h2>2. Structure de la table</h2>";
        $stmt = $db->query("DESCRIBE photo_feedback");
        echo "<pre>";
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
        echo "</pre>";

        echo "<h2>3. Test INSERT</h2>";
        $testQuery = "INSERT INTO photo_feedback (user_id, photo_id, rating, comment) VALUES (1, 221, 5, 'Test')";
        echo "Query: $testQuery<br>";

        try {
            $db->exec($testQuery);
            echo "✅ INSERT réussi<br>";

            // Nettoyage
            $db->exec("DELETE FROM photo_feedback WHERE comment = 'Test'");
            echo "✅ Nettoyage OK<br>";
        } catch (\Exception $e) {
            echo "❌ Erreur INSERT: " . $e->getMessage() . "<br>";
        }
    }

} catch (\Exception $e) {
    echo "<h2>❌ Erreur</h2>";
    echo $e->getMessage();
}
