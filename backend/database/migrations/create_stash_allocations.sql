-- Migration : Table de liaison projets ↔ stock de laine (Phase 3)
-- Permet de réserver des pelotes pour un projet et de gérer les restes à la clôture.

CREATE TABLE IF NOT EXISTS stash_allocations (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id          INT UNSIGNED NOT NULL,
  stash_entry_id      INT UNSIGNED NOT NULL,
  quantity_reserved   INT UNSIGNED NOT NULL DEFAULT 1,
  quantity_used       DECIMAL(5,1)          DEFAULT NULL,  -- renseigné à la clôture du projet
  created_at          TIMESTAMP             DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP             DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_project_stash (project_id, stash_entry_id),
  FOREIGN KEY (project_id)     REFERENCES projects(id)    ON DELETE CASCADE,
  FOREIGN KEY (stash_entry_id) REFERENCES yarn_stash(id)  ON DELETE CASCADE,
  INDEX idx_project   (project_id),
  INDEX idx_stash     (stash_entry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
