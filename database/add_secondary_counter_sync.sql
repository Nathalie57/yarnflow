-- Synchronisation du compteur secondaire entre appareils
-- Stocke l'état courant du compteur secondaire au niveau du projet

ALTER TABLE projects
    ADD COLUMN secondary_label VARCHAR(20) NULL DEFAULT NULL,
    ADD COLUMN secondary_target INT NULL DEFAULT NULL,
    ADD COLUMN secondary_count INT NULL DEFAULT 0;
