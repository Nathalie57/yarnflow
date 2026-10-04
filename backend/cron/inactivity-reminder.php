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
use App\Services\PushService;

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
$pushService  = new PushService();
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
        CASE
            WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0
                THEN (SELECT CASE
                    WHEN SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) THEN 1 ELSE 0 END) = 0
                     AND COUNT(DISTINCT CASE WHEN COALESCE(progression_type, 'simple') <> 'action' THEN COALESCE(counter_unit, 'rows') END) <= 1
                     AND SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN total_rows ELSE 0 END) > 0
                    THEN ROUND(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN current_row ELSE 0 END) /
                               SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN total_rows ELSE 0 END) * 100)
                    ELSE NULL END FROM project_sections WHERE project_id = p.id)
            WHEN p.total_rows > 0 THEN ROUND(p.current_row / p.total_rows * 100)
            ELSE NULL
        END AS progress,
        (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) AS sections_count,
        (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id AND is_completed = 1) AS completed_sections_count,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_current_rows,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN total_rows ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_total_rows,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS unquantifiable_current_rows,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND COALESCE(counter_unit, 'rows') = 'rows' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_current_rows_unit,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND COALESCE(counter_unit, 'rows') = 'rows' THEN total_rows ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_total_rows_unit,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND counter_unit = 'cm' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_current_cm,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND counter_unit = 'cm' THEN total_rows ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_total_cm,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) AND COALESCE(counter_unit, 'rows') = 'rows' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS unquantifiable_current_rows_unit,
        (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) AND counter_unit = 'cm' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS unquantifiable_current_cm,
        CASE WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0
             THEN (SELECT COALESCE(SUM(current_row), 0) FROM project_sections WHERE project_id = p.id)
             ELSE COALESCE(p.current_row, 0) END AS activity_rows,
        u.id            AS user_id,
        u.email,
        u.first_name    AS user_name
    FROM projects p
    JOIN users u ON u.id = p.user_id
    WHERE p.status = 'in_progress'
      AND COALESCE(u.inactivity_reminder_enabled, 1) = 1
      AND p.updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND (
            p.last_inactivity_reminder_at IS NULL
         OR p.last_inactivity_reminder_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
      AND NOT EXISTS (
            SELECT 1 FROM emails_sent_log
            WHERE user_id = u.id AND email_type = 'reengagement_day7' AND status = 'sent'
              AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      )
    ORDER BY p.updated_at ASC
SQL;

$stmt = $pdo->query($sql);
$projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

error_log('[CRON inactivity] ' . count($projects) . ' projet(s) à relancer');

foreach ($projects as $project) {
    $projectData = [
        'name'     => $project['project_name'],
        'progress' => $project['progress'] !== null ? (int)$project['progress'] : null,
        'sections_count' => (int)$project['sections_count'],
        'completed_sections_count' => (int)$project['completed_sections_count'],
        'quantifiable_current_rows' => (int)$project['quantifiable_current_rows'],
        'quantifiable_total_rows' => (int)$project['quantifiable_total_rows'],
        'unquantifiable_current_rows' => (int)$project['unquantifiable_current_rows'],
        'quantifiable_current_rows_unit' => (float)$project['quantifiable_current_rows_unit'],
        'quantifiable_total_rows_unit' => (float)$project['quantifiable_total_rows_unit'],
        'quantifiable_current_cm' => (float)$project['quantifiable_current_cm'],
        'quantifiable_total_cm' => (float)$project['quantifiable_total_cm'],
        'unquantifiable_current_rows_unit' => (float)$project['unquantifiable_current_rows_unit'],
        'unquantifiable_current_cm' => (float)$project['unquantifiable_current_cm'],
        'activity_rows' => (int)$project['activity_rows'],
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

        // Push en complément de l'email
        try {
            $pushService->sendToUser(
                (int)$project['user_id'],
                'Ton projet t\'attend',
                "{$project['project_name']} — reprends là où tu t'étais arrêtée",
                '/projects/' . $project['project_id']
            );
        } catch (\Exception $e) {
            error_log("[CRON inactivity] Push échoué pour user {$project['user_id']}: " . $e->getMessage());
        }
    } else {
        $errors++;
        error_log("[CRON inactivity] Échec email → {$project['email']} pour projet #{$project['project_id']}");
    }
}

error_log("[CRON inactivity] Terminé — $sent envoyés, $errors erreurs");
