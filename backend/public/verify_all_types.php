<?php
/**
 * Vérification complète de tous les types d'abonnements et paiements
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/Database.php';

use App\Config\Database;

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🔍 Vérification complète des types</h1>";
echo "<style>
    body{font-family:monospace;padding:20px;background:#f5f5f5;line-height:1.6;}
    .ok{color:green;font-weight:bold;}
    .error{color:red;font-weight:bold;}
    .warning{color:orange;font-weight:bold;}
    table{width:100%;border-collapse:collapse;background:white;margin:10px 0;}
    th,td{padding:8px;text-align:left;border:1px solid #ddd;}
    th{background:#6366f1;color:white;}
    .card{background:white;padding:15px;margin:15px 0;border-radius:5px;border-left:4px solid #6366f1;}
    h2{margin-top:30px;}
</style>";

$db = Database::getInstance()->getConnection();
$errors = [];
$warnings = [];

// ============================================================
// 1. VÉRIFIER LES CONSTANTES PHP
// ============================================================
echo "<div class='card'>";
echo "<h2>1️⃣ Constantes PHP (constants.php)</h2>";

$expectedConstants = [
    'SUBSCRIPTION_FREE' => 'free',
    'SUBSCRIPTION_PLUS' => 'plus',
    'SUBSCRIPTION_PLUS_ANNUAL' => 'plus_annual',
    'SUBSCRIPTION_PRO' => 'pro',
    'SUBSCRIPTION_PRO_ANNUAL' => 'pro_annual',
    'SUBSCRIPTION_EARLY_BIRD' => 'early_bird',
    'PAYMENT_PATTERN' => 'pattern',
    'PAYMENT_SUBSCRIPTION_PLUS' => 'subscription_plus',
    'PAYMENT_SUBSCRIPTION_PLUS_ANNUAL' => 'subscription_plus_annual',
    'PAYMENT_SUBSCRIPTION_PRO' => 'subscription_pro',
    'PAYMENT_SUBSCRIPTION_PRO_ANNUAL' => 'subscription_pro_annual',
    'PAYMENT_SUBSCRIPTION_EARLY_BIRD' => 'subscription_early_bird',
    'PAYMENT_CREDITS_PACK_50' => 'credits_pack_50',
    'PAYMENT_CREDITS_PACK_150' => 'credits_pack_150',
];

echo "<table>";
echo "<tr><th>Constante</th><th>Valeur attendue</th><th>Valeur réelle</th><th>Status</th></tr>";

foreach ($expectedConstants as $const => $expected) {
    if (defined($const)) {
        $actual = constant($const);
        $match = $actual === $expected;
        echo "<tr>";
        echo "<td><code>$const</code></td>";
        echo "<td>$expected</td>";
        echo "<td>$actual</td>";
        echo "<td>" . ($match ? "<span class='ok'>✅</span>" : "<span class='error'>❌</span>") . "</td>";
        echo "</tr>";

        if (!$match) {
            $errors[] = "Constante $const a la valeur '$actual' au lieu de '$expected'";
        }
    } else {
        echo "<tr>";
        echo "<td><code>$const</code></td>";
        echo "<td>$expected</td>";
        echo "<td class='error'>NON DÉFINIE</td>";
        echo "<td><span class='error'>❌</span></td>";
        echo "</tr>";
        $errors[] = "Constante $const non définie";
    }
}
echo "</table>";
echo "</div>";

// ============================================================
// 2. VÉRIFIER L'ENUM payment_type
// ============================================================
echo "<div class='card'>";
echo "<h2>2️⃣ ENUM payment_type dans la base de données</h2>";

$stmt = $db->query("
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'patron_maker'
    AND TABLE_NAME = 'payments'
    AND COLUMN_NAME = 'payment_type'
");
$enumDef = $stmt->fetchColumn();

// Extraire les valeurs de l'ENUM
preg_match("/^enum\((.+)\)$/", $enumDef, $matches);
$enumValues = array_map(function($v) {
    return trim($v, "'");
}, explode(',', $matches[1]));

echo "<p>Définition : <code>$enumDef</code></p>";

$requiredPaymentTypes = [
    'pattern',
    'subscription_plus',
    'subscription_plus_annual',
    'subscription_pro',
    'subscription_pro_annual',
    'subscription_early_bird',
    'credits_pack_50',
    'credits_pack_150',
];

echo "<table>";
echo "<tr><th>Valeur requise</th><th>Dans l'ENUM ?</th></tr>";

foreach ($requiredPaymentTypes as $type) {
    $exists = in_array($type, $enumValues);
    echo "<tr>";
    echo "<td><code>$type</code></td>";
    echo "<td>" . ($exists ? "<span class='ok'>✅ Oui</span>" : "<span class='error'>❌ MANQUANT</span>") . "</td>";
    echo "</tr>";

    if (!$exists) {
        $errors[] = "payment_type '$type' manquant dans l'ENUM de la table payments";
    }
}
echo "</table>";
echo "</div>";

// ============================================================
// 3. VÉRIFIER PaymentController match() statements
// ============================================================
echo "<div class='card'>";
echo "<h2>3️⃣ Correspondances dans PaymentController.php</h2>";

$controllerFile = __DIR__ . '/../controllers/PaymentController.php';
$controllerContent = file_get_contents($controllerFile);

// Vérifier la correspondance payment_type → subscription_type
$typeMappings = [
    'subscription_plus' => 'plus',
    'subscription_plus_annual' => 'plus_annual',
    'subscription_pro' => 'pro',
    'subscription_pro_annual' => 'pro_annual',
    'subscription_early_bird' => 'early_bird',
];

echo "<p><strong>Correspondance payment_type → subscription_type</strong></p>";
echo "<table>";
echo "<tr><th>payment_type</th><th>subscription_type attendu</th><th>Dans le code ?</th></tr>";

foreach ($typeMappings as $paymentType => $subscriptionType) {
    // Chercher dans processCheckoutCompleted
    $pattern = "/'$paymentType'.*=>.*SUBSCRIPTION_" . strtoupper(str_replace(['_annual', 'subscription_'], ['_ANNUAL', ''], $paymentType)) . "/";
    $found = preg_match($pattern, $controllerContent);

    echo "<tr>";
    echo "<td><code>$paymentType</code></td>";
    echo "<td><code>$subscriptionType</code></td>";
    echo "<td>" . ($found ? "<span class='ok'>✅</span>" : "<span class='warning'>⚠️ À vérifier</span>") . "</td>";
    echo "</tr>";
}
echo "</table>";

// Vérifier les montants de crédits
echo "<p><strong>Montants de crédits pour packs</strong></p>";
echo "<table>";
echo "<tr><th>Pack</th><th>Crédits attendus</th><th>Dans le code ?</th></tr>";

$creditPacks = [
    'credits_pack_50' => 50,
    'credits_pack_150' => 150,
];

foreach ($creditPacks as $pack => $credits) {
    $pattern = "/$pack.*=>.*$credits/";
    $found = preg_match($pattern, $controllerContent);

    echo "<tr>";
    echo "<td><code>$pack</code></td>";
    echo "<td>$credits crédits</td>";
    echo "<td>" . ($found ? "<span class='ok'>✅</span>" : "<span class='error'>❌</span>") . "</td>";
    echo "</tr>";

    if (!$found) {
        $errors[] = "Montant de crédits pour $pack non trouvé dans PaymentController";
    }
}
echo "</table>";
echo "</div>";

// ============================================================
// 4. VÉRIFIER MyProjects.jsx (quotas frontend)
// ============================================================
echo "<div class='card'>";
echo "<h2>4️⃣ Quotas de projets (MyProjects.jsx)</h2>";

$myProjectsFile = __DIR__ . '/../../frontend/src/pages/MyProjects.jsx';
if (file_exists($myProjectsFile)) {
    $myProjectsContent = file_get_contents($myProjectsFile);

    $quotas = [
        'free' => 3,
        'plus' => 7,
        'plus_annual' => 7,
        'pro' => 999,
        'pro_annual' => 999,
        'early_bird' => 999,
    ];

    echo "<table>";
    echo "<tr><th>subscription_type</th><th>Projets max attendus</th><th>Dans le code ?</th></tr>";

    foreach ($quotas as $type => $max) {
        // Chercher la ligne correspondante
        if ($type === 'plus' || $type === 'plus_annual') {
            $pattern = "/subscription_type.*===.*'$type'.*\?.*7/";
        } else if ($type === 'free') {
            $pattern = "/subscription_type.*===.*'free'.*\?.*3/";
        } else {
            $pattern = "/subscription_type.*===.*'$type'.*\?.*999/";
        }

        $found = preg_match($pattern, $myProjectsContent);

        echo "<tr>";
        echo "<td><code>$type</code></td>";
        echo "<td>$max projets</td>";
        echo "<td>" . ($found ? "<span class='ok'>✅</span>" : "<span class='warning'>⚠️</span>") . "</td>";
        echo "</tr>";

        if (!$found && $type !== 'plus_annual') {
            $warnings[] = "Quota pour $type non trouvé explicitement dans MyProjects.jsx (peut être géré par fallback)";
        }
    }
    echo "</table>";
} else {
    echo "<p class='warning'>⚠️ Fichier MyProjects.jsx non trouvé (frontend non accessible)</p>";
}
echo "</div>";

// ============================================================
// 5. VÉRIFIER constants.php SUBSCRIPTION_FEATURES
// ============================================================
echo "<div class='card'>";
echo "<h2>5️⃣ Configuration des plans (SUBSCRIPTION_FEATURES)</h2>";

$features = SUBSCRIPTION_FEATURES ?? [];

echo "<table>";
echo "<tr><th>Plan</th><th>Projets max</th><th>Crédits/mois</th><th>Tags</th><th>Favoris</th></tr>";

$expectedFeatures = [
    'free' => ['max_active_projects' => 3, 'photo_credits_per_month' => 5, 'can_use_tags' => false],
    'plus' => ['max_active_projects' => 7, 'photo_credits_per_month' => 15, 'can_use_tags' => true],
    'plus_annual' => ['max_active_projects' => 7, 'photo_credits_per_month' => 15, 'can_use_tags' => true],
    'pro' => ['max_active_projects' => -1, 'photo_credits_per_month' => 30, 'can_use_tags' => true],
    'pro_annual' => ['max_active_projects' => -1, 'photo_credits_per_month' => 30, 'can_use_tags' => true],
    'early_bird' => ['max_active_projects' => -1, 'photo_credits_per_month' => 30, 'can_use_tags' => true],
];

foreach ($expectedFeatures as $plan => $expected) {
    $actual = $features[$plan] ?? null;

    if ($actual) {
        $projectsOk = $actual['max_active_projects'] == $expected['max_active_projects'];
        $creditsOk = $actual['photo_credits_per_month'] == $expected['photo_credits_per_month'];
        $tagsOk = $actual['can_use_tags'] == $expected['can_use_tags'];

        $status = ($projectsOk && $creditsOk && $tagsOk) ? "<span class='ok'>✅</span>" : "<span class='error'>❌</span>";

        echo "<tr>";
        echo "<td><strong>$plan</strong></td>";
        echo "<td>" . ($actual['max_active_projects'] == -1 ? 'Illimité' : $actual['max_active_projects']) . " " . ($projectsOk ? "✅" : "❌") . "</td>";
        echo "<td>{$actual['photo_credits_per_month']} " . ($creditsOk ? "✅" : "❌") . "</td>";
        echo "<td>" . ($actual['can_use_tags'] ? 'Oui' : 'Non') . " " . ($tagsOk ? "✅" : "❌") . "</td>";
        echo "<td>" . ($actual['can_mark_favorite'] ? 'Oui' : 'Non') . "</td>";
        echo "</tr>";

        if (!$projectsOk) $errors[] = "Plan $plan : max_active_projects incorrect ({$actual['max_active_projects']} au lieu de {$expected['max_active_projects']})";
        if (!$creditsOk) $errors[] = "Plan $plan : photo_credits_per_month incorrect ({$actual['photo_credits_per_month']} au lieu de {$expected['photo_credits_per_month']})";
        if (!$tagsOk) $errors[] = "Plan $plan : can_use_tags incorrect";
    } else {
        echo "<tr>";
        echo "<td><strong>$plan</strong></td>";
        echo "<td colspan='4' class='error'>❌ Plan non défini dans SUBSCRIPTION_FEATURES</td>";
        echo "</tr>";
        $errors[] = "Plan $plan non défini dans SUBSCRIPTION_FEATURES";
    }
}
echo "</table>";
echo "</div>";

// ============================================================
// 6. VÉRIFIER StripeService Price IDs
// ============================================================
echo "<div class='card'>";
echo "<h2>6️⃣ Variables d'environnement Stripe</h2>";

$requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID_PLUS_MONTHLY',
    'STRIPE_PRICE_ID_PLUS_ANNUAL',
    'STRIPE_PRICE_ID_PRO_MONTHLY',
    'STRIPE_PRICE_ID_PRO_ANNUAL',
    'STRIPE_PRICE_ID_EARLY_BIRD',
    'STRIPE_PRICE_ID_CREDITS_50',
    'STRIPE_PRICE_ID_CREDITS_150',
];

echo "<table>";
echo "<tr><th>Variable</th><th>Définie ?</th><th>Valeur</th></tr>";

foreach ($requiredEnvVars as $var) {
    $value = $_ENV[$var] ?? null;
    $defined = !empty($value);

    echo "<tr>";
    echo "<td><code>$var</code></td>";
    echo "<td>" . ($defined ? "<span class='ok'>✅</span>" : "<span class='error'>❌</span>") . "</td>";
    echo "<td>" . ($defined ? "<code>" . substr($value, 0, 30) . "...</code>" : "<em>Non définie</em>") . "</td>";
    echo "</tr>";

    if (!$defined) {
        $errors[] = "Variable d'environnement $var non définie";
    }
}
echo "</table>";
echo "</div>";

// ============================================================
// RÉSUMÉ FINAL
// ============================================================
echo "<div class='card' style='border-left-color:" . (count($errors) > 0 ? "#ef4444" : "#10b981") . ";'>";
echo "<h2>📊 Résumé</h2>";

if (count($errors) === 0 && count($warnings) === 0) {
    echo "<p class='ok' style='font-size:18px;'>✅ Tout est correct ! Aucune erreur détectée.</p>";
} else {
    if (count($errors) > 0) {
        echo "<h3 class='error'>❌ Erreurs critiques (" . count($errors) . ")</h3>";
        echo "<ul>";
        foreach ($errors as $error) {
            echo "<li class='error'>$error</li>";
        }
        echo "</ul>";
    }

    if (count($warnings) > 0) {
        echo "<h3 class='warning'>⚠️ Avertissements (" . count($warnings) . ")</h3>";
        echo "<ul>";
        foreach ($warnings as $warning) {
            echo "<li class='warning'>$warning</li>";
        }
        echo "</ul>";
    }
}
echo "</div>";
?>
