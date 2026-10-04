-- Migration : ai_pattern_imports.source_type accepte maintenant 'text' et 'library'
-- 'text' : nouveau repli "coller le texte du patron" (SmartProjectController::analyze())
-- 'library' : déjà produit par le code depuis longtemps (import depuis la bibliothèque
-- de patrons) mais absent de l'ENUM d'origine — bug latent, corrigé au passage.

ALTER TABLE ai_pattern_imports
    MODIFY COLUMN source_type ENUM('pdf', 'url', 'text', 'library') NOT NULL;

-- Les anciennes colonnes ENUM ne connaissaient pas 'text'/'library'. En mode MySQL non strict,
-- ces valeurs ont été enregistrées sous forme de chaîne vide. Les PDF et URL étaient déjà
-- valides : une ligne vide avec un fichier conservé vient donc de la bibliothèque, les autres
-- lignes vides correspondent aux textes collés.
UPDATE ai_pattern_imports
SET source_type = CASE
    WHEN source_file_path IS NOT NULL AND source_file_path <> '' THEN 'library'
    ELSE 'text'
END
WHERE source_type = '';

-- Pour les textes collés historiques, remplace le début arbitraire de la page par le titre
-- effectivement extrait. Les lignes sans titre valide restent inchangées pour éviter toute perte.
UPDATE ai_pattern_imports
SET source_name = LEFT(TRIM(JSON_UNQUOTE(JSON_EXTRACT(ai_response_json, '$.title'))), 500)
WHERE source_type = 'text'
  AND JSON_VALID(ai_response_json)
  AND JSON_UNQUOTE(JSON_EXTRACT(ai_response_json, '$.title')) IS NOT NULL
  AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(ai_response_json, '$.title'))) <> '';

-- [AI:Claude] Même bug, même correctif sur projects.source_type : SmartProjectController::
-- confirm() y écrit directement le "mode" choisi côté frontend ('pdf'/'url'/'library'/'text'),
-- mais l'ENUM d'origine ne connaissait que ('pdf','url','manual') — 'library' y était déjà
-- silencieusement mal stocké avant ce correctif (MySQL en mode non strict stocke une chaîne
-- vide plutôt que d'échouer sur une valeur d'ENUM invalide).
ALTER TABLE projects
    MODIFY COLUMN source_type ENUM('pdf', 'url', 'manual', 'library', 'text') DEFAULT 'manual';
