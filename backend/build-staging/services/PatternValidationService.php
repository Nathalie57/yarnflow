<?php
/**
 * @file PatternValidationService.php
 * @brief Service de validation approfondie des patrons générés par IA
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création du service de validation stricte
 *
 * @history
 *   2025-11-14 [AI:Claude] Création avec validation maths, dimensions, vocabulaire
 */

declare(strict_types=1);

namespace App\Services;

/**
 * [AI:Claude] Service de validation stricte des patrons générés par IA
 * Vérifie la cohérence mathématique, les dimensions réalistes et le vocabulaire
 */
class PatternValidationService
{
    // [AI:Claude] Vocabulaire technique valide en français
    private array $validAbbreviations = [
        // Mailles de base
        'ml' => 'maille en l\'air',
        'ms' => 'maille serrée',
        'mc' => 'maille coulée',
        'bs' => 'bride simple',
        'db' => 'double bride',
        'tb' => 'triple bride',
        'demi-br' => 'demi-bride',
        'br' => 'bride',

        // Techniques
        'aug' => 'augmentation',
        'dim' => 'diminution',
        'ch' => 'chaînette',
        'rg' => 'rang',
        'tour' => 'tour',
        'cercle magique' => 'cercle magique',
        'anneau magique' => 'anneau magique'
    ];

    // [AI:Claude] Dimensions réalistes par type (en cm)
    private array $realisticDimensions = [
        TYPE_HAT => [
            'adulte' => ['circumference' => [50, 60], 'height' => [18, 25]],
            'enfant' => ['circumference' => [45, 52], 'height' => [15, 20]],
            'bebe' => ['circumference' => [35, 45], 'height' => [12, 16]]
        ],
        TYPE_SCARF => [
            'adulte' => ['width' => [15, 30], 'length' => [120, 200]],
            'enfant' => ['width' => [12, 20], 'length' => [80, 120]]
        ],
        TYPE_AMIGURUMI => [
            '10cm' => ['starting_stitches' => [6, 12], 'max_rounds' => [20, 40]],
            '20cm' => ['starting_stitches' => [12, 18], 'max_rounds' => [30, 60]],
            '30cm' => ['starting_stitches' => [18, 24], 'max_rounds' => [40, 80]]
        ],
        TYPE_BAG => [
            'small' => ['width' => [20, 30], 'height' => [20, 30]],
            'medium' => ['width' => [30, 40], 'height' => [30, 45]],
            'large' => ['width' => [40, 60], 'height' => [40, 60]]
        ]
    ];

    /**
     * [AI:Claude] Valider un patron complet avec tous les checks
     *
     * @param array $pattern Patron à valider
     * @param array $params Paramètres de génération (type, level, size)
     * @return array ['valid' => bool, 'errors' => array, 'warnings' => array]
     */
    public function validatePattern(array $pattern, array $params): array
    {
        $errors = [];
        $warnings = [];

        // [AI:Claude] 1. Validation basique (structure)
        $structureErrors = $this->validateStructure($pattern);
        if (!empty($structureErrors)) {
            return [
                'valid' => false,
                'errors' => $structureErrors,
                'warnings' => []
            ];
        }

        // [AI:Claude] 2. Validation du vocabulaire
        $vocabErrors = $this->validateVocabulary($pattern);
        $errors = array_merge($errors, $vocabErrors);

        // [AI:Claude] 3. Validation mathématique (cohérence des mailles)
        $mathResult = $this->validateMathematicalConsistency($pattern);
        $errors = array_merge($errors, $mathResult['errors']);
        $warnings = array_merge($warnings, $mathResult['warnings']);

        // [AI:Claude] 4. Validation des dimensions
        if (isset($params['type']) && isset($params['size'])) {
            $dimensionErrors = $this->validateDimensions($pattern, $params['type'], $params['size']);
            $warnings = array_merge($warnings, $dimensionErrors);
        }

        // [AI:Claude] 5. Validation du niveau de difficulté
        if (isset($params['level'])) {
            $levelWarnings = $this->validateDifficultyLevel($pattern, $params['level']);
            $warnings = array_merge($warnings, $levelWarnings);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings
        ];
    }

