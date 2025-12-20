<?php
/**
 * Script de diagnostic pour la page Admin/Users
 */

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

// Charger les variables d'environnement
$envFile = __DIR__ . '/../config/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
        putenv(trim($name) . '=' . trim($value));
    }
}

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Diagnostic Admin/Users</h1>";
echo "<style>body{font-family:monospace;padding:20px;} .ok{color:green;} .error{color:red;} .warning{color:orange;}</style>";

try {
    $database = Database::getInstance();
    $db = $database->getConnection();
    echo "<p class='ok'>✅ Connexion à la base de données OK</p>";

    // 1. Vérifier structure de la table users
    echo "<h2>1️⃣ Structure de la table users</h2>";
    $columns = $db->query("SHOW COLUMNS FROM users")->fetchAll(PDO::FETCH_ASSOC);
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Colonne</th><th>Type</th><th>Null</th><th>Default</th></tr>";

    $requiredColumns = ['id', 'email', 'role', 'subscription_type', 'subscription_expires_at', 'created_at'];
    $existingColumns = array_column($columns, 'Field');

    foreach ($columns as $col) {
        echo "<tr>";
        echo "<td>{$col['Field']}</td>";
        echo "<td>{$col['Type']}</td>";
        echo "<td>{$col['Null']}</td>";
        echo "<td>{$col['Default']}</td>";
        echo "</tr>";
    }
    echo "</table>";

    // Vérifier colonnes manquantes
    echo "<h3>Colonnes requises :</h3>";
    foreach ($requiredColumns as $req) {
        if (in_array($req, $existingColumns)) {
            echo "<p class='ok'>✅ $req</p>";
        } else {
            echo "<p class='error'>❌ $req MANQUANTE !</p>";
        }
    }

    // Vérifier is_banned (optionnelle, créée à la volée)
    if (in_array('is_banned', $existingColumns)) {
        echo "<p class='ok'>✅ is_banned (optionnel)</p>";
    } else {
        echo "<p class='warning'>⚠️ is_banned n'existe pas encore (sera créée automatiquement si nécessaire)</p>";
    }

    // 2. Compter les utilisateurs
    echo "<h2>2️⃣ Utilisateurs dans la base</h2>";
    $totalUsers = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "<p>Total utilisateurs : <strong>$totalUsers</strong></p>";

    if ($totalUsers == 0) {
        echo "<p class='error'>❌ Aucun utilisateur ! Créez-en un via /register</p>";
    } else {
        // 3. Lister les utilisateurs
        echo "<h3>Liste des utilisateurs :</h3>";
        $users = $db->query("
            SELECT id, email, first_name, last_name, role, subscription_type, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        ")->fetchAll(PDO::FETCH_ASSOC);

        echo "<table border='1' cellpadding='5'>";
        echo "<tr><th>ID</th><th>Email</th><th>Nom</th><th>Rôle</th><th>Plan</th><th>Créé le</th></tr>";
        foreach ($users as $user) {
            $roleClass = $user['role'] === 'admin' ? 'ok' : '';
            echo "<tr>";
            echo "<td>{$user['id']}</td>";
            echo "<td>{$user['email']}</td>";
            echo "<td>{$user['first_name']} {$user['last_name']}</td>";
            echo "<td class='$roleClass'><strong>{$user['role']}</strong></td>";
            echo "<td>{$user['subscription_type']}</td>";
            echo "<td>{$user['created_at']}</td>";
            echo "</tr>";
        }
        echo "</table>";

        // 4. Compter les admins
        echo "<h2>3️⃣ Utilisateurs admin</h2>";
        $adminCount = $db->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();

        if ($adminCount == 0) {
            echo "<p class='error'>❌ Aucun admin ! Vous devez promouvoir un utilisateur en admin</p>";
            echo "<h3>📝 Comment créer un admin :</h3>";
            echo "<pre>UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';</pre>";
        } else {
            echo "<p class='ok'>✅ $adminCount admin(s) trouvé(s)</p>";

            $admins = $db->query("SELECT id, email, first_name, last_name FROM users WHERE role = 'admin'")->fetchAll(PDO::FETCH_ASSOC);
            echo "<ul>";
            foreach ($admins as $admin) {
                echo "<li><strong>{$admin['email']}</strong> (ID: {$admin['id']})</li>";
            }
            echo "</ul>";
        }
    }

    // 5. Vérifier les projets (pour statistiques)
    echo "<h2>4️⃣ Projets dans la base</h2>";
    if ($db->query("SHOW TABLES LIKE 'projects'")->rowCount() > 0) {
        $totalProjects = $db->query("SELECT COUNT(*) FROM projects")->fetchColumn();
        echo "<p class='ok'>✅ Table projects existe : <strong>$totalProjects</strong> projets</p>";
    } else {
        echo "<p class='error'>❌ Table projects n'existe pas</p>";
    }

    // 6. Vérifier les paiements
    echo "<h2>5️⃣ Paiements dans la base</h2>";
    if ($db->query("SHOW TABLES LIKE 'payments'")->rowCount() > 0) {
        $totalPayments = $db->query("SELECT COUNT(*) FROM payments")->fetchColumn();
        echo "<p class='ok'>✅ Table payments existe : <strong>$totalPayments</strong> paiements</p>";
    } else {
        echo "<p class='error'>❌ Table payments n'existe pas</p>";
    }

    // 7. Vérifier user_photo_credits
    echo "<h2>6️⃣ Crédits photos</h2>";
    if ($db->query("SHOW TABLES LIKE 'user_photo_credits'")->rowCount() > 0) {
        $totalCredits = $db->query("SELECT COUNT(*) FROM user_photo_credits")->fetchColumn();
        echo "<p class='ok'>✅ Table user_photo_credits existe : <strong>$totalCredits</strong> entrées</p>";
    } else {
        echo "<p class='error'>❌ Table user_photo_credits n'existe pas</p>";
    }

    echo "<hr>";
    echo "<h2>✅ Résumé</h2>";

    if ($totalUsers == 0) {
        echo "<p class='error'><strong>PROBLÈME 1 :</strong> Aucun utilisateur. Créez un compte via <a href='http://patron-maker.local/register'>/register</a></p>";
    } elseif ($adminCount == 0) {
        echo "<p class='error'><strong>PROBLÈME 2 :</strong> Aucun admin. Connectez-vous à phpMyAdmin et exécutez :</p>";
        echo "<pre style='background:#f0f0f0;padding:10px;'>UPDATE users SET role = 'admin' WHERE id = 1;</pre>";
    } else {
        echo "<p class='ok'><strong>✅ Tout semble OK côté base de données !</strong></p>";
        echo "<p>Si la page admin/users n'affiche rien :</p>";
        echo "<ul>";
        echo "<li>1. Vérifiez que vous êtes connecté avec un compte <strong>admin</strong></li>";
        echo "<li>2. Ouvrez la console du navigateur (F12) et regardez les erreurs</li>";
        echo "<li>3. Vérifiez l'onglet Network pour voir si l'API /api/admin/users répond</li>";
        echo "</ul>";
    }

} catch (Exception $e) {
    echo "<p class='error'>❌ Erreur : " . $e->getMessage() . "</p>";
}
?>
