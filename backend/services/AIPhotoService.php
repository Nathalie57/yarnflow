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
     * [AI:Claude] v0.14.0 - Contextes par catégorie et tier (FREE/PLUS/PRO)
     * Chaque catégorie a ses propres contextes spécifiques
     */
    private const CONTEXTS = [
        // VÊTEMENTS PORTÉS - FREE
        'wearable_c1' => 'porté par une personne dans un portrait extérieur avec lumière douce naturelle et arrière-plan flou',
        // VÊTEMENTS À PLAT/DÉTAILS - FREE
        'flatlay_c1' => 'posé à plat sur fond blanc studio avec éclairage uniforme et neutre',
        'detail_c1' => 'en gros plan macro extrême sur une partie de l\'ouvrage uniquement, montrant la texture des points et le motif en détail, sans aucun fond visible, lumière naturelle douce pour révéler les détails',
        // VÊTEMENTS PORTÉS - PLUS
        'wearable_c2' => 'porté par une personne en studio avec fond blanc neutre et éclairage uniforme',
        'wearable_c3' => 'porté par une personne dans une ambiance urbaine lifestyle avec rue calme et lumière naturelle',
        // VÊTEMENTS À PLAT - PLUS
        'flatlay_c2' => 'posé à plat avec accessoires lifestyle et props décoratifs sur surface naturelle texturée',
        // VÊTEMENTS PORTÉS - PRO
        'wearable_c4' => 'porté par une personne dans une ambiance vintage avec décor rétro et tons chauds',
        'wearable_c7' => 'porté par une personne en studio avec fond texturé sombre et éclairage dramatique sophistiqué',
        'wearable_c9' => 'porté par une personne dans une ambiance industrielle urbaine avec architecture moderne',

        // ACCESSOIRES - FREE
        'accessory_c1' => 'posé à plat en flat lay sur fond blanc pur avec éclairage studio professionnel et ombres douces',
        'accessory_c2' => 'porté sur la tête d\'une personne (modèle visible) en extérieur avec lumière naturelle douce et arrière-plan flou naturel',
        'accessory_c3' => 'porté par un modèle sur fond neutre uni avec éclairage studio professionnel',
        // ACCESSOIRES - PLUS
        'accessory_c4' => 'posé à plat en flat lay avec accessoires lifestyle complémentaires et composition harmonieuse',
        'accessory_c5' => 'porté par un modèle en ville avec architecture urbaine moderne et ambiance dynamique',
        'accessory_c6' => 'posé sur une table avec textures douces, ambiance cosy et lumière naturelle chaleureuse',
        // ACCESSOIRES - PRO
        'accessory_c7' => 'porté par un modèle dans un shooting mode professionnel avec mise en scène stylée et éclairage studio créatif',
        'accessory_c8' => 'posé en mise en scène luxe avec fond sombre, lumière tamisée élégante et composition raffinée',
        'accessory_c9' => 'porté par un modèle dans un intérieur bohème avec plantes vertes, lumière naturelle et décoration ethnique',

        // MAISON/DÉCO - FREE
        'home_c1' => 'dans un intérieur contemporain graphique avec lignes épurées, touches de couleur vive et design architectural moderne',
        'home_c2' => 'avec bois naturel, plantes vertes et lumière naturelle douce',
        'home_c3' => 'dans un décor scandinave épuré blanc et gris avec lumière aérée',
        // MAISON/DÉCO - PLUS
        'home_c4' => 'dans une ambiance loft industriel avec métal et briques apparentes',
        'home_c5' => 'dans un décor vintage années 70 avec mobilier rétro, couleurs chaudes orangées et moutarde, lumière douce et ambiance cosy',
        'home_c6' => 'dans une ambiance bohème chaleureuse avec tissus doux et textures',
        // MAISON/DÉCO - PRO
        'home_c7' => 'dans un décor moderne luxe avec matériaux nobles et design contemporain',
        'home_c8' => 'dans une ambiance zen avec galets naturels, bambou, statuette Bouddha, bougies et couleurs neutres apaisantes',
        'home_c9' => 'dans un atelier créatif avec table d\'artiste, fournitures artistiques, pinceaux, carnets de croquis, pelotes de laine et lumière naturelle d\'atelier',

        // JOUETS/PELUCHES - FREE
        'toy_c1' => 'dans une chambre enfantine avec lumière douce et tons pastel',
        'toy_c2' => 'dans un décor de livre de contes illustré avec éléments féeriques en aquarelle et couleurs pastel douces',
        'toy_c3' => 'dans une mise en scène artistique épurée avec fond uni blanc lumineux et éclairage doux directionnel éclatant',
        // JOUETS/PELUCHES - PLUS
        'toy_c4' => 'dans une chambre d\'enfant vintage rétro avec jouets anciens en bois et lumière chaude douce',
        'toy_c5' => 'dans une chambre d\'enfant naturelle avec bois, jouets artisanaux et tissus doux en tons pastel',
        'toy_c6' => 'dans un décor cartoon coloré avec fond uni vif et éléments graphiques ludiques style dessin animé',
        // JOUETS/PELUCHES - PRO
        'toy_c7' => 'dans une boutique de jouets artisanaux premium avec étagères en bois clair, fond pastel élégant et éclairage doux professionnel',
        'toy_c8' => 'dans un décor d\'aventure jungle tropicale avec plantes exotiques, accessoires d\'exploration et lumière naturelle dorée',
        'toy_c9' => 'dans une ambiance cirque vintage avec rayures rouge et blanc, paillettes dorées, projecteurs et décor de chapiteau rétro festif',

        // ACCESSOIRES BÉBÉ - FREE
        'baby_c1' => 'posé à plat sur un lit bébé avec draps blancs doux et peluches en tons pastel avec lumière naturelle',
        'baby_c2' => 'posé à plat sur fond pastel uni avec éclairage doux studio et composition épurée',
        'baby_c3' => 'posé à plat dans un berceau blanc avec couvertures douces et jouets en bois naturel clair',
        // ACCESSOIRES BÉBÉ - PLUS
        'baby_c4' => 'en flat lay lifestyle avec jouets artisanaux en bois, plantes vertes et surface naturelle texturée',
        'baby_c5' => 'posé à plat sur une table à langer moderne scandinave avec accessoires minimalistes et lumière douce',
        'baby_c6' => 'posé à plat dans un panier en osier vintage avec tissus lin naturel et lumière chaude dorée',
        // ACCESSOIRES BÉBÉ - PRO
        'baby_c7' => 'posé à plat dans ou à côté d\'un emballage cadeau élégant avec papier doux pastel, ruban satiné et petite carte avec lumière douce',
        'baby_c8' => 'posé à plat en mise en scène lifestyle premium avec accessoires complémentaires raffinés et éclairage professionnel doux',
        'baby_c9' => 'posé complètement à plat horizontalement sur une étagère murale blanche dans une nursery épurée avec autres accessoires bébé posés à plat et lumière naturelle douce'
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
            'timeout' => 120.0, // 2 minutes pour la génération d'images
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
                $itemName = $options['item_name'] ?? '';
                $modelGender = $options['model_gender'] ?? 'person'; // person, male, female
                $prompt = $this->buildPrompt($projectType, $context, $itemName, $modelGender);
                error_log("[GEMINI] Using GENERATION prompt (from original) - Model gender: $modelGender");
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
     * @param string $itemName Nom de l'article (optionnel)
     * @param string $modelGender Genre du modèle : 'person' (neutre), 'male' (homme), 'female' (femme)
     * @return string Prompt optimisé
     */
    private function buildPrompt(string $type, string $context, string $itemName = '', string $modelGender = 'person'): string
    {
        // [AI:Claude] Récupérer la description du contexte
        $contextDescription = self::CONTEXTS[$context] ?? self::CONTEXTS['lifestyle'];

        // [AI:Claude] Déterminer le texte pour le modèle selon le genre choisi
        $modelText = match($modelGender) {
            'male' => 'un homme (modèle masculin)',
            'female' => 'une femme (modèle féminin)',
            default => 'une vraie personne (modèle humain vivant)'
        };

        // [AI:Claude] v0.14.0 - Prompt ULTRA STRICT spécifique pour photos portées
        $isWornContext = in_array($context, [
            'worn_model',
            'mannequin',
            'wearable_c1',
            'wearable_c2',
            'wearable_c3',
            'wearable_c4',
            'wearable_c7',
            'wearable_c9',
            // Accessoires portés
            'accessory_c2',
            'accessory_c3',
            'accessory_c5',
            'accessory_c7',
            'accessory_c9'
        ]);

        if ($isWornContext) {
            // Pour photos portées : préciser le genre du modèle si demandé
            return "Tu dois créer une nouvelle photo professionnelle {$contextDescription}. L'article doit être porté par {$modelText}, PAS un mannequin de vitrine en plastique. ÉTAPES CRITIQUES : 1) Garde l'ouvrage fait main porté par le modèle. 2) RETIRE tous les éléments parasites : mains qui tiennent artificiellement l'ouvrage (sauf si elles font naturellement partie de la pose), objets indésirables, fond original moche. 3) Place le modèle portant l'ouvrage dans le nouveau contexte avec une pose naturelle et appropriée. RÈGLE ABSOLUE sur les détails visuels de l'ouvrage porté : conserve EXACTEMENT les COULEURS, la TEXTURE, le MOTIF et tous les détails visuels. Tu PEUX changer l'angle de vue, la pose du modèle, la position dans l'espace pour créer une belle composition naturelle, mais tu NE PEUX PAS changer l'apparence visuelle de l'ouvrage lui-même (couleurs, motifs, texture). L'ouvrage porté doit être bien mis en valeur dans une scène réaliste.";
        }

        // [AI:Claude] v0.14.0 - Prompt spécifique pour tous les accessoires bébé (toujours à plat)
        $isBabyContext = str_starts_with($context, 'baby_');

        if ($isBabyContext) {
            error_log("[PROMPT] Accessoire bébé '{$itemName}' - Utilisation du prompt FLAT LAY strict");
            return "Tu dois créer une nouvelle photo professionnelle {$contextDescription}. ÉTAPES CRITIQUES : 1) ISOLE uniquement l'accessoire bébé visible sur l'image originale. 2) RETIRE complètement tous les autres éléments : mains, bras, personnes, fond original, objets indésirables. 3) Place l'accessoire isolé complètement à plat sur la surface horizontale dans le nouveau contexte, comme s'il était naturellement posé par gravité, JAMAIS debout ou en position verticale. RÈGLE ABSOLUE sur les détails visuels : conserve EXACTEMENT les COULEURS, la TEXTURE, le MOTIF et tous les détails visuels de l'ouvrage. Tu PEUX changer l'angle de vue (vue du dessus, légèrement de côté, etc.) et la position sur la surface pour que ce soit naturel et bien composé, mais l'accessoire doit toujours rester à plat horizontalement. Tu NE PEUX PAS changer l'apparence visuelle (couleurs, motifs, texture). L'accessoire doit être seul et bien mis en scène.";
        }

        // [AI:Claude] Prompt standard pour autres contextes (produit seul)
        return "Tu dois créer une nouvelle photo professionnelle {$contextDescription}. ÉTAPES CRITIQUES : 1) ISOLE uniquement l'ouvrage fait main visible sur l'image originale. 2) RETIRE complètement tous les autres éléments : mains, bras, personnes, fond original, objets indésirables. 3) Place l'ouvrage isolé dans le nouveau contexte avec une position, un angle et une pose NATURELS et APPROPRIÉS pour le contexte demandé. RÈGLE ABSOLUE sur les détails visuels de l'ouvrage : conserve EXACTEMENT les COULEURS, la TEXTURE, le MOTIF, la FORME et tous les détails visuels. Tu PEUX changer la position, l'angle de vue, l'orientation pour que ce soit naturel dans le nouveau contexte, mais tu NE PEUX PAS changer l'apparence visuelle de l'ouvrage (couleurs, motifs, texture). L'ouvrage doit être seul et bien mis en scène.";
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
            $itemName = $options['item_name'] ?? '';
            $modelGender = $options['model_gender'] ?? 'person'; // person, male, female

            $prompt = $this->buildPrompt($projectType, $context, $itemName, $modelGender);

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
