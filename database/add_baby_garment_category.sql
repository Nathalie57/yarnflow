-- Migration: Ajout de la catégorie "Vêtements bébé" pour projets
-- Version: 0.16.1
-- Date: 2026-01-07
-- Author: Nathalie + Claude

-- ============================================================================
-- 1. Modifier la table projects pour ajouter baby_garment au type
-- ============================================================================

ALTER TABLE projects
MODIFY COLUMN type VARCHAR(50) DEFAULT NULL
COMMENT 'hat, scarf, amigurumi, bag, garment, baby_garment, other';

-- Note: On garde VARCHAR au lieu de ENUM pour plus de flexibilité
-- Si la colonne était ENUM, il faudrait la modifier comme ceci:
-- ALTER TABLE projects MODIFY COLUMN type ENUM('hat', 'scarf', 'amigurumi', 'bag', 'garment', 'baby_garment', 'other') DEFAULT NULL;

-- ============================================================================
-- 2. Ajouter la catégorie dans pattern_categories pour cohérence
-- ============================================================================

-- Catégorie principale "Vêtements bébé"
INSERT INTO pattern_categories
(category_key, category_label, category_icon, subtype_key, subtype_label, subtype_description, available_sizes, display_order, is_active)
VALUES
('baby_garment', 'Vêtements bébé', '👶', NULL, NULL, NULL, '["0-3m", "3-6m", "6-12m", "12-18m", "18-24m"]', 6, TRUE);

-- Sous-catégories pour vêtements bébé
INSERT INTO pattern_categories
(category_key, category_label, category_icon, subtype_key, subtype_label, subtype_description, available_sizes, display_order, is_active)
VALUES
('baby_garment', 'Vêtements bébé', '👶', 'bodysuit', 'Body', 'Body pour bébé', NULL, 1, TRUE),
('baby_garment', 'Vêtements bébé', '👶', 'romper', 'Barboteuse', 'Combinaison courte', NULL, 2, TRUE),
('baby_garment', 'Vêtements bébé', '👶', 'cardigan', 'Gilet bébé', 'Petit cardigan', NULL, 3, TRUE),
('baby_garment', 'Vêtements bébé', '👶', 'booties', 'Chaussons', 'Petits chaussons chauds', NULL, 4, TRUE),
('baby_garment', 'Vêtements bébé', '👶', 'bib', 'Bavoir', 'Bavoir pratique', NULL, 5, TRUE),
('baby_garment', 'Vêtements bébé', '👶', 'blanket', 'Couverture', 'Petite couverture douce', NULL, 6, TRUE),
('baby_garment', 'Vêtements bébé', '👶', 'hat', 'Bonnet bébé', 'Petit bonnet pour nouveau-né', NULL, 7, TRUE);

-- ============================================================================
-- 3. (Optionnel) Mettre à jour les projets existants taggés "bébé"
-- ============================================================================

-- Si vous avez des projets de type "garment" avec le tag "bébé",
-- vous pouvez les convertir automatiquement (décommenter si souhaité):

-- UPDATE projects p
-- INNER JOIN project_tags pt ON p.id = pt.project_id
-- SET p.type = 'baby_garment'
-- WHERE p.type = 'garment'
-- AND pt.tag_name = 'bébé';

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Vérifier que la modification a fonctionné
SELECT COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'projects'
AND COLUMN_NAME = 'type';

-- Vérifier les nouvelles catégories
SELECT category_key, category_label, subtype_key, subtype_label
FROM pattern_categories
WHERE category_key = 'baby_garment';
