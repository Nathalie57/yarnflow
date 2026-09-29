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
    private const MARKER_REFERENCE = '/\b(?:work|complete|proceed)\s+from\s+(\*{2,})(?:\s+to\s+(\*{2,}))?\s+as\s+given\s+for\s+([^\r\n.]+)/iu';

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

        self::checkSectionReferences($sections, $warnings);

        $referenceText = self::referenceText($data);
        if (preg_match(self::DIAGRAM_REFERENCE, $referenceText) && empty($data['contains_diagram'])) {
            $autoCorrected[] = self::issue('diagram_flag_enabled', 'Le signalement du diagramme a été activé car les instructions y font explicitement référence.');
            $data['contains_diagram'] = true;
        }

        self::secureDiagramMetadata($data, $autoCorrected);
        self::secureGauge($data, $autoCorrected);

        foreach (self::findUsedYarns($referenceText) as $usedYarn) {
            if (!self::yarnExists($usedYarn, $data['yarn'] ?? [])) {
                $warnings[] = self::issue('used_yarn_missing', 'Un fil ou coloris explicitement utilisé dans les instructions est absent des fournitures extraites.', ['value' => $usedYarn]);
            }
        }

        foreach (($data['unresolved_data'] ?? []) as $item) {
            if (!is_array($item)) continue;
            if (($item['type'] ?? '') === 'yarn_quantity' && !empty($item['yarn'])) {
                self::ensureUnresolvedYarnExists($data, (string)$item['yarn'], $autoCorrected);
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

    private static function ensureUnresolvedYarnExists(array &$data, string $yarnName, array &$autoCorrected): void
    {
        $yarnName = trim($yarnName);
        if ($yarnName === '' || self::yarnExists($yarnName, is_array($data['yarn'] ?? null) ? $data['yarn'] : [])) return;

        if (!isset($data['yarn']) || !is_array($data['yarn'])) $data['yarn'] = [];

        $unit = null;
        foreach ($data['yarn'] as $existingYarn) {
            $candidate = $existingYarn['quantity_needed']['unit'] ?? null;
            if (is_string($candidate) && trim($candidate) !== '') {
                $unit = $candidate;
                break;
            }
        }

        $data['yarn'][] = [
            'brand' => null,
            'name' => $yarnName,
            'color' => null,
            'weight' => null,
            'composition' => null,
            'quantity_needed' => ['amount' => null, 'unit' => $unit],
        ];
        $autoCorrected[] = self::issue(
            'unresolved_yarn_restored',
            'Un fil explicitement présent dans les quantités multi-tailles a été restauré dans les fournitures.',
            ['yarn' => $yarnName]
        );
    }

    private static function checkSectionReferences(array $sections, array &$warnings): void
    {
        foreach ($sections as $section) {
            if (!is_array($section)) continue;
            $description = (string)($section['description'] ?? '');
            if (!preg_match_all(self::MARKER_REFERENCE, $description, $matches, PREG_SET_ORDER)) continue;

            foreach ($matches as $match) {
                $referencedName = trim($match[3]);
                $referencedSection = self::findSectionByName($sections, $referencedName);
                if ($referencedSection === null) {
                    $warnings[] = self::issue('referenced_section_missing', 'Une section mentionnée par un renvoi est absente.', [
                        'section_name' => (string)($section['name'] ?? ''),
                        'referenced_section' => $referencedName,
                    ]);
                    continue;
                }

                $referencedDescription = (string)($referencedSection['description'] ?? '');
                $markers = array_values(array_unique(array_filter([$match[1] ?? null, $match[2] ?? null])));
                foreach ($markers as $marker) {
                    if (!str_contains($referencedDescription, $marker)) {
                        $warnings[] = self::issue('referenced_marker_missing', 'Un repère utilisé par un renvoi est absent de la section référencée.', [
                            'section_name' => (string)($section['name'] ?? ''),
                            'referenced_section' => (string)($referencedSection['name'] ?? $referencedName),
                            'marker' => $marker,
                        ]);
                    }
                }
            }
        }
    }

    private static function findSectionByName(array $sections, string $name): ?array
    {
        $name = mb_strtolower(trim($name));
        foreach ($sections as $section) {
            if (!is_array($section)) continue;
            $candidate = mb_strtolower(trim((string)($section['name'] ?? '')));
            if ($candidate !== '' && ($candidate === $name || str_contains($candidate, $name) || str_contains($name, $candidate))) {
                return $section;
            }
        }
        return null;
    }

    private static function secureGauge(array &$data, array &$autoCorrected): void
    {
        if (!is_array($data['gauge'] ?? null)) return;
        if (($data['gauge']['stitches'] ?? null) === null && ($data['gauge']['rows'] ?? null) === null) return;

        $notes = (string)($data['pattern_notes'] ?? '');
        $hasMotifGauge = preg_match('/\b\d+(?:[.,]\d+)?\s+(?:diamonds?|motifs?|repeats?)\b.{0,80}\b(?:10\s*cm|4\s*(?:in|inches))\b/iu', $notes);
        $hasExplicitStitchGauge = preg_match('/\b\d+\s+(?:sts?|stitches|mailles?)\b.{0,80}\b\d+\s+(?:rows?|rangs?)\b/iu', $notes);
        if (!$hasMotifGauge || $hasExplicitStitchGauge) return;

        $data['gauge']['stitches'] = null;
        $data['gauge']['rows'] = null;
        $autoCorrected[] = self::issue(
            'derived_motif_gauge_cleared',
            'Une tension exprimée en motifs ne peut pas être convertie de façon certaine en mailles et rangs.'
        );
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
