<?php
// Test d'ajout de rang pour un projet sans sections

$db = new PDO(
    "mysql:host=127.0.0.1;port=3306;dbname=patron_maker;charset=utf8mb4",
    "root",
    "",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Récupérer un projet de test (projet 54 mentionné dans les logs)
$projectId = 54;

echo "=== TEST AJOUT RANG SANS SECTION ===\n\n";

try {
    // Vérifier que le projet existe
    $stmt = $db->prepare("SELECT id, name, current_row FROM projects WHERE id = ?");
    $stmt->execute([$projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) {
        die("Projet $projectId non trouvé\n");
    }

    echo "Projet trouvé: {$project['name']} (current_row: {$project['current_row']})\n\n";

    // Tester l'insertion d'un rang
    $newRowNum = $project['current_row'] + 1;
    echo "Tentative d'ajout du rang $newRowNum...\n";

    $query = "INSERT INTO project_rows
              (project_id, section_id, row_num, stitch_count, stitch_type, duration, notes, difficulty_rating, photo, completed_at)
              VALUES
              (:project_id, :section_id, :row_num, :stitch_count, :stitch_type, :duration, :notes, :difficulty_rating, :photo, :completed_at)
              ON DUPLICATE KEY UPDATE
              section_id = VALUES(section_id),
              stitch_count = VALUES(stitch_count)";

    $stmt = $db->prepare($query);

    $params = [
        ':project_id' => $projectId,
        ':section_id' => null,  // Pas de section
        ':row_num' => $newRowNum,
        ':stitch_count' => null,
        ':stitch_type' => null,
        ':duration' => null,
        ':notes' => null,
        ':difficulty_rating' => null,
        ':photo' => null,
        ':completed_at' => date('Y-m-d H:i:s')
    ];

    $stmt->execute($params);
    $rowId = $db->lastInsertId();

    echo "✅ Rang ajouté avec succès (ID: $rowId)\n\n";

    // Vérifier le projet après trigger
    $stmt = $db->prepare("SELECT current_row FROM projects WHERE id = ?");
    $stmt->execute([$projectId]);
    $updatedProject = $stmt->fetch(PDO::FETCH_ASSOC);

    echo "Projet après insertion: current_row = {$updatedProject['current_row']}\n";

} catch (PDOException $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
    echo "Code: " . $e->getCode() . "\n";
}
