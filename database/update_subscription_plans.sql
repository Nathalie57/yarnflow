-- [AI:Claude] YarnFlow v0.12.0 - Mise à jour des noms de plans
-- Migration: Renommer 'starter' → 'standard', 'monthly' → 'standard', 'yearly' → 'premium'
-- Date: 2025-11-20

-- Mettre à jour les utilisateurs existants
UPDATE users
SET subscription_type = 'standard'
WHERE subscription_type IN ('starter', 'monthly');

UPDATE users
SET subscription_type = 'premium'
WHERE subscription_type = 'yearly';

-- Vérification après migration
SELECT
    subscription_type,
    COUNT(*) as count
FROM users
GROUP BY subscription_type;

-- Note: Les alias legacy restent dans le code pour assurer la rétrocompatibilité
-- constants.php : SUBSCRIPTION_STARTER, SUBSCRIPTION_MONTHLY, SUBSCRIPTION_YEARLY (deprecated)
-- CreditManager.php : 'starter', 'monthly', 'yearly' dans MONTHLY_QUOTAS (deprecated)
