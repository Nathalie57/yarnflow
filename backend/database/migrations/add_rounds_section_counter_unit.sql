-- Préserve le vocabulaire des patrons travaillés en rond pour les nouveaux projets.
-- Les valeurs historiques 'rows', 'cm' et NULL restent inchangées.
ALTER TABLE project_sections
    MODIFY COLUMN counter_unit ENUM('rows', 'rounds', 'cm') NULL DEFAULT 'rows';

ALTER TABLE projects
    MODIFY COLUMN counter_unit ENUM('rows', 'rounds', 'cm') NOT NULL DEFAULT 'rows';
