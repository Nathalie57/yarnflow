<?php
/**
 * Vérifier la structure de la table payments
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Structure de la table payments</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} table{width:100%;border-collapse:collapse;background:white;} th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;} th{background:#6366f1;color:white;}</style>";

$db = Database::getInstance()->getConnection();

$stmt = $db->query("SHOW COLUMNS FROM payments");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "<table>";
echo "<tr><th>Champ</th><th>Type</th><th>Null</th><th>Clé</th><th>Défaut</th><th>Extra</th></tr>";
foreach ($columns as $col) {
    echo "<tr>";
    echo "<td><strong>{$col['Field']}</strong></td>";
    echo "<td>{$col['Type']}</td>";
    echo "<td>{$col['Null']}</td>";
    echo "<td>{$col['Key']}</td>";
    echo "<td>" . ($col['Default'] ?? 'NULL') . "</td>";
    echo "<td>{$col['Extra']}</td>";
    echo "</tr>";
}
echo "</table>";
?>
