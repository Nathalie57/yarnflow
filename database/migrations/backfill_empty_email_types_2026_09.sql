-- [AI:Claude] 2026-09-03 — Corrige les lignes emails_sent_log dont email_type a été
-- stocké vide à cause de l'ENUM incomplet (voir add_missing_email_types_2026_09.sql,
-- à exécuter AVANT ce script). Ne touche que les lignes email_type = '' : la
-- déduplication de chaque trigger recommence à fonctionner dès l'exécution, sans
-- attendre que ces utilisatrices sortent de la fenêtre d'éligibilité du trigger.
-- Matching par sujet, sans ambiguïté (un seul type d'email possible par sujet).

UPDATE emails_sent_log
SET email_type = 'dormant_reactivation'
WHERE email_type = ''
  AND subject = "On ne t'a pas revue depuis un moment sur YarnFlow";

UPDATE emails_sent_log
SET email_type = 'reengagement_light'
WHERE email_type = ''
  AND subject = "Vous n'avez pas eu le temps de vous lancer sur YarnFlow ?";

UPDATE emails_sent_log
SET email_type = 'plus_welcome'
WHERE email_type = ''
  AND subject LIKE 'Bienvenue dans YarnFlow %';

UPDATE emails_sent_log
SET email_type = 'abandoned_checkout_discount_20'
WHERE email_type = ''
  AND subject LIKE '-20% sur YarnFlow%';

UPDATE emails_sent_log
SET email_type = 'abandoned_checkout_discount_35'
WHERE email_type = ''
  AND subject LIKE '-35% sur YarnFlow%';

-- Vérification : ne devrait plus rester aucune ligne à email_type vide après ce script
-- (sinon un sujet imprévu existe — l'identifier avant de considérer le nettoyage terminé)
SELECT id, user_id, recipient_email, subject, sent_at
FROM emails_sent_log
WHERE email_type = '';
