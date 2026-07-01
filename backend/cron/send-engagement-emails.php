#!/usr/bin/env php
<?php
/**
 * @file send-engagement-emails.php
 * @brief Script cron pour envoyer les emails de réengagement (J+3, J+7, J+21, Projet sans compteur)
 * @author YarnFlow Team + AI:Claude
 * @created 2026-01-04
 * @modified 2026-01-14 - Suppression rappel J+1 (pas pertinent pour projets tricot)
 * @modified 2026-01-16 - Ajout email project_start_reminder (projet créé mais jamais utilisé)
 *
 * Usage: php send-engagement-emails.php
 * Cron: 0 10 * * * /usr/bin/php /path/to/backend/cron/send-engagement-emails.php
 */

declare(strict_types=1);

// Charger l'environnement
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\EmailService;
use App\Services\PushService;

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

echo "[CRON] Démarrage du script d'emails de réengagement - " . date('Y-m-d H:i:s') . "\n";

try {
    $db = Database::getInstance()->getConnection();
    $emailService = new EmailService($db);
    $pushService = new PushService();

    $stats = [
        'day3' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day7' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day21' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'project_start'    => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'project_inactive' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'ai_exhausted'     => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day30'            => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'reactivation'     => ['sent' => 0, 'skipped' => 0, 'errors' => 0]
    ];

    // =========================================
    // EMAIL J+3 : Utilisateurs inscrits il y a 3 jours
    // =========================================
    echo "\n[J+3] Recherche des utilisateurs inscrits il y a 3 jours...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at
        FROM users u
        WHERE DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        AND (u.last_login_at IS NULL OR u.last_login_at < DATE_SUB(NOW(), INTERVAL 2 DAY))
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id AND email_type = 'onboarding_day3' AND status = 'sent'
        )
        AND NOT EXISTS (
            SELECT 1 FROM email_notifications_sent
            WHERE user_id = u.id AND notification_type LIKE '%onboarding%'
        )
    ");
    $stmt->execute();
    $usersDay3 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+3] Trouvé " . count($usersDay3) . " utilisateur(s) éligible(s)\n";

    foreach ($usersDay3 as $user) {
        echo "[J+3] Envoi à {$user['email']} (ID: {$user['id']})... ";

        try {
            $success = $emailService->sendOnboardingDay3Email(
                $user['email'],
                $user['first_name'] ?? 'Utilisateur',
                (int)$user['id']
            );

            if ($success) {
                echo "✓ Envoyé\n";
                $stats['day3']['sent']++;
            } else {
                echo "✗ Échec\n";
                $stats['day3']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['day3']['errors']++;
        }

        // Pause de 2 secondes entre chaque email (rate limiting SMTP)
        sleep(2);
    }

    // =========================================
    // EMAIL J+7 : Utilisateurs inscrits il y a 7 jours ET inactifs
    // =========================================
    echo "\n[J+7] Recherche des utilisateurs inscrits il y a 7 jours (inactifs)...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at, u.last_login_at
        FROM users u
        WHERE DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND (u.last_login_at IS NULL OR u.last_login_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id AND email_type = 'reengagement_day7' AND status = 'sent'
        )
        AND NOT EXISTS (
            SELECT 1 FROM email_notifications_sent
            WHERE user_id = u.id AND notification_type LIKE '%reengagement%'
        )
    ");
    $stmt->execute();
    $usersDay7 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+7] Trouvé " . count($usersDay7) . " utilisateur(s) éligible(s)\n";

    foreach ($usersDay7 as $user) {
        echo "[J+7] Envoi à {$user['email']} (ID: {$user['id']})... ";

        try {
            // Récupérer un projet en cours si disponible
            $projectStmt = $db->prepare("
                SELECT name, current_row, total_rows
                FROM projects
                WHERE user_id = ? AND status = 'active'
                ORDER BY updated_at DESC
                LIMIT 1
            ");
            $projectStmt->execute([$user['id']]);
            $project = $projectStmt->fetch(PDO::FETCH_ASSOC);

            $projectData = [];
            if ($project && $project['total_rows'] > 0) {
                $projectData = [
                    'name' => $project['name'],
                    'progress' => round(($project['current_row'] / $project['total_rows']) * 100)
                ];
            }

            $success = $emailService->sendReengagementDay7Email(
                $user['email'],
                $user['first_name'] ?? 'Utilisateur',
                $projectData,
                (int)$user['id']
            );

            if ($success) {
                echo "✓ Envoyé\n";
                $stats['day7']['sent']++;
            } else {
                echo "✗ Échec\n";
                $stats['day7']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['day7']['errors']++;
        }

        sleep(2);
    }

    // =========================================
    // EMAIL J+21 : Utilisateurs inscrits il y a 21 jours ET très inactifs
    // =========================================
    echo "\n[J+21] Recherche des utilisateurs inscrits il y a 21 jours (très inactifs)...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at, u.last_login_at
        FROM users u
        WHERE DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL 21 DAY)
        AND (u.last_login_at IS NULL OR u.last_login_at < DATE_SUB(NOW(), INTERVAL 14 DAY))
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id AND email_type = 'need_help_day21' AND status = 'sent'
        )
        AND NOT EXISTS (
            SELECT 1 FROM email_notifications_sent
            WHERE user_id = u.id AND notification_type LIKE '%need_help%'
        )
    ");
    $stmt->execute();
    $usersDay21 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+21] Trouvé " . count($usersDay21) . " utilisateur(s) éligible(s)\n";

    foreach ($usersDay21 as $user) {
        echo "[J+21] Envoi à {$user['email']} (ID: {$user['id']})... ";

        try {
            $success = $emailService->sendNeedHelpDay21Email(
                $user['email'],
                $user['first_name'] ?? 'Utilisateur',
                (int)$user['id']
            );

            if ($success) {
                echo "✓ Envoyé\n";
                $stats['day21']['sent']++;
            } else {
                echo "✗ Échec\n";
                $stats['day21']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['day21']['errors']++;
        }

        sleep(2);
    }

    // =========================================
    // EMAIL PROJECT_START : Projets créés il y a 2+ jours sans aucun rang compté
    // =========================================
    echo "\n[PROJECT_START] Recherche des projets créés sans utilisation du compteur...\n";

    // Les rangs peuvent être dans : projects.current_row, project_sections.current_row, ou project_rows
    $stmt = $db->prepare("
        SELECT
            u.id AS user_id,
            u.email,
            u.first_name,
            p.id AS project_id,
            p.name AS project_name,
            p.created_at AS project_created_at
        FROM users u
        INNER JOIN projects p ON p.user_id = u.id
        WHERE p.created_at <= DATE_SUB(NOW(), INTERVAL 2 DAY)
        AND p.status IN ('in_progress', 'active')
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id
            AND (email_type = 'project_start_reminder' OR subject LIKE '%attend son premier rang%')
            AND status = 'sent'
        )
        AND COALESCE(p.current_row, 0) = 0
        AND COALESCE((SELECT SUM(current_row) FROM project_sections ps WHERE ps.project_id = p.id), 0) = 0
        AND (SELECT COUNT(*) FROM project_rows pr WHERE pr.project_id = p.id) = 0
        ORDER BY p.created_at DESC
    ");
    $stmt->execute();
    $projectsWithoutRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[PROJECT_START] Trouvé " . count($projectsWithoutRows) . " projet(s) éligible(s)\n";

    // Un seul email par utilisateur (le projet le plus récent)
    $usersEmailed = [];
    foreach ($projectsWithoutRows as $row) {
        $userId = (int)$row['user_id'];

        // Éviter d'envoyer plusieurs emails au même utilisateur
        if (in_array($userId, $usersEmailed)) {
            continue;
        }

        echo "[PROJECT_START] Envoi à {$row['email']} (projet: {$row['project_name']})... ";

        try {
            $success = $emailService->sendProjectStartReminderEmail(
                $row['email'],
                $row['first_name'] ?? 'Utilisateur',
                $row['project_name'],
                $userId
            );

            if ($success) {
                echo "✓ Envoyé\n";
                $stats['project_start']['sent']++;
                $usersEmailed[] = $userId;
                $pushService->sendToUser($userId, 'Ton projet t\'attend', "\"{$row['project_name']}\" n'a pas encore son premier rang.", '/my-projects');
            } else {
                echo "✗ Échec\n";
                $stats['project_start']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['project_start']['errors']++;
        }

        sleep(2);
    }

    // =========================================
    // PROJET INACTIF : projets actifs non modifiés depuis 7-14 jours
    // =========================================
    echo "\n[PROJET_INACTIF] Recherche des projets actifs sans activité depuis 7-14 jours...\n";

    $stmt = $db->prepare("
        SELECT
            u.id AS user_id,
            u.email,
            u.first_name,
            p.id AS project_id,
            p.name AS project_name,
            DATEDIFF(NOW(), p.updated_at) AS days_since
        FROM users u
        INNER JOIN projects p ON p.user_id = u.id
        WHERE p.status IN ('in_progress', 'active')
        AND p.updated_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND u.email_verified = 1
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id
            AND email_type = 'project_inactive_reminder'
            AND status = 'sent'
            AND DATE(sent_at) >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
        )
        ORDER BY p.updated_at ASC
    ");
    $stmt->execute();
    $inactiveProjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[PROJET_INACTIF] Trouvé " . count($inactiveProjects) . " projet(s) éligible(s)\n";

    $usersEmailedInactive = [];
    foreach ($inactiveProjects as $row) {
        $userId = (int)$row['user_id'];
        if (in_array($userId, $usersEmailedInactive)) continue;

        echo "[PROJET_INACTIF] Envoi à {$row['email']} (projet: {$row['project_name']}, {$row['days_since']}j)... ";
        try {
            $ok = $emailService->sendProjectInactiveReminderEmail(
                $row['email'],
                $row['first_name'] ?? 'Utilisatrice',
                $row['project_name'],
                (int)$row['days_since'],
                $userId
            );
            if ($ok) {
                echo "✓\n"; $stats['project_inactive']['sent']++; $usersEmailedInactive[] = $userId;
                $pushService->sendToUser($userId, 'Reprends là où tu t\'es arrêtée', "\"{$row['project_name']}\" t'attend.", '/my-projects');
            } else { echo "✗\n"; $stats['project_inactive']['errors']++; }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['project_inactive']['errors']++;
        }
        sleep(2);
    }

    // =========================================
    // QUOTA IA ÉPUISÉ : FREE à 5/5, PLUS à 10/10 ce mois
    // =========================================
    echo "\n[AI_EPUISE] Recherche des utilisatrices ayant épuisé leur quota IA...\n";

    $currentMonth = date('Y-m');
    $stmt = $db->prepare("
        SELECT
            u.id, u.email, u.first_name,
            COALESCE(u.subscription_type, 'free') AS plan,
            COALESCE(au.count, 0) AS used,
            CASE WHEN COALESCE(u.subscription_type, 'free') IN ('plus', 'plus_annual') THEN 10 ELSE 5 END AS quota
        FROM users u
        LEFT JOIN ai_usage au ON au.user_id = u.id AND au.month = :month
        WHERE u.email_verified = 1
        AND COALESCE(u.subscription_type, 'free') IN ('free', 'plus', 'plus_annual')
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id
            AND email_type = 'ai_quota_exhausted'
            AND status = 'sent'
            AND DATE_FORMAT(sent_at, '%Y-%m') = :month2
        )
        HAVING used >= quota
    ");
    $stmt->execute([':month' => $currentMonth, ':month2' => $currentMonth]);
    $exhaustedUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[AI_EPUISE] Trouvé " . count($exhaustedUsers) . " utilisatrice(s) éligible(s)\n";

    foreach ($exhaustedUsers as $user) {
        echo "[AI_EPUISE] Envoi à {$user['email']} ({$user['used']}/{$user['quota']})... ";
        try {
            $ok = $emailService->sendAiQuotaExhaustedEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['quota'],
                (int)$user['id']
            );
            if ($ok) {
                echo "✓\n"; $stats['ai_exhausted']['sent']++;
                $pushService->sendToUser((int)$user['id'], 'Quota IA épuisé ce mois', 'Recharge automatique le 1er. Passe à PLUS pour plus de questions.', '/subscription');
            } else { echo "✗\n"; $stats['ai_exhausted']['errors']++; }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['ai_exhausted']['errors']++;
        }
        sleep(2);
    }

    // =========================================
    // J+30 FREE ACTIVE : inscrite il y a 25-35 jours, active, toujours FREE
    // =========================================
    echo "\n[J+30] Recherche des utilisatrices FREE actives depuis 30 jours...\n";

    $stmt = $db->prepare("
        SELECT
            u.id, u.email, u.first_name,
            COUNT(DISTINCT p.id) AS project_count,
            COALESCE(SUM(p.current_row), 0) AS total_rows
        FROM users u
        LEFT JOIN projects p ON p.user_id = u.id AND p.status IN ('in_progress', 'active', 'finished')
        WHERE u.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 35 DAY) AND DATE_SUB(NOW(), INTERVAL 25 DAY)
        AND u.last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND (u.subscription_type = 'free' OR u.subscription_type IS NULL)
        AND u.email_verified = 1
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id
            AND email_type = 'active_free_day30'
            AND status = 'sent'
        )
        GROUP BY u.id
        HAVING project_count >= 1
    ");
    $stmt->execute();
    $day30Users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+30] Trouvé " . count($day30Users) . " utilisatrice(s) éligible(s)\n";

    foreach ($day30Users as $user) {
        echo "[J+30] Envoi à {$user['email']} ({$user['project_count']} projets, {$user['total_rows']} rangs)... ";
        try {
            $ok = $emailService->sendActiveFreeDay30Email(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['project_count'],
                (int)$user['total_rows'],
                (int)$user['id']
            );
            if ($ok) {
                echo "✓\n"; $stats['day30']['sent']++;
                $pushService->sendToUser((int)$user['id'], 'Un mois avec YarnFlow', 'Découvre ce que PLUS peut t\'apporter maintenant.', '/subscription');
            } else { echo "✗\n"; $stats['day30']['errors']++; }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['day30']['errors']++;
        }
        sleep(2);
    }

    // =========================================
    // RÉACTIVATION J+45 : dernière connexion entre 45 et 60 jours
    // =========================================
    echo "\n[REACTIV] Recherche des utilisatrices absentes depuis 45-60 jours...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name,
            DATEDIFF(NOW(), u.last_login_at) AS days_since
        FROM users u
        WHERE u.last_login_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 45 DAY)
        AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id
            AND email_type = 'reactivation'
            AND status = 'sent'
        )
    ");
    $stmt->execute();
    $reactivUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[REACTIV] Trouvé " . count($reactivUsers) . " utilisatrice(s) éligible(s)\n";

    foreach ($reactivUsers as $user) {
        echo "[REACTIV] Envoi à {$user['email']} ({$user['days_since']}j d'absence)... ";
        try {
            $ok = $emailService->sendReactivationEmail(
                $user['email'],
                $user['first_name'] ?? 'Utilisatrice',
                (int)$user['days_since'],
                (int)$user['id']
            );
            if ($ok) { echo "✓\n"; $stats['reactivation']['sent']++; }
            else      { echo "✗\n"; $stats['reactivation']['errors']++; }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n"; $stats['reactivation']['errors']++;
        }
        sleep(2);
    }

    // =========================================
    // RÉSUMÉ
    // =========================================
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "RÉSUMÉ DES ENVOIS\n";
    echo str_repeat("=", 60) . "\n";
    echo sprintf("J+3      : %d envoyés, %d erreurs (onboarding)\n", $stats['day3']['sent'], $stats['day3']['errors']);
    echo sprintf("J+7      : %d envoyés, %d erreurs (réengagement inactif)\n", $stats['day7']['sent'], $stats['day7']['errors']);
    echo sprintf("J+21     : %d envoyés, %d erreurs (besoin d'aide)\n", $stats['day21']['sent'], $stats['day21']['errors']);
    echo sprintf("J+30     : %d envoyés, %d erreurs (FREE active 30j)\n", $stats['day30']['sent'], $stats['day30']['errors']);
    echo sprintf("J+45     : %d envoyés, %d erreurs (réactivation)\n", $stats['reactivation']['sent'], $stats['reactivation']['errors']);
    echo sprintf("PROJ_START  : %d envoyés, %d erreurs (projet sans compteur)\n", $stats['project_start']['sent'], $stats['project_start']['errors']);
    echo sprintf("PROJ_INACT  : %d envoyés, %d erreurs (projet inactif 7-14j)\n", $stats['project_inactive']['sent'], $stats['project_inactive']['errors']);
    echo sprintf("AI_EPUISE   : %d envoyés, %d erreurs (quota IA épuisé)\n", $stats['ai_exhausted']['sent'], $stats['ai_exhausted']['errors']);
    echo str_repeat("=", 60) . "\n";

    $totalSent = array_sum(array_column($stats, 'sent'));
    $totalErrors = array_sum(array_column($stats, 'errors'));

    echo "TOTAL : {$totalSent} emails envoyés, {$totalErrors} erreurs\n";
    echo "[CRON] Terminé - " . date('Y-m-d H:i:s') . "\n\n";

} catch (Exception $e) {
    echo "[ERREUR FATALE] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

exit(0);
