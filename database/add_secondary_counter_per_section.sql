-- Migration : ajout compteur secondaire par section
-- Permet de stocker l'état du compteur secondaire indépendamment pour chaque section
-- Sync multi-appareils via la DB (pas localStorage)

ALTER TABLE project_sections
    ADD COLUMN secondary_label  VARCHAR(50)  DEFAULT NULL COMMENT 'Libellé du compteur secondaire pour cette section',
    ADD COLUMN secondary_target INT          DEFAULT NULL COMMENT 'Objectif du compteur secondaire pour cette section',
    ADD COLUMN secondary_count  INT          DEFAULT 0    COMMENT 'Valeur courante du compteur secondaire pour cette section';