    /**
     * [AI:Claude] Valider la structure de base du patron
     *
     * @param array $pattern Patron à valider
     * @return array Erreurs trouvées
     */
    private function validateStructure(array $pattern): array
    {
        $errors = [];

        // [AI:Claude] Champs obligatoires
        $requiredFields = ['title', 'instructions', 'level', 'abbreviations'];
        foreach ($requiredFields as $field) {
            if (!isset($pattern[$field]) || empty($pattern[$field])) {
                $errors[] = "Champ obligatoire manquant : {$field}";
            }
        }

        // [AI:Claude] Longueur minimale des instructions
        if (isset($pattern['instructions']) && strlen($pattern['instructions']) < 100) {
            $errors[] = "Instructions trop courtes (min 100 caractères)";
        }

        // [AI:Claude] Vérifier que les abréviations sont un tableau
        if (isset($pattern['abbreviations']) && !is_array($pattern['abbreviations'])) {
            $errors[] = "Les abréviations doivent être un tableau";
        }

        // [AI:Claude] Vérifier que le niveau est valide
        if (isset($pattern['level'])) {
            $validLevels = [LEVEL_BEGINNER, LEVEL_INTERMEDIATE, LEVEL_ADVANCED];
            if (!in_array($pattern['level'], $validLevels)) {
                $errors[] = "Niveau invalide : {$pattern['level']}";
            }
        }

        return $errors;
    }

    /**
     * [AI:Claude] Valider le vocabulaire technique utilisé
     *
     * @param array $pattern Patron à valider
     * @return array Erreurs trouvées
     */
    private function validateVocabulary(array $pattern): array
    {
        $errors = [];

        if (!isset($pattern['abbreviations']) || !is_array($pattern['abbreviations'])) {
            return $errors;
        }

        // [AI:Claude] Vérifier que les abréviations de base sont présentes
        $basicAbbreviations = ['ml', 'ms', 'mc'];
        $hasBasic = false;
        foreach ($basicAbbreviations as $abbrev) {
            if (isset($pattern['abbreviations'][$abbrev])) {
                $hasBasic = true;
                break;
            }
        }

        if (!$hasBasic) {
            $errors[] = "Abréviations de base manquantes (ml, ms ou mc)";
        }

        // [AI:Claude] Vérifier que les abréviations utilisées sont valides
        foreach (array_keys($pattern['abbreviations']) as $abbrev) {
            if (!isset($this->validAbbreviations[$abbrev])) {
                $errors[] = "Abréviation inconnue : {$abbrev}";
            }
        }

        return $errors;
    }

