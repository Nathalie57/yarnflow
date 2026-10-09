<?php

declare(strict_types=1);

namespace Tests;

use App\Services\FlowContextGuidance;
use PHPUnit\Framework\TestCase;

final class FlowContextGuidanceTest extends TestCase
{
    public function testRoundsRemainRoundsInFlowProgressContext(): void
    {
        $section = ['current_row' => 6, 'total_rows' => 12, 'counter_unit' => 'rounds',
            'progression_type' => 'simple', 'pattern_start_row' => 1, 'is_completed' => 0];
        self::assertSame('6 tours terminés sur 12 — prochain tour à effectuer : 7',
            FlowContextGuidance::progressSummary($section));
        self::assertStringContainsString('prochain rang/tour', FlowContextGuidance::patternRowGuidance($section));
        self::assertStringContainsString('nombre de tours enregistrés', FlowContextGuidance::sectionGuidance($section));
    }
    public function testExplainNextRowActionForcesFreshContextWithoutAStoredRowNumber(): void
    {
        $guidance = FlowContextGuidance::contextActionGuidance('explain_next_row');
        self::assertStringContainsString('CE bloc de contexte', $guidance);
        self::assertStringContainsString('pattern_start_row', $guidance);
        self::assertStringContainsString('répétitions/compteurs secondaires', $guidance);
        self::assertStringContainsString('Ne réutilise aucun ancien numéro', $guidance);
        self::assertSame('', FlowContextGuidance::contextActionGuidance('unknown'));
        self::assertSame('', FlowContextGuidance::contextActionGuidance(null));
    }

    public function testSimpleAndCompositeSectionsReceiveDifferentGuidance(): void
    {
        self::assertStringContainsString('progression enregistrée', FlowContextGuidance::sectionGuidance(['progression_type' => 'simple']));
        self::assertStringContainsString('sous-étape exacte', FlowContextGuidance::sectionGuidance([
            'progression_type' => 'composite', 'counter_unit' => 'rows',
        ]));
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

    public function testCompositeWithoutUnitNeverInventsRows(): void
    {
        $section = ['current_row' => 0, 'total_rows' => null, 'counter_unit' => null,
            'progression_type' => 'composite', 'is_completed' => 0];
        self::assertSame('suivi libre sans unité — validation manuelle de fin',
            FlowContextGuidance::progressSummary($section));
        self::assertStringContainsString('aucun compteur en rangs ou en mesure',
            FlowContextGuidance::sectionGuidance($section));
        self::assertSame('', FlowContextGuidance::patternRowGuidance($section));
    }

    public function testCentimetresNeverProducePatternRowEvenWithStartAndGauge(): void
    {
        $section = ['name' => 'Neck', 'counter_unit' => 'cm', 'current_row' => 2.5,
            'total_rows' => 4, 'pattern_start_row' => 10, 'progression_type' => 'simple',
            'gauge' => ['rows' => 30, 'dimensions' => '10 cm']];
        self::assertSame('', FlowContextGuidance::patternRowGuidance($section));
        self::assertStringContainsString('longueur enregistrée', FlowContextGuidance::sectionGuidance($section));
        self::assertStringNotContainsString('prochain rang', FlowContextGuidance::sectionGuidance($section));
        $section['current_row'] = 0;
        self::assertSame('', FlowContextGuidance::patternRowGuidance($section));
        self::assertSame('0,0/4,0 cm', FlowContextGuidance::progressSummary($section));
    }

    public function testOnlyExplicitSimpleRowMappingProducesNextPatternRow(): void
    {
        $section = ['counter_unit' => 'rows', 'current_row' => 2, 'pattern_start_row' => 10];
        self::assertStringContainsString('numéro 12', FlowContextGuidance::patternRowGuidance($section));
        foreach ([['progression_type' => 'composite'], ['progression_type' => 'action'],
            ['counter_unit' => null], ['pattern_start_row' => null], ['current_row' => 2.5],
            ['is_completed' => 1], ['total_rows' => 2]] as $override) {
            self::assertSame('', FlowContextGuidance::patternRowGuidance(array_replace($section, $override)));
        }
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
