-- ============================================================================
-- Migration: Table user_photos (AI Photo Studio)
-- Description: Crée la table user_photos si elle n'existe pas (pour production)
-- À exécuter AVANT add_photo_credits_system.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_photos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED NULL,

    -- Chemins fichiers
    original_path VARCHAR(500) NOT NULL COMMENT 'Chemin vers la photo originale',
    enhanced_path VARCHAR(500) NULL COMMENT 'Chemin vers la photo IA (NULL si pas encore traitée)',

    -- Métadonnées
    item_name VARCHAR(255) NULL,
    item_type VARCHAR(100) NULL,
    technique VARCHAR(100) NULL,
    description TEXT NULL,

    -- Données IA
    ai_style VARCHAR(100) NULL,
    ai_purpose VARCHAR(100) NULL,
    ai_prompt_used TEXT NULL,
    ai_generated_at TIMESTAMP NULL,

    -- Variation (NULL si photo originale)
    parent_photo_id INT UNSIGNED NULL COMMENT 'ID photo parente si c\'est une variation IA',

    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_photo_id) REFERENCES user_photos(id) ON DELETE SET NULL,

    INDEX idx_user (user_id),
    INDEX idx_project (project_id),
    INDEX idx_user_enhanced (user_id, enhanced_path),
    INDEX idx_parent (parent_photo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Photos utilisateur avec enhancement IA (AI Photo Studio)';

SELECT '✅ Table user_photos créée (ou déjà existante)' as status;
