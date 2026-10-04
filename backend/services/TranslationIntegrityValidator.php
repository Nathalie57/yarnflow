<?php

declare(strict_types=1);

namespace App\Services;

/** Compare uniquement les invariants structurels qui doivent survivre à une traduction. */
class TranslationIntegrityValidator
{
    public static function validate(string $source, string $translation): array
    {
        $errors = [];
        $warnings = [];

        $sourceNumbers = self::numbers($source);
        $translatedNumbers = self::numbers($translation);
        if ($sourceNumbers !== $translatedNumbers) {
            $errors[] = self::issue(
                'numbers_changed',
                'La traduction ne conserve pas exactement la suite des nombres.',
                self::sequenceDifferences($sourceNumbers, $translatedNumbers)
            );
        }
        $sourceUnits = self::units($source);
        $translatedUnits = self::units($translation);
        if (!self::unitsAreEquivalent($sourceUnits, $translatedUnits, $source)) {
            $errors[] = self::issue(
                'units_changed',
                'La traduction ne conserve pas les mesures ou unités.',
                self::sequenceDifferences($sourceUnits, $translatedUnits)
            );
        }
        if (substr_count($source, '*') !== substr_count($translation, '*')) {
            $errors[] = self::issue('asterisks_changed', 'La traduction ne conserve pas les marqueurs de répétition « * ».');
        }
        if (substr_count($source, '[') !== substr_count($translation, '[')
            || substr_count($source, ']') !== substr_count($translation, ']')) {
            $errors[] = self::issue('brackets_changed', 'La traduction ne conserve pas les crochets structurants.');
        }
        if (substr_count($source, '###') !== substr_count($translation, '###')) {
            $errors[] = self::issue('section_markers_changed', 'La traduction ne conserve pas le nombre de séparateurs de sections.');
        }
        if (self::hasRepeatInstruction($source) && !self::hasRepeatInstruction($translation)) {
            $errors[] = self::issue('repeat_instruction_lost', 'Une instruction de répétition semble avoir disparu de la traduction.');
        }

        if (substr_count($source, '(') !== substr_count($translation, '(')
            || substr_count($source, ')') !== substr_count($translation, ')')) {
            $errors[] = self::issue('parentheses_changed', 'La traduction ne conserve pas les parenthèses structurantes.');
        }
        if (self::hasReferenceInstruction($source) && !self::hasReferenceInstruction($translation)) {
            $errors[] = self::issue('reference_instruction_lost', 'Une référence à une autre partie du patron semble avoir disparu.');
        }

        return ['valid' => empty($errors), 'errors' => $errors, 'warnings' => $warnings];
    }

    private static function numbers(string $text): array
    {
        $text = self::withoutGlossaryEquivalents($text);
        // Certains patrons contiennent des notations compactes comme "purl2" que la
        // traduction développe légitimement en "2 m env". Le chiffre reste structurant.
        $text = preg_replace('/\b(?:knit|purl|k|p)(?=\d)/iu', '$0 ', $text) ?? $text;
        $text = strtr($text, [
            '¼' => ' 1/4', '½' => ' 1/2', '¾' => ' 3/4',
            '⅐' => ' 1/7', '⅑' => ' 1/9', '⅒' => ' 1/10',
            '⅓' => ' 1/3', '⅔' => ' 2/3', '⅕' => ' 1/5', '⅖' => ' 2/5',
            '⅗' => ' 3/5', '⅘' => ' 4/5', '⅙' => ' 1/6', '⅚' => ' 5/6',
            '⅛' => ' 1/8', '⅜' => ' 3/8', '⅝' => ' 5/8', '⅞' => ' 7/8',
        ]);
        preg_match_all(
            '/(?<![\p{L}\d])(?:\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)(?![\p{L}\d])/u',
            $text,
            $matches
        );
        return array_map([self::class, 'canonicalNumber'], $matches[0]);
    }

    /** Canonicalise exactement en fraction réduite, sans arrondi flottant. */
    private static function canonicalNumber(string $number): string
    {
        $number = preg_replace('/\s+/u', ' ', trim(str_replace(',', '.', $number))) ?? trim($number);
        $whole = 0;
        $numerator = 0;
        $denominator = 1;

        if (preg_match('/^(\d+) (\d+)\s*\/\s*(\d+)$/', $number, $parts)) {
            $whole = (int)$parts[1];
            $numerator = (int)$parts[2];
            $denominator = max(1, (int)$parts[3]);
            $numerator += $whole * $denominator;
        } elseif (preg_match('/^(\d+)\s*\/\s*(\d+)$/', $number, $parts)) {
            $numerator = (int)$parts[1];
            $denominator = max(1, (int)$parts[2]);
        } elseif (str_contains($number, '.')) {
            [$integer, $decimal] = explode('.', $number, 2);
            $denominator = 10 ** strlen($decimal);
            $numerator = ((int)$integer * $denominator) + (int)$decimal;
        } else {
            return (string)(int)$number;
        }

        $divisor = self::greatestCommonDivisor($numerator, $denominator);
        $numerator = intdiv($numerator, $divisor);
        $denominator = intdiv($denominator, $divisor);
        return $denominator === 1 ? (string)$numerator : $numerator . '/' . $denominator;
    }

