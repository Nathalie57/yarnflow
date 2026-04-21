-- ============================================================================
-- Migration : Compteur secondaire par rang
-- Feature : Comptage d'augmentations, diminutions, répétitions dans un rang
-- Version : v0.18.0
-- Date : 2026-03-08
-- ============================================================================

ALTER TABLE project_rows
  ADD COLUMN secondary_count  INT          DEFAULT NULL COMMENT 'Valeur atteinte sur ce rang (NULL = compteur non activé)',
  ADD COLUMN secondary_target INT          DEFAULT NULL COMMENT 'Objectif fixé pour ce rang (optionnel)',
  ADD COLUMN secondary_label  VARCHAR(50)  DEFAULT NULL COMMENT 'Libellé du compteur (ex: Aug., Dim., Rép.)';
