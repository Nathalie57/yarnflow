<?php

declare(strict_types=1);

namespace App\Services;

/** Consignes déterministes injectées dans le contexte de Flow. */
class FlowContextGuidance
{
    public static function sectionGuidance(array $section): string
    {
        if (($section['progression_type'] ?? 'simple') === 'composite') {
            return 'Section composite : le compteur indique seulement une progression enregistrée. Il ne permet pas de déduire avec certitude la sous-étape exacte ; vérifier les instructions et demander un repère à l’utilisatrice si nécessaire.';
        }

        return 'Section simple : le compteur BDD est le repère prioritaire pour situer la progression.';
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
