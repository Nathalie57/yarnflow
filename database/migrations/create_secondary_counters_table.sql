-- Passage du compteur secondaire de "un seul par section" à "plusieurs par
-- section (ou par projet, si le projet n'a pas de sections)".
--
-- section_id NULL = compteur attaché directement au projet (mode sans section).
-- Les anciennes colonnes secondary_* sur project_sections et projects restent
-- en place pour compatibilité mais ne sont plus alimentées par le nouveau code.

CREATE TABLE IF NOT EXISTS project_secondary_counters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    section_id INT UNSIGNED DEFAULT NULL,
    label VARCHAR(50) NOT NULL,
    target INT DEFAULT NULL,
    count INT NOT NULL DEFAULT 0,
    sequence JSON DEFAULT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_project (project_id),
    INDEX idx_section (section_id),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES project_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
