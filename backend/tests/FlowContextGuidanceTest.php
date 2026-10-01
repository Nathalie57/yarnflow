<?php

declare(strict_types=1);

namespace Tests;

use App\Services\FlowContextGuidance;
use PHPUnit\Framework\TestCase;

final class FlowContextGuidanceTest extends TestCase
{
    public function testSimpleAndCompositeSectionsReceiveDifferentGuidance(): void
    {
        self::assertStringContainsString('repère prioritaire', FlowContextGuidance::sectionGuidance(['progression_type' => 'simple']));
        self::assertStringContainsString('sous-étape exacte', FlowContextGuidance::sectionGuidance(['progression_type' => 'composite']));
    }

    public function testSimpleRowProgressMeansCompletedRowsAndNextRow(): void
    {
        self::assertSame(
            'aucun rang terminé sur 10 — prochain rang à effectuer : 1',
            FlowContextGuidance::progressSummary(['current_row' => 0, 'total_rows' => 10, 'counter_unit' => 'rows'])
        );
        self::assertSame(
            '2 rangs terminés sur 10 — prochain rang à effectuer : 3',
            FlowContextGuidance::progressSummary(['current_row' => 2, 'total_rows' => 10, 'counter_unit' => 'rows'])
        );
        self::assertSame(
            '10 rangs terminés sur 10 — section terminée',
            FlowContextGuidance::progressSummary(['current_row' => 10, 'total_rows' => 10, 'counter_unit' => 'rows'])
        );
    }

    public function testCompositeAndCentimetreProgressDoNotInferNextRow(): void
    {
        self::assertSame(
            '2 rangs enregistrés',
            FlowContextGuidance::progressSummary(['current_row' => 2, 'counter_unit' => 'rows', 'progression_type' => 'composite'])
        );
        self::assertSame(
            '2,5/10,0 cm',
            FlowContextGuidance::progressSummary(['current_row' => 2.5, 'total_rows' => 10, 'counter_unit' => 'cm'])
        );
    }

    public function testChosenAndUnchosenMultiSizeGuidanceNeverSelectByDefault(): void
    {
        self::assertStringContainsString('Taille choisie', FlowContextGuidance::sizeGuidance('8 ans', true));
        $unchosen = FlowContextGuidance::sizeGuidance(null, true);
        self::assertStringContainsString('connues mais non résolues', $unchosen);
        self::assertStringContainsString('demander la taille', $unchosen);
        self::assertSame('', FlowContextGuidance::sizeGuidance(null, false));
    }
}
