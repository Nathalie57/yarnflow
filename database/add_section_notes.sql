-- Migration: Ajout de notes par section
-- Version: 0.17.2
-- Date: 2026-02-22

-- Ajouter la colonne notes à project_sections
ALTER TABLE project_sections
ADD COLUMN notes TEXT DEFAULT NULL COMMENT 'Notes personnelles pour cette section' AFTER description;