    private static function greatestCommonDivisor(int $left, int $right): int
    {
        while ($right !== 0) {
            [$left, $right] = [$right, $left % $right];
        }
        return max(1, abs($left));
    }

    private static function units(string $text): array
    {
        $text = self::withoutGlossaryEquivalents($text);
        // "worked in the round" décrit une méthode de construction ; round n'y est
        // ni une quantité ni un repère de progression.
        $text = preg_replace('/\bin\s+the\s+round\b/iu', ' circularly ', $text) ?? $text;
        // Dans un nom d'ouvrage, "tour" ne désigne pas une unité de progression.
        $text = preg_replace('/\btour\s+de\s+cou\b/iu', 'col', $text) ?? $text;
        // Dans "stockinette stitch" / "garter stitch", stitch nomme un point ; ce n'est
        // pas une quantité de mailles et la traduction française emploie "jersey/point mousse".
        $text = preg_replace('/\b(stockinette|garter)\s+(?:stitch|st)\b/iu', '$1', $text) ?? $text;
        // "in" is also an English preposition. Retain it only after a numeric
        // measurement (including decimal/fractional and parenthesized sizes).
        $text = preg_replace_callback('/\bin\b/iu', static function (array $match) use ($text): string {
            $prefix = substr($text, 0, $match[0][1]);
            $suffix = substr($text, $match[0][1] + strlen($match[0][0]));
            if (preg_match('/^\s+(?:each|every|the|a|an|this|that|pattern|stockinette|garter|rib)\b/iu', $suffix)) return '';
            return preg_match('/(?:\d|[¼-¾⅐-⅞])(?:\s*[)\]])?\s*$/u', $prefix) ? $match[0][0] : '';
        }, $text, -1, $count, PREG_OFFSET_CAPTURE);
        // "m" reste le mètre par défaut. Il devient "maille" seulement si le voisinage
        // contient un signal textile explicite ; une mesure ("mesure 2 m") garde priorité.
        $isTextileDocument = (bool)preg_match(
            '/\b(?:tricoter|maille|aiguille|rang|tour|jersey|endroit|envers|knit|purl|stitch(?:es)?)\b/iu',
            $text
        );
        // Certaines traductions DROPS placent l'abréviation avant le nombre
        // ("m end 3" / "m env 2") plutôt qu'après ("3 m end"). Dans ce
        // voisinage textile non ambigu, il s'agit bien d'une maille et jamais
        // de l'unité physique mètre. La suite des nombres reste validée à part.
        $text = preg_replace(
            '/\bm(?=\s+(?:end(?:roit)?|env(?:ers)?)\s+\d+(?:[.,]\d+)?\b)/iu',
            'maille',
            $text
        ) ?? $text;
        $text = preg_replace_callback('/\bm\b/iu', static function (array $match) use ($text, $isTextileDocument): string {
            $offset = $match[0][1];
            $prefix = substr($text, max(0, $offset - 100), min(100, $offset));
            $suffix = substr($text, $offset + strlen($match[0][0]), 60);
            if (preg_match('/\b(?:toutes?\s+les?|chaque)\s*$/iu', $prefix)) return 'maille';
            $hasNumericPrefix = (bool)preg_match('/\d+(?:[.,]\d+)?\s*$/u', $prefix);
            if (!$hasNumericPrefix) return '';
            $physicalMeasurement = (bool)preg_match(
                '/(?:measures?|mesur\p{L}*|longueur|hauteur|largeur|jusqu[\x{2019}\'\x{00E0}a]{1,3})[^.!?;\n]{0,35}\d+(?:[.,]\d+)?\s*$/iu',
                $prefix
            ) || (bool)preg_match('/^\s+(?:de\s+fil|of\s+yarn|long(?:ueur)?s?)\b/iu', $suffix);
            if ($physicalMeasurement) return $match[0][0];

            $textileSuffix = (bool)preg_match(
                '/^\s+(?:end(?:roit)?|env(?:ers)?|ens(?:emble)?|jersey|de\s+bordure|au\s+point)\b/iu',
                $suffix
            );
            $textilePrefix = (bool)preg_match(
                '/(?:tricot\p{L}*|monter|rabatt\p{L}*|augment\p{L}*|diminu\p{L}*|maille|aiguille|jersey|c[oô]tes?|point)[^.!?;\n]{0,55}\d+(?:[.,]\d+)?\s*$/iu',
                $prefix
            );
            return ($textileSuffix || $textilePrefix || $isTextileDocument) ? 'maille' : $match[0][0];
        }, $text, -1, $count, PREG_OFFSET_CAPTURE);
        // La lettre de l'abréviation anglaise "e.g." n'est pas un gramme. Comme pour les
        // autres mesures, g n'est une unité que lorsqu'une quantité numérique la précède.
        $text = preg_replace_callback('/\bg\b/iu', static function (array $match) use ($text): string {
            $prefix = substr($text, 0, $match[0][1]);
            return preg_match('/\d+(?:[.,]\d+)?\s*$/u', $prefix) ? $match[0][0] : '';
        }, $text, -1, $count, PREG_OFFSET_CAPTURE);
        preg_match_all('/\b(?:mm|cm|m|kg|g|inch(?:es)?|in|pouces?|rangs?|rows?|tours?|rounds?|mailles?|st(?:itch)?e?s?|fois|times)\b/iu', $text, $matches);
        return array_map([self::class, 'canonicalUnit'], $matches[0]);
    }

