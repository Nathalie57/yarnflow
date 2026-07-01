<?php

namespace App\Controllers;

use App\Middleware\AuthMiddleware;

class YarnSubstitutionController
{
    private const GEMINI_MODEL = 'gemini-2.5-flash';
    private const PAID_PLANS   = ['plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird'];

    private const PROMPT = <<<'PROMPT'
Tu es une experte en laines de tricot et crochet, spécialisée dans les marques européennes (Drops, Phildar, Bergère de France, Rico, Lang, Paintbox, Katia, DMC, Fonty...).

L'utilisatrice cherche des substituts pour la laine suivante : "{YARN_NAME}".

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication, sans texte avant ou après.

Format attendu :
{
  "original": {
    "brand": "nom de la marque",
    "name": "nom du fil",
    "weight_category": "lace|fingering|sport|dk|worsted|aran|bulky|super_bulky",
    "yardage_per_100g": 200,
    "composition": "100% Mérinos"
  },
  "substitutes": [
    {
      "brand": "nom de la marque",
      "name": "nom du fil",
      "weight_category": "dk",
      "yardage_per_100g": 190,
      "composition": "100% Mérinos",
      "why": "Raison courte (1-2 phrases) pourquoi ce fil est un bon substitut",
      "tips": "Conseil pratique si nécessaire, sinon null"
    }
  ]
}

Règles :
- 4 substituts maximum
- Privilégie les marques facilement disponibles en France
- Si tu ne connais pas le fil, réponds avec "original": null et "substitutes": []
- yardage_per_100g est un entier approximatif
PROMPT;

    public function suggest(): void
    {
        $userData = AuthMiddleware::authenticate();
        $userId   = (int)$userData['user_id'];
        $plan     = $userData['subscription_type'] ?? 'free';

        if (!in_array($plan, self::PAID_PLANS)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Cette fonctionnalité est réservée aux abonnés PLUS et PRO.', 'upgrade_required' => true]);
            return;
        }

        $body     = json_decode(file_get_contents('php://input'), true);
        $yarnName = trim($body['yarn_name'] ?? '');

        if (empty($yarnName) || mb_strlen($yarnName) > 200) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Nom de laine invalide.']);
            return;
        }

        $prompt = str_replace('{YARN_NAME}', $yarnName, self::PROMPT);

        $result = $this->callGemini($prompt);
        if (!$result['success']) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $result['error']]);
            return;
        }

        $data = json_decode($result['text'], true);
        if (!is_array($data)) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Réponse IA invalide, réessayez.']);
            return;
        }

        echo json_encode(['success' => true, 'original' => $data['original'] ?? null, 'substitutes' => $data['substitutes'] ?? []]);
    }

    private function callGemini(string $prompt): array
    {
        $apiKey = $_ENV['GEMINI_API_KEY'] ?? '';
        $url    = 'https://generativelanguage.googleapis.com/v1beta/models/' . self::GEMINI_MODEL . ':generateContent?key=' . $apiKey;

        $payload = json_encode([
            'contents'           => [['role' => 'user', 'parts' => [['text' => $prompt]]]],
            'generationConfig'   => ['temperature' => 0.2, 'topK' => 20, 'topP' => 0.9, 'maxOutputTokens' => 2048],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response || $httpCode !== 200) {
            return ['success' => false, 'error' => 'Erreur API Gemini (' . $httpCode . ')'];
        }

        $decoded = json_decode($response, true);
        $text    = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';

        if (empty($text)) {
            return ['success' => false, 'error' => 'Réponse vide de l\'IA.'];
        }

        $text = preg_replace('/^```(?:json)?\s*/m', '', $text);
        $text = preg_replace('/\s*```$/m', '', $text);

        return ['success' => true, 'text' => trim($text)];
    }
}
