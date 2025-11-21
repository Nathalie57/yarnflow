-- Table credits utilisateur
CREATE TABLE IF NOT EXISTS user_photo_credits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    monthly_credits INT UNSIGNED DEFAULT 0,
    purchased_credits INT UNSIGNED DEFAULT 0,
    credits_used_this_month INT UNSIGNED DEFAULT 0,
    total_credits_used INT UNSIGNED DEFAULT 0,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id),
    INDEX idx_user_credits (user_id, monthly_credits, purchased_credits)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table achats credits
CREATE TABLE IF NOT EXISTS credit_purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    pack_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    credits_purchased INT UNSIGNED NOT NULL,
    bonus_credits INT UNSIGNED DEFAULT 0,
    total_credits INT UNSIGNED NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'stripe',
    stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
    stripe_charge_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_stripe_payment (stripe_payment_intent_id),
    INDEX idx_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table log generations
CREATE TABLE IF NOT EXISTS photo_generations_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    photo_id INT UNSIGNED DEFAULT NULL,
    credits_used INT UNSIGNED DEFAULT 1,
    credit_type ENUM('monthly', 'purchased') NOT NULL,
    ai_model VARCHAR(50) DEFAULT 'gemini-2.5-flash-image',
    style VARCHAR(50) DEFAULT NULL,
    purpose VARCHAR(50) DEFAULT NULL,
    prompt TEXT DEFAULT NULL,
    generation_time_ms INT UNSIGNED DEFAULT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_photo (photo_id),
    INDEX idx_success (success, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialiser credits pour utilisateurs existants
INSERT INTO user_photo_credits (user_id, monthly_credits, last_reset_at)
SELECT
    id,
    CASE
        WHEN subscription_type = 'free' THEN 3
        WHEN subscription_type = 'monthly' THEN 30
        WHEN subscription_type = 'yearly' THEN 120
        ELSE 3
    END as monthly_credits,
    NOW() as last_reset_at
FROM users
WHERE id NOT IN (SELECT user_id FROM user_photo_credits);

-- Vue credits summary
CREATE OR REPLACE VIEW v_user_credits_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.subscription_type,
    upc.monthly_credits,
    upc.purchased_credits,
    (upc.monthly_credits + upc.purchased_credits) as total_available,
    upc.credits_used_this_month,
    upc.total_credits_used,
    upc.last_reset_at,
    DATEDIFF(NOW(), upc.last_reset_at) as days_since_reset
FROM users u
LEFT JOIN user_photo_credits upc ON upc.user_id = u.id;

-- Vue stats generations
CREATE OR REPLACE VIEW v_user_generation_stats AS
SELECT
    user_id,
    COUNT(*) as total_generations,
    SUM(credits_used) as total_credits_consumed,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_generations,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_generations,
    AVG(generation_time_ms) as avg_generation_time_ms,
    MAX(created_at) as last_generation_at
FROM photo_generations_log
GROUP BY user_id;

-- Index supplementaires
ALTER TABLE photo_generations_log ADD INDEX idx_user_success_date (user_id, success, created_at);
ALTER TABLE credit_purchases ADD INDEX idx_user_status_date (user_id, status, created_at);

SELECT 'Migration terminee avec succes!' as status;
