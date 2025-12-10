-- Ajout de la colonne main_photo pour stocker la photo principale du projet
-- Date: 2025-12-06
-- Auteur: Claude Code

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS main_photo VARCHAR(255) DEFAULT NULL COMMENT 'Chemin vers la photo principale du projet';

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_projects_main_photo ON projects(main_photo);
