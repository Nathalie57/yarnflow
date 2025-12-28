-- Migration: Ajouter table emails_sent_log pour historique complet des emails
-- Date: 2025-12-28
-- Description: Tracker TOUS les emails envoyés par l'application

CREATE TABLE IF NOT EXISTS emails_sent_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL COMMENT 'ID utilisateur destinataire (NULL si email externe)',
    recipient_email VARCHAR(255) NOT NULL COMMENT 'Email du destinataire',
    recipient_name VARCHAR(255) NULL COMMENT 'Nom du destinataire',
    email_type ENUM(
        'registration_welcome',
        'password_reset',
        'contact_confirmation',
        'contact_admin_notification',
        'onboarding_day3',
        'reengagement_day14',
        'missed_you_day30',
        'waitlist_welcome',
        'other'
    ) NOT NULL DEFAULT 'other' COMMENT 'Type d\'email envoyé',
    subject VARCHAR(500) NOT NULL COMMENT 'Sujet de l\'email',
    status ENUM('sent', 'failed') NOT NULL DEFAULT 'sent' COMMENT 'Statut d\'envoi',
    error_message TEXT NULL COMMENT 'Message d\'erreur si échec',
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date et heure d\'envoi',

    -- Foreign key optionnelle vers users
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    -- Index pour recherche rapide
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_email_type (email_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_user_id (user_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique complet de tous les emails envoyés par l\'application';
