-- Migration : une analyse "teaser" à vie au-delà des 3 essais gratuits de la
-- Création Intelligente. Une utilisatrice FREE qui a épuisé son quota peut
-- quand même voir son projet analysé une dernière fois (effet "wow" avant de
-- payer), mais ne peut pas le valider sans passer à PLUS/PRO — voir
-- SmartProjectController::analyze()/confirm().

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS smart_creation_teaser_used_at DATETIME DEFAULT NULL
    COMMENT 'Date de consommation de l''analyse teaser à vie (FREE, au-delà des 3 essais)';
