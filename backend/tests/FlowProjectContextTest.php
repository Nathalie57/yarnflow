<?php

declare(strict_types=1);

namespace Tests;

use App\Controllers\AiAssistantController;
use PHPUnit\Framework\TestCase;

/** Exerce l’assemblage réel du contexte avec des lectures BDD simulées. */
final class FlowProjectContextTest extends TestCase
{
    private function context(string $unit, bool $withSection = true, bool $translated = false): string
    {
        $description = 'Purl 1 row from the wrong side. Work BANDS WITH I-CORD — read explanation above.';
        $project = ['name' => 'Test', 'type' => 'knitting', 'current_row' => 0, 'total_rows' => 4,
            'current_section_id' => $withSection ? 7 : null, 'counter_unit' => $unit,
            'status' => 'in_progress', 'notes' => '', 'pattern_notes' => '', 'is_demo' => 0,
            'yarn_brand' => '', 'yarn_color' => '', 'hook_size' => '', 'technical_details' => '{}'];
        $sections = $withSection ? [['id' => 7, 'name' => 'Neck', 'description' => $description,
            'notes' => '', 'current_row' => 0, 'total_rows' => 4, 'pattern_start_row' => 12,
            'counter_unit' => $unit, 'progression_type' => 'simple', 'is_completed' => 0]] : [];
        $parsed = ['sections' => [
            ['name' => 'Body', 'description' => str_repeat('Unrelated instructions. ', 2000)],
            ['name' => 'Neck', 'description' => $description],
        ], 'pattern_notes' => "BANDS WITH I-CORD:\nSlip 3 stitches with yarn in front.",
            'translation_validation' => ['validated' => $translated], 'language' => 'en'];
        $import = ['ai_response_json' => json_encode($parsed), 'pattern_size' => null,
            'translated_text' => $translated
                ? "### Body\n" . str_repeat('Autres instructions. ', 2000)
                    . "\n### Neck\n{$description}\n### BANDS WITH I-CORD\nSlip 2 stitches — translated variant."
                : null,
            'translated_lang' => 'fr'];
        $db = $this->createMock(\PDO::class);
        $db->method('prepare')->willReturnCallback(function (string $sql) use ($project, $sections, $import) {
            $stmt = $this->createMock(\PDOStatement::class);
            $stmt->method('execute')->willReturn(true);
            if (str_contains($sql, 'FROM projects WHERE')) $stmt->method('fetch')->willReturn($project);
            elseif (str_contains($sql, 'FROM project_sections')) $stmt->method('fetchAll')->willReturn($sections);
            elseif (str_contains($sql, 'FROM project_secondary_counters')) $stmt->method('fetchAll')->willReturn([]);
            elseif (str_contains($sql, 'FROM ai_pattern_imports')) $stmt->method('fetch')->willReturn($import);
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

    public function testValidatedTranslationUsesSameSelectorWithoutMixingOriginalVariant(): void
    {
        $context = $this->context('cm', true, true);
        self::assertStringContainsString('PATTERN — TRADUCTION VALIDÉE STRUCTURELLEMENT', $context);
        self::assertStringContainsString('Slip 2 stitches — translated variant.', $context);
        self::assertStringNotContainsString('Slip 3 stitches with yarn in front.', $context);
        $pattern = explode("Patron original en en :\n", $context, 2)[1];
        self::assertLessThanOrEqual(30000, mb_strlen($pattern));
    }
}
