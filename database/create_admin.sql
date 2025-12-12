-- ============================================================================
-- YarnFlow - Création compte administrateur
-- ============================================================================
-- Usage: mysql -u root -p patron_maker < database/create_admin.sql

-- Supprimer l'admin existant si présent
DELETE FROM users WHERE email = 'admin@yarnflow.fr';

-- Créer le compte admin
-- Email: admin@yarnflow.fr
-- Password: Admin123! (hash bcrypt ci-dessous)
INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    role,
    subscription_type,
    subscription_expires_at,
    created_at
) VALUES (
    'admin@yarnflow.fr',
    '$2y$10$iVuJEcp96nQgYIabolgRKuQcKpsS1wiCgtNjsw6VIet01GRDVKowW', -- Password: Admin123!
    'Admin',
    'YarnFlow',
    'admin',
    'pro',
    DATE_ADD(NOW(), INTERVAL 10 YEAR),
    NOW()
);

-- Afficher le résultat
SELECT '==================================================' as '';
SELECT '  COMPTE ADMIN CRÉÉ AVEC SUCCÈS !' as '';
SELECT '==================================================' as '';
SELECT '' as '';
SELECT 'Connexion :' as '';
SELECT '  Email: admin@yarnflow.fr' as '';
SELECT '  Password: Admin123!' as '';
SELECT '' as '';
SELECT 'IMPORTANT : Changez ce mot de passe après votre première connexion !' as '';
SELECT '==================================================' as '';
