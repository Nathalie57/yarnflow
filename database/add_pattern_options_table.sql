-- [AI:Claude] Table pour gérer les options de personnalisation des patrons
-- Créé le 2025-11-13

CREATE TABLE IF NOT EXISTS pattern_options (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Clé unique de l'option
    option_key VARCHAR(50) NOT NULL UNIQUE COMMENT 'Clé unique (color_count, pattern_style, etc.)',

    -- Informations générales
    option_group VARCHAR(50) NOT NULL COMMENT 'Groupe (dimensions, style, material, usage, format)',
    option_label VARCHAR(100) NOT NULL COMMENT 'Label affiché (Nombre de couleurs, Style de motif, etc.)',
    option_description TEXT DEFAULT NULL COMMENT 'Description détaillée de l\'option',

    -- Type de champ
    field_type ENUM('select', 'radio', 'checkbox', 'text', 'number', 'range', 'textarea') NOT NULL DEFAULT 'select',

    -- Valeurs possibles (JSON array pour select/radio/checkbox)
    available_values JSON DEFAULT NULL COMMENT '[{"value": "fitted", "label": "Ajusté", "description": "..."}]',

    -- Valeur par défaut
    default_value VARCHAR(100) DEFAULT NULL,

    -- Contraintes (pour number/range)
    min_value INT DEFAULT NULL,
    max_value INT DEFAULT NULL,
    step_value INT DEFAULT 1,

    -- Applicabilité
    applicable_categories JSON DEFAULT NULL COMMENT '["hat", "scarf"] ou null pour toutes',
    applicable_levels JSON DEFAULT NULL COMMENT '["beginner", "intermediate"] ou null pour tous',
    required_for_categories JSON DEFAULT NULL COMMENT 'Catégories où cette option est obligatoire',

    -- Affichage
    display_order INT DEFAULT 0 COMMENT 'Ordre d\'affichage dans le groupe',
    icon VARCHAR(10) DEFAULT NULL COMMENT 'Emoji icon optionnel',

    -- Impact sur l'IA
    ai_prompt_template TEXT DEFAULT NULL COMMENT 'Template pour injecter dans le prompt IA',
    affects_price BOOLEAN DEFAULT FALSE COMMENT 'Cette option affecte-t-elle le prix ?',
    price_modifier DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Modificateur de prix (+0.50, -0.20, etc.)',

    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE COMMENT 'Réservé aux abonnés premium',

    -- Métadonnées
    help_text TEXT DEFAULT NULL COMMENT 'Texte d\'aide pour l\'utilisateur',
    placeholder VARCHAR(255) DEFAULT NULL COMMENT 'Placeholder pour champs texte',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Index
    INDEX idx_option_group (option_group),
    INDEX idx_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- [AI:Claude] Insertion des options de personnalisation par défaut

-- ============================================
-- GROUPE : dimensions (Dimensions & Ajustement)
-- ============================================

INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, applicable_categories, display_order, icon, ai_prompt_template) VALUES
('fit_type', 'dimensions', 'Ajustement', 'Comment le patron doit-il s\'ajuster ?', 'radio',
'[
    {"value": "fitted", "label": "Ajusté", "description": "Près du corps, bien ajusté"},
    {"value": "regular", "label": "Normal", "description": "Ajustement standard, confortable"},
    {"value": "loose", "label": "Ample", "description": "Large et décontracté"},
    {"value": "oversized", "label": "Très ample", "description": "Style oversize"}
]',
'regular',
'["hat", "scarf", "garment"]',
1,
'📐',
'L\'ajustement doit être {value} : {description}'),

('length_preference', 'dimensions', 'Longueur', 'Longueur souhaitée du patron', 'radio',
'[
    {"value": "short", "label": "Court", "description": "Version courte"},
    {"value": "medium", "label": "Moyen", "description": "Longueur standard"},
    {"value": "long", "label": "Long", "description": "Version longue"},
    {"value": "extra_long", "label": "Très long", "description": "Version extra longue"}
]',
'medium',
'["scarf", "garment"]',
2,
'📏',
'La longueur doit être {label} : {description}'),

