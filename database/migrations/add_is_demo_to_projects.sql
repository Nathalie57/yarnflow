-- [AI:Claude] 2026-09-07 — Persiste enfin l'info "projet démo" en base (jusqu'ici
-- uniquement en localStorage côté frontend, jamais visible du backend). Sans ça,
-- les emails d'engagement (cron send-engagement-emails.php) ne pouvaient pas
-- distinguer un projet démo d'un vrai projet, et référençaient parfois le projet
-- démo comme s'il attendait vraiment l'utilisatrice ("Ton projet t'attend"...).

ALTER TABLE projects
    ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE COMMENT '[AI:Claude] Projet démo (exploration zéro friction), exclu des relances par email' AFTER is_public;

-- Backfill : les projets démo déjà créés avant ce correctif ont un nom fixe et
-- reconnaissable ("Lemon Zest Cardigan — DROPS 268-1 (démo)"/"(demo)" selon la
-- langue) — on les rattrape plutôt que de les laisser comme des faux "vrais projets".
UPDATE projects
SET is_demo = 1
WHERE name LIKE 'Lemon Zest Cardigan — DROPS 268-1%';
