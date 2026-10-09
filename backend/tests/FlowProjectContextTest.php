<?php

declare(strict_types=1);

namespace Tests;

use App\Controllers\AiAssistantController;
use PHPUnit\Framework\TestCase;

/** Exerce l’assemblage réel du contexte avec des lectures BDD simulées. */
final class FlowProjectContextTest extends TestCase
{
    private function context(
        string $unit,
        bool $withSection = true,
        bool $translated = false,
        ?string $sourceText = null,
        bool $withImport = true,
        int $activeSectionId = 7,
        int $currentRow = 0,
        array $secondaryCounters = []
    ): string
    {
        $description = 'Purl 1 row from the wrong side. Work BANDS WITH I-CORD — read explanation above.';
        $project = ['name' => 'Test', 'type' => 'knitting', 'current_row' => $currentRow, 'total_rows' => 4,
            'current_section_id' => $withSection ? $activeSectionId : null, 'counter_unit' => $unit,
            'status' => 'in_progress', 'notes' => '', 'pattern_notes' => '', 'is_demo' => 0,
            'pattern_text' => $sourceText ?? '', 'yarn_brand' => '', 'yarn_color' => '', 'hook_size' => '', 'technical_details' => '{}'];
        $sections = $withSection ? [['id' => 7, 'name' => 'Neck', 'description' => $description,
            'notes' => '', 'current_row' => $activeSectionId === 7 ? $currentRow : 0, 'total_rows' => 4, 'pattern_start_row' => 12,
            'counter_unit' => $unit, 'progression_type' => 'simple', 'is_completed' => 0],
            ['id' => 8, 'name' => 'Body', 'description' => 'Round 1: knit to end.',
                'notes' => '', 'current_row' => $activeSectionId === 8 ? $currentRow : 0, 'total_rows' => 10, 'pattern_start_row' => 1,
                'counter_unit' => $activeSectionId === 8 ? 'rows' : $unit, 'progression_type' => 'simple', 'is_completed' => 0]] : [];
        $parsed = ['sections' => [
            ['name' => 'Body', 'description' => str_repeat('Unrelated instructions. ', 2000)],
            ['name' => 'Neck', 'description' => $description],
        ], 'pattern_notes' => "BANDS WITH I-CORD:\nSlip 3 stitches with yarn in front.",
            'translation_validation' => ['validated' => $translated], 'language' => 'en'];
        if ($sourceText !== null) $parsed['_source_text'] = $sourceText;
        $import = ['ai_response_json' => json_encode($parsed), 'pattern_size' => null,
            'translated_text' => $translated
                ? "### Body\n" . str_repeat('Autres instructions. ', 2000)
                    . "\n### Neck\n{$description}\n### BANDS WITH I-CORD\nSlip 2 stitches — translated variant."
                : null,
            'translated_lang' => 'fr'];
        $db = $this->createMock(\PDO::class);
        $db->method('prepare')->willReturnCallback(function (string $sql) use ($project, $sections, $import, $withImport, $secondaryCounters) {
            $stmt = $this->createMock(\PDOStatement::class);
            $stmt->method('execute')->willReturn(true);
            if (str_contains($sql, 'FROM projects WHERE')) $stmt->method('fetch')->willReturn($project);
            elseif (str_contains($sql, 'FROM project_sections')) $stmt->method('fetchAll')->willReturn($sections);
            elseif (str_contains($sql, 'FROM project_secondary_counters')) $stmt->method('fetchAll')->willReturn($secondaryCounters);
            elseif (str_contains($sql, 'FROM ai_pattern_imports')) $stmt->method('fetch')->willReturn($withImport ? $import : false);
            else self::fail('Unexpected query in context builder');
            return $stmt;
        });
        $reflection = new \ReflectionClass(AiAssistantController::class);
        $controller = $reflection->newInstanceWithoutConstructor();
        $reflection->getProperty('db')->setValue($controller, $db);
        $demo = false;
        return $reflection->getMethod('buildProjectContext')->invokeArgs($controller, [502, 640, &$demo]);
    }

    public function testActiveCmSectionProvidesInstructionsButNeverARowMapping(): void
    {
        $context = $this->context('cm');
        self::assertStringContainsString('Neck [section active enregistrée]', $context);
        self::assertStringContainsString('0,0/4,0 cm', $context);
        self::assertStringContainsString('Section mesurée en cm', $context);
        self::assertStringContainsString('Purl 1 row from the wrong side', $context);
        self::assertStringNotContainsString('Correspondance patron selon', $context);
        self::assertStringNotContainsString('prochain rang à effectuer', $context);
        self::assertStringContainsString('Slip 3 stitches with yarn in front.', $context);
    }

