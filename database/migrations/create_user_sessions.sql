CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    started_at DATETIME NOT NULL,
    last_activity_at DATETIME NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity_at)
);
