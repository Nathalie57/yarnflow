-- =====================================================
-- Création table ai_assistant_feedback
-- Version : 0.17.1
-- Date : 2026-09-11
-- But : mesurer la qualité réelle des réponses de l'assistant IA (pouce haut/bas),
-- inexistant jusqu'ici — seules les erreurs techniques (API/HTTP) étaient loguées,
-- jamais la pertinence du contenu retourné.
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_assistant_feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL pour l assistant general (hors contexte projet)',

    contextual TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Question posee depuis un projet (aide sur ce rang) ou assistant general',
    question TEXT NOT NULL COMMENT 'Dernier message utilisateur ayant produit cette reponse',
    reply TEXT NOT NULL COMMENT 'Reponse de l assistant telle qu affichee (hors marqueurs internes)',

    rating ENUM('up', 'down') DEFAULT NULL COMMENT 'NULL tant que l utilisatrice n a pas note',
    rated_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,

    INDEX idx_user (user_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Feedback qualite (pouce haut/bas) sur les reponses de l assistant IA contextuel/general';
