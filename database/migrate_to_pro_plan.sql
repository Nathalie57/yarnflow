-- [AI:Claude] YarnFlow v0.12.0 - Migration vers pricing final optimisé
-- Migration: Tous les anciens plans payants → 'pro'
-- Date: 2025-11-20

-- Mettre à jour tous les utilisateurs payants vers le plan 'pro'
UPDATE users
SET subscription_type = 'pro'
WHERE subscription_type IN ('starter', 'standard', 'premium', 'monthly', 'yearly');

-- Vérification après migration
SELECT
    subscription_type,
    COUNT(*) as count
FROM users
GROUP BY subscription_type;

-- Note: Les alias legacy restent dans le code pour assurer la rétrocompatibilité
-- constants.php : SUBSCRIPTION_STANDARD, SUBSCRIPTION_PREMIUM, etc. pointent vers 'pro'
-- CreditManager.php : 'standard', 'premium', 'monthly', 'yearly' = 75 crédits (comme 'pro')

-- Nouveaux quotas v0.12.0 FINAL :
-- FREE : 3 projets, 5 photos IA/mois
-- PRO (4.99€/mois ou 39.99€/an) : Projets illimités, 75 photos IA/mois + Bibliothèque de patrons
-- EARLY BIRD (2.99€/mois pendant 12 mois) : Accès PRO complet

-- Packs de crédits disponibles pour tous (optionnels) :
-- Small (2.99€) : 22 crédits
-- Medium (6.99€) : 57 crédits
-- Large (14.99€) : 220 crédits
