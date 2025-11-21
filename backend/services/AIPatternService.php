<?php
/**
 * @file AIPatternService.php
 * @brief Service de génération de patrons via IA (Claude ou OpenAI)
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale avec prompt engineering
 */

declare(strict_types=1);

namespace App\Services;

use App\Models\PatternTemplate;
use App\Models\PatternOption;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

/**
 * [AI:Claude] Service de génération de patrons de crochet via IA
 * Utilise des patrons de référence pour améliorer la qualité des générations
 */
class AIPatternService
{
    private string $provider;
    private string $apiKey;
    private Client $httpClient;
    private PatternTemplate $patternTemplateModel;
    private PatternOption $patternOptionModel;

    public function __construct()
    {
        $this->provider = $_ENV['AI_PROVIDER'] ?? 'claude';
        $this->apiKey = $this->provider === 'claude'
            ? $_ENV['ANTHROPIC_API_KEY'] ?? ''
            : $_ENV['OPENAI_API_KEY'] ?? '';

        $this->httpClient = new Client([
            'timeout' => 60,
            'verify' => true
        ]);

        $this->patternTemplateModel = new PatternTemplate();
        $this->patternOptionModel = new PatternOption();
    }

    /**
     * [AI:Claude] Générer un patron de crochet complet
     *
     * @param array $params Paramètres de génération (type, level, size, etc.)
     * @return array Résultat contenant le patron généré et métadonnées
     * @throws \Exception Si la génération échoue
     */
    public function generatePattern(array $params): array
    {
        $type = $params['type'];
        $level = $params['level'];
        $size = $params['size'] ?? null;

        $templates = $this->patternTemplateModel->findBestMatches([
            'type' => $type,
            'level' => $level,
            'size' => $size
        ], 3);

        $prompt = $this->buildPrompt($params, $templates);

        if ($this->provider === 'claude')
            return $this->generateWithClaude($prompt);
        else
            return $this->generateWithOpenAI($prompt);
    }

    /**
     * [AI:Claude] Construire le prompt pour l'IA avec exemples de patrons
     *
     * @param array $params Paramètres demandés par l'utilisateur
     * @param array $templates Patrons de référence à inclure
     * @return string Prompt complet
     */
    private function buildPrompt(array $params, array $templates): string
    {
        $type = $params['type'];
        $level = $params['level'];
        $size = $params['size'] ?? 'adulte';

        $levelText = match($level) {
            LEVEL_BEGINNER => 'débutant',
            LEVEL_INTERMEDIATE => 'intermédiaire',
            LEVEL_ADVANCED => 'avancé',
            default => 'débutant'
        };

        $typeText = match($type) {
            TYPE_HAT => 'bonnet',
            TYPE_SCARF => 'écharpe',
            TYPE_AMIGURUMI => 'amigurumi',
            TYPE_BAG => 'sac',
            TYPE_GARMENT => 'vêtement',
            default => $type
        };

        $prompt = "Tu es un expert en crochet avec 20 ans d'expérience dans la création de patrons.\n\n";
        $prompt .= "TÂCHE : Génère un patron de crochet complet et réaliste pour un {$typeText}, ";
        $prompt .= "niveau {$levelText}, taille {$size}.\n\n";

        $prompt .= "STRUCTURE REQUISE DU PATRON :\n";
        $prompt .= "1. Titre accrocheur du patron\n";
        $prompt .= "2. Niveau de difficulté\n";
        $prompt .= "3. Matériel nécessaire (fil, crochet, accessoires)\n";
        $prompt .= "4. Abréviations utilisées (ml = maille en l'air, mc = maille coulée, etc.)\n";
        $prompt .= "5. Instructions étape par étape, tour par tour\n";
        $prompt .= "6. Finitions et assemblage\n";
        $prompt .= "7. Conseils et astuces\n\n";

        if (!empty($templates)) {
            $prompt .= "EXEMPLES DE PATRONS DE RÉFÉRENCE (respecte leur structure et style) :\n\n";

            foreach ($templates as $index => $template) {
                $templateContent = json_decode($template['content'], true);

                $prompt .= "--- Exemple ".($index + 1)." : {$template['name']} ---\n";
                $prompt .= "Type : {$template['type']}\n";
                $prompt .= "Niveau : {$template['level']}\n";

                if (is_array($templateContent)) {
                    if (isset($templateContent['instructions']))
                        $prompt .= "Instructions :\n".substr($templateContent['instructions'], 0, 500)."...\n";

                    if (isset($templateContent['abbreviations']))
                        $prompt .= "Abréviations : ".implode(', ', array_keys($templateContent['abbreviations']))."\n";
                }

                $this->patternTemplateModel->incrementUsageCount((int)$template['id']);
                $prompt .= "\n";
            }
        }

        $prompt .= "\nFORMAT DE SORTIE : Retourne un JSON avec cette structure exacte :\n";
        $prompt .= "{\n";
        $prompt .= '  "title": "Titre du patron",'."\n";
        $prompt .= '  "level": "'.$level.'",'."\n";
        $prompt .= '  "yarn_weight": "DK / Light Worsted",'."\n";
        $prompt .= '  "hook_size": "3.5mm",'."\n";
        $prompt .= '  "estimated_time": "4-6 heures",'."\n";
        $prompt .= '  "materials": ["fil X", "crochet Y", "aiguille à laine"],'."\n";
        $prompt .= '  "abbreviations": {"ml": "maille en l\'air", "mc": "maille coulée"},'."\n";
        $prompt .= '  "instructions": "Patron complet en markdown avec tours numérotés",'."\n";
        $prompt .= '  "tips": "Conseils et astuces"'."\n";
        $prompt .= "}\n\n";

        $prompt .= "IMPORTANT :\n";
        $prompt .= "- Utilise les abréviations françaises standard du crochet\n";
        $prompt .= "- Numérote chaque tour clairement\n";
        $prompt .= "- Donne des instructions précises et testables\n";
        $prompt .= "- Inclus le nombre total de mailles à chaque tour\n";
        $prompt .= "- Sois réaliste sur les dimensions et le temps\n";
        $prompt .= "- Inspire-toi des exemples fournis pour la structure\n\n";

        // [AI:Claude] Ajouter les options de personnalisation si présentes
        if (isset($params['custom_options']) && is_array($params['custom_options'])) {
            $optionsPrompt = $this->patternOptionModel->buildPromptFragment($params['custom_options']);
            if (!empty($optionsPrompt)) {
                $prompt .= $optionsPrompt . "\n\n";
            }
        }

        // [AI:Claude] Ajouter une demande spécifique si présente
        if (!empty($params['specificRequest'])) {
            $prompt .= "DEMANDE SPÉCIFIQUE DE L'UTILISATEUR :\n";
            $prompt .= $params['specificRequest'] . "\n\n";
        }

        return $prompt;
    }

