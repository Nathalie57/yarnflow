-- Migration: Système de feedback et remboursement photos IA
-- Version: 0.15.0
-- Date: 2025-12-19
-- Author: Nathalie + Claude

-- Table pour stocker les feedbacks utilisateurs sur les photos IA
CREATE TABLE IF NOT EXISTS photo_feedback (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    photo_id INT UNSIGNED NOT NULL,
    satisfied BOOLEAN NOT NULL COMMENT '1 = satisfait, 0 = insatisfait',
    refund_granted BOOLEAN DEFAULT FALSE COMMENT 'Crédit remboursé automatiquement',
    comment TEXT DEFAULT NULL COMMENT 'Commentaire optionnel de l\'utilisateur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE CASCADE,

    -- Index pour recherches rapides
    INDEX idx_user_feedback (user_id, created_at DESC),
    INDEX idx_photo_feedback (photo_id),
    INDEX idx_satisfaction (satisfied, created_at DESC),

    -- Un seul feedback par photo
    UNIQUE KEY unique_photo_feedback (photo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaire table
ALTER TABLE photo_feedback COMMENT = 'Feedback utilisateurs sur photos IA générées avec système de remboursement';

-- Table pour logger les remboursements (analytics)
CREATE TABLE IF NOT EXISTS credit_refunds (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    photo_id INT UNSIGNED NOT NULL,
    feedback_id INT UNSIGNED NOT NULL,
    credits_refunded INT UNSIGNED DEFAULT 1,
    reason VARCHAR(255) DEFAULT 'Génération insatisfaisante',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE CASCADE,
    FOREIGN KEY (feedback_id) REFERENCES photo_feedback(id) ON DELETE CASCADE,

    -- Index pour vérifier limite mensuelle
    INDEX idx_user_refunds_month (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commentaire table
ALTER TABLE credit_refunds COMMENT = 'Historique des remboursements de crédits photos pour analytics';
