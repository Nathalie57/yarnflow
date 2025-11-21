-- Script d'insertion de pattern templates de référence
-- Pour améliorer la qualité des générations IA
-- À exécuter après l'import du schema.sql

USE patron_maker;

-- ============================================
-- BONNETS (HATS)
-- ============================================

-- Bonnet slouchy débutant
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Bonnet slouchy facile', 'hat', 'slouchy', 'beginner', 'adult', '{
  "title": "Bonnet slouchy décontracté",
  "description": "Un bonnet ample et confortable, parfait pour les débutants",
  "abbreviations": {
    "ml": "maille en l''air",
    "mc": "maille coulée",
    "ms": "maille serrée",
    "bs": "bride simple",
    "db": "double bride",
    "aug": "augmentation (2 mailles dans la même maille)",
    "dim": "diminution (2 mailles ensemble)"
  },
  "materials": [
    "200g de fil acrylique épais (épaisseur 5 - bulky)",
    "Crochet 6mm",
    "Aiguille à laine pour rentrer les fils",
    "Marqueur de mailles (optionnel)"
  ],
  "gauge": {
    "stitches": "14 ms = 10cm",
    "rows": "16 rangs = 10cm"
  },
  "instructions": "**TOUR 1:**\\n6 ms dans un cercle magique [6]\\n\\n**TOUR 2:**\\n2 ms dans chaque maille [12]\\n\\n**TOUR 3:**\\n*1 ms, aug* répéter 6 fois [18]\\n\\n**TOUR 4:**\\n*2 ms, aug* répéter 6 fois [24]\\n\\n**TOUR 5:**\\n*3 ms, aug* répéter 6 fois [30]\\n\\n**TOUR 6:**\\n*4 ms, aug* répéter 6 fois [36]\\n\\n**TOUR 7:**\\n*5 ms, aug* répéter 6 fois [42]\\n\\n**TOUR 8:**\\n*6 ms, aug* répéter 6 fois [48]\\n\\n**TOUR 9:**\\n*7 ms, aug* répéter 6 fois [54]\\n\\n**TOURS 10-25:**\\n1 ms dans chaque maille [54]\\n\\n**FINITIONS:**\\nCouper le fil en laissant 15cm, passer l''aiguille à travers la dernière maille et rentrer les fils.",
  "tips": [
    "Utilisez un marqueur pour repérer le début des tours",
    "Ne serrez pas trop vos mailles pour garder l''effet slouchy",
    "Bloquez légèrement à la vapeur pour un meilleur tombé"
  ],
  "time_estimate": "3-4 heures"
}', '["facile", "rapide", "slouchy", "debutant"]', 1);

-- Bonnet beanie classique débutant
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Bonnet beanie classique', 'hat', 'beanie', 'beginner', 'adult', '{
  "title": "Beanie ajusté simple",
  "description": "Un bonnet classique bien ajusté, idéal pour débuter",
  "abbreviations": {
    "ml": "maille en l''air",
    "mc": "maille coulée",
    "ms": "maille serrée",
    "bs": "bride simple"
  },
  "materials": [
    "150g de laine DK (épaisseur 3)",
    "Crochet 4mm",
    "Aiguille à laine"
  ],
  "gauge": {
    "stitches": "18 ms = 10cm",
    "rows": "20 rangs = 10cm"
  },
  "instructions": "**TOUR 1:**\\n6 ms dans cercle magique [6]\\n\\n**TOUR 2:**\\n2 ms dans chaque maille [12]\\n\\n**TOUR 3:**\\n*1 ms, aug* répéter [18]\\n\\n**TOUR 4:**\\n*2 ms, aug* répéter [24]\\n\\n**TOUR 5:**\\n*3 ms, aug* répéter [30]\\n\\n**TOUR 6:**\\n*4 ms, aug* répéter [36]\\n\\n**TOUR 7:**\\n*5 ms, aug* répéter [42]\\n\\n**TOUR 8:**\\n*6 ms, aug* répéter [48]\\n\\n**TOURS 9-20:**\\n1 ms dans chaque maille [48]\\n\\n**BORDURE (optionnelle):**\\nFaire 2 tours de côtes : *1 ms relief avant, 1 ms relief arrière* répéter.",
  "tips": [
    "Essayez régulièrement pour vérifier la taille",
    "La bordure en côtes donne un meilleur ajustement"
  ],
  "time_estimate": "3 heures"
}', '["classique", "ajuste", "beanie", "simple"]', 1);

