<?php
declare(strict_types=1);

namespace App\Services;

final class ProgressActivationService
{
    public static function isActualProgress(mixed $before, mixed $after, bool $explicitProgressAction): bool
    {
        return $explicitProgressAction && is_numeric($before) && is_numeric($after) && (float)$after > (float)$before;
    }

    /** Read the persisted counter, not the aggregate projects.current_row returned by the UI query. */
    public static function counterValue(int $projectId, ?int $sectionId = null): mixed
    {
        try {
            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare($sectionId === null
                ? 'SELECT current_row FROM projects WHERE id = :pid'
                : 'SELECT current_row FROM project_sections WHERE project_id = :pid AND id = :sid');
            $stmt->execute($sectionId === null ? [':pid' => $projectId] : [':pid' => $projectId, ':sid' => $sectionId]);
            return $stmt->fetchColumn();
        } catch (\Exception $e) {
            error_log('[ANALYTICS ERROR] counterValue: ' . $e->getMessage());
            return null;
        }
    }

    public static function recordCounterUpdate(int $userId, int $projectId, mixed $before, mixed $after, bool $explicitProgressAction): bool
    {
        if (!self::isActualProgress($before, $after, $explicitProgressAction)) return false;
        return AnalyticsService::logActivationIfFirst($userId, $projectId);
    }
}
