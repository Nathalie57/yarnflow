-- [AI:Claude] 2026-09-08 — Empêche une utilisatrice de lancer 2 analyses Smart Creation
-- en parallèle (vu en vrai : 5 analyses identiques du même fichier en 3 minutes, chacune
-- un vrai appel Gemini payant — l'attente réelle, 60-100s+, dépasse largement ce que
-- l'écran de chargement laissait deviner, poussant à recharger/relancer en pensant que
-- ça avait planté). Un verrou court-circuite l'appel IA avant qu'il ne parte si une
-- analyse de cette utilisatrice est déjà en cours.

CREATE TABLE IF NOT EXISTS smart_creation_locks (
  user_id     INT UNSIGNED NOT NULL PRIMARY KEY,
  started_at  DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
