<?php
/**
 * @file AnalyticsService.php
 * @brief Journal des jalons du parcours produit, en base plutôt que dans GA4
 *
 * [AI:Claude] 2026-08-23 — created / opened / first_row_counted / section_changed
 * n'existaient pour aucun projet réel (seul le projet démo était instrumenté, via
 * tutorial_step côté GA4). Cette table permet de lire l'entonnoir en SQL, comme le
 * reste de l'analyse produit, sans dépendre de l'interface GA4.
 *
 * Ne doit jamais faire échouer l'action appelante : toute erreur est avalée et
 * loguée, jamais remontée (même logique que grantStreakBonusIfEligible dans
 * ProjectController).
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;

class AnalyticsService
{
    public static function log(int $userId, ?int $projectId, string $eventName, array $data = []): void
    {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                'INSERT INTO analytics_events (user_id, project_id, event_name, event_data)
                 VALUES (:user_id, :project_id, :event_name, :event_data)'
            );
            $stmt->execute([
                ':user_id' => $userId,
                ':project_id' => $projectId,
                ':event_name' => $eventName,
                ':event_data' => $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null,
            ]);
        } catch (\Exception $e) {
            error_log("[ANALYTICS ERROR] {$eventName}: " . $e->getMessage());
        }
    }
}
