/**
 * @file add_projects_system_notriggers.sql
 * @brief Système de gestion de projets et compteur de rangs (VERSION SANS TRIGGERS)
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-21 by [AI:Claude] - Version compatible InfinityFree (pas de triggers)
 *
 * @description
 * Ce fichier crée les tables nécessaires pour le système de suivi de projets :
 * - projects : Projets de crochet en cours ou terminés
 * - project_rows : Historique des rangs crochetés (compteur)
 * - project_stats : Statistiques pré-calculées pour performance
 *
 * NOTE: Les triggers ont été retirés pour compatibilité hébergement gratuit
 * La logique est gérée dans le code PHP (ProjectController.php)
 */

-- ============================================================================
-- TABLE: projects
-- Description: Projets de crochet (en cours, terminés, pause)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,

    -- Informations de base
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT NULL COMMENT 'hat, scarf, amigurumi, bag, garment, other',
    description TEXT DEFAULT NULL,

    -- Lien optionnel vers un patron généré
    pattern_id INT UNSIGNED DEFAULT NULL COMMENT 'Si créé depuis un patron Crochet Hub',

    -- Photos
    main_photo VARCHAR(500) DEFAULT NULL,
    photos JSON DEFAULT NULL COMMENT 'Array d\'URLs de photos',

    -- État du projet
    status ENUM('in_progress', 'completed', 'paused', 'abandoned') DEFAULT 'in_progress',

    -- Compteurs
    current_row INT DEFAULT 0 COMMENT 'Rang actuel',
    total_rows INT DEFAULT NULL COMMENT 'Nombre de rangs prévus (optionnel)',
    total_stitches INT DEFAULT 0 COMMENT 'Total de mailles crochetées',

    -- Temps
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    total_time INT DEFAULT 0 COMMENT 'Temps total en secondes',
    last_worked_at DATETIME DEFAULT NULL COMMENT 'Dernière fois travaillé dessus',

    -- Matériel
    yarn_brand VARCHAR(255) DEFAULT NULL,
    yarn_color VARCHAR(255) DEFAULT NULL,
    yarn_weight VARCHAR(50) DEFAULT NULL,
    hook_size VARCHAR(20) DEFAULT NULL,
    yarn_used_grams INT DEFAULT NULL COMMENT 'Grammes de laine utilisés',

    -- Notes
    notes TEXT DEFAULT NULL,
    pattern_notes TEXT DEFAULT NULL COMMENT 'Notes sur le patron suivi',

    -- Métadonnées
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Visible dans la galerie communautaire',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_user_status (user_id, status),
    INDEX idx_user_updated (user_id, updated_at DESC),
    INDEX idx_pattern (pattern_id),
    INDEX idx_public (is_public, created_at DESC),

    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_id) REFERENCES patterns(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: project_rows
-- Description: Historique des rangs crochetés (compteur)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_rows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,

    -- Numéro du rang
    row_num INT NOT NULL COMMENT 'Numéro du rang (1, 2, 3...)',

    -- Détails du rang
    stitch_count INT DEFAULT NULL COMMENT 'Nombre de mailles dans ce rang',
    stitch_type VARCHAR(100) DEFAULT NULL COMMENT 'Type de mailles (ms, bs, etc.)',

    -- Temps passé sur ce rang
    duration INT DEFAULT NULL COMMENT 'Temps en secondes pour ce rang',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,

    -- Notes spécifiques au rang
    notes TEXT DEFAULT NULL COMMENT 'Notes, erreurs, modifications',

    -- Difficulté ressentie (optionnel)
    difficulty_rating TINYINT DEFAULT NULL COMMENT '1-5, ressenti de difficulté',

    -- Photo du rang (optionnel)
    photo VARCHAR(500) DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_project_row (project_id, row_num),
    INDEX idx_project_created (project_id, created_at DESC),

    -- Foreign key
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

    -- Un seul enregistrement par rang dans un projet
    UNIQUE KEY unique_project_row (project_id, row_num)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: project_stats
-- Description: Statistiques pré-calculées par utilisateur (performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,

    -- Compteurs globaux
    total_projects INT DEFAULT 0,
    completed_projects INT DEFAULT 0,
    in_progress_projects INT DEFAULT 0,

    -- Temps
    total_crochet_time INT DEFAULT 0 COMMENT 'Temps total en secondes',

    -- Mailles
    total_stitches INT DEFAULT 0,
    total_rows INT DEFAULT 0,

    -- Vitesse moyenne
    avg_stitches_per_hour DECIMAL(8,2) DEFAULT NULL,
    avg_rows_per_hour DECIMAL(8,2) DEFAULT NULL,

    -- Dates
    first_project_at DATETIME DEFAULT NULL,
    last_project_at DATETIME DEFAULT NULL,

    -- Stats mensuelles (JSON)
    monthly_stats JSON DEFAULT NULL COMMENT 'Stats par mois {year-month: {projects, hours, stitches}}',

    -- Métadonnées
    last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: project_sessions
-- Description: Sessions de travail (pour timer auto)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,

    -- Session
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT NULL,
    duration INT DEFAULT 0 COMMENT 'Durée en secondes',

    -- Activité
    rows_completed INT DEFAULT 0 COMMENT 'Rangs terminés dans cette session',

    -- Notes
    notes TEXT DEFAULT NULL,

    -- Index
    INDEX idx_project_started (project_id, started_at DESC),

    -- Foreign key
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VUES UTILES - RETIREES (InfinityFree n'autorise pas CREATE VIEW)
-- ============================================================================

-- Si besoin, ces requêtes peuvent être exécutées directement dans le code PHP :

/*
-- Vue : Projets avec temps formaté
SELECT
    p.*,
    u.email as user_email,
    u.first_name,
    u.last_name,
    CONCAT(
        FLOOR(p.total_time / 3600), 'h ',
        FLOOR((p.total_time % 3600) / 60), 'min'
    ) as time_formatted,
    DATEDIFF(NOW(), p.last_worked_at) as days_since_last_work,
    CASE
        WHEN p.total_rows IS NOT NULL THEN ROUND((p.current_row / p.total_rows) * 100, 1)
        ELSE NULL
    END as completion_percentage
FROM projects p
JOIN users u ON p.user_id = u.id;

-- Vue : Top projets actifs (derniers travaillés)
SELECT
    p.id,
    p.user_id,
    p.name,
    p.type,
    p.current_row,
    p.main_photo,
    p.last_worked_at,
    DATEDIFF(NOW(), p.last_worked_at) as days_inactive
FROM projects p
WHERE p.status = 'in_progress'
ORDER BY p.last_worked_at DESC;
*/

-- ============================================================================
-- COMMENTAIRES FINAUX
-- ============================================================================

/**
 * Tables créées :
 * 1. projects : Projets de crochet
 * 2. project_rows : Historique des rangs (compteur)
 * 3. project_stats : Statistiques utilisateur (pré-calculées)
 * 4. project_sessions : Sessions de travail (timer)
 *
 * Vues (optionnelles) :
 * - v_projects_formatted : Projets avec données formatées
 * - v_active_projects : Projets actifs récents
 *
 * NOTE IMPORTANTE :
 * Les triggers ont été retirés. La logique doit être gérée dans le code PHP :
 * - Après INSERT project_rows : mettre à jour current_row, total_stitches, total_time
 * - Après UPDATE projects (status=completed) : mettre à jour project_stats
 */

-- [AI:Claude] Système de projets prêt ! (Version sans triggers)
