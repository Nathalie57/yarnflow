-- Migration: Ajouter le type d'email project_start_reminder_day1
-- Date: 2026-01-13
-- Description: Ajouter le type d'email pour rappel J+1 projet non démarré
-- Version: 0.17.0

ALTER TABLE emails_sent_log
MODIFY COLUMN email_type ENUM(
    'registration_welcome',
    'password_reset',
    'contact_confirmation',
    'contact_admin_notification',
    'onboarding_day3',
    'reengagement_day7',
    'reengagement_day14',
    'need_help_day21',
    'missed_you_day30',
    'project_start_reminder_day1',
    'waitlist_welcome',
    'other'
) NOT NULL DEFAULT 'other' COMMENT 'Type d\'email envoyé';
