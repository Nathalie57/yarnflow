<?php
/**
 * Migration : Mettre à jour l'ENUM payment_type avec toutes les valeurs
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔄 Migration : payment_type ENUM</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;} .error{color:red;} .warning{color:orange;}</style>";

try {
    $db = Database::getInstance()->getConnection();

    echo "<h2>📋 Valeurs actuelles de l'ENUM</h2>";
    $stmt = $db->query("
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'patron_maker'
        AND TABLE_NAME = 'payments'
        AND COLUMN_NAME = 'payment_type'
    ");
    $currentEnum = $stmt->fetchColumn();
    echo "<p><code>$currentEnum</code></p>";

    echo "<h2>🔧 Mise à jour de l'ENUM</h2>";
    echo "<p class='warning'>➡️ Ajout de toutes les valeurs manquantes...</p>";

    $db->exec("
        ALTER TABLE payments
        MODIFY COLUMN payment_type ENUM(
            'pattern',
            'subscription_monthly',
            'subscription_yearly',
            'subscription_plus',
            'subscription_plus_annual',
            'subscription_pro',
            'subscription_pro_annual',
            'subscription_early_bird',
            'credits_pack_50',
            'credits_pack_150',
            'photo_credits'
        ) NOT NULL DEFAULT 'pattern'
    ");

    echo "<p class='ok'>✅ ENUM mis à jour avec succès !</p>";

    echo "<h2>✅ Valeurs disponibles maintenant</h2>";
    echo "<ul>";
    echo "<li>pattern</li>";
    echo "<li>subscription_monthly (legacy)</li>";
    echo "<li>subscription_yearly (legacy)</li>";
    echo "<li class='ok'><strong>subscription_plus</strong> ← nouveau</li>";
    echo "<li class='ok'><strong>subscription_plus_annual</strong> ← nouveau</li>";
    echo "<li class='ok'><strong>subscription_pro</strong> ← nouveau</li>";
    echo "<li class='ok'><strong>subscription_pro_annual</strong> ← nouveau</li>";
    echo "<li class='ok'><strong>subscription_early_bird</strong> ← nouveau</li>";
    echo "<li class='ok'><strong>credits_pack_50</strong> ← nouveau</li>";
    echo "<li class='ok'><strong>credits_pack_150</strong> ← nouveau</li>";
    echo "<li>photo_credits</li>";
    echo "</ul>";

    echo "<hr>";
    echo "<p class='ok'><strong>✅ Migration terminée !</strong></p>";
    echo "<p>Les prochains paiements de crédits seront correctement enregistrés.</p>";
    echo "<p><a href='debug_payment_type.php'>➡️ Retour au debug</a></p>";

} catch (Exception $e) {
    echo "<p class='error'>❌ Erreur : " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
