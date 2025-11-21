/**
 * @file add_projects_system.sql
 * @brief Système de gestion de projets et compteur de rangs pour Crochet Hub
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création du système de projets/compteur
 *
 * @description
 * Ce fichier crée les tables nécessaires pour le système de suivi de projets :
 * - projects : Projets de crochet en cours ou terminés
 * - project_rows : Historique des rangs crochetés (compteur)
 * - project_stats : Statistiques pré-calculées pour performance
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
-- TRIGGERS : Mise à jour automatique des stats
-- ============================================================================

-- Trigger : Incrémenter current_row du projet quand un rang est ajouté
DELIMITER //
CREATE TRIGGER after_project_row_insert
AFTER INSERT ON project_rows
FOR EACH ROW
BEGIN
    UPDATE projects
    SET current_row = GREATEST(current_row, NEW.row_num),
        last_worked_at = NOW(),
        total_stitches = total_stitches + COALESCE(NEW.stitch_count, 0),
        total_time = total_time + COALESCE(NEW.duration, 0)
    WHERE id = NEW.project_id;
END//
DELIMITER ;

-- Trigger : Mettre à jour les stats utilisateur quand un projet est complété
DELIMITER //
CREATE TRIGGER after_project_completed
AFTER UPDATE ON projects
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Créer ou mettre à jour les stats utilisateur
        INSERT INTO project_stats (user_id, total_projects, completed_projects, total_crochet_time, total_stitches, total_rows, last_project_at)
        VALUES (NEW.user_id, 1, 1, NEW.total_time, NEW.total_stitches, NEW.current_row, NOW())
        ON DUPLICATE KEY UPDATE
            total_projects = total_projects + 1,
            completed_projects = completed_projects + 1,
            total_crochet_time = total_crochet_time + NEW.total_time,
            total_stitches = total_stitches + NEW.total_stitches,
            total_rows = total_rows + NEW.current_row,
            last_project_at = NOW();
    END IF;
END//
DELIMITER ;

-- ============================================================================
-- DONNÉES DE TEST (optionnel)
-- ============================================================================

-- Insérer un projet exemple pour l'utilisateur 1 (si existe)
-- INSERT INTO projects (user_id, name, type, description, status, current_row, yarn_brand, hook_size)
-- VALUES (1, 'Bonnet slouchy rouge', 'hat', 'Un bonnet décontracté pour l\'hiver', 'in_progress', 15, 'Phildar', '5mm');

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue : Projets avec temps formaté
CREATE OR REPLACE VIEW v_projects_formatted AS
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
CREATE OR REPLACE VIEW v_active_projects AS
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
 * Triggers :
 * - after_project_row_insert : Mise à jour auto du projet
 * - after_project_completed : Mise à jour auto des stats
 *
 * Vues :
 * - v_projects_formatted : Projets avec données formatées
 * - v_active_projects : Projets actifs récents
 */

-- [AI:Claude] Système de projets prêt pour Crochet Hub !
