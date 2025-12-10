-- ============================================================================
-- Compléter le Pull Irlandais Torsadé
-- @description Ajouter les 93 rangs restants pour finir le projet (187 → 280)
-- ============================================================================

-- Trouver l'ID du projet
SET @project_id = (SELECT id FROM projects WHERE name LIKE '%irlandais%' ORDER BY id DESC LIMIT 1);
SET @user_id = (SELECT user_id FROM projects WHERE id = @project_id);

-- Si le projet n'existe pas, afficher un message
SELECT IF(@project_id IS NULL,
    '❌ ERREUR : Projet "Pull irlandais" introuvable. Exécutez d\'abord seed_demo_data.sql',
    CONCAT('✅ Projet trouvé : ID ', @project_id, ' (User ID ', @user_id, ')')
) as 'Status';

-- Vérifier l'état actuel
SELECT
    name,
    current_row,
    total_rows,
    CONCAT(ROUND((current_row / total_rows) * 100, 1), '%') as progression,
    status
FROM projects
WHERE id = @project_id;

-- ============================================================================
-- PARTIE 1 : Vérifier et nettoyer les rangs existants
-- ============================================================================

-- Vérifier le dernier rang existant
SELECT
    CONCAT('Dernier rang existant : ', MAX(row_num)) as ''
FROM project_rows
WHERE project_id = @project_id;

-- Supprimer les rangs >= 188 si ils existent déjà (pour pouvoir réexécuter le script)
DELETE FROM project_rows
WHERE project_id = @project_id
AND row_num >= 188;

-- ============================================================================
-- PARTIE 2 : Ajouter les 93 rangs restants (rang 188 à 280)
-- ============================================================================

-- Fonction pour générer des timestamps étalés sur 30 jours
-- Rangs 188-220 : Corps du pull (manches + assemblage) - Jours 16-25
INSERT INTO project_rows (project_id, row_num, stitch_type, stitch_count, duration, started_at) VALUES
(@project_id, 188, 'regular', 124, 780, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 16 DAY + INTERVAL 8 HOUR),
(@project_id, 189, 'regular', 124, 765, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 16 DAY + INTERVAL 9 HOUR),
(@project_id, 190, 'regular', 124, 790, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 16 DAY + INTERVAL 20 HOUR),
(@project_id, 191, 'cable', 126, 1150, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 17 DAY + INTERVAL 10 HOUR),
(@project_id, 192, 'regular', 126, 775, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 17 DAY + INTERVAL 14 HOUR),
(@project_id, 193, 'regular', 126, 780, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 17 DAY + INTERVAL 20 HOUR),
(@project_id, 194, 'cable', 126, 1180, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 18 DAY + INTERVAL 11 HOUR),
(@project_id, 195, 'regular', 126, 770, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 18 DAY + INTERVAL 15 HOUR),
(@project_id, 196, 'regular', 126, 785, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 18 DAY + INTERVAL 21 HOUR),
(@project_id, 197, 'cable', 126, 1200, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 19 DAY + INTERVAL 10 HOUR),
(@project_id, 198, 'regular', 126, 760, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 19 DAY + INTERVAL 14 HOUR),
(@project_id, 199, 'regular', 126, 775, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 19 DAY + INTERVAL 19 HOUR),
(@project_id, 200, 'regular', 126, 790, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 20 DAY + INTERVAL 10 HOUR),

-- Rangs 201-220 : Assemblage des manches
(@project_id, 201, 'regular', 126, 780, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 20 DAY + INTERVAL 14 HOUR),
(@project_id, 202, 'regular', 126, 770, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 20 DAY + INTERVAL 20 HOUR),
(@project_id, 203, 'regular', 124, 765, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 21 DAY + INTERVAL 9 HOUR),
(@project_id, 204, 'regular', 124, 760, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 21 DAY + INTERVAL 14 HOUR),
(@project_id, 205, 'cable', 124, 1100, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 21 DAY + INTERVAL 19 HOUR),
(@project_id, 206, 'regular', 122, 750, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 22 DAY + INTERVAL 10 HOUR),
(@project_id, 207, 'regular', 122, 755, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 22 DAY + INTERVAL 15 HOUR),
(@project_id, 208, 'cable', 122, 1120, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 22 DAY + INTERVAL 20 HOUR),
(@project_id, 209, 'regular', 122, 745, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 23 DAY + INTERVAL 9 HOUR),
(@project_id, 210, 'regular', 122, 750, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 23 DAY + INTERVAL 14 HOUR),
(@project_id, 211, 'regular', 120, 740, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 23 DAY + INTERVAL 19 HOUR),
(@project_id, 212, 'regular', 120, 735, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 24 DAY + INTERVAL 10 HOUR),
(@project_id, 213, 'cable', 120, 1080, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 24 DAY + INTERVAL 15 HOUR),
(@project_id, 214, 'regular', 120, 730, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 24 DAY + INTERVAL 20 HOUR),
(@project_id, 215, 'regular', 120, 735, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 25 DAY + INTERVAL 9 HOUR),
(@project_id, 216, 'regular', 118, 725, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 25 DAY + INTERVAL 14 HOUR),
(@project_id, 217, 'regular', 118, 720, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 25 DAY + INTERVAL 19 HOUR),
(@project_id, 218, 'cable', 118, 1050, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 26 DAY + INTERVAL 10 HOUR),
(@project_id, 219, 'regular', 118, 715, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 26 DAY + INTERVAL 15 HOUR),
(@project_id, 220, 'regular', 118, 720, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 26 DAY + INTERVAL 20 HOUR),