-- Bonnet enfant intermédiaire
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Bonnet coloré enfant', 'hat', 'beanie', 'intermediate', 'child', '{
  "title": "Bonnet rayé coloré pour enfant",
  "description": "Bonnet avec rayures et pompon pour les enfants",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée",
    "bs": "bride simple",
    "aug": "augmentation"
  },
  "materials": [
    "100g de laine DK couleur principale",
    "50g de laine DK couleur contrastante",
    "Crochet 4mm",
    "Aiguille à laine",
    "Carton pour pompon"
  ],
  "gauge": {
    "stitches": "18 ms = 10cm",
    "rows": "20 rangs = 10cm"
  },
  "instructions": "**Avec couleur principale:**\\n\\n**TOUR 1:**\\n6 ms dans cercle magique [6]\\n\\n**TOUR 2:**\\naug dans chaque maille [12]\\n\\n**TOUR 3:**\\n*1 ms, aug* répéter [18]\\n\\n**TOUR 4:**\\n*2 ms, aug* répéter [24]\\n\\n**TOUR 5:**\\n*3 ms, aug* répéter [30]\\n\\n**TOUR 6:**\\n*4 ms, aug* répéter [36]\\n\\n**TOUR 7:**\\n*5 ms, aug* répéter [42]\\n\\n**TOURS 8-10:**\\n1 ms dans chaque maille [42]\\n\\n**Changer pour couleur contrastante:**\\n\\n**TOURS 11-13:**\\n1 ms dans chaque maille [42]\\n\\n**Revenir à couleur principale:**\\n\\n**TOURS 14-18:**\\n1 ms dans chaque maille [42]\\n\\n**FINITIONS:**\\nRéaliser un pompon de 6cm et l''attacher au sommet.",
  "tips": [
    "Changez de couleur en fin de tour pour des rayures nettes",
    "Tour de tête enfant : environ 50-52cm"
  ],
  "time_estimate": "4 heures"
}', '["enfant", "colore", "rayures", "pompon"]', 1);

-- ============================================
-- ÉCHARPES (SCARVES)
-- ============================================

-- Écharpe simple débutant
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Écharpe classique simple', 'scarf', NULL, 'beginner', 'long', '{
  "title": "Écharpe droite en mailles serrées",
  "description": "Une écharpe toute simple et rapide à réaliser",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée"
  },
  "materials": [
    "300g de laine chunky (épaisseur 5)",
    "Crochet 8mm",
    "Aiguille à laine"
  ],
  "gauge": {
    "stitches": "10 ms = 10cm",
    "rows": "12 rangs = 10cm"
  },
  "instructions": "**RANG 1 (chaînette de base):**\\nMonter 25 ml\\n\\n**RANG 2:**\\n1 ms dans la 2ème ml à partir du crochet, puis 1 ms dans chaque ml jusqu''à la fin [24 ms]\\n\\n**RANG 3 et suivants:**\\n1 ml pour tourner, 1 ms dans chaque maille du rang précédent [24 ms]\\n\\n**Répéter le rang 3 jusqu''à obtenir la longueur désirée (environ 150cm pour une écharpe longue).**\\n\\n**FINITIONS:**\\nCouper le fil, rentrer les fils. Ajouter des franges si désiré (couper 48 brins de 25cm, attacher 2 brins par maille à chaque extrémité).",
  "tips": [
    "Gardez une tension régulière pour une largeur uniforme",
    "Comptez vos mailles régulièrement pour éviter les erreurs",
    "Les franges sont optionnelles mais ajoutent du style"
  ],
  "time_estimate": "5-6 heures"
}', '["simple", "rapide", "droite", "franges"]', 1);

