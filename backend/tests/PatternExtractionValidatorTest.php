<?php

declare(strict_types=1);

namespace Tests;

use App\Services\PatternExtractionValidator;
use App\Services\AIPatternExtractorService;
use PHPUnit\Framework\TestCase;

final class PatternExtractionValidatorTest extends TestCase
{
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
        self::assertSame('derived_motif_gauge_cleared', $result['auto_corrected'][0]['code']);
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
