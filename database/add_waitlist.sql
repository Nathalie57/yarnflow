-- [AI:Claude] YarnFlow v0.12.0 - Waitlist landing page
-- Table pour stocker les inscriptions à la waitlist

CREATE TABLE IF NOT EXISTS waitlist_emails (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) DEFAULT NULL,
    interests TEXT DEFAULT NULL COMMENT 'Intérêts du subscriber (tricot, crochet, etc.)',
    source VARCHAR(100) DEFAULT NULL COMMENT 'Source de la visite (organic, facebook, instagram, etc.)',
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    is_subscribed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Waitlist emails pour le lancement YarnFlow';

-- Compteur d'inscrits (pour affichage dynamique sur landing page)
CREATE TABLE IF NOT EXISTS waitlist_stats (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    total_subscribers INT UNSIGNED DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialiser le compteur
INSERT INTO waitlist_stats (total_subscribers) VALUES (0)
ON DUPLICATE KEY UPDATE total_subscribers = total_subscribers;
