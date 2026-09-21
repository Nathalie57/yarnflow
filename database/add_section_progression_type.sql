-- Migration: Ajoute progression_type à project_sections
-- Créée le 2026-09-21
-- Contexte : une section importée par l'IA peut contenir plusieurs paliers/actions
-- successifs (ex: "8 cm côtes 2/2 puis jersey jusqu'à 46 cm, marqueurs à 46 cm...").
-- Représenter une telle section par un unique compteur X/Y peut faire manquer une
-- instruction intermédiaire importante à l'utilisatrice. Ce champ permet de
-- distinguer ce cas ("composite") d'une section à objectif de progression réellement
-- unique ("simple"), sans toucher au fonctionnement existant du compteur.
--
-- Invariant applicatif : quand progression_type = 'composite', total_rows DOIT
-- rester NULL (le compteur devient libre, sans total affiché) — voir
-- AIPatternExtractorService::EXTRACTION_PROMPT et SmartProjectController::analyzePattern.

ALTER TABLE project_sections
ADD COLUMN progression_type ENUM('simple', 'composite') NOT NULL DEFAULT 'simple'
COMMENT 'simple = total_rows fiable pour un compteur X/Y ; composite = plusieurs paliers/actions, compteur libre (total_rows doit rester NULL)'
AFTER counter_unit;
