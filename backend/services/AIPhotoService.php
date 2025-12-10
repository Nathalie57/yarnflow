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
     * [AI:Claude] Contextes - Descriptions SIMPLES pour le prompt Gemini
     * Format: "genere une photo [STYLE] a partir de cette image sans changer le produit home made"
     */
    private const CONTEXTS = [
        // Wearables
        'worn_model' => 'avec le produit porté par un modèle dans un cadre naturel',
        'mannequin' => 'sur mannequin avec fond neutre gris',
        'studio_white' => 'sur fond blanc pur style studio professionnel',
        'flat_lay' => 'en vue du dessus sur surface claire en bois ou lin avec lumière douce naturelle',

        // Amigurumi
        'kids_room' => 'dans une ambiance douce et colorée style chambre d\'enfant',
        'held_hands' => 'tenu délicatement dans des mains avec fond doux',
        'shelf_display' => 'présenté sur une surface avec éclairage lumineux',

        // Accessoires
        'in_use' => 'en situation d\'usage naturel avec fond doux',
        'product_white' => 'sur fond blanc pur style e-commerce',
        'flat_lay_styled' => 'en vue du dessus sur table en bois clair avec éléments déco minimalistes et ombres douces',

        // Home decor
        'on_sofa' => 'dans un cadre cosy avec textures douces en arrière-plan',
        'with_plants' => 'avec des tons verts naturels en arrière-plan',
        'flat_lay_texture' => 'en vue du dessus rapprochée sur surface texturée naturelle comme lin ou coton avec éclairage doux',

        // Général - Styles lifestyle
        'lifestyle' => 'lifestyle chaleureuse avec lumière naturelle dorée',
        'studio' => 'studio professionnel avec fond blanc et éclairage parfait',
        'nature' => 'dans une ambiance naturelle avec lumière douce et tons verts',
        'cafe' => 'dans une ambiance chaleureuse avec tons bois et lumière douce',

        // Styles distincts
        'rustic' => 'rustique avec tons bois chaleureux et lumière naturelle',
        'modern' => 'moderne minimaliste avec tons gris et lignes épurées',
        'vintage' => 'vintage avec tons sépia chauds et ambiance nostalgique',
        'scandinavian' => 'scandinave avec tons clairs bois et blanc, lumineux et aéré'
    ];


    private bool $simulationMode;

    public function __construct()
    {
        $this->geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? '';
        $this->geminiModel = $_ENV['GEMINI_MODEL'] ?? 'gemini-2.5-flash-image-preview'; // [AI:Claude] Utiliser la config .env
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

            // [AI:Claude] Construire le prompt avec le contexte
            $projectType = $options['project_type'] ?? 'handmade craft';
            $context = $options['context'] ?? 'lifestyle';
            $fromPreview = $options['from_preview'] ?? false;

            // [AI:Claude] Si on part d'une preview, utiliser un prompt d'upscaling au lieu de génération
            if ($fromPreview) {
                $prompt = "Generate a high-resolution version of this exact image. Keep the exact same composition, style, lighting, colors, and all details identical. Only increase the resolution and quality, do not change anything else.";
                error_log("[GEMINI] Using UPSCALE prompt (from preview)");
            } else {
                $prompt = $this->buildPrompt($projectType, $context);
                error_log("[GEMINI] Using GENERATION prompt (from original)");
            }

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
     * [AI:Claude] Construire le prompt de génération - Format SIMPLE qui fonctionne
     * Basé sur le prompt testé avec succès par l'utilisatrice sur Gemini
     *
     * @param string $type Type de projet (Vêtements, Accessoires, etc.)
     * @param string $context Contexte visuel (studio_white, product_white, etc.)
     * @return string Prompt optimisé
     */
    private function buildPrompt(string $type, string $context): string
    {
        // [AI:Claude] Récupérer la description du contexte
        $contextDescription = self::CONTEXTS[$context] ?? self::CONTEXTS['lifestyle'];

        // [AI:Claude] Mapping des catégories vers des indices de contexte pour le prompt
        $typeHints = [
            'Vêtements' => 'un vêtement',
            'Accessoires' => 'un accessoire',
            'Maison/Déco' => 'un objet de décoration',
            'Jouets/Peluches' => 'un jouet ou une peluche amigurumi',
            'Accessoires bébé' => 'un accessoire pour bébé'
        ];

        $typeHint = $typeHints[$type] ?? 'un objet';

        // [AI:Claude] Format SIMPLE testé et validé - fonctionne parfaitement avec Gemini
        return "Génère une photo de l'ouvrage fait main ({$typeHint}) qui est sur la photo, dans un style {$contextDescription}, sans modifier le produit.";
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
                    'temperature' => 0.2, // [AI:Claude] Très bas pour maximum de fidélité (préserver le produit)
                    'topK' => 20,
                    'topP' => 0.9,
                    'responseModalities' => ['Image'], // [AI:Claude] Retourner uniquement l'image
                    'imageConfig' => [
                        'aspectRatio' => '1:1' // [AI:Claude] Format carré par défaut
                        // [AI:Claude] negativePrompt retiré - non supporté par Gemini API
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
     * [AI:Claude] Ajouter un filigrane "YarnFlow" répété en diagonal sur toute l'image
     *
     * @param resource $image Ressource image GD
     * @return void
     */
    private function addWatermark($image): void
    {
        $width = imagesx($image);
        $height = imagesy($image);

        // [AI:Claude] Créer une couleur blanche très transparente
        $white = imagecolorallocatealpha($image, 255, 255, 255, 100); // 100 = très transparent

        // [AI:Claude] Texte du filigrane
        $text = 'YarnFlow';

        // [AI:Claude] Angle diagonal
        $angle = -45;

        // [AI:Claude] Taille de police
        $fontSize = (int)($width / 12); // Plus petit pour répétition

        // [AI:Claude] Espacement entre les répétitions
        $spacing = (int)($width / 3);

        // [AI:Claude] Chemin de la police TrueType
        $fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

        if (file_exists($fontPath)) {
            // [AI:Claude] Répéter le texte en lignes diagonales parallèles
            // Créer des lignes diagonales espacées qui couvrent toute l'image
            $diagonal = sqrt($width * $width + $height * $height); // Diagonale de l'image

            // Parcourir des lignes diagonales parallèles
            for ($offset = -$diagonal; $offset < $diagonal; $offset += $spacing) {
                // Sur chaque ligne diagonale, placer le texte à intervalles réguliers
                for ($pos = -$diagonal; $pos < $diagonal; $pos += $spacing) {
                    // Calculer les coordonnées x,y pour suivre une diagonale à 45°
                    $x = (int)($pos * cos(deg2rad(45)) - $offset * sin(deg2rad(45)));
                    $y = (int)($pos * sin(deg2rad(45)) + $offset * cos(deg2rad(45)));

                    // Ajouter le texte
                    imagettftext($image, $fontSize, $angle, $x, $y, $white, $fontPath, $text);
                }
            }
        } else {
            // [AI:Claude] Fallback : utiliser imagestring (motif répété horizontal)
            $spacing = 60;
            for ($x = 0; $x < $width; $x += $spacing) {
                for ($y = 0; $y < $height; $y += $spacing) {
                    imagestring($image, 3, $x, $y, $text, $white);
                }
            }
        }
    }

    /**
     * [AI:Claude] Générer une preview basse résolution (256x256) - GRATUIT
     *
     * @param string $imagePath Chemin de l'image source
     * @param array $options Options (project_type, context)
     * @return array Résultat avec preview_image_base64
     */
    public function generatePreview(string $imagePath, array $options): array
    {
        $startTime = microtime(true);

        try {
            // [AI:Claude] Validation de l'image
            if (!file_exists($imagePath))
                throw new \InvalidArgumentException("Image non trouvée: $imagePath");

            // [AI:Claude] Construire le prompt
            $projectType = $options['project_type'] ?? 'handmade craft';
            $context = $options['context'] ?? 'lifestyle';

            $prompt = $this->buildPrompt($projectType, $context);

            // [AI:Claude] Mode simulation (pour tester sans API)
            if ($this->simulationMode) {
                error_log("[GEMINI SIMULATION] Preview mode - copie miniature");

                // Créer une version miniature
                $imageData = file_get_contents($imagePath);
                $image = imagecreatefromstring($imageData);

                $thumbnail = imagecreatetruecolor(256, 256);
                imagecopyresampled(
                    $thumbnail, $image,
                    0, 0, 0, 0,
                    256, 256,
                    imagesx($image), imagesy($image)
                );

                // [AI:Claude] Ajouter le filigrane "PREVIEW"
                $this->addWatermark($thumbnail);

                ob_start();
                imagejpeg($thumbnail, null, 60);
                $thumbnailData = ob_get_clean();

                imagedestroy($image);
                imagedestroy($thumbnail);

                return [
                    'success' => true,
                    'preview_image_base64' => base64_encode($thumbnailData),
                    'prompt_used' => $prompt,
                    'generation_time_ms' => round((microtime(true) - $startTime) * 1000)
                ];
            }

            // [AI:Claude] Préparer l'image
            $imageData = file_get_contents($imagePath);
            $imageBase64 = base64_encode($imageData);
            $mimeType = mime_content_type($imagePath);

            // [AI:Claude] Construire l'endpoint Gemini
            $endpoint = sprintf(
                'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
                $this->geminiModel,
                $this->geminiApiKey
            );

            error_log("[GEMINI PREVIEW] Endpoint: " . $endpoint);
            error_log("[GEMINI PREVIEW] Prompt: " . $prompt);

            // [AI:Claude] Appeler Gemini avec OUTPUT BASSE RÉSOLUTION
            $response = $this->httpClient->post($endpoint, [
                'json' => [
                    'contents' => [[
                        'parts' => [
                            [
                                'text' => $prompt
                            ],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $imageBase64
                                ]
                            ]
                        ]
                    ]],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'topK' => 20,
                        'topP' => 0.9,
                        'responseModalities' => ['Image'],
                        'imageConfig' => [
                            'aspectRatio' => '1:1'
                        ]
                    ]
                ],
                'headers' => [
                    'Content-Type' => 'application/json'
                ]
            ]);

            $responseData = json_decode($response->getBody()->getContents(), true);

            // [AI:Claude] Extraire l'image générée
            if (!isset($responseData['candidates'][0]['content']['parts'][0]['inlineData']['data'])) {
                throw new \Exception('Aucune image générée par Gemini');
            }

            $generatedImageBase64 = $responseData['candidates'][0]['content']['parts'][0]['inlineData']['data'];

            // [AI:Claude] Réduire la résolution si nécessaire
            $generatedImageData = base64_decode($generatedImageBase64);
            $image = imagecreatefromstring($generatedImageData);

            $width = imagesx($image);
            $height = imagesy($image);

            // Si l'image est plus grande que 256x256, la réduire
            if ($width > 256 || $height > 256) {
                $ratio = min(256 / $width, 256 / $height);
                $newWidth = (int)round($width * $ratio);
                $newHeight = (int)round($height * $ratio);

                $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
                imagecopyresampled(
                    $thumbnail, $image,
                    0, 0, 0, 0,
                    $newWidth, $newHeight,
                    $width, $height
                );

                // [AI:Claude] Ajouter le filigrane "PREVIEW"
                $this->addWatermark($thumbnail);

                ob_start();
                imagejpeg($thumbnail, null, 60); // Qualité réduite
                $generatedImageData = ob_get_clean();

                imagedestroy($thumbnail);
                $generatedImageBase64 = base64_encode($generatedImageData);
            } else {
                // [AI:Claude] Ajouter le filigrane même si pas de redimensionnement
                $this->addWatermark($image);

                ob_start();
                imagejpeg($image, null, 60);
                $generatedImageData = ob_get_clean();
                $generatedImageBase64 = base64_encode($generatedImageData);
            }

            imagedestroy($image);

            $generationTimeMs = round((microtime(true) - $startTime) * 1000);

            error_log("[GEMINI PREVIEW SUCCESS] Temps: {$generationTimeMs}ms");

            return [
                'success' => true,
                'preview_image_base64' => $generatedImageBase64,
                'prompt_used' => $prompt,
                'generation_time_ms' => $generationTimeMs
            ];

        } catch (\Exception $e) {
            error_log('[GEMINI PREVIEW ERROR] ' . $e->getMessage());

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Obtenir les contextes disponibles pour le frontend
     *
     * @return array Liste des contextes
     */
    public static function getAvailableContexts(): array
    {
        return array_keys(self::CONTEXTS);
    }
}
