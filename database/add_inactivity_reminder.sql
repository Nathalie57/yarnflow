-- Migration : rappel d'inactivité sur les projets

ALTER TABLE users
  ADD COLUMN inactivity_reminder_enabled TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE projects
  ADD COLUMN last_inactivity_reminder_at DATETIME DEFAULT NULL;
