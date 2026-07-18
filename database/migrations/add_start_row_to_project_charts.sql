-- Une grille jacquard couvre généralement seulement une partie des rangs
-- d'une section (ex: 5 rangs unis, puis 50 rangs de motif, puis 15 rangs
-- unis). start_row indique combien de rangs de la section sont déjà faits
-- quand la grille commence (0 = la grille démarre au tout premier rang de
-- la section). Sert à décaler la correspondance grille <-> compteur de
-- section au lieu de supposer qu'ils démarrent toujours ensemble.

ALTER TABLE project_charts
    ADD COLUMN start_row INT UNSIGNED NOT NULL DEFAULT 0 AFTER section_id;
