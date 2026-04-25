-- ============================================================================
-- MIGRATION STAGING v0.17.0 - YarnFlow
-- Date: 2026-04-24
-- Description: Smart Project Creator (création intelligente depuis PDF/URL/bibliothèque)
-- À exécuter via phpMyAdmin sur la base staging AVANT de tester
-- ============================================================================

-- 1. Colonnes techniques dans la table projects
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS craft_type    VARCHAR(20)   NULL AFTER type,
    ADD COLUMN IF NOT EXISTS source_type   VARCHAR(20)   NULL AFTER pattern_notes,
    ADD COLUMN IF NOT EXISTS source_url    VARCHAR(1000) NULL AFTER source_type,
    ADD COLUMN IF NOT EXISTS gauge_stitches INT           NULL AFTER hook_size,
    ADD COLUMN IF NOT EXISTS gauge_rows     INT           NULL AFTER gauge_stitches,
    ADD COLUMN IF NOT EXISTS gauge_size_cm  INT           NULL AFTER gauge_rows;

-- 2. Table des imports IA
CREATE TABLE IF NOT EXISTS ai_pattern_imports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED DEFAULT NULL,
    source_type ENUM('pdf', 'url', 'library') NOT NULL,
    source_name VARCHAR(500) NOT NULL,
    file_size_bytes INT DEFAULT NULL,
    ai_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
    ai_response_json JSON DEFAULT NULL,
    processing_time_ms INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_source_type (source_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Mise à jour si la table existait déjà (ancien ENUM sans 'library', colonne ip_address absente)
ALTER TABLE ai_pattern_imports
    MODIFY COLUMN source_type ENUM('pdf', 'url', 'library') NOT NULL,
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) DEFAULT NULL;

SELECT 'Migration v0.17.0 OK' AS status;
