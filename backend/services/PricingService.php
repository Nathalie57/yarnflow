<?php
/**
 * @file PricingService.php
 * @brief Service de calcul de tarification dynamique
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Services;

/**
 * [AI:Claude] Service de tarification dynamique
 * Calcule le prix d'un patron selon le niveau, le type et la complexité
 */
class PricingService
{
    private float $basePrice;
    private float $advancedMultiplier;
    private float $intermediateMultiplier;

    /**
     * [AI:Claude] Multiplicateurs de prix par type de projet
     */
    private array $typeMultipliers = [
        TYPE_HAT => 1.0,           // Bonnet : prix de base
        TYPE_SCARF => 1.2,         // Écharpe : un peu plus long
        TYPE_BAG => 1.5,           // Sac : plus complexe
        TYPE_AMIGURUMI => 1.8,     // Amigurumi : très détaillé
        TYPE_GARMENT => 2.0        // Vêtement : le plus complexe
    ];

    public function __construct()
    {
        $this->basePrice = (float)($_ENV['PATTERN_BASE_PRICE'] ?? 2.99);
        $this->advancedMultiplier = (float)($_ENV['PATTERN_ADVANCED_MULTIPLIER'] ?? 1.5);
        $this->intermediateMultiplier = 1.2;
    }

    /**
     * [AI:Claude] Calculer le prix d'un patron
     *
     * @param string $type Type de projet (hat, scarf, etc.)
     * @param string $level Niveau (beginner, intermediate, advanced)
     * @param array $options Options additionnelles (size, customization, etc.)
     * @return float Prix calculé en euros
     */
    public function calculatePrice(string $type, string $level, array $options = []): float
    {
        $price = $this->basePrice;

        $typeMultiplier = $this->typeMultipliers[$type] ?? 1.0;
        $price *= $typeMultiplier;

        $levelMultiplier = match($level) {
            LEVEL_BEGINNER => 1.0,
            LEVEL_INTERMEDIATE => $this->intermediateMultiplier,
            LEVEL_ADVANCED => $this->advancedMultiplier,
            default => 1.0
        };
        $price *= $levelMultiplier;

        if (isset($options['custom_size']) && $options['custom_size'])
            $price *= 1.1;

        if (isset($options['detailed_instructions']) && $options['detailed_instructions'])
            $price *= 1.15;

        return round($price, 2);
    }

    /**
     * [AI:Claude] Obtenir le détail de la tarification
     *
     * @param string $type Type de projet
     * @param string $level Niveau
     * @param array $options Options
     * @return array Détails du calcul de prix
     */
    public function getPriceBreakdown(string $type, string $level, array $options = []): array
    {
        $basePrice = $this->basePrice;
        $typeMultiplier = $this->typeMultipliers[$type] ?? 1.0;

        $levelMultiplier = match($level) {
            LEVEL_BEGINNER => 1.0,
            LEVEL_INTERMEDIATE => $this->intermediateMultiplier,
            LEVEL_ADVANCED => $this->advancedMultiplier,
            default => 1.0
        };

        $breakdown = [
            'base_price' => $basePrice,
            'type' => $type,
            'type_multiplier' => $typeMultiplier,
            'level' => $level,
            'level_multiplier' => $levelMultiplier,
            'options' => [],
            'subtotal' => $basePrice * $typeMultiplier * $levelMultiplier
        ];

        $optionsMultiplier = 1.0;

        if (isset($options['custom_size']) && $options['custom_size']) {
            $optionsMultiplier *= 1.1;
            $breakdown['options'][] = [
                'name' => 'Taille personnalisée',
                'multiplier' => 1.1
            ];
        }

        if (isset($options['detailed_instructions']) && $options['detailed_instructions']) {
            $optionsMultiplier *= 1.15;
            $breakdown['options'][] = [
                'name' => 'Instructions détaillées',
                'multiplier' => 1.15
            ];
        }

        $breakdown['options_multiplier'] = $optionsMultiplier;
        $breakdown['total'] = round($breakdown['subtotal'] * $optionsMultiplier, 2);

        return $breakdown;
    }

    /**
     * [AI:Claude] Vérifier si l'utilisateur peut générer un patron gratuit
     *
     * @param int $patternsGenerated Nombre de patrons déjà générés
     * @param bool $hasActiveSubscription L'utilisateur a-t-il un abonnement actif
     * @return bool True si l'utilisateur peut générer gratuitement
     */
    public function canGenerateFree(int $patternsGenerated, bool $hasActiveSubscription): bool
    {
        if ($hasActiveSubscription)
            return true;

        $maxFree = (int)($_ENV['MAX_PATTERNS_FREE'] ?? 3);
        return $patternsGenerated < $maxFree;
    }

