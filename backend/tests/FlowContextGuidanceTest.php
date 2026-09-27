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

    public function testChosenAndUnchosenMultiSizeGuidanceNeverSelectByDefault(): void
    {
        self::assertStringContainsString('Taille choisie', FlowContextGuidance::sizeGuidance('8 ans', true));
        $unchosen = FlowContextGuidance::sizeGuidance(null, true);
        self::assertStringContainsString('connues mais non résolues', $unchosen);
        self::assertStringContainsString('demander la taille', $unchosen);
        self::assertSame('', FlowContextGuidance::sizeGuidance(null, false));
    }
}
