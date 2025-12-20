<?php
/**
 * Script de vérification des Price IDs Stripe
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Charger les variables d'environnement
$envFile = __DIR__ . '/../config/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $_ENV[trim($name)] = trim($value);
            putenv(trim($name) . '=' . trim($value));
        }
    }
}

header('Content-Type: text/html; charset=utf-8');

$stripeKey = $_ENV['STRIPE_SECRET_KEY'] ?? '';

echo "<h1>🔍 Vérification des Price IDs Stripe</h1>";
echo "<style>body{font-family:monospace;padding:20px;background:#f5f5f5;} .ok{color:green;font-weight:bold;} .error{color:red;font-weight:bold;} .warning{color:orange;font-weight:bold;} .card{background:white;padding:15px;margin:10px 0;border-radius:5px;border-left:4px solid #ccc;}</style>";

if (empty($stripeKey)) {
    echo "<p class='error'>❌ STRIPE_SECRET_KEY non configurée dans .env</p>";
    exit;
}

echo "<div class='card'>";
echo "<p>Clé Stripe : <code>" . substr($stripeKey, 0, 20) . "...</code></p>";
echo "<p>Mode : <strong>" . (strpos($stripeKey, 'test') !== false ? 'TEST' : 'PRODUCTION') . "</strong></p>";
echo "</div>";

// Liste des Price IDs à vérifier
$priceIds = [
    'PLUS Mensuel' => $_ENV['STRIPE_PRICE_ID_PLUS_MONTHLY'] ?? '',
    'PLUS Annuel' => $_ENV['STRIPE_PRICE_ID_PLUS_ANNUAL'] ?? '',
    'PRO Mensuel' => $_ENV['STRIPE_PRICE_ID_PRO_MONTHLY'] ?? '',
    'PRO Annuel' => $_ENV['STRIPE_PRICE_ID_PRO_ANNUAL'] ?? '',
    'Early Bird' => $_ENV['STRIPE_PRICE_ID_EARLY_BIRD'] ?? '',
    'Pack 50 crédits' => $_ENV['STRIPE_PRICE_ID_CREDITS_50'] ?? '',
    'Pack 150 crédits' => $_ENV['STRIPE_PRICE_ID_CREDITS_150'] ?? '',
];

echo "<h2>Vérification des Price IDs</h2>";

\Stripe\Stripe::setApiKey($stripeKey);

foreach ($priceIds as $label => $priceId) {
    echo "<div class='card'>";
    echo "<h3>$label</h3>";

    if (empty($priceId)) {
        echo "<p class='warning'>⚠️ Non configuré dans .env</p>";
        echo "</div>";
        continue;
    }

    echo "<p>Price ID : <code>$priceId</code></p>";

    try {
        $price = \Stripe\Price::retrieve($priceId);

        echo "<p class='ok'>✅ Price ID VALIDE</p>";
        echo "<p>Montant : <strong>" . ($price->unit_amount / 100) . " " . strtoupper($price->currency) . "</strong></p>";
        echo "<p>Type : <strong>" . ($price->type === 'recurring' ? 'Récurrent (' . $price->recurring->interval . ')' : 'Paiement unique') . "</strong></p>";
        echo "<p>Actif : <strong>" . ($price->active ? 'Oui' : 'Non (ARCHIVÉ)') . "</strong></p>";

        // Récupérer le produit associé
        try {
            $product = \Stripe\Product::retrieve($price->product);
            echo "<p>Produit : <strong>" . $product->name . "</strong></p>";
            echo "<p>Produit actif : <strong>" . ($product->active ? 'Oui' : 'Non (ARCHIVÉ)') . "</strong></p>";
        } catch (Exception $e) {
            echo "<p class='warning'>⚠️ Impossible de récupérer le produit</p>";
        }

    } catch (\Stripe\Exception\InvalidRequestException $e) {
        echo "<p class='error'>❌ ERREUR : Price ID invalide ou inexistant</p>";
        echo "<p>Message : " . $e->getMessage() . "</p>";
        echo "<p><strong>Action requise :</strong> Créez ce produit dans Stripe Dashboard et mettez à jour le .env</p>";
    } catch (Exception $e) {
        echo "<p class='error'>❌ ERREUR : " . $e->getMessage() . "</p>";
    }

    echo "</div>";
}

echo "<hr>";
echo "<h2>📝 Actions recommandées</h2>";
echo "<ol>";
echo "<li>Si des Price IDs sont invalides, allez sur <a href='https://dashboard.stripe.com/test/products' target='_blank'>Stripe Dashboard (TEST)</a></li>";
echo "<li>Créez les produits manquants selon le guide STRIPE_SETUP.md</li>";
echo "<li>Copiez les nouveaux Price IDs dans backend/config/.env</li>";
echo "<li>Rechargez cette page pour vérifier</li>";
echo "</ol>";
?>