('elasticity', 'dimensions', 'Élasticité', 'Niveau d\'élasticité souhaité', 'radio',
'[
    {"value": "rigid", "label": "Rigide", "description": "Structure ferme, peu élastique"},
    {"value": "moderate", "label": "Modérée", "description": "Élasticité normale"},
    {"value": "stretchy", "label": "Élastique", "description": "Très élastique et souple"}
]',
'moderate',
'["hat", "garment", "bag"]',
3,
'🔄',
'L\'élasticité doit être {label} : {description}');

-- ============================================
-- GROUPE : style (Style & Esthétique)
-- ============================================

INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, display_order, icon, ai_prompt_template) VALUES
('color_count', 'style', 'Nombre de couleurs', 'Combien de couleurs différentes ?', 'radio',
'[
    {"value": "1", "label": "Uni (1 couleur)", "description": "Patron monochrome"},
    {"value": "2", "label": "Bicolore (2 couleurs)", "description": "Deux couleurs contrastées"},
    {"value": "3+", "label": "Multicolore (3+ couleurs)", "description": "Plusieurs couleurs variées"}
]',
'1',
1,
'🎨',
'Utiliser {label} dans le patron'),

('pattern_style', 'style', 'Style de motif', 'Type de motif décoratif', 'radio',
'[
    {"value": "solid", "label": "Uni", "description": "Point simple sans motif"},
    {"value": "striped", "label": "Rayé", "description": "Rayures horizontales ou verticales"},
    {"value": "geometric", "label": "Géométrique", "description": "Formes géométriques (carrés, triangles)"},
    {"value": "textured", "label": "Texturé", "description": "Points en relief (popcorn, bobbles)"},
    {"value": "lace", "label": "Dentelle", "description": "Points ajourés et délicats"},
    {"value": "cables", "label": "Torsades", "description": "Points torsadés entrelacés"},
    {"value": "jacquard", "label": "Jacquard", "description": "Motifs colorés complexes"},
    {"value": "fancy", "label": "Points fantaisie", "description": "Points décoratifs variés"}
]',
'solid',
2,
'✨',
'Le motif doit être de style {label} : {description}'),

('general_style', 'style', 'Style général', 'Ambiance et esthétique globale', 'radio',
'[
    {"value": "modern", "label": "Moderne", "description": "Lignes épurées, contemporain"},
    {"value": "vintage", "label": "Vintage", "description": "Rétro, classique intemporel"},
    {"value": "bohemian", "label": "Bohème", "description": "Libre, hippie chic"},
    {"value": "classic", "label": "Classique", "description": "Traditionnel et élégant"},
    {"value": "minimalist", "label": "Minimaliste", "description": "Simple et épuré"},
    {"value": "romantic", "label": "Romantique", "description": "Doux et féminin"},
    {"value": "rustic", "label": "Rustique", "description": "Naturel et chaleureux"},
    {"value": "playful", "label": "Ludique", "description": "Amusant et coloré (enfants)"}
]',
'classic',
3,
'🌟',
'Le style général doit être {label} : {description}'),

('season', 'style', 'Saison', 'Pour quelle saison ?', 'radio',
'[
    {"value": "summer", "label": "Été", "description": "Léger et aéré"},
    {"value": "spring_fall", "label": "Mi-saison", "description": "Printemps/Automne"},
    {"value": "winter", "label": "Hiver", "description": "Chaud et épais"},
    {"value": "all_seasons", "label": "Toutes saisons", "description": "Polyvalent"}
]',
'all_seasons',
4,
'🌤️',
'Conçu pour {label} : {description}');

-- ============================================
-- GROUPE : material (Fil & Matériel)
-- ============================================

INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, display_order, icon, ai_prompt_template) VALUES
('yarn_type', 'material', 'Type de fil', 'Matière du fil préférée', 'radio',
'[
    {"value": "any", "label": "Peu importe", "description": "L\'IA choisit selon le projet"},
    {"value": "cotton", "label": "Coton", "description": "Naturel, respirant, lavable"},
    {"value": "acrylic", "label": "Acrylique", "description": "Économique, facile d\'entretien"},
    {"value": "wool", "label": "Laine", "description": "Chaud, naturel, doux"},
    {"value": "bamboo", "label": "Bambou", "description": "Doux, écologique, soyeux"},
    {"value": "blend", "label": "Mélange", "description": "Mélange de fibres"},
    {"value": "chenille", "label": "Chenille", "description": "Doux et pelucheux"},
    {"value": "recycled", "label": "Recyclé", "description": "Écologique, récupéré"}
]',
'any',
1,
'🧶',
'Utiliser du fil en {label} : {description}'),

