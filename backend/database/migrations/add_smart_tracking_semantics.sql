-- Les valeurs par défaut préservent le comportement des projets existants.
ALTER TABLE project_secondary_counters
    ADD COLUMN tracking_role ENUM('required_cycle', 'required_parallel', 'informational', 'unknown')
        NOT NULL DEFAULT 'informational' AFTER sequence,
    ADD COLUMN cycle_length INT NULL AFTER tracking_role;

ALTER TABLE project_sections
    ADD COLUMN pattern_start_row INT UNSIGNED NULL AFTER current_row;
