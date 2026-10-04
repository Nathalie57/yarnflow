<?php

declare(strict_types=1);

namespace Tests;

use App\Controllers\SmartProjectController;
use PHPUnit\Framework\TestCase;

final class SmartProjectMaterialMappingTest extends TestCase
{
    public function testPrimaryNeedleUsesExplicitMainUsage(): void
    {
        $method = new \ReflectionMethod(SmartProjectController::class, 'selectPrimaryNeedle');
        $selected = $method->invoke(null, [
            ['type' => 'crochet', 'size' => '2.5', 'usage' => 'edging and assembly'],
            ['type' => 'crochet', 'size' => '3', 'usage' => 'main garment'],
        ]);

        self::assertSame('3', $selected['size']);
    }

    public function testMultipleNeedlesWithoutUsageDoNotSelectArbitrarily(): void
    {
        $method = new \ReflectionMethod(SmartProjectController::class, 'selectPrimaryNeedle');
        $selected = $method->invoke(null, [
            ['type' => 'crochet', 'size' => '2.5', 'usage' => null],
            ['type' => 'crochet', 'size' => '3', 'usage' => null],
        ]);

        self::assertNull($selected);
    }

    public function testDiagramSourceMustBeARealFileOrUrl(): void
    {
        $method = new \ReflectionMethod(SmartProjectController::class, 'hasAccessibleDiagramSource');

        self::assertFalse($method->invoke(null, true, 'text', 'DROPS pattern text beginning'));
        self::assertFalse($method->invoke(null, true, 'url', 'DROPS pattern text beginning'));
        self::assertTrue($method->invoke(null, true, 'url', 'https://example.com/pattern'));
        self::assertTrue($method->invoke(null, true, 'pdf', 'pattern.pdf'));
        self::assertTrue($method->invoke(null, false, 'text', 'anything'));
    }

    public function testOnlyRealWebSourcesArePersistedAsSourceUrls(): void
    {
        $method = new \ReflectionMethod(SmartProjectController::class, 'validatedSourceUrl');

        self::assertNull($method->invoke(null, 'Beginning of pasted pattern text', 'text'));
        self::assertSame('https://example.com/pattern', $method->invoke(null, 'https://example.com/pattern', 'text'));
        self::assertSame('https://example.com/pattern', $method->invoke(null, 'https://example.com/pattern', 'url'));
        self::assertNull($method->invoke(null, 'pattern.pdf', 'pdf'));
        self::assertNull($method->invoke(null, 'https://example.com/library-item', 'library'));
        self::assertNull($method->invoke(null, 'javascript:alert(1)', 'url'));
    }
}
