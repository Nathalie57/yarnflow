-- Ajout de la colonne completed_at à la table payments
-- Pour tracker quand un paiement est complété

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS completed_at DATETIME DEFAULT NULL AFTER status;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_completed_at ON payments(completed_at);
