-- Migration : Corriger l'ENUM payment_type pour supporter tous les types de paiements
-- Date : 2025-12-19
-- Problème : L'ENUM ne contenait que les anciennes valeurs (pattern, subscription_monthly, subscription_yearly)
-- Solution : Ajouter toutes les nouvelles valeurs (PLUS, PRO, crédits, Early Bird)

ALTER TABLE payments
MODIFY COLUMN payment_type ENUM(
    'pattern',
    'subscription_monthly',
    'subscription_yearly',
    'subscription_plus',
    'subscription_plus_annual',
    'subscription_pro',
    'subscription_pro_annual',
    'subscription_early_bird',
    'credits_pack_50',
    'credits_pack_150',
    'photo_credits'
) NOT NULL DEFAULT 'pattern';
