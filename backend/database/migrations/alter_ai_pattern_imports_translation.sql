-- [AI:Claude] Traduction complète du patron, associée à l'analyse IA sans jamais
-- remplacer le texte original — proposée quand la langue détectée du patron
-- (colonne ajoutée au JSON d'extraction, voir AIPatternExtractorService) diffère de
-- la langue de l'utilisatrice. Ne consomme pas le quota de traduction existant
-- (table ai_pattern_translations), c'est une facette de la compréhension du patron
-- par l'assistant, pas un usage de l'outil de traduction indépendant.
ALTER TABLE ai_pattern_imports
    ADD COLUMN translated_text MEDIUMTEXT NULL AFTER pattern_size,
    ADD COLUMN translated_lang VARCHAR(10) NULL AFTER translated_text;
