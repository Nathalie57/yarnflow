#!/usr/bin/env php
<?php
/**
 * @file behavioral-triggers.php
 * @brief Triggers comportementaux — stash limit, quota IA, utilisatrice active FREE
 *
 * Sept déclencheurs :
 *   1. stash_limit_approaching  — utilisatrice FREE à 4/5 pelotes
 *   2. ai_quota_approaching     — utilisatrice FREE (4/5) ou PLUS (9/10) de questions IA
 *   3. active_user_upgrade      — utilisatrice FREE active J+7→J+14 avec ≥2 projets
 *   4. abandoned_checkout       — paiement subscription pending depuis 2h-48h (rappel neutre)
 *   4bis. abandoned_checkout_discount_20 — toujours pending 3-4j après (-20%, code REVIENS20)
 *   4ter. abandoned_checkout_discount_35 — toujours pending 7-8j après (-35%, code REVIENS35)
 *   5. dormant_reactivation     — était active (≥5 sessions), silence depuis 15-30j
 *   6. reengagement_light       — a peu essayé (1-4 sessions), aucun projet, silence depuis 7-10j
 *
 * Cron: 0 11 * * * /usr/bin/php /path/to/backend/cron/behavioral-triggers.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\EmailService;
use App\Services\PushService;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

echo "[CRON] Behavioral triggers — " . date('Y-m-d H:i:s') . "\n";

try {
    $db = Database::getInstance()->getConnection();
    $emailService = new EmailService($db);
    $pushService = new PushService();

    $stats = [
        'stash'   => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'ai'      => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'upgrade'   => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'abandoned' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'abandoned_promo' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'dormant'   => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'light'     => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
    ];

    $currentMonth = date('Y-m');

    // =========================================================================
    // 1. STASH LIMIT APPROACHING — FREE à 4/5 pelotes
    // =========================================================================
    echo "\n[STASH] Recherche des utilisatrices FREE avec 4 pelotes en stock...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, COUNT(ys.id) AS stash_count
        FROM users u
        JOIN yarn_stash ys ON ys.user_id = u.id
        WHERE (u.subscription_type = 'free' OR u.subscription_type IS NULL)
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'stash_limit_approaching'
            AND user_id IS NOT NULL
            AND DATE(sent_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        )
        GROUP BY u.id
        HAVING stash_count = 4
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[STASH] " . count($users) . " utilisatrice(s) éligible(s)\n";

    foreach ($users as $user) {
        echo "[STASH] Envoi à {$user['email']}... ";
        try {
            $ok = $emailService->sendStashLimitApproachingEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['stash_count'],
                (int)$user['id']
            );
            if ($ok) {
                // Push complémentaire si abonnée
                $pushService->sendToUser(
                    (int)$user['id'],
                    'Ton stock est presque plein',
                    'Plus qu\'une place disponible. Passe à PLUS pour continuer.',
                    '/subscription'
                );
                echo "✓\n";
                $stats['stash']['sent']++;
            } else {
                echo "✗\n";
                $stats['stash']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n";
            $stats['stash']['errors']++;
        }
        sleep(2);
    }

    // =========================================================================
    // 2. AI QUOTA APPROACHING — FREE à 4/5, PLUS à 9/10
    // =========================================================================
    echo "\n[AI] Recherche des utilisatrices proche de leur quota IA...\n";

    $stmt = $db->prepare("
        SELECT
            u.id, u.email, u.first_name,
            COALESCE(u.subscription_type, 'free') AS plan,
            COALESCE(au.count, 0) AS used,
            CASE
                WHEN COALESCE(u.subscription_type, 'free') IN ('plus', 'plus_annual') THEN 10
                ELSE 5
            END AS quota
        FROM users u
        LEFT JOIN ai_usage au ON au.user_id = u.id AND au.month = :month
        WHERE COALESCE(u.subscription_type, 'free') IN ('free', 'plus', 'plus_annual')
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'ai_quota_approaching'
            AND user_id IS NOT NULL
            AND DATE(sent_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        )
        HAVING used > 0
        AND used = quota - 1
    ");
    $stmt->execute([':month' => $currentMonth]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[AI] " . count($users) . " utilisatrice(s) éligible(s)\n";

    foreach ($users as $user) {
        echo "[AI] Envoi à {$user['email']} ({$user['used']}/{$user['quota']})... ";
        try {
            $ok = $emailService->sendAiQuotaApproachingEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['used'],
                (int)$user['quota'],
                (int)$user['id']
            );
            if ($ok) {
                $pushService->sendToUser(
                    (int)$user['id'],
                    'Dernière question IA du mois',
                    'Il te reste 1 question ce mois-ci. Passe à ' . ($user['quota'] <= 5 ? 'PLUS' : 'PRO') . ' pour continuer.',
                    '/subscription'
                );
                echo "✓\n";
                $stats['ai']['sent']++;
            } else {
                echo "✗\n";
                $stats['ai']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n";
            $stats['ai']['errors']++;
        }
        sleep(2);
    }

    // =========================================================================
    // 3. ACTIVE USER UPGRADE — FREE active J+7→J+14 avec ≥2 projets
    //    Différent du reengagement_day7 qui cible les INACTIVES.
    //    Ici on cible les actives qui ne se sont pas encore abonnées.
    // =========================================================================
    echo "\n[UPGRADE] Recherche des utilisatrices FREE actives J+7→J+14...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, COUNT(p.id) AS project_count
        FROM users u
        JOIN projects p ON p.user_id = u.id AND p.status IN ('in_progress', 'active')
        WHERE u.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)
        -- [AI:Claude] 2026-08-24 — last_login_at ne reflete que les vraies
        -- authentifications, pas chaque ouverture de l'app une fois le token JWT
        -- en poche (voir send-engagement-emails.php pour le detail) : sans ce
        -- remplacement, ce trigger ratait quasiment toutes les utilisatrices
        -- reellement actives.
        AND EXISTS (
            SELECT 1 FROM user_sessions s
            WHERE s.user_id = u.id AND s.last_activity_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)
        )
        AND (u.subscription_type = 'free' OR u.subscription_type IS NULL)
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'active_user_upgrade'
            AND user_id IS NOT NULL
        )
        GROUP BY u.id
        HAVING project_count >= 2
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[UPGRADE] " . count($users) . " utilisatrice(s) éligible(s)\n";

    foreach ($users as $user) {
        echo "[UPGRADE] Envoi à {$user['email']} ({$user['project_count']} projets)... ";
        try {
            $ok = $emailService->sendActiveUserUpgradeEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['project_count'],
                (int)$user['id']
            );
            if ($ok) {
                echo "✓\n";
                $stats['upgrade']['sent']++;
            } else {
                echo "✗\n";
                $stats['upgrade']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n";
            $stats['upgrade']['errors']++;
        }
        sleep(2);
    }

    // =========================================================================
    // 4. PANIER ABANDONNÉ — paiement subscription pending depuis 2h-48h, user toujours FREE
    // =========================================================================
    echo "\n[ABANDON] Recherche des paniers abonnement abandonnés...\n";

    $stmt = $db->prepare("
        SELECT
            u.id, u.email, u.first_name,
            pay.payment_type
        FROM payments pay
        JOIN users u ON u.id = pay.user_id
        WHERE pay.status = 'pending'
        AND pay.payment_type LIKE 'subscription_%'
        AND pay.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 48 HOUR) AND DATE_SUB(NOW(), INTERVAL 2 HOUR)
        AND (u.subscription_type = 'free' OR u.subscription_type IS NULL)
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id
            AND email_type = 'abandoned_checkout'
            AND status = 'sent'
            AND DATE(sent_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        )
        GROUP BY u.id
    ");
    $stmt->execute();
    $abandonedUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[ABANDON] " . count($abandonedUsers) . " utilisatrice(s) éligible(s)\n";

    foreach ($abandonedUsers as $user) {
        $plan = str_contains($user['payment_type'], 'pro') ? 'pro' : 'plus';
        echo "[ABANDON] Envoi à {$user['email']} (plan: {$plan})... ";
        try {
            $ok = $emailService->sendAbandonedCheckoutEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                $plan,
                (int)$user['id']
            );
            if ($ok) {
                echo "✓\n"; $stats['abandoned']['sent']++;
                $pushService->sendToUser((int)$user['id'], 'Ton abonnement n\'est pas finalisé', 'Reprends là où tu t\'es arrêtée.', '/subscription');
            } else { echo "✗\n"; $stats['abandoned']['errors']++; }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['abandoned']['errors']++;
        }
        sleep(2);
    }

    // =========================================================================
    // 4bis. PANIER ABANDONNÉ AVEC CODE PROMO — urgence croissante, deux paliers.
    //    Le rappel neutre ci-dessus couvre déjà 2-48h, pas besoin de re-tester ce
    //    statut avant. Chaque palier a son propre code promo (à créer dans Stripe)
    //    et son propre email_type, donc les deux sont indépendants l'un de l'autre.
    // =========================================================================
    $discountTiers = [
        ['days_min' => 3, 'days_max' => 4, 'percent' => 20, 'code' => 'REVIENS20'],
        ['days_min' => 7, 'days_max' => 8, 'percent' => 35, 'code' => 'REVIENS35'],
    ];

    foreach ($discountTiers as $tier) {
        $label = "ABANDON_PROMO_{$tier['percent']}";
        echo "\n[{$label}] Recherche des paniers abandonnés depuis {$tier['days_min']}-{$tier['days_max']} jours...\n";

        $stmt = $db->prepare("
            SELECT
                u.id, u.email, u.first_name,
                pay.payment_type
            FROM payments pay
            JOIN users u ON u.id = pay.user_id
            WHERE pay.status = 'pending'
            AND pay.payment_type LIKE 'subscription_%'
            AND pay.created_at BETWEEN DATE_SUB(NOW(), INTERVAL :days_max DAY) AND DATE_SUB(NOW(), INTERVAL :days_min DAY)
            AND (u.subscription_type = 'free' OR u.subscription_type IS NULL)
            AND NOT EXISTS (
                SELECT 1 FROM emails_sent_log
                WHERE user_id = u.id
                AND email_type = :email_type
                AND status = 'sent'
            )
            GROUP BY u.id
        ");
        $stmt->execute([
            ':days_max' => $tier['days_max'],
            ':days_min' => $tier['days_min'],
            ':email_type' => "abandoned_checkout_discount_{$tier['percent']}",
        ]);
        $tierUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo "[{$label}] " . count($tierUsers) . " utilisatrice(s) éligible(s)\n";

        foreach ($tierUsers as $user) {
            $plan = str_contains($user['payment_type'], 'pro') ? 'pro' : 'plus';
            echo "[{$label}] Envoi à {$user['email']} (plan: {$plan})... ";
            try {
                $ok = $emailService->sendAbandonedCheckoutDiscountEmail(
                    $user['email'],
                    $user['first_name'] ?? 'Utilisatrice',
                    $plan,
                    $tier['percent'],
                    $tier['code'],
                    (int)$user['id']
                );
                if ($ok) {
                    echo "✓\n"; $stats['abandoned_promo']['sent']++;
                } else { echo "✗\n"; $stats['abandoned_promo']['errors']++; }
            } catch (Exception $e) {
                echo "✗ {$e->getMessage()}\n"; $stats['abandoned_promo']['errors']++;
            }
            sleep(2);
        }
    }

    // =========================================================================
    // 5. DORMANT REACTIVATION — était réellement active (≥5 sessions), silence
    //    depuis 15-30j. Fenêtre choisie pour ne pas recouper project_inactive_reminder
    //    (send-engagement-emails.php, 7-14j) ni reactivation (45-60j) — le vrai
    //    trou entre les deux, jusqu'ici couvert par rien.
    // =========================================================================
    echo "\n[DORMANT] Recherche des utilisatrices actives devenues silencieuses...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, MAX(s.last_activity_at) AS last_seen
        FROM users u
        JOIN user_sessions s ON s.user_id = u.id
        WHERE u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'dormant_reactivation'
            AND user_id IS NOT NULL
        )
        -- [AI:Claude] Cooldown : n'importe quel autre email de relance déjà reçu
        -- récemment évite un doublon de message, peu importe lequel est arrivé
        -- en premier (need_help_day21, project_inactive_reminder, reengagement_day7).
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type IN ('need_help_day21', 'project_inactive_reminder', 'reengagement_day7')
            AND user_id IS NOT NULL
            AND DATE(sent_at) >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
        )
        GROUP BY u.id
        HAVING COUNT(s.id) >= 5
           AND last_seen BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND DATE_SUB(NOW(), INTERVAL 15 DAY)
    ");
    $stmt->execute();
    $dormantUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[DORMANT] " . count($dormantUsers) . " utilisatrice(s) éligible(s)\n";

    foreach ($dormantUsers as $user) {
        echo "[DORMANT] Envoi à {$user['email']} (vue pour la dernière fois le {$user['last_seen']})... ";
        try {
            $ok = $emailService->sendDormantReactivationEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['id']
            );
            if ($ok) {
                echo "✓\n"; $stats['dormant']['sent']++;
            } else {
                echo "✗\n"; $stats['dormant']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['dormant']['errors']++;
        }
        sleep(2);
    }

    // =========================================================================
    // 6. REENGAGEMENT LIGHT — a peu essayé (1-4 sessions), silence depuis 7-10j,
    //    AUCUN projet créé. Recentré sur ce seul cas : dès qu'un projet existe,
    //    project_start_reminder et project_inactive_reminder (send-engagement-
    //    emails.php) couvrent déjà le même besoin — inutile de dupliquer.
    // =========================================================================
    echo "\n[LIGHT] Recherche des comptes qui ont peu essayé, sans avoir créé de projet...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, COUNT(s.id) AS session_count,
               MAX(s.last_activity_at) AS last_seen
        FROM users u
        JOIN user_sessions s ON s.user_id = u.id
        WHERE u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type = 'reengagement_light'
            AND user_id IS NOT NULL
        )
        -- [AI:Claude] Cooldown, même logique que dormant_reactivation ci-dessus.
        AND u.id NOT IN (
            SELECT user_id FROM emails_sent_log
            WHERE email_type IN ('need_help_day21', 'reengagement_day7', 'onboarding_day3')
            AND user_id IS NOT NULL
            AND DATE(sent_at) >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
        )
        AND NOT EXISTS (
            SELECT 1 FROM projects p WHERE p.user_id = u.id
        )
        GROUP BY u.id
        HAVING session_count BETWEEN 1 AND 4
           AND last_seen BETWEEN DATE_SUB(NOW(), INTERVAL 10 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $stmt->execute();
    $lightUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[LIGHT] " . count($lightUsers) . " utilisatrice(s) éligible(s)\n";

    foreach ($lightUsers as $user) {
        echo "[LIGHT] Envoi à {$user['email']} ({$user['session_count']} session(s), aucun projet)... ";
        try {
            $ok = $emailService->sendReengagementLightEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['id']
            );
            if ($ok) {
                echo "✓\n"; $stats['light']['sent']++;
            } else {
                echo "✗\n"; $stats['light']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['light']['errors']++;
        }
        sleep(2);
    }

    // =========================================================================
    // RÉSUMÉ
    // =========================================================================
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "RÉSUMÉ\n";
    echo str_repeat("=", 60) . "\n";
    echo sprintf("STASH    : %d envoyés, %d erreurs\n", $stats['stash']['sent'], $stats['stash']['errors']);
    echo sprintf("AI       : %d envoyés, %d erreurs\n", $stats['ai']['sent'], $stats['ai']['errors']);
    echo sprintf("UPGRADE  : %d envoyés, %d erreurs\n", $stats['upgrade']['sent'], $stats['upgrade']['errors']);
    echo sprintf("ABANDON  : %d envoyés, %d erreurs\n", $stats['abandoned']['sent'], $stats['abandoned']['errors']);
    echo sprintf("ABANDON_PROMO : %d envoyés, %d erreurs\n", $stats['abandoned_promo']['sent'], $stats['abandoned_promo']['errors']);
    echo sprintf("DORMANT  : %d envoyés, %d erreurs\n", $stats['dormant']['sent'], $stats['dormant']['errors']);
    echo sprintf("LIGHT    : %d envoyés, %d erreurs\n", $stats['light']['sent'], $stats['light']['errors']);
    $total = array_sum(array_column($stats, 'sent'));
    echo "TOTAL   : {$total} emails envoyés\n";
    echo "[CRON] Terminé - " . date('Y-m-d H:i:s') . "\n\n";

} catch (Exception $e) {
    echo "[ERREUR FATALE] " . $e->getMessage() . "\n";
    exit(1);
}

exit(0);
