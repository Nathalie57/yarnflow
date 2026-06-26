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
    'active_free_day30',
    'reactivation',
    'first_project_ready',
    'other'
) NOT NULL DEFAULT 'other';