-- Rangs 221-250 : Manches (diminutions) - Jours 27-32
(@project_id, 221, 'regular', 116, 710, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 27 DAY + INTERVAL 9 HOUR),
(@project_id, 222, 'regular', 116, 705, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 27 DAY + INTERVAL 14 HOUR),
(@project_id, 223, 'regular', 114, 700, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 27 DAY + INTERVAL 19 HOUR),
(@project_id, 224, 'regular', 114, 695, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 28 DAY + INTERVAL 10 HOUR),
(@project_id, 225, 'cable', 114, 1020, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 28 DAY + INTERVAL 15 HOUR),
(@project_id, 226, 'regular', 112, 690, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 28 DAY + INTERVAL 20 HOUR),
(@project_id, 227, 'regular', 112, 685, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 29 DAY + INTERVAL 9 HOUR),
(@project_id, 228, 'regular', 110, 680, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 29 DAY + INTERVAL 14 HOUR),
(@project_id, 229, 'regular', 110, 675, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 29 DAY + INTERVAL 19 HOUR),
(@project_id, 230, 'cable', 110, 1000, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 30 DAY + INTERVAL 10 HOUR),
(@project_id, 231, 'regular', 108, 670, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 30 DAY + INTERVAL 14 HOUR),
(@project_id, 232, 'regular', 108, 665, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 30 DAY + INTERVAL 19 HOUR),
(@project_id, 233, 'regular', 106, 660, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 31 DAY + INTERVAL 9 HOUR),
(@project_id, 234, 'regular', 106, 655, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 31 DAY + INTERVAL 14 HOUR),
(@project_id, 235, 'cable', 106, 980, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 31 DAY + INTERVAL 19 HOUR),
(@project_id, 236, 'regular', 104, 650, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 32 DAY + INTERVAL 10 HOUR),
(@project_id, 237, 'regular', 104, 645, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 32 DAY + INTERVAL 14 HOUR),
(@project_id, 238, 'regular', 102, 640, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 32 DAY + INTERVAL 19 HOUR),
(@project_id, 239, 'regular', 102, 635, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 33 DAY + INTERVAL 10 HOUR),
(@project_id, 240, 'cable', 102, 960, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 33 DAY + INTERVAL 15 HOUR),
(@project_id, 241, 'regular', 100, 630, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 33 DAY + INTERVAL 20 HOUR),
(@project_id, 242, 'regular', 100, 625, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 34 DAY + INTERVAL 9 HOUR),
(@project_id, 243, 'regular', 98, 620, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 34 DAY + INTERVAL 14 HOUR),
(@project_id, 244, 'regular', 98, 615, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 34 DAY + INTERVAL 19 HOUR),
(@project_id, 245, 'cable', 98, 940, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 35 DAY + INTERVAL 10 HOUR),
(@project_id, 246, 'regular', 96, 610, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 35 DAY + INTERVAL 14 HOUR),
(@project_id, 247, 'regular', 96, 605, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 35 DAY + INTERVAL 19 HOUR),
(@project_id, 248, 'regular', 94, 600, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 36 DAY + INTERVAL 10 HOUR),
(@project_id, 249, 'regular', 94, 595, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 36 DAY + INTERVAL 15 HOUR),
(@project_id, 250, 'cable', 94, 920, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 36 DAY + INTERVAL 20 HOUR),

