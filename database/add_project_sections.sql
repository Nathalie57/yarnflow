-- [AI:Claude] Script SQL pour ajouter le système de sections/parties aux projets
-- Créé le 2025-11-18
-- Permet de découper un projet en parties (ex: face, dos, manches pour un gilet)

-- Table des sections de projet
CREATE TABLE IF NOT EXISTS project_sections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    total_rows INT DEFAULT NULL,
    current_row INT DEFAULT 0,
    is_completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_sections_project (project_id),
    INDEX idx_project_sections_order (project_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [AI:Claude] Ajouter section_id à la table project_rows pour lier chaque rang à une section
ALTER TABLE project_rows
ADD COLUMN section_id INT UNSIGNED DEFAULT NULL AFTER project_id,
ADD FOREIGN KEY (section_id) REFERENCES project_sections(id) ON DELETE SET NULL;

-- [AI:Claude] Index pour optimiser les requêtes par section
ALTER TABLE project_rows
ADD INDEX idx_project_rows_section (section_id);

-- [AI:Claude] Ajouter current_section_id au projet pour mémoriser la section en cours
ALTER TABLE projects
ADD COLUMN current_section_id INT UNSIGNED DEFAULT NULL AFTER current_row,
ADD FOREIGN KEY (current_section_id) REFERENCES project_sections(id) ON DELETE SET NULL;
