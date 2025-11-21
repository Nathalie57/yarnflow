-- ============================================================================
-- Migration: Système de crédits photos IA (v0.11.0 - AI Photo Studio)
-- Auteur: Nathalie + AI Assistants
-- Date: 2025-11-18
-- Description: Tables pour gérer les crédits photos IA (mensuels + achetés)
-- ============================================================================

-- [AI:Claude] Table principale des crédits utilisateur
CREATE TABLE IF NOT EXISTS user_photo_credits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,

    -- [AI:Claude] Crédits actuels
    monthly_credits INT UNSIGNED DEFAULT 0 COMMENT 'Crédits inclus dans abonnement (reset chaque mois)',
    purchased_credits INT UNSIGNED DEFAULT 0 COMMENT 'Crédits achetés (permanents)',

    -- [AI:Claude] Statistiques d'utilisation
    credits_used_this_month INT UNSIGNED DEFAULT 0 COMMENT 'Crédits utilisés ce mois-ci',
    total_credits_used INT UNSIGNED DEFAULT 0 COMMENT 'Total crédits utilisés depuis le début',

    -- [AI:Claude] Tracking
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Date du dernier reset mensuel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id),
    INDEX idx_user_credits (user_id, monthly_credits, purchased_credits)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Crédits photos IA par utilisateur (v0.11.0)';

-- [AI:Claude] Table des achats de packs de crédits
CREATE TABLE IF NOT EXISTS credit_purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,

    -- [AI:Claude] Détails du pack acheté
    pack_type VARCHAR(20) NOT NULL COMMENT 'small, medium, large',
    amount DECIMAL(10,2) NOT NULL COMMENT 'Prix payé en euros',
    credits_purchased INT UNSIGNED NOT NULL COMMENT 'Crédits de base du pack',
    bonus_credits INT UNSIGNED DEFAULT 0 COMMENT 'Crédits bonus',
    total_credits INT UNSIGNED NOT NULL COMMENT 'Total (purchased + bonus)',

    -- [AI:Claude] Paiement
    payment_method VARCHAR(20) DEFAULT 'stripe' COMMENT 'stripe, paypal, etc.',
    stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
    stripe_charge_id VARCHAR(255) DEFAULT NULL,

    -- [AI:Claude] Statut
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',

    -- [AI:Claude] Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_stripe_payment (stripe_payment_intent_id),
    INDEX idx_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique achats packs crédits photos IA (v0.11.0)';

-- [AI:Claude] Table de log des générations IA (audit trail)
CREATE TABLE IF NOT EXISTS photo_generations_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    photo_id INT UNSIGNED DEFAULT NULL COMMENT 'Photo embellie (peut être NULL si supprimée)',

    -- [AI:Claude] Consommation
    credits_used INT UNSIGNED DEFAULT 1 COMMENT 'Nombre de crédits consommés',
    credit_type ENUM('monthly', 'purchased') NOT NULL COMMENT 'Type de crédit utilisé',

    -- [AI:Claude] Détails génération
    ai_model VARCHAR(50) DEFAULT 'gemini-2.5-flash-image' COMMENT 'Modèle IA utilisé',
    style VARCHAR(50) DEFAULT NULL COMMENT 'Style demandé (lifestyle, studio...)',
    purpose VARCHAR(50) DEFAULT NULL COMMENT 'Usage (instagram, etsy...)',
    prompt TEXT DEFAULT NULL COMMENT 'Prompt envoyé à l\'IA',

    -- [AI:Claude] Performance
    generation_time_ms INT UNSIGNED DEFAULT NULL COMMENT 'Temps de génération en ms',

    -- [AI:Claude] Résultat
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL,

    -- [AI:Claude] Date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_photo (photo_id),
    INDEX idx_success (success, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail générations photos IA (v0.11.0)';

-- ============================================================================
-- [AI:Claude] Initialisation des crédits pour les utilisateurs existants
-- ============================================================================

-- [AI:Claude] Créer les entrées de crédits pour tous les utilisateurs existants
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
WHERE id NOT IN (SELECT user_id FROM user_photo_credits)
ON DUPLICATE KEY UPDATE
    monthly_credits = CASE
        WHEN users.subscription_type = 'free' THEN 3
        WHEN users.subscription_type = 'monthly' THEN 30
        WHEN users.subscription_type = 'yearly' THEN 120
        ELSE 3
    END;

-- ============================================================================
-- [AI:Claude] Trigger pour initialiser les crédits des nouveaux utilisateurs
-- ============================================================================

DELIMITER //

DROP TRIGGER IF EXISTS init_user_photo_credits//

CREATE TRIGGER init_user_photo_credits
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE initial_credits INT DEFAULT 3;

    -- [AI:Claude] Définir le quota selon le type d'abonnement
    IF NEW.subscription_type = 'monthly' THEN
        SET initial_credits = 30;
    ELSEIF NEW.subscription_type = 'yearly' THEN
        SET initial_credits = 120;
    ELSE
        SET initial_credits = 3; -- FREE
    END IF;

    -- [AI:Claude] Créer l'entrée de crédits
    INSERT INTO user_photo_credits (user_id, monthly_credits, last_reset_at)
    VALUES (NEW.id, initial_credits, NOW());
END//

DELIMITER ;

-- ============================================================================
-- [AI:Claude] Event pour reset automatique mensuel des crédits
-- ============================================================================

-- [AI:Claude] Activer le scheduler d'events MySQL
SET GLOBAL event_scheduler = ON;

-- [AI:Claude] Event qui tourne chaque jour à 00h00 pour reset les crédits mensuels
DROP EVENT IF EXISTS reset_monthly_photo_credits;

CREATE EVENT reset_monthly_photo_credits
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    -- [AI:Claude] Reset les crédits mensuels pour les users dont le dernier reset date de >= 1 mois
    UPDATE user_photo_credits upc
    INNER JOIN users u ON u.id = upc.user_id
    SET
        upc.monthly_credits = CASE
            WHEN u.subscription_type = 'free' THEN 3
            WHEN u.subscription_type = 'monthly' THEN 30
            WHEN u.subscription_type = 'yearly' THEN 120
            ELSE 3
        END,
        upc.credits_used_this_month = 0,
        upc.last_reset_at = NOW()
    WHERE
        (YEAR(NOW()) > YEAR(upc.last_reset_at) OR
         (YEAR(NOW()) = YEAR(upc.last_reset_at) AND MONTH(NOW()) > MONTH(upc.last_reset_at)));

    -- [AI:Claude] Logger le nombre de resets effectués (optionnel)
    -- SELECT CONCAT('Reset mensuel : ', ROW_COUNT(), ' utilisateurs mis à jour') as log_message;
END;

-- ============================================================================
-- [AI:Claude] Vues utiles pour reporting
-- ============================================================================

-- [AI:Claude] Vue : Crédits disponibles par utilisateur avec infos abonnement
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

-- [AI:Claude] Vue : Statistiques de génération par utilisateur
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

-- ============================================================================
-- [AI:Claude] Index de performance supplémentaires
-- ============================================================================

-- [AI:Claude] Index pour optimiser les requêtes fréquentes
ALTER TABLE photo_generations_log
ADD INDEX idx_user_success_date (user_id, success, created_at);

ALTER TABLE credit_purchases
ADD INDEX idx_user_status_date (user_id, status, created_at);

-- ============================================================================
-- Migration terminée avec succès
-- ============================================================================

SELECT '✅ Migration add_photo_credits_system.sql terminée avec succès !' as status;
SELECT CONCAT('👤 ', COUNT(*), ' utilisateurs initialisés avec des crédits') as result
FROM user_photo_credits;
