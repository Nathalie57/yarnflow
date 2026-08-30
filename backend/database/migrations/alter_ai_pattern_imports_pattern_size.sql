-- [AI:Claude] Persiste la taille choisie à l'analyse (ex: "Préma" pour un patron
-- multi-tailles) — jusqu'ici utilisée uniquement pour calculer les `target` de section
-- au moment de l'extraction IA, puis perdue. L'assistant contextuel en a besoin pour
-- répondre avec certitude sur un nombre de mailles/rangs propre à une taille précise,
-- au lieu de deviner à partir de l'ordre des valeurs dans le texte du patron.
ALTER TABLE ai_pattern_imports ADD COLUMN pattern_size VARCHAR(50) NULL AFTER source_file_path;
