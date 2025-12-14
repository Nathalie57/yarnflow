<?php
/**
 * Statistiques des utilisateurs YarnFlow
 * Accès: https://yarnflow.fr/stats-utilisateurs.php
 */

require_once __DIR__.'/../config/bootstrap.php';

use App\Config\Database;

header('Content-Type: application/json; charset=utf-8');

try {
    $db = Database::getConnection();

    // ============================================================================
    // 1. RÉSUMÉ GLOBAL
    // ============================================================================
    $stmt = $db->query("
        SELECT
            COUNT(*) as total_users,
            COUNT(CASE WHEN subscription_type = 'free' THEN 1 END) as free_users,
            COUNT(CASE WHEN subscription_type = 'pro' THEN 1 END) as pro_users,
            COUNT(CASE WHEN subscription_type = 'pro_annual' THEN 1 END) as pro_annual_users,
            COUNT(CASE WHEN subscription_type = 'early_bird' THEN 1 END) as early_bird_users,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_this_week,
            COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month
        FROM users
    ");
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);

    // ============================================================================
    // 2. UTILISATEURS QUI UTILISENT VRAIMENT L'APPLI
    // ============================================================================
    // Critère : au moins 1 projet OU 1 rang OU 1 photo IA
    $stmt = $db->query("
        SELECT
            u.id,
            u.email,
            u.subscription_type,
            u.subscription_status,
            DATE_FORMAT(u.created_at, '%d/%m/%Y à %H:%i') as date_inscription,
            DATEDIFF(NOW(), u.created_at) as jours_depuis_inscription,
            COUNT(DISTINCT p.id) as nombre_projets,
            COUNT(DISTINCT pr.id) as nombre_rangs,
            COUNT(DISTINCT ph.id) as nombre_photos_ia,
            MAX(GREATEST(
                COALESCE(p.updated_at, '1970-01-01'),
                COALESCE(pr.created_at, '1970-01-01'),
                COALESCE(ph.created_at, '1970-01-01')
            )) as derniere_activite,
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
        HAVING nombre_projets > 0 OR nombre_rangs > 0 OR nombre_photos_ia > 0
        ORDER BY derniere_activite DESC
    ");
    $real_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ============================================================================
    // 3. UTILISATEURS ACTIFS (ayant créé un projet dans les 30 derniers jours)
    // ============================================================================
    $stmt = $db->query("
        SELECT
            u.email,
            u.subscription_type,
            COUNT(DISTINCT p.id) as projets_actifs,
            MAX(p.updated_at) as derniere_activite
        FROM users u
        INNER JOIN projects p ON u.id = p.user_id
        WHERE p.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY u.id
        ORDER BY derniere_activite DESC
    ");
    $active_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ============================================================================
    // RÉSULTAT
    // ============================================================================
    echo json_encode([
        'success' => true,
        'date_extraction' => date('Y-m-d H:i:s'),
        'resume' => [
            'total_inscrits' => (int)$summary['total_users'],
            'utilisateurs_reels' => count($real_users),
            'taux_utilisation' => round(count($real_users) / max(1, (int)$summary['total_users']) * 100, 1) . '%',
            'free' => (int)$summary['free_users'],
            'pro' => (int)$summary['pro_users'],
            'pro_annual' => (int)$summary['pro_annual_users'],
            'early_bird' => (int)$summary['early_bird_users'],
            'nouveaux_7j' => (int)$summary['new_this_week'],
            'nouveaux_30j' => (int)$summary['new_this_month'],
            'actifs_30j' => count($active_users)
        ],
        'utilisateurs_reels' => $real_users,
        'utilisateurs_actifs_30j' => $active_users
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
