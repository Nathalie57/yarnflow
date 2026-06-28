<?php
/**
 * @file PatternTranslatorService.php
 * @brief Service de traduction de patrons tricot/crochet via Gemini AI
 */

declare(strict_types=1);

namespace App\Services;

use GuzzleHttp\Client;
use App\Services\WebFetchService;

class PatternTranslatorService
{
    private string $geminiApiKey;
    private Client $httpClient;

    private const GEMINI_MODEL = 'gemini-2.5-flash';
    private const TIMEOUT_SECONDS = 120;
    private const MAX_CONTENT_LENGTH = 50000;

    private const TRANSLATION_PROMPT = <<<'PROMPT'
Tu es un expert en traduction de patrons de tricot et crochet de l'anglais vers le français.

RÈGLES IMPORTANTES :
1. Traduis UNIQUEMENT le texte, ne modifie pas la structure ni le formatage (sauts de ligne, tirets, numéros de rangs, astérisques, crochets)
2. Conserve TOUS les chiffres exacts (nombre de mailles, rangs, tailles)
3. Pour les abréviations, utilise ce glossaire (anglais → français) :

ABRÉVIATIONS COURANTES :
k = m end (maille endroit)
p = m env (maille envers)
k2tog = 2 m ens end (2 mailles ensemble endroit)
p2tog = 2 m ens env (2 mailles ensemble envers)
ssk = gls (glisser, glisser, tricoter ensemble)
yo = jeté
sl = glisser
pm = pm (placer marqueur)
sm = dm (déplacer marqueur)
CO = monter
BO / cast off = rabattre
st(s) = m (maille/mailles)
rep = rép (répéter)
RS = end (endroit)
WS = env (envers)
BOR = début du rang
inc = aug (augmentation)
dec = dim (diminution)
M1 = M1 (monter 1 maille)
M1L = M1G (monter 1 maille à gauche)
M1R = M1D (monter 1 maille à droite)
kfb = m dans m (tricoter dans le devant et le derrière)
pfb = m env dans m (idem envers)
w&t = env&tou (envelopper et tourner)
tbl = sur le brin arrière
wyif = fil devant
wyib = fil derrière
sc = ms (maille serrée)
dc = mb (maille bride)
hdc = demi-bride
tr = bride double
sl st = mc (maille coulée)
ch = ml (maille en l'air)
sp = esp (espace)
ch-sp = esp-ml (espace de maille en l'air)
rnd(s) = tour(s)
row(s) = rang(s)
patt = motif
cont = cont (continuer)
rem = rest (restant/e/s)
approx = env (environ)
beg = deb (début)
end = fin

4. Si une abréviation est définie dans le patron lui-même (ex: "MB = Make Bobble"), conserve-la ET traduis sa définition
5. Ajoute une note en bas si tu as fait des choix de traduction non standards
6. Pour les termes ambigus, garde le terme anglais entre parenthèses

Retourne UNIQUEMENT le texte traduit, sans commentaires ni explications. Commence directement par le contenu traduit.
PROMPT;

    public function __construct()
    {
        $this->geminiApiKey = $_ENV['GEMINI_API_KEY'] ?? '';
        $this->httpClient = new Client([
            'timeout' => self::TIMEOUT_SECONDS,
            'verify' => !($_ENV['APP_ENV'] === 'local' || $_ENV['APP_DEBUG'] === 'true'),
        ]);
    }

    /**
     * Traduit un patron depuis une URL
     */
    public function translateFromUrl(string $url): array
    {
        $fetched = WebFetchService::fetchHTML($url);

        if (!$fetched['success'] || empty($fetched['html'])) {
            return ['success' => false, 'error' => 'Impossible de récupérer le contenu de cette URL. Le site bloque peut-être les requêtes automatiques.'];
        }

        $content = $fetched['html'];

        // Nettoyer le HTML pour ne garder que le texte
        $text = $this->cleanHtmlToText($content);

        if (empty(trim($text))) {
            return ['success' => false, 'error' => 'Aucun texte exploitable trouvé sur cette page.'];
        }

        return $this->translateText($text, 'url', $url);
    }

    /**
     * Traduit un patron depuis un fichier PDF (chemin absolu)
     */
    public function translateFromPdf(string $filePath): array
    {
        // Utiliser pdftotext si disponible, sinon Gemini Files API
        $text = $this->extractTextFromPdf($filePath);

        if (!$text || empty(trim($text))) {
            return ['success' => false, 'error' => 'Impossible d\'extraire le texte de ce PDF. Le fichier est peut-être scanné (image) ou protégé.'];
        }

        return $this->translateText($text, 'pdf', basename($filePath));
    }

    /**
     * Traduit un texte brut fourni directement
     */
    public function translateFromText(string $text): array
    {
        if (empty(trim($text))) {
            return ['success' => false, 'error' => 'Texte vide.'];
        }

        return $this->translateText($text, 'text', 'texte direct');
    }

    /**
     * Appel Gemini pour traduire
     */
    private function translateText(string $text, string $sourceType, string $sourceName): array
    {
        // Tronquer si trop long
        if (mb_strlen($text) > self::MAX_CONTENT_LENGTH) {
            $text = mb_substr($text, 0, self::MAX_CONTENT_LENGTH);
            $truncated = true;
        }

        $prompt = self::TRANSLATION_PROMPT . "\n\n---\n\nTEXTE À TRADUIRE :\n\n" . $text;

        try {
            $response = $this->httpClient->post(
                'https://generativelanguage.googleapis.com/v1beta/models/' . self::GEMINI_MODEL . ':generateContent?key=' . $this->geminiApiKey,
                [
                    'headers' => ['Content-Type' => 'application/json'],
                    'json' => [
                        'contents' => [
                            ['role' => 'user', 'parts' => [['text' => $prompt]]]
                        ],
                        'generationConfig' => [
                            'temperature' => 0.2,
                            'maxOutputTokens' => 8192,
                        ]
                    ]
                ]
            );

            $data = json_decode($response->getBody()->getContents(), true);
            $translated = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$translated) {
                return ['success' => false, 'error' => 'La traduction a échoué. Réessayez.'];
            }

            return [
                'success' => true,
                'translation' => $translated,
                'original_length' => mb_strlen($text),
                'truncated' => $truncated ?? false,
                'source_type' => $sourceType,
                'source_name' => $sourceName,
            ];

        } catch (\Exception $e) {
            error_log('[PatternTranslator] Erreur Gemini: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Erreur lors de la traduction. Réessayez dans quelques instants.'];
        }
    }

    /**
     * Extrait le texte d'un PDF via pdftotext
     */
    private function extractTextFromPdf(string $filePath): ?string
    {
        $escapedPath = escapeshellarg($filePath);
        $output = shell_exec("pdftotext {$escapedPath} - 2>/dev/null");

        if ($output && mb_strlen(trim($output)) > 50) {
            return $output;
        }

        // Fallback : lire les premiers octets pour vérifier que c'est bien un PDF lisible
        return null;
    }

    /**
     * Nettoie le HTML pour extraire le texte lisible
     */
    private function cleanHtmlToText(string $html): string
    {
        // Supprimer les scripts, styles, nav, header, footer
        $html = preg_replace('/<(script|style|nav|header|footer|aside)[^>]*>.*?<\/\1>/si', '', $html);

        // Convertir les balises de structure en sauts de ligne
        $html = preg_replace('/<(br|p|div|li|h[1-6]|tr)[^>]*>/i', "\n", $html);

        // Supprimer toutes les balises restantes
        $text = strip_tags($html);

        // Décoder les entités HTML
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Nettoyer les espaces multiples
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);

        return trim($text);
    }
}
