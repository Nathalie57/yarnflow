-- ============================================================================
-- Migration: Bibliothèque de patrons
-- Description: Système centralisé pour gérer les patrons (PDF, images, URLs)
-- Author: AI:Claude
-- Date: 2025-11-19
-- ============================================================================

-- Table pattern_library : bibliothèque centralisée des patrons
CREATE TABLE IF NOT EXISTS pattern_library (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,

    -- Informations de base
    name VARCHAR(255) NOT NULL COMMENT 'Nom du patron',
    description TEXT DEFAULT NULL,

    -- Type et source
    source_type ENUM('file', 'url') NOT NULL COMMENT 'Fichier uploadé ou lien web',
    file_path VARCHAR(500) DEFAULT NULL COMMENT 'Chemin du fichier (PDF/image)',
    file_type ENUM('pdf', 'image') DEFAULT NULL COMMENT 'Type de fichier',
    url VARCHAR(1000) DEFAULT NULL COMMENT 'URL du patron (YouTube, Pinterest, etc.)',

    -- Catégorisation
    category VARCHAR(100) DEFAULT NULL COMMENT 'Vêtements, Accessoires, Maison/Déco, etc.',
    technique ENUM('crochet', 'tricot') DEFAULT NULL,
    difficulty ENUM('facile', 'moyen', 'difficile') DEFAULT NULL,

    -- Métadonnées
    thumbnail_path VARCHAR(500) DEFAULT NULL COMMENT 'Miniature générée',
    tags JSON DEFAULT NULL COMMENT 'Tags pour recherche',
    notes TEXT DEFAULT NULL COMMENT 'Notes personnelles',

    -- Usage
    times_used INT UNSIGNED DEFAULT 0 COMMENT 'Nombre de projets utilisant ce patron',
    last_used_at DATETIME DEFAULT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_user (user_id),
    INDEX idx_category (category),
    INDEX idx_technique (technique),
    INDEX idx_favorite (is_favorite),
    INDEX idx_created (created_at DESC),

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter colonne pattern_library_id à la table projects
ALTER TABLE projects
ADD COLUMN pattern_library_id INT UNSIGNED DEFAULT NULL COMMENT 'Lien vers bibliothèque de patrons' AFTER pattern_id,
ADD INDEX idx_pattern_library (pattern_library_id),
ADD FOREIGN KEY (pattern_library_id) REFERENCES pattern_library(id) ON DELETE SET NULL;

-- Note: Les colonnes pattern_id restent pour les patrons IA générés
-- pattern_library_id est pour les patrons uploadés/importés par l'utilisateur
