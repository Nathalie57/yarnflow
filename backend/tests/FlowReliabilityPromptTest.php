<?php

declare(strict_types=1);

namespace Tests;

use App\Controllers\AiAssistantController;
use App\Services\FlowContextGuidance;
use PHPUnit\Framework\TestCase;

/** Vérifie les consignes réellement envoyées, sans appel réseau ni base de données. */
final class FlowReliabilityPromptTest extends TestCase
{
    private function prompt(?string $context, string $lang = 'fr'): string
    {
        $reflection = new \ReflectionClass(AiAssistantController::class);
        $controller = $reflection->newInstanceWithoutConstructor();
        return $reflection->getMethod('getSystemPrompt')->invoke($controller, 'pro', $context, $lang, false);
    }

    public function test144RowsAnd25StitchesRemainAnObservedDiscrepancy(): void
    {
        $prompt = $this->prompt('');
        self::assertStringContainsString(FlowContextGuidance::reliabilityGuidance(), $prompt);
        self::assertStringContainsString('APP STATE = rang 144', $prompt);
        self::assertStringContainsString('USER REALITY = rang 144 terminé et 25 mailles', $prompt);
        self::assertStringContainsString('24 mailles attendues au rang 144', $prompt);
        self::assertStringContainsString('Cela ne permet pas de conclure que tu es au rang 152', $prompt);
        self::assertStringContainsString('La prochaine augmentation prévue par le patron est au rang 152', $prompt);
        self::assertStringContainsString('Ne conclus pas « tu as terminé le rang 152 »', $prompt);
        self::assertStringContainsString('tant que le diagnostic et les conséquences ne sont pas suffisamment établis', $prompt);
        self::assertStringNotContainsString('Hiérarchie des sources : 1) progression', $prompt);
        self::assertStringNotContainsString('NE TE CONTENTE JAMAIS', $prompt);
    }

    public function testLanguageRequestsAreAllowedInGeneralAndContextualModes(): void
    {
        foreach ([null, ''] as $context) {
            foreach (['fr', 'en'] as $lang) {
                $prompt = $this->prompt($context, $lang);
                self::assertStringContainsString('sauf demande explicite de changement de langue', $prompt);
                self::assertStringContainsString('I want to speak in español', $prompt);
                self::assertStringContainsString('ne doit jamais déclencher le refus hors domaine', $prompt);
                self::assertStringNotContainsString('Réponds TOUJOURS', $prompt);
            }
        }
    }

    public function testReplacementYarnRequiresGaugeComparison(): void
    {
        $prompt = $this->prompt('');
        self::assertStringContainsString('pas une obligation automatique pour un fil de remplacement', $prompt);
        self::assertStringContainsString('demande l’échantillon manquant', $prompt);
    }
}
