#!/usr/bin/env php
<?php
/**
 * @file send-retroactive-emails.php
 * @brief Script ONE-TIME pour envoyer les emails de réengagement rétroactifs
 * @author YarnFlow Team + AI:Claude
 * @created 2026-01-04
 *
 * Ce script envoie les emails manquants aux utilisateurs existants qui auraient
 * dû les recevoir dans le passé mais ne les ont jamais reçus.
 *
 * Usage: php send-retroactive-emails.php
 * ATTENTION: À lancer UNE SEULE FOIS, puis utiliser send-engagement-emails.php en cron
 */

declare(strict_types=1);

// Charger l'environnement
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\EmailService;

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

echo "\n" . str_repeat("=", 70) . "\n";
echo "ENVOI D'EMAILS RÉTROACTIFS DE RÉENGAGEMENT\n";
echo str_repeat("=", 70) . "\n";
echo "Date: " . date('Y-m-d H:i:s') . "\n";
echo "\nCe script va envoyer les emails manquants aux utilisateurs existants.\n";
echo "Appuyez sur ENTRÉE pour continuer ou CTRL+C pour annuler...\n";
echo str_repeat("=", 70) . "\n";

if (php_sapi_name() === 'cli') {
    fgets(STDIN);
}

try {
    $db = Database::getInstance()->getConnection();
    $emailService = new EmailService($db);

    $stats = [
        'day3' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day7' => ['sent' => 0, 'skipped' => 0, 'errors' => 0],
        'day21' => ['sent' => 0, 'skipped' => 0, 'errors' => 0]
    ];

    // =========================================
    // EMAIL J+3 : Tous les utilisateurs inscrits depuis plus de 3 jours
    // =========================================
    echo "\n[J+3 RÉTROACTIF] Recherche des utilisateurs éligibles...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at,
               DATEDIFF(NOW(), u.created_at) as days_since_registration
        FROM users u
        WHERE u.created_at <= DATE_SUB(NOW(), INTERVAL 3 DAY)
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'onboarding_day3'
            AND user_id IS NOT NULL
        )
        AND u.email_verified = 1
        ORDER BY u.created_at DESC
    ");
    $stmt->execute();
    $usersDay3 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+3] Trouvé " . count($usersDay3) . " utilisateur(s) éligible(s)\n";

    foreach ($usersDay3 as $user) {
        $daysSince = $user['days_since_registration'];
        echo "[J+3] {$user['email']} (inscrit il y a {$daysSince}j)... ";

        try {
            $success = $emailService->sendOnboardingDay3Email(
                $user['email'],
                $user['first_name'] ?? 'Utilisateur',
                (int)$user['id']
            );

            if ($success) {
                echo "✓\n";
                $stats['day3']['sent']++;
            } else {
                echo "✗\n";
                $stats['day3']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['day3']['errors']++;
        }

        sleep(2); // Rate limiting
    }

    // =========================================
    // EMAIL J+7 : Utilisateurs inscrits depuis plus de 7 jours ET inactifs
    // =========================================
    echo "\n[J+7 RÉTROACTIF] Recherche des utilisateurs éligibles...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at, u.last_login_at,
               DATEDIFF(NOW(), u.created_at) as days_since_registration
        FROM users u
        WHERE u.created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND (u.last_login_at IS NULL OR u.last_login_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'reengagement_day7'
            AND user_id IS NOT NULL
        )
        AND u.email_verified = 1
        ORDER BY u.created_at DESC
    ");
    $stmt->execute();
    $usersDay7 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+7] Trouvé " . count($usersDay7) . " utilisateur(s) éligible(s)\n";

    foreach ($usersDay7 as $user) {
        $daysSince = $user['days_since_registration'];
        echo "[J+7] {$user['email']} (inscrit il y a {$daysSince}j)... ";

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
                echo "✓\n";
                $stats['day7']['sent']++;
            } else {
                echo "✗\n";
                $stats['day7']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['day7']['errors']++;
        }

        sleep(2);
    }

    // =========================================
    // EMAIL J+21 : Utilisateurs inscrits depuis plus de 21 jours ET très inactifs
    // =========================================
    echo "\n[J+21 RÉTROACTIF] Recherche des utilisateurs éligibles...\n";

    $stmt = $db->prepare("
        SELECT u.id, u.email, u.first_name, u.created_at, u.last_login_at,
               DATEDIFF(NOW(), u.created_at) as days_since_registration
        FROM users u
        WHERE u.created_at <= DATE_SUB(NOW(), INTERVAL 21 DAY)
        AND (u.last_login_at IS NULL OR u.last_login_at < DATE_SUB(NOW(), INTERVAL 14 DAY))
        AND u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'need_help_day21'
            AND user_id IS NOT NULL
        )
        AND u.email_verified = 1
        ORDER BY u.created_at DESC
    ");
    $stmt->execute();
    $usersDay21 = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[J+21] Trouvé " . count($usersDay21) . " utilisateur(s) éligible(s)\n";

    foreach ($usersDay21 as $user) {
        $daysSince = $user['days_since_registration'];
        echo "[J+21] {$user['email']} (inscrit il y a {$daysSince}j)... ";

        try {
            $success = $emailService->sendNeedHelpDay21Email(
                $user['email'],
                $user['first_name'] ?? 'Utilisateur',
                (int)$user['id']
            );

            if ($success) {
                echo "✓\n";
                $stats['day21']['sent']++;
            } else {
                echo "✗\n";
                $stats['day21']['errors']++;
            }
        } catch (Exception $e) {
            echo "✗ Erreur: {$e->getMessage()}\n";
            $stats['day21']['errors']++;
        }

        sleep(2);
    }

    // =========================================
    // RÉSUMÉ FINAL
    // =========================================
    echo "\n" . str_repeat("=", 70) . "\n";
    echo "RÉSUMÉ DES ENVOIS RÉTROACTIFS\n";
    echo str_repeat("=", 70) . "\n";
    echo sprintf("J+3  : %d envoyés, %d erreurs\n", $stats['day3']['sent'], $stats['day3']['errors']);
    echo sprintf("J+7  : %d envoyés, %d erreurs\n", $stats['day7']['sent'], $stats['day7']['errors']);
    echo sprintf("J+21 : %d envoyés, %d erreurs\n", $stats['day21']['sent'], $stats['day21']['errors']);
    echo str_repeat("=", 70) . "\n";

    $totalSent = $stats['day3']['sent'] + $stats['day7']['sent'] + $stats['day21']['sent'];
    $totalErrors = $stats['day3']['errors'] + $stats['day7']['errors'] + $stats['day21']['errors'];

    echo "TOTAL : {$totalSent} emails envoyés, {$totalErrors} erreurs\n";
    echo "\nTerminé ! Vous pouvez maintenant configurer le cron avec send-engagement-emails.php\n";
    echo str_repeat("=", 70) . "\n\n";

} catch (Exception $e) {
    echo "\n[ERREUR FATALE] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

exit(0);
