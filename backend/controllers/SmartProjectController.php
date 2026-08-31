<?php
/**
 * @file SmartProjectController.php
 * @brief Contrôleur pour la création intelligente de projets via IA
 * @author Nathalie + AI Assistants
 * @created 2026-01-07
 * @modified 2026-01-07 by [AI:Claude] - Création Smart Project V1
 *
 * @history
 *   2026-01-07 [AI:Claude] Endpoints d'analyse PDF/URL et création assistée IA
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Services\AIPatternExtractorService;
use App\Services\AnalyticsService;
use App\Services\PatternStorageService;
use App\Services\PatternTranslatorService;
use App\Middleware\AuthMiddleware;

class SmartProjectController
{
    private Project $projectModel;
    private User $userModel;
    private AIPatternExtractorService $extractorService;
    private PatternStorageService $patternStorage;
    private AuthMiddleware $authMiddleware;

    private const UPLOAD_DIR = __DIR__ . '/../../uploads/patterns/';
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    public function __construct()
    {
        $this->projectModel = new Project();
        $this->userModel = new User();
        $this->extractorService = new AIPatternExtractorService();
        $this->patternStorage = new PatternStorageService();
        $this->authMiddleware = new AuthMiddleware();

        // Créer le dossier uploads si nécessaire
        if (!is_dir(self::UPLOAD_DIR)) {
            mkdir(self::UPLOAD_DIR, 0755, true);
        }
    }

    /**
     * GET /api/projects/smart-create/quota
     * Récupère le quota d'imports IA restants pour l'utilisateur
     */
    public function getQuota(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $this->jsonResponse(['error' => 'Utilisateur introuvable'], 404);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $plan = $this->getSmartImportPlan($user['subscription_type'], $userId);

            if ($plan['monthly_limit'] > 0) {
                // PLUS/PRO : quota sur fenêtre glissante de 30j depuis subscription_expires_at - 30j
                $subscriptionExpiresAt = $user['subscription_expires_at'] ?? null;
                $periodStart = null;
                $nextReset = null;

                if ($subscriptionExpiresAt) {
                    $expiresAt = new \DateTime($subscriptionExpiresAt);
                    $now = new \DateTime();
                    // Reculer d'intervalles de 30j depuis expires_at jusqu'à trouver le début de période actuelle
                    $periodStart = clone $expiresAt;
                    while ($periodStart > $now) {
                        $periodStart->modify('-30 days');
                    }
                    $nextReset = clone $periodStart;
                    $nextReset->modify('+30 days');
                } else {
                    // Fallback : mois calendaire
                    $periodStart = new \DateTime('first day of this month 00:00:00');
                    $nextReset = new \DateTime('first day of next month 00:00:00');
                }

                $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND created_at >= :period_start AND project_id IS NOT NULL");
                $stmt->execute(['user_id' => $userId, 'period_start' => $periodStart->format('Y-m-d H:i:s')]);
                $usedThisMonth = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];
                $this->jsonResponse([
                    'success' => true,
                    'quota' => [
                        'plan' => $plan['tier'],
                        'is_pro' => $plan['tier'] === 'pro',
                        'free_trial_used' => false,
                        'used_this_month' => $usedThisMonth,
                        'limit_monthly' => $plan['monthly_limit'],
                        'remaining' => max(0, $plan['monthly_limit'] - $usedThisMonth),
                        'next_reset_date' => $nextReset->format('Y-m-d'),
                    ]
                ]);
            } else {
                // FREE : 2 essais à vie
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND project_id IS NOT NULL");
                $stmt->execute(['user_id' => $userId]);
                $totalUsed = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];
                // [AI:Claude] Le frontend (CreateProjectWizard) redirige direct vers /subscription
                // dès que free_trial_used est vrai, sans jamais laisser passer vers le
                // formulaire — sans ce champ, le teaser (voir analyze()/confirm()) ne serait
                // jamais atteignable depuis ce point d'entrée.
                $teaserAvailable = empty($user['smart_creation_teaser_used_at']);
                $this->jsonResponse([
                    'success' => true,
                    'quota' => [
                        'plan' => 'free',
                        'is_pro' => false,
                        'free_trial_used' => $totalUsed >= 3,
                        'teaser_available' => $teaserAvailable,
                        'total_used' => $totalUsed,
                        'remaining' => max(0, 3 - $totalUsed),
                    ]
                ]);
            }

        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur getQuota: ' . $e->getMessage());
            $this->jsonResponse(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * POST /api/projects/smart-create/analyze
     * Analyse un PDF ou une URL et extrait les informations du patron
     *
     * Body (multipart): {file: File} OU {url: string}
     */
    public function analyze(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $user = $this->userModel->findById($userId);

            if (!$user) {
                $this->jsonResponse(['error' => 'Utilisateur introuvable'], 404);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $plan = $this->getSmartImportPlan($user['subscription_type'], $userId);

            if ($plan['monthly_limit'] > 0) {
                // PLUS/PRO : quota sur fenêtre glissante de 30j depuis subscription_expires_at
                $subscriptionExpiresAt = $user['subscription_expires_at'] ?? null;
                if ($subscriptionExpiresAt) {
                    $expiresAt = new \DateTime($subscriptionExpiresAt);
                    $now = new \DateTime();
                    $periodStart = clone $expiresAt;
                    while ($periodStart > $now) {
                        $periodStart->modify('-30 days');
                    }
                    $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND created_at >= :period_start AND project_id IS NOT NULL");
                    $stmt->execute(['user_id' => $userId, 'period_start' => $periodStart->format('Y-m-d H:i:s')]);
                } else {
                    $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND project_id IS NOT NULL");
                    $stmt->execute(['user_id' => $userId]);
                }
                $usedThisMonth = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];
                if ($usedThisMonth >= $plan['monthly_limit']) {
                    $this->jsonResponse([
                        'error' => "Limite mensuelle atteinte ({$plan['monthly_limit']} imports/mois).",
                        'error_code' => 'import_monthly_limit',
                        'error_params' => ['count' => $plan['monthly_limit']],
                        'quota_exceeded' => true
                    ], 403);
                    return;
                }
            } else {
                // FREE : 3 essais à vie
                $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND project_id IS NOT NULL");
                $stmt->execute(['user_id' => $userId]);
                $totalUsed = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];
                if ($totalUsed >= 3) {
                    // [AI:Claude] Une seule analyse "teaser" à vie au-delà des 3 essais :
                    // l'utilisatrice voit son projet analysé une dernière fois (l'effet "wow"
                    // avant de payer), mais confirm() bloquera la validation réelle — voir
                    // plus bas. Sans ce teaser, on bloquerait ici avant même l'appel Gemini.
                    if (!empty($user['smart_creation_teaser_used_at'])) {
                        $this->jsonResponse([
                            'error' => 'Essais gratuits utilisés — passez à PLUS ou PRO pour continuer',
                            'upgrade_required' => true,
                            'free_trial_used' => true
                        ], 403);
                        return;
                    }
                    $db->prepare('UPDATE users SET smart_creation_teaser_used_at = NOW() WHERE id = :user_id')
                        ->execute(['user_id' => $userId]);
                }
            }

            // Déterminer le type d'import (PDF, URL ou bibliothèque)
            $sourceType = null;
            $sourceName = null;
            $filePath = null;
            $fileSize = null;
            $isLibraryFile = false;
            $patternTextInput = null;

            if (isset($_POST['library_pattern_id']) && !empty($_POST['library_pattern_id'])) {
                // Import depuis la bibliothèque
                $libraryPatternId = (int)$_POST['library_pattern_id'];
                $patternLibraryModel = new \App\Models\PatternLibrary();
                $libraryPattern = $patternLibraryModel->getPatternById($libraryPatternId);

                if (!$libraryPattern || $libraryPattern['user_id'] !== $userId) {
                    $this->jsonResponse(['error' => 'Patron introuvable dans votre bibliothèque'], 404);
                    return;
                }

                if (empty($libraryPattern['file_path'])) {
                    $this->jsonResponse(['error' => 'Ce patron n\'a pas de fichier PDF associé'], 400);
                    return;
                }

                $absolutePath = __DIR__ . '/../public' . $libraryPattern['file_path'];
                if (!file_exists($absolutePath)) {
                    $this->jsonResponse(['error' => 'Fichier PDF introuvable sur le serveur'], 404);
                    return;
                }

                $sourceType = 'library';
                $sourceName = $libraryPattern['name'];
                $filePath = $absolutePath;
                $fileSize = filesize($absolutePath);
                $isLibraryFile = true;

            } elseif (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                // Upload PDF
                $sourceType = 'pdf';
                $filePath = $_FILES['file']['tmp_name'];
                $sourceName = $_FILES['file']['name'];
                $fileSize = $_FILES['file']['size'];

                // Validation
                if ($fileSize > self::MAX_FILE_SIZE) {
                    $this->jsonResponse(['error' => 'Fichier trop volumineux (max 10 MB)', 'error_code' => 'file_too_large'], 400);
                    return;
                }

                $mimeType = mime_content_type($filePath);
                if ($mimeType !== 'application/pdf') {
                    $this->jsonResponse(['error' => 'Seuls les fichiers PDF sont acceptés', 'error_code' => 'pdf_only'], 400);
                    return;
                }

                // Copier le fichier temporairement
                $tempPath = self::UPLOAD_DIR . uniqid('pattern_') . '.pdf';
                move_uploaded_file($filePath, $tempPath);
                $filePath = $tempPath;

            } elseif (isset($_POST['url']) && !empty($_POST['url'])) {
                // Import URL
                $sourceType = 'url';
                $sourceName = $_POST['url'];

            } elseif (isset($_POST['pattern_text']) && !empty(trim($_POST['pattern_text']))) {
                // [AI:Claude] Repli quand le scraping d'une URL échoue (ex: site protégé par
                // Cloudflare) — le message d'erreur invite depuis longtemps à "copier-coller
                // le texte du patron directement", sans qu'aucun champ ne le permette jusqu'ici.
                $sourceType = 'text';
                $patternTextInput = trim($_POST['pattern_text']);
                $sourceName = mb_substr($patternTextInput, 0, 80) . (mb_strlen($patternTextInput) > 80 ? '…' : '');

            } else {
                $this->jsonResponse(['error' => 'Fichier PDF, URL, texte ou patron de bibliothèque requis', 'error_code' => 'pattern_source_required'], 400);
                return;
            }

            // Taille choisie (optionnel, pour patrons multi-tailles)
            $patternSize = !empty($_POST['pattern_size']) ? trim($_POST['pattern_size']) : null;

            // Extraire avec IA
            $extractionStart = microtime(true);

            if ($sourceType === 'pdf' || $sourceType === 'library') {
                $result = $this->extractorService->extractFromPDF($filePath, $patternSize);
            } elseif ($sourceType === 'text') {
                $result = $this->extractorService->extractFromText($patternTextInput, $patternSize);
            } else {
                $result = $this->extractorService->extractFromURL($sourceName, $patternSize);
            }

            $processingTime = isset($result['processing_time_ms']) ? (int)$result['processing_time_ms'] : (int)round((microtime(true) - $extractionStart) * 1000);

            // [AI:Claude] Persiste le fichier analysé (PDF importé ou depuis la bibliothèque)
            // dans le dossier public servi par l'app — sans ça, seul le JSON extrait par l'IA
            // survivait, le document lui-même n'était jamais consultable dans l'onglet "Patron"
            // du projet une fois créé. Une copie (pas un déplacement direct comme
            // PatternStorageService::savePatternFile()) : ce fichier n'est plus un upload PHP
            // "frais" à ce stade (déjà déplacé une première fois plus haut, ou jamais un upload
            // pour un fichier de bibliothèque), move_uploaded_file() échouerait silencieusement.
            $sourceFilePath = null;
            if ($result['success'] && ($sourceType === 'pdf' || $sourceType === 'library') && file_exists($filePath)) {
                try {
                    $patternsDir = __DIR__ . '/../public/uploads/patterns';
                    if (!is_dir($patternsDir)) {
                        mkdir($patternsDir, 0755, true);
                    }
                    $filename = 'smart_import_' . uniqid() . '.pdf';
                    if (copy($filePath, $patternsDir . '/' . $filename)) {
                        $sourceFilePath = '/uploads/patterns/' . $filename;
                    }
                } catch (\Exception $e) {
                    error_log('[SmartProject] Erreur persistance fichier patron: ' . $e->getMessage());
                }
            }

            // Nettoyer le fichier temp de travail (jamais le fichier de bibliothèque lui-même,
            // et jamais la copie qu'on vient de faire dans public/uploads/patterns)
            if ($sourceType === 'pdf' && !$isLibraryFile && file_exists($filePath)) {
                unlink($filePath);
            }

            // Retourner le résultat
            if (!$result['success']) {
                $this->jsonResponse([
                    'success' => false,
                    'error' => $result['error'],
                    'error_code' => $result['error_code'] ?? null,
                    'ai_status' => $result['ai_status']
                ], $result['ai_status'] === 'failed' ? 422 : 200);
                return;
            }

            // Logger ici : Gemini a été appelé et a répondu — le quota est consommé maintenant
            // [AI:Claude] L'ID est renvoyé au frontend pour être relié au projet lors du confirm()
            // [AI:Claude] $result['data'] (pas null) : sans le PDF conservé, ai_response_json est
            // la seule trace permettant d'auditer a posteriori la qualité d'une extraction.
            $importId = $this->logImport($userId, null, $sourceType, $sourceName, $sourceFilePath, $fileSize, $result['ai_status'], $result['data'] ?? null, $processingTime, null, $patternSize);

            $this->jsonResponse([
                'success' => true,
                'data' => $result['data'],
                'ai_status' => $result['ai_status'],
                'processing_time_ms' => $processingTime,
                'source_type' => $sourceType,
                'source_name' => $sourceName,
                'import_id' => $importId
            ]);

        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur analyze: ' . $e->getMessage());
            error_log('[SmartProject] Stack trace: ' . $e->getTraceAsString());
            $this->jsonResponse(['error' => 'Erreur lors de l\'analyse: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/projects/smart-create/confirm
     * Crée le projet après validation par l'utilisateur
     *
     * Body JSON: {
     *   project: {...},
     *   sections: [{...}],
     *   source_type: 'pdf'|'url',
     *   source_url: string
     * }
     */
    // [AI:Claude] Traduit l'aperçu (sections + extras) d'un import déjà analysé mais PAS
    // ENCORE lié à un projet — étape Validation de la Création Intelligente. Contrairement à
    // ProjectController::translatePattern(), keyed par project_id, ici on ne dispose que de
    // l'import_id (le projet n'existe pas encore) : pas de project_sections à mettre à jour,
    // seulement le formulaire de relecture côté frontend. On persiste quand même
    // translated_text/translated_lang sur cette ligne ai_pattern_imports (même si project_id
    // est encore NULL) — sinon, une fois le projet créé et l'import lié, ProjectController::show()
    // ne trouve aucune traduction et l'onglet Patron re-propose une traduction déjà faite ici.
    public function translatePreview(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $importId = (int)($data['import_id'] ?? 0);
            $targetLang = $data['target_lang'] ?? 'fr';

            if (!$importId) {
                $this->jsonResponse(['success' => false, 'error' => 'import_id requis'], 400);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                'SELECT ai_response_json FROM ai_pattern_imports WHERE id = :id AND user_id = :uid'
            );
            $stmt->execute(['id' => $importId, 'uid' => $userId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$row) {
                $this->jsonResponse(['success' => false, 'error' => 'Import introuvable'], 404);
                return;
            }

            $parsed = json_decode($row['ai_response_json'] ?? '', true) ?? [];
            $result = (new PatternTranslatorService())->translateParsedPattern($parsed, $targetLang);

            if (!$result['success']) {
                $this->jsonResponse(['success' => false, 'error' => $result['error'] ?? 'Échec de la traduction'], 502);
                return;
            }

            $updateStmt = $db->prepare(
                'UPDATE ai_pattern_imports SET translated_text = :text, translated_lang = :lang WHERE id = :id'
            );
            $updateStmt->execute([
                'text' => $result['translated_text'],
                'lang' => $targetLang,
                'id' => $importId,
            ]);

            $this->jsonResponse([
                'success' => true,
                'translated_sections' => $result['translated_sections'],
                'translated_pattern_notes' => $result['translated_pattern_notes'],
            ]);
        } catch (\Exception $e) {
            error_log('Erreur translatePreview: ' . $e->getMessage());
            $this->jsonResponse(['success' => false, 'error' => 'Erreur serveur'], 500);
        }
    }

    public function confirm(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['project']) || !isset($data['sections'])) {
                $this->jsonResponse(['error' => 'Données projet et sections requises', 'error_code' => 'project_data_required'], 400);
                return;
            }

            $projectData = $data['project'];
            $sectionsData = $data['sections'];
            $sourceType = $data['source_type'] ?? 'manual';
            $sourceUrl = $data['source_url'] ?? null;
            $analyzeMetadata = $data['analyze_metadata'] ?? null;

            // [AI:Claude] Retrouve le fichier persisté par analyze() (voir logImport()) pour
            // que le patron reste consultable dans l'onglet "Patron" une fois le projet créé —
            // sans ça, seul le JSON extrait par l'IA survivait, jamais le document lui-même.
            $sourceFilePath = null;
            if (!empty($analyzeMetadata['import_id'])) {
                $importLookup = \App\Config\Database::getInstance()->getConnection()->prepare(
                    'SELECT source_file_path FROM ai_pattern_imports WHERE id = :id AND user_id = :uid'
                );
                $importLookup->execute(['id' => (int)$analyzeMetadata['import_id'], 'uid' => $userId]);
                $sourceFilePath = $importLookup->fetchColumn() ?: null;
            }

            // [AI:Claude] Contrôle qui n'existait pas avant le teaser : analyze() pouvait
            // jusqu'ici laisser passer une analyse au-delà du quota grâce au teaser (voir
            // analyze()), confirm() faisait alors confiance à ce blocage en amont pour
            // protéger la vraie création. Le teaser ne donne droit qu'à VOIR le projet
            // (étape Validation), pas à l'enregistrer — sinon il ne coûterait plus rien
            // d'avoir un quota FREE.
            $confirmUser = $this->userModel->findById($userId);
            if ($confirmUser) {
                $confirmPlan = $this->getSmartImportPlan($confirmUser['subscription_type'], $userId);
                if ($confirmPlan['monthly_limit'] === 0) {
                    $db = \App\Config\Database::getInstance()->getConnection();
                    $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND project_id IS NOT NULL");
                    $stmt->execute(['user_id' => $userId]);
                    $totalUsed = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];
                    if ($totalUsed >= 3) {
                        $this->jsonResponse([
                            'error' => 'Essais gratuits utilisés — passez à PLUS ou PRO pour enregistrer ce projet',
                            'upgrade_required' => true,
                            'free_trial_used' => true
                        ], 403);
                        return;
                    }
                }
            }

            // Créer le projet
            $db = \App\Config\Database::getInstance()->getConnection();
            $db->beginTransaction();

            try {
                // Préparer les données du projet
                $insertData = [
                    'user_id' => $userId,
                    'name' => $projectData['title'] ?? 'Nouveau projet',
                    'type' => $this->mapCategoryToType($projectData['category'] ?? null),
                    'craft_type' => $projectData['craft_type'] ?? null,
                    // [AI:Claude] Sans ce champ, Project::createProject applique son défaut
                    // silencieux 'crochet' quel que soit le craft_type détecté par l'IA — un
                    // projet tricot se retrouvait avec technique=crochet en base (filtres et
                    // badge "Tricot/Crochet" de MyProjects.jsx faux).
                    'technique' => in_array($projectData['craft_type'] ?? null, ['tricot', 'crochet'], true)
                        ? $projectData['craft_type']
                        : 'crochet',
                    'description' => $projectData['description'] ?? null,
                    'pattern_notes' => $projectData['pattern_notes'] ?? null,
                    'source_type' => $sourceType,
                    'source_url' => $sourceUrl,
                    'status' => 'in_progress'
                ];

                // [AI:Claude] Onglet "Patron" du projet : selon la source analysée, un seul de
                // ces trois champs est renseigné (fichier persisté par analyze(), URL d'origine,
                // ou texte collé — celui-ci renvoyé par le frontend puisqu'il n'est pas conservé
                // côté serveur après l'extraction).
                if ($sourceFilePath) {
                    $insertData['pattern_path'] = $sourceFilePath;
                } elseif ($sourceType === 'url' && $sourceUrl) {
                    $insertData['pattern_url'] = $sourceUrl;
                } elseif ($sourceType === 'text' && !empty($data['pattern_text'])) {
                    $insertData['pattern_text'] = trim($data['pattern_text']);
                }

                // Détails techniques — yarn est maintenant une liste (colorwork = plusieurs fils),
                // les colonnes plates ci-dessous ne gardent que le premier fil pour compatibilité
                $firstYarn = $projectData['yarn'][0] ?? null;
                if (isset($firstYarn['brand'])) {
                    $insertData['yarn_brand'] = $firstYarn['brand'];
                }
                if (isset($firstYarn['color'])) {
                    $insertData['yarn_color'] = $firstYarn['color'];
                }
                if (isset($firstYarn['weight'])) {
                    $insertData['yarn_weight'] = $firstYarn['weight'];
                }
                if (isset($projectData['needles'][0]['size'])) {
                    $insertData['hook_size'] = $projectData['needles'][0]['size'];
                }
                if (isset($projectData['gauge']['stitches'])) {
                    $insertData['gauge_stitches'] = $projectData['gauge']['stitches'];
                }
                if (isset($projectData['gauge']['rows'])) {
                    $insertData['gauge_rows'] = $projectData['gauge']['rows'];
                }
                if (isset($projectData['gauge']['size_cm'])) {
                    $insertData['gauge_size_cm'] = $projectData['gauge']['size_cm'];
                }

                // [AI:Claude] L'onglet "Détails techniques" de ProjectCounter ne lit QUE le
                // JSON technical_details (yarn/needles/gauge), jamais les colonnes plates
                // ci-dessus (gauge_stitches, yarn_brand, hook_size...). Sans ce bloc,
                // l'échantillon et le reste des détails extraits par l'IA restaient invisibles
                // nulle part dans l'app, alors qu'ils étaient bien enregistrés en base.
                $sizeCm = $projectData['gauge']['size_cm'] ?? 10;
                $insertData['technical_details'] = json_encode([
                    'yarn' => !empty($projectData['yarn']) ? array_map(function ($y) {
                        // [AI:Claude] Suit la convention du formulaire manuel : "Marque" = marque + nom
                        // du fil (ex: "DROPS Air"), "Nom" = composition ou épaisseur si le patron
                        // utilise un système propriétaire (ex: "Groupe C") plutôt qu'une catégorie standard
                        $brand = trim(($y['brand'] ?? '') . ' ' . ($y['name'] ?? ''));
                        $nameField = $y['composition'] ?? ($y['weight'] ?? '');
                        return [
                            'brand' => $brand,
                            'name' => $nameField,
                            'url' => '',
                            'quantities' => [[
                                'amount' => $y['quantity_needed']['amount'] ?? '',
                                'unit' => $y['quantity_needed']['unit'] ?? 'pelotes',
                                'color' => $y['color'] ?? ''
                            ]]
                        ];
                    }, $projectData['yarn']) : [[
                        'brand' => '',
                        'name' => '',
                        'url' => '',
                        'quantities' => [['amount' => '', 'unit' => 'pelotes', 'color' => '']]
                    ]],
                    'needles' => !empty($projectData['needles']) ? array_map(function ($n) use ($projectData) {
                        $type = $n['type'] ?? (($projectData['craft_type'] ?? '') === 'crochet' ? 'Crochet' : 'Aiguilles');
                        if (!empty($n['usage'])) {
                            $type .= " — {$n['usage']}";
                        }
                        return [
                            'type' => $type,
                            'size' => $n['size'] ?? '',
                            'length' => $n['length'] ?? ''
                        ];
                    }, $projectData['needles']) : [[
                        'type' => ($projectData['craft_type'] ?? '') === 'crochet' ? 'Crochet' : 'Aiguilles',
                        'size' => '',
                        'length' => ''
                    ]],
                    'gauge' => [
                        'stitches' => $projectData['gauge']['stitches'] ?? '',
                        'rows' => $projectData['gauge']['rows'] ?? '',
                        'dimensions' => "{$sizeCm} x {$sizeCm} cm",
                        'notes' => ''
                    ],
                    'description' => $projectData['description'] ?? ''
                ]);

                // Insérer le projet
                $projectId = $this->projectModel->create($insertData);

                // [AI:Claude] Filtrer les sections vides (nom ET description absents) — l'IA
                // renvoie parfois des sections fantômes (artefacts de fin de PDF, numérotation
                // résiduelle), qui créaient des sections sans nom ni contenu dans le projet,
                // perturbantes pour l'utilisatrice sans qu'aucune erreur ne soit remontée.
                $sectionsData = array_values(array_filter($sectionsData, function ($section) {
                    return trim((string)($section['name'] ?? '')) !== ''
                        || trim((string)($section['description'] ?? '')) !== '';
                }));

                // Créer les sections
                if (!empty($sectionsData)) {
                    $stmt = $db->prepare("
                        INSERT INTO project_sections
                        (project_id, name, counter_unit, total_rows, description, display_order)
                        VALUES (:project_id, :name, :counter_unit, :total_rows, :description, :display_order)
                    ");

                    foreach ($sectionsData as $index => $section) {
                        $unit = $section['unit'] ?? 'rangs';
                        $stmt->execute([
                            'project_id' => $projectId,
                            'name' => $section['name'],
                            'counter_unit' => $unit === 'cm' ? 'cm' : 'rows',
                            'total_rows' => $section['target'] ?? null,
                            'description' => $section['description'] ?? null,
                            'display_order' => $index + 1
                        ]);
                    }
                }

                // [AI:Claude] Relier le log d'import IA (créé lors de l'analyse, avant que
                // le projet n'existe) au projet fraîchement créé
                $importId = $analyzeMetadata['import_id'] ?? null;
                if ($importId) {
                    $stmt = $db->prepare("
                        UPDATE ai_pattern_imports SET project_id = :project_id
                        WHERE id = :import_id AND user_id = :user_id
                    ");
                    $stmt->execute([
                        'project_id' => $projectId,
                        'import_id' => $importId,
                        'user_id' => $userId
                    ]);
                }

                $db->commit();

                // Récupérer le projet complet
                $project = $this->projectModel->findById($projectId);

                AnalyticsService::log($userId, $projectId, 'project_created', ['source' => 'smart_import']);

                $this->jsonResponse([
                    'success' => true,
                    'project' => $project,
                    'message' => 'Projet créé avec succès'
                ], 201);

            } catch (\Exception $e) {
                $db->rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur confirm: ' . $e->getMessage());
            $this->jsonResponse(['error' => 'Erreur lors de la création du projet'], 500);
        }
    }

    /**
     * Retourne le plan d'import IA effectif pour l'utilisateur.
     * - PRO / pro_annual / early_bird : 15 imports/mois
     * - PLUS / plus_annual : 3 imports/mois
     * - FREE ou abonnement expiré : 0 (1 essai à vie géré séparément)
     */
    private function getSmartImportPlan(string $subscriptionType, int $userId): array
    {
        $proTypes  = ['pro', 'pro_annual', 'early_bird', 'monthly', 'yearly', 'standard', 'premium', 'starter'];
        $plusTypes = ['plus', 'plus_annual'];

        if (in_array($subscriptionType, $proTypes)) {
            // Vérifier expiration
            if ($this->userModel->hasActiveSubscription($userId)) {
                return ['tier' => 'pro', 'monthly_limit' => 15];
            }
        }

        if (in_array($subscriptionType, $plusTypes)) {
            if ($this->userModel->hasActiveSubscription($userId)) {
                return ['tier' => 'plus', 'monthly_limit' => 3];
            }
        }

        return ['tier' => 'free', 'monthly_limit' => 0];
    }

    /**
     * Logger un import IA (succès ou échec)
     */
    private function logImport(
        int $userId,
        ?int $projectId,
        string $sourceType,
        string $sourceName,
        ?string $sourceFilePath,
        ?int $fileSize,
        string $aiStatus,
        ?array $aiResponse,
        int $processingTime,
        ?string $error,
        ?string $patternSize = null
    ): ?int {
        try {
            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO ai_pattern_imports
                (user_id, project_id, source_type, source_name, source_file_path, pattern_size, file_size_bytes, ai_status, ai_response_json, processing_time_ms, error_message, ip_address)
                VALUES (:user_id, :project_id, :source_type, :source_name, :source_file_path, :pattern_size, :file_size, :ai_status, :ai_response, :processing_time, :error, :ip)
            ");

            $stmt->execute([
                'user_id' => $userId,
                'project_id' => $projectId,
                'source_type' => $sourceType,
                'source_name' => $sourceName,
                'source_file_path' => $sourceFilePath,
                'pattern_size' => $patternSize,
                'file_size' => $fileSize,
                'ai_status' => $aiStatus,
                'ai_response' => $aiResponse ? json_encode($aiResponse) : null,
                'processing_time' => $processingTime,
                'error' => $error,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);

            return (int) $db->lastInsertId();
        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur logImport: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Map catégorie détectée → type projet (hat, scarf, etc.)
     */
    /**
     * [AI:Claude] Convertit la catégorie détectée par l'IA vers les mêmes libellés
     * français que le menu manuel de sélection de catégorie (ProjectCounter.jsx
     * getProjectTypes()) — auparavant ceci renvoyait des codes internes anglais
     * ("garment", "hat"...) qui n'apparaissaient dans aucune option du menu,
     * rendant la catégorie illisible et non modifiable depuis l'app.
     */
    private function mapCategoryToType(?string $category): ?string
    {
        if (!$category) return null;

        $mapping = [
            'bonnet' => 'Accessoires',
            'écharpe' => 'Accessoires',
            'amigurumi' => 'Jouets/Peluches',
            'sac' => 'Accessoires',
            'pull' => 'Vêtements',
            'vêtements' => 'Vêtements',
            'vêtements bébé' => 'Vêtements bébé',
            'accessoires bébé' => 'Accessoires bébé',
            'jouets/peluches' => 'Jouets/Peluches',
            'maison/déco' => 'Maison/Déco',
            'couverture' => 'Maison/Déco'
        ];

        return $mapping[$category] ?? 'Autre';
    }

    /**
     * Récupère l'ID utilisateur depuis le token JWT
     */
    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();

        if ($userData === null) {
            throw new \Exception('Non authentifié');
        }

        return (int)$userData['user_id'];
    }

    /**
     * Envoie une réponse JSON
     */
    private function jsonResponse(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
