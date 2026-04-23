-- ================================================================
-- Migration: Colonnes pour Smart Project Creator (import IA)
-- Date: 2026-04-22
-- Description: Ajoute source_type, source_url, gauge_* à la table projects
-- ================================================================

USE patron_maker;

ALTER TABLE projects
    ADD COLUMN source_type  VARCHAR(20)  NULL COMMENT 'pdf | url | manual'          AFTER pattern_notes,
    ADD COLUMN source_url   VARCHAR(1000) NULL COMMENT 'URL source du patron'        AFTER source_type,
    ADD COLUMN gauge_stitches INT         NULL COMMENT 'Mailles sur 10cm'            AFTER hook_size,
    ADD COLUMN gauge_rows     INT         NULL COMMENT 'Rangs sur 10cm'              AFTER gauge_stitches,
    ADD COLUMN gauge_size_cm  INT         NULL COMMENT 'Taille de l\'échantillon cm' AFTER gauge_rows;

SELECT 'Migration add_smart_project_columns OK' AS status;