('yarn_weight', 'material', 'Épaisseur de fil', 'Épaisseur/poids du fil', 'radio',
'[
    {"value": "any", "label": "Peu importe", "description": "L\'IA choisit selon le projet"},
    {"value": "lace", "label": "Extra fin (Lace)", "description": "Fil dentelle, très fin"},
    {"value": "fingering", "label": "Fin (Fingering)", "description": "Fil fin, chaussettes"},
    {"value": "sport", "label": "Sport/DK", "description": "Fil moyen-fin"},
    {"value": "worsted", "label": "Moyen (Worsted)", "description": "Fil standard polyvalent"},
    {"value": "bulky", "label": "Épais (Bulky)", "description": "Fil épais, rapide"},
    {"value": "super_bulky", "label": "Très épais (Super Bulky)", "description": "Fil très épais"}
]',
'any',
2,
'📏',
'Utiliser un fil d\'épaisseur {label} : {description}'),

('hook_size', 'material', 'Taille de crochet suggérée', 'Préférence de taille de crochet (optionnel)', 'select',
'[
    {"value": "auto", "label": "Automatique (recommandé)", "description": "L\'IA choisit selon le fil"},
    {"value": "2.0", "label": "2.0 mm", "description": "Très petit"},
    {"value": "2.5", "label": "2.5 mm", "description": "Petit"},
    {"value": "3.0", "label": "3.0 mm", "description": "Petit-moyen"},
    {"value": "3.5", "label": "3.5 mm", "description": "Moyen"},
    {"value": "4.0", "label": "4.0 mm", "description": "Moyen-standard"},
    {"value": "4.5", "label": "4.5 mm", "description": "Standard"},
    {"value": "5.0", "label": "5.0 mm", "description": "Standard-large"},
    {"value": "5.5", "label": "5.5 mm", "description": "Large"},
    {"value": "6.0", "label": "6.0 mm", "description": "Large"},
    {"value": "7.0", "label": "7.0 mm", "description": "Très large"},
    {"value": "8.0", "label": "8.0 mm", "description": "Extra large"},
    {"value": "9.0", "label": "9.0 mm", "description": "XXL"},
    {"value": "10.0", "label": "10.0 mm", "description": "XXL+"}
]',
'auto',
3,
'🪝',
'Utiliser un crochet de {label}');

-- ============================================
-- GROUPE : usage (Usage & Praticité)
-- ============================================

INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, display_order, icon, ai_prompt_template) VALUES
('intended_use', 'usage', 'Usage prévu', 'À quoi va servir ce patron ?', 'radio',
'[
    {"value": "personal", "label": "Usage personnel", "description": "Pour moi ou ma famille"},
    {"value": "gift", "label": "Cadeau", "description": "Pour offrir"},
    {"value": "decor", "label": "Décoration", "description": "Objet décoratif"},
    {"value": "sale", "label": "Vente", "description": "Pour vendre mes créations"},
    {"value": "daily", "label": "Usage quotidien", "description": "Utilisation fréquente"}
]',
'personal',
1,
'🎯',
'Usage prévu : {label} - {description}'),

('care_level', 'usage', 'Facilité d\'entretien', 'Niveau d\'entretien souhaité', 'radio',
'[
    {"value": "easy", "label": "Facile", "description": "Lavable en machine, séchage normal"},
    {"value": "moderate", "label": "Modéré", "description": "Lavage délicat recommandé"},
    {"value": "delicate", "label": "Délicat", "description": "Lavage à la main uniquement"}
]',
'easy',
2,
'🧼',
'Entretien {label} : {description}'),

