-- =====================================================
-- Création table ai_pattern_imports uniquement
-- Version : 0.17.0
-- Date : 2026-01-07
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_pattern_imports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL si l import a échoué',

    -- Source
    source_type ENUM('pdf', 'url') NOT NULL,
    source_name VARCHAR(500) NOT NULL COMMENT 'Nom fichier ou URL',
    file_size_bytes INT DEFAULT NULL COMMENT 'Taille fichier PDF en octets',

    -- Résultat IA
    ai_status ENUM('success', 'partial', 'failed') DEFAULT 'success'
        COMMENT 'success = tout OK, partial = incomplet, failed = échec total',
    ai_response_json JSON DEFAULT NULL COMMENT 'Réponse brute de Gemini pour debug',
    processing_time_ms INT DEFAULT NULL COMMENT 'Temps de traitement IA en millisecondes',
    error_message TEXT DEFAULT NULL COMMENT 'Message d erreur si échec',

    -- Métadonnées
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IP utilisateur pour anti-abus',

    -- Clés étrangères
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,

    -- Index pour quotas mensuels
    INDEX idx_user_month (user_id, created_at),
    INDEX idx_status (ai_status),
    INDEX idx_source_type (source_type)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracking des imports de patrons par IA (quotas mensuels par plan)';
