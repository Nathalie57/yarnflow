<?php

declare(strict_types=1);

namespace App\Services;

final class SectionCompletionPolicy
{
    public static function requiredCountersComplete(array $counters): bool
    {
        foreach ($counters as $counter) {
            if (!in_array($counter['tracking_role'] ?? 'informational', ['required_cycle', 'required_parallel'], true)) {
                continue;
            }
            if (($counter['target'] ?? null) === null || (float)($counter['count'] ?? 0) < (float)$counter['target']) {
                return false;
            }
        }
        return true;
    }
}
