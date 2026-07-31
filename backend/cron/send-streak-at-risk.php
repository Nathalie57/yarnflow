#!/usr/bin/env php
<?php
/**
 * @file send-streak-at-risk.php
 * @brief Script cron pour prévenir les utilisatrices qui vont perdre leur série
 * @author YarnFlow Team + AI:Claude
 * @created 2026-07-28
 *
 * A exécuter en soirée (contrairement aux autres crons de réengagement lancés
 * le matin) : le message "il vous reste jusqu'à ce soir" n'a de sens que si
 * la journée n'est pas déjà terminée.
 *
 * Usage: php send-streak-at-risk.php
 * Cron: 0 19 * * * /usr/bin/php /path/to/backend/cron/send-streak-at-risk.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\Project;
use App\Services\EmailService;
use App\Services\PushService;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

echo "[CRON] Démarrage du script streak_at_risk - " . date('Y-m-d H:i:s') . "\n";

// [AI:Claude] Ne célébrer/prévenir qu'à partir d'une série qui compte vraiment
// (1 seul jour n'est pas encore une "série" à sauver)
const MIN_STREAK_TO_WARN = 2;

try {
    $db = Database::getInstance()->getConnection();
    $projectModel = new Project();
    $emailService = new EmailService($db);
    $pushService = new PushService();

    // [AI:Claude] Candidates : ont tricoté hier (leur série est donc encore vivante)
    // mais pas encore aujourd'hui — sinon pas de risque, rien à envoyer.
    $stmt = $db->prepare("
        SELECT u.id AS user_id, u.email, u.first_name
        FROM users u
        INNER JOIN projects p ON p.user_id = u.id
        INNER JOIN project_rows pr ON pr.project_id = p.id
        WHERE u.email_verified = 1
        GROUP BY u.id, u.email, u.first_name
        HAVING MAX(DATE(pr.completed_at)) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    ");
    $stmt->execute();
    $candidates = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[STREAK_AT_RISK] " . count($candidates) . " candidate(s) (dernier rang = hier)\n";

    $sent = 0;
    $skipped = 0;
    $errors = 0;

    foreach ($candidates as $row) {
        $userId = (int)$row['user_id'];

        $status = $projectModel->getStreakStatus($userId);
        $streak = $status['current_streak'];

        if ($streak < MIN_STREAK_TO_WARN) {
            $skipped++;
            continue;
        }

        // Un seul rappel par jour et par utilisatrice
        $dedupStmt = $db->prepare("
            SELECT 1 FROM emails_sent_log
            WHERE user_id = :user_id
            AND email_type = 'streak_at_risk'
            AND DATE(sent_at) = CURDATE()
        ");
        $dedupStmt->execute([':user_id' => $userId]);
        if ($dedupStmt->fetch()) {
            $skipped++;
            continue;
        }

        echo "[STREAK_AT_RISK] Envoi à {$row['email']} (série de {$streak} jours)... ";

        try {
            $ok = $emailService->sendStreakAtRiskEmail(
                $row['email'],
                $row['first_name'] ?? 'Utilisatrice',
                $streak,
                $userId
            );

            if ($ok) {
                echo "✓\n";
                $sent++;
                $pushService->sendToUser(
                    $userId,
                    'Votre série est en danger 🔥',
                    "{$streak} jours de suite — comptez un rang avant minuit pour la garder.",
                    '/my-projects'
                );
            } else {
                echo "✗\n";
                $errors++;
            }
        } catch (Exception $e) {
            echo "✗ {$e->getMessage()}\n";
            $errors++;
        }

        sleep(2);
    }

    echo "\n" . str_repeat("=", 60) . "\n";
    echo "RÉSUMÉ : {$sent} envoyés, {$skipped} ignorés, {$errors} erreurs\n";
    echo str_repeat("=", 60) . "\n";
    echo "[CRON] Terminé - " . date('Y-m-d H:i:s') . "\n\n";

} catch (Exception $e) {
    echo "[ERREUR FATALE] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

exit(0);
