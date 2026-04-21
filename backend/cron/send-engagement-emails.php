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

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

echo "[CRON] Démarrage du script d'emails de réengagement - " . date('Y-m-d H:i:s') . "\n";

try {
    $db = Database::getInstance()->getConnection();
    $emailService = new EmailService($db);

    $stats = [
        'day3' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day7' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day21' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'project_start' => ['sent' => 0, 'skipped' => 0, 'errors' => 0]
    ];

    // =========================================
    // EMAIL J+3 : Utilisateurs inscrits il y a 3 jours
    // =========================================
    echo "\n[J+3] Recherche des utilisateurs inscrits il y a 3 jours...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at
        FROM users u
        WHERE DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'onboarding_day3'
            AND user_id IS NOT NULL
        )
        AND u.id NOT IN (
            SELECT DISTINCT user_id
            FROM projects
        )
        AND u.email_verified = 1
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
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'reengagement_day7'
            AND user_id IS NOT NULL
        )
        AND u.email_verified = 1
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
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'need_help_day21'
            AND user_id IS NOT NULL
        )
        AND u.email_verified = 1
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
        AND p.status = 'active'
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'project_start_reminder'
            AND user_id IS NOT NULL
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
    // RÉSUMÉ
    // =========================================
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "RÉSUMÉ DES ENVOIS\n";
    echo str_repeat("=", 60) . "\n";
    echo sprintf("J+3  : %d envoyés, %d erreurs (onboarding)\n", $stats['day3']['sent'], $stats['day3']['errors']);
    echo sprintf("J+7  : %d envoyés, %d erreurs (réengagement)\n", $stats['day7']['sent'], $stats['day7']['errors']);
    echo sprintf("J+21 : %d envoyés, %d erreurs (besoin d'aide)\n", $stats['day21']['sent'], $stats['day21']['errors']);
    echo sprintf("PROJ : %d envoyés, %d erreurs (projet sans compteur)\n", $stats['project_start']['sent'], $stats['project_start']['errors']);
    echo str_repeat("=", 60) . "\n";

    $totalSent = $stats['day3']['sent'] + $stats['day7']['sent'] + $stats['day21']['sent'] + $stats['project_start']['sent'];
    $totalErrors = $stats['day3']['errors'] + $stats['day7']['errors'] + $stats['day21']['errors'] + $stats['project_start']['errors'];

    echo "TOTAL : {$totalSent} emails envoyés, {$totalErrors} erreurs\n";
    echo "[CRON] Terminé - " . date('Y-m-d H:i:s') . "\n\n";

} catch (Exception $e) {
    echo "[ERREUR FATALE] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

exit(0);
