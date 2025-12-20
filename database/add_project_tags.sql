-- Migration: Ajout du système de tags pour projets (PLUS/PRO)
-- Version: 0.15.0
-- Date: 2025-12-19
-- Author: Nathalie + Claude

-- Table des tags personnalisés pour projets
CREATE TABLE IF NOT EXISTS project_tags (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    project_id INT UNSIGNED NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT NULL COMMENT 'Couleur hex optionnelle (ex: #667A40)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

    -- Index pour recherche rapide par projet
    INDEX idx_project_tags (project_id, tag_name),

    -- Index pour recherche par tag (suggestions)
    INDEX idx_tag_name (tag_name),

    -- Éviter les doublons de tags sur un même projet
    UNIQUE KEY unique_project_tag (project_id, tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaire table
ALTER TABLE project_tags COMMENT = 'Tags personnalisés pour organisation projets (PLUS/PRO uniquement)';
