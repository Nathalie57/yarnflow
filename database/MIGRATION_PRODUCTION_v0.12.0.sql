-- ============================================================================
-- YarnFlow v0.12.0 - MIGRATION PRODUCTION SÉCURISÉE
-- @date 2025-11-29
-- @description Migration pour aligner code avec landing page
-- @users_existants 10 utilisateurs inscrits
-- ============================================================================

-- ⚠️ IMPORTANT : FAIRE UN BACKUP COMPLET AVANT D'EXÉCUTER
-- Dans phpMyAdmin : Onglet "Exporter" → Format SQL → "Exécuter"
-- Sauvegarder le fichier najo1022_yarnflow_backup_20251129.sql

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- ============================================================================
-- PARTIE 1 : BACKUP AUTOMATIQUE DES DONNÉES CRITIQUES
-- ============================================================================

-- [AI:Claude] Créer table de backup des users
CREATE TABLE IF NOT EXISTS `users_backup_v0_12_0` LIKE `users`;
INSERT INTO `users_backup_v0_12_0` SELECT * FROM `users`;

-- [AI:Claude] Vérification backup
SELECT
    'BACKUP USERS' as action,
    COUNT(*) as total_users,
    NOW() as backup_date
FROM users_backup_v0_12_0;

-- ============================================================================
-- PARTIE 2 : MISE À JOUR DU SCHEMA subscription_type
-- ============================================================================

-- [AI:Claude] Vérifier les subscription_type actuels
SELECT
    subscription_type,
    COUNT(*) as count
FROM users
GROUP BY subscription_type;

-- [AI:Claude] Modifier l'ENUM pour ajouter les nouveaux types
ALTER TABLE `users`
MODIFY COLUMN `subscription_type` ENUM(
    'free',
    'pro',
    'pro_annual',
    'early_bird',
    -- Legacy support (conservés pour compatibilité)
    'monthly',
    'yearly',
    'starter',
    'standard',
    'premium'
) NOT NULL DEFAULT 'free';

-- [AI:Claude] Vérification après modification
SHOW COLUMNS FROM users LIKE 'subscription_type';

-- ============================================================================
-- PARTIE 3 : CRÉATION DES TABLES EARLY BIRD
-- ============================================================================

-- [AI:Claude] Table de configuration Early Bird
CREATE TABLE IF NOT EXISTS `early_bird_config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `max_slots` INT UNSIGNED NOT NULL DEFAULT 200,
  `current_slots` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `closed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [AI:Claude] Initialiser la config (seulement si vide)
INSERT INTO `early_bird_config` (max_slots, current_slots, is_active, started_at)
SELECT 200, 0, TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM early_bird_config LIMIT 1);

-- [AI:Claude] Table de tracking Early Bird
CREATE TABLE IF NOT EXISTS `early_bird_subscriptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `slot_number` INT UNSIGNED NOT NULL,
  `stripe_customer_id` VARCHAR(255) DEFAULT NULL,
  `stripe_subscription_id` VARCHAR(255) DEFAULT NULL,
  `subscribed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  UNIQUE KEY `unique_slot` (`slot_number`),
  KEY `idx_stripe_sub` (`stripe_subscription_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `fk_early_bird_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTIE 4 : TRIGGERS AUTOMATIQUES EARLY BIRD
-- ============================================================================

-- [AI:Claude] Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS `increment_early_bird_slot`;
DROP TRIGGER IF EXISTS `decrement_early_bird_slot`;

-- [AI:Claude] Trigger : Incrémenter le compteur
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

-- [AI:Claude] Trigger : Décrémenter si annulation
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
-- PARTIE 5 : VUES UTILES
-- ============================================================================

-- [AI:Claude] Vue : Stats Early Bird
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

-- [AI:Claude] Vue : Early Birds actifs
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
-- PARTIE 6 : VÉRIFICATIONS FINALES
-- ============================================================================

-- [AI:Claude] Vérifier que les users sont intacts
SELECT
    'USERS VERIFICATION' as check_name,
    COUNT(*) as total,
    COUNT(CASE WHEN subscription_type = 'free' THEN 1 END) as free_users,
    COUNT(CASE WHEN subscription_type != 'free' THEN 1 END) as paying_users
FROM users;

-- [AI:Claude] Vérifier Early Bird config
SELECT
    'EARLY BIRD CONFIG' as check_name,
    max_slots,
    current_slots,
    is_active,
    started_at
FROM early_bird_config WHERE id = 1;

-- [AI:Claude] Vérifier les triggers
SELECT
    'TRIGGERS' as check_name,
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
AND TRIGGER_NAME LIKE '%early_bird%';

-- ============================================================================
-- PARTIE 7 : INSTRUCTIONS POST-MIGRATION
-- ============================================================================

/*
✅ MIGRATION TERMINÉE AVEC SUCCÈS !

🔍 VÉRIFICATIONS À FAIRE :
1. Vérifier que tous les users sont présents :
   SELECT COUNT(*) FROM users;

2. Comparer avec le backup :
   SELECT COUNT(*) FROM users_backup_v0_12_0;

3. Vérifier Early Bird :
   SELECT * FROM v_early_bird_stats;

📝 NOTES :
- Backup sauvegardé dans : users_backup_v0_12_0
- 10 utilisateurs existants préservés
- Nouveaux types d'abonnement disponibles : pro, pro_annual, early_bird
- Triggers actifs pour Early Bird
- Compteur initialisé : 0/200 places

🚨 EN CAS DE PROBLÈME :
Restaurer depuis le backup :
   TRUNCATE TABLE users;
   INSERT INTO users SELECT * FROM users_backup_v0_12_0;

Ou restaurer depuis le fichier complet phpMyAdmin.
*/

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;

-- ============================================================================
-- FIN DE LA MIGRATION v0.12.0
-- ============================================================================
