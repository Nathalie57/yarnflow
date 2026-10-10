<?php

declare(strict_types=1);

namespace Tests;

use App\Models\User;
use PDO;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class UserSubscriptionTest extends TestCase
{
    protected function setUp(): void
    {
        require_once __DIR__.'/../config/constants.php';
    }

    private function userModel(): User
    {
        $db = new PDO('sqlite::memory:');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, subscription_type TEXT, subscription_expires_at TEXT)');
        $db->exec("INSERT INTO users VALUES (1, 'free', NULL)");
        $user = (new \ReflectionClass(User::class))->newInstanceWithoutConstructor();
        (new \ReflectionProperty(User::class, 'db'))->setValue($user, $db);
        return $user;
    }

    public function testPlusAnnualIsPersistedAndGrantsPlusFeatures(): void
    {
        $user = $this->userModel();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));
        self::assertTrue($user->updateSubscription(1, SUBSCRIPTION_PLUS_ANNUAL, $expiresAt));
        $saved = $user->findById(1);
        self::assertSame('plus_annual', $saved['subscription_type']);
        self::assertSame($expiresAt, $saved['subscription_expires_at']);
        self::assertTrue($user->hasActiveSubscription(1));
        $features = $user->getSubscriptionFeatures(1);
        self::assertSame(5, $features['photo_credits_per_month']);
        self::assertSame(10, $features['ai_questions_per_month']);
        self::assertSame(3, $features['smart_project_imports_monthly']);
    }

    public function testReturningToFreeClearsPreviousExpiration(): void
    {
        $user = $this->userModel();
        $user->updateSubscription(1, SUBSCRIPTION_PLUS_ANNUAL, '2099-01-01 00:00:00');
        self::assertTrue($user->updateSubscription(1, SUBSCRIPTION_FREE));
        self::assertNull($user->findById(1)['subscription_expires_at']);
        self::assertFalse($user->hasActiveSubscription(1));
    }
}
