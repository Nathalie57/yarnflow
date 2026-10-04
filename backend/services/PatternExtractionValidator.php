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
    private const REVIEWABLE_ERRORS = [
        'section_empty', 'section_instructions_missing', 'section_target_invalid',
        'symmetric_piece_missing', 'structural_ambiguity_unresolved',
    ];
    private const DIAGRAM_REFERENCE = '/\b(?:suiv(?:re|ant)|selon|voir|reportez-vous\s+(?:à|au)|follow(?:ing)?|see|refer\s+to)\s+(?:la|le|au|the|a|un|une)?\s*(?:grille|diagramme|diagram|chart|graphique)\b/iu';
    private const MARKER_REFERENCE = '/\b(?:work|complete|proceed)\s+from\s+(\*{2,})(?:\s+to\s+(\*{2,}))?\s+as\s+given\s+for\s+([^\r\n.]+)/iu';

    public static function validate(array $data, ?string $patternSize = null, ?string $immutableReferenceText = null): array
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
            $normalizedDescription = preg_replace(
                '/(\d+(?:[.,]\d+)?)\s*(cm|mm|in(?:ches?)?|pouces?)\s+\2\b/iu',
                '$1 $2',
                $description
            );
            if (is_string($normalizedDescription) && $normalizedDescription !== $description) {
                $description = $normalizedDescription;
                $section['description'] = $description;
                $autoCorrected[] = self::issue('duplicate_measurement_unit_removed', 'Une unité de mesure répétée a été supprimée.', [
                    'section_index' => $index, 'section_name' => $name,
                ]);
            }
            if ($name === '' && $description === '') {
                $errors[] = self::issue('section_empty', 'Une section extraite est entièrement vide.', ['section_index' => $index]);
            } elseif ($description === '') {
                $errors[] = self::issue('section_instructions_missing', 'Une section ne contient aucune instruction.', ['section_index' => $index, 'section_name' => $name]);
            }

            $progressionType = $section['progression_type'] ?? 'simple';
            if ($progressionType === 'simple' && ($section['target'] ?? null) === null
                && self::looksLikeManualAction($name, $description)) {
                $progressionType = 'action';
                $section['progression_type'] = 'action';
                $autoCorrected[] = self::issue('manual_action_detected',
                    'Une étape ponctuelle sans progression numérique a été classée comme action.',
                    ['section_index' => $index, 'section_name' => $name]);
            }
            if (!in_array($progressionType, ['simple', 'composite', 'action'], true)) {
                $errors[] = self::issue('progression_type_invalid', 'Le type de progression d’une section est invalide.', ['section_index' => $index]);
                $section['progression_type'] = 'simple';
                $progressionType = 'simple';
            }

            if (in_array($progressionType, ['composite', 'action'], true) && ($section['target'] ?? null) !== null) {
                $autoCorrected[] = self::issue(
                    $progressionType === 'action' ? 'action_target_cleared' : 'composite_target_cleared',
                    'La cible numérique incompatible avec cette section a été supprimée.',
                    ['section_index' => $index, 'section_name' => $name]
                );
                $section['target'] = null;
            }
            if ($progressionType === 'action') {
                $section['unit'] = null;
                $section['secondary_counter'] = null;
            }

            $target = $section['target'] ?? null;
            if ($target !== null && (!is_numeric($target) || (float)$target <= 0 || (float)$target >= 100000)) {
                $errors[] = self::issue('section_target_invalid', 'La cible numérique d’une section est invalide et sa valeur correcte ne peut pas être déterminée.', ['section_index' => $index, 'section_name' => $name]);
                $section['target'] = null;
            }

            $counter = $section['secondary_counter'] ?? null;
            if (is_array($counter)) {
                $role = $counter['tracking_role'] ?? 'unknown';
                if (!in_array($role, ['required_cycle', 'required_parallel', 'informational', 'unknown'], true)) {
                    $role = 'unknown';
                }
                $counter['tracking_role'] = $role;
                $counterUnit = self::normalizeCounterUnit($counter['unit'] ?? null);
                if (in_array($counterUnit, ['rows', 'rounds'], true)
                    && self::secondaryCounterCountsOperations($counter)) {
                    $autoCorrected[] = self::issue(
                        'secondary_counter_operation_unit_normalized',
                        'L’unité du compteur d’opérations a été normalisée en occurrences.',
                        ['section_index' => $index, 'section_name' => $name, 'previous_unit' => $counterUnit]
                    );
                    $counterUnit = 'count';
                }
                $counter['unit'] = $counterUnit;
                if (self::secondaryCounterUsesPhysicalMeasurement($section, $counter)) {
                    $role = 'informational';
                    $counter = null;
                    $autoCorrected[] = self::issue('physical_measurement_counter_removed',
                        'Le faux compteur à clics associé à une mesure physique a été supprimé.',
                        ['section_index' => $index, 'section_name' => $name, 'unit' => $counterUnit]);
                }
                if ($role === 'required_cycle') {
                    $cycleLength = $counter['cycle_length'] ?? null;
                    $passes = $counter['target'] ?? null;
                    $expectedTotal = is_numeric($cycleLength) && is_numeric($passes)
                        ? (int)$cycleLength * (int)$passes
                        : null;
                    if ((int)$cycleLength <= 0 || (int)$passes <= 0 || $expectedTotal <= 0
                        || !is_numeric($section['target'] ?? null)
                        || abs((float)$section['target'] - $expectedTotal) > 0.0001) {
                        $counter['tracking_role'] = 'unknown';
                        $section['progression_type'] = 'composite';
                        $section['target'] = null;
                        $unverifiable[] = self::issue('repeat_cycle_ambiguous',
                            'Le cycle répété ne peut pas être suivi automatiquement sans estimation.',
                            ['section_index' => $index, 'section_name' => $name]);
                    }
                } elseif ($role === 'unknown') {
                    $section['progression_type'] = 'composite';
                    $section['target'] = null;
                }
                $section['secondary_counter'] = $counter;
            }

            $patternStart = $section['pattern_start_row'] ?? null;
            $section['pattern_start_row'] = is_numeric($patternStart) && (int)$patternStart > 0
                ? (int)$patternStart
                : null;
        }
        unset($section);
        $data['sections'] = $sections;

        $measurementIssues = self::sectionMeasurementIssues($sections);
        $unverifiable = array_merge($unverifiable, $measurementIssues);

        self::checkSectionReferences($sections, $warnings);

        $referenceText = self::referenceText($data);
        if (preg_match(self::DIAGRAM_REFERENCE, $referenceText) && empty($data['contains_diagram'])) {
            $autoCorrected[] = self::issue('diagram_flag_enabled', 'Le signalement du diagramme a été activé car les instructions y font explicitement référence.');
            $data['contains_diagram'] = true;
        }

        self::secureDiagramMetadata($data, $autoCorrected);
        self::secureGauge($data, $autoCorrected);

        self::validateSelectedSize($data, $patternSize, $errors, $unverifiable);
        self::checkMissingSymmetricPieces($data, $errors, $unverifiable, $immutableReferenceText);
        self::classifyUnresolvedData($data, $errors, $unverifiable);

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
            'requires_section_review' => !empty($measurementIssues),
            'requires_manual_review' => !empty(array_filter(
                $unverifiable,
                fn($issue) => !empty($issue['context']['requires_manual_review'])
            )),
            'errors' => $errors,
            'auto_corrected' => $autoCorrected,
            'warnings' => $warnings,
            'unverifiable' => $unverifiable,
        ];
    }

    /** Revalide les champs éditables en gardant le texte analysé comme contexte immuable. */
    public static function validateEditedPreview(array $sourceData, array $project, array $sections, ?string $patternSize = null): array
    {
        $candidate = $sourceData;
        foreach (['title', 'craft_type', 'category', 'description', 'yarn', 'needles', 'gauge', 'pattern_notes'] as $field) {
            if (array_key_exists($field, $project)) $candidate[$field] = $project[$field];
        }
        $candidate['sections'] = $sections;

        $originalErrors = is_array($sourceData['validation_issues']['errors'] ?? null)
            ? $sourceData['validation_issues']['errors']
            : self::validate($sourceData, $patternSize)['errors'];
        $result = self::validate($candidate, $patternSize, self::referenceText($sourceData));

        // Une section entièrement vide peut être montrée dans le formulaire afin d'être
        // corrigée. À la confirmation, il faut toutefois au moins une section exploitable :
        // le filtre d'insertion ne doit jamais transformer une validation en projet vide.
        $usableSections = array_filter($result['data']['sections'] ?? [], static function ($section): bool {
            return is_array($section)
                && (trim((string)($section['name'] ?? '')) !== ''
                    || trim((string)($section['description'] ?? '')) !== '');
        });
        if ($usableSections === []) {
            self::appendUniqueIssue(
                $result['errors'],
                self::issue('sections_missing', 'Aucune section exploitable n’a été extraite.')
            );
        }

        // Conserver la trace des points détectés sur l'analyse originale. Ils seront soit
        // bloquants, soit présentés comme points à vérifier, mais jamais silencieusement perdus.
        foreach ($originalErrors as $issue) self::appendUniqueIssue($result['errors'], $issue);

        $result['errors'] = array_values($result['errors']);
        $result['has_certain_errors'] = !empty($result['errors']);
        $result['has_unresolved_errors'] = !empty($result['errors']);
        $result['data']['validation_issues']['errors'] = $result['errors'];
        $result['review_issues'] = array_values(array_filter(
            $result['errors'], fn($issue) => self::isReviewableError((string)($issue['code'] ?? ''))
        ));
        $result['blocking_errors'] = array_values(array_filter(
            $result['errors'], fn($issue) => !self::isReviewableError((string)($issue['code'] ?? ''))
        ));
        return $result;
    }

    public static function isReviewableError(string $code): bool
    {
        return in_array($code, self::REVIEWABLE_ERRORS, true);
    }

    /** Conservative checks on explicit instructions, never a cm-to-row conversion. */
    public static function sectionMeasurementIssues(array $sections): array
    {
        $issues = [];
        $action = '(?:work|knit|crochet|tricoter|tricotez|crocheter|crochetez|faire|faites)';
        $number = '(\d+(?:[.,]\d+)?)';
        $rowInstruction = $action . '\s+' . $number . '\s*(?:rows?|rounds?|rangs?|tours?)';
        $cmInstruction = $action . '\s+' . $number . '\s*cm';
        $heightInstruction = '(?:measures?|mesure(?:nt)?|hauteur|height|longueur|length)\s*(?:(?:de|of|is|est)\s*)?' . $number . '\s*cm';
        foreach ($sections as $index => $section) {
            if (!is_array($section) || ($section['progression_type'] ?? 'simple') !== 'simple') continue;
            $description = trim((string)($section['description'] ?? ''));
            $unit = $section['unit'] ?? 'rangs';
            $hasRows = (bool)preg_match('/\b' . $rowInstruction . '\b/iu', $description);
            $hasCm = (bool)preg_match('/\b(?:' . $cmInstruction . '|' . $heightInstruction . ')\b/iu', $description);
            $conflict = !in_array($unit, ['rangs', 'cm'], true)
                || ($hasRows && !$hasCm && $unit === 'cm')
                || ($hasCm && !$hasRows && $unit === 'rangs')
                || ($hasRows && $hasCm);

            // Compare targets only for a single complete instruction. More elaborate
            // patterns can legitimately contain repeats, cumulative heights or gauge.
            $target = $section['target'] ?? null;
            $singleInstruction = $unit === 'cm' ? $cmInstruction : $rowInstruction;
            if ($target !== null && is_numeric($target)
                && ($section['target_measured_from'] ?? 'section') !== 'piece_start'
                && preg_match('/^' . $singleInstruction . '\s*[.!]?$/iu', $description, $match)
                && abs((float)str_replace(',', '.', $match[1]) - (float)$target) > 0.0001) {
                $conflict = true;
            }
            if ($conflict) {
                $issues[] = self::issue('section_measurement_conflict',
                    'Vérifier l’unité et l’objectif de cette section avec les instructions du patron.',
                    ['section_index' => $index, 'section_name' => $section['name'] ?? '', 'unit' => $unit, 'target' => $target]);
            }
        }
        return $issues;
    }

    private static function looksLikeManualAction(string $name, string $description): bool
    {
        $heading = trim($name);
        if (preg_match('/\b(?:divide|division|assembly|assemble|sew(?:ing)?|seam(?:ing)?|blocking|finishing|finishes|diviser|séparer|separation|séparation|assemblage|assembler|coudre|couture|blocage|finitions?)\b/iu', $heading)) {
            return true;
        }

        return (bool)preg_match('/^\s*(?:divide|sew|assemble|block|finish|diviser|séparer|coudre|assembler|bloquer)\b/iu', $description);
    }

    private static function normalizeCounterUnit(mixed $unit): string
    {
        $unit = mb_strtolower(trim((string)$unit));
        return match ($unit) {
            'row', 'rows', 'rang', 'rangs' => 'rows',
            'round', 'rounds', 'tour', 'tours' => 'rounds',
            'cm' => 'cm',
            'mm' => 'mm',
            'in', 'inch', 'inches', 'pouce', 'pouces' => 'in',
            default => 'count',
        };
    }

    private static function secondaryCounterCountsOperations(array $counter): bool
    {
        $label = trim((string)($counter['label'] ?? ''));
        if ($label === '') return false;

        return (bool)preg_match(
            '/\b(?:augmentations?|increases?|diminutions?|decreases?|repeats?|répétitions?|buttonholes?|boutonnières?)\b/iu',
            $label
        );
    }

    private static function secondaryCounterUsesPhysicalMeasurement(array $section, array $counter): bool
    {
        if (in_array($counter['unit'] ?? 'count', ['cm', 'mm', 'in'], true)) {
            return true;
        }
        $target = $counter['target'] ?? null;
        if (!is_numeric($target)) return false;
        $number = preg_quote(rtrim(rtrim(number_format((float)$target, 4, '.', ''), '0'), '.'), '/');
        $text = (string)($section['description'] ?? '');
        $measurementPattern = '/\b' . $number . '\s*(?:cm|mm|in(?:ch(?:es)?)?|pouces?)\b/iu';
        $label = mb_strtolower((string)($counter['label'] ?? ''));
        preg_match_all('/[\p{L}]{3,}/u', $label, $labelWords);
        foreach (preg_split('/[.\r\n]+/u', $text) ?: [] as $sentence) {
            if (!preg_match($measurementPattern, $sentence)) continue;
            $sentenceLower = mb_strtolower($sentence);
            foreach ($labelWords[0] as $word) {
                // Trois lettres suffisent ici pour rapprocher « ribbing » de « rib » ou
                // « côtes » de « côte », sans associer une taille d'aiguille éloignée.
                if (mb_strpos($sentenceLower, mb_substr($word, 0, 3)) !== false) return true;
            }
        }
        return false;
    }

    private static function issue(string $code, string $message, array $context = []): array
    {
        return ['code' => $code, 'message' => $message, 'context' => $context];
    }

    private static function appendUniqueIssue(array &$issues, array $issue): void
    {
        foreach ($issues as $existing) {
            if (($existing['code'] ?? null) === ($issue['code'] ?? null)
                && ($existing['context']['section_index'] ?? null) === ($issue['context']['section_index'] ?? null)) return;
        }
        $issues[] = $issue;
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
        $data['gauge']['size_cm'] = null;
        if (trim((string)($data['gauge']['notes'] ?? '')) === ''
            && preg_match('/[^\r\n.]*\b\d+(?:[.,]\d+)?\s+(?:diamonds?|motifs?|repeats?|rapports?)\b[^\r\n.]*(?:10\s*cm|4\s*(?:in|inches))[^\r\n.]*/iu', $notes, $match)) {
            $data['gauge']['notes'] = trim($match[0]);
        }
        $autoCorrected[] = self::issue(
            'derived_motif_gauge_cleared',
            'Une tension exprimée en motifs ne peut pas être convertie de façon certaine en mailles et rangs.'
        );
    }

    private static function validateSelectedSize(array &$data, ?string $patternSize, array &$errors, array &$unverifiable): void
    {
        $selected = self::normalizeSize($patternSize);
        $available = is_array($data['available_sizes'] ?? null)
            ? array_values(array_filter(array_map(fn($size) => trim((string)$size), $data['available_sizes'])))
            : [];
        if (!$available) {
            foreach (($data['unresolved_data'] ?? []) as $item) {
                if (!is_array($item) || !in_array($item['field'] ?? '', ['size', 'pattern_size'], true)) continue;
                $candidateSizes = array_values(array_filter(array_map(
                    fn($size) => trim((string)$size),
                    is_array($item['source_values'] ?? null) ? $item['source_values'] : []
                )));
                if ($candidateSizes) {
                    $available = $candidateSizes;
                    $data['available_sizes'] = $candidateSizes;
                    break;
                }
            }
        }
        if ($selected === '' || !$available) return;

        foreach ($available as $size) {
            if (self::normalizeSize($size) === $selected) return;
        }

        $message = count($available) === 1
            ? "Ce patron semble uniquement disponible en taille {$available[0]}."
            : 'La taille sélectionnée ne figure pas parmi les tailles disponibles dans ce patron.';
        $errors[] = self::issue('selected_size_not_available', $message, [
            'selected_size' => trim((string)$patternSize),
            'available_sizes' => $available,
        ]);

        if (!isset($data['unresolved_data']) || !is_array($data['unresolved_data'])) $data['unresolved_data'] = [];
        foreach ($data['unresolved_data'] as &$item) {
            if (is_array($item) && in_array($item['field'] ?? '', ['size', 'pattern_size'], true)) {
                $item['reason'] = 'selected_size_not_available';
                $item['selected_size'] = trim((string)$patternSize);
            }
        }
        unset($item);

        $alreadyRecorded = array_filter($data['unresolved_data'], fn($item) => is_array($item)
            && ($item['reason'] ?? '') === 'selected_size_not_available'
            && trim((string)($item['selected_size'] ?? '')) === trim((string)$patternSize));
        if (!$alreadyRecorded) {
            $data['unresolved_data'][] = [
                'type' => 'other', 'field' => 'pattern_size', 'source_values' => $available,
                'reason' => 'selected_size_not_available', 'selected_size' => trim((string)$patternSize),
            ];
        }
    }

    private static function normalizeSize(?string $size): string
    {
        $size = mb_strtolower(trim((string)$size));
        $size = preg_replace('/[\s_–—]+/u', '-', $size);
        return trim((string)$size, '-');
    }

    private static function checkMissingSymmetricPieces(array $data, array &$errors, array &$unverifiable, ?string $immutableReferenceText = null): void
    {
        $text = $immutableReferenceText ?? self::referenceText($data);
        $names = mb_strtolower(implode("\n", array_map(
            fn($section) => is_array($section) ? (string)($section['name'] ?? '') : '',
            is_array($data['sections'] ?? null) ? $data['sections'] : []
        )));
        $pairs = [
            ['/(?:left\s+(?:front|sleeve)|(?:devant|manche)\s+gauch[ea]?)/iu', '/(?:right\s+(?:front|sleeve)|(?:devant|manche)\s+droit[ea]?)/iu'],
        ];
        foreach ($pairs as [$left, $right]) {
            if (!preg_match($left, $text) || !preg_match($right, $text)) continue;
            if (preg_match($left, $names) && preg_match($right, $names)) continue;
            $issue = self::issue('symmetric_piece_missing', 'Le patron mentionne explicitement deux pièces symétriques, mais les deux sections correspondantes ne sont pas présentes.', [
                'requires_manual_review' => true,
            ]);
            $errors[] = $issue;
            $unverifiable[] = $issue;
            return;
        }

        $sectionNames = array_values(array_filter(array_map(
            fn($section) => is_array($section) ? trim((string)($section['name'] ?? '')) : '',
            is_array($data['sections'] ?? null) ? $data['sections'] : []
        )));
        foreach ([
            ['plural' => '/\bsleeves\b|\bmanches\b/iu', 'singular' => '/\bsleeve\b|\bmanche\b/iu', 'plural_name' => '/\bsleeves\b|\bmanches\b/iu'],
        ] as $piece) {
            if (!preg_match($piece['plural'], $text)) continue;
            $matchingNames = array_values(array_filter($sectionNames, fn($name) => preg_match($piece['singular'], $name)));
            if (count($matchingNames) !== 1 || preg_match($piece['plural_name'], $matchingNames[0])) continue;
            $issue = self::issue('symmetric_piece_missing', 'Le patron établit qu’il existe plusieurs pièces, mais l’extraction n’en représente qu’une seule.', [
                'requires_manual_review' => true, 'section_name' => $matchingNames[0],
            ]);
            $errors[] = $issue;
            $unverifiable[] = $issue;
            return;
        }
    }

    private static function classifyUnresolvedData(array $data, array &$errors, array &$unverifiable): void
    {
        foreach (($data['unresolved_data'] ?? []) as $index => $item) {
            if (!is_array($item) || !empty($item['resolved'])) continue;
            if (($item['reason'] ?? '') === 'selected_size_not_available') continue;
            if (($item['type'] ?? '') === 'yarn_quantity') continue;

            $field = mb_strtolower(trim((string)($item['field'] ?? '')));
            $values = array_values(array_filter(array_map(
                fn($value) => is_scalar($value) ? trim((string)$value) : '',
                is_array($item['source_values'] ?? null) ? $item['source_values'] : []
            ), fn($value) => $value !== ''));
            if (count(array_unique(array_map('mb_strtolower', $values))) < 2) continue;

            $combined = implode(' | ', $values);
            $tracksProgress = preg_match('/(?:sections?\[|target|unit|size|repeat|repetition|répétition|count|piece|pièce)/iu', $field)
                && preg_match('/\d|\b(?:cm|mm|inches?|rows?|rounds?|rangs?|tours?|repeats?|répétitions?|pieces?|pièces?)\b/iu', $combined);
            if (!$tracksProgress) continue;

            $issue = self::issue('structural_ambiguity_unresolved', 'Des valeurs contradictoires affectent une donnée utilisée pour le suivi. Aucune valeur ne peut être considérée comme fiable sans vérification.', [
                'requires_manual_review' => true,
                'unresolved_index' => $index,
                'field' => $item['field'] ?? null,
                'source_values' => $values,
            ]);
            $errors[] = $issue;
            $unverifiable[] = $issue;
        }
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
