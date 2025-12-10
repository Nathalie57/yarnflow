-- ============================================================================
-- Ajout du support OAuth (Google, Facebook) pour l'authentification
-- @date 2025-12-05
-- @description Support inscription/connexion via Google et Facebook
-- ============================================================================

-- [AI:Claude] Modifier la table users pour supporter OAuth
ALTER TABLE `users`
ADD COLUMN `oauth_provider` ENUM('google', 'facebook') NULL AFTER `password`,
ADD COLUMN `oauth_provider_id` VARCHAR(255) NULL AFTER `oauth_provider`,
ADD COLUMN `oauth_avatar` VARCHAR(500) NULL AFTER `oauth_provider_id`,
MODIFY COLUMN `password` VARCHAR(255) NULL;

-- [AI:Claude] Index pour recherche rapide par provider
ALTER TABLE `users`
ADD UNIQUE INDEX `idx_oauth_provider` (`oauth_provider`, `oauth_provider_id`);

-- [AI:Claude] Index pour recherche par email (déjà existant normalement, mais on s'assure)
ALTER TABLE `users`
ADD INDEX IF NOT EXISTS `idx_email` (`email`);

-- [AI:Claude] Vérification
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('oauth_provider', 'oauth_provider_id', 'oauth_avatar', 'password')
ORDER BY ORDINAL_POSITION;
