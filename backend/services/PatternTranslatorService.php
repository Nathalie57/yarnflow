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

    private const TARGET_LANGUAGES = [
        'fr' => 'français',
        'en' => 'anglais',
        'de' => 'allemand',
        'nl' => 'néerlandais',
        'es' => 'espagnol',
    ];

    private const TRANSLATION_PROMPT = <<<'PROMPT'
Tu es un expert en traduction de patrons de tricot et crochet vers le {TARGET_LANGUAGE}, quelle que soit la langue source.

RÈGLES IMPORTANTES :
1. Traduis UNIQUEMENT le texte, ne modifie pas la structure ni le formatage (sauts de ligne, tirets, numéros de rangs, astérisques, crochets)
2. Conserve TOUS les chiffres exacts (nombre de mailles, rangs, tailles)
3. Pour les abréviations, utilise ce glossaire multilingue (→ français) :

ABRÉVIATIONS ANGLAISES :
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

ABRÉVIATIONS NORVÉGIENNES/DANOISES (DROPS et similaires) :
r = rang / tour
m = m (maille)
om = ensemble
strik ret = tricotez à l'endroit
strik vrangt = tricotez à l'envers
omg = tour
beg = début
sl = glisser
jf = jeté
ret m = maille endroit
vrang m = maille envers
tag = prendre / monter
luk = rabattre

ABRÉVIATIONS NÉERLANDAISES :
st = m (maille)
r = rang / tour
afw = diminution
toe = augmentation
rech = endroit
aver = envers
oph = maille en l'air
hlv = demi-bride
vas = maille serrée

