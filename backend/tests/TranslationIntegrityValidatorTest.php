<?php

declare(strict_types=1);

namespace Tests;

use App\Services\TranslationIntegrityValidator;
use PHPUnit\Framework\TestCase;

final class TranslationIntegrityValidatorTest extends TestCase
{
    public function testAlteredNumberIsRejected(): void
    {
        $result = TranslationIntegrityValidator::validate('Work 74 stitches for 10 rows.', 'Tricoter 72 mailles pendant 10 rangs.');
        self::assertFalse($result['valid']);
        self::assertSame('numbers_changed', $result['errors'][0]['code']);
    }

    public function testLostRepeatIsRejected(): void
    {
        $result = TranslationIntegrityValidator::validate('Repeat rows 1-4 3 times.', 'Tricoter les rangs 1-4 3 fois.');
        self::assertFalse($result['valid']);
        self::assertContains('repeat_instruction_lost', array_column($result['errors'], 'code'));
    }

    public function testValidRewordingIsAccepted(): void
    {
        $result = TranslationIntegrityValidator::validate('Repeat rows 1-4 3 times (12 rows).', 'Répéter les rangs 1-4 3 fois (12 rangs).');
        self::assertTrue($result['valid']);
    }
}
