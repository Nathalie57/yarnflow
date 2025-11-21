/**
 * @file add_ai_photo_studio.sql
 * @brief Migration AI Photo Studio pour Yarn Hub v0.10.0
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Ajout système photos IA + crédits
 *
 * @description
 * Ajoute la fonctionnalité AI Photo Studio :
 * - Galerie universelle (projets tracker + photos libres)
 * - Système de crédits photos (mensuels + achetés)
 * - Génération photos IA via Gemini
 */

-- ============================================================================
-- TABLE: user_photos - Photos d'ouvrages (tracker + galerie libre)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_photos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL = photo galerie hors tracker',

    -- Fichiers
    original_path VARCHAR(255) NOT NULL,
    enhanced_path VARCHAR(255) DEFAULT NULL COMMENT 'Photo générée par IA',
    thumbnail_path VARCHAR(255) DEFAULT NULL,

    -- Métadonnées création
    item_name VARCHAR(255) DEFAULT NULL COMMENT 'Ex: Mon pull rouge',
    item_type VARCHAR(100) DEFAULT NULL COMMENT 'bonnet, pull, amigurumi...',
    technique ENUM('crochet', 'tricot', 'autre') DEFAULT NULL,
    description TEXT DEFAULT NULL,

    -- Paramètres génération IA
    ai_style VARCHAR(50) DEFAULT NULL COMMENT 'lifestyle, studio, scandinavian...',
    ai_purpose VARCHAR(50) DEFAULT NULL COMMENT 'instagram, etsy, portfolio',
    ai_prompt_used TEXT DEFAULT NULL,
    ai_generated_at TIMESTAMP DEFAULT NULL,

    -- Organisation
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Partage galerie communautaire',
    tags JSON DEFAULT NULL COMMENT '["hiver", "cadeau", "débutant"]',

    -- Tracking
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_project (project_id),
    INDEX idx_public (is_public, created_at),
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Photos d\'ouvrages avec support IA - v0.10.0';

-- ============================================================================
-- TABLE: user_photo_credits - Crédits photos IA par utilisateur
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_photo_credits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,

    -- Crédits actuels
    monthly_credits INT DEFAULT 0 COMMENT 'Crédits inclus dans abonnement',
    purchased_credits INT DEFAULT 0 COMMENT 'Crédits achetés permanents',

    -- Tracking utilisation
    credits_used_this_month INT DEFAULT 0,
    total_credits_used INT DEFAULT 0 COMMENT 'Historique total',
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Crédits photos IA - v0.10.0';

-- ============================================================================
-- TABLE: credit_purchases - Historique achats crédits
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_purchases (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,

    -- Achat
    pack_type ENUM('small', 'medium', 'large') NOT NULL COMMENT 'Taille du pack',
    amount DECIMAL(10,2) NOT NULL COMMENT 'Prix payé en euros',
    credits_purchased INT NOT NULL COMMENT 'Crédits de base',
    bonus_credits INT DEFAULT 0 COMMENT 'Crédits bonus',
    total_credits INT NOT NULL COMMENT 'Total = purchased + bonus',

    -- Paiement
    payment_method ENUM('stripe', 'paypal') DEFAULT 'stripe',
    stripe_payment_intent_id VARCHAR(255) DEFAULT NULL,
    stripe_charge_id VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_stripe_payment (stripe_payment_intent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique achats packs crédits - v0.10.0';

-- ============================================================================
-- TABLE: photo_generations_log - Audit trail générations IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS photo_generations_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    photo_id INT UNSIGNED DEFAULT NULL,

    -- Crédits
    credits_used INT DEFAULT 1,
    credit_type ENUM('monthly', 'purchased') NOT NULL,

    -- Génération IA
    ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
    ai_style VARCHAR(50) DEFAULT NULL,
    ai_purpose VARCHAR(50) DEFAULT NULL,
    generation_time_ms INT DEFAULT NULL COMMENT 'Temps de génération en ms',

    -- Résultat
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES user_photos(id) ON DELETE SET NULL,
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log générations photos IA - v0.10.0';

-- ============================================================================
-- INITIALISATION: Crédits par défaut pour utilisateurs existants
-- ============================================================================

-- [AI:Claude] Donner crédits initiaux à tous les utilisateurs existants
INSERT INTO user_photo_credits (user_id, monthly_credits, last_reset_at)
SELECT
    id,
    CASE subscription_type
        WHEN 'free' THEN 3
        WHEN 'starter' THEN 10
        WHEN 'premium' THEN 25
        ELSE 3
    END as monthly_credits,
    NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_photo_credits);

-- ============================================================================
-- TRIGGER: Attribution crédits aux nouveaux utilisateurs
-- ============================================================================

DELIMITER //

CREATE TRIGGER IF NOT EXISTS after_user_insert_credits
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    -- [AI:Claude] Attribuer crédits mensuels selon le plan
    DECLARE initial_credits INT DEFAULT 3;

    IF NEW.subscription_type = 'starter' THEN
        SET initial_credits = 10;
    ELSEIF NEW.subscription_type = 'premium' THEN
        SET initial_credits = 25;
    END IF;

    INSERT INTO user_photo_credits (user_id, monthly_credits, last_reset_at)
    VALUES (NEW.id, initial_credits, NOW());
END//

DELIMITER ;

-- ============================================================================
-- EVENT: Reset automatique crédits mensuels
-- ============================================================================

-- [AI:Claude] Vérifier si l'event scheduler est activé
SET GLOBAL event_scheduler = ON;

-- [AI:Claude] Event quotidien pour reset mensuel
CREATE EVENT IF NOT EXISTS reset_monthly_photo_credits
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    UPDATE user_photo_credits upc
    JOIN users u ON u.id = upc.user_id
    SET
        upc.monthly_credits = CASE u.subscription_type
            WHEN 'free' THEN 3
            WHEN 'starter' THEN 10
            WHEN 'premium' THEN 25
            ELSE 3
        END,
        upc.credits_used_this_month = 0,
        upc.last_reset_at = NOW()
    WHERE MONTH(upc.last_reset_at) != MONTH(NOW());

-- ============================================================================
-- COMMENTAIRE FINAL
-- ============================================================================

/**
 * Migration terminée avec succès ! ✅
 *
 * Tables créées :
 * - user_photos : Galerie universelle (tracker + libre)
 * - user_photo_credits : Système de crédits
 * - credit_purchases : Achats de packs
 * - photo_generations_log : Audit trail
 *
 * Automatisations :
 * - Trigger : Attribution crédits nouveaux users
 * - Event : Reset mensuel automatique
 *
 * Quotas par plan :
 * - FREE: 3 crédits/mois
 * - Starter: 10 crédits/mois
 * - Premium: 25 crédits/mois
 *
 * Prochaine étape : Implémenter backend PHP
 */

-- [AI:Claude] AI Photo Studio ready! 📸✨
