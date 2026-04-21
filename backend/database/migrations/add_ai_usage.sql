-- Migration: table de suivi d'usage de l'assistant IA
-- PLUS : 50 messages/mois, PRO : 150 messages/mois

CREATE TABLE IF NOT EXISTS ai_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    month VARCHAR(7) NOT NULL COMMENT 'Format YYYY-MM',
    count INT NOT NULL DEFAULT 0,
    UNIQUE KEY unique_user_month (user_id, month),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
