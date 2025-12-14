-- ============================================================================
-- Système d'agrégation des rangs pour optimiser project_rows
-- ============================================================================
-- Stratégie: Garder le détail des rangs récents (30 jours)
--            Agréger les vieux rangs en stats journalières
-- ============================================================================

-- Table pour stocker les stats agrégées par jour
CREATE TABLE IF NOT EXISTS project_rows_daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,

    -- Date de la session
    date DATE NOT NULL COMMENT 'Date de travail',

    -- Stats agrégées pour ce jour
    total_rows INT NOT NULL COMMENT 'Nombre de rangs tricotés ce jour',
    total_duration INT NOT NULL COMMENT 'Temps total en secondes',
    total_stitches INT DEFAULT NULL COMMENT 'Nombre total de mailles',

    -- Rangs min/max tricotés ce jour
    min_row_num INT NOT NULL,
    max_row_num INT NOT NULL,

    -- Moyennes
    avg_duration_per_row INT DEFAULT NULL,
    avg_stitches_per_row INT DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_project_date (project_id, date DESC),
    UNIQUE KEY unique_project_date (project_id, date),

    -- Foreign key
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Procédure d'archivage (à exécuter via CRON quotidien)
-- ============================================================================
DELIMITER $$

CREATE PROCEDURE archive_old_project_rows()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_project_id INT;

    -- Déclarer un curseur pour tous les projets
    DECLARE project_cursor CURSOR FOR
        SELECT DISTINCT project_id FROM project_rows
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- Pour chaque projet ayant des vieux rangs
    OPEN project_cursor;

    read_loop: LOOP
        FETCH project_cursor INTO v_project_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Agréger les rangs de plus de 30 jours par date
        INSERT INTO project_rows_daily_stats
            (project_id, date, total_rows, total_duration, total_stitches,
             min_row_num, max_row_num, avg_duration_per_row, avg_stitches_per_row)
        SELECT
            project_id,
            DATE(created_at) as date,
            COUNT(*) as total_rows,
            SUM(duration) as total_duration,
            SUM(stitch_count) as total_stitches,
            MIN(row_num) as min_row_num,
            MAX(row_num) as max_row_num,
            AVG(duration) as avg_duration_per_row,
            AVG(stitch_count) as avg_stitches_per_row
        FROM project_rows
        WHERE project_id = v_project_id
          AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY project_id, DATE(created_at)
        ON DUPLICATE KEY UPDATE
            total_rows = VALUES(total_rows),
            total_duration = VALUES(total_duration),
            total_stitches = VALUES(total_stitches),
            min_row_num = VALUES(min_row_num),
            max_row_num = VALUES(max_row_num),
            avg_duration_per_row = VALUES(avg_duration_per_row),
            avg_stitches_per_row = VALUES(avg_stitches_per_row);

        -- Supprimer les vieux rangs maintenant archivés
        DELETE FROM project_rows
        WHERE project_id = v_project_id
          AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

    END LOOP;

    CLOSE project_cursor;

    -- Log du nettoyage
    SELECT CONCAT('Archivage terminé : ', ROW_COUNT(), ' rangs archivés') as result;
END$$

DELIMITER ;

-- ============================================================================
-- Event MySQL pour exécuter l'archivage automatiquement chaque nuit à 3h
-- ============================================================================
-- IMPORTANT: Activer l'event scheduler dans MySQL :
-- SET GLOBAL event_scheduler = ON;
-- ============================================================================

CREATE EVENT IF NOT EXISTS daily_archive_project_rows
ON SCHEDULE EVERY 1 DAY
STARTS CONCAT(CURDATE() + INTERVAL 1 DAY, ' 03:00:00')
DO
    CALL archive_old_project_rows();

-- ============================================================================
-- Pour désactiver l'archivage automatique :
-- DROP EVENT IF EXISTS daily_archive_project_rows;
-- ============================================================================