('durability', 'usage', 'Durabilité', 'Résistance souhaitée', 'radio',
'[
    {"value": "everyday", "label": "Usage quotidien", "description": "Résistant et durable"},
    {"value": "occasional", "label": "Usage occasionnel", "description": "Durabilité standard"},
    {"value": "decorative", "label": "Décoratif", "description": "Esthétique avant tout"}
]',
'everyday',
3,
'💪',
'Durabilité : {label} - {description}');

-- ============================================
-- GROUPE : format (Format du patron)
-- ============================================

INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, display_order, icon, ai_prompt_template) VALUES
('detail_level', 'format', 'Niveau de détail', 'Combien de détails dans les instructions ?', 'radio',
'[
    {"value": "very_detailed", "label": "Très détaillé", "description": "Instructions pas à pas, idéal débutants"},
    {"value": "standard", "label": "Standard", "description": "Instructions claires et complètes"},
    {"value": "condensed", "label": "Condensé", "description": "Instructions courtes pour experts"}
]',
'standard',
1,
'📋',
'Niveau de détail : {label} - {description}'),

('include_diagrams', 'format', 'Avec schémas', 'Inclure des schémas visuels ?', 'radio',
'[
    {"value": "yes", "label": "Oui", "description": "Avec schémas et diagrammes"},
    {"value": "no", "label": "Non", "description": "Texte uniquement"}
]',
'yes',
2,
'📊',
'Schémas : {value}'),

('include_photos', 'format', 'Photos de progression', 'Inclure des suggestions de photos ?', 'radio',
'[
    {"value": "yes", "label": "Oui", "description": "Avec indications pour photos étapes"},
    {"value": "no", "label": "Non", "description": "Pas de photos"}
]',
'no',
3,
'📸',
'Photos de progression : {value}'),

('abbreviations_list', 'format', 'Liste des abréviations', 'Inclure un glossaire des abréviations ?', 'radio',
'[
    {"value": "yes", "label": "Oui (recommandé)", "description": "Avec glossaire complet"},
    {"value": "no", "label": "Non", "description": "Sans glossaire"}
]',
'yes',
4,
'📖',
'Glossaire : {value}');

-- ============================================
-- GROUPE : special (Options spéciales - variables selon catégorie)
-- ============================================

-- Pour les vêtements
INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, applicable_categories, display_order, icon, ai_prompt_template) VALUES
('neckline', 'special', 'Type de col', 'Style de l\'encolure', 'radio',
'[
    {"value": "round", "label": "Col rond", "description": "Encolure ronde classique"},
    {"value": "v_neck", "label": "Col V", "description": "Encolure en V"},
    {"value": "square", "label": "Col carré", "description": "Encolure carrée"},
    {"value": "boat", "label": "Col bateau", "description": "Encolure horizontale large"},
    {"value": "cowl", "label": "Col roulé", "description": "Col montant"},
    {"value": "none", "label": "Sans col", "description": "Pas d\'encolure spécifique"}
]',
'round',
'["garment"]',
1,
'👔',
'Encolure : {label} - {description}'),

('sleeves', 'special', 'Type de manches', 'Style des manches', 'radio',
'[
    {"value": "sleeveless", "label": "Sans manches", "description": "Débardeur"},
    {"value": "short", "label": "Manches courtes", "description": "T-shirt"},
    {"value": "three_quarter", "label": "Manches 3/4", "description": "Mi-longues"},
    {"value": "long", "label": "Manches longues", "description": "Pull"},
    {"value": "bell", "label": "Manches évasées", "description": "Style bohème"}
]',
'short',
'["garment"]',
2,
'👕',
'Manches : {label} - {description}'),

('closure', 'special', 'Type de fermeture', 'Fermeture du vêtement', 'radio',
'[
    {"value": "none", "label": "Sans fermeture", "description": "Pull-over"},
    {"value": "buttons", "label": "Boutons", "description": "Boutonnage devant"},
    {"value": "zipper", "label": "Fermeture éclair", "description": "Zip"},
    {"value": "ties", "label": "Liens", "description": "Nouage"}
]',
'none',
'["garment", "bag"]',
3,
'🔘',
'Fermeture : {label} - {description}');

-- Pour les amigurumis
INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, applicable_categories, display_order, icon, ai_prompt_template) VALUES
('amigurumi_size_cm', 'special', 'Taille finale (cm)', 'Hauteur approximative de l\'amigurumi', 'number',
NULL,
'15',
'["amigurumi"]',
1,
'📐',
'Taille finale environ {value} cm de hauteur'),

