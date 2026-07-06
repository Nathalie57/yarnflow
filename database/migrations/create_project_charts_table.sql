-- Grilles jacquard/colorwork rattachées à un projet (et optionnellement une
-- section, comme les compteurs secondaires). Phase 1 : éditeur manuel
-- uniquement, pas encore d'import d'image.
--
-- cells : tableau 2D JSON d'indices de couleur (index dans palette), un
-- indice par case. Pas de table par case : une grille 60x80 tient
-- largement dans une seule colonne JSON.

CREATE TABLE IF NOT EXISTS project_charts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    section_id INT UNSIGNED DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    width INT UNSIGNED NOT NULL,
    height INT UNSIGNED NOT NULL,
    palette JSON NOT NULL,
    cells JSON NOT NULL,
    current_row INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_project_charts_project (project_id),
    INDEX idx_project_charts_section (section_id),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES project_sections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
