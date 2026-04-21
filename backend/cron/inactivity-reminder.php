<?php
/**
 * Cron daily : envoie un email de rappel pour les projets en cours
 * non touchés depuis 7 jours, si l'utilisateur a activé les rappels.
 *
 * Commande cron (o2switch) : 0 8 * * * php /path/to/backend/cron/inactivity-reminder.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Services\EmailService;

// Charger la config DB
$configPath = __DIR__ . '/../config/database.php';
if (!file_exists($configPath)) {
    error_log('[CRON inactivity] Config DB introuvable');
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
    error_log('[CRON inactivity] Connexion DB échouée : ' . $e->getMessage());
    exit(1);
}

$emailService = new EmailService($pdo);
$now = new DateTime();
$sent = 0;
$errors = 0;

// Projets en cours, non touchés depuis 7j, utilisateur avec rappels activés,
// et pas de rappel envoyé dans les 7 derniers jours pour ce projet
$sql = <<<SQL
    SELECT
        p.id            AS project_id,
        p.name          AS project_name,
        p.updated_at    AS last_activity,
        p.progress,
        u.id            AS user_id,
        u.email,
        u.name          AS user_name
    FROM projects p
    JOIN users u ON u.id = p.user_id
    WHERE p.status = 'in_progress'
      AND u.inactivity_reminder_enabled = 1
      AND p.updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND (
            p.last_inactivity_reminder_at IS NULL
         OR p.last_inactivity_reminder_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
    ORDER BY p.updated_at ASC
SQL;

$stmt = $pdo->query($sql);
$projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

error_log('[CRON inactivity] ' . count($projects) . ' projet(s) à relancer');

foreach ($projects as $project) {
    $projectData = [
        'name'     => $project['project_name'],
        'progress' => (int) $project['progress'],
    ];

    $ok = $emailService->sendReengagementDay7Email(
        $project['email'],
        $project['user_name'] ?? 'tricoteuse',
        $projectData,
        (int) $project['user_id']
    );

    if ($ok) {
        // Mettre à jour last_inactivity_reminder_at
        $update = $pdo->prepare('UPDATE projects SET last_inactivity_reminder_at = NOW() WHERE id = :id');
        $update->execute([':id' => $project['project_id']]);
        $sent++;
        error_log("[CRON inactivity] Email envoyé → {$project['email']} pour projet #{$project['project_id']}");
    } else {
        $errors++;
        error_log("[CRON inactivity] Échec email → {$project['email']} pour projet #{$project['project_id']}");
    }
}

error_log("[CRON inactivity] Terminé — $sent envoyés, $errors erreurs");
