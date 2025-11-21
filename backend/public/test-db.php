<?php
/**
 * @file test-db.php
 * @brief Script de test de connexion à la base de données
 * @author Nathalie + AI:Claude
 * @created 2025-11-14
 */

require_once '../config/bootstrap.php';

use App\Config\Database;

?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Base de Données - Crochet Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2563eb;
            margin-bottom: 30px;
        }
        .success {
            color: #10b981;
            padding: 15px;
            background: #d1fae5;
            border-left: 4px solid #10b981;
            margin: 10px 0;
            border-radius: 4px;
        }
        .error {
            color: #ef4444;
            padding: 15px;
            background: #fee2e2;
            border-left: 4px solid #ef4444;
            margin: 10px 0;
            border-radius: 4px;
        }
        .info {
            color: #3b82f6;
            padding: 15px;
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            margin: 10px 0;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
        }
        .emoji {
            font-size: 24px;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧶 Test Base de Données - Crochet Hub</h1>

        <?php
        try {
            // Test connexion
            $db = Database::getInstance()->getConnection();
            echo '<div class="success"><span class="emoji">✅</span> Connexion à la base de données réussie !</div>';

            // Test configuration
            echo '<div class="info">';
            echo '<strong>Configuration :</strong><br>';
            echo 'Host : ' . ($_ENV['DB_HOST'] ?? 'localhost') . '<br>';
            echo 'Database : ' . ($_ENV['DB_NAME'] ?? 'patron_maker') . '<br>';
            echo 'User : ' . ($_ENV['DB_USER'] ?? 'root') . '<br>';
            echo '</div>';

            echo '<h2>📊 État de la base de données</h2>';
            echo '<table>';
            echo '<thead><tr><th>Table</th><th>Nombre de lignes</th><th>Statut</th></tr></thead>';
            echo '<tbody>';

            $tables = [
                'users' => 'Utilisateurs',
                'patterns' => 'Patrons générés',
                'pattern_templates' => 'Templates de référence',
                'pattern_categories' => 'Catégories',
                'payments' => 'Paiements',
                'projects' => 'Projets de crochet',
                'project_rows' => 'Historique des rangs',
                'project_stats' => 'Statistiques',
                'project_sessions' => 'Sessions de travail',
                'api_logs' => 'Logs API'
            ];

            $allOk = true;

            foreach ($tables as $table => $description) {
                try {
                    $stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $count = $result['count'];
                    echo "<tr>";
                    echo "<td><strong>$table</strong><br><small style='color:#6b7280'>$description</small></td>";
                    echo "<td>$count</td>";
                    echo "<td><span style='color:#10b981'>✓ OK</span></td>";
                    echo "</tr>";
                } catch (PDOException $e) {
                    echo "<tr>";
                    echo "<td><strong>$table</strong><br><small style='color:#6b7280'>$description</small></td>";
                    echo "<td>-</td>";
                    echo "<td><span style='color:#ef4444'>✗ Manquante</span></td>";
                    echo "</tr>";
                    $allOk = false;
                }
            }

            echo '</tbody></table>';

            if ($allOk) {
                echo '<div class="success"><span class="emoji">🎉</span> Toutes les tables sont présentes !</div>';
            } else {
                echo '<div class="error"><span class="emoji">⚠️</span> Certaines tables sont manquantes. Importez les fichiers SQL.</div>';
            }

            // Test des triggers
            echo '<h2>⚙️ Vérification des triggers MySQL</h2>';
            try {
                $stmt = $db->query("SHOW TRIGGERS LIKE 'project%'");
                $triggers = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($triggers) > 0) {
                    echo '<div class="success"><span class="emoji">✅</span> ' . count($triggers) . ' triggers détectés</div>';
                    echo '<ul>';
                    foreach ($triggers as $trigger) {
                        echo '<li>' . $trigger['Trigger'] . '</li>';
                    }
                    echo '</ul>';
                } else {
                    echo '<div class="info"><span class="emoji">ℹ️</span> Aucun trigger détecté (normal si pas encore importé add_projects_system.sql)</div>';
                }
            } catch (Exception $e) {
                echo '<div class="info"><span class="emoji">ℹ️</span> Impossible de vérifier les triggers</div>';
            }

            // Test données de catégories
            echo '<h2>🎨 Vérification des catégories</h2>';
            try {
                $stmt = $db->query("SELECT category_key, category_label, COUNT(*) as subtypes
                                   FROM pattern_categories
                                   WHERE subtype_key IS NOT NULL
                                   GROUP BY category_key, category_label");
                $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($categories) > 0) {
                    echo '<div class="success"><span class="emoji">✅</span> ' . count($categories) . ' catégories avec sous-types</div>';
                    echo '<table>';
                    echo '<thead><tr><th>Catégorie</th><th>Nombre de sous-types</th></tr></thead>';
                    echo '<tbody>';
                    foreach ($categories as $cat) {
                        echo "<tr>";
                        echo "<td>" . htmlspecialchars($cat['category_label']) . " (" . $cat['category_key'] . ")</td>";
                        echo "<td>" . $cat['subtypes'] . "</td>";
                        echo "</tr>";
                    }
                    echo '</tbody></table>';
                } else {
                    echo '<div class="error"><span class="emoji">⚠️</span> Aucune catégorie trouvée. Importez add_categories_table.sql</div>';
                }
            } catch (Exception $e) {
                echo '<div class="error"><span class="emoji">⚠️</span> Table pattern_categories non trouvée</div>';
            }

            // Prochaines étapes
            echo '<h2>🚀 Prochaines étapes</h2>';
            echo '<div class="info">';
            echo '<ol>';
            echo '<li>Vérifier que toutes les tables sont présentes (✓ ci-dessus)</li>';
            echo '<li>Tester l\'API : <a href="/api/categories" target="_blank">http://crochet-hub.local/api/categories</a></li>';
            echo '<li>Lancer le frontend : <code>cd frontend && npm run dev</code></li>';
            echo '<li>Accéder à l\'app : <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></li>';
            echo '</ol>';
            echo '</div>';

        } catch (Exception $e) {
            echo '<div class="error">';
            echo '<span class="emoji">❌</span> <strong>Erreur de connexion :</strong><br>';
            echo htmlspecialchars($e->getMessage());
            echo '</div>';

            echo '<div class="info">';
            echo '<strong>Solutions possibles :</strong>';
            echo '<ul>';
            echo '<li>Vérifier que WAMP est démarré (icône verte)</li>';
            echo '<li>Vérifier les paramètres dans backend/config/.env</li>';
            echo '<li>Créer la base de données "patron_maker" dans phpMyAdmin</li>';
            echo '</ul>';
            echo '</div>';
        }
        ?>

    </div>
</body>
</html>
