-- Migration : Création de la table ravelry_oauth_pending (intégration Ravelry — Palier 1)
-- Stocke l'état CSRF entre la redirection vers Ravelry et le retour sur le callback —
-- le backend n'utilise pas de sessions PHP, une table joue ce rôle à sa place.
-- Purgée par cron (clean-ravelry-oauth-pending.php) au-delà d'1h.

CREATE TABLE IF NOT EXISTS ravelry_oauth_pending (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  state       VARCHAR(255) NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
