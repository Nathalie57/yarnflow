-- Migration: Support multi-fichiers pour la bibliothèque de patrons
-- Permet d'attacher plusieurs fichiers (PDF, images) à un même patron
-- Version: 0.17.4
-- Date: 2026-04-12

CREATE TABLE IF NOT EXISTS pattern_library_files (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pattern_library_id  INT UNSIGNED NOT NULL,
  file_path           VARCHAR(500) NOT NULL,
  file_type           ENUM('pdf', 'image') NOT NULL,
  file_name           VARCHAR(255) DEFAULT NULL COMMENT 'Nom original du fichier',
  sort_order          SMALLINT UNSIGNED DEFAULT 0 COMMENT 'Ordre d\'affichage',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_pattern (pattern_library_id),

  CONSTRAINT fk_plf_pattern FOREIGN KEY (pattern_library_id)
    REFERENCES pattern_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
