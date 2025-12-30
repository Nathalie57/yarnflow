-- Migration: Add counter unit support (rows vs cm)
-- Created: 2025-12-27
-- Description: Allows users to count in rows (integer) or centimeters (decimal)

-- Add counter_unit column to projects table
ALTER TABLE projects
ADD COLUMN counter_unit ENUM('rows', 'cm') DEFAULT 'rows' COMMENT 'Unit for counter: rows or cm' AFTER current_row,
ADD COLUMN counter_unit_increment DECIMAL(3,1) DEFAULT 1.0 COMMENT 'Increment value: 1 for rows, 0.5 for cm' AFTER counter_unit;

-- Add counter_unit column to project_sections table
ALTER TABLE project_sections
ADD COLUMN counter_unit ENUM('rows', 'cm') DEFAULT 'rows' COMMENT 'Unit for section counter: rows or cm' AFTER current_row;

-- Modify current_row and total_rows columns to support decimals (for cm)
ALTER TABLE projects
MODIFY COLUMN current_row DECIMAL(10,1) DEFAULT 0 COMMENT 'Current row/cm count',
MODIFY COLUMN total_rows DECIMAL(10,1) DEFAULT NULL COMMENT 'Total rows/cm planned';

ALTER TABLE project_sections
MODIFY COLUMN current_row DECIMAL(10,1) DEFAULT 0 COMMENT 'Current row/cm count for section',
MODIFY COLUMN total_rows DECIMAL(10,1) DEFAULT NULL COMMENT 'Total rows/cm for section';

-- Add cm/hour stats column to project_stats table
ALTER TABLE project_stats
ADD COLUMN avg_cm_per_hour DECIMAL(8,2) DEFAULT NULL COMMENT 'Average cm per hour (when unit is cm)' AFTER avg_rows_per_hour;

-- Note: project_rows.row_num stays INT
-- CM mode doesn't create individual history entries (only updates current_row)
