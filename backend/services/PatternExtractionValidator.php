<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Garde-fous métier conservateurs appliqués à la sortie structurée de Gemini.
 * Ils ne cherchent pas à comprendre le patron : seules les contradictions
 * objectivement vérifiables sont corrigées ou signalées.
 */
class PatternExtractionValidator
{
    private const DIAGRAM_REFERENCE = '/\b(?:suiv(?:re|ant)|selon|voir|reportez-vous\s+(?:à|au)|follow(?:ing)?|see|refer\s+to)\s+(?:la|le|au|the|a|un|une)?\s*(?:grille|diagramme|diagram|chart|graphique)\b/iu';

    public static function validate(array $data, ?string $patternSize = null): array
    {
        $errors = [];
        $autoCorrected = [];
        $warnings = [];
        $unverifiable = [];

        $sections = is_array($data['sections'] ?? null) ? $data['sections'] : [];
        if (!$sections) {
            $errors[] = self::issue('sections_missing', 'Aucune section exploitable n’a été extraite.');
        }

        foreach ($sections as $index => &$section) {
            if (!is_array($section)) {
                $errors[] = self::issue('section_invalid', 'Une section extraite est structurellement invalide.', ['section_index' => $index]);
                continue;
            }

            $name = trim((string)($section['name'] ?? ''));
            $description = trim((string)($section['description'] ?? ''));
            if ($name === '' && $description === '') {
                $errors[] = self::issue('section_empty', 'Une section extraite est entièrement vide.', ['section_index' => $index]);
            } elseif ($description === '') {
                $errors[] = self::issue('section_instructions_missing', 'Une section ne contient aucune instruction.', ['section_index' => $index, 'section_name' => $name]);
            }

            $progressionType = $section['progression_type'] ?? 'simple';
            if (!in_array($progressionType, ['simple', 'composite'], true)) {
                $errors[] = self::issue('progression_type_invalid', 'Le type de progression d’une section est invalide.', ['section_index' => $index]);
                $section['progression_type'] = 'simple';
                $progressionType = 'simple';
            }

            if ($progressionType === 'composite' && ($section['target'] ?? null) !== null) {
                $autoCorrected[] = self::issue('composite_target_cleared', 'La cible unique d’une section composite a été supprimée.', ['section_index' => $index, 'section_name' => $name]);
                $section['target'] = null;
            }

            $target = $section['target'] ?? null;
            if ($target !== null && (!is_numeric($target) || (float)$target <= 0 || (float)$target >= 100000)) {
                $errors[] = self::issue('section_target_invalid', 'La cible numérique d’une section est invalide et sa valeur correcte ne peut pas être déterminée.', ['section_index' => $index, 'section_name' => $name]);
                $section['target'] = null;
            }
        }
        unset($section);
        $data['sections'] = $sections;

        $referenceText = self::referenceText($data);
        if (preg_match(self::DIAGRAM_REFERENCE, $referenceText) && empty($data['contains_diagram'])) {
            $autoCorrected[] = self::issue('diagram_flag_enabled', 'Le signalement du diagramme a été activé car les instructions y font explicitement référence.');
            $data['contains_diagram'] = true;
        }

        self::secureDiagramMetadata($data, $autoCorrected);

        foreach (self::findUsedYarns($referenceText) as $usedYarn) {
            if (!self::yarnExists($usedYarn, $data['yarn'] ?? [])) {
                $warnings[] = self::issue('used_yarn_missing', 'Un fil ou coloris explicitement utilisé dans les instructions est absent des fournitures extraites.', ['value' => $usedYarn]);
            }
        }

        foreach (($data['unresolved_data'] ?? []) as $item) {
            if (!is_array($item)) continue;
            if (($item['type'] ?? '') === 'yarn_quantity' && !empty($item['yarn'])) {
                $constantValue = self::constantNormalizedQuantity($item['source_values'] ?? null);
                if ($constantValue !== null) {
                    self::setYarnQuantity($data, (string)$item['yarn'], $constantValue);
                    $item['resolved'] = true;
                    $item['resolved_value'] = $constantValue;
                    $item['resolution'] = 'constant_across_sizes';
                    $autoCorrected[] = self::issue(
                        'constant_yarn_quantity_resolved',
                        'Une quantité identique pour toutes les tailles a été résolue automatiquement.',
                        ['yarn' => (string)$item['yarn'], 'value' => $constantValue]
                    );
                } else {
                    self::setYarnQuantity($data, (string)$item['yarn'], null);
                }
            }
            $normalizedUnresolved[] = $item;
        }
        if (isset($data['unresolved_data']) && is_array($data['unresolved_data'])) {
            $data['unresolved_data'] = $normalizedUnresolved ?? [];
        }

        if (($patternSize === null || trim($patternSize) === '') && self::looksMultiSize($referenceText)) {
            $unverifiable[] = self::issue(
                'pattern_size_not_selected',
                'Le patron contient plusieurs tailles et aucune taille n’a été choisie. Les valeurs dépendantes de la taille restent non résolues.'
            );
        }

        $data['validation_issues'] = [
            'errors' => $errors,
            'auto_corrected' => $autoCorrected,
            'warnings' => $warnings,
            'unverifiable' => $unverifiable,
        ];

        return [
            'data' => $data,
            'has_certain_errors' => !empty($errors),
            'has_unresolved_errors' => !empty($errors),
            'errors' => $errors,
            'auto_corrected' => $autoCorrected,
            'warnings' => $warnings,
            'unverifiable' => $unverifiable,
        ];
    }

