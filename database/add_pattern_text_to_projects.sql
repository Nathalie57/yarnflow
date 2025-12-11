-- ============================================================================
-- Ajout de la colonne pattern_text à la table projects
-- @date 2025-12-11
-- @description Support copier-coller de texte de patron dans projets
-- ============================================================================

-- [AI:Claude] Ajouter la colonne pour stocker le texte du patron
ALTER TABLE `projects`
ADD COLUMN `pattern_text` LONGTEXT NULL AFTER `pattern_url`;

-- [AI:Claude] Vérification
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'projects'
AND COLUMN_NAME = 'pattern_text';
