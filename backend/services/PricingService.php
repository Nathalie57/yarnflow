<?php
/**
 * @file PricingService.php
 * @brief Service de calcul de tarification des patrons générés
 */

declare(strict_types=1);

namespace App\Services;

class PricingService
{
    private float $basePrice;
    private float $advancedMultiplier;
    private float $intermediateMultiplier;

    private array $typeMultipliers = [
        TYPE_HAT      => 1.0,
        TYPE_SCARF    => 1.2,
        TYPE_BAG      => 1.5,
        TYPE_AMIGURUMI => 1.8,
        TYPE_GARMENT  => 2.0,
    ];

    public function __construct()
    {
        $this->basePrice             = (float)($_ENV['PATTERN_BASE_PRICE'] ?? 2.99);
        $this->advancedMultiplier    = (float)($_ENV['PATTERN_ADVANCED_MULTIPLIER'] ?? 1.5);
        $this->intermediateMultiplier = 1.2;
    }

    public function calculatePrice(string $type, string $level, array $options = []): float
    {
        $price = $this->basePrice;
        $price *= $this->typeMultipliers[$type] ?? 1.0;
        $price *= match($level) {
            LEVEL_BEGINNER     => 1.0,
            LEVEL_INTERMEDIATE => $this->intermediateMultiplier,
            LEVEL_ADVANCED     => $this->advancedMultiplier,
            default            => 1.0,
        };

        if (!empty($options['custom_size']))           $price *= 1.1;
        if (!empty($options['detailed_instructions'])) $price *= 1.15;

        return round($price, 2);
    }

    public function getPriceBreakdown(string $type, string $level, array $options = []): array
    {
        $typeMultiplier = $this->typeMultipliers[$type] ?? 1.0;
        $levelMultiplier = match($level) {
            LEVEL_BEGINNER     => 1.0,
            LEVEL_INTERMEDIATE => $this->intermediateMultiplier,
            LEVEL_ADVANCED     => $this->advancedMultiplier,
            default            => 1.0,
        };

        $breakdown = [
            'base_price'       => $this->basePrice,
            'type'             => $type,
            'type_multiplier'  => $typeMultiplier,
            'level'            => $level,
            'level_multiplier' => $levelMultiplier,
            'options'          => [],
            'subtotal'         => $this->basePrice * $typeMultiplier * $levelMultiplier,
        ];

        $optionsMultiplier = 1.0;
        if (!empty($options['custom_size'])) {
            $optionsMultiplier *= 1.1;
            $breakdown['options'][] = ['name' => 'Taille personnalisée', 'multiplier' => 1.1];
        }
        if (!empty($options['detailed_instructions'])) {
            $optionsMultiplier *= 1.15;
            $breakdown['options'][] = ['name' => 'Instructions détaillées', 'multiplier' => 1.15];
        }

        $breakdown['options_multiplier'] = $optionsMultiplier;
        $breakdown['total'] = round($breakdown['subtotal'] * $optionsMultiplier, 2);

        return $breakdown;
    }

    public function canGenerateFree(int $patternsGenerated, bool $hasActiveSubscription): bool
    {
        if ($hasActiveSubscription) return true;
        return $patternsGenerated < (int)($_ENV['MAX_PATTERNS_FREE'] ?? 2);
    }

    /**
     * Prix des abonnements — utilisé pour enregistrer le montant dans la table payments.
     * Source de vérité pour la facturation : les price IDs Stripe dans .env.
     */
    public function getSubscriptionPrices(): array
    {
        return [
            'plus' => [
                'monthly' => (float)($_ENV['SUBSCRIPTION_PLUS_MONTHLY_PRICE'] ?? 3.99),
                'annual'  => (float)($_ENV['SUBSCRIPTION_PLUS_ANNUAL_PRICE']  ?? 35.88),
            ],
            'pro' => [
                'monthly' => (float)($_ENV['SUBSCRIPTION_PRO_MONTHLY_PRICE'] ?? 6.99),
                'annual'  => (float)($_ENV['SUBSCRIPTION_PRO_ANNUAL_PRICE']  ?? 59.99),
            ],
            'early_bird' => 2.99,
        ];
    }

    public function getAllMultipliers(): array
    {
        return [
            'types' => $this->typeMultipliers,
            'levels' => [
                LEVEL_BEGINNER     => 1.0,
                LEVEL_INTERMEDIATE => $this->intermediateMultiplier,
                LEVEL_ADVANCED     => $this->advancedMultiplier,
            ],
        ];
    }
}
