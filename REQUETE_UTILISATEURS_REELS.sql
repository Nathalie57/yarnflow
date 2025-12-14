-- ============================================================================
-- UTILISATEURS QUI UTILISENT VRAIMENT L'APPLI
-- ============================================================================
-- Définition : Au moins 1 projet OU 1 rang tricoté OU 1 photo IA générée
-- ============================================================================

SELECT
    u.id,
    u.email,
    u.subscription_type,
    DATE_FORMAT(u.created_at, '%d/%m/%Y à %H:%i') as date_inscription,

    -- Activité
    COUNT(DISTINCT p.id) as nb_projets,
    COUNT(DISTINCT pr.id) as nb_rangs_tricotes,
    COUNT(DISTINCT ph.id) as nb_photos_ia,

    -- Dernière activité
    DATE_FORMAT(MAX(GREATEST(
        COALESCE(p.updated_at, '1970-01-01'),
        COALESCE(pr.created_at, '1970-01-01'),
        COALESCE(ph.created_at, '1970-01-01')
    )), '%d/%m/%Y à %H:%i') as derniere_activite,

    DATEDIFF(NOW(), MAX(GREATEST(
        COALESCE(p.updated_at, '1970-01-01'),
        COALESCE(pr.created_at, '1970-01-01'),
        COALESCE(ph.created_at, '1970-01-01')
    ))) as jours_depuis_derniere_activite

FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN project_rows pr ON p.id = pr.project_id
LEFT JOIN user_photos ph ON u.id = ph.user_id

GROUP BY u.id

-- ⭐ Filtrer : au moins 1 activité
HAVING nb_projets > 0 OR nb_rangs_tricotes > 0 OR nb_photos_ia > 0

ORDER BY derniere_activite DESC;


-- ============================================================================
-- RÉSUMÉ RAPIDE : Combien d'utilisateurs réels ?
-- ============================================================================

SELECT
    'Inscrits total' as categorie,
    COUNT(*) as nombre
FROM users

UNION ALL

SELECT
    'Utilisateurs RÉELS (avec activité)',
    COUNT(DISTINCT u.id)
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN project_rows pr ON p.id = pr.project_id
LEFT JOIN user_photos ph ON u.id = ph.user_id
WHERE p.id IS NOT NULL OR pr.id IS NOT NULL OR ph.id IS NOT NULL

UNION ALL

SELECT
    'Actifs derniers 7 jours',
    COUNT(DISTINCT u.id)
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN project_rows pr ON p.id = pr.project_id
LEFT JOIN user_photos ph ON u.id = ph.user_id
WHERE p.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   OR pr.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
   OR ph.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)

UNION ALL

SELECT
    'Actifs derniers 30 jours',
    COUNT(DISTINCT u.id)
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN project_rows pr ON p.id = pr.project_id
LEFT JOIN user_photos ph ON u.id = ph.user_id
WHERE p.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
   OR pr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
   OR ph.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);


-- ============================================================================
-- EMAILS DES UTILISATEURS RÉELS (pour export mailing)
-- ============================================================================

SELECT DISTINCT u.email
FROM users u
INNER JOIN projects p ON u.id = p.user_id
ORDER BY u.email;
