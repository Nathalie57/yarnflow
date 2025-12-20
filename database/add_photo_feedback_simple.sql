-- Migration: Système de notation simple pour photos IA (étoiles 1-5)
-- Version: 0.15.0
-- Date: 2025-12-19
-- Author: Nathalie + Claude

-- Table pour stocker les notes et commentaires des utilisateurs
CREATE TABLE IF NOT EXISTS photo_feedback (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    photo_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL COMMENT 'Note de 1 à 5 étoiles',
    comment TEXT DEFAULT NULL COMMENT 'Commentaire optionnel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE CASCADE,

    -- Index pour recherches rapides
    INDEX idx_user_feedback (user_id, created_at DESC),
    INDEX idx_photo_feedback (photo_id),
    INDEX idx_rating (rating, created_at DESC),

    -- Un seul feedback par photo
    UNIQUE KEY unique_photo_feedback (photo_id),

    -- Contrainte : rating doit être entre 1 et 5
    CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notes et commentaires sur photos IA générées (1-5 étoiles)';
