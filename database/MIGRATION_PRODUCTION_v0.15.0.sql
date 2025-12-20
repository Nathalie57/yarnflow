-- ============================================================================
-- MIGRATION PRODUCTION v0.15.0 - YarnFlow
-- Date: 2025-12-19
-- Description: Mise à jour de la production avec les nouvelles fonctionnalités
--              - Tags personnalisés (PLUS/PRO)
--              - Favoris pour tous les plans
--              - Système de satisfaction photos IA
--              - Colonnes manquantes sur les paiements
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Tags personnalisés (v0.15.0)
-- ============================================================================

-- Table des tags de projets
CREATE TABLE IF NOT EXISTS project_tags (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_tag (project_id, tag_name),
    INDEX idx_tag_name (tag_name),
    INDEX idx_project_tags (project_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 2 : Favoris (v0.15.0)
-- ============================================================================

-- Ajouter la colonne is_favorite si elle n'existe pas
SET @dbname = DATABASE();
SET @tablename = 'projects';
SET @columnname = 'is_favorite';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE AFTER is_public')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Ajouter l'index sur is_favorite si pas déjà présent
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = 'idx_user_favorite')
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD INDEX idx_user_favorite (user_id, is_favorite, updated_at DESC)')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- ÉTAPE 3 : Système de satisfaction photos IA (v0.15.0)
-- ============================================================================

-- Ajouter les colonnes de feedback aux photos
SET @tablename = 'user_photos';

-- Colonne satisfaction_rating
SET @columnname = 'satisfaction_rating';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TINYINT(1) DEFAULT NULL COMMENT "1-5 étoiles ou NULL si pas encore noté" AFTER status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Colonne feedback_comment
SET @columnname = 'feedback_comment';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT DEFAULT NULL COMMENT "Commentaire optionnel sur la génération" AFTER satisfaction_rating')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Colonne feedback_submitted_at
SET @columnname = 'feedback_submitted_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL AFTER feedback_comment')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- ÉTAPE 4 : Date de complétion des paiements (v0.15.0)
-- ============================================================================

-- Ajouter la colonne completed_at aux paiements
SET @tablename = 'payments';
SET @columnname = 'completed_at';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL AFTER created_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Mettre à jour les paiements existants avec completed_at = created_at si status = completed
UPDATE payments
SET completed_at = created_at
WHERE status = 'completed' AND completed_at IS NULL;

-- ============================================================================
-- ÉTAPE 5 : Fix du type de paiement ENUM (v0.15.0)
-- ============================================================================

-- Vérifier et corriger le type ENUM de la colonne payment_type
SET @tablename = 'payments';
SET @columnname = 'payment_type';

-- Récupérer le type actuel
SET @current_type = (
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'payment_type'
);

-- Si le type n'inclut pas 'photo_credits', le corriger
SET @preparedStatement = (SELECT IF(
  @current_type LIKE '%photo_credits%',
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' MODIFY COLUMN ', @columnname, " ENUM('subscription', 'photo_credits', 'early_bird', 'pattern') NOT NULL DEFAULT 'subscription'")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Afficher un résumé des tables et colonnes importantes
SELECT
    'project_tags' as table_name,
    COUNT(*) as row_count
FROM project_tags
UNION ALL
SELECT
    'projects avec favoris' as table_name,
    COUNT(*) as row_count
FROM projects WHERE is_favorite = TRUE
UNION ALL
SELECT
    'photos avec feedback' as table_name,
    COUNT(*) as row_count
FROM user_photos WHERE satisfaction_rating IS NOT NULL;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Afficher la version
SELECT '✅ Migration v0.15.0 terminée avec succès !' as status;
