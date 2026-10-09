<?php

declare(strict_types=1);

namespace Tests;

use App\Services\PatternExtractionValidator;
use App\Services\AIPatternExtractorService;
use PHPUnit\Framework\TestCase;

final class PatternExtractionValidatorTest extends TestCase
{
    public function testFourRowsDoNotHaveAMeasurementConflict(): void
    {
        self::assertSame([], PatternExtractionValidator::sectionMeasurementIssues([
            ['name' => 'Bord', 'description' => 'Tricoter 4 rangs.', 'unit' => 'rangs', 'target' => 4, 'progression_type' => 'simple'],
        ]));
    }

    public function testRoundsAndToursAreValidDiscreteMeasurementUnits(): void
    {
        foreach ([
            ['Crocheter 12 tours.', 'tours'],
            ['Crochet 12 rounds.', 'rounds'],
            // La nuance rang/tour ne doit pas devenir un conflit de dimension.
            ['Crocheter 12 tours.', 'rows'],
        ] as [$description, $unit]) {
            self::assertSame([], PatternExtractionValidator::sectionMeasurementIssues([[
                'name' => 'Pièce', 'description' => $description, 'unit' => $unit,
                'target' => 12, 'progression_type' => 'simple',
            ]]), $description . ' / ' . $unit);
        }
    }

    public function testRoundsStillConflictWithPhysicalMeasurementsAndWrongTargets(): void
    {
        foreach ([
            ['Crocheter 12 tours.', 'cm', 12],
            ['Crocheter 12 tours.', 'tours', 10],
            ['Crocheter 12 cm.', 'tours', 12],
        ] as [$description, $unit, $target]) {
            self::assertCount(1, PatternExtractionValidator::sectionMeasurementIssues([[
                'name' => 'Pièce', 'description' => $description, 'unit' => $unit,
                'target' => $target, 'progression_type' => 'simple',
            ]]), $description . ' / ' . $unit);
        }
    }

    public function testKnytStyleRoundSectionsDoNotMakeAnalysisPartial(): void
    {
        $sections = [];
        foreach ([24, 20, 10, 10, 9, 9, 6, 12, 12] as $index => $target) {
            $sections[] = [
                'name' => 'Pièce ' . $index,
                'description' => "Crocheter {$target} tours.",
                'unit' => 'tours', 'target' => $target, 'progression_type' => 'simple',
            ];
        }
        $data = $this->baseData('Crocheter 1 tour.');
        $data['sections'] = $sections;
        $result = PatternExtractionValidator::validate($data);
        self::assertFalse($result['requires_section_review']);
        self::assertSame([], $result['unverifiable']);
    }

    public function testCompositeCmReferenceSurvivesWithoutAutomaticTarget(): void
    {
        foreach ([48, null] as $target) {
            $data = ['sections' => [['name' => 'Corps', 'description' => 'Changer de point puis continuer jusqu’à 48 cm au total.',
                'unit' => 'cm', 'progression_type' => 'composite', 'target' => $target]]];
            $validated = PatternExtractionValidator::validate($data)['data'];
            $sections = AIPatternExtractorService::normalizeCumulativeTargets($validated['sections'], 'tricot');
            self::assertSame('composite', $sections[0]['progression_type']);
            self::assertNull($sections[0]['target']);
            self::assertSame(['value' => 48.0, 'unit' => 'cm', 'from' => 'piece_start'], $sections[0]['pattern_reference']);
            if ($target !== null) self::assertEquals(48, $sections[0]['target_raw']);
            self::assertSame($sections, AIPatternExtractorService::normalizeCumulativeTargets($sections, 'tricot'));
        }
    }

    public function testRowInstructionWithCmRequiresReviewWithoutInventingConversion(): void
    {
        $data = $this->baseData('Work 10 rows.');
        $data['sections'][0]['unit'] = 'cm';
        $result = PatternExtractionValidator::validate($data);
        self::assertTrue($result['requires_section_review']);
        self::assertSame('cm', $result['data']['sections'][0]['unit']);
        self::assertSame(10, $result['data']['sections'][0]['target']);
        self::assertSame('section_measurement_conflict', $result['unverifiable'][0]['code']);

        $data['needles'] = [['size' => '4 mm']];
        $response = ['candidates' => [['finishReason' => 'STOP', 'content' => ['parts' => [['text' => json_encode($data)]]]]]];
        $service = (new \ReflectionClass(AIPatternExtractorService::class))->newInstanceWithoutConstructor();
        $parsed = (new \ReflectionMethod($service, 'parseGeminiResponse'))->invoke($service, $response);
        self::assertSame('partial', $parsed['ai_status']);
    }

