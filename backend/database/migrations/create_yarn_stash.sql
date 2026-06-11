-- Migration : Création de la table yarn_stash (Module Stock de Laine)
-- Phase 1 : saisie manuelle, calculs à la volée côté frontend
-- total_weight_g et total_yardage_m ne sont pas stockés (calculés = quantité × unitaire)

CREATE TABLE IF NOT EXISTS yarn_stash (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id               INT UNSIGNED NOT NULL,
  brand                 VARCHAR(100) NOT NULL,
  yarn_name             VARCHAR(150) NOT NULL,
  color_name            VARCHAR(100) DEFAULT NULL,
  dye_lot               VARCHAR(50)  DEFAULT NULL,
  composition           VARCHAR(200) DEFAULT NULL,
  weight_per_skein_g    DECIMAL(7,1) NOT NULL,
  yardage_per_skein_m   DECIMAL(8,1) NOT NULL,
  quantity              INT UNSIGNED NOT NULL DEFAULT 1,
  needle_size_mm        DECIMAL(4,1) DEFAULT NULL,
  yarn_weight_category  VARCHAR(50)  DEFAULT NULL,
  color_hex             VARCHAR(7)   DEFAULT NULL,
  photo_url             VARCHAR(255) DEFAULT NULL,
  notes                 TEXT         DEFAULT NULL,
  created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
