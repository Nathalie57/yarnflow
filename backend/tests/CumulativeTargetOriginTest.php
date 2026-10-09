<?php

declare(strict_types=1);

namespace Tests;

use App\Controllers\SmartProjectController;
use App\Models\Project;
use App\Services\AIPatternExtractorService;
use App\Services\PatternExtractionValidator;
use PDO;
use PHPUnit\Framework\TestCase;

final class CumulativeTargetOriginTest extends TestCase
{
    private function height(float $target = 18): array
    {
        return ['name' => 'Tricoter la première partie', 'description' => 'Continuer jusqu’à 18 cm depuis le montage.',
            'unit' => 'cm', 'target' => $target, 'target_measured_from' => 'piece_start',
            'progression_type' => 'simple', 'starts_new_piece' => false];
    }

    private function castOn(): array
    {
        return ['name' => 'Monter les mailles', 'description' => 'Avec la couleur A, monter 24 mailles souplement.',
            'progression_type' => 'action', 'starts_new_piece' => true, 'unit' => null, 'target' => null];
    }

    private function bandeau(): array
    {
        return ['title' => 'Bandeau Flow', 'craft_type' => 'tricot', 'needles' => [['size' => '4 mm']],
            'sections' => [
                $this->castOn(),
                $this->height(),
                ['name' => 'Détail contrastant', 'description' => 'Tricoter 4 rangs en couleur B.',
                    'unit' => 'rangs', 'target' => 4, 'progression_type' => 'simple', 'target_measured_from' => 'section'],
                ['name' => 'Terminer la longueur', 'description' => 'Continuer jusqu’à 48 cm au total ou la longueur adaptée au tour de tête.',
                    'unit' => 'cm', 'target' => 48, 'progression_type' => 'composite', 'target_measured_from' => 'piece_start'],
                ['name' => 'Rabattre', 'description' => 'Rabattre les 24 mailles souplement.', 'progression_type' => 'action'],
                ['name' => 'Finition torsadée', 'description' => 'Plier les extrémités puis les coudre.', 'progression_type' => 'action'],
            ]];
    }

    public function testCastOnActionInitializesOriginBeforeEighteenCm(): void
    {
        $sections = AIPatternExtractorService::normalizeCumulativeTargets([$this->castOn(), $this->height()], 'tricot');
        self::assertSame(18.0, $sections[1]['target']);
        self::assertSame(18.0, $sections[1]['target_raw']);
        self::assertSame('simple', $sections[1]['progression_type']);
        self::assertNull($sections[0]['unit']);
        self::assertNull($sections[0]['target']);
        self::assertSame($sections, AIPatternExtractorService::normalizeCumulativeTargets($sections, 'tricot'));
    }

    public function testUnknownOriginsDoNotBecomeAutomaticTargets(): void
    {
        foreach ([
            ['name' => 'Préparation', 'description' => 'Placer un repère sur l’ouvrage existant.', 'progression_type' => 'action'],
            ['name' => 'Partie précédente', 'description' => 'Tricoter selon les instructions.', 'unit' => 'cm', 'target' => null, 'progression_type' => 'simple'],
            ['name' => 'Partie précédente', 'description' => 'Tricoter plusieurs étapes.', 'unit' => 'cm', 'target' => null, 'progression_type' => 'composite'],
        ] as $unknown) {
            $sections = AIPatternExtractorService::normalizeCumulativeTargets([$unknown, $this->height()], 'tricot');
            self::assertNull($sections[1]['target'], $unknown['name']);
            self::assertSame(18.0, $sections[1]['target_raw']);
        }
    }

    public function testNewCastOnInMiddleResetsOriginWhileOrdinaryActionsPreserveIt(): void
    {
        $base = ['name' => 'Première pièce', 'unit' => 'cm', 'target' => 10, 'progression_type' => 'simple'];
        $newPiece = AIPatternExtractorService::normalizeCumulativeTargets([$base, $this->castOn(), $this->height()]);
        self::assertSame(18.0, $newPiece[2]['target']);

        $ordinary = ['name' => 'Repère', 'description' => 'Placer un marqueur.', 'progression_type' => 'action'];
        $samePiece = AIPatternExtractorService::normalizeCumulativeTargets([$base, $ordinary, $this->height()]);
        self::assertSame(8.0, $samePiece[2]['target']);
    }

    public function testSimpleNewPieceResetsOriginAndCompositeRemainsUnquantifiable(): void
    {
        $base = ['name' => 'Pièce précédente', 'unit' => 'cm', 'target' => 10, 'progression_type' => 'simple'];
        $beginning = ['name' => 'Nouvelle pièce', 'description' => 'Tricoter 5 cm.', 'unit' => 'cm',
            'target' => 5, 'starts_new_piece' => true, 'progression_type' => 'simple'];
        $simple = AIPatternExtractorService::normalizeCumulativeTargets([$base, $beginning, $this->height()]);
        self::assertSame(5.0, $simple[1]['target']);
        self::assertSame(13.0, $simple[2]['target']);

        $beginning['progression_type'] = 'composite';
        $composite = AIPatternExtractorService::normalizeCumulativeTargets([$base, $beginning, $this->height()]);
        self::assertNull($composite[1]['target']);
        self::assertNull($composite[2]['target']);
        self::assertSame($composite, AIPatternExtractorService::normalizeCumulativeTargets($composite));
    }

