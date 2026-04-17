-- Migration: Compteur séquentiel pour sections
-- Version: 0.18.1
-- Date: 2026-04-16
ALTER TABLE project_sections
  ADD COLUMN secondary_sequence JSON DEFAULT NULL;
