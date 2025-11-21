<?php
/**
 * Test de génération d'image avec sauvegarde
 */

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/config');
$dotenv->load();

use GuzzleHttp\Client;

$apiKey = $_ENV['GEMINI_API_KEY'];
$model = 'gemini-2.5-flash-image';

echo "🧪 Test Gemini avec sauvegarde d'image\n";
echo str_repeat("=", 50) . "\n\n";

// [AI:Claude] Image de test simple
$testImageData = base64_encode(
    base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==')
);

$endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

$payload = [
    'contents' => [
        [
            'parts' => [
                [
                    'text' => 'Create a beautiful professional photo of a handmade crochet amigurumi with cozy lifestyle aesthetic. Make it Instagram-worthy.'
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
        'responseModalities' => ['Image'],
        'imageConfig' => [
            'aspectRatio' => '1:1'
        ]
    ]
];

echo "📤 Génération en cours...\n\n";

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

    if (isset($responseData['candidates'][0]['content']['parts'][0]['inlineData'])) {
        $imageData = $responseData['candidates'][0]['content']['parts'][0]['inlineData']['data'];
        $mimeType = $responseData['candidates'][0]['content']['parts'][0]['inlineData']['mimeType'];

        echo "✅ IMAGE GÉNÉRÉE !\n";
        echo "Type: {$mimeType}\n";
        echo "Taille: " . strlen($imageData) . " caractères base64\n\n";

        // [AI:Claude] Sauvegarder l'image
        $outputDir = __DIR__ . '/public/uploads/test';
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $extension = $mimeType === 'image/png' ? 'png' : 'jpg';
        $filename = 'gemini_test_' . date('YmdHis') . '.' . $extension;
        $filepath = $outputDir . '/' . $filename;

        file_put_contents($filepath, base64_decode($imageData));

        echo "💾 Image sauvegardée : {$filepath}\n";
        echo "🌐 URL: http://patron-maker.local/uploads/test/{$filename}\n\n";

        echo "🎉 SUCCÈS ! Vous pouvez maintenant voir l'image générée.\n";

    } else {
        echo "⚠️  Pas d'image dans la réponse\n";
        echo json_encode($responseData, JSON_PRETTY_PRINT) . "\n";
    }

} catch (\Exception $e) {
    echo "❌ ERREUR: " . $e->getMessage() . "\n";
}
