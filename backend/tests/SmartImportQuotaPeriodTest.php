<?php

declare(strict_types=1);

namespace Tests;

use App\Services\SmartImportQuotaPeriod;
use DateTimeImmutable;
use PDO;
use PHPUnit\Framework\TestCase;

final class SmartImportQuotaPeriodTest extends TestCase
{
    public function testNewAnnualSubscriberHasThreeImportsDespiteFreeTrialUsage(): void
    {
        $period = SmartImportQuotaPeriod::forUser([
            'subscription_type' => 'plus_annual',
            'subscription_expires_at' => '2027-10-10 12:00:00',
        ], new DateTimeImmutable('2026-10-10 12:00:01'));
        self::assertSame('2026-10-10 12:00:00', $period['start']->format('Y-m-d H:i:s'));
        self::assertSame('2026-11-09', $period['next_reset']->format('Y-m-d'));

        $db = new PDO('sqlite::memory:');
        $db->exec('CREATE TABLE ai_pattern_imports (user_id INTEGER, created_at TEXT, project_id INTEGER)');
        $db->exec("INSERT INTO ai_pattern_imports VALUES (1, '2026-10-09 10:00:00', 1), (1, '2026-10-10 11:59:59', 2)");
        $stmt = $db->prepare('SELECT COUNT(*) FROM ai_pattern_imports WHERE user_id = :user_id AND created_at >= :period_start AND project_id IS NOT NULL');
        $params = ['user_id' => 1, 'period_start' => $period['start']->format('Y-m-d H:i:s')];
        $stmt->execute($params);
        self::assertSame(3, 3 - (int)$stmt->fetchColumn());
        $db->exec("INSERT INTO ai_pattern_imports VALUES (1, '2026-10-10 12:01:00', 3)");
        $stmt->execute($params);
        self::assertSame(2, 3 - (int)$stmt->fetchColumn());
    }

    public function testAnnualQuotaResetsAfterThirtyDays(): void
    {
        $period = SmartImportQuotaPeriod::forUser([
            'subscription_type' => 'plus_annual',
            'subscription_expires_at' => '2027-10-10 12:00:00',
        ], new DateTimeImmutable('2026-11-09 12:00:00'));
        self::assertSame('2026-11-09 12:00:00', $period['start']->format('Y-m-d H:i:s'));
        self::assertSame('2026-12-09 12:00:00', $period['next_reset']->format('Y-m-d H:i:s'));
    }

    public function testMonthlySubscriberStartsAtActivation(): void
    {
        $period = SmartImportQuotaPeriod::forUser([
            'subscription_type' => 'plus',
            'subscription_expires_at' => '2026-11-10 12:00:00',
        ], new DateTimeImmutable('2026-10-10 12:00:01'));
        self::assertSame('2026-10-10 12:00:00', $period['start']->format('Y-m-d H:i:s'));
    }
}