-- Écharpe point fantaisie intermédiaire
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Écharpe point coquille', 'scarf', 'shell-stitch', 'intermediate', 'medium', '{
  "title": "Écharpe élégante au point coquille",
  "description": "Une écharpe avec un joli motif de coquilles",
  "abbreviations": {
    "ml": "maille en l''air",
    "mc": "maille coulée",
    "ms": "maille serrée",
    "bs": "bride simple",
    "coquille": "5 bs dans la même maille"
  },
  "materials": [
    "250g de laine DK",
    "Crochet 4.5mm",
    "Aiguille à laine"
  ],
  "gauge": {
    "stitches": "1 motif coquille = 3cm",
    "rows": "4 rangs = 10cm"
  },
  "instructions": "**RANG 1:**\\nMonter un multiple de 6 ml + 1 (ex: 37 ml pour 6 coquilles)\\n\\n**RANG 2:**\\n1 ms dans 2ème ml, *sauter 2 ml, coquille (5 bs) dans ml suivante, sauter 2 ml, 1 ms*, répéter de * à * jusqu''à la fin\\n\\n**RANG 3:**\\n3 ml (compte comme 1ère bs), tourner, 2 bs dans 1ère ms, *1 ms au centre de la coquille (dans la 3ème bs), coquille dans ms suivante*, répéter, terminer par 3 bs dans dernière ms\\n\\n**RANG 4:**\\n1 ml, tourner, 1 ms dans 1ère bs, *coquille dans ms, 1 ms au centre de la coquille*, répéter\\n\\n**Répéter les rangs 3 et 4 jusqu''à la longueur désirée (environ 120cm).**\\n\\n**FINITIONS:**\\nBordure en ms tout autour pour finir proprement.",
  "tips": [
    "Le point coquille consomme beaucoup de fil, prévoyez large",
    "Bloquez l''écharpe pour bien ouvrir les coquilles"
  ],
  "time_estimate": "8 heures"
}', '["coquille", "elegant", "motif", "intermediaire"]', 1);

-- ============================================
-- AMIGURUMIS
-- ============================================

-- Petit ourson débutant
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Petit ourson kawaii', 'amigurumi', 'bear', 'beginner', 'small', '{
  "title": "Ourson amigurumi mignon",
  "description": "Un petit ourson adorable pour débuter les amigurumis",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée",
    "aug": "augmentation",
    "dim": "diminution"
  },
  "materials": [
    "50g de coton DK beige",
    "Restes de coton noir pour les yeux et le nez",
    "Crochet 3mm",
    "Rembourrage",
    "Aiguille à laine",
    "Yeux de sécurité 8mm (optionnel)"
  ],
  "gauge": {
    "stitches": "Serré pour éviter que le rembourrage ne se voit"
  },
  "instructions": "**TÊTE:**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug dans chaque ms [12]\\n**TOUR 3:** *1 ms, aug* ×6 [18]\\n**TOUR 4:** *2 ms, aug* ×6 [24]\\n**TOUR 5:** *3 ms, aug* ×6 [30]\\n**TOURS 6-10:** 1 ms dans chaque ms [30]\\n**TOUR 11:** *3 ms, dim* ×6 [24]\\n**TOUR 12:** *2 ms, dim* ×6 [18]\\nPoser les yeux entre tours 8 et 9, espacés de 6 mailles\\n**TOUR 13:** *1 ms, dim* ×6 [12]\\nRembourrer fermement\\n**TOUR 14:** dim ×6 [6]\\nFermer, rentrer le fil\\n\\n**CORPS:**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOUR 3:** *1 ms, aug* ×6 [18]\\n**TOUR 4:** *2 ms, aug* ×6 [24]\\n**TOURS 5-9:** 1 ms dans chaque ms [24]\\n**TOUR 10:** *2 ms, dim* ×6 [18]\\n**TOUR 11:** *1 ms, dim* ×6 [12]\\nRembourrer\\n**TOUR 12:** dim ×6 [6]\\nFermer\\n\\n**OREILLES (×2):**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOURS 3-4:** 1 ms dans chaque ms [12]\\nLaisser une longueur pour coudre\\n\\n**BRAS (×2):**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOURS 2-8:** 1 ms dans chaque ms [6]\\nNe pas rembourrer, laisser plat\\n\\n**JAMBES (×2):**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOURS 3-6:** 1 ms dans chaque ms [12]\\n**TOUR 7:** dim ×6 [6]\\nRembourrer légèrement\\n\\n**ASSEMBLAGE:**\\nCoudre la tête sur le corps, les oreilles sur la tête (tours 3-4), les bras sur les côtés du corps, les jambes en bas. Broder le nez et la bouche au fil noir.",
  "tips": [
    "Travaillez serré pour que le rembourrage ne se voit pas",
    "Utilisez des épingles pour positionner les pièces avant de coudre",
    "Marquez le début des tours avec un marqueur"
  ],
  "time_estimate": "4-5 heures"
}', '["ourson", "kawaii", "peluche", "cadeau"]', 1);

