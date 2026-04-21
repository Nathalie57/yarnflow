<?php
/**
 * Cron daily : séquence d'emails automatiques post-inscription
 *
 * J+1  : premier projet créé → "Ton projet t'attend, voici le compteur"
 * J+3  : onboarding — "Tu as eu le temps de tricoter ?"
 * J+21 : besoin d'aide ?
 *
 * Commande cron (o2switch) : 0 9 * * * php /path/to/backend/cron/email-sequence.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\EmailService;

$configPath = __DIR__ . '/../config/database.php';
if (!file_exists($configPath)) {
    error_log('[CRON email-sequence] Config DB introuvable');
    exit(1);
}

$dbConfig = require $configPath;

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    error_log('[CRON email-sequence] Connexion DB échouée : ' . $e->getMessage());
    exit(1);
}

$emailService = new EmailService($pdo);

// Helper : vérifie si un email d'un certain type a déjà été envoyé à un user
function alreadySent(PDO $pdo, int $userId, string $emailType): bool
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM emails_sent_log WHERE user_id = :uid AND email_type = :type AND status = 'sent'"
    );
    $stmt->execute([':uid' => $userId, ':type' => $emailType]);
    return (int) $stmt->fetchColumn() > 0;
}

$totalSent = 0;

// -------------------------------------------------------------------------
// J+1 : premier projet créé — lien direct vers le compteur
// Condition : inscrit depuis 1-2j, a au moins 1 projet, n'a pas reçu cet email
// -------------------------------------------------------------------------
$stmt = $pdo->query("
    SELECT u.id, u.email, u.name,
           p.id AS project_id, p.name AS project_name
    FROM users u
    JOIN projects p ON p.user_id = u.id
    WHERE u.created_at BETWEEN DATE_SUB(NOW(), INTERVAL 2 DAY) AND DATE_SUB(NOW(), INTERVAL 20 HOUR)
    GROUP BY u.id
    ORDER BY u.created_at ASC
");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    if (alreadySent($pdo, $user['id'], 'first_project_ready')) continue;

    $projectUrl = 'https://yarnflow.fr/projects/' . $user['project_id'];
    $ok = $emailService->sendFirstProjectReadyEmail(
        $user['email'],
        $user['name'] ?? 'tricoteuse',
        $user['project_name'],
        $projectUrl,
        (int) $user['id']
    );
    if ($ok) {
        $totalSent++;
        error_log("[CRON email-sequence] J+1 → {$user['email']}");
    }
}

// -------------------------------------------------------------------------
// J+3 : onboarding — "Tu as eu le temps de tricoter ?"
// -------------------------------------------------------------------------
$stmt = $pdo->query("
    SELECT id, email, name
    FROM users
    WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 4 DAY) AND DATE_SUB(NOW(), INTERVAL 2 DAY)
");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    if (alreadySent($pdo, $user['id'], 'onboarding_day3')) continue;

    $hasProjects = (bool) $pdo->query(
        "SELECT COUNT(*) FROM projects WHERE user_id = {$user['id']}"
    )->fetchColumn();

    $ok = $emailService->sendOnboardingDay3Email(
        $user['email'],
        $user['name'] ?? 'tricoteuse',
        (int) $user['id'],
        $hasProjects
    );
    if ($ok) {
        $totalSent++;
        error_log("[CRON email-sequence] J+3 → {$user['email']}");
    }
}

// -------------------------------------------------------------------------
// J+21 : besoin d'aide ?
// -------------------------------------------------------------------------
$stmt = $pdo->query("
    SELECT id, email, name
    FROM users
    WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 22 DAY) AND DATE_SUB(NOW(), INTERVAL 20 DAY)
");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    if (alreadySent($pdo, $user['id'], 'need_help_day21')) continue;

    $ok = $emailService->sendNeedHelpDay21Email(
        $user['email'],
        $user['name'] ?? 'tricoteuse',
        (int) $user['id']
    );
    if ($ok) {
        $totalSent++;
        error_log("[CRON email-sequence] J+21 → {$user['email']}");
    }
}

error_log("[CRON email-sequence] Terminé — $totalSent email(s) envoyé(s)");
