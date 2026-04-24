-- =====================================================
-- Migration : Smart Project Creation (Création IA)
-- Version : 0.17.0
-- Date : 2026-01-07
-- =====================================================

-- 1. Ajout de colonnes à la table projects pour détails techniques
-- =====================================================

-- Procédure pour ajouter une colonne seulement si elle n'existe pas
DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    DECLARE column_exists INT DEFAULT 0;

    SELECT COUNT(*)
    INTO column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column;

    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- Ajouter les colonnes avec vérification
CALL add_column_if_not_exists('projects', 'craft_type',
    "ENUM('tricot', 'crochet', 'autre') DEFAULT NULL COMMENT 'Type de projet détecté par IA ou saisi manuellement' AFTER type");

CALL add_column_if_not_exists('projects', 'gauge_stitches',
    "INT DEFAULT NULL COMMENT 'Échantillon : nombre de mailles sur gauge_size_cm' AFTER yarn_used_grams");

CALL add_column_if_not_exists('projects', 'gauge_rows',
    "INT DEFAULT NULL COMMENT 'Échantillon : nombre de rangs sur gauge_size_cm' AFTER gauge_stitches");

CALL add_column_if_not_exists('projects', 'gauge_size_cm',
    "INT DEFAULT 10 COMMENT 'Taille de l échantillon en cm (généralement 10)' AFTER gauge_rows");

CALL add_column_if_not_exists('projects', 'source_type',
    "ENUM('pdf', 'url', 'manual') DEFAULT 'manual' COMMENT 'Origine du projet : importé depuis PDF, URL ou créé manuellement' AFTER pattern_notes");

CALL add_column_if_not_exists('projects', 'source_url',
    "VARCHAR(500) DEFAULT NULL COMMENT 'URL source ou nom du fichier PDF original' AFTER source_type");

-- Nettoyer la procédure temporaire
DROP PROCEDURE IF EXISTS add_column_if_not_exists;


-- 2. Création de la table ai_pattern_imports (tracking quotas)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_pattern_imports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL si l import a échoué',

    -- Source
    source_type ENUM('pdf', 'url') NOT NULL,
    source_name VARCHAR(500) NOT NULL COMMENT 'Nom fichier ou URL',
    file_size_bytes INT DEFAULT NULL COMMENT 'Taille fichier PDF en octets',

    -- Résultat IA
    ai_status ENUM('success', 'partial', 'failed') DEFAULT 'success'
        COMMENT 'success = tout OK, partial = incomplet, failed = échec total',
    ai_response_json JSON DEFAULT NULL COMMENT 'Réponse brute de Gemini pour debug',
    processing_time_ms INT DEFAULT NULL COMMENT 'Temps de traitement IA en millisecondes',
    error_message TEXT DEFAULT NULL COMMENT 'Message d erreur si échec',

    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP utilisateur pour anti-abus',

    -- Clés étrangères
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,

    -- Index pour quotas mensuels
    INDEX idx_user_month (user_id, created_at),
    INDEX idx_status (ai_status),
    INDEX idx_source_type (source_type)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracking des imports de patrons par IA (quotas mensuels par plan)';


-- 3. Vérification
-- =====================================================
-- Exécuter ces commandes manuellement après la migration pour vérifier :
--
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'projects'
--   AND COLUMN_NAME IN ('craft_type', 'gauge_stitches', 'gauge_rows', 'gauge_size_cm', 'source_type', 'source_url')
-- ORDER BY ORDINAL_POSITION;
--
-- DESCRIBE ai_pattern_imports;
