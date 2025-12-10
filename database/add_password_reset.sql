-- =====================================================
-- Table pour les tokens de réinitialisation de mot de passe
-- Date: 2025-12-07
-- Auteur: Claude
-- =====================================================

CREATE TABLE IF NOT EXISTS password_resets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supprimer automatiquement les tokens expirés de plus de 7 jours
-- (à exécuter via cron job ou manuellement de temps en temps)
-- DELETE FROM password_resets WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
