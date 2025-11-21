-- [AI:Claude] Script SQL pour ajouter le tracking de temps par section
-- Créé le 2025-11-19
-- Permet de tracker le temps passé sur chaque section d'un projet

-- Ajouter colonne time_spent à project_sections
ALTER TABLE project_sections
ADD COLUMN time_spent INT DEFAULT 0 COMMENT 'Temps passé en secondes sur cette section' AFTER current_row;

-- [AI:Claude] Ajouter section_id aux sessions pour tracker quelle section était active
ALTER TABLE project_sessions
ADD COLUMN section_id INT UNSIGNED DEFAULT NULL COMMENT 'Section en cours pendant la session' AFTER project_id,
ADD FOREIGN KEY (section_id) REFERENCES project_sections(id) ON DELETE SET NULL;

-- [AI:Claude] Index pour optimiser les requêtes par section
ALTER TABLE project_sessions
ADD INDEX idx_project_sessions_section (section_id);