    public function testExplicitMeasurementAndTargetConflictsRequireReview(): void
    {
        foreach ([
            ['Tricoter 10 rangs.', 'cm', 10],
            ['Work until piece measures 18.5 cm.', 'rangs', 18.5],
            ['Crocheter 10 tours.', 'rangs', 12],
            ['Tricoter 18,5 cm.', 'cm', 18],
            ['Work 10 rows, then work until piece measures 20 cm.', 'cm', 20],
        ] as [$description, $unit, $target]) {
            $data = $this->baseData($description);
            $data['sections'][0]['unit'] = $unit;
            $data['sections'][0]['target'] = $target;
            self::assertTrue(PatternExtractionValidator::validate($data)['requires_section_review'], $description);
        }
    }

    public function testCorrectSectionsAndCompositeInvariantArePreserved(): void
    {
        foreach ([
            ['Work 10 rows.', 'rangs', 10],
            ['Tricoter 18,5 cm.', 'cm', 18.5],
            ['Work until piece measures 18.5 cm.', 'cm', 18.5],
            ['Work 10 rows with 4 mm needles.', 'rangs', 10],
            ['Repeat rows 1-4 ten times.', 'rangs', 40],
        ] as [$description, $unit, $target]) {
            $data = $this->baseData($description);
            $data['sections'][0]['unit'] = $unit;
            $data['sections'][0]['target'] = $target;
            $result = PatternExtractionValidator::validate($data);
            self::assertFalse($result['requires_section_review'], $description);
            self::assertSame($target, $result['data']['sections'][0]['target']);
        }
        $data = $this->baseData('Work 10 rows, then work until piece measures 20 cm.');
        $data['sections'][0]['progression_type'] = 'composite';
        $data['sections'][0]['unit'] = 'rangs';
        $result = PatternExtractionValidator::validate($data);
        self::assertFalse($result['requires_section_review']);
        self::assertNull($result['data']['sections'][0]['target']);
    }

    public function testCumulativeDecimalTargetsRemainStableOnCacheOrResume(): void
    {
        $sections = [
            ['name' => 'Base', 'description' => 'Tricoter 10 cm.', 'unit' => 'cm', 'progression_type' => 'simple', 'target' => 10],
            ['name' => 'Corps', 'description' => 'Work until piece measures 28.5 cm from cast on.', 'unit' => 'cm', 'progression_type' => 'simple', 'target' => 28.5, 'target_measured_from' => 'piece_start'],
        ];
        $normalized = AIPatternExtractorService::normalizeCumulativeTargets($sections, 'tricot');
        self::assertSame(18.5, $normalized[1]['target']);
        self::assertSame([], PatternExtractionValidator::sectionMeasurementIssues($normalized));
        self::assertSame($normalized, AIPatternExtractorService::normalizeCumulativeTargets($normalized, 'tricot'));
    }

    public function testExplicitRepeatedCycleKeepsAutomaticTotal(): void
    {
        $data = $this->baseData('Repeat rows 1-4 six times in total.');
        $data['sections'][0]['target'] = 24;
        $data['sections'][0]['secondary_counter'] = [
            'label' => 'Repeats', 'target' => 6,
            'tracking_role' => 'required_cycle', 'cycle_length' => 4,
        ];
        $result = PatternExtractionValidator::validate($data);
        self::assertSame('simple', $result['data']['sections'][0]['progression_type']);
        self::assertSame(24, $result['data']['sections'][0]['target']);
        self::assertSame('required_cycle', $result['data']['sections'][0]['secondary_counter']['tracking_role']);
    }

    public function testAmbiguousRepeatedCycleFallsBackToManualCompletion(): void
    {
        $data = $this->baseData('Repeat rows 1-4 five more times.');
        $data['sections'][0]['target'] = 20;
        $data['sections'][0]['secondary_counter'] = [
            'label' => 'Repeats', 'target' => 5,
            'tracking_role' => 'required_cycle', 'cycle_length' => null,
        ];
        $result = PatternExtractionValidator::validate($data);
        self::assertSame('composite', $result['data']['sections'][0]['progression_type']);
        self::assertNull($result['data']['sections'][0]['target']);
        self::assertSame('unknown', $result['data']['sections'][0]['secondary_counter']['tracking_role']);
        self::assertContains('repeat_cycle_ambiguous', array_column($result['unverifiable'], 'code'));
    }

