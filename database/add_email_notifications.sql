-- Migration: Ajouter table email_notifications_sent pour tracker les emails envoyés
-- Date: 2025-12-28
-- Description: Évite d'envoyer plusieurs fois le même email de notification

-- Note: La colonne email_notifications existe déjà dans users, pas besoin de la recréer
-- ALTER TABLE users
-- ADD COLUMN email_notifications TINYINT(1) NOT NULL DEFAULT 1
-- COMMENT 'Autoriser les emails de notification (1 = oui, 0 = non)'
-- AFTER email;

CREATE TABLE IF NOT EXISTS email_notifications_sent (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    notification_type ENUM('onboarding_day3', 'reengagement_day14', 'missed_you_day30') NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_subject VARCHAR(255) NULL,
    email_status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',

    -- Colonnes générées pour l'année et le mois
    sent_year INT AS (YEAR(sent_at)) STORED,
    sent_month INT AS (MONTH(sent_at)) STORED,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Index pour recherche rapide
    INDEX idx_user_type (user_id, notification_type),
    INDEX idx_sent_at (sent_at),

    -- Éviter les doublons (même type d'email max 1 fois par mois par user)
    UNIQUE KEY unique_user_type_month (user_id, notification_type, sent_year, sent_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracker les emails de notification envoyés pour éviter les doublons';
