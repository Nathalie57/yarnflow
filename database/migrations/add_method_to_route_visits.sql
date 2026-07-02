-- Ajoute la méthode HTTP (GET/POST/PUT/DELETE) pour distinguer les actions
-- qui partagent la même route (ex: POST /projects/:id/rows = ajouter un rang,
-- GET /projects/:id/rows = lister avant suppression du dernier rang).

ALTER TABLE route_visits
    ADD COLUMN IF NOT EXISTS method VARCHAR(10) NOT NULL DEFAULT 'GET' AFTER route;
