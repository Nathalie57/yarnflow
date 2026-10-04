-- Les valeurs existantes simple/composite restent inchangées.
ALTER TABLE project_sections
    MODIFY COLUMN progression_type ENUM('simple', 'composite', 'action') NOT NULL DEFAULT 'simple'
        COMMENT 'simple = progression chiffrée ; composite = plusieurs paliers ; action = validation manuelle sans compteur',
    MODIFY COLUMN counter_unit ENUM('rows', 'cm') NULL DEFAULT 'rows';

-- Les compteurs historiques et manuels restent des comptes numériques génériques.
ALTER TABLE project_secondary_counters
    ADD COLUMN unit ENUM('count', 'rows', 'rounds', 'cm', 'mm', 'in') NOT NULL DEFAULT 'count'
        AFTER cycle_length;
