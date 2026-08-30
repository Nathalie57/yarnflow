-- [AI:Claude] Table déjà présente en prod (créée manuellement, jamais versionnée) —
-- reconstituée ici a posteriori en lisant son usage réel dans Project.php et
-- migrate-secondary-counters.php, pour permettre de la recréer en local.
CREATE TABLE IF NOT EXISTS project_secondary_counters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    section_id INT UNSIGNED NULL,
    label VARCHAR(255) NOT NULL,
    target INT NULL,
    count INT NOT NULL DEFAULT 0,
    sequence TEXT NULL,
    display_order INT NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES project_sections(id) ON DELETE CASCADE,
    INDEX idx_project (project_id),
    INDEX idx_section (section_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
