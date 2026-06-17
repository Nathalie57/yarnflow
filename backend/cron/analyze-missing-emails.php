#!/usr/bin/env php
<?php
/**
 * @file analyze-missing-emails.php
 * @brief Analyse les utilisateurs qui n'ont pas reçu d'emails de réengagement
 * @usage php analyze-missing-emails.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

echo "╔════════════════════════════════════════════════════════════════════╗\n";
echo "║   ANALYSE DES UTILISATEURS SANS EMAILS DE RÉENGAGEMENT             ║\n";
echo "╚════════════════════════════════════════════════════════════════════╝\n\n";

try {
    $db = Database::getInstance()->getConnection();

    // Période d'analyse : 3 à 30 jours
    $minDays = 3;
    $maxDays = 30;

    echo "📅 Période analysée : utilisateurs inscrits il y a {$minDays} à {$maxDays} jours\n";
    echo str_repeat("─", 70) . "\n\n";

    // 1. Vue d'ensemble
    echo "📊 VUE D'ENSEMBLE\n";
    echo str_repeat("─", 70) . "\n";

    $stmt = $db->prepare("
        SELECT COUNT(*) as total
        FROM users
        WHERE DATEDIFF(NOW(), created_at) BETWEEN ? AND ?
        AND email_verified = 1
    ");
    $stmt->execute([$minDays, $maxDays]);
    $totalUsers = $stmt->fetch()['total'];

    echo "• Utilisateurs vérifiés dans la période : {$totalUsers}\n";

    // Utilisateurs qui n'ont JAMAIS reçu d'email de réengagement
    $stmt = $db->prepare("
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        WHERE DATEDIFF(NOW(), u.created_at) BETWEEN ? AND ?
        AND u.email_verified = 1
        AND u.id NOT IN (
            SELECT DISTINCT user_id
            FROM emails_sent_log
            WHERE user_id IS NOT NULL
            AND email_type IN ('onboarding_day3', 'reengagement_day7', 'need_help_day21')
        )
    ");
    $stmt->execute([$minDays, $maxDays]);
    $usersWithoutEmails = $stmt->fetch()['count'];

    echo "• Utilisateurs SANS aucun email de réengagement : {$usersWithoutEmails}\n";

    if ($totalUsers > 0) {
        $percentage = round(($usersWithoutEmails / $totalUsers) * 100, 1);
        echo "• Taux de non-contact : {$percentage}%\n";
    }

    echo "\n";

    // 2. Analyse détaillée par période
    echo "🔍 DÉTAILS PAR PÉRIODE D'INSCRIPTION\n";
    echo str_repeat("─", 70) . "\n";

    // J+3 à J+6 (auraient dû recevoir J+3)
    $stmt = $db->prepare("
        SELECT
            u.id,
            u.email,
            u.first_name,
            u.created_at,
            DATEDIFF(NOW(), u.created_at) as days_ago,
            (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count,
            (SELECT MAX(last_login_at) FROM users WHERE id = u.id) as last_login
        FROM users u
        WHERE DATEDIFF(NOW(), u.created_at) BETWEEN 3 AND 6
        AND u.email_verified = 1
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'onboarding_day3' AND user_id IS NOT NULL
        )
        ORDER BY u.created_at DESC
    ");
    $stmt->execute();
    $missedDay3 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\n📧 J+3 : Utilisateurs qui auraient dû recevoir l'email J+3\n";
    echo "   Trouvés : " . count($missedDay3) . "\n";

    if (!empty($missedDay3)) {
        $activeCount = 0;
        $inactiveCount = 0;

        foreach ($missedDay3 as $user) {
            if ($user['project_count'] > 0) {
                $activeCount++;
            } else {
                $inactiveCount++;
            }
        }

        echo "   • Avec projets (actifs malgré tout) : {$activeCount}\n";
        echo "   • Sans projets (potentiellement perdus) : {$inactiveCount}\n";
    }

    // J+7 à J+14
    $stmt = $db->prepare("
        SELECT
            u.id,
            u.email,
            DATEDIFF(NOW(), u.created_at) as days_ago,
            (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
        FROM users u
        WHERE DATEDIFF(NOW(), u.created_at) BETWEEN 7 AND 14
        AND u.email_verified = 1
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'reengagement_day7' AND user_id IS NOT NULL
        )
    ");
    $stmt->execute();
    $missedDay7 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\n📧 J+7 : Utilisateurs qui auraient dû recevoir l'email J+7\n";
    echo "   Trouvés : " . count($missedDay7) . "\n";

    if (!empty($missedDay7)) {
        $activeCount = count(array_filter($missedDay7, fn($u) => $u['project_count'] > 0));
        $inactiveCount = count($missedDay7) - $activeCount;
        echo "   • Avec projets : {$activeCount}\n";
        echo "   • Sans projets : {$inactiveCount}\n";
    }

    // J+21 à J+30
    $stmt = $db->prepare("
        SELECT
            u.id,
            u.email,
            DATEDIFF(NOW(), u.created_at) as days_ago,
            (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
        FROM users u
        WHERE DATEDIFF(NOW(), u.created_at) BETWEEN 21 AND 30
        AND u.email_verified = 1
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'need_help_day21' AND user_id IS NOT NULL
        )
    ");
    $stmt->execute();
    $missedDay21 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "\n📧 J+21 : Utilisateurs qui auraient dû recevoir l'email J+21\n";
    echo "   Trouvés : " . count($missedDay21) . "\n";

    if (!empty($missedDay21)) {
        $activeCount = count(array_filter($missedDay21, fn($u) => $u['project_count'] > 0));
        $inactiveCount = count($missedDay21) - $activeCount;
        echo "   • Avec projets : {$activeCount}\n";
        echo "   • Sans projets : {$inactiveCount}\n";
    }

    // 3. Recommandations
    echo "\n\n💡 RECOMMANDATIONS\n";
    echo str_repeat("─", 70) . "\n";

    $totalMissed = count($missedDay3) + count($missedDay7) + count($missedDay21);

    if ($totalMissed === 0) {
        echo "✅ Aucun utilisateur manqué ! Le système fonctionne parfaitement.\n";
    } elseif ($totalMissed <= 5) {
        echo "✅ Impact minimal ({$totalMissed} utilisateurs).\n";
        echo "   → Pas besoin de campagne de rattrapage\n";
        echo "   → Le système actuel suffit pour les nouveaux\n";
    } elseif ($totalMissed <= 20) {
        echo "⚠️  Impact modéré ({$totalMissed} utilisateurs).\n";
        echo "   → Option 1 : Laisser le système gérer les nouveaux\n";
        echo "   → Option 2 : Email de rattrapage ciblé pour les inactifs sans projets\n";
    } else {
        echo "⚠️  Impact significatif ({$totalMissed} utilisateurs).\n";
        echo "   → Recommandé : Campagne de rattrapage pour les utilisateurs sans projets\n";
        echo "   → Message : \"YarnFlow s'améliore - Revenez essayer !\"\n";
    }

    // 4. Liste détaillée des utilisateurs critiques (sans projets + récents)
    echo "\n\n🎯 UTILISATEURS PRIORITAIRES POUR RATTRAPAGE\n";
    echo str_repeat("─", 70) . "\n";
    echo "(Inscrits récemment, vérifiés, SANS projets, SANS emails reçus)\n\n";

    $stmt = $db->prepare("
        SELECT
            u.id,
            u.email,
            u.first_name,
            u.created_at,
            DATEDIFF(NOW(), u.created_at) as days_ago
        FROM users u
        WHERE DATEDIFF(NOW(), u.created_at) BETWEEN 3 AND 14
        AND u.email_verified = 1
        AND u.id NOT IN (
            SELECT DISTINCT user_id FROM emails_sent_log
            WHERE user_id IS NOT NULL
            AND email_type IN ('onboarding_day3', 'reengagement_day7', 'need_help_day21')
        )
        AND u.id NOT IN (
            SELECT DISTINCT user_id FROM projects
        )
        ORDER BY u.created_at DESC
        LIMIT 20
    ");
    $stmt->execute();
    $priorityUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($priorityUsers)) {
        echo "✅ Aucun utilisateur prioritaire identifié.\n";
    } else {
        echo "Trouvés : " . count($priorityUsers) . " utilisateur(s)\n\n";

        foreach ($priorityUsers as $user) {
            echo sprintf(
                "• J+%d | ID:%d | %s (%s)\n",
                $user['days_ago'],
                $user['id'],
                $user['email'],
                $user['first_name'] ?? 'Pas de prénom'
            );
        }
    }

    echo "\n" . str_repeat("═", 70) . "\n";
    echo "Analyse terminée - " . date('Y-m-d H:i:s') . "\n";
    echo str_repeat("═", 70) . "\n\n";

} catch (Exception $e) {
    echo "[ERREUR] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

exit(0);