    /**
     * "knit 4" contient quatre mailles sans prononcer l'unité. Une traduction peut
     * légitimement écrire "tricoter 4 m". Cette seule unité peut donc être explicitée,
     * au maximum autant de fois que la source contient ces constructions implicites.
     */
    private static function unitsAreEquivalent(array $sourceUnits, array $translatedUnits, string $source): bool
    {
        $sourceWithoutStitches = array_values(array_filter($sourceUnits, static fn(string $unit): bool => $unit !== 'stitches'));
        $translatedWithoutStitches = array_values(array_filter($translatedUnits, static fn(string $unit): bool => $unit !== 'stitches'));
        if ($sourceWithoutStitches !== $translatedWithoutStitches) {
            return false;
        }

        $sourceStitches = count(array_filter($sourceUnits, static fn(string $unit): bool => $unit === 'stitches'));
        $translatedStitches = count(array_filter($translatedUnits, static fn(string $unit): bool => $unit === 'stitches'));
        preg_match_all(
            '/\b(?:knit|purl|k|p)\s*\d+(?:[.,]\d+)?(?!\s+stitch(?:es)?\b)/iu',
            self::withoutGlossaryEquivalents($source),
            $implicitMatches
        );
        $maximumTranslatedStitches = $sourceStitches + count($implicitMatches[0]);

        return $translatedStitches >= $sourceStitches && $translatedStitches <= $maximumTranslatedStitches;
    }

    /** Retire seulement les nombres/unités qui font partie d'une abréviation textile équivalente. */
    private static function withoutGlossaryEquivalents(string $text): string
    {
        return preg_replace([
            '/\bk2tog\b/iu',
            '/\b(?:knit\s+)?2\s+stitches?\s+together\b/iu',
            '/\b2\s*m(?:ailles?)?\s+ens(?:emble)?\s+end(?:roit)?\b/iu',
        ], ' ', $text);
    }

    private static function canonicalUnit(string $unit): string
    {
        $unit = mb_strtolower($unit);
        return match (true) {
            in_array($unit, ['row', 'rows', 'rang', 'rangs'], true) => 'rows',
            in_array($unit, ['round', 'rounds', 'tour', 'tours'], true) => 'rounds',
            in_array($unit, ['maille', 'mailles', 'st', 'sts', 'stitch', 'stitches'], true) => 'stitches',
            in_array($unit, ['inch', 'inches', 'in', 'pouce', 'pouces'], true) => 'inches',
            in_array($unit, ['fois', 'times'], true) => 'times',
            default => $unit,
        };
    }

    private static function hasRepeatInstruction(string $text): bool
    {
        return (bool)preg_match('/(?:\*|\b(?:rép(?:éter|étez|étitions?)?|repeat|rep)\b)/iu', $text);
    }

    private static function hasReferenceInstruction(string $text): bool
    {
        return (bool)preg_match('/\b(?:voir|suiv(?:re|ant)|reportez-vous|référez-vous|see|follow(?:ing)?|refer\s+to)\b/iu', $text);
    }

    /** Retourne seulement les jetons divergents, jamais le texte complet du patron. */
    private static function sequenceDifferences(array $expected, array $actual): array
    {
        $differences = [];
        $length = max(count($expected), count($actual));
        for ($index = 0; $index < $length && count($differences) < 25; $index++) {
            $expectedValue = $expected[$index] ?? null;
            $actualValue = $actual[$index] ?? null;
            if ($expectedValue !== $actualValue) {
                $differences[] = [
                    'index' => $index,
                    'expected' => $expectedValue,
                    'actual' => $actualValue,
                ];
            }
        }

        $expectedCounts = array_count_values($expected);
        $actualCounts = array_count_values($actual);
        $missing = [];
        $unexpected = [];
        foreach (array_unique(array_merge(array_keys($expectedCounts), array_keys($actualCounts))) as $value) {
            $delta = ($expectedCounts[$value] ?? 0) - ($actualCounts[$value] ?? 0);
            if ($delta > 0) $missing[] = ['value' => (string)$value, 'count' => $delta];
            if ($delta < 0) $unexpected[] = ['value' => (string)$value, 'count' => -$delta];
        }

        return [
            'expected_count' => count($expected),
            'actual_count' => count($actual),
            'missing' => $missing,
            'unexpected' => $unexpected,
            'differences' => $differences,
            'truncated' => $length > 25 && count($differences) === 25,
        ];
    }

    private static function issue(string $code, string $message, array $details = []): array
    {
        $issue = ['code' => $code, 'message' => $message];
        if ($details !== []) {
            $issue['details'] = $details;
        }
        return $issue;
    }
}
