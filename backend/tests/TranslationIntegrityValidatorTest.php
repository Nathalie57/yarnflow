<?php

declare(strict_types=1);

namespace Tests;

use App\Services\TranslationIntegrityValidator;
use PHPUnit\Framework\TestCase;

final class TranslationIntegrityValidatorTest extends TestCase
{
    public function testEnglishPrepositionInIsNotAnInch(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Work 1 sc in each stitch.', 'Crocheter 1 ms dans chaque maille.'
        )['valid']);
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Repeat row 1 in the pattern.', 'Répéter le rang 1 du patron.'
        )['valid']);
    }

    public function testActualInchMeasurementsArePreserved(): void
    {
        foreach (['10', '10.5', '1/2', '1 1/2', '10 (12)'] as $number) {
            self::assertTrue(TranslationIntegrityValidator::validate(
                "Work until piece measures {$number} in.", "Tricoter jusqu’à {$number} pouces."
            )['valid']);
            $invalid = TranslationIntegrityValidator::validate(
                "Work until piece measures {$number} in.", "Tricoter jusqu’à {$number} cm."
            );
            self::assertContains('units_changed', array_column($invalid['errors'], 'code'));
        }
    }

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

    public function testGlossaryK2togDoesNotCreateANumericOrUnitMismatch(): void
    {
        $result = TranslationIntegrityValidator::validate(
            'K2tog, knit to end.',
            '2 m ens end, tricoter jusqu’à la fin.'
        );
        self::assertTrue($result['valid']);
    }

    public function testUnrelatedNumbersRemainProtectedNextToK2tog(): void
    {
        $result = TranslationIntegrityValidator::validate(
            'K2tog, then knit 8 stitches.',
            '2 m ens end, puis tricoter 7 mailles.'
        );
        self::assertFalse($result['valid']);
        self::assertContains('numbers_changed', array_column($result['errors'], 'code'));
    }

    /** @dataProvider equivalentMeasurementProvider */
    public function testEquivalentFractionsAndDecimalSeparatorsAreAccepted(string $source, string $translation): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate($source, $translation)['valid']);
    }

    public static function equivalentMeasurementProvider(): array
    {
        return [
            'unicode half to decimal comma' => ['Work 1½ in.', 'Tricoter 1,5 pouce.'],
            'unicode seven eighths to decimal comma' => ['Work 7⅜ in.', 'Tricoter 7,375 pouces.'],
            'mixed fraction to decimal point' => ['Work 1 1/2 in.', 'Tricoter 1.5 pouce.'],
            'decimal separator' => ['Work 18.5 cm.', 'Tricoter 18,5 cm.'],
        ];
    }

    public function testTextileMAbbreviationIsAcceptedOnlyWithSameQuantity(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Work 20 stitches.', 'Tricoter 20 m.'
        )['valid']);

        $invalid = TranslationIntegrityValidator::validate('Work 20 stitches.', 'Tricoter 18 m.');
        self::assertFalse($invalid['valid']);
        self::assertContains('numbers_changed', array_column($invalid['errors'], 'code'));
    }

    /** @dataProvider changedMeasurementProvider */
    public function testChangedValueOrPhysicalUnitIsRejected(string $source, string $translation): void
    {
        $result = TranslationIntegrityValidator::validate($source, $translation);
        self::assertFalse($result['valid']);
        self::assertNotEmpty(array_intersect(['numbers_changed', 'units_changed'], array_column($result['errors'], 'code')));
    }

    public static function changedMeasurementProvider(): array
    {
        return [
            'changed centimeters' => ['Work 18.5 cm.', 'Tricoter 19 cm.'],
            'forbidden conversion' => ['Work 4 in.', 'Tricoter 10 cm.'],
            'fraction with changed unit' => ['Work 1½ in.', 'Tricoter 1,5 cm.'],
        ];
    }

    public function testCompactPurlCountRemainsVisibleAfterTranslationFormatting(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Work (knit 3 / purl2) until there are 8 stitches left.',
            'Tricoter (3 m end / 2 m env) jusqu’à ce qu’il reste 8 mailles.'
        )['valid']);
    }

    public function testFrenchStitchAbbreviationBeforeCountMatchesImplicitKnitAndPurl(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Work (knit 3 / purl 2) until there are 8 stitches left.',
            'Tricoter (m end 3 / m env 2) jusqu’à ce qu’il reste 8 mailles.'
        )['valid']);

        $changed = TranslationIntegrityValidator::validate(
            'Work (knit 3 / purl 2) until there are 8 stitches left.',
            'Tricoter (m end 4 / m env 2) jusqu’à ce qu’il reste 8 mailles.'
        );
        self::assertFalse($changed['valid']);
        self::assertContains('numbers_changed', array_column($changed['errors'], 'code'));
    }

    public function testPhysicalMeterIsNotAutomaticallyTreatedAsAStitch(): void
    {
        $result = TranslationIntegrityValidator::validate(
            'Work 2 stitches.', 'Tricoter until the piece measures 2 m.'
        );
        self::assertFalse($result['valid']);
        self::assertContains('units_changed', array_column($result['errors'], 'code'));
    }

    public function testMBeforeStockinetteIsRecognizedAsATextileAbbreviation(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Work 10 stitches stockinette stitch.', 'Tricoter 10 m jersey.'
        )['valid']);
    }

    public function testImplicitStitchAfterKnitMayBeExplicitOrRemainImplicit(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate('Knit 4.', 'Tricoter 4 m.')['valid']);
        self::assertTrue(TranslationIntegrityValidator::validate('Knit 4.', 'Tricoter 4.')['valid']);

        $invalid = TranslationIntegrityValidator::validate('Knit 4.', 'Tricoter 5 m.');
        self::assertFalse($invalid['valid']);
        self::assertContains('numbers_changed', array_column($invalid['errors'], 'code'));
    }

    public function testExampleAbbreviationIsNotReadAsGrams(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Count stitches (e.g. 20 stitches).', 'Compter les mailles (par exemple 20 mailles).'
        )['valid']);
        self::assertTrue(TranslationIntegrityValidator::validate('Use 50 g.', 'Utiliser 50 g.')['valid']);
    }

    public function testExpandedKnitTwoTogetherIsSymmetricWithFrenchGlossary(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Knit 2 stitches together.', '2 mailles ensemble endroit.'
        )['valid']);

        $invalid = TranslationIntegrityValidator::validate(
            'Knit 2 stitches together.', '3 mailles ensemble endroit.'
        );
        self::assertFalse($invalid['valid']);
        self::assertContains('numbers_changed', array_column($invalid['errors'], 'code'));
    }

    public function testWorkedInTheRoundIsNotAQuantifiedRound(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Garter stitch (worked in the round). Work 2 rounds.',
            'Point mousse (travaillé en rond). Tricoter 2 tours.'
        )['valid']);

        $invalid = TranslationIntegrityValidator::validate('Work 2 rounds.', 'Tricoter 2 rangs.');
        self::assertFalse($invalid['valid']);
        self::assertContains('units_changed', array_column($invalid['errors'], 'code'));
    }

    public function testConstructionAndStitchNamesDoNotCreateFakeUnits(): void
    {
        $source = 'NECK WARMER. Worked in the round. Cast on 120 sts with 5 mm needles. '
            . 'Work 4 rounds in GARTER ST. Work A.1 in the round. At 35 cm, work 4 rounds in garter st and bind off all sts.';
        $translation = 'TOUR DE COU. Tricoté en rond. Monter 120 m avec des aiguilles de 5 mm. '
            . 'Tricoter 4 tours au POINT MOUSSE. Tricoter A.1 en rond. À 35 cm, tricoter 4 tours au point mousse et rabattre toutes les m.';

        self::assertTrue(TranslationIntegrityValidator::validate($source, $translation)['valid']);

        $changedRounds = str_replace('4 tours au POINT MOUSSE', '5 tours au POINT MOUSSE', $translation);
        $invalid = TranslationIntegrityValidator::validate($source, $changedRounds);
        self::assertFalse($invalid['valid']);
        self::assertContains('numbers_changed', array_column($invalid['errors'], 'code'));

        $missingStitches = str_replace('rabattre toutes les m', 'rabattre souplement', $translation);
        $invalid = TranslationIntegrityValidator::validate($source, $missingStitches);
        self::assertFalse($invalid['valid']);
        self::assertContains('units_changed', array_column($invalid['errors'], 'code'));
    }

    public function testFrenchRepetitionNounPreservesRepeatInstruction(): void
    {
        self::assertTrue(TranslationIntegrityValidator::validate(
            'Work on each repeat of A.1.', 'Tricoter sur chaque répétition de A.1.'
        )['valid']);

        $invalid = TranslationIntegrityValidator::validate(
            'Repeat rows 1 to 4.', 'Tricoter les rangs 1 à 4.'
        );
        self::assertFalse($invalid['valid']);
        self::assertContains('repeat_instruction_lost', array_column($invalid['errors'], 'code'));
    }
}
