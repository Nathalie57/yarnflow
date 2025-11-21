-- [AI:Claude] Table pour gérer les catégories et sous-catégories de patrons
-- Créé le 2025-11-13

CREATE TABLE IF NOT EXISTS pattern_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Type de catégorie
    category_key VARCHAR(50) NOT NULL COMMENT 'Clé unique (hat, scarf, amigurumi, bag, garment)',
    category_label VARCHAR(100) NOT NULL COMMENT 'Label affiché (Bonnets, Écharpes, etc.)',
    category_icon VARCHAR(10) DEFAULT NULL COMMENT 'Emoji icon (🧢, 🧣, etc.)',

    -- Sous-catégorie (NULL si c'est une catégorie principale)
    subtype_key VARCHAR(50) DEFAULT NULL COMMENT 'Clé unique du sous-type (beanie, slouchy, etc.)',
    subtype_label VARCHAR(100) DEFAULT NULL COMMENT 'Label du sous-type',
    subtype_description TEXT DEFAULT NULL COMMENT 'Description du sous-type',

    -- Tailles disponibles pour cette catégorie (JSON array)
    available_sizes JSON DEFAULT NULL COMMENT '["baby", "child", "adult"] ou ["small", "medium", "large"]',

    -- Ordre d'affichage
    display_order INT DEFAULT 0 COMMENT 'Ordre d\'affichage dans l\'interface',

    -- Statut
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_category_key (category_key),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_category_subtype (category_key, subtype_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [AI:Claude] Insertion des catégories actuelles depuis Generator.jsx
INSERT INTO pattern_categories (category_key, category_label, category_icon, subtype_key, subtype_label, subtype_description, available_sizes, display_order) VALUES
-- Bonnets
('hat', 'Bonnets', '🧢', NULL, NULL, NULL, '["baby", "child", "adult"]', 1),
('hat', 'Bonnets', '🧢', 'beanie', 'Beanie', 'Bonnet ajusté classique', NULL, 1),
('hat', 'Bonnets', '🧢', 'slouchy', 'Slouchy', 'Bonnet ample et décontracté', NULL, 2),
('hat', 'Bonnets', '🧢', 'pompom', 'À pompon', 'Avec pompon décoratif', NULL, 3),
('hat', 'Bonnets', '🧢', 'ears', 'Avec oreilles', 'Style animal ou rabats', NULL, 4),
('hat', 'Bonnets', '🧢', 'beret', 'Béret', 'Style français classique', NULL, 5),

-- Écharpes & Châles
('scarf', 'Écharpes & Châles', '🧣', NULL, NULL, NULL, '["short", "medium", "long"]', 2),
('scarf', 'Écharpes & Châles', '🧣', 'straight', 'Écharpe droite', 'Rectangle simple classique', NULL, 1),
('scarf', 'Écharpes & Châles', '🧣', 'infinity', 'Écharpe infinie', 'Tour de cou fermé (snood)', NULL, 2),
('scarf', 'Écharpes & Châles', '🧣', 'shawl', 'Châle triangulaire', 'Grande pièce triangulaire', NULL, 3),
('scarf', 'Écharpes & Châles', '🧣', 'stole', 'Étole', 'Longue et large', NULL, 4),
('scarf', 'Écharpes & Châles', '🧣', 'cowl', 'Cache-cou', 'Court tour de cou', NULL, 5),

-- Amigurumis
('amigurumi', 'Amigurumis', '🧸', NULL, NULL, NULL, '["small", "medium", "large"]', 3),
('amigurumi', 'Amigurumis', '🧸', 'bear', 'Ourson', 'Nounours classique', NULL, 1),
('amigurumi', 'Amigurumis', '🧸', 'cat', 'Chat', 'Minou mignon', NULL, 2),
('amigurumi', 'Amigurumis', '🧸', 'dog', 'Chien', 'Toutou adorable', NULL, 3),
('amigurumi', 'Amigurumis', '🧸', 'rabbit', 'Lapin', 'Lapinou à longues oreilles', NULL, 4),
('amigurumi', 'Amigurumis', '🧸', 'bird', 'Oiseau', 'Petit oiseau coloré', NULL, 5),
('amigurumi', 'Amigurumis', '🧸', 'marine', 'Animal marin', 'Poisson, baleine, tortue...', NULL, 6),
('amigurumi', 'Amigurumis', '🧸', 'food', 'Nourriture', 'Fruits, légumes, sucreries', NULL, 7),
('amigurumi', 'Amigurumis', '🧸', 'character', 'Personnage', 'Poupée ou personnage', NULL, 8),

-- Sacs
('bag', 'Sacs', '👜', NULL, NULL, NULL, '["small", "medium", "large"]', 4),
('bag', 'Sacs', '👜', 'market', 'Sac de marché', 'Filet extensible pour courses', NULL, 1),
('bag', 'Sacs', '👜', 'handbag', 'Sac à main', 'Sac fashion porté à la main', NULL, 2),
('bag', 'Sacs', '👜', 'clutch', 'Pochette', 'Petite pochette plate', NULL, 3),
('bag', 'Sacs', '👜', 'basket', 'Panier', 'Panier de rangement rigide', NULL, 4),
('bag', 'Sacs', '👜', 'tote', 'Cabas', 'Grand sac fourre-tout', NULL, 5),
('bag', 'Sacs', '👜', 'backpack', 'Sac à dos', 'Avec bretelles', NULL, 6),

-- Vêtements
('garment', 'Vêtements', '👕', NULL, NULL, NULL, '["XS", "S", "M", "L", "XL"]', 5),
('garment', 'Vêtements', '👕', 'top', 'Top/Débardeur', 'Haut sans manches', NULL, 1),
('garment', 'Vêtements', '👕', 'tshirt', 'T-shirt', 'Haut à manches courtes', NULL, 2),
('garment', 'Vêtements', '👕', 'sweater', 'Pull', 'Pull à manches longues', NULL, 3),
('garment', 'Vêtements', '👕', 'cardigan', 'Cardigan', 'Gilet ouvert devant', NULL, 4),
('garment', 'Vêtements', '👕', 'skirt', 'Jupe', 'Jupe au crochet', NULL, 5),
('garment', 'Vêtements', '👕', 'collar', 'Col', 'Col amovible', NULL, 6),
('garment', 'Vêtements', '👕', 'belt', 'Ceinture', 'Ceinture décorative', NULL, 7);