    public function testInformationalCounterDoesNotChangeSectionProgression(): void
    {
        $data = $this->baseData('Work 10 rows.');
        $data['sections'][0]['secondary_counter'] = [
            'label' => 'Marker', 'target' => 2, 'tracking_role' => 'informational',
        ];
        $result = PatternExtractionValidator::validate($data);
        self::assertSame('simple', $result['data']['sections'][0]['progression_type']);
        self::assertSame(10, $result['data']['sections'][0]['target']);
    }

    public function testDivideAndAssemblyBecomeActionsWithoutCounters(): void
    {
        foreach ([
            ['DIVIDE FOR BODY AND SLEEVES', 'Divide at the raglan stitches.'],
            ['ASSEMBLY', 'Sew the buttons onto the left band.'],
        ] as [$name, $description]) {
            $data = $this->baseData($description);
            $data['sections'][0] = [
                'name' => $name,
                'description' => $description,
                'progression_type' => 'simple',
                'unit' => 'rangs',
                'target' => null,
                'secondary_counter' => ['label' => 'Steps', 'target' => 1, 'tracking_role' => 'required_parallel', 'unit' => 'count'],
            ];
            $section = PatternExtractionValidator::validate($data)['data']['sections'][0];
            self::assertSame('action', $section['progression_type']);
            self::assertNull($section['unit']);
            self::assertNull($section['target']);
            self::assertNull($section['secondary_counter']);
        }
    }

    public function testPhysicalMeasurementCannotBeARequiredSecondaryCounter(): void
    {
        $data = $this->baseData('Work rib until it measures 5 cm.');
        $data['sections'][0]['progression_type'] = 'composite';
        $data['sections'][0]['target'] = null;
        $data['sections'][0]['secondary_counter'] = [
            'label' => 'Ribbing', 'target' => 5,
            'tracking_role' => 'required_parallel', 'unit' => 'cm',
        ];
        $result = PatternExtractionValidator::validate($data);
        self::assertNull($result['data']['sections'][0]['secondary_counter']);
        self::assertContains('physical_measurement_counter_removed', array_column($result['auto_corrected'], 'code'));
    }

    public function testNumericRequiredParallelCounterRemainsRequired(): void
    {
        $data = $this->baseData('Complete 5 counted decreases.');
        $data['sections'][0]['secondary_counter'] = [
            'label' => 'Decreases', 'target' => 5,
            'tracking_role' => 'required_parallel', 'unit' => 'count',
        ];
        $section = PatternExtractionValidator::validate($data)['data']['sections'][0];
        self::assertSame('required_parallel', $section['secondary_counter']['tracking_role']);
    }

    public function testOperationOccurrencesUseCountWithoutChangingUnknownRole(): void
    {
        foreach ([
            ['label' => 'Raglan increases', 'target' => 27, 'unit' => 'rows', 'cycle_length' => 2],
            ['label' => 'Diminutions', 'target' => 9, 'unit' => 'rounds', 'cycle_length' => 7],
        ] as $counter) {
            $data = $this->baseData('Work the operation at the stated rhythm.');
            $data['sections'][0]['progression_type'] = 'composite';
            $data['sections'][0]['target'] = null;
            $data['sections'][0]['secondary_counter'] = $counter + ['tracking_role' => 'unknown'];

            $result = PatternExtractionValidator::validate($data);
            $normalized = $result['data']['sections'][0]['secondary_counter'];

            self::assertSame('count', $normalized['unit']);
            self::assertSame('unknown', $normalized['tracking_role']);
            self::assertSame($counter['cycle_length'], $normalized['cycle_length']);
            self::assertContains('secondary_counter_operation_unit_normalized', array_column($result['auto_corrected'], 'code'));
        }
    }

    public function testRealRowAndRoundCountersKeepTheirUnits(): void
    {
        foreach ([['Pattern rows', 'rows'], ['Rounds worked', 'rounds']] as [$label, $unit]) {
            $data = $this->baseData('Work the stated number of rows or rounds.');
            $data['sections'][0]['secondary_counter'] = [
                'label' => $label,
                'target' => 8,
                'tracking_role' => 'informational',
                'cycle_length' => null,
                'unit' => $unit,
            ];

            $section = PatternExtractionValidator::validate($data)['data']['sections'][0];
            self::assertSame($unit, $section['secondary_counter']['unit']);
        }
    }

