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

    public function testActionSectionIsDescribedAsManualAndCanBeMarkedComplete(): void
    {
        self::assertSame(
            'action ponctuelle à réaliser puis à marquer comme terminée',
            FlowContextGuidance::progressSummary(['progression_type' => 'action', 'is_completed' => 0])
        );
        self::assertSame(
            'action ponctuelle terminée',
            FlowContextGuidance::progressSummary(['progression_type' => 'action', 'is_completed' => 1])
        );
        self::assertStringContainsString(
            'aucune progression en rangs',
            FlowContextGuidance::sectionGuidance(['progression_type' => 'action'])
        );
    }

    public function testUnknownOperationCounterExposesFullSemanticsWithoutInferringDuration(): void
    {
        $summary = FlowContextGuidance::secondaryCounterSummary([
            'label' => 'Augmentations raglan',
            'count' => 0,
            'target' => 27,
            'unit' => 'count',
            'tracking_role' => 'unknown',
            'cycle_length' => 2,
        ]);

        self::assertStringContainsString('0/27', $summary);
        self::assertStringContainsString('unité sémantique=count', $summary);
        self::assertStringContainsString('tracking_role=unknown', $summary);
        self::assertStringContainsString('cycle_length=2', $summary);
        self::assertStringContainsString('ne pas en déduire la durée', $summary);
        self::assertStringContainsString('ni la complétion', $summary);
    }

    public function testInformationalAndRealRoundCountersKeepDistinctSemantics(): void
    {
        $summary = FlowContextGuidance::secondaryCounterSummary([
            'label' => 'Tours travaillés',
            'count' => 3,
            'target' => 10,
            'unit' => 'rounds',
            'tracking_role' => 'informational',
            'cycle_length' => null,
        ]);

        self::assertStringContainsString('unité sémantique=rounds', $summary);
        self::assertStringContainsString('informatif', $summary);
        self::assertStringNotContainsString('cycle_length=', $summary);
    }
}
