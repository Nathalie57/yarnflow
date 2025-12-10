-- Table waitlist_emails
CREATE TABLE IF NOT EXISTS waitlist_emails (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    interests TEXT,
    source VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table waitlist_stats
CREATE TABLE IF NOT EXISTS waitlist_stats (
    id INT UNSIGNED PRIMARY KEY DEFAULT 1,
    total_subscribers INT UNSIGNED DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialiser le compteur
INSERT IGNORE INTO waitlist_stats (id, total_subscribers) VALUES (1, 0);
