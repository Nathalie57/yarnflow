<?php

declare(strict_types=1);

namespace Tests;

use App\Middleware\AuthMiddleware;
use PHPUnit\Framework\TestCase;

if (!defined('ROLE_ADMIN')) {
    define('ROLE_ADMIN', 'admin');
}

final class JacquardAccessPolicyTest extends TestCase
{
    public function testAdminAndBetaTesterAreAllowed(): void
    {
        self::assertTrue(AuthMiddleware::canAccessJacquard([
            'user_id' => 8,
            'role' => ROLE_ADMIN,
            'subscription_type' => 'free',
        ]));
        self::assertTrue(AuthMiddleware::canAccessJacquard([
            'user_id' => 30,
            'role' => 'user',
            'subscription_type' => 'free',
        ]));
        self::assertTrue(AuthMiddleware::canAccessJacquard([
            'user_id' => '30',
            'role' => 'user',
            'subscription_type' => 'free',
        ]));
    }

    public function testSubscriptionsDoNotGrantAccess(): void
    {
        self::assertFalse(AuthMiddleware::canAccessJacquard([
            'user_id' => 31,
            'role' => 'user',
            'subscription_type' => 'plus',
        ]));
        self::assertFalse(AuthMiddleware::canAccessJacquard([
            'user_id' => 32,
            'role' => 'user',
            'subscription_type' => 'pro',
        ]));
        self::assertFalse(AuthMiddleware::canAccessJacquard([
            'user_id' => 33,
            'role' => 'user',
            'subscription_type' => 'free',
        ]));
    }

    public function testEveryChartEndpointUsesTheGuardAndKeepsOwnershipChecks(): void
    {
        $source = file_get_contents(__DIR__ . '/../controllers/ProjectController.php');
        self::assertIsString($source);

        $methods = [
            'getCharts',
            'getAllCharts',
            'getChart',
            'createChart',
            'createUnassignedChart',
            'getUnassignedChart',
            'updateUnassignedChart',
            'deleteUnassignedChart',
            'updateChart',
            'deleteChart',
        ];

        foreach ($methods as $index => $method) {
            $start = strpos($source, 'public function ' . $method . '(');
            self::assertNotFalse($start, $method . ' must exist');
            $end = isset($methods[$index + 1])
                ? strpos($source, 'public function ' . $methods[$index + 1] . '(', $start + 1)
                : strpos($source, '// ========================================================================', $start + 1);
            self::assertNotFalse($end, $method . ' boundary must exist');
            $body = substr($source, $start, $end - $start);
            self::assertStringContainsString('$this->getJacquardUserIdFromAuth()', $body, $method);
        }

        foreach (['getCharts', 'getChart', 'createChart', 'updateChart', 'deleteChart'] as $method) {
            $body = $this->methodBody($source, $method);
            self::assertStringContainsString('belongsToUser', $body, $method . ' must keep project ownership checks');
        }

        foreach (['getUnassignedChart', 'updateUnassignedChart', 'deleteUnassignedChart'] as $method) {
            $body = $this->methodBody($source, $method);
            self::assertStringContainsString('getChartByUser', $body, $method . ' must keep chart ownership checks');
        }

        self::assertStringContainsString("'error_code' => 'jacquard_beta_forbidden'", $source);
    }

    private function methodBody(string $source, string $method): string
    {
        $start = strpos($source, 'public function ' . $method . '(');
        self::assertNotFalse($start);
        $end = strpos($source, 'public function ', $start + 1);
        self::assertNotFalse($end);
        return substr($source, $start, $end - $start);
    }
}
