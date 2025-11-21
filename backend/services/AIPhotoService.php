<?php
/**
 * @file AIPhotoService.php
 * @brief Service de génération de photos IA via Gemini
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création AI Photo Studio
 *
 * @history
 *   2025-11-14 [AI:Claude] Création service Gemini pour embellissement photos
 */

declare(strict_types=1);

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class AIPhotoService
{
    private string $geminiApiKey;
    private string $geminiModel;
    private Client $httpClient;

    /**
     * [AI:Claude] Styles de photos disponibles
     */
    private const STYLES = [
        'lifestyle' => 'cozy lifestyle aesthetic with warm natural lighting and trendy home décor',
        'studio' => 'professional studio photography with clean white background and perfect lighting',
        'scandinavian' => 'Scandinavian minimalist style with neutral tones, natural materials, and soft daylight',
        'nature' => 'natural outdoor setting with soft daylight, greenery, and organic composition',
        'cafe' => 'Instagram-worthy café ambiance with trendy décor, warm lighting, and modern aesthetic'
    ];

    /**
     * [AI:Claude] Usages des photos
     */
    private const PURPOSES = [
        'instagram' => 'Instagram posting with engaging composition and shareable appeal',
        'etsy' => 'Etsy product listing with commercial appeal and clear product showcase',
        'portfolio' => 'professional portfolio showcase with artistic composition and high-end aesthetic'
    ];

    private bool $simulationMode;

    public function __construct()
    {
        $this->geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? '';
        $this->geminiModel = 'gemini-2.5-flash-image'; // [AI:Claude] Modèle stable avec génération d'images
        $this->simulationMode = ($_ENV['GEMINI_SIMULATION_MODE'] ?? 'false') === 'true';

        // [AI:Claude] Ne pas lever d'exception ici, mais seulement lors de l'utilisation
        // Cela permet d'instancier le service sans avoir configuré Gemini

        $this->httpClient = new Client([
            'timeout' => 60.0,
            'verify' => false // Pour éviter erreurs SSL en dev
        ]);
    }

    /**
     * [AI:Claude] Embellir une photo avec Gemini IA
     *
     * @param string $imagePath Chemin vers l'image originale
     * @param array $options Options de génération
     * @return array Résultat avec success, enhanced_image_url, prompt_used
     */
    public function enhancePhoto(string $imagePath, array $options): array
    {
        $startTime = microtime(true);

        try {
            // [AI:Claude] Validation de l'image
            if (!file_exists($imagePath))
                throw new \InvalidArgumentException("Image non trouvée: $imagePath");

            // [AI:Claude] Construire le prompt
            $projectType = $options['project_type'] ?? 'handmade craft';
            $purpose = $options['purpose'] ?? 'instagram';
            $style = $options['style'] ?? 'lifestyle';

            $prompt = $this->buildPrompt($projectType, $purpose, $style);

            // [AI:Claude] Mode simulation (pour tester sans API)
            if ($this->simulationMode) {
                error_log("[GEMINI SIMULATION] Mode simulation activé - copie de l'image originale");
                sleep(2); // Simuler le temps de génération

                $imageData = base64_encode(file_get_contents($imagePath));
                $generationTime = (int)((microtime(true) - $startTime) * 1000);

                return [
                    'success' => true,
                    'enhanced_image_url' => null,
                    'enhanced_image_data' => $imageData,
                    'prompt_used' => $prompt . ' [MODE SIMULATION]',
                    'generation_time_ms' => $generationTime,
                    'ai_model' => $this->geminiModel . ' (simulation)'
                ];
            }

            // [AI:Claude] Vérifier que la clé API est configurée
            if (empty($this->geminiApiKey))
                throw new \RuntimeException('GEMINI_API_KEY non configurée dans .env');

            // [AI:Claude] Encoder l'image en base64
            $imageData = base64_encode(file_get_contents($imagePath));
            $mimeType = $this->getMimeType($imagePath);

            // [AI:Claude] Appeler Gemini API
            $result = $this->callGeminiImageAPI($imageData, $mimeType, $prompt);

            $generationTime = (int)((microtime(true) - $startTime) * 1000);

            // [AI:Claude] Gemini retourne les données de l'image, pas une URL
            return [
                'success' => true,
                'enhanced_image_url' => null, // Gemini retourne les données en base64, pas d'URL
                'enhanced_image_data' => $result['image_data'],
                'mime_type' => $result['mime_type'] ?? 'image/png',
                'prompt_used' => $prompt,
                'generation_time_ms' => $generationTime,
                'ai_model' => $this->geminiModel
            ];

        } catch (\Exception $e) {
            $generationTime = (int)((microtime(true) - $startTime) * 1000);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'generation_time_ms' => $generationTime
            ];
        }
    }

    /**
     * [AI:Claude] Construire le prompt de génération pour Gemini Image Preview
     *
     * @param string $type Type de projet (ex: "crochet teddy bear")
     * @param string $purpose Usage (instagram, etsy, portfolio)
     * @param string $style Style visuel (lifestyle, studio, etc.)
     * @return string Prompt complet optimisé pour la génération d'images
     */
    private function buildPrompt(string $type, string $purpose, string $style): string
    {
        $purposeText = self::PURPOSES[$purpose] ?? self::PURPOSES['instagram'];
        $styleText = self::STYLES[$style] ?? self::STYLES['lifestyle'];

        // [AI:Claude] Prompt optimisé pour générer une NOUVELLE image basée sur l'originale
        return sprintf(
            "Based on this image, create a professional product photo of the %s. " .
            "Style: %s. " .
            "Purpose: %s. " .
            "Keep the handmade item identical but enhance the background, lighting, and composition. " .
            "The result should look natural and appealing.",
            $type,
            $styleText,
            $purposeText
        );
    }

    /**
     * [AI:Claude] Appeler l'API Gemini 2.5 Flash Image Preview pour générer une nouvelle image
     * IMPORTANT: Utilise le modèle gemini-2.5-flash-image-preview qui GÉNÈRE des images
     *
     * @param string $imageData Image encodée en base64
     * @param string $mimeType Type MIME de l'image
     * @param string $prompt Prompt de génération
     * @return array Résultat avec image générée
     * @throws \Exception Si erreur API
     */
    private function callGeminiImageAPI(string $imageData, string $mimeType, string $prompt): array
    {
        try {
            // [AI:Claude] Endpoint Gemini 2.5 Flash Image Preview
            $endpoint = sprintf(
                'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
                $this->geminiModel,
                $this->geminiApiKey
            );

            error_log("[GEMINI API] Endpoint: " . $endpoint);
            error_log("[GEMINI API] Prompt: " . $prompt);

            // [AI:Claude] Payload pour Gemini 2.5 Flash Image
            // Documentation: https://ai.google.dev/gemini-api/docs/image-generation
            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => $prompt
                            ],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $imageData
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
                        'aspectRatio' => '1:1' // [AI:Claude] Format carré par défaut
                    ]
                ]
            ];

            error_log("[GEMINI API] Payload: " . json_encode($payload, JSON_PRETTY_PRINT));

            // [AI:Claude] Appel HTTP
            $response = $this->httpClient->post($endpoint, [
                'json' => $payload,
                'headers' => [
                    'Content-Type' => 'application/json'
                ]
            ]);

            $responseData = json_decode($response->getBody()->getContents(), true);

            error_log("[GEMINI API] Response: " . json_encode($responseData, JSON_PRETTY_PRINT));

            // [AI:Claude] Parser la réponse Gemini (qui contient une image générée)
            return $this->parseGeminiResponse($responseData);

        } catch (GuzzleException $e) {
            $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : '';
            error_log("[GEMINI API ERROR] " . $e->getMessage());
            error_log("[GEMINI API ERROR BODY] " . $errorBody);
            throw new \Exception("Erreur API Gemini: " . $e->getMessage() . " | " . $errorBody);
        } catch (\Exception $e) {
            error_log("[GEMINI ERROR] " . $e->getMessage());
            throw new \Exception("Erreur génération photo: " . $e->getMessage());
        }
    }

    /**
     * [AI:Claude] Parser la réponse de Gemini 2.5 Flash Image
     *
     * @param array $response Réponse brute de l'API
     * @return array Image générée (url ou data)
     * @throws \Exception Si parsing échoue
     */
    private function parseGeminiResponse(array $response): array
    {
        // [AI:Claude] Vérifier structure réponse
        if (!isset($response['candidates'][0]['content']['parts'][0])) {
            error_log("[GEMINI PARSE ERROR] Structure invalide: " . json_encode($response));
            throw new \Exception("Réponse Gemini invalide");
        }

        $part = $response['candidates'][0]['content']['parts'][0];

        // [AI:Claude] Gemini 2.5 Flash Image retourne l'image dans inlineData (avec majuscule)
        if (isset($part['inlineData'])) {
            // Image retournée en base64 (format camelCase)
            error_log("[GEMINI PARSE SUCCESS] Image trouvée dans inlineData");
            return [
                'image_data' => $part['inlineData']['data'],
                'mime_type' => $part['inlineData']['mimeType'] ?? 'image/png'
            ];
        }

        // [AI:Claude] Fallback pour format snake_case
        if (isset($part['inline_data'])) {
            error_log("[GEMINI PARSE SUCCESS] Image trouvée dans inline_data");
            return [
                'image_data' => $part['inline_data']['data'],
                'mime_type' => $part['inline_data']['mime_type'] ?? 'image/png'
            ];
        }

        if (isset($part['text'])) {
            error_log("[GEMINI PARSE] Texte reçu au lieu d'image: " . substr($part['text'], 0, 100));
            throw new \Exception("Gemini a retourné du texte au lieu d'une image");
        }

        error_log("[GEMINI PARSE ERROR] Structure part: " . json_encode($part));
        throw new \Exception("Aucune image générée par Gemini");
    }

    /**
     * [AI:Claude] Parser la réponse texte de Gemini
     *
     * @param array $response Réponse brute de l'API Gemini
     * @return string Texte généré par Gemini
     * @throws \Exception Si parsing échoue
     */
    private function parseGeminiTextResponse(array $response): string
    {
        if (!isset($response['candidates'][0]['content']['parts'][0]['text'])) {
            $errorMsg = $response['error']['message'] ?? 'Réponse Gemini invalide';
            error_log("[GEMINI ERROR] " . json_encode($response));
            throw new \Exception("Erreur Gemini: " . $errorMsg);
        }

        return $response['candidates'][0]['content']['parts'][0]['text'];
    }

    /**
     * [AI:Claude] Parser la réponse d'Imagen
     *
     * @param array $response Réponse brute de l'API Imagen
     * @return array Image générée (data en base64)
     * @throws \Exception Si parsing échoue
     */
    private function parseImagenResponse(array $response): array
    {
        // [AI:Claude] Vérifier structure réponse Imagen
        if (!isset($response['predictions'][0]['bytesBase64Encoded'])) {
            $errorMsg = $response['error']['message'] ?? 'Réponse Imagen invalide';
            error_log("[IMAGEN ERROR] " . json_encode($response));
            throw new \Exception("Erreur Imagen: " . $errorMsg);
        }

        // [AI:Claude] Extraire l'image en base64
        return [
            'image_data' => $response['predictions'][0]['bytesBase64Encoded'],
            'mime_type' => 'image/png'
        ];
    }

    /**
     * [AI:Claude] Sauvegarder l'image générée sur le serveur
     *
     * @param string $imageData Image en base64
     * @param string $userId ID de l'utilisateur
     * @return string Chemin du fichier sauvegardé
     */
    public function saveGeneratedImage(string $imageData, string $userId): string
    {
        // [AI:Claude] Sauvegarder dans public/uploads pour accès web
        $uploadsDir = __DIR__ . '/../public/uploads/photos/enhanced';

        // [AI:Claude] Créer le dossier si n'existe pas
        if (!is_dir($uploadsDir))
            mkdir($uploadsDir, 0755, true);

        // [AI:Claude] Nom de fichier unique
        $filename = sprintf(
            '%s_%s_%s.jpg',
            $userId,
            date('Ymd_His'),
            bin2hex(random_bytes(8))
        );

        $filepath = $uploadsDir . '/' . $filename;

        // [AI:Claude] Décoder et sauvegarder
        $imageContent = base64_decode($imageData);
        file_put_contents($filepath, $imageContent);

        // [AI:Claude] Retourner chemin relatif pour BDD
        return '/uploads/photos/enhanced/' . $filename;
    }

    /**
     * [AI:Claude] Obtenir le type MIME d'une image
     *
     * @param string $imagePath Chemin vers l'image
     * @return string Type MIME
     */
    private function getMimeType(string $imagePath): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $imagePath);
        finfo_close($finfo);

        return $mimeType ?: 'image/jpeg';
    }

    /**
     * [AI:Claude] Valider le type d'image
     *
     * @param string $imagePath Chemin vers l'image
     * @return bool True si image valide
     */
    public function isValidImage(string $imagePath): bool
    {
        if (!file_exists($imagePath))
            return false;

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $mimeType = $this->getMimeType($imagePath);

        return in_array($mimeType, $allowedMimes);
    }

    /**
     * [AI:Claude] Obtenir les styles disponibles
     *
     * @return array Liste des styles avec leurs descriptions
     */
    public static function getAvailableStyles(): array
    {
        return [
            'lifestyle' => [
                'name' => 'Lifestyle Instagram',
                'description' => 'Photo cosy avec lumière naturelle et déco tendance',
                'icon' => '🌟'
            ],
            'studio' => [
                'name' => 'Studio professionnel',
                'description' => 'Fond blanc épuré avec éclairage parfait',
                'icon' => '✨'
            ],
            'scandinavian' => [
                'name' => 'Scandinave minimaliste',
                'description' => 'Style nordique avec tons neutres',
                'icon' => '🎨'
            ],
            'nature' => [
                'name' => 'Nature/Outdoor',
                'description' => 'Extérieur avec lumière naturelle',
                'icon' => '🌲'
            ],
            'cafe' => [
                'name' => 'Café trendy',
                'description' => 'Ambiance café Instagram-worthy',
                'icon' => '☕'
            ]
        ];
    }

    /**
     * [AI:Claude] Obtenir les usages disponibles
     *
     * @return array Liste des usages avec leurs descriptions
     */
    public static function getAvailablePurposes(): array
    {
        return [
            'instagram' => [
                'name' => 'Instagram',
                'description' => 'Photo engageante pour les réseaux sociaux',
                'icon' => '📱'
            ],
            'etsy' => [
                'name' => 'Vendre sur Etsy',
                'description' => 'Photo commerciale pour listing produit',
                'icon' => '💰'
            ],
            'portfolio' => [
                'name' => 'Portfolio professionnel',
                'description' => 'Photo artistique haut de gamme',
                'icon' => '📸'
            ]
        ];
    }
}
