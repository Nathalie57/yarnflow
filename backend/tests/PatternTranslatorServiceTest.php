<?php

declare(strict_types=1);

namespace Tests;

use App\Services\PatternTranslatorService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;

final class PatternTranslatorServiceTest extends TestCase
{
    public function testOnlyRejectedExtrasBlockIsRepairedOnce(): void
    {
        $history = [];
        $service = $this->serviceWithResponses([
            "### Corps\nTricoter 10 rangs.",
            "### Notes du patron\nRépéter 3 fois.",
            "### Notes du patron\nRépéter 2 fois.",
        ], $history);

        $result = $service->translateParsedPattern([
            'sections' => [['name' => 'Body', 'description' => 'Work 10 rows.']],
            'pattern_notes' => 'Repeat 2 times.',
        ], 'fr');

        self::assertTrue($result['success']);
        self::assertSame(['extras'], $result['translation_validation']['repaired_blocks']);
        self::assertSame('Corps', $result['translated_sections'][0]['name']);
        self::assertStringContainsString('Répéter 2 fois.', $result['translated_pattern_notes']);
        self::assertCount(3, $history);
        self::assertStringContainsString('REJECTED_TRANSLATION_UNTRUSTED', (string)$history[2]['request']->getBody());
    }

    public function testFailedRepairStopsAfterOneAttemptAndDoesNotExposeRejectedText(): void
    {
        $history = [];
        $service = $this->serviceWithResponses([
            "### Corps\nTricoter 9 rangs.",
            "### Corps\nTricoter 8 rangs.",
        ], $history);

        $result = $service->translateParsedPattern([
            'sections' => [['name' => 'Body', 'description' => 'Work 10 rows.']],
        ], 'fr');

        self::assertFalse($result['success']);
        self::assertSame('translation_integrity_failed', $result['error_code']);
        self::assertTrue($result['repair_attempted']);
        self::assertSame('sections', $result['failed_block']);
        self::assertArrayNotHasKey('rejected_translation', $result);
        self::assertCount(2, $history);
    }

    public function testExtrasFailureFailsTheWholeTranslationInsteadOfMixingLanguages(): void
    {
        $history = [];
        $responses = [
            new Response(200, [], json_encode([
                'candidates' => [[
                    'finishReason' => 'STOP',
                    'content' => ['parts' => [['text' => "### Corps\nTricoter 10 rangs."]]],
                ]],
            ], JSON_UNESCAPED_UNICODE)),
            new Response(200, [], json_encode(['candidates' => []])),
        ];
        $stack = HandlerStack::create(new MockHandler($responses));
        $stack->push(Middleware::history($history));
        $service = new PatternTranslatorService(new Client(['handler' => $stack]));

        $result = $service->translateParsedPattern([
            'sections' => [['name' => 'Body', 'description' => 'Work 10 rows.']],
            'pattern_notes' => 'Keep these instructions with the pattern.',
        ], 'fr');

        self::assertFalse($result['success']);
        self::assertCount(2, $history);
        self::assertArrayNotHasKey('translated_sections', $result);
    }

    public function testBroadIntegrityDivergenceSkipsUnlikelyRepair(): void
    {
        $history = [];
        $service = $this->serviceWithResponses([
            "### Corps\nTricoter 10 rangs maille maille maille maille maille maille maille maille maille.",
        ], $history);

        $result = $service->translateParsedPattern([
            'sections' => [['name' => 'Body', 'description' => 'Work 10 rows.']],
        ], 'fr');

        self::assertFalse($result['success']);
        self::assertSame('translation_integrity_failed', $result['error_code']);
        self::assertTrue($result['repair_skipped']);
        self::assertSame('sections', $result['failed_block']);
        self::assertArrayNotHasKey('rejected_translation', $result);
        self::assertCount(1, $history);
    }

    private function serviceWithResponses(array $translations, array &$history): PatternTranslatorService
    {
        $responses = array_map(static fn(string $translation): Response => new Response(200, [], json_encode([
            'candidates' => [[
                'finishReason' => 'STOP',
                'content' => ['parts' => [['text' => $translation]]],
            ]],
        ], JSON_UNESCAPED_UNICODE)), $translations);
        $stack = HandlerStack::create(new MockHandler($responses));
        $stack->push(Middleware::history($history));
        return new PatternTranslatorService(new Client(['handler' => $stack]));
    }
}
