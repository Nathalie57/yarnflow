-- Migration: Ajout des notes d'utilisation de patrons
-- Permet aux utilisateurs PRO de noter leurs adaptations (aiguilles, modifications, fils substitués...)
-- Version: 0.17.3
-- Date: 2026-04-11

CREATE TABLE IF NOT EXISTS pattern_usage_notes (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  pattern_library_id INT UNSIGNED NOT NULL,
  project_id      INT UNSIGNED DEFAULT NULL COMMENT 'Projet associé (optionnel)',
  note            TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_pattern (user_id, pattern_library_id),
  INDEX idx_project (project_id),

  CONSTRAINT fk_pun_user    FOREIGN KEY (user_id)            REFERENCES users(id)            ON DELETE CASCADE,
  CONSTRAINT fk_pun_pattern FOREIGN KEY (pattern_library_id) REFERENCES pattern_library(id)  ON DELETE CASCADE,
  CONSTRAINT fk_pun_project FOREIGN KEY (project_id)         REFERENCES projects(id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
