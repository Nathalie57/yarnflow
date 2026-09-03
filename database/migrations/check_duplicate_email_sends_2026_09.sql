-- [AI:Claude] 2026-09-03 — Diagnostic de l'ampleur réelle du bug ENUM (voir
-- add_missing_email_types_2026_09.sql) : combien d'utilisatrices ont reçu le même
-- type d'email plusieurs fois à cause de la déduplication cassée, et combien de fois.
-- À lancer APRÈS le backfill (backfill_empty_email_types_2026_09.sql), sinon les
-- lignes encore à email_type vide ne remonteront pas ici.

SELECT
    user_id,
    recipient_email,
    email_type,
    COUNT(*) AS nb_envois,
    MIN(sent_at) AS premier_envoi,
    MAX(sent_at) AS dernier_envoi
FROM emails_sent_log
WHERE email_type IN (
    'dormant_reactivation',
    'reengagement_light',
    'plus_welcome',
    'abandoned_checkout_discount_20',
    'abandoned_checkout_discount_35'
)
AND status = 'sent'
GROUP BY user_id, recipient_email, email_type
HAVING COUNT(*) > 1
ORDER BY nb_envois DESC;
