-- Migration : ai_pattern_imports.source_type accepte maintenant 'text' et 'library'
-- 'text' : nouveau repli "coller le texte du patron" (SmartProjectController::analyze())
-- 'library' : déjà produit par le code depuis longtemps (import depuis la bibliothèque
-- de patrons) mais absent de l'ENUM d'origine — bug latent, corrigé au passage.

ALTER TABLE ai_pattern_imports
    MODIFY COLUMN source_type ENUM('pdf', 'url', 'text', 'library') NOT NULL;

-- [AI:Claude] Même bug, même correctif sur projects.source_type : SmartProjectController::
-- confirm() y écrit directement le "mode" choisi côté frontend ('pdf'/'url'/'library'/'text'),
-- mais l'ENUM d'origine ne connaissait que ('pdf','url','manual') — 'library' y était déjà
-- silencieusement mal stocké avant ce correctif (MySQL en mode non strict stocke une chaîne
-- vide plutôt que d'échouer sur une valeur d'ENUM invalide).
ALTER TABLE projects
    MODIFY COLUMN source_type ENUM('pdf', 'url', 'manual', 'library', 'text') DEFAULT 'manual';
