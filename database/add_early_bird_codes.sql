-- ============================================================================
-- YarnFlow - Codes Early Bird pour Waitlist
-- @date 2025-11-30
-- @description Système de codes uniques pour accès prioritaire Early Bird
-- ============================================================================

-- Ajouter colonne d'éligibilité Early Bird dans la table users
ALTER TABLE `users`
ADD COLUMN IF NOT EXISTS `early_bird_eligible_until` TIMESTAMP NULL DEFAULT NULL AFTER `subscription_expires_at`,
ADD INDEX `idx_early_bird_eligible` (`early_bird_eligible_until`);

-- Table des codes Early Bird pour les inscrits waitlist
CREATE TABLE IF NOT EXISTS `early_bird_codes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `used_by_user_id` INT UNSIGNED NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`),
  KEY `idx_email` (`email`),
  KEY `idx_expires` (`expires_at`),
  KEY `idx_used` (`is_used`),
  CONSTRAINT `fk_code_user` FOREIGN KEY (`used_by_user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vue : Codes actifs (non utilisés et non expirés)
CREATE OR REPLACE VIEW `v_early_bird_codes_active` AS
SELECT
    id,
    email,
    code,
    expires_at,
    DATEDIFF(expires_at, NOW()) as days_remaining,
    TIMESTAMPDIFF(HOUR, NOW(), expires_at) as hours_remaining
FROM early_bird_codes
WHERE is_used = FALSE
  AND expires_at > NOW()
ORDER BY created_at ASC;

-- Vue : Stats codes Early Bird
CREATE OR REPLACE VIEW `v_early_bird_codes_stats` AS
SELECT
    COUNT(*) as total_codes,
    SUM(CASE WHEN is_used = TRUE THEN 1 ELSE 0 END) as used_codes,
    SUM(CASE WHEN is_used = FALSE AND expires_at > NOW() THEN 1 ELSE 0 END) as active_codes,
    SUM(CASE WHEN is_used = FALSE AND expires_at <= NOW() THEN 1 ELSE 0 END) as expired_codes
FROM early_bird_codes;

-- Index pour performance
CREATE INDEX idx_code_validation ON early_bird_codes(code, is_used, expires_at);

/*
✅ TABLE CRÉÉE AVEC SUCCÈS !

📋 UTILISATION :

1. Générer des codes pour tous les waitlist :
   Via l'endpoint admin : POST /api/admin/early-bird/generate-codes

2. Vérifier les codes actifs :
   SELECT * FROM v_early_bird_codes_active;

3. Stats globales :
   SELECT * FROM v_early_bird_codes_stats;

4. Trouver le code d'une personne :
   SELECT code, expires_at FROM early_bird_codes WHERE email = 'user@example.com';
*/
