-- Test simple : compter les utilisateurs éligibles
-- À exécuter dans phpMyAdmin

-- 1. Vérifier la structure des tables
SHOW TABLES LIKE '%email%';
SHOW TABLES LIKE '%users%';

-- 2. Vérifier si last_login_at existe
SHOW COLUMNS FROM users LIKE 'last_login%';

-- 3. Compter tous les utilisateurs
SELECT 'TOTAL utilisateurs' as info, COUNT(*) as count FROM users;

-- 4. Utilisateurs avec email vérifié
SELECT 'Utilisateurs email_verified=1' as info, COUNT(*) as count
FROM users WHERE email_verified = 1;

-- 5. Utilisateurs inscrits depuis 3+ jours
SELECT 'Inscrits depuis 3+ jours' as info, COUNT(*) as count
FROM users
WHERE created_at <= DATE_SUB(NOW(), INTERVAL 3 DAY);

-- 6. Utilisateurs inscrits depuis 7+ jours
SELECT 'Inscrits depuis 7+ jours' as info, COUNT(*) as count
FROM users
WHERE created_at <= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- 7. Utilisateurs inscrits depuis 21+ jours
SELECT 'Inscrits depuis 21+ jours' as info, COUNT(*) as count
FROM users
WHERE created_at <= DATE_SUB(NOW(), INTERVAL 21 DAY);

-- 8. Vérifier si emails_sent_log existe et contient des données
SELECT 'Emails déjà envoyés' as info, COUNT(*) as count FROM emails_sent_log;

-- 9. Emails par type
SELECT email_type, COUNT(*) as count
FROM emails_sent_log
GROUP BY email_type;

-- 10. Sample d'utilisateurs
SELECT id, email, first_name, created_at, email_verified, last_login_at
FROM users
ORDER BY created_at DESC
LIMIT 5;
