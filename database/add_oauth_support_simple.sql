-- ============================================================================
-- Ajout du support OAuth (Google, Facebook) pour l'authentification
-- @date 2025-12-05
-- @description Support inscription/connexion via Google et Facebook
-- VERSION SIMPLIFIÉE POUR O2SWITCH (sans vérification INFORMATION_SCHEMA)
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

-- [AI:Claude] Success message
SELECT 'Migration OAuth terminée avec succès !' AS message;
