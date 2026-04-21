-- Migration: Ajout de la catégorie "Vêtements enfant" pour projets
-- Version: 0.17.1
-- Date: 2026-02-11
-- Author: Nathalie + Claude

-- ============================================================================
-- 1. Modifier la table projects pour ajouter child_garment au type
-- ============================================================================

ALTER TABLE projects
MODIFY COLUMN type VARCHAR(50) DEFAULT NULL
COMMENT 'hat, scarf, amigurumi, bag, garment, baby_garment, child_garment, other';

-- ============================================================================
-- 2. Ajouter la catégorie dans pattern_categories pour cohérence
-- ============================================================================

-- Catégorie principale "Vêtements enfant"
INSERT INTO pattern_categories
(category_key, category_label, category_icon, subtype_key, subtype_label, subtype_description, available_sizes, display_order, is_active)
VALUES
('child_garment', 'Vêtements enfant', '👧', NULL, NULL, NULL, '["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans"]', 7, TRUE);

-- Sous-catégories pour vêtements enfant
INSERT INTO pattern_categories
(category_key, category_label, category_icon, subtype_key, subtype_label, subtype_description, available_sizes, display_order, is_active)
VALUES
('child_garment', 'Vêtements enfant', '👧', 'sweater', 'Pull enfant', 'Pull pour enfant', NULL, 1, TRUE),
('child_garment', 'Vêtements enfant', '👧', 'cardigan', 'Gilet enfant', 'Gilet boutonné', NULL, 2, TRUE),
('child_garment', 'Vêtements enfant', '👧', 'dress', 'Robe enfant', 'Robe tricotée ou crochetée', NULL, 3, TRUE),
('child_garment', 'Vêtements enfant', '👧', 'vest', 'Débardeur', 'Sans manches', NULL, 4, TRUE),
('child_garment', 'Vêtements enfant', '👧', 'shorts', 'Short/Bloomer', 'Bas court', NULL, 5, TRUE),
('child_garment', 'Vêtements enfant', '👧', 'poncho', 'Poncho', 'Cape sans manches', NULL, 6, TRUE);

-- ============================================================================
-- Vérifications
-- ============================================================================

-- Vérifier les nouvelles catégories
SELECT category_key, category_label, subtype_key, subtype_label
FROM pattern_categories
WHERE category_key = 'child_garment';
