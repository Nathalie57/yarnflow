<?php

declare(strict_types=1);

namespace Tests;

use App\Services\FlowPatternContextSelector;
use PHPUnit\Framework\TestCase;

final class FlowPatternContextSelectorTest extends TestCase
{
    public function testShortPatternRemainsVerbatimIncludingItsDefinition(): void
    {
        $text = "### Neck\nWork BANDS WITH I-CORD — read explanation above.\n### Notes\nBANDS WITH I-CORD:\nSlip 3 stitches with yarn in front.";
        self::assertSame($text, FlowPatternContextSelector::select($text, ['name' => 'Neck']));
    }

    public function testLateActiveSectionAndLateNamedDefinitionReplaceIrrelevantPrefix(): void
    {
        $text = "### Body\n" . str_repeat("Unrelated body instructions.\n", 1600)
            . "### Neck\nWork 7 stitches according to BANDS WITH I-CORD — read explanation above.\n"
            . "### Other\n" . str_repeat("Other instructions.\n", 1600)
            . "### BANDS WITH I-CORD\nSlip 3 stitches with yarn in front. This is the pattern-specific variant.\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Neck']);
        self::assertLessThanOrEqual(30000, mb_strlen($selected));
        self::assertStringContainsString('### Neck', $selected);
        self::assertStringContainsString('Slip 3 stitches with yarn in front. This is the pattern-specific variant.', $selected);
        self::assertStringContainsString('PATTERN PARTIEL', $selected);
        self::assertLessThan(strpos($selected, '### BANDS WITH I-CORD'), strpos($selected, '### Neck'));
    }

    public function testNamedVariantsInsideFreeTextNotesAndTransitiveReferenceAreRetained(): void
    {
        $text = "### Body\r\n" . str_repeat("Filler.\r\n", 5000)
            . "### Neck\r\nWork BANDS WITH I-CORD — read explanation above.\r\n"
            . "### Notes du patron\r\n"
            . "BANDS WITH I-CORD - BEGINNING OF ROW:\r\nUse SPECIAL SLIP, then knit 4.\r\n"
            . "BANDS WITH I-CORD - END OF ROW:\r\nKnit 4, then slip 3.\r\n"
            . "SPECIAL SLIP:\r\nSlip with yarn behind, not in front.\r\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Neck']);
        self::assertStringContainsString('Use SPECIAL SLIP, then knit 4.', $selected);
        self::assertStringContainsString('Knit 4, then slip 3.', $selected);
        self::assertStringContainsString('Slip with yarn behind, not in front.', $selected);
        self::assertLessThanOrEqual(30000, mb_strlen($selected));
    }

    public function testMissingDefinitionIsNotFabricated(): void
    {
        $text = "### Body\n" . str_repeat("Filler.\n", 5000)
            . "### Neck\nWork BANDS WITH I-CORD — read explanation above.\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Neck']);
        self::assertStringContainsString('Work BANDS WITH I-CORD', $selected);
        self::assertStringContainsString('Une définition non visible ne doit pas être inventée', $selected);
        self::assertStringNotContainsString('Slip', $selected);
    }

    public function testAmbiguousOrRenamedSectionDoesNotGetAssignedByPosition(): void
    {
        $text = "### Neck\nFirst neck.\n### Neck\nSecond neck.\n### Body\n" . str_repeat('é', 40000);
        foreach (['Neck', 'Col'] as $name) {
            $selected = FlowPatternContextSelector::select($text, ['name' => $name]);
            self::assertStringContainsString('n’a pas de correspondance unique', $selected);
            self::assertLessThanOrEqual(30000, mb_strlen($selected));
        }
    }

    public function testExactDescriptionCanLocateRenamedSectionWithoutFuzzyMatching(): void
    {
        $description = 'Purl one row from the wrong side, then work the rib with special bands.';
        $text = "### Body\n" . str_repeat('é', 40000) . "\n### Neck\n{$description}\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Mon col', 'description' => $description]);
        self::assertStringContainsString($description, $selected);
        self::assertStringNotContainsString('n’a pas de correspondance unique', $selected);
    }

    public function testOversizedActiveSectionAndDefinitionStayWithinBudgetAndSignalCuts(): void
    {
        $text = "### Neck\nUse SPECIAL EDGE.\n" . str_repeat('é', 40000)
            . "\n### SPECIAL EDGE\nPattern-specific definition.\n" . str_repeat('à', 20000);
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Neck']);
        self::assertLessThanOrEqual(30000, mb_strlen($selected));
        self::assertStringContainsString('Pattern-specific definition.', $selected);
        self::assertStringContainsString('Suite de ce passage omise', $selected);
        self::assertTrue(mb_check_encoding($selected, 'UTF-8'));
    }

    public function testMixedCaseFrenchDefinitionInNotesIsSelectedVerbatim(): void
    {
        $text = "### Corps\n" . str_repeat('Instructions non pertinentes. ', 2000)
            . "\n### Col\nTricoter une Maille spéciale, voir explication ci-dessus.\n"
            . "### Notes du patron\nMaille spéciale :\nGlisser trois mailles, fil derrière.\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Col']);
        self::assertStringContainsString('Maille spéciale :', $selected);
        self::assertStringContainsString('Glisser trois mailles, fil derrière.', $selected);
    }

    public function testLateExactDescriptionInTextWithoutHeadingsIsNotLost(): void
    {
        $description = 'Purl one row from the wrong side, then work the rib with special bands.';
        $text = str_repeat('Introductory information. ', 2000) . "\n{$description}\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Neck', 'description' => $description]);
        self::assertStringContainsString($description, $selected);
        self::assertLessThanOrEqual(30000, mb_strlen($selected));
    }

    public function testRepeatedDescriptionDoesNotEstablishUniqueCorrespondence(): void
    {
        $description = 'Purl one row from the wrong side, then work the rib with special bands.';
        $text = str_repeat('Introductory information. ', 2000) . "\n{$description}\n{$description}\n";
        $selected = FlowPatternContextSelector::select($text, ['name' => 'Neck', 'description' => $description]);
        self::assertStringContainsString('n’a pas de correspondance unique', $selected);
    }
}
