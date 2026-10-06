<?php

declare(strict_types=1);

namespace Tests;

require_once __DIR__ . '/../evals/src/FlowAdapter.php';
require_once __DIR__ . '/../evals/src/Runner.php';

use FlowEval\Runner;
use FlowEval\FlowAdapter;
use FlowEval\FixturePDO;
use PHPUnit\Framework\TestCase;

final class FlowEvaluationHarnessTest extends TestCase
{
    private function suite(): array { return require __DIR__ . '/../evals/scenarios.php'; }

    private function response(string $text): array
    {
        return ['http_status' => 200, 'body' => json_encode(['modelVersion' => 'fake-model',
            'usageMetadata' => ['totalTokenCount' => 42],
            'candidates' => [['finishReason' => 'STOP', 'content' => ['parts' => [['text' => $text]]]]]])];
    }

    public function testOptionsAreExplicitAndScenarioSelectionIsValidated(): void
    {
        self::assertFalse(Runner::options([])['run']);
        self::assertSame(3, Runner::options([])['repeat']);
        self::assertSame(2, Runner::options(['--run', '--repeat', '2'])['repeat']);
        self::assertCount(11, Runner::select($this->suite(), 'all'));
        self::assertCount(1, Runner::select($this->suite(), '144-25-24'));
        $this->expectException(\InvalidArgumentException::class);
        Runner::select($this->suite(), 'missing');
    }

