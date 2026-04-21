-- Migration : ajout de la deadline (objectif de date) sur les projets

ALTER TABLE projects
  ADD COLUMN deadline DATE DEFAULT NULL;
