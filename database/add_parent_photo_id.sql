/**
 * @file add_parent_photo_id.sql
 * @brief Ajout colonne parent_photo_id pour tracking variations
 * @author Nathalie + AI Assistants
 * @created 2025-11-17
 * @modified 2025-11-17 by [AI:Claude] - Support multi-variations photos IA
 *
 * @description
 * Ajoute la colonne parent_photo_id pour tracker les variations générées
 * d'une même photo originale (workflow enhance-multiple)
 */

-- ============================================================================
-- Ajout colonne parent_photo_id
-- ============================================================================

ALTER TABLE user_photos
ADD COLUMN parent_photo_id INT UNSIGNED DEFAULT NULL COMMENT 'Photo originale dont cette photo est une variation' AFTER enhanced_path,
ADD FOREIGN KEY fk_parent_photo (parent_photo_id) REFERENCES user_photos(id) ON DELETE SET NULL,
ADD INDEX idx_parent (parent_photo_id);

-- ============================================================================
-- COMMENTAIRE
-- ============================================================================

/**
 * Migration terminée ! ✅
 *
 * Fonctionnalité :
 * - parent_photo_id : NULL = photo originale ou variation indépendante
 * - parent_photo_id : NOT NULL = variation générée depuis photo X
 *
 * Workflow enhance-multiple :
 * 1. Photo originale uploadée (parent_photo_id = NULL)
 * 2. Génération 5 variations avec différents contextes
 * 3. Chaque variation a parent_photo_id pointant vers l'originale
 *
 * Permet de :
 * - Grouper visuellement les variations
 * - Supprimer en cascade si l'originale est supprimée
 * - Afficher "X variations de cette photo"
 */

-- [AI:Claude] Multi-variations ready! 📸✨