    public function testLegacySimpleSectionAndResumedActionStayStable(): void
    {
        $legacy = PatternExtractionValidator::validate($this->baseData('Work 10 rows.'))['data']['sections'][0];
        self::assertSame('simple', $legacy['progression_type']);
        self::assertSame(10, $legacy['target']);

        $data = $this->baseData('Sew the buttons onto the band.');
        $data['sections'][0] = [
            'name' => 'ASSEMBLY', 'description' => 'Sew the buttons onto the band.',
            'progression_type' => 'action', 'unit' => null, 'target' => null,
            'secondary_counter' => null,
        ];
        $first = PatternExtractionValidator::validate($data)['data'];
        $resumed = PatternExtractionValidator::validate($first)['data'];
        self::assertSame('action', $resumed['sections'][0]['progression_type']);
        self::assertNull($resumed['sections'][0]['unit']);
        self::assertNull($resumed['sections'][0]['target']);
    }

    private function baseData(string $description = 'Tricoter 10 rangs.'): array
    {
        return [
            'title' => 'Test',
            'craft_type' => 'tricot',
            'yarn' => [],
            'sections' => [[
                'name' => 'Corps',
                'description' => $description,
                'progression_type' => 'simple',
                'target' => 10,
            ]],
            'contains_diagram' => false,
        ];
    }

    public function testMultiSizeYarnIsKeptWithNullQuantityAndIsNotAnError(): void
    {
        $data = $this->baseData('Tailles 4/6/8/10/12 ans.');
        $data['yarn'] = [[
            'name' => 'Coton',
            'color' => 'Sable',
            'quantity_needed' => ['amount' => 3, 'unit' => 'pelotes'],
        ]];
        $data['unresolved_data'] = [[
            'type' => 'yarn_quantity',
            'field' => 'yarn.Sable.quantity_needed.amount',
            'yarn' => 'Sable',
            'source_values' => ['3', '3', '4', '4', '4'],
            'reason' => 'pattern_size_not_selected',
        ]];

        $result = PatternExtractionValidator::validate($data, null);

        self::assertFalse($result['has_certain_errors']);
        self::assertSame('Sable', $result['data']['yarn'][0]['color']);
        self::assertNull($result['data']['yarn'][0]['quantity_needed']['amount']);
        self::assertSame('pattern_size_not_selected', $result['unverifiable'][0]['code']);
    }

    public function testConstantMultiSizeQuantityIsResolvedAndSourceTraceIsKept(): void
    {
        $data = $this->baseData('Tailles 4/6/8/10/12 ans.');
        $data['yarn'] = [[
            'color' => 'Algue',
            'quantity_needed' => ['amount' => null, 'unit' => 'pelotes'],
        ]];
        $data['unresolved_data'] = [[
            'type' => 'yarn_quantity',
            'field' => 'yarn[0].quantity_needed.amount',
            'yarn' => 'Algue',
            'source_values' => ['1', '1.0', 1, '1,00', '01'],
            'reason' => 'pattern_size_not_selected',
        ]];

        $result = PatternExtractionValidator::validate($data, null);

        self::assertFalse($result['has_unresolved_errors']);
        self::assertSame(1, $result['data']['yarn'][0]['quantity_needed']['amount']);
        self::assertTrue($result['data']['unresolved_data'][0]['resolved']);
        self::assertSame('constant_across_sizes', $result['data']['unresolved_data'][0]['resolution']);
        self::assertSame('constant_yarn_quantity_resolved', $result['auto_corrected'][0]['code']);
    }

    public function testMissingYarnsListedInUnresolvedDataAreRestoredWithoutInventingQuantity(): void
    {
        $data = $this->baseData();
        $data['yarn'] = [[
            'name' => 'Highlands 590 Contrast',
            'quantity_needed' => ['amount' => null, 'unit' => 'pelotes'],
        ]];
        $data['unresolved_data'] = [[
            'type' => 'yarn_quantity',
            'yarn' => 'Country Style DK 416 Main',
            'source_values' => ['6', '7', '8'],
            'reason' => 'pattern_size_not_selected',
        ]];

        $result = PatternExtractionValidator::validate($data);

        self::assertCount(2, $result['data']['yarn']);
        self::assertSame('Country Style DK 416 Main', $result['data']['yarn'][1]['name']);
        self::assertNull($result['data']['yarn'][1]['quantity_needed']['amount']);
        self::assertSame('pelotes', $result['data']['yarn'][1]['quantity_needed']['unit']);
        self::assertSame('unresolved_yarn_restored', $result['auto_corrected'][0]['code']);
    }

