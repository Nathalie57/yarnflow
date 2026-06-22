-- Migration : Création de la table partner_patterns
-- Permet aux partenaires (ex: Knit Eat) de créer des templates de projets
-- accessibles via QR code → yarnflow.fr/import/:code

CREATE TABLE IF NOT EXISTS partner_patterns (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  partner_name  VARCHAR(100) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  type          VARCHAR(50)  NOT NULL DEFAULT 'other',
  technique     VARCHAR(50)  NOT NULL DEFAULT 'tricot',
  description   TEXT         DEFAULT NULL,
  needle_size   VARCHAR(20)  DEFAULT NULL,
  yarn_weight   VARCHAR(50)  DEFAULT NULL,
  sections      JSON         DEFAULT NULL,
  technical_details JSON     DEFAULT NULL,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  scan_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
