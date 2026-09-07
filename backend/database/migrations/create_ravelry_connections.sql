-- Migration : Création de la table ravelry_connections (intégration Ravelry — Palier 1)
-- Une ligne par utilisatrice connectée. access_token/refresh_token stockés chiffrés
-- (openssl_encrypt, clé RAVELRY_TOKEN_ENC_KEY en .env) — aucun secret tiers en clair en base.

CREATE TABLE IF NOT EXISTS ravelry_connections (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT UNSIGNED NOT NULL,
  ravelry_user_id         VARCHAR(50)  DEFAULT NULL,
  ravelry_username        VARCHAR(100) DEFAULT NULL,
  access_token            VARCHAR(500) DEFAULT NULL,
  refresh_token           VARCHAR(500) DEFAULT NULL,
  token_expires_at        DATETIME     DEFAULT NULL,
  status                  ENUM('pending','connected','revoked') NOT NULL DEFAULT 'pending',
  connected_at            DATETIME     DEFAULT NULL,
  revoked_at              DATETIME     DEFAULT NULL,
  last_stash_synced_at    DATETIME     DEFAULT NULL,
  last_library_synced_at  DATETIME     DEFAULT NULL,
  created_at              DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_ravelry (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