    public function testBrokenCrossSectionMarkerProducesWarning(): void
    {
        $data = $this->baseData('Instructions du dos sans repère.');
        $data['sections'][0]['name'] = 'BACK';
        $data['sections'][] = [
            'name' => 'RIGHT FRONT',
            'description' => 'Work from **** to **** as given for Back.',
            'progression_type' => 'composite',
            'target' => null,
        ];

        $result = PatternExtractionValidator::validate($data);

        self::assertSame('referenced_marker_missing', $result['warnings'][0]['code']);
        self::assertSame('****', $result['warnings'][0]['context']['marker']);
    }

    public function testMotifGaugeIsNotConvertedToStitchesAndRows(): void
    {
        $data = $this->baseData();
        $data['gauge'] = ['stitches' => 16, 'rows' => 16, 'size_cm' => 10];
        $data['pattern_notes'] = 'TENSION: 2 Diamonds to 4in, 10cm on 4mm needles.';

        $result = PatternExtractionValidator::validate($data);

        self::assertNull($result['data']['gauge']['stitches']);
        self::assertNull($result['data']['gauge']['rows']);
        self::assertNull($result['data']['gauge']['size_cm']);
        self::assertStringContainsString('2 Diamonds', $result['data']['gauge']['notes']);
        self::assertSame('derived_motif_gauge_cleared', $result['auto_corrected'][0]['code']);
    }

    public function testSelectedSizeMustExistInExplicitAvailableSizes(): void
    {
        $data = $this->baseData('Size M only. Work 10 rows.');
        $data['available_sizes'] = ['M'];

        $result = PatternExtractionValidator::validate($data, 'L');

        self::assertTrue($result['has_certain_errors']);
        self::assertSame('selected_size_not_available', $result['errors'][0]['code']);
        self::assertSame(['M'], $result['errors'][0]['context']['available_sizes']);
        self::assertSame('selected_size_not_available', end($result['data']['unresolved_data'])['reason']);
    }

    public function testSelectedSizeAcceptsSameExplicitSizeAndUnknownListsRemainCompatible(): void
    {
        $data = $this->baseData('Size M. Work 10 rows.');
        $data['available_sizes'] = ['M'];
        self::assertFalse(PatternExtractionValidator::validate($data, 'm')['has_certain_errors']);

        unset($data['available_sizes']);
        self::assertFalse(PatternExtractionValidator::validate($data, 'L')['has_certain_errors']);
    }

    public function testSelectedSizeMatchesLetteredPatternColumns(): void
    {
        $data = $this->baseData('Tailles a) XS, b) S, c) M, d) L.');
        $data['available_sizes'] = ['a) XS', 'b) S', 'c) M', 'd) L', 'e) XL', 'f) 2XL'];

        foreach (['XS', 'S', 'M', 'L', 'XL', '2XL'] as $selected) {
            $result = PatternExtractionValidator::validate($data, $selected);
            self::assertFalse($result['has_certain_errors'], $selected);
            self::assertNotContains('selected_size_not_available', array_column($result['errors'], 'code'));
        }
    }

    public function testLetteredPatternColumnsStillRejectAnActuallyUnavailableSize(): void
    {
        $data = $this->baseData('Tailles a) XS, b) S, c) M.');
        $data['available_sizes'] = ['a) XS', 'b) S', 'c) M'];

        $result = PatternExtractionValidator::validate($data, '5XL');
        self::assertContains('selected_size_not_available', array_column($result['errors'], 'code'));
    }

    public function testLegacySizeEvidenceAlsoBlocksAnIncompatibleSelection(): void
    {
        $data = $this->baseData('Size M only.');
        $data['unresolved_data'] = [[
            'type' => 'other', 'field' => 'size', 'source_values' => ['M'],
            'reason' => 'pattern_size_not_selected',
        ]];

        $result = PatternExtractionValidator::validate($data, 'L');

        self::assertSame('selected_size_not_available', $result['errors'][0]['code']);
        self::assertSame(['M'], $result['data']['available_sizes']);
        self::assertSame('selected_size_not_available', $result['data']['unresolved_data'][0]['reason']);
    }