    private static function issue(string $code, string $message, array $context = []): array
    {
        return ['code' => $code, 'message' => $message, 'context' => $context];
    }

    private static function referenceText(array $data): string
    {
        $parts = [(string)($data['pattern_notes'] ?? '')];
        foreach (($data['sections'] ?? []) as $section) {
            if (is_array($section)) $parts[] = (string)($section['description'] ?? '');
        }
        return implode("\n", $parts);
    }

    private static function findUsedYarns(string $text): array
    {
        $found = [];
        $patterns = [
            '/\b([\p{Lu}][\p{L}\p{M}\-]{2,30})\s+(?:aig(?:uille)?s?\.?|crochet)\s*(?:n[°ºo]\s*)?\d/iu',
            '/\b(?:using|avec)\s+([\p{Lu}][\p{L}\p{M}\-]{2,30})(?:\s|[,.])/u',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches)) {
                foreach ($matches[1] as $value) $found[mb_strtolower(trim($value))] = trim($value);
            }
        }
        return array_values($found);
    }

    private static function yarnExists(string $needle, array $yarns): bool
    {
        $needle = mb_strtolower(trim($needle));
        foreach ($yarns as $yarn) {
            if (!is_array($yarn)) continue;
            foreach (['name', 'brand', 'color'] as $field) {
                $value = mb_strtolower(trim((string)($yarn[$field] ?? '')));
                if ($value !== '' && (str_contains($value, $needle) || str_contains($needle, $value))) return true;
            }
        }
        return false;
    }

    private static function setYarnQuantity(array &$data, string $yarnName, int|float|null $amount): void
    {
        if (!isset($data['yarn']) || !is_array($data['yarn'])) return;

        foreach ($data['yarn'] as &$yarn) {
            if (!is_array($yarn)) continue;
            $haystack = mb_strtolower(implode(' ', [(string)($yarn['name'] ?? ''), (string)($yarn['color'] ?? '')]));
            if (str_contains($haystack, mb_strtolower($yarnName))) {
                $yarn['quantity_needed']['amount'] = $amount;
            }
        }
        unset($yarn);
    }

    private static function constantNormalizedQuantity(mixed $sourceValues): int|float|null
    {
        if (!is_array($sourceValues) || $sourceValues === []) return null;

        $normalized = [];
        foreach ($sourceValues as $value) {
            if (!is_scalar($value)) return null;
            $value = str_replace(',', '.', trim((string)$value));
            if ($value === '' || !is_numeric($value)) return null;
            $number = (float)$value;
            $normalized[] = floor($number) === $number ? (int)$number : $number;
        }

        $first = $normalized[0];
        foreach ($normalized as $value) {
            if ($value !== $first) return null;
        }
        return $first;
    }

    private static function secureDiagramMetadata(array &$data, array &$autoCorrected): void
    {
        if (!isset($data['diagram_metadata']) || !is_array($data['diagram_metadata'])) return;

        foreach ($data['diagram_metadata'] as $index => &$metadata) {
            if (!is_array($metadata)) continue;
            $metadata['dimensions_source'] = $metadata['dimensions_source'] ?? 'ai_visual_estimate';
            $orientationVerified = ($metadata['orientation_verified'] ?? false) === true;
            $dimensionsVerified = ($metadata['dimensions_verified'] ?? false) === true;
            $metadata['orientation_verified'] = $orientationVerified;
            $metadata['dimensions_verified'] = $dimensionsVerified;

            if ((!$orientationVerified || !$dimensionsVerified) && !empty($metadata['compatible_with_chart_editor'])) {
                $metadata['compatible_with_chart_editor'] = false;
                $autoCorrected[] = self::issue(
                    'diagram_editor_compatibility_disabled',
                    'La compatibilité avec l’éditeur a été désactivée car les dimensions ou leur orientation ne sont pas vérifiées.',
                    ['diagram_index' => $index]
                );
            }
        }
        unset($metadata);
    }

    private static function looksMultiSize(string $text): bool
    {
        return (bool)preg_match('/\b\d+(?:\s*[-\/]\s*\d+){2,}\b/u', $text);
    }
}
