<?php

declare(strict_types=1);

namespace Tests;

use App\Controllers\AiAssistantController;
use PHPUnit\Framework\TestCase;

final class FlowQuotaPlanTest extends TestCase
{
    public function testDisplayedUsageAndChatUseSameEffectiveSubscriptionPlan(): void
    {
        $reflection = new \ReflectionClass(AiAssistantController::class);
        $controller = $reflection->newInstanceWithoutConstructor();
        $method = $reflection->getMethod('effectivePlan');
        foreach ([
            [[], 'free'],
            [['subscription_type' => 'free'], 'free'],
            [['subscription_type' => 'pro', 'subscription_expires_at' => '2000-01-01'], 'free'],
            [['subscription_type' => 'pro', 'subscription_expires_at' => '2099-01-01'], 'pro'],
            [['subscription_type' => 'plus', 'subscription_expires_at' => null], 'plus'],
        ] as [$user, $expected]) {
            self::assertSame($expected, $method->invoke($controller, $user));
        }
    }
}
