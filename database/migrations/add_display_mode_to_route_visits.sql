-- Ajoute le mode d'affichage (navigateur classique / PWA installée standalone /
-- TWA Android) pour distinguer les appels venant d'une app relancée en tâche
-- de fond par l'OS de ceux d'une vraie utilisation active dans un navigateur.

ALTER TABLE route_visits
    ADD COLUMN IF NOT EXISTS display_mode VARCHAR(20) NOT NULL DEFAULT 'browser' AFTER method;
