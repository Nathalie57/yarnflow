-- Migration: Ajouter last_seen_at pour tracker la dernière activité
-- Date: 2025-12-28
-- Description: Ajoute un champ DATETIME pour enregistrer la date/heure de la dernière activité sur l'app
--              Différent de last_login_at : mis à jour à CHAQUE requête API authentifiée

ALTER TABLE users
ADD COLUMN last_seen_at DATETIME NULL DEFAULT NULL
COMMENT 'Date et heure de la dernière activité sur l\'application'
AFTER last_login_at;

-- Index pour optimiser les requêtes de tri par dernière activité
CREATE INDEX idx_last_seen_at ON users(last_seen_at);
