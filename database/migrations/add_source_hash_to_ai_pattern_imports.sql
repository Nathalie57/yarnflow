-- [AI:Claude] 2026-09-08 — Permet de reconnaître une ré-analyse du contenu EXACTEMENT
-- identique (même fichier, même URL, même texte collé, même taille choisie) pour servir
-- le résultat déjà obtenu au lieu de rappeler Gemini une seconde fois pour rien.

ALTER TABLE ai_pattern_imports
    ADD COLUMN source_hash VARCHAR(64) NULL AFTER pattern_size,
    ADD INDEX idx_user_source_hash (user_id, source_hash);
