-- Capture le user-agent au début de chaque session pour pouvoir déduire le
-- device/OS (iPhone, Android, desktop...) de chaque utilisateur — utile pour
-- croiser avec les taux d'ouverture email (biais connu Apple Mail vs Gmail).

ALTER TABLE user_sessions
    ADD COLUMN user_agent VARCHAR(255) NULL AFTER last_activity_at;