    public function testInvalidRepetitionIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        Runner::options(['--repeat', '0']);
    }

    public function testThreeIndependentRepetitionsRetainRawAndDisplayedOutputs(): void
    {
        $scenario = Runner::select($this->suite(), '144-25-24');
        $calls = 0;
        $result = Runner::evaluate($scenario, 3, function (array $request) use (&$calls): array {
            $calls++;
            self::assertSame('gemini-2.5-flash', $request['model']);
            self::assertSame(4096, $request['payload']['generationConfig']['maxOutputTokens']);
            self::assertCount(2, $request['payload']['contents']);
            return $this->response("Une maille supplémentaire.\n###SUGGESTIONS###\nComment vérifier ?");
        }, ['commit' => 'fixture', 'dirty' => true]);
        self::assertSame(3, $calls);
        self::assertCount(3, $result['runs']);
        foreach ($result['runs'] as $run) {
            $turn = $run['turns'][0];
            self::assertNull($turn['technical_error']);
            self::assertSame('Une maille supplémentaire.', $turn['display']['reply']);
            self::assertSame(['Comment vérifier ?'], $turn['display']['suggestions']);
            self::assertStringContainsString('usageMetadata', $turn['raw_response']['body']);
            self::assertSame('indéterminé', $run['human_review'][0]['status']);
            self::assertGreaterThanOrEqual(0, $turn['duration_seconds']);
        }
    }

    public function testMultiTurnUsesActualPriorOutputNotAnExpectedAnswer(): void
    {
        $calls = 0;
        $result = Runner::evaluate(Runner::select($this->suite(), 'spanish'), 1,
            function (array $request) use (&$calls): array {
                $calls++;
                if ($calls === 2) self::assertSame('Respuesta real simulada', $request['payload']['contents'][2]['parts'][0]['text']);
                return $this->response('Respuesta real simulada');
            }, []);
        self::assertSame(2, $calls);
        self::assertCount(2, $result['runs'][0]['turns']);
    }

    public function testEveryFixtureAssemblesThroughTheRealContextBuilder(): void
    {
        foreach ($this->suite() as $fixture) {
            $prepared = (new FlowAdapter($fixture))->prepare($fixture, [['role' => 'user', 'content' => $fixture['turns'][0]]]);
            self::assertNotEmpty($prepared['context']);
            self::assertStringContainsString($fixture['section']['description'], $prepared['context']);
            self::assertStringContainsString($prepared['context'], $prepared['payload']['contents'][0]['parts'][0]['text']);
        }
        $late = Runner::select($this->suite(), 'late-definition')[0];
        $text = \App\Services\AIPatternExtractorService::buildPlainText($late['pattern']);
        self::assertGreaterThan(30000, mb_strpos($text, 'BANDS WITH I-CORD:'));
    }

    public function testDatabaseAdapterRejectsAnyUnexpectedQuery(): void
    {
        $db = new FixturePDO($this->suite()[0]);
        $this->expectException(\RuntimeException::class);
        $db->prepare('INSERT INTO analytics_events VALUES (1)');
    }

    public function testTechnicalFailuresAreSeparateAndPreserveRawResponse(): void
    {
        $result = Runner::evaluate([$this->suite()[0]], 1,
            static fn(): array => ['http_status' => 429, 'body' => '{"error":"rate limited"}'], []);
        $turn = $result['runs'][0]['turns'][0];
        self::assertNotNull($turn['technical_error']);
        self::assertSame(429, $turn['raw_response']['http_status']);
        self::assertSame('indéterminé', $result['runs'][0]['human_review'][0]['status']);
        self::assertNull($turn['display']);
    }

    public function testExceptionsDoNotPersistPotentialApiSecrets(): void
    {
        $result = Runner::evaluate([$this->suite()[0]], 1, static function (): array {
            throw new \RuntimeException('https://example.com?key=SECRET-KEY');
        }, []);
        self::assertStringNotContainsString('SECRET-KEY', json_encode($result));
        self::assertNotNull($result['runs'][0]['turns'][0]['technical_error']);
    }

    public function testWrongSemanticAnswerIsNotPassedOrFailedByKeywordMatching(): void
    {
        $result = Runner::evaluate([$this->suite()[0]], 1,
            fn(): array => $this->response('Vous êtes au rang 152, faites une diminution.'), []);
        $turn = $result['runs'][0]['turns'][0];
        self::assertNull($turn['technical_error']);
        self::assertSame('indéterminé', $result['runs'][0]['human_review'][0]['status']);
        self::assertArrayNotHasKey('semantic_pass', $turn['automatic_checks']);
    }

    public function testEmptyTruncatedAndTranslationOutputsAreExplicitlyReported(): void
    {
        foreach ([
            ['candidates' => [['finishReason' => 'MAX_TOKENS']]],
            ['candidates' => [['finishReason' => 'STOP', 'content' => ['parts' => [['text' => '']]]]]],
            ['candidates' => [['finishReason' => 'STOP', 'content' => ['parts' => [['text' => '###TRANSLATE_REQUEST### source']]]]]],
        ] as $raw) self::assertNotNull(FlowAdapter::display($raw)['error']);
    }

    public function testMalformedJsonStopsOnlyItsRepetition(): void
    {
        $calls = 0;
        $result = Runner::evaluate(Runner::select($this->suite(), 'spanish'), 2,
            static function () use (&$calls): array {
                $calls++;
                return ['http_status' => 200, 'body' => '{invalid'];
            }, []);
        self::assertSame(2, $calls);
        self::assertCount(2, $result['runs']);
        foreach ($result['runs'] as $run) {
            self::assertCount(1, $run['turns']);
            self::assertSame('JsonException', $run['turns'][0]['technical_error']['type']);
        }
    }

    public function testPendingRequestIsCheckpointedBeforeTransport(): void
    {
        $snapshots = [];
        Runner::evaluate([$this->suite()[0]], 1, function () use (&$snapshots): array {
            $latest = $snapshots[count($snapshots) - 1];
            self::assertNotNull($latest['runs'][0]['turns'][0]['request']);
            self::assertSame('pending', $latest['runs'][0]['turns'][0]['execution_status']);
            self::assertStringContainsString('Génération en attente', Runner::report($latest));
            return $this->response('Réponse');
        }, [], static function (array $partial) use (&$snapshots): void { $snapshots[] = $partial; });
        self::assertNotNull($snapshots[count($snapshots) - 1]['completed_at']);
    }

    public function testJsonAndMarkdownAreSavedAndHumanReviewCanBeRegenerated(): void
    {
        $result = Runner::evaluate([$this->suite()[0]], 1, fn(): array => $this->response('Réponse test'), ['commit' => 'test', 'dirty' => true]);
        $directory = sys_get_temp_dir() . '/flow-eval-test-' . bin2hex(random_bytes(4));
        try {
            Runner::save($result, $directory);
            $saved = json_decode(file_get_contents($directory . '/results.json'), true, 512, JSON_THROW_ON_ERROR);
            self::assertSame($result, $saved);
            self::assertStringContainsString('Réponse test', file_get_contents($directory . '/report.md'));
            $saved['runs'][0]['human_review'][0]['status'] = 'non conforme';
            $saved['runs'][0]['human_review'][0]['evidence'] = 'Extrait à vérifier';
            self::assertStringContainsString('non conforme', Runner::report($saved));
        } finally {
            foreach (glob($directory . '/*') ?: [] as $file) unlink($file);
            if (is_dir($directory)) rmdir($directory);
        }
    }

    public function testVersionMetadataIncludesLocalFlowAndScenarioFingerprints(): void
    {
        $metadata = Runner::metadata(dirname(__DIR__, 2));
        self::assertMatchesRegularExpression('/^[a-f0-9]{40}$/', $metadata['commit']);
        self::assertIsBool($metadata['dirty']);
        self::assertArrayHasKey('backend/controllers/AiAssistantController.php', $metadata['source_sha256']);
        self::assertArrayHasKey('backend/evals/scenarios.php', $metadata['source_sha256']);
        self::assertArrayHasKey('backend/services/FlowContextGuidance.php', $metadata['source_sha256']);
    }
}
