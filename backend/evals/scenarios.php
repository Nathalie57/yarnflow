<?php

declare(strict_types=1);

// Données synthétiques : aucun projet ni compte réel n’est lu.
$scarf = 'Cast on 6 stitches. Increase 1 stitch on every 8th row. At the end of row 144, expect 24 stitches. The next scheduled increase is on row 152.';
$neck = 'Cast on 119 stitches. Purl 1 row from the wrong side. Work rib with BANDS WITH I-CORD — read explanation above. Continue until the neck measures 4 cm.';
$definition = "BANDS WITH I-CORD:\nAt the beginning of the row, slip 3 stitches purlwise with yarn behind, then knit 4. At the end, knit 4 then slip 3 purlwise with yarn behind.";
$make = static function (string $id, string $title, string $instructions, array $turns, array $criteria, array $extra = []): array {
    return array_replace_recursive([
        'id' => $id, 'title' => $title, 'version' => 1, 'lang' => 'fr', 'plan' => 'pro',
        'section' => ['name' => 'Augmentations', 'description' => $instructions,
            'current_row' => 144, 'total_rows' => 200, 'counter_unit' => 'rows',
            'pattern_start_row' => 1, 'progression_type' => 'simple'],
        'pattern' => ['sections' => [['name' => 'Augmentations', 'description' => $instructions]]],
        'history' => [], 'turns' => $turns, 'criteria' => $criteria,
        'technical_details' => [],
    ], $extra);
};
$cm = ['section' => ['name' => 'Neck', 'current_row' => 0, 'total_rows' => 4, 'counter_unit' => 'cm'],
    'pattern' => ['sections' => [['name' => 'Neck', 'description' => $neck]]]];

return [
    $make('144-25-24', 'Rang confirmé et mailles discordantes', $scarf,
        ['J’ai terminé le rang 144 et je compte 25 mailles. Quand est prévue la prochaine augmentation ?'],
        ['Conserver le rang réel confirmé 144 et les 25 mailles constatées.', 'Signaler 24 mailles attendues, donc un écart de 1.', 'Ne pas déduire un rang réel 152 ; citer 152 comme prochaine augmentation théorique est correct.', 'Ne pas modifier le compteur ni proposer une compensation immédiate.']),
    $make('explicit-correction', 'Correction après une déduction erronée', $scarf,
        ['Non, je confirme avoir terminé le rang 144 et avoir 25 mailles. Les augmentations ont peut-être été irrégulières.'],
        ['La correction explicite prime sur la déduction précédente.', 'Ne pas réaffirmer rang 152 ni prochaine augmentation au rang 160.'],
        ['history' => [['role' => 'user', 'content' => 'J’ai 25 mailles.'], ['role' => 'assistant', 'content' => 'Avec 25 mailles, vous avez terminé le rang 152. La prochaine augmentation sera au rang 160.']]]),
    $make('cm-progress', 'Compteur de longueur', $neck, ['Explique-moi ce rang.', 'Et maintenant ?'],
        ['Utiliser Neck et 0 cm sur 4 cm comme progression enregistrée.', 'Ne pas inventer de rang réel depuis la mesure ; les rangs décrits dans le patron peuvent être expliqués.', 'Demander seulement la sous-étape manquante, sans boucle de clarification générique.'], $cm),
    $make('specific-definition', 'Variante spécifique du patron', $neck, ['Explique les bandes i-cord de cette section.'],
        ['Suivre la définition du patron : 3 mailles glissées, fil derrière, et 4 mailles endroit.', 'Ne pas remplacer par une variante habituelle.'], array_replace_recursive($cm, ['pattern' => ['pattern_notes' => $definition]])),
    $make('missing-definition', 'Définition non fournie', $neck, ['Comment faire exactement ces bandes i-cord ?'],
        ['Signaler que la définition spécifique est absente.', 'Toute explication générale est explicitement présentée comme générale.', 'Ne pas attribuer des gestes exacts inventés au patron.'], $cm),
    $make('spanish', 'Préférence de langue sur plusieurs tours', $scarf,
        ['I want to speak in español', 'Explique-moi cette augmentation.'],
        ['Accepter le changement de langue sans refus hors domaine.', 'Répondre en espagnol au premier tour et au suivant malgré la question française.']),
    $make('yarn-substitution', 'Fil de remplacement sans échantillon', 'Use the original fine yarn held double. Gauge: 20 stitches and 28 rows per 10 cm.',
        ['Mon fil de remplacement est conseillé pour des aiguilles 4. Dois-je forcément le doubler ?'],
        ['Ne pas imposer le fil double pour le remplacement.', 'Distinguer le fil original du fil utilisé.', 'Demander les informations utiles manquantes, notamment l’échantillon.']),
    $make('known-information', 'Ne pas redemander les faits disponibles', $scarf,
        ['Je confirme : rang 144 terminé, 25 mailles comptées et dernière augmentation au rang 144.', 'Que sais-tu déjà de ma situation ?'],
        ['Réutiliser les trois faits confirmés sans les redemander.', 'Ne pas transformer la dernière augmentation connue en historique complet.']),
    $make('unknown-origin', 'Écart d’origine inconnue', $scarf,
        ['J’ai terminé 144 rangs et j’ai 25 mailles. Je ne sais pas où l’écart est apparu. Que faire ?'],
        ['Constater l’écart sans affirmer où ni comment il est apparu.', 'Ne pas conclure à un rang mal compté ou à une augmentation localisée.', 'Poser une question de diagnostic utile, sans correction compensatoire prématurée.']),
    $make('late-definition', 'Définition après les 30 000 premiers caractères', $neck,
        ['Explique les bandes i-cord du col.'],
        ['Retrouver la variante spécifique après sélection du contexte.', 'Respecter 3 mailles glissées avec fil derrière, pas une variante générale.'],
        array_replace_recursive($cm, ['pattern' => ['sections' => [
            ['name' => 'Neck', 'description' => $neck],
            ['name' => 'Body', 'description' => str_repeat("Work the body in stocking stitch.\n", 1100)],
        ], 'pattern_notes' => $definition]])),
    $make('yarn-known-gauge', 'Substitution avec échantillon déjà fourni', 'Original yarn held double. Target gauge after washing: 20 stitches and 28 rows per 10 cm.',
        ['Mon fil de remplacement fait 100 m pour 50 g. Avec un seul brin et mes aiguilles 4, mon échantillon lavé mesure 20 mailles et 28 rangs sur 10 cm. Dois-je doubler le fil ?'],
        ['Utiliser l’échantillon fourni qui correspond à la cible.', 'Ne pas redemander l’échantillon ni imposer le fil double.', 'Ne pas garantir toutes les propriétés du tissu à partir du seul échantillon.']),
];
