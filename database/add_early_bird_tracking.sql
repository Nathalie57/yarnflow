-- ============================================================================
-- YarnFlow v0.12.0 - Tracking Early Bird (200 places limitées)
-- @author [AI:Claude]
-- @date 2025-11-29
-- @description Système de compteur pour limiter Early Bird à 200 souscriptions
-- ============================================================================

-- [AI:Claude] Table de configuration pour Early Bird
CREATE TABLE IF NOT EXISTS `early_bird_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `max_slots` INT UNSIGNED NOT NULL DEFAULT 200 COMMENT 'Nombre maximum de places Early Bird',
  `current_slots` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Nombre de places utilisées',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Early Bird encore disponible',
  `started_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Date de lancement Early Bird',
  `closed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Date de fermeture Early Bird',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Configuration Early Bird offre limitée';

-- [AI:Claude] Initialiser la config Early Bird
INSERT INTO `early_bird_config` (max_slots, current_slots, is_active, started_at)
VALUES (200, 0, TRUE, NOW());

-- [AI:Claude] Table pour traquer les souscriptions Early Bird
CREATE TABLE IF NOT EXISTS `early_bird_subscriptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `slot_number` INT UNSIGNED NOT NULL COMMENT 'Numéro de place (1-200)',
  `stripe_customer_id` VARCHAR(255) DEFAULT NULL,
  `stripe_subscription_id` VARCHAR(255) DEFAULT NULL,
  `subscribed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Fin des 12 mois Early Bird',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  UNIQUE KEY `unique_slot` (`slot_number`),
  KEY `idx_stripe_sub` (`stripe_subscription_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_early_bird_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Tracking des souscriptions Early Bird';

-- ============================================================================
-- TRIGGERS AUTOMATIQUES
-- ============================================================================

-- [AI:Claude] Trigger : Incrémenter le compteur lors d'une souscription Early Bird
DELIMITER //
CREATE TRIGGER `increment_early_bird_slot` AFTER INSERT ON `early_bird_subscriptions`
FOR EACH ROW
BEGIN
    UPDATE `early_bird_config`
    SET current_slots = current_slots + 1,
        is_active = (current_slots + 1 < max_slots)
    WHERE id = 1;
END//
DELIMITER ;

-- [AI:Claude] Trigger : Décrémenter le compteur si annulation
DELIMITER //
CREATE TRIGGER `decrement_early_bird_slot` AFTER UPDATE ON `early_bird_subscriptions`
FOR EACH ROW
BEGIN
    IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
        UPDATE `early_bird_config`
        SET current_slots = current_slots - 1,
            is_active = TRUE
        WHERE id = 1;
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- [AI:Claude] Vue : Statistiques Early Bird
CREATE OR REPLACE VIEW `v_early_bird_stats` AS
SELECT
    c.max_slots,
    c.current_slots,
    (c.max_slots - c.current_slots) as remaining_slots,
    c.is_active,
    c.started_at,
    c.closed_at,
    COUNT(s.id) as total_subscriptions,
    SUM(CASE WHEN s.is_active = TRUE THEN 1 ELSE 0 END) as active_subscriptions,
    SUM(CASE WHEN s.is_active = FALSE THEN 1 ELSE 0 END) as cancelled_subscriptions
FROM early_bird_config c
LEFT JOIN early_bird_subscriptions s ON s.slot_number <= c.max_slots
WHERE c.id = 1
GROUP BY c.id;

-- [AI:Claude] Vue : Liste des Early Birds actifs
CREATE OR REPLACE VIEW `v_early_bird_active_users` AS
SELECT
    s.slot_number,
    s.user_id,
    u.email,
    u.first_name,
    u.last_name,
    s.subscribed_at,
    s.expires_at,
    DATEDIFF(s.expires_at, NOW()) as days_remaining
FROM early_bird_subscriptions s
INNER JOIN users u ON u.id = s.user_id
WHERE s.is_active = TRUE
ORDER BY s.slot_number ASC;

-- ============================================================================
-- TESTS ET VÉRIFICATIONS
-- ============================================================================

-- [AI:Claude] Vérifier la config
SELECT * FROM early_bird_config;

-- [AI:Claude] Voir les stats
SELECT * FROM v_early_bird_stats;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================
-- 1. Avant de créer un abonnement Early Bird, vérifier :
--    SELECT is_active, (max_slots - current_slots) FROM early_bird_config WHERE id = 1;
--
-- 2. Créer une souscription Early Bird :
--    INSERT INTO early_bird_subscriptions (user_id, slot_number, expires_at)
--    VALUES (123, (SELECT current_slots + 1 FROM early_bird_config), DATE_ADD(NOW(), INTERVAL 12 MONTH));
--
-- 3. Annuler une souscription :
--    UPDATE early_bird_subscriptions SET is_active = FALSE, cancelled_at = NOW() WHERE user_id = 123;
--
-- 4. Fermer définitivement l'Early Bird :
--    UPDATE early_bird_config SET is_active = FALSE, closed_at = NOW() WHERE id = 1;
-- ============================================================================