    /**
     * [AI:Claude] Générer avec l'API Claude (Anthropic)
     *
     * @param string $prompt Prompt de génération
     * @return array Résultat de la génération
     * @throws \Exception Si erreur API
     */
    private function generateWithClaude(string $prompt): array
    {
        try {
            $response = $this->httpClient->post('https://api.anthropic.com/v1/messages', [
                'headers' => [
                    'x-api-key' => $this->apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type' => 'application/json'
                ],
                'json' => [
                    'model' => 'claude-3-5-sonnet-20241022',
                    'max_tokens' => 4000,
                    'temperature' => 0.7,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ]
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            $content = $data['content'][0]['text'] ?? '';

            $jsonMatch = [];
            if (preg_match('/\{[\s\S]*\}/', $content, $jsonMatch)) {
                $patternData = json_decode($jsonMatch[0], true);

                if (json_last_error() === JSON_ERROR_NONE) {
                    return [
                        'success' => true,
                        'pattern' => $patternData,
                        'provider' => 'claude',
                        'tokens_used' => $data['usage']['input_tokens'] + $data['usage']['output_tokens'] ?? null,
                        'raw_content' => $content
                    ];
                }
            }

            return [
                'success' => false,
                'error' => 'Impossible de parser le JSON généré',
                'raw_content' => $content
            ];

        } catch (GuzzleException $e) {
            throw new \Exception('Erreur API Claude : '.$e->getMessage());
        }
    }

    /**
     * [AI:Claude] Générer avec l'API OpenAI
     *
     * @param string $prompt Prompt de génération
     * @return array Résultat de la génération
     * @throws \Exception Si erreur API
     */
    private function generateWithOpenAI(string $prompt): array
    {
        try {
            $response = $this->httpClient->post('https://api.openai.com/v1/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer '.$this->apiKey,
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'model' => 'gpt-4-turbo-preview',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'Tu es un expert en crochet spécialisé dans la création de patrons détaillés.'
                        ],
                        [
                            'role' => 'user',
                            'content' => $prompt
                        ]
                    ],
                    'max_tokens' => 4000,
                    'temperature' => 0.7,
                    'response_format' => ['type' => 'json_object']
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            $content = $data['choices'][0]['message']['content'] ?? '';
            $patternData = json_decode($content, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                return [
                    'success' => true,
                    'pattern' => $patternData,
                    'provider' => 'openai',
                    'tokens_used' => $data['usage']['total_tokens'] ?? null,
                    'raw_content' => $content
                ];
            }

            return [
                'success' => false,
                'error' => 'Impossible de parser le JSON généré',
                'raw_content' => $content
            ];

        } catch (GuzzleException $e) {
            throw new \Exception('Erreur API OpenAI : '.$e->getMessage());
        }
    }

    /**
     * [AI:Claude] Tester la connexion à l'API IA
     *
     * @return bool True si la connexion fonctionne
     */
    public function testConnection(): bool
    {
        try {
            $testPrompt = "Réponds simplement : OK";

            if ($this->provider === 'claude') {
                $response = $this->httpClient->post('https://api.anthropic.com/v1/messages', [
                    'headers' => [
                        'x-api-key' => $this->apiKey,
                        'anthropic-version' => '2023-06-01',
                        'content-type' => 'application/json'
                    ],
                    'json' => [
                        'model' => 'claude-3-5-sonnet-20241022',
                        'max_tokens' => 10,
                        'messages' => [['role' => 'user', 'content' => $testPrompt]]
                    ]
                ]);
            } else {
                $response = $this->httpClient->post('https://api.openai.com/v1/chat/completions', [
                    'headers' => [
                        'Authorization' => 'Bearer '.$this->apiKey,
                        'Content-Type' => 'application/json'
                    ],
                    'json' => [
                        'model' => 'gpt-3.5-turbo',
                        'messages' => [['role' => 'user', 'content' => $testPrompt]],
                        'max_tokens' => 10
                    ]
                ]);
            }

            return $response->getStatusCode() === 200;

        } catch (\Exception $e) {
            error_log('[AIPatternService] Test connexion échoué : '.$e->getMessage());
            return false;
        }
    }
}
