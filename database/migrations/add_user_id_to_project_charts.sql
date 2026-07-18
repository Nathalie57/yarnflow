-- Permet d'enregistrer une grille sans projet (juste dans "Mes grilles") —
-- project_id devient optionnel, et l'appartenance est désormais vérifiée
-- directement via user_id plutôt que via une jointure sur projects.

ALTER TABLE project_charts
    ADD COLUMN user_id INT UNSIGNED NULL AFTER id,
    MODIFY project_id INT UNSIGNED NULL;

UPDATE project_charts pc
JOIN projects p ON p.id = pc.project_id
SET pc.user_id = p.user_id
WHERE pc.user_id IS NULL;

ALTER TABLE project_charts
    MODIFY user_id INT UNSIGNED NOT NULL,
    ADD INDEX idx_project_charts_user (user_id),
    ADD CONSTRAINT fk_project_charts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
