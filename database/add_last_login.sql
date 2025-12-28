-- Migration: Ajouter last_login_at pour tracker la dernière connexion
-- Date: 2025-12-28
-- Description: Ajoute un champ DATETIME pour enregistrer la date/heure de la dernière connexion

ALTER TABLE users
ADD COLUMN last_login_at DATETIME NULL DEFAULT NULL
COMMENT 'Date et heure de la dernière connexion'
AFTER updated_at;

-- Index pour optimiser les requêtes de tri par dernière connexion
CREATE INDEX idx_last_login_at ON users(last_login_at);
