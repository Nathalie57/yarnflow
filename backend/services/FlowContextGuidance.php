<?php

declare(strict_types=1);

namespace App\Services;

/** Consignes déterministes injectées dans le contexte de Flow. */
class FlowContextGuidance
{
    public static function reliabilityGuidance(): string
    {
        return <<<'GUIDANCE'
SOURCES DISTINCTES : PATTERN / APP STATE / USER REALITY.
PATTERN décrit ce qui devrait être vrai si les instructions ont été suivies ; APP STATE décrit uniquement ce qui est enregistré dans YarnFlow ; USER REALITY décrit ce que l’utilisatrice constate ou vient de faire. Conserve ces trois informations séparées en cas de contradiction.
Une déclaration explicite récente sur l’ouvrage ne doit jamais être écrasée par un compteur enregistré, une déduction mathématique ou une ancienne réponse de l’assistant. Ne transforme jamais une hypothèse du patron en fait réel.
Un nombre de mailles peut révéler un écart, mais ne permet pas de déduire le rang actuel ni l’historique réel des augmentations/diminutions. Même un compte conforme ne prouve pas que les opérations ont été régulières.
Explique brièvement l’écart puis pose une seule question minimale nécessaire au diagnostic, sans redemander une information confirmée. Ne propose ni diminution compensatoire, ni augmentation anticipée ou sautée, ni modification du compteur tant que le diagnostic et les conséquences ne sont pas suffisamment établis. Tu peux indiquer la prochaine opération prévue par le patron, sans la déplacer pour compenser l’écart.
EXEMPLE : APP STATE = rang 144 ; USER REALITY = rang 144 terminé et 25 mailles ; PATTERN = 6 mailles de départ et une augmentation tous les 8 rangs, soit 24 mailles attendues au rang 144. Réponse : « Tu as terminé le rang 144 et tu comptes 25 mailles. Le patron en prévoit 24 : tu as une maille supplémentaire. Cela ne permet pas de conclure que tu es au rang 152. La prochaine augmentation prévue par le patron est au rang 152. Sais-tu à quel rang tu as fait ta dernière augmentation ? » Ne conclus pas « tu as terminé le rang 152 » ou « prochaine augmentation au rang 160 » et ne conseille pas de modifier la progression.
La validation structurelle d’une traduction ne garantit pas sa justesse technique. En cas d’ambiguïté du patron ou de son extraction, demande un repère plutôt que d’inventer une correspondance.
GUIDANCE;
    }

    public static function progressSummary(array $section): string
    {
        $current = (float)($section['current_row'] ?? 0);
        $total = isset($section['total_rows']) ? (float)$section['total_rows'] : null;
        $unit = ($section['counter_unit'] ?? 'rows') === 'cm' ? 'cm' : 'rows';
        $progressionType = $section['progression_type'] ?? 'simple';

        if ($progressionType === 'action') {
            return !empty($section['is_completed'])
                ? 'action ponctuelle terminée'
                : 'action ponctuelle à réaliser puis à marquer comme terminée';
        }

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
        if (($section['progression_type'] ?? 'simple') === 'action') {
            return 'Section action : aucune progression en rangs ou en mesure ne doit être déduite. Présenter l’instruction à réaliser et considérer la section terminée uniquement après validation explicite de l’utilisatrice.';
        }
        if (($section['progression_type'] ?? 'simple') === 'composite') {
            return 'Section composite : le compteur indique seulement une progression enregistrée. Il ne permet pas de déduire avec certitude la sous-étape exacte ; vérifier les instructions et demander un repère à l’utilisatrice si nécessaire.';
        }

        return 'Section simple : le compteur BDD est un repère de progression enregistrée, pas une preuve de la réalité de l’ouvrage ; respecter les corrections explicites récentes de l’utilisatrice. Sa valeur indique le nombre de rangs enregistrés comme terminés, jamais le rang en cours ; le prochain rang indiqué est celui prévu selon ce compteur.';
    }

    public static function secondaryCounterSummary(array $counter): string
    {
        $label = trim((string)($counter['label'] ?? 'Compteur'));
        $count = (int)($counter['count'] ?? 0);
        $target = isset($counter['target']) && $counter['target'] !== null
            ? (int)$counter['target']
            : null;
        $unit = in_array(($counter['unit'] ?? 'count'), ['count', 'rows', 'rounds', 'cm', 'mm', 'in'], true)
            ? $counter['unit']
            : 'count';
        $role = in_array(($counter['tracking_role'] ?? 'informational'), ['required_cycle', 'required_parallel', 'informational', 'unknown'], true)
            ? $counter['tracking_role']
            : 'unknown';
        $cycleLength = isset($counter['cycle_length']) && (int)$counter['cycle_length'] > 0
            ? (int)$counter['cycle_length']
            : null;

        $progress = $target !== null ? "{$count}/{$target}" : (string)$count;
        $parts = ["Compteur secondaire « {$label} » : {$progress}", "unité sémantique={$unit}", "tracking_role={$role}"];
        if ($cycleLength !== null) {
            $parts[] = "cycle_length={$cycleLength}";
        }

        $summary = implode(' ; ', $parts) . '.';
        if ($role === 'unknown') {
            $summary .= ' Son rôle dans la fin de la section est inconnu : ne pas en déduire la durée, le nombre total de rangs/tours ni la complétion de la section.';
        } elseif ($role === 'informational') {
            $summary .= ' Ce compteur est informatif et ne détermine pas la complétion de la section.';
        }

        return $summary;
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
