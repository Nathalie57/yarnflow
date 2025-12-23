<?php
/**
 * Script de correction accessible via navigateur
 * URL: http://patron-maker.local/fix-sections.php
 */

header('Content-Type: text/html; charset=utf-8');

require_once __DIR__ . '/../config/Database.php';

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Correction current_section_id</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }
        .success { color: #00ff00; }
        .error { color: #ff0000; }
        .warning { color: #ffaa00; }
        .info { color: #00aaff; }
        pre { background: #000; padding: 10px; border-left: 3px solid #00ff00; }
    </style>
</head>
<body>
<h1>🔧 Correction des current_section_id manquants</h1>

<?php
try {
    $db = \App\Config\Database::getInstance()->getConnection();

    echo "<h2>1. Diagnostic</h2>";

    // Trouver les projets problématiques
    $findQuery = "SELECT p.id, p.name, p.current_section_id,
                         (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) as sections_count
                  FROM projects p
                  WHERE (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0
                  ORDER BY p.id DESC
                  LIMIT 20";

    $stmt = $db->prepare($findQuery);
    $stmt->execute();
    $allProjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $problems = array_filter($allProjects, fn($p) => $p['current_section_id'] === null);

    echo "<div class='info'>Projets avec sections : " . count($allProjects) . "</div>";
    echo "<div class='" . (count($problems) > 0 ? 'warning' : 'success') . "'>";
    echo "Projets avec sections MAIS current_section_id=NULL : " . count($problems) . "</div>";

    if (count($problems) === 0) {
        echo "<div class='success'>✅ Aucun problème trouvé!</div>";

        echo "<h2>État actuel</h2><pre>";
        foreach ($allProjects as $p) {
            $sectionQuery = "SELECT name FROM project_sections WHERE id = ?";
            $sStmt = $db->prepare($sectionQuery);
            $sStmt->execute([$p['current_section_id']]);
            $sectionName = $sStmt->fetchColumn();

            printf(
                "Projet #%d '%s': %d sections, current=%d (%s)\n",
                $p['id'],
                substr($p['name'], 0, 30),
                $p['sections_count'],
                $p['current_section_id'],
                $sectionName ?: 'N/A'
            );
        }
        echo "</pre>";

    } else {
        echo "<h2>Projets à corriger</h2><pre>";
        foreach ($problems as $p) {
            printf(
                "⚠️  Projet #%d '%s': %d sections mais current_section_id=NULL\n",
                $p['id'],
                substr($p['name'], 0, 40),
                $p['sections_count']
            );
        }
        echo "</pre>";

        // Si on passe ?fix=1 dans l'URL, on corrige
        if (isset($_GET['fix']) && $_GET['fix'] === '1') {
            echo "<h2>2. Application des corrections</h2>";

            $db->beginTransaction();
            $fixed = 0;

            foreach ($problems as $problem) {
                // Trouver la première section non terminée
                $sectionQuery = "SELECT id, name, is_completed
                                FROM project_sections
                                WHERE project_id = :project_id
                                ORDER BY is_completed ASC, display_order ASC, id ASC
                                LIMIT 1";

                $sectionStmt = $db->prepare($sectionQuery);
                $sectionStmt->execute(['project_id' => $problem['id']]);
                $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);

                if ($section) {
                    // Définir cette section comme section courante
                    $updateQuery = "UPDATE projects SET current_section_id = :section_id WHERE id = :project_id";
                    $updateStmt = $db->prepare($updateQuery);
                    $updateStmt->execute([
                        'section_id' => $section['id'],
                        'project_id' => $problem['id']
                    ]);

                    echo "<div class='success'>✅ Projet #{$problem['id']}: current_section_id = {$section['id']} ('{$section['name']}')</div>";
                    $fixed++;
                }
            }

            $db->commit();

            echo "<h2 class='success'>✅ Correction terminée: $fixed projet(s) corrigé(s)</h2>";
            echo "<p><a href='?'>Revérifier</a></p>";

        } else {
            echo "<p class='warning'>👉 <a href='?fix=1' style='color: #ffaa00; font-weight: bold;'>Cliquez ici pour corriger automatiquement</a></p>";
        }
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo "<div class='error'>❌ Erreur: " . htmlspecialchars($e->getMessage()) . "</div>";
    echo "<pre class='error'>" . htmlspecialchars($e->getTraceAsString()) . "</pre>";
}
?>

<hr>
<p><a href="/api/projects" target="_blank">Voir GET /api/projects</a> | <a href="/">Retour à l'app</a></p>

</body>
</html>
