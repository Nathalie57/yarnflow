<?php
/**
 * Debug : Vérifier les payment_type exacts
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Debug Payment Types</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;} .error{color:red;} .warning{color:orange;} table{width:100%;border-collapse:collapse;background:white;} th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;} th{background:#6366f1;color:white;}</style>";

$db = Database::getInstance()->getConnection();

// Vérifier user 8
echo "<h2>👤 Utilisateur 8</h2>";
$stmt = $db->prepare("SELECT id, email, subscription_type FROM users WHERE id = 8");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "<p>Email : {$user['email']}</p>";
    echo "<p>Plan : {$user['subscription_type']}</p>";
} else {
    echo "<p class='error'>❌ Utilisateur 8 introuvable</p>";
}

// Vérifier les crédits de user 8
echo "<h2>💰 Crédits de l'utilisateur 8</h2>";
$stmt = $db->prepare("SELECT * FROM user_photo_credits WHERE user_id = 8");
$stmt->execute();
$credits = $stmt->fetch(PDO::FETCH_ASSOC);

if ($credits) {
    echo "<table>";
    foreach ($credits as $key => $value) {
        echo "<tr><th>$key</th><td>" . ($value ?? 'NULL') . "</td></tr>";
    }
    echo "</table>";
} else {
    echo "<p class='warning'>⚠️ Aucune ligne dans user_photo_credits pour user 8</p>";
    echo "<p>➡️ Initialisation...</p>";

    $db->prepare("
        INSERT INTO user_photo_credits (user_id, monthly_credits, purchased_credits, used_credits)
        VALUES (8, 5, 0, 0)
    ")->execute();

    echo "<p class='ok'>✅ Crédits initialisés pour user 8</p>";
}

// Vérifier les paiements de user 8
echo "<h2>📋 Paiements de l'utilisateur 8</h2>";
$stmt = $db->prepare("SELECT * FROM payments WHERE user_id = 8 ORDER BY id DESC");
$stmt->execute();
$payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($payments) > 0) {
    echo "<table>";
    echo "<tr><th>ID</th><th>Montant</th><th>Status</th><th>Payment Type (EXACT)</th><th>Session ID</th><th>Créé</th></tr>";
    foreach ($payments as $p) {
        echo "<tr>";
        echo "<td>{$p['id']}</td>";
        echo "<td>{$p['amount']}€</td>";
        echo "<td>{$p['status']}</td>";
        echo "<td><code style='background:#fff3cd;padding:2px 5px;'>" . htmlspecialchars($p['payment_type']) . "</code></td>";
        echo "<td><small>" . substr($p['stripe_session_id'], 0, 30) . "...</small></td>";
        echo "<td>{$p['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p>Aucun paiement</p>";
}

// Traitement manuel si demandé
if (isset($_GET['process'])) {
    echo "<hr>";
    echo "<h2 class='ok'>🔧 Traitement manuel des paiements</h2>";

    foreach ($payments as $p) {
        if ($p['status'] !== 'pending') {
            continue;
        }

        // Déterminer le montant de crédits
        $credits = 0;
        if ($p['amount'] == 4.99) {
            $credits = 50;
        } elseif ($p['amount'] == 9.99) {
            $credits = 150;
        }

        if ($credits > 0) {
            // Ajouter les crédits
            $stmt = $db->prepare("
                UPDATE user_photo_credits
                SET purchased_credits = purchased_credits + ?
                WHERE user_id = ?
            ");
            $stmt->execute([$credits, 8]);

            // Marquer comme complété
            $stmt = $db->prepare("
                UPDATE payments
                SET status = 'completed', completed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$p['id']]);

            echo "<p class='ok'>✅ Paiement #{$p['id']} : +{$credits} crédits ajoutés</p>";
        }
    }

    echo "<p><a href='?'>🔄 Rafraîchir</a></p>";
} else {
    echo "<hr>";
    echo "<p><a href='?process=1' style='background:#6366f1;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;display:inline-block;'>▶️ Traiter manuellement ces paiements</a></p>";
}
?>
