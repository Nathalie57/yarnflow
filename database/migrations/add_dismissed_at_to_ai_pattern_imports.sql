-- [AI:Claude] 2026-09-13 — Permet d'écarter un import analysé mais jamais rattaché à un
-- projet sans devoir le reprendre ni attendre les 7 jours de la fenêtre de pendingImport()
-- (voir SmartProjectController::pendingImport()). Sans ça, un import de test abandonné
-- ressurgissait indéfiniment dans la bannière "patron en attente" de Mes projets, y compris
-- juste après avoir créé un AUTRE projet — donnant l'impression que la bannière revenait
-- sans arrêt (elle affichait en réalité un import différent, plus ancien, à chaque fois).

ALTER TABLE ai_pattern_imports
  ADD COLUMN dismissed_at TIMESTAMP NULL DEFAULT NULL AFTER project_id;
