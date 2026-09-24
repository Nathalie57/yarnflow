-- [AI:Claude] 2026-09-24 — Garde la traduction sur la même fiche que le patron d'origine
-- (onglet "Original/Traduit" côté UI) plutôt qu'une deuxième entrée séparée dans la
-- bibliothèque, aussi bien depuis le traducteur autonome que depuis la Création Intelligente.

ALTER TABLE pattern_library
    ADD COLUMN translated_text LONGTEXT NULL AFTER pattern_text,
    ADD COLUMN translated_lang VARCHAR(5) NULL AFTER translated_text;
