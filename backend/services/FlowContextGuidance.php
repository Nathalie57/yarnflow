<?php

declare(strict_types=1);

namespace App\Services;

/** Consignes déterministes injectées dans le contexte de Flow. */
class FlowContextGuidance
{
    public static function progressSummary(array $section): string
    {
        $current = (float)($section['current_row'] ?? 0);
        $total = isset($section['total_rows']) ? (float)$section['total_rows'] : null;
        $unit = ($section['counter_unit'] ?? 'rows') === 'cm' ? 'cm' : 'rows';
        $progressionType = $section['progression_type'] ?? 'simple';

        $format = static function (float $value) use ($unit): string {
            return $unit === 'cm'
                ? number_format($value, 1, ',', '')
                : (string)(int)floor($value);
        };

        if ($unit === 'cm') {
            return $total !== null
                ? $format($current) . '/' . $format($total) . ' cm'
                : $format($current) . ' cm';
        }

        if ($progressionType === 'composite') {
            return $format($current) . ' rangs enregistrés';
        }

        $completed = !empty($section['is_completed']) || ($total !== null && $current >= $total);
        $completedLabel = $current === 0.0
            ? 'aucun rang terminé'
            : $format($current) . ' rang' . ($current > 1 ? 's' : '') . ' terminé' . ($current > 1 ? 's' : '');
        $totalLabel = $total !== null ? ' sur ' . $format($total) : '';

        if ($completed) {
            return $completedLabel . $totalLabel . ' — section terminée';
        }

        return $completedLabel . $totalLabel . ' — prochain rang à effectuer : ' . $format($current + 1);
    }

    public static function sectionGuidance(array $section): string
    {
        if (($section['progression_type'] ?? 'simple') === 'composite') {
            return 'Section composite : le compteur indique seulement une progression enregistrée. Il ne permet pas de déduire avec certitude la sous-étape exacte ; vérifier les instructions et demander un repère à l’utilisatrice si nécessaire.';
        }

        return 'Section simple : le compteur BDD est le repère prioritaire pour situer la progression. Sa valeur indique le nombre de rangs déjà terminés, jamais le rang en cours ; utiliser le prochain rang explicitement indiqué dans la progression.';
    }

    public static function sizeGuidance(?string $patternSize, bool $hasMultiSizeData): string
    {
        if ($patternSize !== null && trim($patternSize) !== '') {
            return "Taille choisie pour ce patron : {$patternSize}. Pour toute série multi-tailles, utiliser uniquement la valeur dont la correspondance avec cette taille est explicite ; ne jamais choisir par position supposée.";
        }

        if ($hasMultiSizeData) {
            return 'Aucune taille n’a été choisie. Les séries multi-tailles sont des données connues mais non résolues, pas des données manquantes. Ne jamais sélectionner la première valeur : demander la taille lorsqu’elle est nécessaire à une réponse précise.';
        }

        return '';
    }
}
