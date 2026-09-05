-- [AI:Claude] 2026-09-05 — Répare les file_path/pattern_path corrompus par le bug de
-- PatternStorageService::savePatternFile() (présent depuis le 17/06, corrigé le même jour
-- que ce script). Le chemin stocké était le chemin ABSOLU complet du serveur au lieu d'un
-- chemin relatif du type /uploads/patterns/xxx.pdf — le fichier existe bien sur le disque,
-- seule la valeur en base est fausse. Ce script garde uniquement la portion utile (à partir
-- de /uploads/patterns/), sans toucher aux lignes déjà correctes.

-- Vérification AVANT réparation : combien de lignes sont concernées, et à quoi ressemblent
-- les valeurs cassées (à lancer d'abord, pour confirmer avant d'appliquer les UPDATE)
SELECT id, user_id, name, file_path
FROM pattern_library
WHERE file_path LIKE '%/uploads/patterns/%'
  AND file_path NOT LIKE '/uploads/patterns/%';

SELECT id, user_id, name, pattern_path
FROM projects
WHERE pattern_path LIKE '%/uploads/patterns/%'
  AND pattern_path NOT LIKE '/uploads/patterns/%';

-- Réparation — bibliothèque de patrons
UPDATE pattern_library
SET file_path = CONCAT('/uploads/patterns/', SUBSTRING_INDEX(file_path, '/uploads/patterns/', -1))
WHERE file_path LIKE '%/uploads/patterns/%'
  AND file_path NOT LIKE '/uploads/patterns/%';

-- Réparation — patron de projet (upload manuel)
UPDATE projects
SET pattern_path = CONCAT('/uploads/patterns/', SUBSTRING_INDEX(pattern_path, '/uploads/patterns/', -1))
WHERE pattern_path LIKE '%/uploads/patterns/%'
  AND pattern_path NOT LIKE '/uploads/patterns/%';

-- Vérification APRÈS réparation : ne devrait plus rien renvoyer
SELECT id, user_id, name, file_path
FROM pattern_library
WHERE file_path LIKE '%/uploads/patterns/%'
  AND file_path NOT LIKE '/uploads/patterns/%';

SELECT id, user_id, name, pattern_path
FROM projects
WHERE pattern_path LIKE '%/uploads/patterns/%'
  AND pattern_path NOT LIKE '/uploads/patterns/%';
