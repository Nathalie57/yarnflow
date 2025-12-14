-- ============================================================================
-- Partitionnement de project_rows par année
-- ============================================================================
-- Avantage: MySQL gère automatiquement la séparation des données
-- Les vieilles données restent accessibles mais dans des partitions séparées
-- ============================================================================

-- ⚠️ ATTENTION: Cette migration NÉCESSITE que la table soit vide
-- Si vous avez déjà des données, utilisez add_row_aggregation.sql

-- Supprimer la table existante (DANGER: perte de données!)
-- DROP TABLE IF EXISTS project_rows;

-- Recréer avec partitionnement par année
CREATE TABLE IF NOT EXISTS project_rows_partitioned (
    id INT AUTO_INCREMENT,
    project_id INT UNSIGNED NOT NULL,

    row_num INT NOT NULL,
    stitch_count INT DEFAULT NULL,
    stitch_type VARCHAR(100) DEFAULT NULL,

    duration INT DEFAULT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,

    notes TEXT DEFAULT NULL,
    difficulty_rating TINYINT DEFAULT NULL,
    photo VARCHAR(500) DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id, created_at),
    INDEX idx_project_row (project_id, row_num),
    INDEX idx_project_created (project_id, created_at DESC),

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
)
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p2027 VALUES LESS THAN (2028),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ============================================================================
-- Pour ajouter de nouvelles partitions (chaque année) :
-- ============================================================================
-- ALTER TABLE project_rows_partitioned REORGANIZE PARTITION p_future INTO (
--     PARTITION p2028 VALUES LESS THAN (2029),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- ============================================================================
-- Pour supprimer les données de 2024 (après 3 ans par exemple) :
-- ============================================================================
-- ALTER TABLE project_rows_partitioned DROP PARTITION p2024;
