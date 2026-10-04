<?php

declare(strict_types=1);

namespace Tests;

use App\Services\SectionCompletionPolicy;
use PHPUnit\Framework\TestCase;

final class SectionCompletionPolicyTest extends TestCase
{
    public function testInformationalAndLegacyCountersNeverBlockCompletion(): void
    {
        self::assertTrue(SectionCompletionPolicy::requiredCountersComplete([
            ['target' => 10, 'count' => 0],
            ['tracking_role' => 'informational', 'target' => 4, 'count' => 0],
        ]));
    }

    public function testRequiredCounterMustReachItsTarget(): void
    {
        self::assertFalse(SectionCompletionPolicy::requiredCountersComplete([
            ['tracking_role' => 'required_cycle', 'target' => 6, 'count' => 1],
        ]));
        self::assertTrue(SectionCompletionPolicy::requiredCountersComplete([
            ['tracking_role' => 'required_cycle', 'target' => 6, 'count' => 6],
            ['tracking_role' => 'required_parallel', 'target' => 2, 'count' => 2],
        ]));
    }
}
