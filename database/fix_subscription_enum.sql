-- ============================================================================
-- YarnFlow v0.12.0 - Correction du schema subscription_type ENUM
-- @author [AI:Claude]
-- @date 2025-11-29
-- @description Ajoute les valeurs 'pro', 'pro_annual', 'early_bird' au ENUM
-- ============================================================================

-- [AI:Claude] Modifier l'ENUM subscription_type pour inclure tous les plans
ALTER TABLE `users`
MODIFY COLUMN `subscription_type` ENUM(
    'free',
    'pro',
    'pro_annual',
    'early_bird',
    -- Legacy support (deprecated mais conservés pour rétrocompatibilité)
    'monthly',
    'yearly',
    'starter',
    'standard',
    'premium'
) NOT NULL DEFAULT 'free';

-- [AI:Claude] Vérification : Afficher la distribution des abonnements
SELECT
    subscription_type,
    COUNT(*) as count,
    GROUP_CONCAT(DISTINCT email SEPARATOR ', ') as users_sample
FROM users
GROUP BY subscription_type
ORDER BY count DESC;

-- [AI:Claude] Statistiques : Abonnements actifs vs expirés
SELECT
    subscription_type,
    CASE
        WHEN subscription_expires_at IS NULL THEN 'jamais_expire'
        WHEN subscription_expires_at > NOW() THEN 'actif'
        ELSE 'expire'
    END as status,
    COUNT(*) as count
FROM users
WHERE subscription_type != 'free'
GROUP BY subscription_type, status
ORDER BY subscription_type, status;

-- ============================================================================
-- NOTES DE MIGRATION
-- ============================================================================
-- Cette migration corrige le schema pour supporter les nouveaux plans :
--
-- Plans actifs (v0.12.0) :
--   - free : Gratuit (3 projets, 5 photos IA/mois)
--   - pro : 4.99€/mois (projets illimités, 75 photos IA/mois)
--   - pro_annual : 39.99€/an (mêmes avantages que pro)
--   - early_bird : 2.99€/mois pendant 12 mois (200 places max)
--
-- Plans legacy (conservés pour rétrocompatibilité) :
--   - monthly, yearly, starter, standard, premium
--   Tous mappés vers 'pro' dans le code (constants.php, CreditManager.php)
--
-- Après cette migration :
--   1. Tous les nouveaux abonnements utilisent 'pro', 'pro_annual', 'early_bird'
--   2. Les anciens abonnements continuent de fonctionner (legacy support)
--   3. Le code vérifie désormais subscription_expires_at pour appliquer les quotas
-- ============================================================================