    public function testExplicitSymmetricPiecesWithoutBothSectionsRequireReview(): void
    {
        $data = $this->baseData('Make the left front and right front separately.');
        $data['sections'][0]['name'] = 'Left front';

        $result = PatternExtractionValidator::validate($data);

        self::assertTrue($result['has_certain_errors']);
        self::assertContains('symmetric_piece_missing', array_column($result['errors'], 'code'));
        self::assertContains('symmetric_piece_missing', array_column($result['unverifiable'], 'code'));
    }

    public function testAmbiguousSingularPieceDoesNotInventOrBlockAnotherPiece(): void
    {
        $data = $this->baseData('Work the sleeve to the stated length.');
        $data['sections'][0]['name'] = 'Sleeve';

        $result = PatternExtractionValidator::validate($data);

        self::assertFalse($result['has_certain_errors']);
        self::assertCount(1, $result['data']['sections']);
        self::assertNotContains('symmetric_piece_missing', array_column($result['errors'], 'code'));
    }

    public function testExplicitPluralSleevesWithOneSingularSectionAreBlocking(): void
    {
        $data = $this->baseData('Set in sleeves and sew the seams.');
        $data['sections'][0]['name'] = 'Sleeve';

        $result = PatternExtractionValidator::validate($data);

        self::assertTrue($result['has_certain_errors']);
        self::assertContains('symmetric_piece_missing', array_column($result['errors'], 'code'));
        self::assertCount(1, $result['data']['sections']);
    }

    public function testStructuralContradictionBlocksButInformationalAmbiguityDoesNot(): void
    {
        $structural = $this->baseData('Work the sleeve.');
        $structural['unresolved_data'] = [[
            'type' => 'section_value', 'field' => 'sections[0].description', 'reason' => 'other',
            'source_values' => ['Work to 29.5 cm', 'Work to 36.5 cm'],
        ]];
        $blocked = PatternExtractionValidator::validate($structural);
        self::assertContains('structural_ambiguity_unresolved', array_column($blocked['errors'], 'code'));

        $informational = $this->baseData();
        $informational['unresolved_data'] = [[
            'type' => 'other', 'field' => 'pattern_notes.author_comment', 'reason' => 'other',
            'source_values' => ['Published in spring', 'Updated in summer'],
        ]];
        $allowed = PatternExtractionValidator::validate($informational);
        self::assertNotContains('structural_ambiguity_unresolved', array_column($allowed['errors'], 'code'));
    }

    public function testDuplicateMeasurementUnitIsRemovedWithoutChangingValue(): void
    {
        $data = $this->baseData('Work until piece measures 29.5 cm cm.');
        $data['sections'][0]['unit'] = 'cm';
        $data['sections'][0]['target'] = 29.5;

        $result = PatternExtractionValidator::validate($data);

        self::assertSame('Work until piece measures 29.5 cm.', $result['data']['sections'][0]['description']);
        self::assertSame(29.5, $result['data']['sections'][0]['target']);
        self::assertContains('duplicate_measurement_unit_removed', array_column($result['auto_corrected'], 'code'));
    }

    public function testBothExplicitSymmetricSectionsDoNotRaiseWarning(): void
    {
        $data = $this->baseData('Make the left front and right front separately.');
        $data['sections'][0]['name'] = 'Left front';
        $data['sections'][] = [
            'name' => 'Right front', 'description' => 'Work the right front.',
            'progression_type' => 'composite', 'target' => null,
        ];

        $result = PatternExtractionValidator::validate($data);

        self::assertNotContains('symmetric_piece_missing', array_column($result['unverifiable'], 'code'));
    }

    public function testEditedPreviewResolvesAnExplicitMissingSymmetricPieceOnlyWhenCorrectlyNamed(): void
    {
        $source = $this->baseData('Make the left front and right front separately.');
        $source['sections'][0]['name'] = 'Left front';
        $source = PatternExtractionValidator::validate($source)['data'];

        $incorrect = $source['sections'];
        $incorrect[] = array_merge($incorrect[0], ['name' => 'Left front copy']);
        $blocked = PatternExtractionValidator::validateEditedPreview($source, [], $incorrect);
        self::assertContains('symmetric_piece_missing', array_column($blocked['errors'], 'code'));

        $correct = $incorrect;
        $correct[1]['name'] = 'Right front';
        $allowed = PatternExtractionValidator::validateEditedPreview($source, [], $correct);
        self::assertEmpty($allowed['blocking_errors']);
        self::assertContains('symmetric_piece_missing', array_column($allowed['review_issues'], 'code'));
    }