-- Rangs 251-270 : Poignets (côtes 2x2) - Jours 37-40
(@project_id, 251, 'ribbing', 72, 480, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 37 DAY + INTERVAL 10 HOUR),
(@project_id, 252, 'ribbing', 72, 475, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 37 DAY + INTERVAL 14 HOUR),
(@project_id, 253, 'ribbing', 72, 470, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 37 DAY + INTERVAL 19 HOUR),
(@project_id, 254, 'ribbing', 72, 465, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 38 DAY + INTERVAL 10 HOUR),
(@project_id, 255, 'ribbing', 72, 460, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 38 DAY + INTERVAL 14 HOUR),
(@project_id, 256, 'ribbing', 72, 455, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 38 DAY + INTERVAL 19 HOUR),
(@project_id, 257, 'ribbing', 72, 450, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 39 DAY + INTERVAL 10 HOUR),
(@project_id, 258, 'ribbing', 72, 445, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 39 DAY + INTERVAL 14 HOUR),
(@project_id, 259, 'ribbing', 72, 440, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 39 DAY + INTERVAL 19 HOUR),
(@project_id, 260, 'ribbing', 72, 435, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 40 DAY + INTERVAL 10 HOUR),
(@project_id, 261, 'ribbing', 72, 430, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 40 DAY + INTERVAL 14 HOUR),
(@project_id, 262, 'ribbing', 72, 425, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 40 DAY + INTERVAL 19 HOUR),
(@project_id, 263, 'ribbing', 72, 420, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 41 DAY + INTERVAL 10 HOUR),
(@project_id, 264, 'ribbing', 72, 415, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 41 DAY + INTERVAL 14 HOUR),
(@project_id, 265, 'ribbing', 72, 410, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 41 DAY + INTERVAL 19 HOUR),
(@project_id, 266, 'ribbing', 72, 405, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 42 DAY + INTERVAL 10 HOUR),
(@project_id, 267, 'ribbing', 72, 400, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 42 DAY + INTERVAL 14 HOUR),
(@project_id, 268, 'ribbing', 72, 395, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 42 DAY + INTERVAL 19 HOUR),
(@project_id, 269, 'ribbing', 72, 390, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 43 DAY + INTERVAL 10 HOUR),
(@project_id, 270, 'ribbing', 72, 385, DATE_SUB(NOW(), INTERVAL 30 DAY) + INTERVAL 43 DAY + INTERVAL 14 HOUR),

-- Rangs 271-280 : Rabattre les mailles - Jour 44 (AUJOURD'HUI - 1 jour)
(@project_id, 271, 'bindoff', 72, 380, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR),
(@project_id, 272, 'bindoff', 68, 360, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR),
(@project_id, 273, 'bindoff', 64, 340, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR),
(@project_id, 274, 'bindoff', 60, 320, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR),
(@project_id, 275, 'bindoff', 56, 300, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 14 HOUR),
(@project_id, 276, 'bindoff', 52, 280, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 15 HOUR),
(@project_id, 277, 'bindoff', 48, 260, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 16 HOUR),
(@project_id, 278, 'bindoff', 44, 240, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 17 HOUR),
(@project_id, 279, 'bindoff', 40, 220, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 18 HOUR),
(@project_id, 280, 'bindoff', 36, 200, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 19 HOUR);

-- ============================================================================
-- PARTIE 3 : Compléter les sections du pull
-- ============================================================================

-- Marquer toutes les sections comme complétées
UPDATE project_sections
SET
    current_row = total_rows,
    is_completed = 1
WHERE project_id = @project_id;

-- Vérifier les sections
SELECT
    '📋 SECTIONS COMPLÉTÉES' as '',
    name,
    current_row,
    total_rows,
    IF(is_completed = 1, '✅', '⏳') as 'statut'
FROM project_sections
WHERE project_id = @project_id
ORDER BY display_order;

-- ============================================================================
-- PARTIE 4 : Mettre à jour le projet (TERMINÉ)
-- ============================================================================

UPDATE projects
SET
    current_row = 280,
    status = 'completed',
    completed_at = DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 19 HOUR
WHERE id = @project_id;

-- ============================================================================
-- PARTIE 5 : Vérifications finales
-- ============================================================================

-- Vérifier les stats du projet
SELECT
    '✅ PROJET TERMINÉ' as '',
    name,
    current_row,
    total_rows,
    CONCAT(ROUND((current_row / total_rows) * 100, 1), '%') as progression,
    status,
    DATEDIFF(completed_at, started_at) as 'durée_jours',
    completed_at
FROM projects
WHERE id = @project_id;

-- Compter les rangs ajoutés
SELECT
    '✅ RANGS AJOUTÉS' as '',
    COUNT(*) as 'nouveaux_rangs',
    MIN(row_num) as 'de',
    MAX(row_num) as 'à'
FROM project_rows
WHERE project_id = @project_id
AND row_num >= 188;

-- Stats totales
SELECT
    '📊 STATS TOTALES' as '',
    COUNT(*) as 'total_rangs',
    SUM(stitch_count) as 'total_mailles',
    ROUND(SUM(duration) / 3600, 1) as 'heures_totales',
    ROUND(AVG(stitch_count), 1) as 'mailles_moy_rang',
    ROUND(AVG(duration), 0) as 'secondes_moy_rang'
FROM project_rows
WHERE project_id = @project_id;

SELECT '🎉 Pull irlandais torsadé terminé avec succès !' as '';
