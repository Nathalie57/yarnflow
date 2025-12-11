-- ============================================================================
-- Ajout du support texte pour les patrons (copier-coller)
-- ============================================================================
-- Date: 2025-12-11
-- Permet d'ajouter des patrons en copiant-collant du texte directement
-- ============================================================================

-- 1. Modifier le ENUM source_type pour ajouter 'text'
ALTER TABLE pattern_library
MODIFY COLUMN source_type ENUM('file', 'url', 'text') NOT NULL
COMMENT 'Fichier uploadé, lien web ou texte copié-collé';

-- 2. Ajouter une colonne pour stocker le texte du patron
ALTER TABLE pattern_library
ADD COLUMN pattern_text LONGTEXT DEFAULT NULL
COMMENT 'Texte du patron (markdown) si source_type = text'
AFTER url;

-- ============================================================================
-- Index pour recherche dans le texte (si besoin de recherche full-text)
-- ============================================================================
-- Décommentez si vous voulez activer la recherche dans le contenu des patrons texte
-- ALTER TABLE pattern_library ADD FULLTEXT INDEX idx_pattern_text_search (pattern_text);

-- ============================================================================
-- Vérification
-- ============================================================================
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
-- FROM INFORMATION_SCHEMA.COLUMNS
-- WHERE TABLE_NAME = 'pattern_library' AND TABLE_SCHEMA = DATABASE()
-- ORDER BY ORDINAL_POSITION;
