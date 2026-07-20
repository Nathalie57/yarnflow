-- Suivi d'ouverture des emails via pixel invisible (voir EmailService::injectTrackingPixel).
-- tracking_token identifie l'envoi ; opened_at reste NULL tant que le pixel n'a pas été chargé.

ALTER TABLE emails_sent_log
    ADD COLUMN tracking_token VARCHAR(32) NULL AFTER error_message,
    ADD COLUMN opened_at DATETIME NULL AFTER tracking_token,
    ADD UNIQUE INDEX idx_emails_sent_log_tracking_token (tracking_token);
