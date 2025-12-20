<?php
/**
 * Script de vérification des crédits et paiements
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Vérification Crédits & Paiements</h1>";
echo "<style>
    body{font-family:monospace;padding:20px;background:#f5f5f5;}
    .ok{color:green;font-weight:bold;}
    .error{color:red;font-weight:bold;}
    .warning{color:orange;font-weight:bold;}
    .card{background:white;padding:15px;margin:10px 0;border-radius:5px;border-left:4px solid #ccc;}
    table{width:100%;border-collapse:collapse;background:white;}
    th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;}
    th{background:#6366f1;color:white;}
</style>";

$db = Database::getInstance()->getConnection();

// 1. Derniers paiements
echo "<div class='card'>";
echo "<h2>📋 Derniers paiements</h2>";
$stmt = $db->query("
    SELECT id, user_id, amount, status, payment_type,
           stripe_session_id, created_at, completed_at
    FROM payments
    ORDER BY id DESC
    LIMIT 5
");
$payments = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($payments) > 0) {
    echo "<table>";
    echo "<tr><th>ID</th><th>User</th><th>Montant</th><th>Type</th><th>Status</th><th>Créé</th><th>Complété</th></tr>";
    foreach ($payments as $p) {
        $statusClass = $p['status'] === 'completed' ? 'ok' : ($p['status'] === 'pending' ? 'warning' : 'error');
        echo "<tr>";
        echo "<td>{$p['id']}</td>";
        echo "<td>{$p['user_id']}</td>";
        echo "<td>{$p['amount']}€</td>";
        echo "<td>{$p['payment_type']}</td>";
        echo "<td class='{$statusClass}'>{$p['status']}</td>";
        echo "<td>{$p['created_at']}</td>";
        echo "<td>" . ($p['completed_at'] ?: '-') . "</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p class='warning'>Aucun paiement trouvé</p>";
}
echo "</div>";

// 2. Crédits par utilisateur
echo "<div class='card'>";
echo "<h2>💰 Crédits par utilisateur</h2>";
$stmt = $db->query("
    SELECT
        u.id,
        u.email,
        u.subscription_type,
        COALESCE(c.monthly_credits, 0) as monthly_credits,
        COALESCE(c.purchased_credits, 0) as purchased_credits,
        COALESCE(c.used_credits, 0) as used_credits,
        COALESCE(c.last_monthly_reset_at, '-') as last_reset
    FROM users u
    LEFT JOIN user_photo_credits c ON u.id = c.user_id
    ORDER BY u.id DESC
    LIMIT 10
");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($users) > 0) {
    echo "<table>";
    echo "<tr><th>ID</th><th>Email</th><th>Plan</th><th>Mensuel</th><th>Achetés</th><th>Utilisés</th><th>Total dispo</th></tr>";
    foreach ($users as $u) {
        $total = $u['monthly_credits'] + $u['purchased_credits'] - $u['used_credits'];
        echo "<tr>";
        echo "<td>{$u['id']}</td>";
        echo "<td>{$u['email']}</td>";
        echo "<td>{$u['subscription_type']}</td>";
        echo "<td>{$u['monthly_credits']}</td>";
        echo "<td class='ok'>{$u['purchased_credits']}</td>";
        echo "<td class='error'>{$u['used_credits']}</td>";
        echo "<td><strong>{$total}</strong></td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "<p class='warning'>Aucun utilisateur trouvé</p>";
}
echo "</div>";

// 3. Vérifier les paiements pending de crédits
echo "<div class='card'>";
echo "<h2>⚠️ Paiements de crédits en attente (pending)</h2>";
$stmt = $db->query("
    SELECT id, user_id, amount, payment_type, stripe_session_id, created_at
    FROM payments
    WHERE status = 'pending'
      AND payment_type IN ('credits_pack_50', 'credits_pack_150')
    ORDER BY id DESC
");
$pendingCredits = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($pendingCredits) > 0) {
    echo "<p class='warning'>⚠️ <strong>" . count($pendingCredits) . " paiement(s) de crédits non traité(s)</strong></p>";
    echo "<p>Ces paiements sont restés en 'pending' car le <strong>webhook Stripe</strong> n'a pas été appelé.</p>";
    echo "<table>";
    echo "<tr><th>ID</th><th>User</th><th>Type</th><th>Session ID</th><th>Créé</th></tr>";
    foreach ($pendingCredits as $p) {
        echo "<tr>";
        echo "<td>{$p['id']}</td>";
        echo "<td>{$p['user_id']}</td>";
        echo "<td>{$p['payment_type']}</td>";
        echo "<td><code>" . substr($p['stripe_session_id'], 0, 30) . "...</code></td>";
        echo "<td>{$p['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";

    echo "<hr>";
    echo "<h3>🔧 Solution</h3>";
    echo "<p>Le webhook Stripe ne fonctionne pas en local (localhost). Vous avez 2 options :</p>";
    echo "<ol>";
    echo "<li><strong>Manuel (pour test)</strong> : Cliquez ci-dessous pour traiter manuellement ces paiements</li>";
    echo "<li><strong>Production</strong> : Déployer sur un serveur public pour que Stripe puisse appeler le webhook</li>";
    echo "</ol>";

    // Bouton pour traiter manuellement
    if (isset($_GET['process'])) {
        echo "<div style='background:#d1fae5;padding:15px;border-radius:5px;margin:10px 0;'>";
        echo "<h3 class='ok'>✅ Traitement manuel en cours...</h3>";

        foreach ($pendingCredits as $p) {
            // Déterminer le nombre de crédits
            $credits = match($p['payment_type']) {
                'credits_pack_50' => 50,
                'credits_pack_150' => 150,
                default => 0
            };

            if ($credits > 0) {
                // Ajouter les crédits
                $stmt = $db->prepare("
                    INSERT INTO user_photo_credits (user_id, purchased_credits, used_credits, monthly_credits)
                    VALUES (?, ?, 0, 0)
                    ON DUPLICATE KEY UPDATE
                        purchased_credits = purchased_credits + ?
                ");
                $stmt->execute([$p['user_id'], $credits, $credits]);

                // Marquer le paiement comme complété
                $stmt = $db->prepare("
                    UPDATE payments
                    SET status = 'completed', completed_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$p['id']]);

                echo "<p>✅ Payment #{$p['id']} : <strong>+{$credits} crédits</strong> ajoutés pour user {$p['user_id']}</p>";
            }
        }

        echo "<p><a href='?'>🔄 Rafraîchir la page</a></p>";
        echo "</div>";
    } else {
        echo "<p><a href='?process=1' style='background:#6366f1;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;display:inline-block;margin:10px 0;'>▶️ Traiter manuellement ces paiements</a></p>";
    }
} else {
    echo "<p class='ok'>✅ Aucun paiement de crédits en attente</p>";
}
echo "</div>";
?>