    public function testCastOnFallbackAlsoWorksForAnActionWithoutExplicitFlag(): void
    {
        $action = $this->castOn();
        unset($action['starts_new_piece']);
        $action['description'] = 'Monter 24 mailles.';
        $sections = AIPatternExtractorService::normalizeCumulativeTargets([
            ['name' => 'Précédent', 'unit' => 'cm', 'target' => 10], $action, $this->height(),
        ]);
        self::assertSame(18.0, $sections[2]['target']);
    }

    private function parsedBandeau(): array
    {
        // Real response parser, validator and normalizer; no Gemini request.
        $service = (new \ReflectionClass(AIPatternExtractorService::class))->newInstanceWithoutConstructor();
        $response = ['candidates' => [['finishReason' => 'STOP', 'content' => ['parts' => [
            ['text' => json_encode($this->bandeau(), JSON_THROW_ON_ERROR)],
        ]]]]];
        $result = (new \ReflectionMethod($service, 'parseGeminiResponse'))->invoke($service, $response);
        self::assertTrue($result['success']);
        return $result['data'];
    }

    public function testFullBandeauKeepsEighteenCmFourRowsAndUnquantifiableTotalReference(): void
    {
        $data = $this->parsedBandeau();
        self::assertSame(18.0, $data['sections'][1]['target']);
        self::assertSame(4.0, $data['sections'][2]['target']);
        self::assertNull($data['sections'][3]['target']);
        self::assertSame(48.0, $data['sections'][3]['target_raw']);
        self::assertSame('composite', $data['sections'][3]['progression_type']);
        self::assertSame(['value' => 48.0, 'unit' => 'cm', 'from' => 'piece_start'], $data['sections'][3]['pattern_reference']);
        self::assertSame($data['sections'], AIPatternExtractorService::normalizeCumulativeTargets($data['sections'], 'tricot'));

        // Even a simple cumulative target cannot bridge the unknown cm added by four rows.
        $simple = $data['sections'];
        $simple[3]['progression_type'] = 'simple';
        self::assertNull(AIPatternExtractorService::normalizeCumulativeTargets($simple, 'tricot')[3]['target']);
    }

    public function testCreationPersistsNormalizedTargetsThroughRealSqlAndModelRead(): void
    {
        $data = $this->parsedBandeau();
        $preview = PatternExtractionValidator::validateEditedPreview($data, [], $data['sections']);
        self::assertSame([], $preview['blocking_errors']);

        // Isolated in-memory database: never connect to or update application projects.
        $db = new PDO('sqlite::memory:');
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $db->exec('CREATE TABLE project_sections (
            id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, name TEXT,
            counter_unit TEXT, progression_type TEXT, total_rows DECIMAL(10,1),
            current_row DECIMAL(10,1), pattern_start_row INTEGER, description TEXT, display_order INTEGER
        )');
        $insert = new \ReflectionMethod(SmartProjectController::class, 'insertProjectSection');
        foreach ($preview['data']['sections'] as $index => $section) {
            $insert->invoke(null, $db, 1, $section, $index);
        }
        $insert->invoke(null, $db, 1, [
            'name' => 'Phase libre', 'description' => 'Suivre les instructions puis valider.',
            'progression_type' => 'composite', 'unit' => null, 'target' => null,
        ], 6);
        $insert->invoke(null, $db, 1, [
            'name' => 'Oreille', 'description' => 'Crocheter 12 tours.',
            'progression_type' => 'simple', 'unit' => 'tours', 'target' => 12,
        ], 7);
        $model = (new \ReflectionClass(Project::class))->newInstanceWithoutConstructor();
        (new \ReflectionProperty($model, 'db'))->setValue($model, $db);
        $height = $model->getSectionById(2);
        self::assertEquals(18, $height['total_rows']);
        self::assertSame('cm', $height['counter_unit']);
        self::assertSame('simple', $height['progression_type']);
        self::assertEquals(0, $height['current_row']);
        self::assertEquals(4, $model->getSectionById(3)['total_rows']);
        self::assertSame('rows', $model->getSectionById(3)['counter_unit']);
        self::assertNull($model->getSectionById(4)['total_rows']);
        self::assertSame('composite', $model->getSectionById(4)['progression_type']);
        self::assertSame('cm', $model->getSectionById(4)['counter_unit']);
        self::assertNull($model->getSectionById(7)['counter_unit']);
        self::assertSame('composite', $model->getSectionById(7)['progression_type']);
        self::assertNull($model->getSectionById(1)['total_rows']);
        self::assertNull($model->getSectionById(1)['counter_unit']);
        self::assertSame('rounds', $model->getSectionById(8)['counter_unit']);
        self::assertEquals(12, $model->getSectionById(8)['total_rows']);
        self::assertSame(8, (int)$db->query('SELECT COUNT(*) FROM project_sections')->fetchColumn());
    }
}