    public function testEditedPreviewDetectsMissingAndNewlyInvalidSections(): void
    {
        $missingInstruction = $this->baseData();
        $missingInstruction['sections'][0]['description'] = '';
        $missingInstruction = PatternExtractionValidator::validate($missingInstruction)['data'];
        $corrected = $missingInstruction['sections'];
        $corrected[0]['description'] = 'Work 10 rows.';
        $correctedResult = PatternExtractionValidator::validateEditedPreview($missingInstruction, [], $corrected);
        self::assertEmpty($correctedResult['blocking_errors']);
        self::assertContains('section_instructions_missing', array_column($correctedResult['review_issues'], 'code'));

        $valid = PatternExtractionValidator::validate($this->baseData())['data'];
        $removed = PatternExtractionValidator::validateEditedPreview($valid, [], []);
        self::assertContains('sections_missing', array_column($removed['errors'], 'code'));

        $invalid = $valid['sections'];
        $invalid[0]['description'] = '';
        $introduced = PatternExtractionValidator::validateEditedPreview($valid, [], $invalid);
        self::assertContains('section_instructions_missing', array_column($introduced['errors'], 'code'));
    }

    public function testEditedPreviewWithOnlyEmptySectionsIsBlocking(): void
    {
        $source = $this->baseData();
        $source['sections'] = [['name' => '', 'description' => '', 'progression_type' => 'simple']];
        $source = PatternExtractionValidator::validate($source)['data'];

        $result = PatternExtractionValidator::validateEditedPreview($source, [], $source['sections']);

        self::assertContains('sections_missing', array_column($result['blocking_errors'], 'code'));
        self::assertContains('section_empty', array_column($result['review_issues'], 'code'));
    }

    public function testEditedPreviewNeverClearsAnErrorThatRequiresReanalysis(): void
    {
        $source = $this->baseData();
        $source['validation_issues']['errors'] = [[
            'code' => 'progression_type_invalid', 'message' => 'Invalid progression', 'context' => ['section_index' => 0],
        ]];
        $result = PatternExtractionValidator::validateEditedPreview($source, [], $source['sections']);
        self::assertContains('progression_type_invalid', array_column($result['blocking_errors'], 'code'));
    }

    public function testAmbiguityIsReviewableButAnUnusableExtractionRemainsBlocking(): void
    {
        $ambiguous = $this->baseData();
        $ambiguous['unresolved_data'] = [[
            'type' => 'section_value', 'field' => 'sections[0].description', 'reason' => 'other',
            'source_values' => ['Work to 29.5 cm', 'Work to 36.5 cm'],
        ]];
        $ambiguous = PatternExtractionValidator::validate($ambiguous)['data'];
        $review = PatternExtractionValidator::validateEditedPreview($ambiguous, [], $ambiguous['sections']);
        self::assertEmpty($review['blocking_errors']);
        self::assertContains('structural_ambiguity_unresolved', array_column($review['review_issues'], 'code'));

        $empty = PatternExtractionValidator::validate(['title' => 'Empty', 'sections' => []])['data'];
        $blocked = PatternExtractionValidator::validateEditedPreview($empty, [], []);
        self::assertContains('sections_missing', array_column($blocked['blocking_errors'], 'code'));
    }

    public function testMissingSizeAloneDoesNotMakeExtractionPartial(): void
    {
        $data = $this->baseData('Monter 74/80/86/92/98 mailles.');
        $data['yarn'] = [['name' => 'Coton', 'quantity_needed' => ['amount' => null, 'unit' => 'pelotes']]];
        $response = ['candidates' => [[
            'finishReason' => 'STOP',
            'content' => ['parts' => [['text' => json_encode($data, JSON_UNESCAPED_UNICODE)]]],
        ]]];

        $service = (new \ReflectionClass(AIPatternExtractorService::class))->newInstanceWithoutConstructor();
        $method = new \ReflectionMethod(AIPatternExtractorService::class, 'parseGeminiResponse');
        $result = $method->invoke($service, $response, null);

        self::assertTrue($result['success']);
        self::assertSame('success', $result['ai_status']);
        self::assertSame('pattern_size_not_selected', $result['data']['validation_issues']['unverifiable'][0]['code']);
    }

