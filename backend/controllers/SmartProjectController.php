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
use App\Models\PatternLibrary;
use App\Services\AIPatternExtractorService;
use App\Services\AnalyticsService;
use App\Services\SmartCreationTrackingService;
use App\Services\PatternStorageService;
use App\Services\PatternTranslatorService;
use App\Services\PatternExtractionValidator;
use App\Middleware\AuthMiddleware;

class SmartProjectController
{
    private Project $projectModel;
    private User $userModel;
    private PatternLibrary $patternLibraryModel;
    private AIPatternExtractorService $extractorService;
    private PatternStorageService $patternStorage;
    private AuthMiddleware $authMiddleware;

    // Même insertion que confirm(), isolée pour vérifier la chaîne jusqu'au stockage.
    private static function insertProjectSection(\PDO $db, int $projectId, array $section, int $index): void
    {
        $stmt = $db->prepare("
            INSERT INTO project_sections
            (project_id, name, counter_unit, progression_type, total_rows, current_row, pattern_start_row, description, display_order)
            VALUES (:project_id, :name, :counter_unit, :progression_type, :total_rows, 0, :pattern_start_row, :description, :display_order)
        ");
        $unit = $section['unit'] ?? null;
        $normalizedUnit = match (mb_strtolower(trim((string)$unit))) {
            'cm' => 'cm',
            'round', 'rounds', 'tour', 'tours' => 'rounds',
            default => 'rows',
        };
        $hasExplicitUnit = is_string($unit) && trim($unit) !== '';
        // [AI:Claude] Section composite = plusieurs paliers/actions successifs qu'un
        // total unique représenterait de façon trompeuse (voir EXTRACTION_PROMPT,
        // RÈGLE PROGRESSION COMPOSITE). Invariant forcé ici, pas seulement dans le
        // prompt : si l'IA renvoie quand même un target malgré composite, on l'ignore
        // plutôt que d'afficher un compteur X/Y qui pourrait faire manquer une étape.
        $progressionType = in_array($section['progression_type'] ?? 'simple', ['simple', 'composite', 'action'], true)
            ? $section['progression_type'] : 'simple';
        // [AI:Claude] Dernier garde-fou avant la base : cible non numérique, nulle ou
        // négative (ex: soustraction incohérente, saisie à la relecture) → compteur
        // libre plutôt qu'un objectif faux.
        $target = $section['target'] ?? null;
        $target = (is_numeric($target) && (float)$target > 0 && (float)$target < 100000) ? round((float)$target, 1) : null;
        $stmt->execute([
            'project_id' => $projectId,
            'name' => $section['name'],
            'counter_unit' => ($progressionType === 'action' || ($progressionType === 'composite' && !$hasExplicitUnit))
                ? null : $normalizedUnit,
            'progression_type' => $progressionType,
            'total_rows' => $progressionType === 'simple' ? $target : null,
            'pattern_start_row' => !empty($section['pattern_start_row']) ? (int)$section['pattern_start_row'] : null,
            'description' => $section['description'] ?? null,
            'display_order' => $index + 1
        ]);
    }

    private const UPLOAD_DIR = __DIR__ . '/../../uploads/patterns/';
    private const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB — relevé depuis 10 MB, un patron scanné/photographié dépasse facilement cette taille (cas réel à 17 MB)
    private const MAX_TEXT_LENGTH = 200000;
    private const ANALYSIS_LOCK_TTL_SECONDS = 420;
    private const ALLOWED_TARGET_LANGUAGES = ['fr', 'en', 'de', 'nl', 'es'];

    public function __construct()
    {
        $this->projectModel = new Project();
        $this->userModel = new User();
        $this->patternLibraryModel = new PatternLibrary();
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
                $this->jsonResponse([
                    'success' => true,
                    'quota' => [
                        'plan' => 'free',
                        'is_pro' => false,
                        'free_trial_used' => $totalUsed >= 3,
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
     * GET /api/projects/smart-create/pending
     *
     * [AI:Claude] Une analyse réussie (succès ou partielle) sans project_id associé est un
     * import jamais confirmé — patron avec diagramme/traduction en attente quitté avant
     * "Continuer quand même", ou onglet fermé pendant l'analyse. Les données existent déjà
     * intégralement dans ai_response_json : pas besoin de tout ré-analyser pour reprendre,
     * juste de re-hydrater l'écran de porte. Fenêtre de 7 jours pour ne pas faire remonter
     * indéfiniment un import que l'utilisatrice a en réalité abandonné volontairement.
     */
    public function pendingImport(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $db = \App\Config\Database::getInstance()->getConnection();

            $stmt = $db->prepare(
                "SELECT id, source_name, source_type, pattern_size, translated_text, translated_lang,
                        ai_response_json, ai_status, created_at
                 FROM ai_pattern_imports
                 WHERE user_id = :user_id
                   AND project_id IS NULL
                   AND dismissed_at IS NULL
                   AND ai_status IN ('success', 'partial')
                   AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                 ORDER BY created_at DESC
                 LIMIT 1"
            );
            $stmt->execute(['user_id' => $userId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$row) {
                $this->jsonResponse(['pending' => false]);
                return;
            }

            $pendingData = json_decode($row['ai_response_json'] ?? '', true) ?: [];
            $storedPreview = $pendingData['_translated_preview'] ?? null;
            $translatedPreview = is_array($storedPreview)
                && !empty($row['translated_text'])
                && !empty($row['translated_lang'])
                && ($storedPreview['target_lang'] ?? null) === $row['translated_lang']
                && (($pendingData['translation_validation']['validated'] ?? false) === true)
                ? $storedPreview
                : null;
            $pendingValidation = PatternExtractionValidator::validate($pendingData, $row['pattern_size'] ?? null);
            $pendingData = $pendingValidation['data'];
            if (is_array($pendingData['sections'] ?? null)) {
                $pendingData['sections'] = AIPatternExtractorService::normalizeCumulativeTargets(
                    $pendingData['sections'], $pendingData['craft_type'] ?? null
                );
            }
            $measurementIssues = PatternExtractionValidator::sectionMeasurementIssues($pendingData['sections'] ?? []);
            $pendingData['validation_issues']['section_measurements'] = $measurementIssues;

            $this->jsonResponse([
                'pending' => true,
                'import_id' => (int)$row['id'],
                'attempt_id' => $pendingData['_analytics']['attempt_id'] ?? null,
                'source_name' => $row['source_name'],
                'source_type' => $row['source_type'],
                'pattern_size' => $row['pattern_size'],
                'translated_text' => $row['translated_text'],
                'translated_lang' => $row['translated_lang'],
                'translated_preview' => $translatedPreview,
                'ai_status' => $measurementIssues ? 'partial' : $row['ai_status'],
                'data' => $pendingData,
                'created_at' => $row['created_at']
            ]);
        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur pendingImport: ' . $e->getMessage());
            // Best-effort : ne jamais bloquer l'affichage de "Mes projets" pour ça
            $this->jsonResponse(['pending' => false]);
        }
    }

    /**
     * POST /api/projects/smart-create/pending/dismiss
     *
     * [AI:Claude] Écarte un import analysé jamais rattaché à un projet, sans le reprendre ni
     * attendre les 7 jours de pendingImport(). Sans ça, un import de test abandonné revenait
     * indéfiniment dans la bannière "patron en attente" — et si un autre import plus ancien
     * traînait aussi, il prenait sa place aussitôt le précédent résolu, donnant l'impression
     * que la bannière ne disparaissait jamais.
     */
    public function dismissPending(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['import_id'])) {
                $this->jsonResponse(['error' => 'ID d\'import manquant'], 400);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                "UPDATE ai_pattern_imports SET dismissed_at = NOW()
                 WHERE id = :import_id AND user_id = :user_id AND project_id IS NULL"
            );
            $stmt->execute([
                'import_id' => (int)$data['import_id'],
                'user_id' => $userId,
            ]);

            $this->jsonResponse(['success' => true]);
        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur dismissPending: ' . $e->getMessage());
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
                    AnalyticsService::logPaywall($userId, 'smart_creation', 'smart_import', 'quota_reached', $user['subscription_type'] ?? null);
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
                    AnalyticsService::logPaywall($userId, 'smart_creation', 'smart_import', 'free_trial_used', $user['subscription_type'] ?? null);
                    $this->jsonResponse([
                        'error' => 'Essais gratuits utilisés — passez à PLUS ou PRO pour continuer',
                        'upgrade_required' => true,
                        'free_trial_used' => true
                    ], 403);
                    return;
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
                    $this->jsonResponse(['error' => 'Fichier trop volumineux (max 20 MB)', 'error_code' => 'file_too_large'], 400);
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
                if (mb_strlen($patternTextInput) > self::MAX_TEXT_LENGTH) {
                    $this->jsonResponse(['error' => 'Texte trop volumineux pour être analysé.', 'error_code' => 'text_too_large'], 400);
                    return;
                }
                $sourceName = mb_substr($patternTextInput, 0, 80) . (mb_strlen($patternTextInput) > 80 ? '…' : '');

            } else {
                $this->jsonResponse(['error' => 'Fichier PDF, URL, texte ou patron de bibliothèque requis', 'error_code' => 'pattern_source_required'], 400);
                return;
            }

            // [AI:Claude] 2026-09-25 — Entonnoir Smart Creation : started ici (source valide,
            // quota OK), completed à chaque sortie ci-dessous (success/partial/error).
            // Le client connaît l'identifiant avant la réponse longue (navigation pendant
            // l'analyse). Les autres clients reçoivent un identifiant généré côté serveur.
            $attemptId = SmartCreationTrackingService::normalizeAttemptId(is_string($_POST['attempt_id'] ?? null) ? $_POST['attempt_id'] : null);
            $attemptStartedAt = microtime(true);
            $completedLogged = false;
            $completeAttempt = function (string $status, bool $cached = false, ?int $importId = null, ?string $errorCode = null, array $gates = []) use ($userId, $sourceType, $attemptId, $attemptStartedAt, &$completedLogged): void {
                if ($completedLogged) return;
                $completedLogged = true;
                AnalyticsService::log($userId, null, 'pattern_import_completed', SmartCreationTrackingService::completionData(
                    $attemptId, $sourceType, $status, $cached,
                    (int)round((microtime(true) - $attemptStartedAt) * 1000), $importId, $errorCode, $gates
                ));
            };
            AnalyticsService::log($userId, null, 'pattern_import_started', SmartCreationTrackingService::startedData($attemptId, $sourceType));

            // Taille choisie (optionnel, pour patrons multi-tailles)
            $patternSize = !empty($_POST['pattern_size']) ? trim($_POST['pattern_size']) : null;

            // [AI:Claude] Empreinte du contenu EXACT (fichier, URL ou texte collé + taille
            // choisie) — indépendante du nom de fichier temporaire, qui change à chaque upload
            // même pour un fichier strictement identique.
            if ($sourceType === 'pdf' || $sourceType === 'library') {
                $sourceHash = hash('sha256', hash_file('sha256', $filePath) . '|' . ($patternSize ?? ''));
            } elseif ($sourceType === 'text') {
                $sourceHash = hash('sha256', $patternTextInput . '|' . ($patternSize ?? ''));
            } else {
                $sourceHash = hash('sha256', $sourceName . '|' . ($patternSize ?? ''));
            }

            // [AI:Claude] Réutilise un résultat déjà obtenu pour EXACTEMENT le même contenu
            // plutôt que de rappeler Gemini — vu en vrai : la même utilisatrice réanalyse le
            // même fichier plusieurs fois de suite en pensant que ça avait échoué. Seules les
            // lignes ai_pattern_imports avec ai_status success/partial existent en base (les
            // échecs ne sont jamais journalisés ici, voir plus bas), donc toute ligne trouvée
            // correspond forcément à un résultat exploitable, jamais à un échec mis en cache.
            $cacheStmt = $db->prepare(
                "SELECT ai_response_json, ai_status FROM ai_pattern_imports
                 WHERE user_id = :user_id AND source_hash = :hash
                 AND created_at >= NOW() - INTERVAL 1 DAY
                 ORDER BY created_at DESC LIMIT 1"
            );
            $cacheStmt->execute(['user_id' => $userId, 'hash' => $sourceHash]);
            $cached = $cacheStmt->fetch(\PDO::FETCH_ASSOC);

            $extractionStart = microtime(true);

            if ($cached) {
                $result = [
                    'success' => true,
                    'data' => json_decode($cached['ai_response_json'], true),
                    'ai_status' => $cached['ai_status']
                ];
                if (is_array($result['data']['sections'] ?? null)) {
                    $result['data']['sections'] = AIPatternExtractorService::normalizeCumulativeTargets(
                        $result['data']['sections'], $result['data']['craft_type'] ?? null
                    );
                }
                $releaseLock = function () {};
            } else {
                // [AI:Claude] Verrou anti-double-analyse : un appel Gemini coûte réellement, et
                // une analyse peut prendre 60-100s+ — largement plus que ce que l'écran de
                // chargement laisse deviner. Sans ce verrou, recharger/relancer pendant l'attente
                // déclenche un second appel IA payant en plus du premier, toujours en cours (le
                // cache ci-dessus ne protège que les tentatives APRÈS que la première ait fini).
                // Verrou "périmé" après 420s : deux timeouts Gemini de 180s, le backoff et
                // une marge pour l'upload/traitement. Une requête plus ancienne ne peut pas
                // supprimer un verrou repris, car releaseLock vérifie aussi started_at.
                $lockStaleBefore = date('Y-m-d H:i:s', time() - self::ANALYSIS_LOCK_TTL_SECONDS);
                $lockStmt = $db->prepare(
                    'INSERT INTO smart_creation_locks (user_id, started_at) VALUES (:user_id, NOW())
                     ON DUPLICATE KEY UPDATE started_at = IF(started_at < :stale_before, NOW(), started_at)'
                );
                $lockStmt->execute(['user_id' => $userId, 'stale_before' => $lockStaleBefore]);
                if (!in_array($lockStmt->rowCount(), [1, 2], true)) {
                    $completeAttempt('error', false, null, 'analyze_already_in_progress');
                    $this->jsonResponse([
                        'error' => 'Une analyse est déjà en cours pour ce compte — patiente qu\'elle se termine avant d\'en relancer une autre.',
                        'error_code' => 'analyze_already_in_progress',
                        'attempt_id' => $attemptId
                    ], 429);
                    return;
                }

                $lockOwnerStmt = $db->prepare('SELECT started_at FROM smart_creation_locks WHERE user_id = :user_id');
                $lockOwnerStmt->execute(['user_id' => $userId]);
                $lockStartedAt = (string)$lockOwnerStmt->fetchColumn();

                // [AI:Claude] jsonResponse() fait exit — un finally ne s'exécuterait jamais après,
                // donc le verrou doit être libéré explicitement avant chaque sortie (ici-bas et
                // dans le catch plus bas, y compris si extractFrom*() lève une exception).
                $releaseLock = function () use ($db, $userId, $lockStartedAt) {
                    $db->prepare('DELETE FROM smart_creation_locks WHERE user_id = :user_id AND started_at = :started_at')
                        ->execute(['user_id' => $userId, 'started_at' => $lockStartedAt]);
                };

                // Extraire avec IA
                if ($sourceType === 'pdf' || $sourceType === 'library') {
                    $result = $this->extractorService->extractFromPDF($filePath, $patternSize);
                } elseif ($sourceType === 'text') {
                    $result = $this->extractorService->extractFromText($patternTextInput, $patternSize);
                } else {
                    $result = $this->extractorService->extractFromURL($sourceName, $patternSize);
                }
            }

            if (!empty($result['success'])) {
                $verbatimSourceText = $result['source_text'] ?? ($result['data']['_source_text'] ?? null);
                $validatedResult = PatternExtractionValidator::validate($result['data'], $patternSize ?: null);
                $result['data'] = $validatedResult['data'];
                // Le texte source URL/texte est une référence verbatim distincte du JSON
                // restructuré par Gemini. Il reste côté serveur afin que Flow retrouve les
                // définitions et glossaires que la structure extraite peut légitimement omettre.
                if (!empty($verbatimSourceText)) {
                    $result['data']['_source_text'] = trim((string)$verbatimSourceText);
                } elseif ($sourceType === 'text' && $patternTextInput !== null) {
                    $result['data']['_source_text'] = $patternTextInput;
                }
                $result['data']['diagram_source_accessible'] = self::hasAccessibleDiagramSource(
                    !empty($result['data']['contains_diagram']), $sourceType, $sourceName
                );
                $measurementIssues = PatternExtractionValidator::sectionMeasurementIssues($result['data']['sections'] ?? []);
                $result['data']['validation_issues']['section_measurements'] = $measurementIssues;
                if ($measurementIssues) $result['ai_status'] = 'partial';
            }
            $sourceName = self::resolveImportSourceName($sourceType, $sourceName, $result['data'] ?? null);
            $processingTime = $cached ? 0 : (isset($result['processing_time_ms']) ? (int)$result['processing_time_ms'] : (int)round((microtime(true) - $extractionStart) * 1000));

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
                $completeAttempt('error', (bool)$cached, null, $result['error_code'] ?? null);
                $releaseLock();
                $this->jsonResponse([
                    'success' => false,
                    'attempt_id' => $attemptId,
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
            // Métadonnée serveur dans le JSON existant : durable lors d'une reprise, sans
            // migration. Toujours remplacée sur un cache hit, jamais acceptée de Gemini.
            $result['data']['_analytics'] = ['attempt_id' => $attemptId];
            $importId = $this->logImport($userId, null, $sourceType, $sourceName, $sourceFilePath, $fileSize, $result['ai_status'], $result['data'] ?? null, $processingTime, null, $patternSize, $sourceHash);

            // [AI:Claude] Distinct de 'project_created' (source=smart_import, posé dans confirm()) :
            // permet de mesurer l'abandon entre l'analyse et la confirmation — patron analysé mais
            // jamais transformé en projet (résultat décevant, hésitation à la relecture...).
            AnalyticsService::log($userId, null, 'smart_creation_analyzed', ['import_id' => $importId, 'source_type' => $sourceType, 'attempt_id' => $attemptId]);
            $completeAttempt($result['ai_status'] === 'partial' ? 'partial' : 'success', (bool)$cached, $importId, null,
                SmartCreationTrackingService::gateTypes($result['data'], $result['ai_status'], is_string($_POST['target_lang'] ?? null) ? $_POST['target_lang'] : null));

            $releaseLock();
            // Ne pas renvoyer une copie potentiellement longue de la page au navigateur :
            // le formulaire conserve le JSON utile, la référence verbatim reste en base.
            unset($result['data']['_source_text'], $result['source_text']);
            $this->jsonResponse([
                'success' => true,
                'data' => $result['data'],
                'ai_status' => $result['ai_status'],
                'processing_time_ms' => $processingTime,
                'source_type' => $sourceType,
                'source_name' => $sourceName,
                'import_id' => $importId,
                'attempt_id' => $attemptId
            ]);

        } catch (\Exception $e) {
            // [AI:Claude] $releaseLock n'existe que si on a dépassé l'acquisition du verrou —
            // une exception avant ce point (validation fichier, etc.) n'a jamais posé de verrou.
            if (isset($releaseLock)) {
                $releaseLock();
            }
            if (isset($completeAttempt)) {
                $completeAttempt('error', !empty($cached), $importId ?? null);
            }
            error_log('[SmartProject] Erreur analyze: ' . $e->getMessage());
            error_log('[SmartProject] Stack trace: ' . $e->getTraceAsString());
            $this->jsonResponse(['error' => 'Erreur lors de l\'analyse: ' . $e->getMessage(), 'attempt_id' => $attemptId ?? null], 500);
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

            if (!in_array($targetLang, self::ALLOWED_TARGET_LANGUAGES, true)) {
                $this->jsonResponse(['success' => false, 'error' => 'Langue cible non prise en charge'], 400);
                return;
            }

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
                $status = ($result['error_code'] ?? null) === 'translation_integrity_failed' ? 422 : 502;
                $this->jsonResponse([
                    'success' => false,
                    'error' => $result['error'] ?? 'Échec de la traduction',
                    'error_code' => $result['error_code'] ?? 'translation_failed',
                    'repair_attempted' => (bool)($result['repair_attempted'] ?? false),
                    'failed_block' => $result['failed_block'] ?? null,
                ], $status);
                return;
            }

            $parsed['translation_validation'] = $result['translation_validation'];
            $parsed['_translated_preview'] = [
                'target_lang' => $targetLang,
                'sections' => $result['translated_sections'],
                'pattern_notes' => $result['translated_pattern_notes'],
            ];
            $updatedJson = json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($updatedJson === false) {
                throw new \RuntimeException('Impossible de sérialiser la validation de traduction');
            }

            $updateStmt = $db->prepare(
                'UPDATE ai_pattern_imports SET translated_text = :text, translated_lang = :lang, ai_response_json = :json WHERE id = :id'
            );
            $updateStmt->execute([
                'text' => $result['translated_text'],
                'lang' => $targetLang,
                'json' => $updatedJson,
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
            $sourceUrl = self::validatedSourceUrl($data['source_url'] ?? null, $sourceType);
            $analyzeMetadata = $data['analyze_metadata'] ?? null;

            // [AI:Claude] Retrouve le fichier persisté par analyze() (voir logImport()) pour
            // que le patron reste consultable dans l'onglet "Patron" une fois le projet créé —
            // sans ça, seul le JSON extrait par l'IA survivait, jamais le document lui-même.
            $sourceFilePath = null;
            $importSourceType = null;
            $importId = !empty($analyzeMetadata['import_id']) ? (int)$analyzeMetadata['import_id'] : null;
            if (!$importId) {
                $this->jsonResponse(['error' => 'Import requis', 'error_code' => 'import_id_required'], 400);
                return;
            }
            $db = \App\Config\Database::getInstance()->getConnection();
            $db->beginTransaction();

            if ($importId) {
                // La ligne d'import sérialise les confirmations concurrentes. Après l'attente
                // éventuelle, une seconde requête retrouve project_id et renvoie le même projet.
                $importLookup = $db->prepare(
                    'SELECT project_id, source_file_path, source_type, pattern_size, ai_status, ai_response_json FROM ai_pattern_imports WHERE id = :id AND user_id = :uid FOR UPDATE'
                );
                $importLookup->execute(['id' => $importId, 'uid' => $userId]);
                $importRow = $importLookup->fetch(\PDO::FETCH_ASSOC);
                if (!$importRow) {
                    $db->rollBack();
                    $this->jsonResponse(['error' => 'Import introuvable', 'error_code' => 'import_not_found'], 404);
                    return;
                }
                if (!empty($importRow['project_id'])) {
                    $existingProjectId = (int)$importRow['project_id'];
                    $countStmt = $db->prepare('SELECT COUNT(*) FROM projects WHERE user_id = :user_id');
                    $countStmt->execute(['user_id' => $userId]);
                    $isFirstProject = (int)$countStmt->fetchColumn() === 1;
                    $db->commit();
                    $this->jsonResponse([
                        'success' => true,
                        'project' => $this->projectModel->findById($existingProjectId),
                        'is_first_project' => $isFirstProject,
                        'message' => 'Projet créé avec succès'
                    ], 200);
                    return;
                }
                $sourceFilePath = ($importRow['source_file_path'] ?? null) ?: null;
                $importSourceType = $importRow['source_type'] ?? null;
                if (array_key_exists('pattern_size', $data)
                    && trim((string)$data['pattern_size']) !== trim((string)($importRow['pattern_size'] ?? ''))) {
                    $db->rollBack();
                    $this->jsonResponse(['error' => 'La taille a changé : une nouvelle analyse est nécessaire.', 'error_code' => 'analysis_size_changed'], 409);
                    return;
                }

                $storedAnalysis = json_decode((string)($importRow['ai_response_json'] ?? ''), true);
                if (is_array($storedAnalysis)) {
                    $editedValidation = PatternExtractionValidator::validateEditedPreview(
                        $storedAnalysis, $projectData, $sectionsData, $importRow['pattern_size'] ?: null
                    );
                    if (!empty($editedValidation['blocking_errors'])) {
                        $firstError = $editedValidation['blocking_errors'][0];
                        $db->rollBack();
                        $this->jsonResponse([
                            'error' => $firstError['message'] ?? 'Cette analyse contient une erreur bloquante.',
                            'error_code' => ($firstError['code'] ?? '') === 'selected_size_not_available'
                                ? 'selected_size_not_available' : 'precreation_validation_failed',
                            'validation_errors' => $editedValidation['blocking_errors'],
                        ], 422);
                        return;
                    }
                    $sectionsData = $editedValidation['data']['sections'];
                } else {
                    $db->rollBack();
                    $this->jsonResponse(['error' => 'Analyse invalide', 'error_code' => 'analysis_invalid'], 422);
                    return;
                }
            }

            // [AI:Claude] Re-vérifie le quota FREE ici, pas seulement dans analyze() : entre
            // les deux appels le quota a pu être atteint (autre onglet, import concurrent).
            $confirmUser = $this->userModel->findById($userId);
            if ($confirmUser) {
                $confirmPlan = $this->getSmartImportPlan($confirmUser['subscription_type'], $userId);
                if ($confirmPlan['monthly_limit'] === 0) {
                    $stmt = $db->prepare("SELECT COUNT(*) as count FROM ai_pattern_imports WHERE user_id = :user_id AND project_id IS NOT NULL");
                    $stmt->execute(['user_id' => $userId]);
                    $totalUsed = (int)$stmt->fetch(\PDO::FETCH_ASSOC)['count'];
                    if ($totalUsed >= 3) {
                        AnalyticsService::logPaywall($userId, 'smart_creation_confirm', 'smart_import', 'free_trial_used', $confirmUser['subscription_type'] ?? null);
                        $db->rollBack();
                        $this->jsonResponse([
                            'error' => 'Essais gratuits utilisés — passez à PLUS ou PRO pour enregistrer ce projet',
                            'upgrade_required' => true,
                            'free_trial_used' => true
                        ], 403);
                        return;
                    }
                }
            }

            // Revalide aussi la sémantique des compteurs envoyée par le client. Un cycle
            // ancien, incomplet ou modifié ne doit jamais contourner le fallback prudent.
            // Tous les points non bloquants sont regroupés sous une confirmation unique.
            // Le serveur les recalcule depuis l'import et les sections envoyées : le booléen
            // du client atteste uniquement que l'utilisatrice les a vérifiés dans son patron.
            $measurementIssues = PatternExtractionValidator::sectionMeasurementIssues($sectionsData);
            $hasReviewPoints = !empty($editedValidation['review_issues'] ?? [])
                || !empty($editedValidation['warnings'] ?? [])
                || !empty($editedValidation['unverifiable'] ?? [])
                || !empty($measurementIssues)
                || !empty($storedAnalysis['contains_diagram'])
                || ($importRow['ai_status'] ?? null) === 'partial';
            if ($hasReviewPoints && ($data['review_points_confirmed'] ?? false) !== true) {
                $db->rollBack();
                $this->jsonResponse([
                    'error' => 'Vérifie les points signalés avec le patron original avant de créer le projet.',
                    'error_code' => 'review_points_confirmation_required',
                ], 422);
                return;
            }

            // Créer le projet
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
                // Le support consultable reste dans pattern_path/pattern_url/pattern_text. Pour
                // une URL, pattern_text garde aussi le texte verbatim lu lors de l'analyse :
                // c'est le repli durable de Flow si le journal d'import devient indisponible.
                if ($sourceFilePath) {
                    $insertData['pattern_path'] = $sourceFilePath;
                } elseif ($sourceType === 'url' && $sourceUrl) {
                    $insertData['pattern_url'] = $sourceUrl;
                    $sourceSnapshot = self::projectPatternSnapshot($sourceType, $storedAnalysis, $data['pattern_text'] ?? null);
                    if ($sourceSnapshot !== null) $insertData['pattern_text'] = $sourceSnapshot;
                } elseif ($sourceType === 'text' && !empty($data['pattern_text'])) {
                    $sourceSnapshot = self::projectPatternSnapshot($sourceType, $storedAnalysis, $data['pattern_text']);
                    if ($sourceSnapshot !== null) $insertData['pattern_text'] = $sourceSnapshot;
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
                $primaryNeedle = self::selectPrimaryNeedle($projectData['needles'] ?? []);
                if (!empty($primaryNeedle['size'])) {
                    $insertData['hook_size'] = $primaryNeedle['size'];
                }
                if (isset($projectData['gauge']['stitches'])) {
                    $insertData['gauge_stitches'] = $projectData['gauge']['stitches'];
                }
                if (isset($projectData['gauge']['rows'])) {
                    $insertData['gauge_rows'] = $projectData['gauge']['rows'];
                }
                if (($projectData['gauge']['stitches'] ?? null) !== null
                    || ($projectData['gauge']['rows'] ?? null) !== null) {
                    $insertData['gauge_size_cm'] = $projectData['gauge']['size_cm'] ?? 10;
                }

                // [AI:Claude] L'onglet "Détails techniques" de ProjectCounter ne lit QUE le
                // JSON technical_details (yarn/needles/gauge), jamais les colonnes plates
                // ci-dessus (gauge_stitches, yarn_brand, hook_size...). Sans ce bloc,
                // l'échantillon et le reste des détails extraits par l'IA restaient invisibles
                // nulle part dans l'app, alors qu'ils étaient bien enregistrés en base.
                $hasStructuredGauge = ($projectData['gauge']['stitches'] ?? null) !== null
                    || ($projectData['gauge']['rows'] ?? null) !== null;
                $sizeCm = $hasStructuredGauge ? ($projectData['gauge']['size_cm'] ?? 10) : null;
                $insertData['technical_details'] = json_encode([
                    'yarn' => !empty($projectData['yarn']) ? array_map(function ($y) {
                        return [
                            'brand' => $y['brand'] ?? '',
                            'name' => $y['name'] ?? '',
                            'composition' => $y['composition'] ?? '',
                            'weight' => $y['weight'] ?? '',
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
                        'dimensions' => $sizeCm !== null ? "{$sizeCm} x {$sizeCm} cm" : '',
                        'notes' => $projectData['gauge']['notes'] ?? ''
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
                    foreach ($sectionsData as $index => $section) {
                        self::insertProjectSection($db, $projectId, $section, $index);

                        // [AI:Claude] Compteur secondaire auto-créé quand le patron mentionne une
                        // répétition comptée explicite (ex: "répéter les rangs 1-32 15 fois") — voir
                        // AIPatternExtractorService::EXTRACTION_PROMPT. Sans ça, seul le compteur de
                        // rangs du cycle (32) existait, sans rien pour suivre où on en est dans les
                        // 15 répétitions — l'utilisatrice devait s'en souvenir elle-même.
                        // [AI:Claude] Créé quel que soit le plan (les compteurs secondaires n'ont
                        // jamais eu de garde-fou backend, voir Project::MAX_SECONDARY_COUNTERS —
                        // décision déjà assumée) : un compte FREE ne peut pas s'en servir, mais
                        // ProjectCounter.jsx s'en sert pour lui montrer PRÉCISÉMENT ce que son
                        // patron aurait pu suivre automatiquement ("15 répétitions détectées")
                        // plutôt qu'un bouton générique "passer à PLUS/PRO" sans rapport avec
                        // son propre patron — un vrai argument de conversion, pas un slogan.
                        $secondaryCounter = $section['secondary_counter'] ?? null;
                        if (!empty($secondaryCounter['label']) && !empty($secondaryCounter['target'])) {
                            $sectionId = (int) $db->lastInsertId();
                            $this->projectModel->addSecondaryCounter($projectId, $sectionId, [
                                'label' => $secondaryCounter['label'],
                                'target' => (int) $secondaryCounter['target'],
                                'count' => 0,
                                'tracking_role' => in_array($secondaryCounter['tracking_role'] ?? '', ['required_cycle', 'required_parallel', 'informational', 'unknown'], true)
                                    ? $secondaryCounter['tracking_role'] : 'unknown',
                                'cycle_length' => !empty($secondaryCounter['cycle_length']) ? (int)$secondaryCounter['cycle_length'] : null,
                                'unit' => $secondaryCounter['unit'] ?? 'count',
                            ]);
                        }
                    }

                    $firstSectionStmt = $db->prepare('SELECT id FROM project_sections WHERE project_id = :project_id ORDER BY display_order ASC, id ASC LIMIT 1');
                    $firstSectionStmt->execute(['project_id' => $projectId]);
                    $firstSectionId = $firstSectionStmt->fetchColumn();
                    if ($firstSectionId) {
                        $this->projectModel->setCurrentSection($projectId, (int)$firstSectionId);
                    }
                }

                // [AI:Claude] Relier le log d'import IA (créé lors de l'analyse, avant que
                // le projet n'existe) au projet fraîchement créé
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
                    if ($stmt->rowCount() !== 1) {
                        throw new \RuntimeException('Le rattachement de l’import au projet n’a pas été persisté');
                    }
                }

                $db->commit();

                // [AI:Claude] Enregistrement automatique dans la bibliothèque de patrons —
                // hors transaction, best-effort : un souci ici (fichier, doublon...) ne doit
                // jamais faire échouer la création du projet, qui vient de réussir.
                $this->saveImportToLibrary($userId, $importId, $sourceType, $sourceUrl, $sourceFilePath, $projectData, $data);

                // Récupérer le projet complet
                $project = $this->projectModel->findById($projectId);

                // [AI:Claude] import_source (pdf/url/text/library) lu sur l'import rattaché, pas
                // sur source_type envoyé par le frontend.
                $importSource = $importSourceType ?: null;
                $attemptId = json_decode($importRow['ai_response_json'] ?? '', true)['_analytics']['attempt_id'] ?? null;
                AnalyticsService::log($userId, $projectId, 'project_created', array_filter([
                    'source' => 'smart_import', 'import_source' => $importSource, 'source_type' => $importSource,
                    'import_id' => $importId, 'attempt_id' => $attemptId,
                ], static fn($value) => $value !== null));
                AnalyticsService::logOnce($userId, $projectId, 'real_project_started', ['method' => 'smart', 'source' => $importSource, 'onboarding_version' => 'v2']);

                // [AI:Claude] Permet au frontend de déclencher la checklist tutoriel
                // (showFirstProjectTip, voir MyProjects.jsx/ProjectCounter.jsx) sur ce
                // chemin aussi — jusqu'ici elle ne se posait que depuis la création
                // manuelle, jamais depuis Smart Creation.
                $countStmt = $db->prepare('SELECT COUNT(*) AS c FROM projects WHERE user_id = :user_id');
                $countStmt->execute(['user_id' => $userId]);
                $isFirstProject = (int)$countStmt->fetch(\PDO::FETCH_ASSOC)['c'] === 1;

                $this->jsonResponse([
                    'success' => true,
                    'project' => $project,
                    'is_first_project' => $isFirstProject,
                    'message' => 'Projet créé avec succès'
                ], 201);

            } catch (\Exception $e) {
                if ($db->inTransaction()) $db->rollBack();
                throw $e;
            }

        } catch (\Exception $e) {
            if (isset($db) && $db->inTransaction()) $db->rollBack();
            error_log('[SmartProject] Erreur confirm: ' . $e->getMessage());
            $this->jsonResponse(['error' => 'Erreur lors de la création du projet'], 500);
        }
    }

    private static function selectPrimaryNeedle(array $needles): ?array
    {
        $valid = array_values(array_filter($needles, fn($needle) => is_array($needle) && !empty($needle['size'])));
        if (count($valid) === 1) return $valid[0];

        foreach ($valid as $needle) {
            $usage = mb_strtolower(trim((string)($needle['usage'] ?? '')));
            if ($usage !== '' && preg_match('/\b(?:main|body|garment|pattern|jersey|principal|corps|ouvrage|motif)\b/iu', $usage)) {
                return $needle;
            }
        }
        return null;
    }

    private static function hasAccessibleDiagramSource(bool $containsDiagram, string $sourceType, ?string $sourceName): bool
    {
        if (!$containsDiagram) return true;
        if (in_array($sourceType, ['pdf', 'library'], true)) return true;
        return $sourceType === 'url' && filter_var($sourceName, FILTER_VALIDATE_URL) !== false;
    }

    private static function validatedSourceUrl(mixed $value, string $sourceType): ?string
    {
        if (!in_array($sourceType, ['url', 'text'], true) || !is_string($value)) return null;
        $value = trim($value);
        if ($value === '' || filter_var($value, FILTER_VALIDATE_URL) === false) return null;
        $scheme = strtolower((string)parse_url($value, PHP_URL_SCHEME));
        return in_array($scheme, ['http', 'https'], true) ? $value : null;
    }

    /**
     * [AI:Claude] Enregistre automatiquement le patron importé via Smart Creation dans la
     * bibliothèque de patrons — jusqu'ici, seul l'onglet "Patron" du projet gardait une trace
     * du document analysé ; la bibliothèque (qui sert aussi à réimporter/réutiliser un patron
     * plus tard) restait vide pour tout ce qui passait par la Création Intelligente.
     *
     * Toujours la source d'origine (PDF — copie séparée, jamais le même fichier que l'onglet
     * "Patron" du projet, pour ne pas que supprimer l'un casse l'autre —, URL ou texte collé).
     * Si l'aperçu a été traduit, la traduction est attachée à CETTE MÊME fiche
     * (translated_text/translated_lang, voir migration add_translation_to_pattern_library.sql)
     * plutôt que de créer une deuxième entrée séparée — décision du 2026-09-24 : l'UI expose
     * un onglet "Original/Traduit" sur une seule fiche, pas deux entrées à trier dans la liste.
     *
     * Un import réutilisé depuis la bibliothèque elle-même (sourceType 'library') n'a rien à
     * y ajouter puisqu'il y est déjà. Chaque type de source est dédupliqué avant insertion
     * (une seule entrée par utilisatrice) : URL par correspondance exacte, texte par contenu
     * exact, PDF par hash du contenu du fichier (pas du nom, qui change à chaque copie) —
     * sinon reconfirmer plusieurs fois le même patron (tailles différentes, retour en arrière
     * dans le formulaire) créerait un doublon à chaque fois. Si un doublon est trouvé, la
     * traduction s'attache quand même à la fiche existante plutôt que d'être perdue.
     */
    private function saveImportToLibrary(
        int $userId,
        ?int $importId,
        string $sourceType,
        ?string $sourceUrl,
        ?string $sourceFilePath,
        array $projectData,
        array $confirmData
    ): void {
        if (!in_array($sourceType, ['pdf', 'url', 'text'], true)) {
            return;
        }

        try {
            $db = \App\Config\Database::getInstance()->getConnection();

            $name = $projectData['title'] ?? 'Patron importé';
            $baseData = [
                'user_id' => $userId,
                'category' => $projectData['category'] ?? null,
                'technique' => $projectData['craft_type'] ?? null,
            ];

            $patternLibraryId = null;

            if ($sourceType === 'pdf' && $sourceFilePath) {
                $absoluteSource = __DIR__ . '/../public' . $sourceFilePath;
                if (file_exists($absoluteSource)) {
                    $patternLibraryId = $this->findPdfInLibrary($userId, $absoluteSource);
                    if (!$patternLibraryId) {
                        $patternsDir = __DIR__ . '/../public/uploads/patterns';
                        $filename = 'library_' . uniqid() . '.pdf';
                        if (copy($absoluteSource, $patternsDir . '/' . $filename)) {
                            $patternLibraryId = $this->patternLibraryModel->createPattern($baseData + [
                                'name' => $name,
                                'source_type' => 'file',
                                'file_path' => '/uploads/patterns/' . $filename,
                                'file_type' => 'pdf',
                            ]) ?: null;
                        }
                    }
                }
            } elseif ($sourceType === 'url' && $sourceUrl) {
                $patternLibraryId = $this->findInLibraryByExactMatch($userId, 'url', $sourceUrl)
                    ?? ($this->patternLibraryModel->createPattern($baseData + [
                        'name' => $name,
                        'source_type' => 'url',
                        'url' => $sourceUrl,
                    ]) ?: null);
            } elseif ($sourceType === 'text' && !empty($confirmData['pattern_text'])) {
                $text = trim($confirmData['pattern_text']);
                $patternLibraryId = $this->findInLibraryByExactMatch($userId, 'pattern_text', $text)
                    ?? ($this->patternLibraryModel->createPattern($baseData + [
                        'name' => $name,
                        'source_type' => 'text',
                        'pattern_text' => $text,
                    ]) ?: null);
            }

            // En plus, la traduction attachée à cette même fiche si l'aperçu a été traduit
            if ($patternLibraryId && $importId) {
                $stmt = $db->prepare('SELECT translated_text, translated_lang FROM ai_pattern_imports WHERE id = :id AND user_id = :uid');
                $stmt->execute(['id' => $importId, 'uid' => $userId]);
                $row = $stmt->fetch(\PDO::FETCH_ASSOC);

                if (!empty($row['translated_text'])) {
                    $this->patternLibraryModel->updatePattern($patternLibraryId, [
                        'translated_text' => $row['translated_text'],
                        'translated_lang' => $row['translated_lang'],
                    ]);
                }
            }
        } catch (\Exception $e) {
            error_log('[SmartProject] Erreur saveImportToLibrary: ' . $e->getMessage());
        }
    }

    /**
     * [AI:Claude] Dédup par valeur exacte sur une colonne texte de pattern_library (url ou
     * pattern_text) — $column n'est jamais une entrée utilisateur, toujours un littéral passé
     * par saveImportToLibrary(), donc pas d'injection possible malgré l'interpolation directe.
     *
     * @return int|null ID de la fiche existante, ou null si aucune
     */
    private function findInLibraryByExactMatch(int $userId, string $column, string $value): ?int
    {
        if (!in_array($column, ['url', 'pattern_text'], true)) {
            return null;
        }

        $db = \App\Config\Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id FROM pattern_library WHERE user_id = :uid AND {$column} = :value LIMIT 1");
        $stmt->execute(['uid' => $userId, 'value' => $value]);
        $id = $stmt->fetchColumn();
        return $id ? (int)$id : null;
    }

    /**
     * [AI:Claude] Dédup PDF par hash du contenu du fichier — le nom change à chaque copie
     * (uniqid()), seul le contenu permet de détecter qu'un même patron a déjà été enregistré.
     *
     * @return int|null ID de la fiche existante, ou null si aucune
     */
    private function findPdfInLibrary(int $userId, string $newFilePath): ?int
    {
        $db = \App\Config\Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, file_path FROM pattern_library WHERE user_id = :uid AND source_type = 'file' AND file_type = 'pdf'");
        $stmt->execute(['uid' => $userId]);

        $newHash = hash_file('sha256', $newFilePath);

        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $existing) {
            $existingAbsPath = __DIR__ . '/../public' . $existing['file_path'];
            if (file_exists($existingAbsPath) && hash_file('sha256', $existingAbsPath) === $newHash) {
                return (int)$existing['id'];
            }
        }

        return null;
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
        ?string $patternSize = null,
        ?string $sourceHash = null
    ): ?int {
        try {
            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare("
                INSERT INTO ai_pattern_imports
                (user_id, project_id, source_type, source_name, source_file_path, pattern_size, source_hash, file_size_bytes, ai_status, ai_response_json, processing_time_ms, error_message, ip_address)
                VALUES (:user_id, :project_id, :source_type, :source_name, :source_file_path, :pattern_size, :source_hash, :file_size, :ai_status, :ai_response, :processing_time, :error, :ip)
            ");

            $stmt->execute([
                'user_id' => $userId,
                'project_id' => $projectId,
                'source_type' => $sourceType,
                'source_name' => $sourceName,
                'source_file_path' => $sourceFilePath,
                'pattern_size' => $patternSize,
                'source_hash' => $sourceHash,
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
     * Un import de texte collé n'a pas de nom de fichier ni d'URL. Son libellé doit donc
     * venir du titre extrait, et non des premiers caractères de la page (souvent une bannière).
     */
    private static function resolveImportSourceName(string $sourceType, string $initialName, ?array $analysis): string
    {
        if ($sourceType !== 'text') {
            return $initialName;
        }

        $title = trim((string)($analysis['title'] ?? ''));
        $normalizedTitle = preg_replace('/\s+/u', ' ', $title);

        if (is_string($normalizedTitle) && $normalizedTitle !== '') {
            return mb_substr($normalizedTitle, 0, 500);
        }

        return 'Texte collé';
    }

    /** Texte source durable à conserver avec le projet, sans reconstruction par le modèle. */
    private static function projectPatternSnapshot(string $sourceType, array $storedAnalysis, ?string $submittedText): ?string
    {
        if ($sourceType === 'url') {
            $source = trim((string)($storedAnalysis['_source_text'] ?? ''));
            return $source !== '' ? $source : null;
        }
        if ($sourceType === 'text') {
            $source = trim((string)($submittedText ?? ($storedAnalysis['_source_text'] ?? '')));
            return $source !== '' ? $source : null;
        }
        return null;
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