    public function testGlobalCmCounterAlsoReceivesMeasurementGuidance(): void
    {
        $context = $this->context('cm', false);
        self::assertStringContainsString('compteur global : 0,0/4,0 cm', $context);
        self::assertStringContainsString('Section mesurée en cm', $context);
        self::assertStringNotContainsString('Correspondance patron selon', $context);
    }

    public function testExplicitRowSectionKeepsEstablishedMapping(): void
    {
        self::assertStringContainsString('numéro 12 du patron', $this->context('rows'));
    }

    public function testFreshProgressChangesTheNextPatternRow(): void
    {
        self::assertStringContainsString('numéro 12 du patron', $this->context('rows', true, false, null, true, 7, 0));
        self::assertStringContainsString('numéro 13 du patron', $this->context('rows', true, false, null, true, 7, 1));
    }

    public function testRepetitionCountersAreIncludedWithTheActiveRow(): void
    {
        $context = $this->context('rows', true, false, null, true, 7, 1, [[
            'section_id' => 7,
            'label' => 'Répétitions du motif',
            'count' => 2,
            'target' => 6,
            'unit' => 'count',
            'tracking_role' => 'required_cycle',
            'cycle_length' => 4,
        ]]);
        self::assertStringContainsString('numéro 13 du patron', $context);
        self::assertStringContainsString('Répétitions du motif', $context);
        self::assertStringContainsString('2/6', $context);
        self::assertStringContainsString('cycle_length=4', $context);
    }

    public function testValidatedTranslationUsesSameSelectorWithoutMixingOriginalVariant(): void
    {
        $context = $this->context('cm', true, true);
        self::assertStringContainsString('PATTERN — TRADUCTION VALIDÉE STRUCTURELLEMENT', $context);
        self::assertStringContainsString('Slip 2 stitches — translated variant.', $context);
        self::assertStringNotContainsString('Slip 3 stitches with yarn in front.', $context);
        $pattern = explode("Patron original en en :\n", $context, 2)[1];
        self::assertLessThanOrEqual(30000, mb_strlen($pattern));
    }

    public function testPersistedSelectedSectionIsTheOneMarkedActiveForFlow(): void
    {
        $context = $this->context('rows', true, false, null, true, 8);
        self::assertStringContainsString('Body [section active enregistrée]', $context);
        self::assertStringNotContainsString('Neck [section active enregistrée]', $context);
        self::assertStringContainsString('numéro 1 du patron', $context);
    }

    public function testVerbatimSourceGlossaryTakesPriorityOverStructuredExtraction(): void
    {
        $source = "### Neck\n{$this->sourceInstruction()}\n### ABBREVIATIONS\nGM = glisser le marqueur selon ce patron.";
        $context = $this->context('rows', true, false, $source);
        self::assertStringContainsString('GM = glisser le marqueur selon ce patron.', $context);
        self::assertStringNotContainsString('Slip 3 stitches with yarn in front.', $context);
    }

    public function testProjectSnapshotKeepsFlowReferenceWhenImportIsUnavailable(): void
    {
        $source = "### Neck\n{$this->sourceInstruction()}\n### ABBREVIATIONS\nGM = définition conservée.";
        $context = $this->context('rows', true, false, $source, false);
        self::assertStringContainsString('PATTERN — TEXTE SOURCE CONSERVÉ SUR LE PROJET', $context);
        self::assertStringContainsString('GM = définition conservée.', $context);
    }

    private function sourceInstruction(): string
    {
        return 'Purl 1 row from the wrong side. Work BANDS WITH I-CORD — read explanation above.';
    }

    public function testManualProjectWithoutPatternUsesOnlyRecordedProjectData(): void
    {
        $context = $this->context('rounds', true, false, null, false, 7, 3);
        self::assertStringContainsString('Neck [section active enregistrée]', $context);
        self::assertStringContainsString('3 tours terminés sur 4', $context);
        self::assertStringContainsString('[PATTERN ABSENT]', $context);
        self::assertStringContainsString('Ne complète pas les instructions', $context);
    }
}
