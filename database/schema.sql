-- ============================================================================
-- Patron Maker Crochet - Schéma de base de données MySQL
-- @author Nathalie + AI Assistants
-- @created 2025-11-12
-- @modified 2025-11-12 by [AI:Claude] - Création initiale
-- ============================================================================

-- [AI:Claude] Configuration de la base de données
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- [AI:Claude] Utilisation de UTF-8 pour supporter tous les caractères
SET NAMES utf8mb4;

-- ============================================================================
-- Table : users
-- [AI:Claude] Gestion des utilisateurs de l'application
-- ============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL COMMENT '[AI:Claude] Hash bcrypt du mot de passe',
  `first_name` VARCHAR(100) DEFAULT NULL,
  `last_name` VARCHAR(100) DEFAULT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `subscription_type` ENUM('free', 'monthly', 'yearly') NOT NULL DEFAULT 'free',
  `subscription_expires_at` DATETIME DEFAULT NULL COMMENT '[AI:Claude] Date d''expiration de l''abonnement',
  `patterns_generated_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '[AI:Claude] Nombre de patrons générés (quota)',
  `stripe_customer_id` VARCHAR(255) DEFAULT NULL COMMENT '[AI:Claude] ID client Stripe',
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_subscription` (`subscription_type`, `subscription_expires_at`),
  KEY `idx_stripe_customer` (`stripe_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Utilisateurs de l''application';

-- ============================================================================
-- Table : patterns
-- [AI:Claude] Patrons de crochet générés par l'IA
-- ============================================================================
CREATE TABLE IF NOT EXISTS `patterns` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL COMMENT '[AI:Claude] Titre généré automatiquement',
  `level` ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  `type` ENUM('hat', 'scarf', 'amigurumi', 'bag', 'garment') NOT NULL,
  `size` VARCHAR(50) DEFAULT NULL COMMENT '[AI:Claude] Taille demandée (ex: M, L, child)',
  `yarn_weight` VARCHAR(50) DEFAULT NULL COMMENT '[AI:Claude] Épaisseur de fil suggérée',
  `hook_size` VARCHAR(20) DEFAULT NULL COMMENT '[AI:Claude] Taille de crochet recommandée',
  `content` LONGTEXT DEFAULT NULL COMMENT '[AI:Claude] Instructions du patron en markdown',
  `materials` TEXT DEFAULT NULL COMMENT '[AI:Claude] Liste du matériel nécessaire (JSON)',
  `estimated_time` VARCHAR(100) DEFAULT NULL COMMENT '[AI:Claude] Temps estimé de réalisation',
  `status` ENUM('draft', 'generating', 'completed', 'error') NOT NULL DEFAULT 'draft',
  `price_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '[AI:Claude] Prix payé pour ce patron',
  `is_paid` BOOLEAN NOT NULL DEFAULT FALSE,
  `watermark` VARCHAR(255) DEFAULT NULL COMMENT '[AI:Claude] Texte du filigrane (email user)',
  `generation_prompt` TEXT DEFAULT NULL COMMENT '[AI:Claude] Prompt envoyé à l''IA',
  `ai_provider` VARCHAR(50) DEFAULT NULL COMMENT '[AI:Claude] claude ou openai',
  `tokens_used` INT UNSIGNED DEFAULT NULL COMMENT '[AI:Claude] Nombre de tokens consommés',
  `error_message` TEXT DEFAULT NULL COMMENT '[AI:Claude] Message d''erreur si génération échouée',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type_level` (`type`, `level`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_patterns_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Patrons de crochet générés';

-- ============================================================================
-- Table : payments
-- [AI:Claude] Historique des paiements Stripe
-- ============================================================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `pattern_id` INT UNSIGNED DEFAULT NULL COMMENT '[AI:Claude] Lien vers le patron acheté (si achat unique)',
  `stripe_payment_intent_id` VARCHAR(255) DEFAULT NULL,
  `stripe_session_id` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(10, 2) NOT NULL COMMENT '[AI:Claude] Montant en euros',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'EUR',
  `status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `payment_type` ENUM('pattern', 'subscription_monthly', 'subscription_yearly') NOT NULL,
  `metadata` JSON DEFAULT NULL COMMENT '[AI:Claude] Données additionnelles du paiement',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_pattern` (`pattern_id`),
  KEY `idx_stripe_intent` (`stripe_payment_intent_id`),
  KEY `idx_stripe_session` (`stripe_session_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payments_pattern` FOREIGN KEY (`pattern_id`) REFERENCES `patterns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Historique des paiements';

-- ============================================================================
-- Table : api_logs
-- [AI:Claude] Logs des appels à l'API IA pour monitoring et debug
-- ============================================================================
CREATE TABLE IF NOT EXISTS `api_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED DEFAULT NULL,
  `pattern_id` INT UNSIGNED DEFAULT NULL,
  `provider` VARCHAR(50) NOT NULL COMMENT '[AI:Claude] claude ou openai',
  `endpoint` VARCHAR(255) NOT NULL,
  `request_data` JSON DEFAULT NULL COMMENT '[AI:Claude] Données de la requête',
  `response_data` JSON DEFAULT NULL COMMENT '[AI:Claude] Réponse de l''API',
  `tokens_used` INT UNSIGNED DEFAULT NULL,
  `duration_ms` INT UNSIGNED DEFAULT NULL COMMENT '[AI:Claude] Durée en millisecondes',
  `status_code` INT DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_pattern` (`pattern_id`),
  KEY `idx_provider` (`provider`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `fk_api_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_api_logs_pattern` FOREIGN KEY (`pattern_id`) REFERENCES `patterns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Logs des appels API IA';

-- ============================================================================
-- Table : password_resets
-- [AI:Claude] Tokens de réinitialisation de mot de passe
-- ============================================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(255) NOT NULL COMMENT '[AI:Claude] Token unique généré',
  `expires_at` DATETIME NOT NULL,
  `used` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_user` (`user_id`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Tokens de réinitialisation mot de passe';

-- ============================================================================
-- Table : pattern_templates
-- [AI:Claude] Patrons de référence pour l'IA (exemples de vrais patrons)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `pattern_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL COMMENT '[AI:Claude] Nom descriptif du patron template',
  `type` VARCHAR(100) NOT NULL COMMENT '[AI:Claude] Type : bonnet, chale, ourson, chat, oiseau, etc.',
  `subtype` VARCHAR(100) DEFAULT NULL COMMENT '[AI:Claude] Sous-type optionnel : slouchy, beanie, etc.',
  `level` ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  `size` VARCHAR(50) DEFAULT NULL COMMENT '[AI:Claude] Taille du patron : baby, child, adult, etc.',
  `content` LONGTEXT NOT NULL COMMENT '[AI:Claude] Contenu complet du patron en JSON',
  `yarn_weight` VARCHAR(50) DEFAULT NULL COMMENT '[AI:Claude] Épaisseur de fil utilisée',
  `hook_size` VARCHAR(20) DEFAULT NULL COMMENT '[AI:Claude] Taille de crochet recommandée',
  `materials` JSON DEFAULT NULL COMMENT '[AI:Claude] Liste du matériel nécessaire',
  `estimated_time` VARCHAR(100) DEFAULT NULL COMMENT '[AI:Claude] Temps estimé de réalisation',
  `tags` JSON DEFAULT NULL COMMENT '[AI:Claude] Tags pour recherche : ["amigurumi", "animal", "facile"]',
  `language` VARCHAR(10) NOT NULL DEFAULT 'fr' COMMENT '[AI:Claude] Langue du patron',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '[AI:Claude] Actif pour utilisation par IA',
  `usage_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '[AI:Claude] Nombre de fois utilisé comme référence',
  `created_by` INT UNSIGNED DEFAULT NULL COMMENT '[AI:Claude] Admin qui a ajouté le patron',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_type_level` (`type`, `level`),
  KEY `idx_active` (`is_active`),
  KEY `idx_tags` ((CAST(`tags` AS CHAR(255) ARRAY))),
  CONSTRAINT `fk_pattern_templates_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='[AI:Claude] Bibliothèque de patrons de référence pour prompt engineering';

-- ============================================================================
-- Insertion des données de test (développement uniquement)
-- ============================================================================

-- [AI:Claude] Utilisateur admin de test
-- Mot de passe : admin123 (à changer en production !)
INSERT INTO `users` (`email`, `password`, `first_name`, `last_name`, `role`, `subscription_type`, `email_verified`)
VALUES ('admin@patronmaker.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin', 'yearly', TRUE);

-- [AI:Claude] Utilisateur test gratuit
-- Mot de passe : test123
INSERT INTO `users` (`email`, `password`, `first_name`, `last_name`, `role`, `subscription_type`, `email_verified`)
VALUES ('test@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test', 'User', 'user', 'free', TRUE);

-- [AI:Claude] Afficher les tables créées
SHOW TABLES;
