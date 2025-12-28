-- Migration: Mettre à jour les types de notifications
-- Date: 2025-12-28
-- Description: J+14 → J+7 et J+30 → J+21, renommer les types

-- Mettre à jour la table email_notifications_sent
ALTER TABLE email_notifications_sent
MODIFY COLUMN notification_type ENUM(
    'onboarding_day3',
    'reengagement_day7',
    'need_help_day21'
) NOT NULL;

-- Mettre à jour la table emails_sent_log
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
    'other'
) NOT NULL DEFAULT 'other';
