<?php
/**
 * Activer manuellement l'abonnement après paiement
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔄 Activation manuelle de l'abonnement</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;} .error{color:red;} .warning{color:orange;} table{width:100%;border-collapse:collapse;background:white;} th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;} th{background:#6366f1;color:white;}</style>";

$db = Database::getInstance()->getConnection();

// Vérifier user 8
echo "<h2>👤 Utilisateur 8</h2>";
$stmt = $db->prepare("SELECT id, email, subscription_type, subscription_expires_at FROM users WHERE id = 8");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo "<p>Email : <strong>{$user['email']}</strong></p>";
    echo "<p>Plan actuel : <strong>{$user['subscription_type']}</strong></p>";
    echo "<p>Expire le : <strong>" . ($user['subscription_expires_at'] ?? 'N/A') . "</strong></p>";
} else {
    echo "<p class='error'>❌ Utilisateur 8 introuvable</p>";
    exit;
}

// Vérifier les paiements d'abonnement pending
echo "<h2>📋 Paiements d'abonnement en attente</h2>";
$stmt = $db->prepare("
    SELECT id, amount, payment_type, stripe_session_id, created_at
    FROM payments
    WHERE user_id = 8
      AND status = 'pending'
      AND payment_type LIKE 'subscription_%'
    ORDER BY id DESC
");
$stmt->execute();
$pendingSubscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (count($pendingSubscriptions) > 0) {
    echo "<p class='warning'>⚠️ <strong>" . count($pendingSubscriptions) . " paiement(s) d'abonnement non traité(s)</strong></p>";

    echo "<table>";
    echo "<tr><th>ID</th><th>Type</th><th>Montant</th><th>Session ID</th><th>Créé</th></tr>";
    foreach ($pendingSubscriptions as $p) {
        echo "<tr>";
        echo "<td>{$p['id']}</td>";
        echo "<td><strong>{$p['payment_type']}</strong></td>";
        echo "<td>{$p['amount']}€</td>";
        echo "<td><small>" . substr($p['stripe_session_id'], 0, 30) . "...</small></td>";
        echo "<td>{$p['created_at']}</td>";
        echo "</tr>";
    }
    echo "</table>";

    // Bouton pour activer
    if (isset($_GET['activate'])) {
        echo "<hr>";
        echo "<h2 class='ok'>🚀 Activation de l'abonnement</h2>";

        foreach ($pendingSubscriptions as $p) {
            $paymentType = $p['payment_type'];

            // Déterminer le nouveau type d'abonnement et la durée
            $subscriptionType = match($paymentType) {
                'subscription_plus' => 'plus',
                'subscription_plus_annual' => 'plus_annual',
                'subscription_pro' => 'pro',
                'subscription_pro_annual' => 'pro_annual',
                'subscription_early_bird' => 'early_bird',
                default => null
            };

            $duration = match($paymentType) {
                'subscription_plus' => '+1 month',
                'subscription_plus_annual' => '+1 year',
                'subscription_pro' => '+1 month',
                'subscription_pro_annual' => '+1 year',
                'subscription_early_bird' => '+12 months',
                default => '+1 month'
            };

            if ($subscriptionType) {
                $expiresAt = date('Y-m-d H:i:s', strtotime($duration));

                // Mettre à jour l'utilisateur
                $stmt = $db->prepare("
                    UPDATE users
                    SET subscription_type = ?,
                        subscription_expires_at = ?
                    WHERE id = 8
                ");
                $stmt->execute([$subscriptionType, $expiresAt]);

                // Marquer le paiement comme complété
                $stmt = $db->prepare("
                    UPDATE payments
                    SET status = 'completed', completed_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$p['id']]);

                echo "<p class='ok'>✅ Paiement #{$p['id']} : Abonnement <strong>$subscriptionType</strong> activé jusqu'au <strong>$expiresAt</strong></p>";

                // Si PLUS, mettre à jour les crédits mensuels
                if ($subscriptionType === 'plus' || $subscriptionType === 'plus_annual') {
                    $stmt = $db->prepare("
                        UPDATE user_photo_credits
                        SET monthly_credits = 15
                        WHERE user_id = 8
                    ");
                    $stmt->execute();
                    echo "<p class='ok'>✅ Crédits mensuels mis à jour : <strong>15 crédits/mois</strong></p>";
                }

                // Si PRO, mettre à jour les crédits mensuels
                if ($subscriptionType === 'pro' || $subscriptionType === 'pro_annual' || $subscriptionType === 'early_bird') {
                    $stmt = $db->prepare("
                        UPDATE user_photo_credits
                        SET monthly_credits = 30
                        WHERE user_id = 8
                    ");
                    $stmt->execute();
                    echo "<p class='ok'>✅ Crédits mensuels mis à jour : <strong>30 crédits/mois</strong></p>";
                }
            }
        }

        echo "<hr>";
        echo "<p class='ok'><strong>✅ Abonnement activé avec succès !</strong></p>";
        echo "<p>Rechargez votre page YarnFlow pour voir les changements.</p>";
        echo "<p><a href='?'>🔄 Rafraîchir cette page</a></p>";

    } else {
        echo "<hr>";
        echo "<p><a href='?activate=1' style='background:#6366f1;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;display:inline-block;margin:10px 0;'>▶️ Activer l'abonnement</a></p>";
    }

} else {
    echo "<p class='ok'>✅ Aucun paiement d'abonnement en attente</p>";
    echo "<p>Votre abonnement est déjà actif ou aucun paiement n'a été effectué.</p>";
}

// Afficher les crédits actuels
echo "<h2>💰 Crédits photos actuels</h2>";
$stmt = $db->prepare("
    SELECT monthly_credits, purchased_credits, used_credits
    FROM user_photo_credits
    WHERE user_id = 8
");
$stmt->execute();
$credits = $stmt->fetch(PDO::FETCH_ASSOC);

if ($credits) {
    $total = $credits['monthly_credits'] + $credits['purchased_credits'] - $credits['used_credits'];
    echo "<p>Crédits mensuels : <strong>{$credits['monthly_credits']}</strong></p>";
    echo "<p>Crédits achetés : <strong>{$credits['purchased_credits']}</strong></p>";
    echo "<p>Crédits utilisés : <strong>{$credits['used_credits']}</strong></p>";
    echo "<p>Total disponible : <strong class='ok'>{$total}</strong></p>";
}
?>
