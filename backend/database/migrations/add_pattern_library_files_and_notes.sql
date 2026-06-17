-- ================================================================
-- Migration: Tables pattern_library_files et pattern_usage_notes
-- Date: 2026-04-12
-- Description: Support multi-fichiers et notes d'utilisation
--              pour la bibliothèque de patrons
-- ================================================================

-- Fichiers additionnels attachés à un patron
CREATE TABLE IF NOT EXISTS pattern_library_files (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pattern_library_id  INT UNSIGNED NOT NULL,
    file_path           VARCHAR(500) NOT NULL,
    file_type           VARCHAR(100) NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    sort_order          INT NOT NULL DEFAULT 0,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pattern_id (pattern_library_id)
);

-- Notes d'utilisation d'un patron (par utilisateur, optionnellement liées à un projet)
CREATE TABLE IF NOT EXISTS pattern_usage_notes (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id             INT UNSIGNED NOT NULL,
    pattern_library_id  INT UNSIGNED NOT NULL,
    project_id          INT UNSIGNED NULL,
    note                TEXT NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pattern_user (pattern_library_id, user_id)
);

-- Colonne pattern_library_id sur projects (si absente)
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS pattern_library_id INT UNSIGNED NULL
    COMMENT 'Lien vers un patron de la bibliothèque' AFTER pattern_url;

SELECT 'Migration terminée avec succès' AS status;
