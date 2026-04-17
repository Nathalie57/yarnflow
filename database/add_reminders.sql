-- Migration : ajout des rappels de rang
-- Format JSON : [{"id": "uuid", "row": 42, "message": "Commencer les diminutions", "done": false}]

ALTER TABLE project_sections
  ADD COLUMN reminders JSON DEFAULT NULL;

ALTER TABLE projects
  ADD COLUMN reminders JSON DEFAULT NULL;
