<?php
declare(strict_types=1);

namespace Tests;

use App\Services\SmartCreationTrackingService as Tracking;
use PHPUnit\Framework\TestCase;

final class SmartCreationTrackingServiceTest extends TestCase
{
    public function testSuccessAndFailureCorrelateWithStartedWithoutInventingFields(): void
    {
        $id = Tracking::normalizeAttemptId('81cbdc11-d493-4e26-a8c9-585dcf05087b');
        $started = Tracking::startedData($id, 'pdf');
        $success = Tracking::completionData($id, 'pdf', 'success', false, 29500, 42);
        $error = Tracking::completionData($id, 'pdf', 'error', false, 1200, null, 'gemini_timeout');
        self::assertSame($started['attempt_id'], $success['attempt_id']);
        self::assertSame($started['attempt_id'], $error['attempt_id']);
        self::assertSame(42, $success['import_id']);
        self::assertSame('pdf', $success['source_type']);
        self::assertSame(29500, $success['processing_time_ms']);
        self::assertArrayNotHasKey('error_code', $success);
        self::assertArrayNotHasKey('import_id', $error);
        self::assertSame('gemini_timeout', $error['error_code']);
    }

    public function testEveryNewRequestCanHaveANewIdEvenForCachedResult(): void
    {
        $first = Tracking::normalizeAttemptId(null);
        $second = Tracking::normalizeAttemptId(null);
        self::assertNotSame($first, $second);
        self::assertMatchesRegularExpression('/^[a-zA-Z0-9-]{16,64}$/', $first);
        self::assertNotSame('invalid', Tracking::normalizeAttemptId('invalid'));
        self::assertTrue(Tracking::completionData($second, 'text', 'success', true, 4, 12)['cached']);
    }

    public function testGatesUseKnownLanguageAndActualWarningPriority(): void
    {
        self::assertSame([], Tracking::gateTypes(['language' => 'en'], 'success'));
        self::assertSame(['translation'], Tracking::gateTypes(['language' => 'en'], 'success', 'fr'));
        self::assertSame(['diagram', 'partial'], Tracking::gateTypes(['language' => 'en', 'contains_diagram' => true], 'partial', 'fr'));
        $event = Tracking::completionData('attempt-123456789', 'url', 'partial', false, 20, 3, null, ['diagram', 'partial']);
        self::assertSame('diagram', $event['gate_type']);
        self::assertSame(['diagram', 'partial'], $event['gate_types']);
    }

    public function testPendingAndConfirmReadPersistedIdRatherThanClientOrTimeOrdering(): void
    {
        $source = file_get_contents(__DIR__ . '/../controllers/SmartProjectController.php');
        self::assertStringContainsString("['data']['_analytics'] = ['attempt_id' => \$attemptId]", $source);
        self::assertStringContainsString("['_analytics']['attempt_id'] ?? null", $source);
        self::assertStringContainsString("'import_id' => \$importId, 'attempt_id' => \$attemptId", $source);
    }
}
