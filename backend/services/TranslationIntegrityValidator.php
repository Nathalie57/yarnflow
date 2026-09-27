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

        if (self::numbers($source) !== self::numbers($translation)) {
            $errors[] = self::issue('numbers_changed', 'La traduction ne conserve pas exactement la suite des nombres.');
        }
        if (self::units($source) !== self::units($translation)) {
            $errors[] = self::issue('units_changed', 'La traduction ne conserve pas les mesures ou unités.');
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
        preg_match_all('/(?<![\p{L}\d])\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?/u', $text, $matches);
        return array_map(static fn(string $number): string => str_replace([' ', ','], ['', '.'], $number), $matches[0]);
    }

    private static function units(string $text): array
    {
        preg_match_all('/\b(?:mm|cm|m|kg|g|inch(?:es)?|in|pouces?|rangs?|rows?|tours?|rounds?|mailles?|st(?:itch)?e?s?|fois|times)\b/iu', $text, $matches);
        return array_map([self::class, 'canonicalUnit'], $matches[0]);
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
        return (bool)preg_match('/(?:\*|\b(?:rép(?:éter|étez)?|repeat|rep)\b)/iu', $text);
    }

    private static function hasReferenceInstruction(string $text): bool
    {
        return (bool)preg_match('/\b(?:voir|suiv(?:re|ant)|reportez-vous|référez-vous|see|follow(?:ing)?|refer\s+to)\b/iu', $text);
    }

    private static function issue(string $code, string $message): array
    {
        return ['code' => $code, 'message' => $message];
    }
}
