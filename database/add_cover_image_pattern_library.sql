-- Migration: Ajout d'image de couverture pour les patrons
-- Date: 2025-12-13
-- Description: Ajoute un champ cover_image_path pour permettre l'upload d'une image de couverture personnalisée

-- Vérifier si preview_image_url existe, sinon l'ajouter d'abord
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pattern_library'
    AND COLUMN_NAME = 'preview_image_url'
);

SET @sql_preview = IF(@column_exists = 0,
    'ALTER TABLE pattern_library ADD COLUMN preview_image_url VARCHAR(500) DEFAULT NULL AFTER url',
    'SELECT "preview_image_url already exists" AS result'
);

PREPARE stmt FROM @sql_preview;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier si cover_image_path existe, sinon l'ajouter
SET @column_exists_cover = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pattern_library'
    AND COLUMN_NAME = 'cover_image_path'
);

SET @sql_cover = IF(@column_exists_cover = 0,
    'ALTER TABLE pattern_library ADD COLUMN cover_image_path VARCHAR(500) DEFAULT NULL COMMENT "Chemin vers l\'\'image de couverture uploadée par l\'\'utilisateur (optionnel, prioritaire sur preview_image_url)" AFTER preview_image_url',
    'SELECT "cover_image_path already exists" AS result'
);

PREPARE stmt FROM @sql_cover;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