    /**
     * [AI:Claude] Valider la cohérence mathématique du patron
     * Vérifie que les augmentations/diminutions sont cohérentes
     *
     * @param array $pattern Patron à valider
     * @return array ['errors' => array, 'warnings' => array]
     */
    private function validateMathematicalConsistency(array $pattern): array
    {
        $errors = [];
        $warnings = [];

        if (!isset($pattern['instructions'])) {
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        $instructions = $pattern['instructions'];

        // [AI:Claude] Extraire les tours/rangs avec nombre de mailles
        // Format attendu : "Tour 1 : ... (6m)" ou "Rang 5 : ... [24 mailles]"
        preg_match_all('/(tour|rang)\s*(\d+)\s*:.*?\(?(\d+)\s*m/i', $instructions, $matches, PREG_SET_ORDER);

        if (empty($matches)) {
            $warnings[] = "Aucun comptage de mailles détecté dans les instructions";
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        // [AI:Claude] Vérifier la progression des mailles
        $previousStitches = null;
        $previousRound = null;

        foreach ($matches as $match) {
            $roundNumber = (int)$match[2];
            $stitchCount = (int)$match[3];

            if ($previousStitches !== null) {
                // [AI:Claude] Vérifier qu'il n'y a pas de saut brutal
                $ratio = $stitchCount / $previousStitches;

                // Une augmentation de plus de 3x ou diminution de plus de 50% est suspecte
                if ($ratio > 3.0) {
                    $warnings[] = "Tour {$roundNumber} : Augmentation brutale de mailles ({$previousStitches} → {$stitchCount})";
                } elseif ($ratio < 0.5) {
                    $warnings[] = "Tour {$roundNumber} : Diminution brutale de mailles ({$previousStitches} → {$stitchCount})";
                }

                // [AI:Claude] Pour les amigurumis, vérifier la progression typique
                // Tours d'augmentation : ×2, ×1.5, ×1.33, ×1.25, etc.
                if ($roundNumber <= 6) {
                    $expectedRatios = [2.0, 1.5, 1.33, 1.25, 1.2]; // Approximatif
                    $expectedRatio = $expectedRatios[$roundNumber - 2] ?? 1.0;

                    if ($ratio > 1 && abs($ratio - $expectedRatio) > 0.3) {
                        $warnings[] = "Tour {$roundNumber} : Ratio d'augmentation inhabituel ({$ratio} au lieu de ~{$expectedRatio})";
                    }
                }
            }

            $previousStitches = $stitchCount;
            $previousRound = $roundNumber;
        }

        // [AI:Claude] Vérifier que le premier tour est réaliste (6-18 mailles généralement)
        if (!empty($matches)) {
            $firstStitches = (int)$matches[0][3];
            if ($firstStitches < 4 || $firstStitches > 24) {
                $warnings[] = "Premier tour inhabituel : {$firstStitches} mailles (attendu : 6-12 pour amigurumi)";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * [AI:Claude] Valider les dimensions par rapport au type
     *
     * @param array $pattern Patron à valider
     * @param string $type Type de projet
     * @param string $size Taille demandée
     * @return array Warnings trouvés
     */
    private function validateDimensions(array $pattern, string $type, string $size): array
    {
        $warnings = [];

        // [AI:Claude] Extraire les dimensions mentionnées
        $instructions = $pattern['instructions'] ?? '';

        // Chercher des mentions de dimensions (en cm)
        preg_match_all('/(\d+)\s*(cm|centimètre)/i', $instructions, $matches);

        if (empty($matches[1])) {
            $warnings[] = "Aucune dimension en cm trouvée dans les instructions";
            return $warnings;
        }

        $dimensions = array_map('intval', $matches[1]);

        // [AI:Claude] Vérifier selon le type
        if (!isset($this->realisticDimensions[$type][$size])) {
            return $warnings;
        }

        $expected = $this->realisticDimensions[$type][$size];

        // Pour les bonnets : vérifier la circonférence
        if ($type === TYPE_HAT && isset($expected['circumference'])) {
            $circumferences = array_filter($dimensions, fn($d) => $d >= 40 && $d <= 70);
            if (!empty($circumferences)) {
                $circ = reset($circumferences);
                [$min, $max] = $expected['circumference'];
                if ($circ < $min || $circ > $max) {
                    $warnings[] = "Circonférence inhabituelle pour bonnet {$size} : {$circ}cm (attendu : {$min}-{$max}cm)";
                }
            }
        }

        return $warnings;
    }

    /**
     * [AI:Claude] Valider que la complexité correspond au niveau
     *
     * @param array $pattern Patron à valider
     * @param string $level Niveau demandé
     * @return array Warnings trouvés
     */
    private function validateDifficultyLevel(array $pattern, string $level): array
    {
        $warnings = [];
        $instructions = $pattern['instructions'] ?? '';

        // [AI:Claude] Compter les techniques avancées
        $advancedTechniques = [
            'double bride', 'triple bride', 'popcorn', 'picot',
            'point fantaisie', 'points croisés', 'cercle magique'
        ];

        $advancedCount = 0;
        foreach ($advancedTechniques as $technique) {
            if (stripos($instructions, $technique) !== false) {
                $advancedCount++;
            }
        }

        // [AI:Claude] Niveau débutant ne devrait pas avoir de techniques avancées
        if ($level === LEVEL_BEGINNER && $advancedCount > 0) {
            $warnings[] = "Patron débutant mais contient des techniques avancées";
        }

        // [AI:Claude] Niveau avancé devrait avoir au moins une technique avancée
        if ($level === LEVEL_ADVANCED && $advancedCount === 0) {
            $warnings[] = "Patron avancé mais pas de techniques avancées détectées";
        }

        return $warnings;
    }

    /**
     * [AI:Claude] Obtenir un score de qualité global (0-100)
     *
     * @param array $validationResult Résultat de validatePattern()
     * @return int Score de 0 à 100
     */
    public function calculateQualityScore(array $validationResult): int
    {
        $score = 100;

        // [AI:Claude] Pénalités par erreur
        $score -= count($validationResult['errors']) * 20;

        // [AI:Claude] Pénalités légères par warning
        $score -= count($validationResult['warnings']) * 5;

        return max(0, min(100, $score));
    }
}
