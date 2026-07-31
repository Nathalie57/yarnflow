ALTER TABLE users
ADD COLUMN streak7_bonus_granted_at DATETIME NULL DEFAULT NULL
COMMENT 'Date d''octroi du bonus crédits IA pour 7 jours de série consécutifs (une seule fois par compte)';