-- Petit chat intermédiaire
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Chat amigurumi assis', 'amigurumi', 'cat', 'intermediate', 'medium', '{
  "title": "Chat mignon en position assise",
  "description": "Un adorable chat avec queue et oreilles pointues",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée",
    "aug": "augmentation",
    "dim": "diminution",
    "bs": "bride simple"
  },
  "materials": [
    "100g de coton DK (couleur au choix)",
    "Restes de coton rose pour le nez",
    "Crochet 3.5mm",
    "Rembourrage",
    "Yeux de sécurité 10mm",
    "Aiguille à laine"
  ],
  "gauge": {
    "stitches": "Travail serré recommandé"
  },
  "instructions": "**TÊTE:**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOUR 3:** *1 ms, aug* ×6 [18]\\n**TOUR 4:** *2 ms, aug* ×6 [24]\\n**TOUR 5:** *3 ms, aug* ×6 [30]\\n**TOUR 6:** *4 ms, aug* ×6 [36]\\n**TOURS 7-12:** 1 ms dans chaque ms [36]\\n**TOUR 13:** *4 ms, dim* ×6 [30]\\n**TOUR 14:** *3 ms, dim* ×6 [24]\\nPoser les yeux entre tours 10 et 11\\n**TOUR 15:** *2 ms, dim* ×6 [18]\\nRembourrer\\n**TOUR 16:** *1 ms, dim* ×6 [12]\\n**TOUR 17:** dim ×6 [6]\\nFermer\\n\\n**CORPS:**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOUR 3:** *1 ms, aug* ×6 [18]\\n**TOUR 4:** *2 ms, aug* ×6 [24]\\n**TOUR 5:** *3 ms, aug* ×6 [30]\\n**TOURS 6-14:** 1 ms dans chaque ms [30]\\n**TOUR 15:** *3 ms, dim* ×6 [24]\\n**TOUR 16:** *2 ms, dim* ×6 [18]\\nRembourrer\\n**TOUR 17:** *1 ms, dim* ×6 [12]\\n**TOUR 18:** dim ×6 [6]\\nFermer\\n\\n**OREILLES (×2) - triangulaires:**\\n\\n**TOUR 1:** 4 ms dans cercle magique [4]\\n**TOUR 2:** *1 ms, aug* ×2 [6]\\n**TOUR 3:** *2 ms, aug* ×2 [8]\\n**TOUR 4:** *3 ms, aug* ×2 [10]\\n**TOUR 5:** 1 ms dans chaque ms [10]\\nLaisser une longueur pour coudre, aplatir en triangle\\n\\n**PATTES AVANT (×2):**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOURS 2-10:** 1 ms dans chaque ms [6]\\nRembourrer légèrement les 3 premiers tours\\n\\n**PATTES ARRIÈRE (×2) - plus larges:**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOURS 3-5:** 1 ms dans chaque ms [12]\\n**TOUR 6:** dim ×6 [6]\\n**TOURS 7-10:** 1 ms dans chaque ms [6]\\nRembourrer le pied\\n\\n**QUEUE:**\\n\\n**TOUR 1:** 5 ms dans cercle magique [5]\\n**TOURS 2-18:** 1 ms dans chaque ms [5]\\nNe pas rembourrer, laisser souple\\n\\n**ASSEMBLAGE:**\\nCoudre tête sur corps. Oreilles en haut de la tête en triangle. Pattes avant sur les côtés, pattes arrière sous le corps en position assise. Queue à l''arrière. Broder nez rose et moustaches.",
  "tips": [
    "Pour un chat assis stable, rembourrez bien le bas du corps",
    "Courbez légèrement la queue pour plus de réalisme",
    "Variez les couleurs pour faire différentes races"
  ],
  "time_estimate": "6-7 heures"
}', '["chat", "assis", "mignon", "kawaii"]', 1);

