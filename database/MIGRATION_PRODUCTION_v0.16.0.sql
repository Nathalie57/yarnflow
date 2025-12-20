-- ============================================================================
-- MIGRATION PRODUCTION v0.16.0 - YarnFlow
-- Date: 2025-12-20
-- Description: Ajout du système de contact
--              - Formulaire de contact avec catégories
--              - Rate limiting anti-spam
--              - Traçabilité complète des messages
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Table des messages de contact
-- ============================================================================

-- Table pour les messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED DEFAULT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    category ENUM('bug', 'question', 'suggestion', 'other') NOT NULL DEFAULT 'other',
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    status ENUM('unread', 'read', 'replied', 'archived') NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Messages de contact reçus via le formulaire';

-- ============================================================================
-- ÉTAPE 2 : Table de rate limiting pour les messages de contact
-- ============================================================================

-- Table pour le rate limiting des messages de contact
CREATE TABLE IF NOT EXISTS contact_rate_limit (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    message_count INT UNSIGNED NOT NULL DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_ip (ip_address),
    INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting anti-spam pour les messages de contact (3 messages/heure)';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que les tables ont été créées
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('contact_messages', 'contact_rate_limit')
ORDER BY TABLE_NAME;

-- ============================================================================
-- RÉSUMÉ DES CHANGEMENTS
-- ============================================================================

SELECT '✅ Migration v0.16.0 - Système de contact créé avec succès !' as status
UNION ALL
SELECT '📧 - Table contact_messages : stockage des messages' as info
UNION ALL
SELECT '🛡️  - Table contact_rate_limit : protection anti-spam' as info
UNION ALL
SELECT '📊 - Catégories : bug, question, suggestion, other' as info
UNION ALL
SELECT '🔐 - Rate limit : 3 messages/heure par IP' as info;

-- ============================================================================
-- FIN DE LA MIGRATION v0.16.0
-- ============================================================================