ABRÉVIATIONS ALLEMANDES :
M = m (maille)
R = rang / tour
re = endroit
li = envers
zun = augmentation
abn = diminution
Ldm = glisser
Umschl = jeté
LM = maille en l'air
fM = maille serrée

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
    public function translateFromUrl(string $url, string $targetLang = 'fr'): array
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

        return $this->translateText($text, 'url', $url, $targetLang);
    }

    /**
     * Traduit un patron depuis un fichier PDF (chemin absolu)
     */
    public function translateFromPdf(string $filePath, string $targetLang = 'fr'): array
    {
        $text = $this->extractTextFromPdf($filePath);

        if (!$text || empty(trim($text))) {
            return ['success' => false, 'error' => 'Impossible d\'extraire le texte de ce PDF. Le fichier est peut-être scanné (image) ou protégé.'];
        }

        return $this->translateText($text, 'pdf', basename($filePath), $targetLang);
    }

    /**
     * Traduit un texte brut fourni directement
     */
    public function translateFromText(string $text, string $targetLang = 'fr'): array
    {
        if (empty(trim($text))) {
            return ['success' => false, 'error' => 'Texte vide.'];
        }

        return $this->translateText($text, 'text', 'texte direct', $targetLang);
    }

    /**
     * Appel Gemini pour traduire
     */
    private function translateText(string $text, string $sourceType, string $sourceName, string $targetLang = 'fr'): array
    {
        // Tronquer si trop long
        if (mb_strlen($text) > self::MAX_CONTENT_LENGTH) {
            $text = mb_substr($text, 0, self::MAX_CONTENT_LENGTH);
            $truncated = true;
        }

        $targetLanguage = self::TARGET_LANGUAGES[$targetLang] ?? 'français';
        $prompt = str_replace('{TARGET_LANGUAGE}', $targetLanguage, self::TRANSLATION_PROMPT) . "\n\n---\n\nTEXTE À TRADUIRE :\n\n" . $text;

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
     * Score un texte selon sa ressemblance à un patron tricot/crochet
     */
    private function scorePatternContent(string $text): float
    {
        if (mb_strlen($text) < 100) return 0.0;

        $lower = mb_strtolower($text);

        $patternKeywords = [
            'rang', 'maille', 'tricoter', 'crocheter', 'augment', 'diminut', 'monter', 'rabattre',
            'row', 'stitch', 'knit', 'purl', 'cast on', 'bind off', 'increase', 'decrease',
            'reihe', 'masche', 'stricken', 'häkeln', 'zunehmen', 'abnehmen',
            'rij', 'steek', 'breien', 'haken', 'meerderen', 'minderen',
            'strikk', 'maske', 'hækling', 'øke', 'minke',
        ];

        $shopKeywords = [
            'commander', 'ajouter au panier', 'add to cart', 'checkout',
            'livraison', 'shipping', 'prix', 'price', '£', '€', '$',
        ];

        $patternScore = 0;
        foreach ($patternKeywords as $kw) {
            $patternScore += substr_count($lower, $kw);
        }

        $shopScore = 0;
        foreach ($shopKeywords as $kw) {
            $shopScore += substr_count($lower, $kw);
        }

        $lengthBonus = min(mb_strlen($text) / 1000, 5.0);

        return max(0.0, ($patternScore * 2) - $shopScore + $lengthBonus);
    }

    /**
     * Nettoie le HTML pour extraire le texte lisible
     */
    private function cleanHtmlToText(string $html): string
    {
        // Supprimer scripts, styles et blocs de navigation
        $html = preg_replace('/<(script|style|nav|header|footer|aside)[^>]*>.*?<\/\1>/si', '', $html);

        // Collecter les blocs de contenu candidats (main, article, section, div substantiels)
        $candidates = [];

        // Priorité 1 : main, article
        foreach (['main', 'article'] as $tag) {
            if (preg_match_all('/<' . $tag . '[^>]*>(.*?)<\/' . $tag . '>/si', $html, $m)) {
                foreach ($m[1] as $block) {
                    $text = $this->htmlBlockToText($block);
                    if (mb_strlen($text) > 300) {
                        $candidates[] = ['text' => $text, 'priority' => 2];
                    }
                }
            }
        }

        // Priorité 2 : sections et divs avec classes/ids liés aux patrons
        if (preg_match_all('/<(?:section|div)[^>]*(?:class|id)="[^"]*(?:pattern|recipe|instructions?|content|description)[^"]*"[^>]*>(.*?)<\/(?:section|div)>/si', $html, $m)) {
            foreach ($m[1] as $block) {
                $text = $this->htmlBlockToText($block);
                if (mb_strlen($text) > 300) {
                    $candidates[] = ['text' => $text, 'priority' => 3];
                }
            }
        }

        // Priorité 3 : page entière comme fallback
        $fullText = $this->htmlBlockToText($html);
        $candidates[] = ['text' => $fullText, 'priority' => 1];

        // Scorer chaque candidat
        $scored = [];
        foreach ($candidates as $i => $c) {
            $score = $this->scorePatternContent($c['text']) * $c['priority'];
            $scored[] = ['text' => $c['text'], 'score' => $score, 'index' => $i, 'priority' => $c['priority']];
        }

        // Trouver le meilleur score de référence
        $maxScore = max(array_column($scored, 'score'));

        if ($maxScore <= 0) {
            return $fullText;
        }

        // Si le meilleur est la page entière (priority=1), la retourner telle quelle
        $best = array_reduce($scored, fn($carry, $c) => (!$carry || $c['score'] > $carry['score']) ? $c : $carry);
        if ($best['priority'] === 1) {
            return $best['text'];
        }

        // Sinon, combiner tous les blocs qui ont un score > 30% du max (ordre document préservé)
        $threshold = $maxScore * 0.3;
        $combined = [];
        foreach ($scored as $c) {
            if ($c['score'] >= $threshold && $c['priority'] > 1) {
                $combined[] = ['text' => $c['text'], 'index' => $c['index']];
            }
        }
        usort($combined, fn($a, $b) => $a['index'] - $b['index']);

        $result = implode("\n\n", array_unique(array_column($combined, 'text')));
        return $result ?: $fullText;
    }

    /**
     * Convertit un bloc HTML en texte propre
     */
    private function htmlBlockToText(string $html): string
    {
        $html = preg_replace('/<(br|p|div|li|h[1-6]|tr)[^>]*>/i', "\n", $html);
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
    }
}
