<?php
/**
 * @file AIPatternExtractorService.php
 * @brief Service d'extraction intelligente de patrons via Gemini AI
 * @author Nathalie + AI Assistants
 * @created 2026-01-07
 * @modified 2026-04-22 by [AI:Claude] - Files API pour PDF (compatible prod)
 *
 * @history
 *   2026-01-07 [AI:Claude] Création service extraction patrons PDF/URL avec Gemini
 *   2026-04-22 [AI:Claude] Remplacement base64 inline par Gemini Files API
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
    private const TIMEOUT_SECONDS = 180;

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
      "target": nombre total de rangs ou cm pour cette section (int ou null),
      "description": "TOUTES les instructions complètes de cette section, rang par rang ou étape par étape (string)"
    }
  ],

  "pattern_notes": "notes importantes du patron (conseils généraux, modifications possibles, etc.)"
}

RÈGLES STRICTES :
- Si une information est absente/incertaine → null
- craft_type : détecter selon vocabulaire (ms/ml/mc/bride = crochet, m/end/env/jersey = tricot)
- category : utiliser les catégories YarnFlow existantes uniquement
- sections : découper logiquement (Corps, Manches, Col, Assemblage, Finitions...)
- sections.description : INCLURE TOUTES LES INSTRUCTIONS détaillées de cette section (tous les rangs, toutes les étapes)
- Conserver les abréviations du patron (ms, ml, mc, m, end, env, etc.)
- Numéroter les rangs/tours si présents (ex: "Rang 1: ..., Rang 2: ..., etc.")
- Privilégier "rangs" pour crochet, "cm" pour tricot (sauf si explicite dans le patron)
- gauge : toujours ramener à 10cm (si échantillon donné pour 5cm, multiplier par 2)
- yarn.weight : utiliser uniquement les catégories standard (pas de "moyen", "épais" français)
- hook_or_needles.size : extraire uniquement le nombre et mm (ex: "4.5" depuis "crochet 4.5mm")

Retourne UNIQUEMENT le JSON, sans texte avant/après, sans markdown.
PROMPT;

    public function __construct()
    {
        $this->geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? '';
        $this->geminiModel = 'gemini-2.5-flash';

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
     * Utilise la Gemini Files API : upload séparé → analyse → suppression
     */
    public function extractFromPDF(string $filePath): array
    {
        $startTime = microtime(true);

        if (!file_exists($filePath)) {
            return $this->errorResponse('Fichier PDF introuvable', 0);
        }

        $fileSize = filesize($filePath);
        if ($fileSize > self::MAX_FILE_SIZE_BYTES) {
            return $this->errorResponse('Fichier trop volumineux (max 10 MB)', 0);
        }

        $fileUri = null;
        try {
            error_log("[AIPatternExtractor] Upload PDF vers Gemini Files API ({$fileSize} bytes)...");
            $fileUri = $this->uploadFileToGemini($filePath);
            error_log("[AIPatternExtractor] Upload OK: {$fileUri}");

            $result = $this->callGeminiWithFileUri($fileUri);

        } catch (GuzzleException $e) {
            error_log('[AIPatternExtractor] Erreur upload/analyse: ' . $e->getMessage());
            return $this->errorResponse('Erreur lors de l\'analyse: ' . $e->getMessage(), 0);
        } finally {
            if ($fileUri) {
                $this->deleteGeminiFile($fileUri);
            }
        }

        $processingTime = round((microtime(true) - $startTime) * 1000);
        $result['processing_time_ms'] = $processingTime;
        $result['file_size_bytes'] = $fileSize;

        return $result;
    }

    /**
     * Extrait les informations d'un patron depuis une URL
     */
    public function extractFromURL(string $url): array
    {
        $startTime = microtime(true);

        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return $this->errorResponse('URL invalide', 0);
        }

        try {
            $response = $this->httpClient->get($url, [
                'headers' => [
                    'User-Agent' => 'YarnFlow Pattern Importer/1.0'
                ]
            ]);

            $html = (string) $response->getBody();
            $text = $this->extractTextFromHTML($html);

            if (empty($text) || strlen($text) < 100) {
                return $this->errorResponse('Impossible d\'extraire le contenu de cette page', 0);
            }

            $result = $this->callGeminiWithText($text);

            $processingTime = round((microtime(true) - $startTime) * 1000);
            $result['processing_time_ms'] = $processingTime;

            return $result;

        } catch (GuzzleException $e) {
            return $this->errorResponse('Erreur lors de l\'accès à l\'URL: ' . $e->getMessage(), 0);
        }
    }

    /**
     * Upload un PDF vers Gemini Files API
     * Retourne l'URI du fichier uploadé (ex: "https://generativelanguage.googleapis.com/v1beta/files/abc123")
     */
    private function uploadFileToGemini(string $filePath): string
    {
        $boundary = 'gem_upload_' . uniqid();
        $fileContent = file_get_contents($filePath);
        $metadata = json_encode(['file' => ['display_name' => basename($filePath)]]);

        $body = "--{$boundary}\r\n"
            . "Content-Type: application/json\r\n\r\n"
            . $metadata . "\r\n"
            . "--{$boundary}\r\n"
            . "Content-Type: application/pdf\r\n\r\n"
            . $fileContent . "\r\n"
            . "--{$boundary}--";

        $uploadEndpoint = "https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=multipart&key={$this->geminiApiKey}";

        $response = $this->httpClient->post($uploadEndpoint, [
            'body' => $body,
            'headers' => [
                'Content-Type' => "multipart/related; boundary={$boundary}",
                'Content-Length' => strlen($body)
            ]
        ]);

        $result = json_decode((string) $response->getBody(), true);

        if (!isset($result['file']['uri'])) {
            throw new \RuntimeException('Upload Gemini échoué: ' . json_encode($result));
        }

        return $result['file']['uri'];
    }

    /**
     * Supprime un fichier uploadé sur Gemini Files API
     */
    private function deleteGeminiFile(string $fileUri): void
    {
        // fileUri = "https://generativelanguage.googleapis.com/v1beta/files/abc123"
        // On extrait "files/abc123" pour construire l'endpoint DELETE
        if (!preg_match('/v1beta\/(files\/[^?#]+)/', $fileUri, $matches)) {
            return;
        }

        $deleteEndpoint = "https://generativelanguage.googleapis.com/v1beta/{$matches[1]}?key={$this->geminiApiKey}";
        try {
            $this->httpClient->delete($deleteEndpoint);
            error_log("[AIPatternExtractor] Fichier Gemini supprimé: {$matches[1]}");
        } catch (\Exception $e) {
            error_log('[AIPatternExtractor] Impossible de supprimer le fichier Gemini: ' . $e->getMessage());
        }
    }

    /**
     * Appelle Gemini avec un fichier uploadé via Files API
     */
    private function callGeminiWithFileUri(string $fileUri): array
    {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->geminiModel}:generateContent?key={$this->geminiApiKey}";

        $payload = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => self::EXTRACTION_PROMPT],
                        [
                            'file_data' => [
                                'mime_type' => 'application/pdf',
                                'file_uri' => $fileUri
                            ]
                        ]
                    ]
                ]
            ],
            'generationConfig' => [
                'temperature' => 0.1,
                'topK' => 1,
                'topP' => 0.8,
                'maxOutputTokens' => 8192
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
            error_log('[AIPatternExtractor] Erreur Gemini generateContent: ' . $e->getMessage());
            return $this->errorResponse('Erreur API Gemini: ' . $e->getMessage(), 0);
        }
    }

    /**
     * Appelle Gemini avec du texte simple (pour URL)
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
                'maxOutputTokens' => 8192
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

        $jsonText = trim($rawText);
        $jsonText = preg_replace('/^```json\s*/i', '', $jsonText);
        $jsonText = preg_replace('/\s*```$/', '', $jsonText);

        $data = json_decode($jsonText, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[AIPatternExtractor] JSON invalide: ' . $jsonText);
            return $this->errorResponse('Impossible de parser la réponse IA (JSON invalide)', 0);
        }

        if (!isset($data['title']) && !isset($data['sections'])) {
            return $this->errorResponse('Aucune information exploitable détectée dans le patron', 0, 'partial');
        }

        return [
            'success' => true,
            'data' => $data,
            'error' => null,
            'ai_status' => $this->determineStatus($data),
            'raw_response' => $response
        ];
    }

    private function extractTextFromHTML(string $html): string
    {
        $html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
        $html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

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

        foreach ($optionalFields as $field) {
            if (!empty($data[$field])) {
                return 'success';
            }
        }

        return 'partial';
    }

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
