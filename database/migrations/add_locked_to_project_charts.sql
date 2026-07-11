-- Verrouillage d'une grille jacquard une fois sa création validée, pour éviter
-- les modifications accidentelles pendant le suivi de progression.
-- 0 = modifiable (état par défaut à la création) — 1 = verrouillée (après "Valider").

ALTER TABLE project_charts
    ADD COLUMN locked TINYINT(1) NOT NULL DEFAULT 0 AFTER current_row;
