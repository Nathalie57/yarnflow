-- Migration pour ajouter le système de codes beta
-- Date: 2025-12-07
-- Version: 0.12.1

-- Ajouter les colonnes pour les codes beta
ALTER TABLE waitlist_emails
ADD COLUMN beta_type ENUM('free', 'pro') DEFAULT 'free' COMMENT 'Type de beta attribué',
ADD COLUMN beta_code VARCHAR(32) UNIQUE COMMENT 'Code unique pour l\'inscription beta',
ADD COLUMN beta_activated BOOLEAN DEFAULT FALSE COMMENT 'Si le code a été utilisé',
ADD COLUMN activated_user_id INT UNSIGNED COMMENT 'ID utilisateur qui a activé le code',
ADD COLUMN activated_at TIMESTAMP NULL COMMENT 'Date d\'activation du code',
ADD INDEX idx_beta_code (beta_code),
ADD INDEX idx_beta_activated (beta_activated),
ADD FOREIGN KEY fk_activated_user (activated_user_id) REFERENCES users(id) ON DELETE SET NULL;
