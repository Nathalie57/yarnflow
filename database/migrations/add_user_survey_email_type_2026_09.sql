-- [AI:Claude] 2026-09-20 — ajoute 'user_survey' à l'ENUM email_type pour le mail
-- ponctuel de sondage produit (formulaire personas). Réénumérer l'ENUM en entier
-- ici, sinon MySQL (mode non strict) stocke une chaîne vide au lieu de la valeur
-- réelle et casse la déduplication (voir add_missing_email_types_2026_09.sql).
ALTER TABLE emails_sent_log
MODIFY COLUMN email_type ENUM(
    'registration_welcome',
    'password_reset',
    'contact_confirmation',
    'contact_admin_notification',
    'onboarding_day3',
    'reengagement_day7',
    'need_help_day21',
    'waitlist_welcome',
    'project_start_reminder',
    'project_inactive_reminder',
    'ai_quota_exhausted',
    'ai_quota_approaching',
    'stash_limit_approaching',
    'active_user_upgrade',
    'abandoned_checkout',
    'active_free_day30',
    'reactivation',
    'first_project_ready',
    'streak_at_risk',
    'streak_reward',
    'dormant_reactivation',
    'reengagement_light',
    'plus_welcome',
    'abandoned_checkout_discount_20',
    'abandoned_checkout_discount_35',
    'user_survey',
    'other'
) NOT NULL DEFAULT 'other';
