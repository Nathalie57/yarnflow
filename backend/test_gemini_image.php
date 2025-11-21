<?php
/**
 * @file test_gemini_image.php
 * @brief Test de génération d'image avec Gemini 2.5 Flash Image Preview
 * @author AI:Claude
 * @created 2025-11-18
 */

require_once __DIR__ . '/vendor/autoload.php';

// [AI:Claude] Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/config');
$dotenv->load();

use GuzzleHttp\Client;

$apiKey = $_ENV['GEMINI_API_KEY'];
$model = 'gemini-2.5-flash-image'; // [AI:Claude] Modèle stable (pas preview)

echo "🧪 Test Gemini 2.5 Flash Image\n";
echo "=" . str_repeat("=", 50) . "\n\n";

// [AI:Claude] Créer une petite image de test (pixel rouge 1x1)
$testImageData = base64_encode(
    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==')
);

echo "📸 Image de test créée (1x1 pixel)\n\n";

$endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$payload = [
    'contents' => [
        [
            'parts' => [
                [
                    'text' => 'Based on this image, create a professional product photo with cozy lifestyle aesthetic.'
                ],
                [
                    'inline_data' => [
                        'mime_type' => 'image/png',
                        'data' => $testImageData
                    ]
                ]
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 1.0,
        'topK' => 40,
        'topP' => 0.95,
        'responseModalities' => ['Image'], // [AI:Claude] Retourner uniquement l'image
        'imageConfig' => [
            'aspectRatio' => '1:1'
        ]
    ]
];

echo "📤 Envoi de la requête à Gemini...\n";
echo "Endpoint: {$endpoint}\n\n";

$client = new Client([
    'timeout' => 60.0,
    'verify' => false
]);

try {
    $response = $client->post($endpoint, [
        'json' => $payload,
        'headers' => [
            'Content-Type' => 'application/json'
        ]
    ]);

    $responseData = json_decode($response->getBody()->getContents(), true);

    echo "✅ Réponse reçue !\n\n";
    echo "📋 Structure de la réponse:\n";
    echo json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n\n";

    // [AI:Claude] Vérifier si une image est présente
    if (isset($responseData['candidates'][0]['content']['parts'][0]['inline_data'])) {
        echo "🎉 IMAGE GÉNÉRÉE TROUVÉE !\n";
        echo "Type: " . $responseData['candidates'][0]['content']['parts'][0]['inline_data']['mime_type'] . "\n";
        echo "Taille données: " . strlen($responseData['candidates'][0]['content']['parts'][0]['inline_data']['data']) . " caractères\n";
    } elseif (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
        echo "📝 Texte reçu (pas d'image):\n";
        echo $responseData['candidates'][0]['content']['parts'][0]['text'] . "\n";
    } else {
        echo "⚠️  Format de réponse inattendu\n";
    }

} catch (\Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";

    if ($e instanceof \GuzzleHttp\Exception\RequestException && $e->hasResponse()) {
        echo "\n📋 Détails de l'erreur:\n";
        echo $e->getResponse()->getBody()->getContents() . "\n";
    }
}

echo "\n" . str_repeat("=", 50) . "\n";
