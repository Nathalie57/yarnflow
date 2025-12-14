-- ============================================================================
-- Ajout tracking régénérations pour limiter les abus
-- @date 2025-12-11
-- @description Compteur de régénérations par photo pour économie API
-- ============================================================================

-- [AI:Claude] Ajouter colonne pour tracker les régénérations
ALTER TABLE `user_photos`
ADD COLUMN `regeneration_count` INT DEFAULT 0
COMMENT 'Nombre de fois que cette photo a été régénérée'
AFTER `ai_generated_at`;

-- [AI:Claude] Index pour requêtes de statistiques
ALTER TABLE `user_photos`
ADD INDEX `idx_regeneration` (`regeneration_count`);

-- [AI:Claude] Vérification
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'user_photos'
AND COLUMN_NAME = 'regeneration_count';