-- Petit oiseau débutant
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Petit oiseau coloré', 'amigurumi', 'bird', 'beginner', 'small', '{
  "title": "Oiseau amigurumi rond",
  "description": "Un petit oiseau tout rond et facile à faire",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée",
    "aug": "augmentation",
    "dim": "diminution"
  },
  "materials": [
    "30g de coton DK couleur principale",
    "Restes pour le ventre (couleur contrastante)",
    "Restes orange pour le bec",
    "Crochet 3mm",
    "Rembourrage",
    "Yeux de sécurité 6mm",
    "Fil à broder noir"
  ],
  "gauge": {
    "stitches": "Serré"
  },
  "instructions": "**CORPS (une seule pièce, du bas vers le haut):**\\n\\n**Avec couleur ventre:**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** aug ×6 [12]\\n**TOUR 3:** *1 ms, aug* ×6 [18]\\n**TOUR 4:** *2 ms, aug* ×6 [24]\\n**TOURS 5-6:** 1 ms dans chaque ms [24]\\n\\n**Changer pour couleur principale:**\\n\\n**TOURS 7-10:** 1 ms dans chaque ms [24]\\n**TOUR 11:** *2 ms, dim* ×6 [18]\\n**TOUR 12:** 1 ms dans chaque ms [18]\\nPoser les yeux entre tours 10 et 11\\n**TOUR 13:** *1 ms, dim* ×6 [12]\\nRembourrer fermement\\n**TOUR 14:** dim ×6 [6]\\nFermer\\n\\n**BEC:**\\n\\n**Avec fil orange:**\\n\\n**TOUR 1:** 4 ms dans cercle magique [4]\\n**TOUR 2:** *1 ms, aug* ×2 [6]\\nFermer, laisser une longueur pour coudre\\n\\n**AILES (×2):**\\n\\n**TOUR 1:** 6 ms dans cercle magique [6]\\n**TOUR 2:** *1 ms, aug* ×3 [9]\\n**TOUR 3:** 1 ms dans chaque ms [9]\\nAplatir, laisser une longueur pour coudre\\n\\n**QUEUE (3 plumes):**\\n\\nFaire 3 chaînettes de 8 ml à partir du bas du corps, faire 1 ms dans chaque ml en remontant pour chaque plume\\n\\n**ASSEMBLAGE:**\\nCoudre le bec au centre du visage entre les yeux. Coudre les ailes de chaque côté du corps (tour 8). Ajouter les plumes de queue en bas.",
  "tips": [
    "Utilisez des couleurs vives pour un effet joyeux",
    "Rembourrez bien pour une forme ronde",
    "Parfait comme porte-clés en version mini"
  ],
  "time_estimate": "2-3 heures"
}', '["oiseau", "rapide", "rond", "colore"]', 1);

-- ============================================
-- SACS (BAGS)
-- ============================================

