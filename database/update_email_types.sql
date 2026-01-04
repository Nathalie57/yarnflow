-- Migration: Ajouter les nouveaux types d'emails de réengagement
-- Date: 2026-01-04
-- Description: Ajouter reengagement_day7 et need_help_day21 à l'ENUM

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
    'waitlist_welcome',
    'other'
) NOT NULL DEFAULT 'other' COMMENT 'Type d\'email envoyé';
