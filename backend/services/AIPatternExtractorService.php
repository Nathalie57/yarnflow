<?php
/**
 * @file AIPatternExtractorService.php
 * @brief Service d'extraction intelligente de patrons via Gemini AI
 * @author Nathalie + AI Assistants
 * @created 2026-01-07
 * @modified 2026-01-07 by [AI:Claude] - Création Smart Project
 *
 * @history
 *   2026-01-07 [AI:Claude] Création service extraction patrons PDF/URL avec Gemini
 */

declare(strict_types=1);

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class AIPatternExtractorService
{
    private string $geminiApiKey;
    private string $geminiModel;
    private Client $httpClient;
    private const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
    private const TIMEOUT_SECONDS = 30;

    /**
     * Prompt système pour l'extraction de patrons
     */
    private const EXTRACTION_PROMPT = <<<'PROMPT'
Tu es un assistant expert en analyse de patrons de tricot et crochet.

Analyse ce patron et extrais les informations suivantes au format JSON STRICT :

{
  "title": "nom du projet (string)",
  "craft_type": "tricot" | "crochet" | "autre",
  "category": "bonnet" | "écharpe" | "pull" | "amigurumi" | "couverture" | "sac" | "vêtements" | "accessoires bébé" | "vêtements bébé" | "jouets/peluches" | "maison/déco" | "autre" | null,
  "description": "résumé du projet en 1-2 phrases (string ou null)",

  "yarn": {
    "brand": "marque de la laine (string ou null)",
    "color": "couleur principale (string ou null)",
    "weight": "épaisseur (Lace|Fingering|Sport|DK|Worsted|Aran|Bulky|Super Bulky ou null)",
    "composition": "composition (ex: 100% coton, string ou null)"
  },

  "hook_or_needles": {
    "size": "taille crochet/aiguilles (ex: 4.5, 5mm, string ou null)"
  },

  "gauge": {
    "stitches": nombre de mailles sur 10cm (int ou null),
    "rows": nombre de rangs sur 10cm (int ou null),
    "size_cm": 10
  },

  "sections": [
    {
      "name": "nom de la section (ex: Corps, Manches, Assemblage)",
      "unit": "rangs" | "cm",
      "target": nombre (int ou null),
      "description": "instructions brèves (string ou null)"
    }
  ],

  "pattern_notes": "notes importantes du patron (string ou null)"
}

RÈGLES STRICTES :
- Si une information est absente/incertaine → null
- craft_type : détecter selon vocabulaire (ms/ml/mc/bride = crochet, m/end/env/jersey = tricot)
- category : utiliser les catégories YarnFlow existantes uniquement
- sections : découper logiquement (Corps, Manches, Col, Assemblage, Finitions...)
- Privilégier "rangs" pour crochet, "cm" pour tricot (sauf si explicite dans le patron)
- gauge : toujours ramener à 10cm (si échantillon donné pour 5cm, multiplier par 2)
- yarn.weight : utiliser uniquement les catégories standard (pas de "moyen", "épais" français)
- hook_or_needles.size : extraire uniquement le nombre et mm (ex: "4.5" depuis "crochet 4.5mm")

Retourne UNIQUEMENT le JSON, sans texte avant/après, sans markdown.
PROMPT;

    public function __construct()
    {
        $this->geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? '';
        $this->geminiModel = 'gemini-2.0-flash-exp'; // Modèle supportant PDF natif

        if (empty($this->geminiApiKey)) {
            throw new \RuntimeException('GEMINI_API_KEY non configurée');
        }

        $this->httpClient = new Client([
            'timeout' => self::TIMEOUT_SECONDS,
            'verify' => false // Pour environnement dev
        ]);
    }

    /**
     * Extrait les informations d'un patron depuis un fichier PDF
     *
     * @param string $filePath Chemin absolu vers le PDF uploadé
     * @return array {success: bool, data: array|null, error: string|null}
     */
    public function extractFromPDF(string $filePath): array
    {
        $startTime = microtime(true);

        // Vérifications
        if (!file_exists($filePath)) {
            return $this->errorResponse('Fichier PDF introuvable', 0);
        }

        $fileSize = filesize($filePath);
        if ($fileSize > self::MAX_FILE_SIZE_BYTES) {
            return $this->errorResponse('Fichier trop volumineux (max 10 MB)', 0);
        }

        // Encoder le PDF en base64 pour Gemini
        $pdfContent = file_get_contents($filePath);
        $base64Pdf = base64_encode($pdfContent);

        // Appeler Gemini avec le PDF
        $result = $this->callGeminiWithFile($base64Pdf, 'application/pdf');

        $processingTime = round((microtime(true) - $startTime) * 1000); // ms
        $result['processing_time_ms'] = $processingTime;
        $result['file_size_bytes'] = $fileSize;

        return $result;
    }

    /**
     * Extrait les informations d'un patron depuis une URL
     *
     * @param string $url URL du patron (blog, site web)
     * @return array {success: bool, data: array|null, error: string|null}
     */
    public function extractFromURL(string $url): array
    {
        $startTime = microtime(true);

        // Valider l'URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return $this->errorResponse('URL invalide', 0);
        }

        // Scraper le contenu de la page
        try {
            $response = $this->httpClient->get($url, [
                'headers' => [
                    'User-Agent' => 'YarnFlow Pattern Importer/1.0'
                ]
            ]);

            $html = (string) $response->getBody();

            // Extraire le texte principal (simple, sans lib externe)
            $text = $this->extractTextFromHTML($html);

            if (empty($text) || strlen($text) < 100) {
                return $this->errorResponse('Impossible d\'extraire le contenu de cette page', 0);
            }

            // Appeler Gemini avec le texte
            $result = $this->callGeminiWithText($text);

            $processingTime = round((microtime(true) - $startTime) * 1000);
            $result['processing_time_ms'] = $processingTime;

            return $result;

        } catch (GuzzleException $e) {
            return $this->errorResponse('Erreur lors de l\'accès à l\'URL: ' . $e->getMessage(), 0);
        }
    }

    /**
     * Appelle Gemini avec un fichier PDF encodé en base64
     */
    private function callGeminiWithFile(string $base64Content, string $mimeType): array
    {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => self::EXTRACTION_PROMPT],
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $base64Content
                            ]
                        ]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1, // Faible pour extraction factuelle
                'topK' => 1,
                'topP' => 0.8,
                'maxOutputTokens' => 2048
            ]
        ];

        try {
            $response = $this->httpClient->post($endpoint, [
                'json' => $payload,
                'headers' => ['Content-Type' => 'application/json']
            ]);

            $body = json_decode((string) $response->getBody(), true);
            return $this->parseGeminiResponse($body);

        } catch (GuzzleException $e) {
            error_log('[AIPatternExtractor] Erreur Gemini API: ' . $e->getMessage());
            return $this->errorResponse('Erreur API Gemini: ' . $e->getMessage(), 0);
        }
    }

    /**
     * Appelle Gemini avec du texte simple
     */
    private function callGeminiWithText(string $text): array
    {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => self::EXTRACTION_PROMPT . "\n\nCONTENU DU PATRON:\n\n" . $text]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1,
                'topK' => 1,
                'topP' => 0.8,
                'maxOutputTokens' => 2048
            ]
        ];

        try {
            $response = $this->httpClient->post($endpoint, [
                'json' => $payload,
                'headers' => ['Content-Type' => 'application/json']
            ]);

            $body = json_decode((string) $response->getBody(), true);
            return $this->parseGeminiResponse($body);

        } catch (GuzzleException $e) {
            error_log('[AIPatternExtractor] Erreur Gemini API: ' . $e->getMessage());
            return $this->errorResponse('Erreur API Gemini: ' . $e->getMessage(), 0);
        }
    }

    /**
     * Parse la réponse de Gemini et extrait le JSON
     */
    private function parseGeminiResponse(array $response): array
    {
        if (!isset($response['candidates'][0]['content']['parts'][0]['text'])) {
            error_log('[AIPatternExtractor] Réponse Gemini invalide: ' . json_encode($response));
            return $this->errorResponse('Réponse API Gemini invalide', 0);
        }

        $rawText = $response['candidates'][0]['content']['parts'][0]['text'];

        // Nettoyer le texte (retirer markdown, etc.)
        $jsonText = trim($rawText);
        $jsonText = preg_replace('/^```json\s*/i', '', $jsonText);
        $jsonText = preg_replace('/\s*```$/', '', $jsonText);

        // Parser le JSON
        $data = json_decode($jsonText, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[AIPatternExtractor] JSON invalide: ' . $jsonText);
            return $this->errorResponse('Impossible de parser la réponse IA (JSON invalide)', 0);
        }

        // Valider la structure minimale
        if (!isset($data['title']) && !isset($data['sections'])) {
            return $this->errorResponse('Aucune information exploitable détectée dans le patron', 0, 'partial');
        }

        return [
            'success' => true,
            'data' => $data,
            'error' => null,
            'ai_status' => $this->determineStatus($data),
            'raw_response' => $response // Pour debug
        ];
    }

    /**
     * Extrait le texte d'un HTML (simple, sans lib)
     */
    private function extractTextFromHTML(string $html): string
    {
        // Retirer scripts et styles
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);

        // Convertir HTML en texte
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Nettoyer les espaces
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        return $text;
    }

    /**
     * Détermine le statut de l'extraction (success/partial/failed)
     */
    private function determineStatus(array $data): string
    {
        $requiredFields = ['title', 'craft_type', 'sections'];
        $optionalFields = ['yarn', 'gauge', 'hook_or_needles'];

        $hasRequired = true;
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $hasRequired = false;
                break;
            }
        }

        if (!$hasRequired) {
            return 'partial';
        }

        $hasOptional = false;
        foreach ($optionalFields as $field) {
            if (!empty($data[$field])) {
                $hasOptional = true;
                break;
            }
        }

        return $hasOptional ? 'success' : 'partial';
    }

    /**
     * Retourne une réponse d'erreur standardisée
     */
    private function errorResponse(string $message, int $processingTime, string $status = 'failed'): array
    {
        return [
            'success' => false,
            'data' => null,
            'error' => $message,
            'ai_status' => $status,
            'processing_time_ms' => $processingTime
        ];
    }
}