    /**
     * [AI:Claude] Obtenir le prix des abonnements (v0.14.0 - PLUS + PRO)
     *
     * @return array Prix des abonnements PLUS et PRO, mensuels et annuels
     */
    public function getSubscriptionPrices(): array
    {
        return [
            'plus' => [
                'monthly' => (float)($_ENV['SUBSCRIPTION_PLUS_MONTHLY_PRICE'] ?? 2.99),
                'annual' => (float)($_ENV['SUBSCRIPTION_PLUS_ANNUAL_PRICE'] ?? 29.99)
            ],
            'pro' => [
                'monthly' => (float)($_ENV['SUBSCRIPTION_PRO_MONTHLY_PRICE'] ?? 4.99),
                'annual' => (float)($_ENV['SUBSCRIPTION_PRO_ANNUAL_PRICE'] ?? 49.99)
            ],
            'early_bird' => 2.99
        ];
    }

    /**
     * [AI:Claude] Obtenir les détails complets des abonnements (v0.14.0 - PLUS + PRO)
     *
     * @return array Détails des abonnements avec prix et fonctionnalités
     */
    public function getSubscriptionDetails(): array
    {
        return [
            'plus' => [
                'price' => (float)($_ENV['SUBSCRIPTION_PLUS_MONTHLY_PRICE'] ?? 2.99),
                'currency' => 'EUR',
                'period' => 'month',
                'max_projects' => 7,
                'photo_credits' => 15,
                'features' => [
                    '7 projets actifs',
                    '15 crédits photos/mois',
                    'Compteur de rangs',
                    'Organisation avancée'
                ]
            ],
            'plus_annual' => [
                'price' => (float)($_ENV['SUBSCRIPTION_PLUS_ANNUAL_PRICE'] ?? 29.99),
                'currency' => 'EUR',
                'period' => 'year',
                'max_projects' => 7,
                'photo_credits' => 15,
                'savings' => '15% de réduction (5.89€ d\'économie)',
                'features' => [
                    '7 projets actifs',
                    '15 crédits photos/mois',
                    'Compteur de rangs',
                    'Organisation avancée'
                ]
            ],
            'pro' => [
                'price' => (float)($_ENV['SUBSCRIPTION_PRO_MONTHLY_PRICE'] ?? 4.99),
                'currency' => 'EUR',
                'period' => 'month',
                'max_projects' => -1, // Illimité
                'photo_credits' => 30,
                'features' => [
                    'Projets illimités',
                    '30 crédits photos/mois',
                    'Compteur de rangs',
                    'Organisation avancée',
                    'Support prioritaire',
                    'Accès premium aux nouveautés'
                ]
            ],
            'pro_annual' => [
                'price' => (float)($_ENV['SUBSCRIPTION_PRO_ANNUAL_PRICE'] ?? 49.99),
                'currency' => 'EUR',
                'period' => 'year',
                'max_projects' => -1, // Illimité
                'photo_credits' => 30,
                'savings' => '17% de réduction (9.89€ d\'économie)',
                'features' => [
                    'Projets illimités',
                    '30 crédits photos/mois',
                    'Compteur de rangs',
                    'Organisation avancée',
                    'Support prioritaire',
                    'Accès premium aux nouveautés'
                ]
            ],
            'early_bird' => [
                'price' => 2.99,
                'currency' => 'EUR',
                'period' => 'month',
                'duration' => '12 mois',
                'limit' => '200 places',
                'max_projects' => -1, // Illimité
                'photo_credits' => 30,
                'features' => [
                    'Accès PRO complet',
                    'Projets illimités',
                    '30 crédits photos/mois',
                    'Prix garanti 12 mois'
                ]
            ]
        ];
    }

    /**
     * [AI:Claude] Calculer les économies des abonnements annuels (v0.14.0 - PLUS + PRO)
     *
     * @param string $plan Plan concerné ('plus' ou 'pro')
     * @return array Détails des économies
     */
    public function getYearlySavings(string $plan = 'pro'): array
    {
        if ($plan === 'plus') {
            $monthlyPrice = (float)($_ENV['SUBSCRIPTION_PLUS_MONTHLY_PRICE'] ?? 2.99);
            $yearlyPrice = (float)($_ENV['SUBSCRIPTION_PLUS_ANNUAL_PRICE'] ?? 29.99);
        } else {
            $monthlyPrice = (float)($_ENV['SUBSCRIPTION_PRO_MONTHLY_PRICE'] ?? 4.99);
            $yearlyPrice = (float)($_ENV['SUBSCRIPTION_PRO_ANNUAL_PRICE'] ?? 49.99);
        }

        $monthlyTotal = $monthlyPrice * 12;
        $savings = $monthlyTotal - $yearlyPrice;
        $savingsPercent = round(($savings / $monthlyTotal) * 100);

        return [
            'plan' => $plan,
            'monthly_price' => $monthlyPrice,
            'monthly_total_year' => $monthlyTotal,
            'yearly_price' => $yearlyPrice,
            'savings_amount' => round($savings, 2),
            'savings_percent' => $savingsPercent
        ];
    }

    /**
     * [AI:Claude] Obtenir tous les multiplicateurs de prix
     *
     * @return array Liste des multiplicateurs par type et niveau
     */
    public function getAllMultipliers(): array
    {
        return [
            'types' => $this->typeMultipliers,
            'levels' => [
                LEVEL_BEGINNER => 1.0,
                LEVEL_INTERMEDIATE => $this->intermediateMultiplier,
                LEVEL_ADVANCED => $this->advancedMultiplier
            ]
        ];
    }
}
