-- Migration : ajout des valeurs 'plus' et 'plus_annual' à l'ENUM subscription_type
-- À exécuter avant le déploiement du plan PLUS

ALTER TABLE `users`
MODIFY COLUMN `subscription_type` ENUM(
    'free',
    'plus',
    'plus_annual',
    'pro',
    'pro_annual',
    'early_bird',
    -- Legacy (compatibilité ascendante)
    'monthly',
    'yearly',
    'starter',
    'standard',
    'premium'
) NOT NULL DEFAULT 'free';
