-- [AI:Claude] 2026-09-03 — email_type est un ENUM qui doit être réénuméré en entier à
-- chaque nouveau type ajouté dans EmailService.php. La dernière migration (31/07) n'a
-- jamais suivi les emails ajoutés depuis : dormant_reactivation et reengagement_light
-- (23/08), plus_welcome (jamais ajouté depuis sa création le 23/06),
-- abandoned_checkout_discount_20/_35 (24/08). Résultat : MySQL (mode non strict)
-- stockait silencieusement une chaîne vide au lieu de la valeur réelle pour ces types,
-- cassant toute déduplication basée sur email_type — d'où les envois en boucle
-- (ex: dormant_reactivation renvoyé chaque jour à la même utilisatrice).
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
    'other'
) NOT NULL DEFAULT 'other';
