-- ============================================================================
-- YarnFlow v0.16.0 - Ajout des types 'plus' et 'plus_annual' à subscription_type
-- @author [AI:Claude]
-- @date 2025-12-21
-- @description Ajoute 'plus' et 'plus_annual' au ENUM pour le plan PLUS (v0.14.0)
-- ============================================================================

-- [AI:Claude] Vérifier les subscription_type actuels AVANT
SELECT 'BEFORE MIGRATION' as status, subscription_type, COUNT(*) as count
FROM users
GROUP BY subscription_type
ORDER BY count DESC;

-- [AI:Claude] Modifier l'ENUM subscription_type pour inclure PLUS
ALTER TABLE `users`
MODIFY COLUMN `subscription_type` ENUM(
    'free',
    'plus',             -- NOUVEAU : PLUS mensuel 2.99€/mois (7 projets, 15 crédits photos)
    'plus_annual',      -- NOUVEAU : PLUS annuel 29.99€/an (-15%)
    'pro',
    'pro_annual',
    'early_bird',
    -- Legacy support (deprecated mais conservés pour rétrocompatibilité)
    'monthly',
    'yearly',
    'starter',
    'standard',
    'premium'
) NOT NULL DEFAULT 'free'
COMMENT '[AI:Claude] Type d''abonnement - Plans v0.16.0 : FREE (0€), PLUS (2.99€/mois ou 29.99€/an), PRO (4.99€/mois ou 49.99€/an), EARLY_BIRD (2.99€/mois)';

-- [AI:Claude] Vérification APRÈS migration
SHOW COLUMNS FROM users LIKE 'subscription_type';

-- [AI:Claude] Afficher la distribution des abonnements
SELECT 'AFTER MIGRATION' as status, subscription_type, COUNT(*) as count
FROM users
GROUP BY subscription_type
ORDER BY count DESC;

-- ============================================================================
-- NOTES DE MIGRATION
-- ============================================================================
-- Cette migration ajoute les types manquants pour le plan PLUS (v0.14.0) :
--
-- Nouveaux types ajoutés :
--   - plus : 2.99€/mois (7 projets actifs, 15 crédits photos/mois)
--   - plus_annual : 29.99€/an (économie 15%)
--
-- Plans complets disponibles après migration :
--   - free : Gratuit (3 projets actifs, 5 crédits photos/mois)
--   - plus : 2.99€/mois (7 projets actifs, 15 crédits photos/mois)
--   - plus_annual : 29.99€/an (7 projets actifs, 15 crédits photos/mois)
--   - pro : 4.99€/mois (projets illimités, 30 crédits photos/mois)
--   - pro_annual : 49.99€/an (projets illimités, 30 crédits photos/mois)
--   - early_bird : 2.99€/mois x 12 mois (projets illimités, 30 crédits photos/mois)
--
-- Référence :
--   - backend/config/constants.php lignes 25-30
--   - CLAUDE.md section "Plans et tarification"
-- ============================================================================
