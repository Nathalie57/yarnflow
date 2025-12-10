-- ============================================================================
-- Ajout des colonnes pattern_path et pattern_url à la table projects
-- @date 2025-12-04
-- @description Correction bug upload patron
-- ============================================================================

-- [AI:Claude] Ajouter les colonnes pour stocker les patrons
ALTER TABLE `projects`
ADD COLUMN `pattern_path` VARCHAR(500) NULL AFTER `notes`,
ADD COLUMN `pattern_url` VARCHAR(1000) NULL AFTER `pattern_path`;

-- [AI:Claude] Index pour recherche rapide
ALTER TABLE `projects`
ADD INDEX `idx_pattern_path` (`pattern_path`(255)),
ADD INDEX `idx_pattern_url` (`pattern_url`(255));

-- [AI:Claude] Vérification
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'projects'
AND COLUMN_NAME IN ('pattern_path', 'pattern_url');