-- Petit sac filet débutant
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Sac filet de marché', 'bag', 'market', 'beginner', 'medium', '{
  "title": "Sac filet extensible simple",
  "description": "Un sac de courses écologique et facile",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée",
    "bs": "bride simple"
  },
  "materials": [
    "150g de coton mercerisé épais",
    "Crochet 5mm",
    "Aiguille à laine"
  ],
  "gauge": {
    "stitches": "Le filet est extensible, la jauge n''est pas critique"
  },
  "instructions": "**FOND DU SAC (en rond):**\\n\\n**TOUR 1:** 8 ms dans cercle magique [8]\\n**TOUR 2:** aug ×8 [16]\\n**TOUR 3:** *1 ms, aug* ×8 [24]\\n**TOUR 4:** *2 ms, aug* ×8 [32]\\n**TOUR 5:** *3 ms, aug* ×8 [40]\\n\\n**CORPS DU SAC (point filet):**\\n\\n**TOUR 6:** *1 ms, 2 ml, sauter 1 maille* répéter tout le tour\\n**TOURS 7-20:** Continuer le motif filet : *1 ms dans l''espace de 2 ml, 2 ml* répéter\\n\\n**HAUT DU SAC (bord renforcé):**\\n\\n**TOUR 21:** 1 ms dans chaque maille et espace (sans ml) [40]\\n**TOUR 22:** 1 ms dans chaque ms [40]\\n\\n**ANSES (×2):**\\n\\nRepérer 2 points opposés sur le bord\\nAttacher le fil, faire 40 ml, attacher de l''autre côté du même point, faire 1 ms dans chaque ml pour revenir [40]\\nRépéter de l''autre côté pour la 2ème anse\\n\\n**FINITIONS:**\\nRentrer tous les fils solidement.",
  "tips": [
    "Le coton mercerisé est solide et lavable",
    "Le sac s''étire avec le poids, c''est normal",
    "Parfait pour les courses, ultra compact plié"
  ],
  "time_estimate": "3 heures"
}', '["filet", "courses", "ecologique", "pratique"]', 1);

-- Pochette simple intermédiaire
INSERT INTO pattern_templates (name, type, subtype, level, size, content, tags, is_active) VALUES
('Pochette plate avec fermoir', 'bag', 'clutch', 'intermediate', 'small', '{
  "title": "Pochette élégante fermée",
  "description": "Une pochette plate pour soirée ou maquillage",
  "abbreviations": {
    "ml": "maille en l''air",
    "ms": "maille serrée",
    "bs": "bride simple",
    "db": "double bride"
  },
  "materials": [
    "100g de fil coton DK",
    "Crochet 3.5mm",
    "Fermoir magnétique ou bouton pression",
    "Doublure en tissu (optionnelle)",
    "Aiguille à laine"
  ],
  "gauge": {
    "stitches": "18 ms = 10cm",
    "rows": "20 rangs = 10cm"
  },
  "instructions": "**CORPS DE LA POCHETTE (en rangs):**\\n\\n**RANG 1:** Monter 45 ml\\n**RANG 2:** 1 ms dans 2ème ml, 1 ms dans chaque ml [44 ms]\\n**RANGS 3-40:** 1 ml, tourner, 1 ms dans chaque ms [44]\\n\\n**RABAT (continuer sur les mêmes mailles):**\\n\\n**RANG 41:** 1 ml, tourner, dim, 40 ms, dim [42]\\n**RANG 42:** 1 ml, tourner, dim, 38 ms, dim [40]\\n**RANG 43:** 1 ml, tourner, dim, 36 ms, dim [38]\\n**RANGS 44-50:** 1 ml, tourner, 1 ms dans chaque ms [38]\\n**RANG 51:** 1 ml, tourner, *1 ms, 2 ml, sauter 1 ms* répéter (pour effet dentelé)\\n\\n**ASSEMBLAGE:**\\nPlier le corps en deux (rang 1 touche rang 20)\\nCoudre les côtés à points glissés\\nAjouter le fermoir au centre du rabat et du corps\\nDoubler si désiré\\n\\n**BORDURE (optionnelle):**\\nFaire 1 tour de ms tout autour pour finition nette",
  "tips": [
    "Utilisez un fil rigide pour que la pochette garde sa forme",
    "La doublure ajoute de la tenue et cache les coutures",
    "Variez avec des perles ou paillettes pour effet soirée"
  ],
  "time_estimate": "5 heures"
}', '["pochette", "soiree", "elegant", "maquillage"]', 1);

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Afficher le résultat
SELECT COUNT(*) as 'Nombre de templates insérés' FROM pattern_templates;
SELECT type, COUNT(*) as 'Nombre' FROM pattern_templates GROUP BY type;
