-- [AI:Claude] Permet de conserver le fichier PDF/image analysé (Création Intelligente
-- ou association de patron à un projet manuel) pour qu'il reste consultable dans
-- l'onglet "Patron" du projet, plutôt que de n'exister que via le JSON extrait par l'IA.
ALTER TABLE ai_pattern_imports ADD COLUMN source_file_path VARCHAR(255) NULL AFTER source_name;
