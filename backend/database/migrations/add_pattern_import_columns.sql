-- ================================================================
-- Migration: Ajout colonnes pour import patron multi-format
-- Date: 2025-11-16
-- Version: v0.11.0 - AI Photo Studio
-- Description: Ajoute pattern_path et pattern_url à la table projects
--              pour permettre l'import de patrons (PDF, images, URLs)
-- ================================================================

USE patron_maker;

-- [AI:Claude] Ajout des colonnes pour import patron
ALTER TABLE projects
ADD COLUMN pattern_path VARCHAR(500) NULL COMMENT 'Chemin du fichier patron (PDF ou image)' AFTER pattern_id,
ADD COLUMN pattern_url VARCHAR(1000) NULL COMMENT 'URL du patron web (YouTube, Pinterest, etc.)' AFTER pattern_path;

-- [AI:Claude] Vérification
SELECT 'Migration terminée avec succès' AS status;
DESCRIBE projects;
