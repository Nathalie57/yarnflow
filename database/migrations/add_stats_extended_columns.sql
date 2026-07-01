-- Migration: enrichissement de project_stats
-- Ajoute les colonnes de stats avancées pré-calculées

ALTER TABLE project_stats
    ADD COLUMN IF NOT EXISTS current_streak    INT            NOT NULL DEFAULT 0     AFTER total_rows,
    ADD COLUMN IF NOT EXISTS longest_streak    INT            NOT NULL DEFAULT 0     AFTER current_streak,
    ADD COLUMN IF NOT EXISTS completion_rate   DECIMAL(5,2)   NOT NULL DEFAULT 0     AFTER longest_streak,
    ADD COLUMN IF NOT EXISTS total_sessions    INT            NOT NULL DEFAULT 0     AFTER completion_rate,
    ADD COLUMN IF NOT EXISTS avg_session_duration INT         NOT NULL DEFAULT 0     AFTER total_sessions,
    ADD COLUMN IF NOT EXISTS favorite_technique VARCHAR(20)   DEFAULT NULL           AFTER avg_session_duration;