    public function testExplicitlyUsedMissingYarnProducesWarningOnly(): void
    {
        $result = PatternExtractionValidator::validate($this->baseData('Avec Sable aiguilles 4 mm, tricoter 10 rangs.'));

        self::assertFalse($result['has_certain_errors']);
        self::assertSame('used_yarn_missing', $result['warnings'][0]['code']);
    }

    public function testDiagramContradictionIsCorrectedAndReported(): void
    {
        $result = PatternExtractionValidator::validate($this->baseData('Continuer en suivant la grille jacquard.'));

        self::assertFalse($result['has_unresolved_errors']);
        self::assertTrue($result['data']['contains_diagram']);
        self::assertSame('diagram_flag_enabled', $result['auto_corrected'][0]['code']);
    }

    public function testCompositeTargetIsCleared(): void
    {
        $data = $this->baseData();
        $data['sections'][0]['progression_type'] = 'composite';
        $data['sections'][0]['target'] = 74;

        $result = PatternExtractionValidator::validate($data);

        self::assertFalse($result['has_unresolved_errors']);
        self::assertNull($result['data']['sections'][0]['target']);
        self::assertSame('composite_target_cleared', $result['auto_corrected'][0]['code']);
    }

    public function testSafeCompositeTargetCorrectionDoesNotMakeSuccessfulExtractionPartial(): void
    {
        $data = $this->baseData();
        $data['yarn'] = [['color' => 'Sable', 'quantity_needed' => ['amount' => 3, 'unit' => 'pelotes']]];
        $data['sections'][0]['progression_type'] = 'composite';
        $data['sections'][0]['target'] = 22;
        $response = ['candidates' => [[
            'finishReason' => 'STOP',
            'content' => ['parts' => [['text' => json_encode($data, JSON_UNESCAPED_UNICODE)]]],
        ]]];

        $service = (new \ReflectionClass(AIPatternExtractorService::class))->newInstanceWithoutConstructor();
        $method = new \ReflectionMethod(AIPatternExtractorService::class, 'parseGeminiResponse');
        $result = $method->invoke($service, $response, null);

        self::assertSame('success', $result['ai_status']);
        self::assertNull($result['data']['sections'][0]['target']);
        self::assertSame('composite_target_cleared', $result['data']['validation_issues']['auto_corrected'][0]['code']);
    }

    public function testUnverifiedDiagramOrientationDisablesEditorCompatibilityWithoutChangingDimensions(): void
    {
        $data = $this->baseData();
        $data['diagram_metadata'] = [[
            'type' => 'jacquard',
            'dimensions' => ['rows' => 72, 'columns' => 48],
            'compatible_with_chart_editor' => true,
        ]];

        $result = PatternExtractionValidator::validate($data);
        $metadata = $result['data']['diagram_metadata'][0];

        self::assertSame(['rows' => 72, 'columns' => 48], $metadata['dimensions']);
        self::assertFalse($metadata['orientation_verified']);
        self::assertFalse($metadata['dimensions_verified']);
        self::assertFalse($metadata['compatible_with_chart_editor']);
        self::assertSame('ai_visual_estimate', $metadata['dimensions_source']);
        self::assertSame('diagram_editor_compatibility_disabled', $result['auto_corrected'][0]['code']);
        self::assertFalse($result['has_unresolved_errors']);
    }

    public function testUnresolvedStructuralErrorStillMakesExtractionPartial(): void
    {
        $data = $this->baseData();
        $data['yarn'] = [['color' => 'Sable', 'quantity_needed' => ['amount' => 3, 'unit' => 'pelotes']]];
        $data['sections'][0]['progression_type'] = 'unknown';
        $response = ['candidates' => [[
            'finishReason' => 'STOP',
            'content' => ['parts' => [['text' => json_encode($data, JSON_UNESCAPED_UNICODE)]]],
        ]]];

        $service = (new \ReflectionClass(AIPatternExtractorService::class))->newInstanceWithoutConstructor();
        $method = new \ReflectionMethod(AIPatternExtractorService::class, 'parseGeminiResponse');
        $result = $method->invoke($service, $response, null);

        self::assertSame('partial', $result['ai_status']);
        self::assertSame('progression_type_invalid', $result['data']['validation_issues']['errors'][0]['code']);
    }
}
