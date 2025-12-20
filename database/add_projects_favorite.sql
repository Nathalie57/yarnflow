-- Migration: Ajout système de favoris pour projets (tous plans)
-- Version: 0.15.0
-- Date: 2025-12-19
-- Author: Nathalie + Claude

-- Ajout colonne is_favorite à la table projects (ignorer si existe déjà)
ALTER TABLE projects
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE
COMMENT 'Projet marqué comme favori par l\'utilisateur'
AFTER status;

-- Index pour recherche rapide des favoris
CREATE INDEX idx_projects_favorite ON projects(user_id, is_favorite);

-- Index pour tri combiné statut + favori
CREATE INDEX idx_projects_status_favorite ON projects(user_id, status, is_favorite);