('amigurumi_accessories', 'special', 'Avec accessoires', 'Inclure des accessoires (vêtements, etc.) ?', 'radio',
'[
    {"value": "none", "label": "Sans accessoires", "description": "Amigurumi seul"},
    {"value": "simple", "label": "Accessoires simples", "description": "Quelques petits détails"},
    {"value": "complete", "label": "Accessoires complets", "description": "Tenue complète"}
]',
'simple',
'["amigurumi"]',
2,
'🎀',
'Accessoires : {label} - {description}'),

('amigurumi_expression', 'special', 'Expression du visage', 'Style des yeux et bouche', 'radio',
'[
    {"value": "cute", "label": "Mignon", "description": "Kawaii, adorable"},
    {"value": "realistic", "label": "Réaliste", "description": "Plus réaliste"},
    {"value": "simple", "label": "Simple", "description": "Minimaliste"},
    {"value": "happy", "label": "Joyeux", "description": "Sourire prononcé"},
    {"value": "sleepy", "label": "Endormi", "description": "Yeux fermés"}
]',
'cute',
'["amigurumi"]',
3,
'😊',
'Expression : {label} - {description}');

-- Pour les sacs
INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, applicable_categories, display_order, icon, ai_prompt_template) VALUES
('bag_lining', 'special', 'Avec doublure', 'Doublure intérieure en tissu ?', 'radio',
'[
    {"value": "yes", "label": "Oui", "description": "Avec doublure en tissu"},
    {"value": "no", "label": "Non", "description": "Sans doublure"}
]',
'no',
'["bag"]',
1,
'🧵',
'Doublure : {label}'),

('bag_handles', 'special', 'Type d\'anses', 'Style des anses/bretelles', 'radio',
'[
    {"value": "short", "label": "Anses courtes", "description": "Porté main"},
    {"value": "long", "label": "Anses longues", "description": "Porté épaule"},
    {"value": "straps", "label": "Bretelles", "description": "Sac à dos"},
    {"value": "chain", "label": "Chaîne", "description": "Style pochette"},
    {"value": "none", "label": "Sans anses", "description": "Pochette clutch"}
]',
'short',
'["bag"]',
2,
'👜',
'Anses : {label} - {description}'),

('bag_pockets', 'special', 'Poches', 'Inclure des poches ?', 'radio',
'[
    {"value": "none", "label": "Sans poches", "description": "Design simple"},
    {"value": "internal", "label": "Poches intérieures", "description": "Poches à l\'intérieur"},
    {"value": "external", "label": "Poches extérieures", "description": "Poches visibles"},
    {"value": "both", "label": "Les deux", "description": "Int. et ext."}
]',
'none',
'["bag"]',
3,
'👛',
'Poches : {label} - {description}');

-- ============================================
-- GROUPE : creative (Personnalisation créative)
-- ============================================

INSERT INTO pattern_options (option_key, option_group, option_label, option_description, field_type, available_values, default_value, display_order, icon, placeholder, ai_prompt_template, help_text) VALUES
('theme', 'creative', 'Thème spécifique', 'Thème ou inspiration (optionnel)', 'text',
NULL,
NULL,
1,
'🎭',
'Ex: fleurs, océan, forêt, géométrique...',
'Thème/inspiration : {value}',
'Ajoutez un thème pour personnaliser davantage (animaux, nature, etc.)'),

('custom_message', 'creative', 'Message personnalisé', 'Un message à intégrer ? (optionnel)', 'textarea',
NULL,
NULL,
2,
'💬',
'Ex: Pour un cadeau spécial, avec un motif particulier...',
'Message personnalisé : {value}',
'Décrivez une idée spéciale, un motif particulier, ou toute demande créative'),

('inspiration_reference', 'creative', 'Référence d\'inspiration', 'Décrivez une inspiration (optionnel)', 'textarea',
NULL,
NULL,
3,
'💡',
'Ex: Un pull que j\'ai vu, un style particulier...',
'Inspiration : {value}',
'Décrivez quelque chose qui vous inspire pour ce patron');
