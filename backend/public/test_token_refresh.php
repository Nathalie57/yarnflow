<?php
/**
 * Test du système de refresh de token
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/JWTService.php';

use App\Config\Database;
use App\Services\JWTService;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🧪 Test du système de refresh JWT</h1>";
echo "<style>
    body{font-family:monospace;padding:20px;background:#f5f5f5;line-height:1.6;}
    .ok{color:green;font-weight:bold;}
    .error{color:red;font-weight:bold;}
    .warning{color:orange;font-weight:bold;}
    pre{background:white;padding:15px;border-radius:5px;overflow:auto;}
    .card{background:white;padding:15px;margin:15px 0;border-radius:5px;border-left:4px solid #6366f1;}
</style>";

$db = Database::getInstance()->getConnection();
$jwtService = new JWTService();

// Récupérer user 8
$stmt = $db->prepare("SELECT * FROM users WHERE id = 8");
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "<p class='error'>❌ Utilisateur 8 introuvable</p>";
    exit;
}

echo "<div class='card'>";
echo "<h2>1️⃣ Générer un token normal (30 jours)</h2>";
$normalToken = $jwtService->generateToken($user);
echo "<p class='ok'>✅ Token généré</p>";
echo "<p><strong>Durée de vie :</strong> " . ($_ENV['JWT_EXPIRATION'] / 86400) . " jours</p>";

// Décoder pour afficher les infos
$parts = explode('.', $normalToken);
$payload = json_decode(base64_decode($parts[1]), true);
$expirationDate = date('Y-m-d H:i:s', $payload['exp']);

echo "<p><strong>Expire le :</strong> $expirationDate</p>";
echo "<p><strong>Token :</strong></p>";
echo "<textarea style='width:100%;height:100px;font-family:monospace;'>" . $normalToken . "</textarea>";
echo "</div>";

// Test 2 : Token valide
echo "<div class='card'>";
echo "<h2>2️⃣ Valider le token normal</h2>";
$validated = $jwtService->validateToken($normalToken);
if ($validated) {
    echo "<p class='ok'>✅ Token valide</p>";
    echo "<pre>" . print_r($validated, true) . "</pre>";
} else {
    echo "<p class='error'>❌ Token invalide</p>";
}
echo "</div>";

// Test 3 : Créer un token expiré (pour tester le refresh)
echo "<div class='card'>";
echo "<h2>3️⃣ Simuler un token expiré</h2>";

// Créer un payload expiré manuellement
$issuedAt = time() - 7200; // Il y a 2h
$expirationTime = $issuedAt + 3600; // Expiré depuis 1h

$expiredPayload = [
    'iat' => $issuedAt,
    'exp' => $expirationTime,
    'data' => [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'subscription_type' => $user['subscription_type']
    ]
];

$secret = $_ENV['JWT_SECRET'];
$expiredToken = \Firebase\JWT\JWT::encode($expiredPayload, $secret, 'HS256');

echo "<p class='warning'>⚠️ Token expiré artificiellement créé</p>";
echo "<p><strong>Expiré depuis :</strong> " . date('Y-m-d H:i:s', $expirationTime) . " (il y a 1 heure)</p>";
echo "<p><strong>Token expiré :</strong></p>";
echo "<textarea style='width:100%;height:100px;font-family:monospace;'>" . $expiredToken . "</textarea>";
echo "</div>";

// Test 4 : Valider le token expiré
echo "<div class='card'>";
echo "<h2>4️⃣ Essayer de valider le token expiré</h2>";
$validated = $jwtService->validateToken($expiredToken);
if ($validated) {
    echo "<p class='error'>❌ ERREUR : Le token expiré est accepté (ne devrait pas arriver)</p>";
} else {
    echo "<p class='ok'>✅ Le token expiré est correctement rejeté</p>";
}
echo "</div>";

// Test 5 : Tester le refresh
echo "<div class='card'>";
echo "<h2>5️⃣ Tester la fonction refresh()</h2>";
echo "<p>Le refresh génère un nouveau token à partir du token expiré (si récent).</p>";

// Note : refreshToken() valide d'abord le token, donc ça échouera avec un token expiré
// C'est normal ! En production, le refresh se fait AVANT l'expiration
$refreshed = $jwtService->refreshToken($normalToken);
if ($refreshed) {
    echo "<p class='ok'>✅ Refresh réussi (avec token valide)</p>";
    echo "<p><strong>Nouveau token :</strong></p>";
    echo "<textarea style='width:100%;height:100px;font-family:monospace;'>" . $refreshed . "</textarea>";
} else {
    echo "<p class='error'>❌ Refresh échoué</p>";
}
echo "</div>";

// Test 6 : Instructions pour tester dans le frontend
echo "<div class='card'>";
echo "<h2>6️⃣ Test dans le navigateur</h2>";
echo "<p><strong>Pour tester le refresh automatique côté frontend :</strong></p>";
echo "<ol>";
echo "<li>Connectez-vous à YarnFlow</li>";
echo "<li>Ouvrez la Console (F12)</li>";
echo "<li>Collez ce code :</li>";
echo "</ol>";

echo "<pre style='background:#1e293b;color:#fff;padding:15px;'>
// Remplacer le token par un token expiré
localStorage.setItem('token', '" . $expiredToken . "')

// Vérifier
console.log('Token remplacé par un token expiré')
console.log('👉 Maintenant, rafraîchissez la page ou faites une action')
console.log('👉 Ouvrez l\'onglet Network pour voir la requête POST /auth/refresh')
</pre>";

echo "<p><strong>Résultat attendu :</strong></p>";
echo "<ul>";
echo "<li class='ok'>✅ Une requête <code>POST /auth/refresh</code> est envoyée automatiquement</li>";
echo "<li class='ok'>✅ Un nouveau token est reçu et stocké</li>";
echo "<li class='ok'>✅ Vous restez connecté (pas de redirection vers /login)</li>";
echo "</ul>";

echo "<p><strong>Si ça ne marche pas :</strong></p>";
echo "<ul>";
echo "<li class='error'>❌ Vous êtes redirigé vers /login → Le refresh a échoué</li>";
echo "<li>Vérifiez la console pour les erreurs</li>";
echo "<li>Vérifiez l'onglet Network pour voir la réponse de /auth/refresh</li>";
echo "</ul>";
echo "</div>";

// Test 7 : Temps restant
echo "<div class='card'>";
echo "<h2>7️⃣ Temps restant avant expiration</h2>";
$timeLeft = $jwtService->getTimeToExpiration($normalToken);
if ($timeLeft !== null) {
    $days = floor($timeLeft / 86400);
    $hours = floor(($timeLeft % 86400) / 3600);
    echo "<p class='ok'>✅ Temps restant : <strong>$days jours, $hours heures</strong></p>";
} else {
    echo "<p class='error'>❌ Impossible de calculer le temps restant</p>";
}
echo "</div>";
?>
