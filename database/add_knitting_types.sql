/**
 * @file add_knitting_types.sql
 * @brief Ajout des types de projets tricot pour Yarn Hub
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Ajout support tricot
 *
 * @description
 * Transformation de Crochet Hub → Yarn Hub
 * Ajout des types de projets tricot en plus du crochet
 */

-- ============================================================================
-- MODIFICATION: Ajouter une colonne "technique" aux projets
-- ============================================================================

-- [AI:Claude] Vérifier si la colonne existe déjà, sinon l'ajouter
SET @col_exists = (SELECT COUNT(*)
                   FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'projects'
                   AND COLUMN_NAME = 'technique');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE projects ADD COLUMN technique ENUM(''crochet'', ''tricot'') DEFAULT ''crochet'' AFTER type',
    'SELECT ''Column technique already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- [AI:Claude] Créer un index pour rechercher par technique si il n'existe pas
SET @idx_exists = (SELECT COUNT(*)
                   FROM INFORMATION_SCHEMA.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'projects'
                   AND INDEX_NAME = 'idx_technique');

SET @sql_idx = IF(@idx_exists = 0,
    'ALTER TABLE projects ADD INDEX idx_technique (technique)',
    'SELECT ''Index idx_technique already exists'' AS message');

PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- ============================================================================
-- COMMENTAIRE FINAL
-- ============================================================================

/**
 * Changements effectués :
 * - Ajout colonne "technique" (crochet/tricot) dans table projects
 * - Index pour filtrer par technique
 *
 * Types de projets tricot suggérés (à utiliser dans le champ "type") :
 * - pull, gilet, cardigan
 * - bonnet, écharpe, snood, châle
 * - chaussettes, mitaines, moufles
 * - couverture, plaid
 * - sac, pochette
 * - autre
 *
 * Types de projets crochet (existants) :
 * - hat, scarf, amigurumi, bag, garment
 * - shawl, blanket, accessory
 * - autre
 */

-- [AI:Claude] Yarn Hub prêt pour tricot + crochet ! 🧶
