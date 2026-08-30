<?php
/**
 * @file ProjectController.php
 * @brief Contrôleur REST pour la gestion des projets de crochet et compteur de rangs
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-18 by [AI:Claude] - Ajout système de sections/parties de projet
 *
 * @history
 *   2025-11-18 [AI:Claude] Ajout endpoints gestion sections (face, dos, manches, etc.)
 *   2025-11-16 [AI:Claude] Ajout endpoints uploadPattern() et savePatternUrl()
 *   2025-11-13 [AI:Claude] Création initiale avec endpoints CRUD + compteur
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Middleware\AuthMiddleware;
use App\Services\PatternStorageService;
use App\Services\StripeService;
use App\Services\EmailService;
use App\Services\AnalyticsService;

class ProjectController
{
    private Project $projectModel;
    private User $userModel;
    private AuthMiddleware $authMiddleware;
    private PatternStorageService $patternStorage;

    // [AI:Claude] Gamification — récompense pour une série de 7 jours,
    // octroyée une seule fois par compte (voir streak7_bonus_granted_at).
    // Un code promo (pas des crédits offerts) pour pousser vers la conversion
    // plutôt que retenir gratuitement des utilisatrices déjà engagées.
    private const STREAK_BONUS_THRESHOLD = 7;

    public function __construct()
    {
        $this->projectModel   = new Project();
        $this->userModel      = new User();
        $this->authMiddleware = new AuthMiddleware();
        $this->patternStorage = new PatternStorageService();
    }

    /**
     * [AI:Claude] Récompense pour une série de 7 jours consécutifs : un code
     * promo Stripe à usage unique, envoyé par email. Une seule fois par
     * compte. Appelé après chaque ajout de rang.
     *
     * Volontairement isolée derrière son propre try/catch : un souci Stripe/email
     * ne doit jamais faire échouer l'ajout de rang lui-même (déjà en base à ce
     * stade) — au pire on manque une récompense, on ne casse jamais le compteur.
     *
     * @param int $userId ID de l'utilisateur
     * @return string|null Le code promo si c'est le cas, sinon null
     */
    private function grantStreakBonusIfEligible(int $userId): ?string
    {
        try {
            $db = \App\Config\Database::getInstance()->getConnection();

            // [AI:Claude] Vérif bon marché d'abord — évite de recalculer la série
            // (requête sur 365 jours) pour les comptes qui ont déjà leur récompense
            $alreadyGranted = $db->prepare(
                "SELECT 1 FROM users WHERE id = :user_id AND streak7_bonus_granted_at IS NOT NULL"
            );
            $alreadyGranted->execute([':user_id' => $userId]);
            if ($alreadyGranted->fetch()) {
                return null;
            }

            $streak = $this->projectModel->getStreakStatus($userId);
            if ($streak['current_streak'] < self::STREAK_BONUS_THRESHOLD) {
                return null;
            }

            $stmt = $db->prepare(
                "UPDATE users SET streak7_bonus_granted_at = NOW()
                 WHERE id = :user_id AND streak7_bonus_granted_at IS NULL"
            );
            $stmt->execute([':user_id' => $userId]);

            // [AI:Claude] rowCount() = 0 signifie que le bonus a déjà été octroyé
            // avant (protège contre un double octroi en cas d'appels concurrents)
            if ($stmt->rowCount() === 0) {
                return null;
            }

            $promoCode = (new StripeService())->createOneTimePromoCode($userId);
            if ($promoCode === null) {
                // [AI:Claude] Coupon Stripe pas configuré ou erreur API : on annule
                // le flag pour retenter au prochain rang plutôt que de perdre la récompense
                $db->prepare("UPDATE users SET streak7_bonus_granted_at = NULL WHERE id = :user_id")
                   ->execute([':user_id' => $userId]);
                return null;
            }

            $user = $this->userModel->findById($userId);
            if ($user) {
                (new EmailService($db))->sendStreakRewardEmail(
                    $user['email'],
                    $user['first_name'] ?? 'Utilisatrice',
                    $promoCode,
                    $userId
                );
            }

            return $promoCode;
        } catch (\Throwable $e) {
            error_log('[grantStreakBonusIfEligible] Erreur non bloquante : ' . $e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] GET /api/projects - Liste des projets de l'utilisateur (v0.15.0 - avec filtres tags/favoris)
     *
     * @param array $params Query params (status, favorite, tags, sort, limit, offset)
     * @return void JSON response
     */
    public function index(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Paramètres de filtrage
            $status = $params['status'] ?? null;
            $favorite = isset($params['favorite']) ? filter_var($params['favorite'], FILTER_VALIDATE_BOOLEAN) : null;
            $tags = isset($params['tags']) ? explode(',', $params['tags']) : [];
            $sort = $params['sort'] ?? 'date_desc';
            $limit = isset($params['limit']) ? (int)$params['limit'] : 50;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;

            // [AI:Claude] Validation des paramètres
            if ($limit > 100)
                $limit = 100;

            // [AI:Claude] Construction de la requête avec filtres (v0.16.1 - FIX: LEFT JOIN pour afficher section courante)
            $db = \App\Config\Database::getInstance()->getConnection();

            $query = "SELECT p.*,
                      CONCAT(
                          FLOOR(
                              CASE
                                  WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                      COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                                  ELSE p.total_time
                              END / 3600
                          ), 'h ',
                          FLOOR(
                              (CASE
                                  WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                      COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                                  ELSE p.total_time
                              END % 3600) / 60
                          ), 'min ',
                          (CASE
                              WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                  COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                              ELSE p.total_time
                          END % 60), 'sec'
                      ) as time_formatted,
                      CASE
                          WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                              (SELECT CASE
                                  WHEN SUM(total_rows) > 0 THEN ROUND((SUM(current_row) / SUM(total_rows)) * 100, 1)
                                  ELSE NULL
                              END FROM project_sections WHERE project_id = p.id)
                          WHEN p.total_rows IS NOT NULL THEN ROUND((p.current_row / p.total_rows) * 100, 1)
                          ELSE NULL
                      END as completion_percentage,
                      CASE
                          WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                              COALESCE((SELECT SUM(current_row) FROM project_sections WHERE project_id = p.id), 0)
                          ELSE p.current_row
                      END as current_row,
                      CASE
                          WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                              (SELECT SUM(total_rows) FROM project_sections WHERE project_id = p.id)
                          ELSE p.total_rows
                      END as total_rows,
                      ps.name as current_section_name,
                      ps.current_row as current_section_row,
                      ps.total_rows as current_section_total_rows,
                      (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) as sections_count
                      FROM projects p
                      LEFT JOIN project_sections ps ON p.current_section_id = ps.id";

            // [AI:Claude] JOIN pour filtrer par tags
            if (!empty($tags)) {
                $query .= " INNER JOIN project_tags pt ON p.id = pt.project_id";
            }

            $query .= " WHERE p.user_id = :user_id";

            $bindings = ['user_id' => $userId];

            // [AI:Claude] Filtre par statut
            if ($status !== null) {
                $query .= " AND p.status = :status";
                $bindings['status'] = $status;
            }

            // [AI:Claude] Filtre par favori
            if ($favorite !== null) {
                $query .= " AND p.is_favorite = :is_favorite";
                $bindings['is_favorite'] = $favorite ? 1 : 0;
            }

            // [AI:Claude] Filtre par tags (OR : au moins un tag match)
            if (!empty($tags)) {
                $tagPlaceholders = [];
                foreach ($tags as $index => $tag) {
                    $tagPlaceholders[] = ":tag_$index";
                    $bindings["tag_$index"] = trim($tag);
                }
                $query .= " AND pt.tag_name IN (" . implode(', ', $tagPlaceholders) . ")";
            }

            // [AI:Claude] GROUP BY pour éviter les doublons dus aux JOINs
            $query .= " GROUP BY p.id";

            // [AI:Claude] Tri
            $orderBy = match($sort) {
                'name_asc' => 'p.name ASC',
                'name_desc' => 'p.name DESC',
                'date_asc' => 'p.created_at ASC',
                'date_desc' => 'p.created_at DESC',
                'updated_asc' => 'p.updated_at ASC',
                'updated_desc' => 'p.updated_at DESC',
                default => 'p.updated_at DESC'
            };

            $query .= " ORDER BY $orderBy LIMIT :limit OFFSET :offset";

            $stmt = $db->prepare($query);

            // [AI:Claude] Bind des paramètres
            foreach ($bindings as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, \PDO::PARAM_INT);

            $stmt->execute();
            $projects = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // [AI:Claude] Ajouter les tags à chaque projet (si l'utilisateur a accès)
            if ($this->userModel->canUseTags($userId)) {
                foreach ($projects as &$project) {
                    $tagQuery = "SELECT tag_name FROM project_tags WHERE project_id = :project_id ORDER BY created_at ASC";
                    $tagStmt = $db->prepare($tagQuery);
                    $tagStmt->execute(['project_id' => $project['id']]);
                    $project['tags'] = array_column($tagStmt->fetchAll(\PDO::FETCH_ASSOC), 'tag_name');
                }
            }

            $this->sendResponse(200, [
                'success' => true,
                'projects' => $projects,
                'count' => count($projects),
                'filters' => [
                    'status' => $status,
                    'favorite' => $favorite,
                    'tags' => $tags,
                    'sort' => $sort
                ]
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des projets',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects - Créer un nouveau projet
     *
     * @return void JSON response
     */
    public function create(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Validation des champs obligatoires
            if (empty($data['name']))
                throw new \InvalidArgumentException('Le nom du projet est obligatoire');

            if (empty($data['type']))
                throw new \InvalidArgumentException('La catégorie du projet est obligatoire');

            // [AI:Claude] Vérification des quotas (selon abonnement)
            $user = $this->userModel->findById($userId);
            if (!$user) {
                $this->sendResponse(401, ['success' => false, 'error' => 'Utilisateur introuvable']);
                return;
            }
            $userProjects = $this->projectModel->getUserProjects($userId);

            // [AI:Claude] Compter uniquement les projets ACTIFS (non terminés)
            $activeProjectCount = count(array_filter($userProjects, function($project) {
                return $project['status'] !== 'completed';
            }));

            // [AI:Claude] Debug quota
            error_log("[PROJECT CREATE] User ID: $userId");
            error_log("[PROJECT CREATE] Subscription: ".$user['subscription_type']);
            error_log("[PROJECT CREATE] Active projects: $activeProjectCount");
            error_log("[PROJECT CREATE] Can create: ".($this->canCreateProject($user, $activeProjectCount) ? 'YES' : 'NO'));

            if (!$this->canCreateProject($user, $activeProjectCount)) {
                // [AI:Claude] Déterminer le vrai type d'abonnement (en tenant compte de l'expiration)
                $effectiveSubscription = $user['subscription_type'] ?? 'free';
                if ($effectiveSubscription !== 'free' && isset($user['subscription_expires_at']) && $user['subscription_expires_at'] !== null) {
                    if (strtotime($user['subscription_expires_at']) <= time()) {
                        $effectiveSubscription = 'free'; // Abonnement expiré
                    }
                }

                $maxProjects = match($effectiveSubscription) {
                    'free' => 3,
                    'plus', 'plus_annual' => 7,
                    default => 999
                };

                $subscriptionLabel = $effectiveSubscription;
                if ($effectiveSubscription === 'free' && $user['subscription_type'] !== 'free') {
                    $subscriptionLabel = 'free (abonnement ' . $user['subscription_type'] . ' expiré)';
                }

                $upgradeMessage = $effectiveSubscription === 'free'
                    ? 'Passez à PLUS (2.99€/mois, 7 projets) ou PRO (4.99€/mois, illimité)'
                    : 'Passez à PRO (4.99€/mois) pour des projets illimités';
                throw new \Exception("Quota de projets actifs atteint. Vous avez $activeProjectCount projet(s) actif(s), maximum autorisé: $maxProjects (abonnement: {$subscriptionLabel}). Terminez un projet ou $upgradeMessage.");
            }

            // [AI:Claude] Préparation des données
            $projectData = [
                'user_id' => $userId,
                'name' => $data['name'],
                'technique' => $data['technique'] ?? 'crochet', // [AI:Claude] Yarn Hub v0.9.0
                'type' => $data['type'],
                'description' => $data['description'] ?? null,
                'pattern_id' => $data['pattern_id'] ?? null,
                'main_photo' => $data['main_photo'] ?? null,
                'status' => $data['status'] ?? 'in_progress',
                'total_rows' => $data['total_rows'] ?? null,
                'yarn_brand' => $data['yarn_brand'] ?? null,
                'yarn_color' => $data['yarn_color'] ?? null,
                'yarn_weight' => $data['yarn_weight'] ?? null,
                'hook_size' => $data['hook_size'] ?? null,
                'notes' => $data['notes'] ?? null,
                'technical_details' => $data['technical_details'] ?? null, // [AI:Claude] Détails techniques
                'is_public' => $data['is_public'] ?? false
            ];

            $projectId = $this->projectModel->createProject($projectData);

            if (!$projectId)
                throw new \Exception('Erreur lors de la création du projet');

            $project = $this->projectModel->getProjectById($projectId);

            AnalyticsService::log($userId, $projectId, 'project_created', ['source' => 'manual']);

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Projet créé avec succès',
                'project' => $project
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la création du projet',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/{id} - Détails d'un projet
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function show(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $project = $this->projectModel->getProjectById($id);

            if (!$project) {
                $this->sendResponse(404, [
                    'success' => false,
                    'error' => 'Projet non trouvé'
                ]);
                return;
            }

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();

            // [AI:Claude] v0.15.0 - Ajouter les tags si l'utilisateur a la permission
            if ($this->userModel->canUseTags($userId)) {
                $tagStmt = $db->prepare("SELECT tag_name FROM project_tags WHERE project_id = ? ORDER BY tag_name ASC");
                $tagStmt->execute([$id]);
                $project['tags'] = array_column($tagStmt->fetchAll(\PDO::FETCH_ASSOC), 'tag_name');
            } else {
                $project['tags'] = [];
            }

            // [AI:Claude] Indique si l'assistant contextuel a un patron à lire pour ce projet
            // (via SmartProjectController::analyze() ou ProjectController::linkAiPatternReference())
            // — sert à décider si "Je bloque sur ce rang" ouvre le chat ou propose d'abord
            // d'associer le patron, pour ne pas gaspiller le quota de questions IA sur des
            // réponses qui ne pourraient de toute façon pas être précises.
            $refStmt = $db->prepare('SELECT 1 FROM ai_pattern_imports WHERE project_id = :pid LIMIT 1');
            $refStmt->execute([':pid' => $id]);
            $project['has_ai_pattern_reference'] = (bool)$refStmt->fetchColumn();

            $this->sendResponse(200, [
                'success' => true,
                'project' => $project
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération du projet',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] PUT /api/projects/{id} - Mettre à jour un projet
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function update(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] v0.16.2 - Valider la valeur du compteur selon l'unité
            if (isset($data['current_row'])) {
                $project = $this->projectModel->getProjectById($id);
                $unit = $data['counter_unit'] ?? $project['counter_unit'] ?? 'rows';

                if (!$this->projectModel->validateCounterValue((float)$data['current_row'], $unit)) {
                    $this->sendResponse(400, [
                        'success' => false,
                        'error' => $unit === 'rows'
                            ? 'Les rangs doivent être des nombres entiers'
                            : 'Les centimètres doivent être des multiples de 0.5 (ex: 0.0, 0.5, 1.0, 1.5...)'
                    ]);
                    return;
                }
            }

            $success = $this->projectModel->updateProject($id, $data);

            if (!$success) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Aucune modification à effectuer'
                ]);
                return;
            }

            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Projet mis à jour avec succès',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour du projet',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] DELETE /api/projects/{id} - Supprimer un projet
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function delete(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $success = $this->projectModel->deleteProject($id);

            if (!$success) {
                $this->sendResponse(500, [
                    'success' => false,
                    'error' => 'Erreur lors de la suppression'
                ]);
                return;
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Projet supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression du projet',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/rows - Ajouter un rang au compteur
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function addRow(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] v0.16.2 - Empêcher l'historique en mode cm
            $project = $this->projectModel->getProjectById($id);
            if (($project['counter_unit'] ?? 'rows') === 'cm') {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'L\'historique de rangs n\'est pas disponible en mode centimètres. Utilisez le compteur direct.'
                ]);
                return;
            }

            // [AI:Claude] Validation du numéro de rang
            if (!isset($data['row_number']) || $data['row_number'] < 1)
                throw new \InvalidArgumentException('Numéro de rang invalide');

            $rowData = [
                'row_number' => (int)$data['row_number'],
                'section_id' => $data['section_id'] ?? null,
                'stitch_count' => $data['stitch_count'] ?? null,
                'stitch_type' => $data['stitch_type'] ?? null,
                'duration' => $data['duration'] ?? null,
                'notes' => $data['notes'] ?? null,
                'difficulty_rating' => $data['difficulty_rating'] ?? null,
                'photo' => $data['photo'] ?? null,
                'completed_at' => $data['completed_at'] ?? date('Y-m-d H:i:s'),
                'secondary_count' => isset($data['secondary_count']) ? (int)$data['secondary_count'] : null,
                'secondary_target' => isset($data['secondary_target']) ? (int)$data['secondary_target'] : null,
                'secondary_label' => isset($data['secondary_label']) ? trim($data['secondary_label']) : null,
            ];

            $rowId = $this->projectModel->addRow($id, $rowData);

            if (!$rowId) {
                throw new \Exception('Erreur lors de l\'ajout du rang');
            }

            // [AI:Claude] Récupérer le projet mis à jour (trigger auto-update)
            $project = $this->projectModel->getProjectById($id);

            $streakPromoCode = $this->grantStreakBonusIfEligible($userId);

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Rang ajouté avec succès',
                'row_id' => $rowId,
                'project' => $project,
                'streak_promo_code' => $streakPromoCode
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            error_log("[addRow ERROR] " . $e->getMessage());
            error_log("[addRow TRACE] " . $e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'ajout du rang',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/{id}/rows - Historique des rangs
     *
     * @param int $id ID du projet
     * @param array $params Query params (limit)
     * @return void JSON response
     */
    public function getRows(int $id, array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $limit = isset($params['limit']) ? (int)$params['limit'] : 100;

            if ($limit > 500)
                $limit = 500;

            // [AI:Claude] FIX: Support du filtrage par section_id
            $sectionId = null;
            if (isset($params['section_id']) && $params['section_id'] !== null && $params['section_id'] !== '') {
                $sectionId = (int)$params['section_id'];
            }

            $rows = $this->projectModel->getProjectRows($id, $limit, $sectionId);

            $this->sendResponse(200, [
                'success' => true,
                'rows' => $rows,
                'count' => count($rows)
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération de l\'historique',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] DELETE /api/projects/{id}/rows/{row_id} - Supprimer un rang
     *
     * @param int $id ID du projet
     * @param int $rowId ID du rang à supprimer
     * @return void JSON response
     */
    public function deleteRow(int $id, int $rowId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Supprimer le rang
            $deleted = $this->projectModel->deleteRow($id, $rowId);

            if (!$deleted) {
                throw new \Exception('Erreur lors de la suppression du rang');
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Rang supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            error_log("[deleteRow ERROR] " . $e->getMessage());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression du rang',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] v0.16.2 - PUT /api/projects/{id}/counter-unit - Changer l'unité du compteur
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function switchCounterUnit(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $newUnit = $data['counter_unit'] ?? null;
            if (!in_array($newUnit, ['rows', 'cm'])) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Unité invalide (doit être "rows" ou "cm")']);
                return;
            }

            // Récupérer le projet actuel
            $project = $this->projectModel->getProjectById($id);
            $currentRow = (float)$project['current_row'];

            // Arrondir la valeur actuelle si nécessaire pour la nouvelle unité
            $validValue = $currentRow;
            if ($newUnit === 'rows') {
                // Passer en mode rangs : arrondir à l'entier inférieur
                $validValue = floor($currentRow);
            } elseif ($newUnit === 'cm') {
                // Passer en mode cm : arrondir au multiple de 0.5 le plus proche
                $validValue = round($currentRow * 2) / 2;
            }

            // Mettre à jour l'unité et l'incrément
            $updateData = [
                'counter_unit' => $newUnit,
                'counter_unit_increment' => $newUnit === 'cm' ? 0.5 : 1.0
            ];

            // Si la valeur a été arrondie, l'inclure dans l'update
            if ($validValue != $currentRow) {
                $updateData['current_row'] = $validValue;
            }

            $success = $this->projectModel->updateProject($id, $updateData);

            if (!$success) {
                throw new \Exception('Erreur lors du changement d\'unité');
            }

            $updatedProject = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => "Unité changée en " . ($newUnit === 'rows' ? 'rangs' : 'centimètres'),
                'project' => $updatedProject
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors du changement d\'unité',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/sessions/start - Démarrer une session de travail
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function startSession(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Récupérer section_id si fournie (tracking par section)
            $sectionId = $data['section_id'] ?? null;

            $sessionId = $this->projectModel->startSession($id, $sectionId);

            if (!$sessionId) {
                throw new \Exception('Erreur lors du démarrage de la session');
            }

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Session démarrée',
                'session_id' => $sessionId
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors du démarrage de la session',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/sessions/end - Terminer une session de travail
     *
     * @param int $id ID du projet (pas utilisé mais dans route)
     * @return void JSON response
     */
    public function endSession(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            if (!isset($data['session_id']))
                throw new \InvalidArgumentException('session_id manquant');

            $sessionId = (int)$data['session_id'];
            $rowsCompleted = $data['rows_completed'] ?? 0;
            $notes = $data['notes'] ?? null;
            $duration = isset($data['duration']) ? (int)$data['duration'] : null; // [AI:Claude] Durée exacte du frontend

            $success = $this->projectModel->endSession($sessionId, $rowsCompleted, $notes, $duration);

            if (!$success) {
                throw new \Exception('Erreur lors de la fin de session');
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Session terminée'
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la fin de session',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/stats - Statistiques utilisateur
     *
     * @param array $params Query params (period: week|month|year|all)
     * @return void JSON response
     */
    public function getStats(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $period = $params['period'] ?? 'all';

            // [AI:Claude] Valider le paramètre period
            $validPeriods = ['week', 'month', 'year', 'all'];
            if (!in_array($period, $validPeriods))
                $period = 'all';

            // [AI:Claude] Récupérer les stats selon la période
            $stats = $this->projectModel->getUserStatsByPeriod($userId, $period);

            $this->sendResponse(200, [
                'success' => true,
                'stats' => $stats,
                'period' => $period
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des statistiques',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/public - Galerie communautaire
     *
     * @param array $params Query params (limit, offset)
     * @return void JSON response
     */
    public function getPublicProjects(array $params = []): void
    {
        try {
            $limit = isset($params['limit']) ? (int)$params['limit'] : 20;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;

            if ($limit > 100)
                $limit = 100;

            $projects = $this->projectModel->getPublicProjects($limit, $offset);

            $this->sendResponse(200, [
                'success' => true,
                'projects' => $projects,
                'count' => count($projects)
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération de la galerie',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/pattern - Importer un fichier patron (PDF ou image)
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function uploadPattern(int $id): void
    {
        // [AI:Claude] Log accessible pour debug
        $debugLog = __DIR__.'/../public/upload-debug.log';
        $log = function($msg) use ($debugLog) {
            file_put_contents($debugLog, date('[Y-m-d H:i:s] ').$msg.PHP_EOL, FILE_APPEND);
            error_log($msg);
        };

        try {
            $log("[PATTERN UPLOAD] Début upload pour projet $id");
            $log("[PATTERN UPLOAD] FILES: ".print_r($_FILES, true));
            $log("[PATTERN UPLOAD] POST: ".print_r($_POST, true));

            $userId = $this->getUserIdFromAuth();
            $log("[PATTERN UPLOAD] User ID: $userId");

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $log("[PATTERN UPLOAD] Projet n'appartient pas à l'utilisateur");
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Vérifier qu'un fichier a été uploadé
            if (!isset($_FILES['pattern'])) {
                $log("[PATTERN UPLOAD] Aucun fichier dans \$_FILES");
                throw new \Exception('Aucun fichier uploadé');
            }

            if ($_FILES['pattern']['error'] !== UPLOAD_ERR_OK) {
                $log("[PATTERN UPLOAD] Erreur upload: ".$_FILES['pattern']['error']);
                throw new \Exception('Erreur lors de l\'upload du fichier (code: '.$_FILES['pattern']['error'].')');
            }

            $file = $_FILES['pattern'];
            $patternType = $_POST['pattern_type'] ?? 'pdf';
            $log("[PATTERN UPLOAD] Fichier reçu: {$file['name']}, Type: $patternType");

            // Validation type de fichier
            $allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            $log("[PATTERN UPLOAD] Type MIME: {$file['type']}");
            if (!in_array($file['type'], $allowedTypes)) {
                throw new \Exception('Type de fichier non autorisé. Utilisez PDF ou images (JPG, PNG, WEBP)');
            }

            // Validation taille (PDF 20 MB, image 50 MB) + quota global
            $this->patternStorage->validateFileSize($file);
            $this->patternStorage->assertQuotaNotExceeded($userId, $file['size']);
            $log("[PATTERN UPLOAD] Taille et quota validés");

            // Sauvegarde + compression éventuelle
            $uploadDir    = __DIR__ . '/../public/uploads/patterns';
            $filenameBase = 'project_' . $id . '_' . time() . '_' . bin2hex(random_bytes(4));
            $relativePath = $this->patternStorage->savePatternFile($file, $uploadDir, $filenameBase);
            $log("[PATTERN UPLOAD] Fichier sauvegardé : $relativePath");
            $log("[PATTERN UPLOAD] Mise à jour BDD avec path: $relativePath");

            // [AI:Claude] Fichier et texte s'excluent, mais on garde l'URL si présente
            $success = $this->projectModel->updateProject($id, [
                'pattern_path' => $relativePath,
                'pattern_text' => null
            ]);

            $log("[PATTERN UPLOAD] updateProject result: ".($success ? 'true' : 'false'));

            if (!$success)
                throw new \Exception('Erreur lors de la mise à jour du projet');

            $log("[PATTERN UPLOAD] Récupération projet...");
            $project = $this->projectModel->getProjectById($id);
            $log("[PATTERN UPLOAD] Projet récupéré");

            $log("[PATTERN UPLOAD] Envoi réponse 200...");
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Patron importé avec succès',
                'pattern_path' => $relativePath,
                'project' => $project
            ]);
        } catch (\Exception $e) {
            $log("[PATTERN UPLOAD] EXCEPTION: ".$e->getMessage());
            $log("[PATTERN UPLOAD] Stack trace: ".$e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'import du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/photo - Upload photo principale du projet
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function uploadPhoto(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // Vérifier qu'un fichier a été uploadé
            if (!isset($_FILES['photo'])) {
                throw new \Exception('Aucune photo uploadée');
            }

            if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                throw new \Exception('Erreur lors de l\'upload de la photo (code: '.$_FILES['photo']['error'].')');
            }

            $file = $_FILES['photo'];

            // Validation du type de fichier (images uniquement)
            $allowedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp'
            ];

            if (!in_array($file['type'], $allowedTypes)) {
                throw new \Exception('Type de fichier non autorisé. Utilisez des images (JPG, PNG, WEBP)');
            }

            // Validation de la taille (max 10MB)
            $maxSize = 10 * 1024 * 1024;
            if ($file['size'] > $maxSize) {
                throw new \Exception('Fichier trop volumineux (max 50MB)');
            }

            // Déterminer l'extension
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if ($extension === 'jpg') {
                $extension = 'jpeg';
            }

            // Créer le dossier d'uploads s'il n'existe pas
            $uploadDir = __DIR__.'/../public/uploads/projects';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Nom de fichier unique
            $filename = 'project_'.$id.'_'.time().'.'.$extension;
            $destination = $uploadDir.'/'.$filename;

            // Déplacer le fichier uploadé
            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                throw new \Exception('Erreur lors de l\'enregistrement de la photo');
            }

            // Mettre à jour le projet avec le chemin de la photo (relatif à public/)
            $relativePath = '/uploads/projects/'.$filename;

            // [AI:Claude] Ajouter aussi la photo dans la galerie user_photos
            $db = \App\Config\Database::getInstance()->getConnection();
            $insertPhotoQuery = "INSERT INTO user_photos
                                 (user_id, project_id, original_path, item_name, created_at)
                                 VALUES
                                 (:user_id, :project_id, :original_path, :item_name, NOW())";

            $photoStmt = $db->prepare($insertPhotoQuery);
            $photoStmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
            $photoStmt->bindValue(':project_id', $id, \PDO::PARAM_INT);
            $photoStmt->bindValue(':original_path', $relativePath, \PDO::PARAM_STR);
            $photoStmt->bindValue(':item_name', 'Photo de couverture', \PDO::PARAM_STR);
            $photoStmt->execute();

            $success = $this->projectModel->updateProject($id, [
                'main_photo' => $relativePath
            ]);

            if (!$success) {
                throw new \Exception('Erreur lors de la mise à jour du projet');
            }

            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Photo ajoutée avec succès',
                'main_photo' => $relativePath,
                'project' => $project
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'ajout de la photo',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] PUT /api/projects/{id}/set-cover-photo - Définir une photo IA comme photo de couverture
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function setCoverPhoto(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // Vérifier que le projet appartient à l'utilisateur
            $project = $this->projectModel->getProjectById($id);

            if (!$project || (int)$project['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Projet non trouvé ou accès refusé'
                ]);
                return;
            }

            // Récupérer l'ID de la photo
            if (!isset($data['photo_id'])) {
                throw new \InvalidArgumentException('photo_id requis');
            }

            $photoId = (int)$data['photo_id'];

            // Récupérer la photo depuis user_photos
            $db = \App\Config\Database::getInstance()->getConnection();
            $photoQuery = "SELECT * FROM user_photos WHERE id = :id AND user_id = :user_id";
            $photoStmt = $db->prepare($photoQuery);
            $photoStmt->bindValue(':id', $photoId, \PDO::PARAM_INT);
            $photoStmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
            $photoStmt->execute();
            $photo = $photoStmt->fetch(\PDO::FETCH_ASSOC);

            if (!$photo) {
                throw new \InvalidArgumentException('Photo non trouvée');
            }

            // Utiliser enhanced_path si disponible, sinon original_path
            $photoPath = $photo['enhanced_path'] ?? $photo['original_path'];

            if (!$photoPath) {
                throw new \InvalidArgumentException('Aucun chemin de photo disponible');
            }

            // Mettre à jour le projet
            $success = $this->projectModel->updateProject($id, [
                'main_photo' => $photoPath
            ]);

            if (!$success) {
                throw new \Exception('Erreur lors de la mise à jour du projet');
            }

            $updatedProject = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Photo de couverture mise à jour',
                'main_photo' => $photoPath,
                'project' => $updatedProject
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/pattern-url - Enregistrer un lien vers patron web
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function savePatternUrl(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Validation de l'URL
            if (empty($data['pattern_url']))
                throw new \InvalidArgumentException('URL du patron manquante');

            $url = filter_var($data['pattern_url'], FILTER_VALIDATE_URL);
            if ($url === false)
                throw new \InvalidArgumentException('URL invalide');

            // [AI:Claude] Convertir les liens Dropbox en liens directs
            $url = $this->convertToDirectLink($url);

            // [AI:Claude] Mettre à jour le projet avec l'URL du patron
            // [AI:Claude] Supprimer pattern_text car on change de patron source
            $success = $this->projectModel->updateProject($id, [
                'pattern_url' => $url,
                'pattern_path' => null,
                'pattern_text' => null
            ]);

            if (!$success)
                throw new \Exception('Erreur lors de la mise à jour du projet');

            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Lien du patron enregistré avec succès',
                'pattern_url' => $url,
                'project' => $project
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'enregistrement du lien',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/pattern-text - Enregistrer un texte de patron copié-collé
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function savePatternText(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Validation du texte
            if (empty($data['pattern_text']))
                throw new \InvalidArgumentException('Texte du patron manquant');

            // [AI:Claude] Mettre à jour le projet avec le texte du patron
            $success = $this->projectModel->updateProject($id, [
                'pattern_text' => $data['pattern_text'],
                'pattern_path' => null,
                'pattern_url' => null
            ]);

            if (!$success)
                throw new \Exception('Erreur lors de la mise à jour du projet');

            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Texte du patron enregistré avec succès',
                'project' => $project
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'enregistrement du texte',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/pattern-from-library - Lier un patron de bibliothèque au projet
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function linkPatternFromLibrary(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Validation du pattern_library_id
            if (empty($data['pattern_library_id']))
                throw new \InvalidArgumentException('ID du patron manquant');

            $patternLibraryId = (int)$data['pattern_library_id'];

            // [AI:Claude] Charger le patron de bibliothèque
            $patternLibrary = new \App\Models\PatternLibrary();
            $pattern = $patternLibrary->getPatternById($patternLibraryId);

            if (!$pattern)
                throw new \InvalidArgumentException('Patron introuvable');

            // [AI:Claude] Vérifier que le patron appartient à l'utilisateur
            if (!$patternLibrary->belongsToUser($patternLibraryId, $userId))
                throw new \InvalidArgumentException('Ce patron ne vous appartient pas');

            // [AI:Claude] Mettre à jour le projet avec le patron
            if ($pattern['source_type'] === 'file') {
                $success = $this->projectModel->updateProject($id, [
                    'pattern_library_id' => $patternLibraryId,
                    'pattern_path' => $pattern['file_path'],
                    'pattern_url' => null,
                    'pattern_text' => null
                ]);
            } elseif ($pattern['source_type'] === 'text') {
                $success = $this->projectModel->updateProject($id, [
                    'pattern_library_id' => $patternLibraryId,
                    'pattern_text' => $pattern['pattern_text'],
                    'pattern_path' => null,
                    'pattern_url' => null
                ]);
            } else {
                $success = $this->projectModel->updateProject($id, [
                    'pattern_library_id' => $patternLibraryId,
                    'pattern_url' => $pattern['url'],
                    'pattern_path' => null,
                    'pattern_text' => null
                ]);
            }

            if (!$success)
                throw new \Exception('Erreur lors de la mise à jour du projet');

            // [AI:Claude] Incrémenter le compteur d'utilisation du patron dans la bibliothèque
            $patternLibrary->incrementUsage($patternLibraryId);

            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Patron lié au projet avec succès',
                'project' => $project,
                'pattern' => $pattern
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors du lien du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/link-pattern-reference
     * Associe une analyse IA déjà effectuée (SmartProjectController::analyze(), import_id
     * renvoyé) à un projet EXISTANT — pour que l'assistant contextuel connaisse le patron,
     * typiquement un projet créé à la main. N'écrit jamais dans project_sections/project_rows,
     * qui restent la seule source de vérité de la progression suivie par l'utilisatrice ; le
     * patron associé n'est qu'une référence en lecture seule consultée par l'assistant.
     * Consomme le même quota que la Création Intelligente classique : ce lien est ce qui fait
     * compter l'analyse (voir SmartProjectController::getSmartImportPlan(), filtre
     * `project_id IS NOT NULL` sur ai_pattern_imports).
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function linkAiPatternReference(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            if (empty($data['import_id']))
                throw new \InvalidArgumentException('ID d\'analyse manquant');

            $importId = (int)$data['import_id'];

            $db = \App\Config\Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                'UPDATE ai_pattern_imports SET project_id = :project_id
                 WHERE id = :import_id AND user_id = :user_id'
            );
            $stmt->execute([
                'project_id' => $id,
                'import_id'  => $importId,
                'user_id'    => $userId,
            ]);

            if ($stmt->rowCount() === 0)
                throw new \InvalidArgumentException('Analyse introuvable');

            // [AI:Claude] Même logique que SmartProjectController::confirm() : le patron
            // analysé doit rester consultable dans l'onglet "Patron" du projet, pas juste
            // servir de contexte à l'assistant IA. Ne jamais écraser un patron déjà attaché
            // (ex: ré-analyse volontaire du même document) — uniquement combler l'absence.
            $currentProject = $this->projectModel->getProjectById($id);
            if (empty($currentProject['pattern_path']) && empty($currentProject['pattern_url']) && empty($currentProject['pattern_text'])) {
                $importStmt = $db->prepare(
                    'SELECT source_type, source_name, source_file_path FROM ai_pattern_imports WHERE id = :id'
                );
                $importStmt->execute(['id' => $importId]);
                $import = $importStmt->fetch(\PDO::FETCH_ASSOC);

                if ($import) {
                    if (!empty($import['source_file_path'])) {
                        $this->projectModel->updateProject($id, ['pattern_path' => $import['source_file_path']]);
                    } elseif ($import['source_type'] === 'url' && !empty($import['source_name'])) {
                        $this->projectModel->updateProject($id, ['pattern_url' => $import['source_name']]);
                    } elseif ($import['source_type'] === 'text' && !empty($data['pattern_text'])) {
                        $textUpdate = ['pattern_text' => trim($data['pattern_text'])];
                        // [AI:Claude] Texte collé faute de pouvoir scraper le site (ex: Cloudflare) —
                        // garder le lien d'origine pour le retrouver facilement, même si le contenu
                        // affiché dans l'onglet Patron reste le texte.
                        if (empty($currentProject['source_url']) && !empty($data['source_url'])) {
                            $textUpdate['source_url'] = trim($data['source_url']);
                        }
                        $this->projectModel->updateProject($id, $textUpdate);
                    }
                }
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Patron associé au projet',
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, ['success' => false, 'error' => $e->getMessage()]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'association du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    // ========================================================================
    // [AI:Claude] GESTION DES SECTIONS/PARTIES DE PROJET
    // ========================================================================

    /**
     * [AI:Claude] POST /api/projects/{id}/sections - Créer une section
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function createSection(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Validation du nom de section
            if (empty($data['name']))
                throw new \InvalidArgumentException('Le nom de la section est obligatoire');

            $sectionData = [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'display_order' => $data['display_order'] ?? 0,
                'total_rows' => $data['total_rows'] ?? null,
                'current_row' => $data['current_row'] ?? 0  // [AI:Claude] v0.16.2: Support affectation rangs
            ];

            $sectionId = $this->projectModel->createSection($id, $sectionData);

            if (!$sectionId)
                throw new \Exception('Erreur lors de la création de la section');

            $section = $this->projectModel->getSectionById($sectionId);

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Section créée avec succès',
                'section' => $section
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la création de la section',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/{id}/sections - Liste des sections d'un projet
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function getSections(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $sections = $this->projectModel->getProjectSections($id);

            $this->sendResponse(200, [
                'success' => true,
                'sections' => $sections,
                'count' => count($sections)
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des sections',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] PUT /api/projects/{projectId}/sections/{sectionId} - Mettre à jour une section
     *
     * @param int $projectId ID du projet
     * @param int $sectionId ID de la section
     * @return void JSON response
     */
    public function updateSection(int $projectId, int $sectionId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $success = $this->projectModel->updateSection($sectionId, $data);

            if (!$success) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Aucune modification à effectuer'
                ]);
                return;
            }

            $section = $this->projectModel->getSectionById($sectionId);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Section mise à jour avec succès',
                'section' => $section
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour de la section',
                'message' => $e->getMessage()
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // [AI:Claude] Compteurs secondaires (plusieurs par section ou par projet)
    // -------------------------------------------------------------------------

    /**
     * GET /api/projects/{projectId}/secondary-counters?section_id={id}
     * section_id omis ou vide = compteurs attachés directement au projet (sans section)
     */
    public function getSecondaryCounters(int $projectId, array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $sectionId = isset($params['section_id']) && $params['section_id'] !== ''
                ? (int)$params['section_id']
                : null;

            $counters = $this->projectModel->getSecondaryCounters($projectId, $sectionId);

            $this->sendResponse(200, ['success' => true, 'counters' => $counters]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des compteurs',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/projects/{projectId}/secondary-counters
     * Body: { section_id?: int|null, label: string, target?: int }
     */
    public function addSecondaryCounter(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $data = $this->getJsonInput();

            if (empty($data['label'])) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Le libellé du compteur est requis', 'error_code' => 'counter_label_required']);
                return;
            }

            $sectionId = isset($data['section_id']) && $data['section_id'] !== null
                ? (int)$data['section_id']
                : null;

            $counterData = [
                'label' => trim($data['label']),
                'target' => isset($data['target']) && $data['target'] !== '' ? (int)$data['target'] : null,
            ];
            if (isset($data['sequence'])) {
                $counterData['sequence'] = $data['sequence'];
            }

            $counterId = $this->projectModel->addSecondaryCounter($projectId, $sectionId, $counterData);

            if (!$counterId) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Limite de 10 compteurs secondaires atteinte pour cette section', 'error_code' => 'secondary_counter_limit'
                ]);
                return;
            }

            $counter = $this->projectModel->getSecondaryCounterById($counterId, $projectId);

            $this->sendResponse(201, ['success' => true, 'counter' => $counter]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la création du compteur',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * PUT /api/projects/{projectId}/secondary-counters/{counterId}
     * Body: { label?, target?, count?, sequence? }
     */
    public function updateSecondaryCounter(int $projectId, int $counterId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            if (!$this->projectModel->getSecondaryCounterById($counterId, $projectId)) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Compteur introuvable']);
                return;
            }

            $data = $this->getJsonInput();
            $success = $this->projectModel->updateSecondaryCounter($counterId, $data);

            if (!$success) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Aucune modification à effectuer']);
                return;
            }

            $counter = $this->projectModel->getSecondaryCounterById($counterId, $projectId);

            $this->sendResponse(200, ['success' => true, 'counter' => $counter]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour du compteur',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * DELETE /api/projects/{projectId}/secondary-counters/{counterId}
     */
    public function deleteSecondaryCounter(int $projectId, int $counterId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            if (!$this->projectModel->getSecondaryCounterById($counterId, $projectId)) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Compteur introuvable']);
                return;
            }

            $this->projectModel->deleteSecondaryCounter($counterId);

            $this->sendResponse(200, ['success' => true, 'message' => 'Compteur supprimé']);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression du compteur',
                'message' => $e->getMessage()
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Grilles jacquard/colorwork
    // -------------------------------------------------------------------------

    /**
     * GET /api/projects/{projectId}/charts?section_id={id}
     */
    public function getCharts(int $projectId, array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $sectionId = isset($params['section_id']) && $params['section_id'] !== ''
                ? (int)$params['section_id']
                : null;

            $charts = $this->projectModel->getCharts($projectId, $sectionId);

            $this->sendResponse(200, ['success' => true, 'charts' => $charts]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des grilles',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/charts — toutes les grilles de l'utilisateur, tous
     * projets confondus (vue globale "Mes grilles")
     */
    public function getAllCharts(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $charts = $this->projectModel->getAllChartsForUser($userId);

            $this->sendResponse(200, ['success' => true, 'charts' => $charts]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des grilles',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * GET /api/projects/{projectId}/charts/{chartId}
     */
    public function getChart(int $projectId, int $chartId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $chart = $this->projectModel->getChartById($chartId, $projectId);

            if (!$chart) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Grille introuvable']);
                return;
            }

            $this->sendResponse(200, ['success' => true, 'chart' => $chart]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/projects/{projectId}/charts
     * Body: { section_id?: int|null, name: string, width: int, height: int, palette?: string[] }
     */
    public function createChart(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $data = $this->getJsonInput();

            if (empty($data['name']) || empty($data['width']) || empty($data['height'])) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Nom, largeur et hauteur sont requis', 'error_code' => 'chart_fields_required']);
                return;
            }

            if ((int)$data['width'] > 200 || (int)$data['height'] > 200) {
                $this->sendResponse(400, ['success' => false, 'error' => 'La grille ne peut pas dépasser 200x200 cases', 'error_code' => 'chart_too_large']);
                return;
            }

            $sectionId = isset($data['section_id']) && $data['section_id'] !== null
                ? (int)$data['section_id']
                : null;

            $chartData = [
                'name' => trim($data['name']),
                'width' => (int)$data['width'],
                'height' => (int)$data['height'],
            ];
            if (isset($data['palette'])) {
                $chartData['palette'] = $data['palette'];
            }
            // [AI:Claude] Permet d'enregistrer une grille déjà dessinée (outil
            // "bac à sable" dans Outils) au lieu d'une grille vierge par défaut
            if (isset($data['cells'])) {
                $chartData['cells'] = $data['cells'];
            }
            // [AI:Claude] Rang de la section déjà fait quand la grille démarre (ex: 5
            // rangs unis avant le motif) — voir Project::getChartById pour le calcul.
            if (isset($data['start_row'])) {
                $chartData['start_row'] = (int) $data['start_row'];
            }

            $chartId = $this->projectModel->createChart($projectId, $sectionId, $userId, $chartData);
            $chart = $this->projectModel->getChartById($chartId, $projectId);

            $this->sendResponse(201, ['success' => true, 'chart' => $chart]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la création de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/charts — crée une grille sans projet, juste
     * enregistrée dans "Mes grilles" (ex: depuis l'outil bac à sable, sans
     * vouloir l'associer à un projet tout de suite).
     * Body: { name: string, width: int, height: int, palette?: string[], cells?: array }
     */
    public function createUnassignedChart(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            if (empty($data['name']) || empty($data['width']) || empty($data['height'])) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Nom, largeur et hauteur sont requis', 'error_code' => 'chart_fields_required']);
                return;
            }

            if ((int)$data['width'] > 200 || (int)$data['height'] > 200) {
                $this->sendResponse(400, ['success' => false, 'error' => 'La grille ne peut pas dépasser 200x200 cases', 'error_code' => 'chart_too_large']);
                return;
            }

            $chartData = [
                'name' => trim($data['name']),
                'width' => (int)$data['width'],
                'height' => (int)$data['height'],
            ];
            if (isset($data['palette'])) {
                $chartData['palette'] = $data['palette'];
            }
            if (isset($data['cells'])) {
                $chartData['cells'] = $data['cells'];
            }

            $chartId = $this->projectModel->createChart(null, null, $userId, $chartData);
            $chart = $this->projectModel->getChartByUser($chartId, $userId);

            $this->sendResponse(201, ['success' => true, 'chart' => $chart]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la création de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/charts/{chartId} — grille par ID, appartenance
     * vérifiée directement via user_id (fonctionne avec ou sans projet).
     */
    public function getUnassignedChart(int $chartId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $chart = $this->projectModel->getChartByUser($chartId, $userId);

            if (!$chart) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Grille introuvable']);
                return;
            }

            $this->sendResponse(200, ['success' => true, 'chart' => $chart]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] PUT /api/charts/{chartId} — met à jour une grille en vérifiant
     * l'appartenance via user_id (pas via un projet) ; permet aussi de
     * l'associer à un projet/section (ex: décidé après coup depuis "Mes grilles").
     * Body: { name?, width?, height?, palette?, cells?, project_id?, section_id?, start_row? }
     */
    public function updateUnassignedChart(int $chartId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $existingChart = $this->projectModel->getChartByUser($chartId, $userId);
            if (!$existingChart) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Grille introuvable']);
                return;
            }

            $data = $this->getJsonInput();

            if (array_key_exists('project_id', $data) && $data['project_id'] !== null && $data['project_id'] !== '') {
                $targetProjectId = (int) $data['project_id'];
                if (!$this->projectModel->belongsToUser($targetProjectId, $userId)) {
                    $this->sendResponse(403, ['success' => false, 'error' => 'Le projet cible ne vous appartient pas']);
                    return;
                }
                $data['project_id'] = $targetProjectId;

                if (array_key_exists('section_id', $data) && $data['section_id'] !== null && $data['section_id'] !== '') {
                    $targetSectionId = (int) $data['section_id'];
                    $section = $this->projectModel->getSectionById($targetSectionId);
                    if (!$section || (int) $section['project_id'] !== $targetProjectId) {
                        $this->sendResponse(400, ['success' => false, 'error' => "Cette section n'appartient pas au projet cible"]);
                        return;
                    }
                    $data['section_id'] = $targetSectionId;
                } else {
                    $data['section_id'] = null;
                }
            } else {
                unset($data['project_id'], $data['section_id']);
            }

            $chartUpdated = !empty($data) && $this->projectModel->updateChart($chartId, $data);

            if (!$chartUpdated) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Aucune modification à effectuer']);
                return;
            }

            $chart = $this->projectModel->getChartByUser($chartId, $userId);

            $this->sendResponse(200, ['success' => true, 'chart' => $chart]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * PUT /api/projects/{projectId}/charts/{chartId}
     * Body: { name?, palette?, cells?, current_row? }
     */
    public function updateChart(int $projectId, int $chartId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            $existingChart = $this->projectModel->getChartById($chartId, $projectId);
            if (!$existingChart) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Grille introuvable']);
                return;
            }

            $data = $this->getJsonInput();

            // [AI:Claude] Réassignation à un autre projet/section — une grille peut être
            // réutilisée ailleurs après sa création (ex: même motif sur un autre pull).
            // On vérifie que la cible appartient bien à l'utilisateur avant d'appliquer.
            $targetProjectId = $projectId;
            if (array_key_exists('project_id', $data) && $data['project_id'] !== null) {
                $requestedProjectId = (int) $data['project_id'];
                if ($requestedProjectId !== $projectId) {
                    if (!$this->projectModel->belongsToUser($requestedProjectId, $userId)) {
                        $this->sendResponse(403, ['success' => false, 'error' => 'Le projet cible ne vous appartient pas']);
                        return;
                    }
                    $targetProjectId = $requestedProjectId;
                    $data['project_id'] = $targetProjectId;
                } else {
                    unset($data['project_id']);
                }
            }

            if (array_key_exists('section_id', $data) && $data['section_id'] !== null && $data['section_id'] !== '') {
                $targetSectionId = (int) $data['section_id'];
                $section = $this->projectModel->getSectionById($targetSectionId);
                if (!$section || (int) $section['project_id'] !== $targetProjectId) {
                    $this->sendResponse(400, ['success' => false, 'error' => "Cette section n'appartient pas au projet cible"]);
                    return;
                }
                $data['section_id'] = $targetSectionId;
            } elseif (array_key_exists('section_id', $data)) {
                $data['section_id'] = null;
            }

            // [AI:Claude] Grille liée à une section : le rang courant est piloté par le
            // compteur de la section (source unique, visible aussi sur la page projet),
            // pas par le current_row propre à la grille. On passe par le même chemin
            // que le compteur principal (addRow en mode rangs, écriture directe en mode
            // cm) pour que l'historique/streak reste cohérent entre les deux vues.
            $sectionUpdated = false;
            if (!empty($existingChart['section_id']) && array_key_exists('current_row', $data)) {
                $sectionId = (int) $existingChart['section_id'];
                // [AI:Claude] Un rang de grille correspond au rang (start_row + rang de
                // grille) de la section — la grille ne couvre en général qu'une partie
                // des rangs de la section (ex: 5 rangs unis avant le motif).
                $startRow = (int) ($existingChart['start_row'] ?? 0);
                $requestedRow = $startRow + (int) $data['current_row'];
                // [AI:Claude] On ne doit jamais pousser le compteur de la section au-delà
                // de son propre total, sinon la progression affichée sur la page projet
                // devient aberrante (ex: 60/51).
                if (!empty($existingChart['section_total_rows'])) {
                    $requestedRow = min($requestedRow, (int) $existingChart['section_total_rows']);
                }
                if (($existingChart['section_counter_unit'] ?? 'rows') === 'cm') {
                    $sectionUpdated = $this->projectModel->updateSection($sectionId, ['current_row' => $requestedRow]);
                } else {
                    $sectionUpdated = $this->projectModel->addRow($projectId, [
                        'section_id' => $sectionId,
                        'row_number' => $requestedRow,
                    ]) !== false;
                }
                unset($data['current_row']);
            }

            $chartUpdated = !empty($data) && $this->projectModel->updateChart($chartId, $data);

            if (!$sectionUpdated && !$chartUpdated) {
                $this->sendResponse(400, ['success' => false, 'error' => 'Aucune modification à effectuer']);
                return;
            }

            // [AI:Claude] Si la grille a été réassignée à un autre projet, elle ne se
            // trouve plus sous l'ancien project_id (celui de l'URL) — la relire sous
            // le nouveau, sinon getChartById ne la retrouve plus.
            $chart = $this->projectModel->getChartById($chartId, $targetProjectId);

            $this->sendResponse(200, ['success' => true, 'chart' => $chart]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * DELETE /api/projects/{projectId}/charts/{chartId}
     */
    public function deleteChart(int $projectId, int $chartId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, ['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            if (!$this->projectModel->getChartById($chartId, $projectId)) {
                $this->sendResponse(404, ['success' => false, 'error' => 'Grille introuvable']);
                return;
            }

            $this->projectModel->deleteChart($chartId);

            $this->sendResponse(200, ['success' => true, 'message' => 'Grille supprimée']);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression de la grille',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] DELETE /api/projects/{projectId}/sections/{sectionId} - Supprimer une section
     *
     * @param int $projectId ID du projet
     * @param int $sectionId ID de la section
     * @return void JSON response
     */
    public function deleteSection(int $projectId, int $sectionId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $success = $this->projectModel->deleteSection($sectionId);

            if (!$success) {
                $this->sendResponse(500, [
                    'success' => false,
                    'error' => 'Erreur lors de la suppression'
                ]);
                return;
            }

            // [AI:Claude] Retourner le projet mis à jour avec la nouvelle current_section_id
            $project = $this->projectModel->getProjectById($projectId);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Section supprimée avec succès',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression de la section',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{id}/current-section - Définir la section courante
     *
     * @param int $id ID du projet
     * @return void JSON response
     */
    public function setCurrentSection(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $sectionId = $data['section_id'] ?? null;

            $success = $this->projectModel->setCurrentSection($id, $sectionId);

            if (!$success)
                throw new \Exception('Erreur lors de la définition de la section courante');

            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Section courante mise à jour',
                'project' => $project
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la définition de la section courante',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/{projectId}/sections/{sectionId}/rows - Rangs d'une section
     *
     * @param int $projectId ID du projet
     * @param int $sectionId ID de la section
     * @param array $params Query params (limit)
     * @return void JSON response
     */
    public function getSectionRows(int $projectId, int $sectionId, array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $limit = isset($params['limit']) ? (int)$params['limit'] : 100;

            if ($limit > 500)
                $limit = 500;

            $rows = $this->projectModel->getSectionRows($sectionId, $limit);

            $this->sendResponse(200, [
                'success' => true,
                'rows' => $rows,
                'count' => count($rows)
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des rangs de la section',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/projects/{projectId}/sections/{sectionId}/complete - Marquer section terminée/non terminée
     *
     * @param int $projectId ID du projet
     * @param int $sectionId ID de la section
     * @return void JSON response
     */
    public function toggleSectionComplete(int $projectId, int $sectionId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($projectId, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Récupérer l'état actuel
            $section = $this->projectModel->getSectionById($sectionId);
            if (!$section) {
                $this->sendResponse(404, [
                    'success' => false,
                    'error' => 'Section non trouvée'
                ]);
                return;
            }

            // [AI:Claude] Inverser l'état
            $newState = $section['is_completed'] ? 0 : 1;

            $success = $this->projectModel->updateSection($sectionId, [
                'is_completed' => $newState
            ]);

            if (!$success)
                throw new \Exception('Erreur lors de la mise à jour');

            $updatedSection = $this->projectModel->getSectionById($sectionId);

            $this->sendResponse(200, [
                'success' => true,
                'message' => $newState ? 'Section marquée comme terminée' : 'Section marquée comme non terminée',
                'section' => $updatedSection
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour',
                'message' => $e->getMessage()
            ]);
        }
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * [AI:Claude] Récupérer l'ID utilisateur depuis JWT
     *
     * @return int User ID
     * @throws \Exception Si non authentifié
     */
    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();

        if ($userData === null)
            throw new \Exception('Non authentifié');

        return (int)$userData['user_id'];
    }

    /**
     * [AI:Claude] Vérifier si l'utilisateur peut créer un projet (quotas v0.14.0 - FREE 3, PLUS 7, PRO illimité)
     *
     * @param array $user Données utilisateur
     * @param int $activeCount Nombre de projets ACTIFS (non terminés)
     * @return bool Peut créer ou non
     */
    private function canCreateProject(array $user, int $activeCount): bool
    {
        $subscriptionType = $user['subscription_type'] ?? 'free';

        // [AI:Claude] Vérifier que l'abonnement n'est pas expiré
        if ($subscriptionType !== 'free' && isset($user['subscription_expires_at']) && $user['subscription_expires_at'] !== null) {
            $expiresAt = strtotime($user['subscription_expires_at']);

            if ($expiresAt <= time()) {
                // Abonnement expiré, traiter comme FREE (3 projets actifs max)
                $subscriptionType = 'free';
            }
        }

        // [AI:Claude] Quotas selon le plan
        return match($subscriptionType) {
            'free' => $activeCount < 3,
            'plus', 'plus_annual' => $activeCount < 7,
            // PRO, PRO_ANNUAL, EARLY_BIRD: projets illimités
            default => true
        };
    }

    /**
     * [AI:Claude] Récupérer le JSON du body de la requête
     *
     * @return array Données JSON décodées
     * @throws \InvalidArgumentException Si JSON invalide
     */
    private function getJsonInput(): array
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE)
            throw new \InvalidArgumentException('JSON invalide');

        return $data ?? [];
    }

    /**
     * [AI:Claude] Envoyer une réponse JSON
     *
     * @param int $statusCode Code HTTP
     * @param array $data Données à envoyer
     * @return void
     */
    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * [AI:Claude] Convertir les liens cloud en liens directs
     *
     * Supporte :
     * - Dropbox : dl=0 → dl=1 pour téléchargement direct
     * - Google Drive : conversion vers lien direct
     *
     * @param string $url URL d'origine
     * @return string URL convertie
     */
    private function convertToDirectLink(string $url): string
    {
        // Dropbox : Changer dl=0 en dl=1 pour lien direct
        if (preg_match('/dropbox\.com/', $url)) {
            $url = preg_replace('/(\?|&)dl=0/', '$1dl=1', $url);

            // Si dl=1 n'était pas présent, l'ajouter
            if (strpos($url, 'dl=') === false) {
                $url .= (strpos($url, '?') !== false ? '&' : '?') . 'dl=1';
            }

            error_log("[PATTERN URL] Dropbox converti : $url");
        }

        // Google Drive : Convertir en lien direct
        if (preg_match('/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/', $url, $matches)) {
            $fileId = $matches[1];
            $url = "https://drive.google.com/uc?export=download&id={$fileId}";
            error_log("[PATTERN URL] Google Drive converti : $url");
        }

        return $url;
    }

    // ========================================================================
    // TAGS & FAVORIS (v0.15.0)
    // ========================================================================

    /**
     * [AI:Claude] POST /api/projects/{id}/tags - Ajouter des tags à un projet (PLUS/PRO)
     *
     * @param int $projectId ID du projet
     * @return void JSON response
     */
    public function addTags(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que l'utilisateur a accès aux tags
            if (!$this->userModel->canUseTags($userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Les tags sont réservés aux plans PLUS et PRO',
                    'upgrade_required' => true
                ]);
                return;
            }

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            $project = $this->projectModel->findById($projectId);
            if (!$project || (int)$project['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Projet introuvable ou accès non autorisé'
                ]);
                return;
            }

            $data = $this->getJsonInput();
            $tags = $data['tags'] ?? [];

            if (!is_array($tags) || empty($tags)) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Aucun tag fourni'
                ]);
                return;
            }

            // [AI:Claude] Valider et nettoyer les tags
            $validTags = [];
            foreach ($tags as $tag) {
                $cleanTag = trim(strtolower($tag));

                // [AI:Claude] Validation : 2-50 caractères, alphanumériques + espaces/tirets
                if (strlen($cleanTag) >= 2 && strlen($cleanTag) <= 50 && preg_match('/^[a-z0-9\s\-éèêàâôûç]+$/u', $cleanTag)) {
                    $validTags[] = $cleanTag;
                }
            }

            if (empty($validTags)) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Aucun tag valide (2-50 caractères, lettres/chiffres/espaces/tirets uniquement)', 'error_code' => 'tags_invalid'
                ]);
                return;
            }

            // [AI:Claude] Ajouter les tags en base (ignorer les doublons grâce à UNIQUE KEY)
            $db = \App\Config\Database::getInstance()->getConnection();
            $addedTags = [];

            foreach ($validTags as $tag) {
                try {
                    $query = "INSERT IGNORE INTO project_tags (project_id, tag_name) VALUES (:project_id, :tag_name)";
                    $stmt = $db->prepare($query);
                    $stmt->execute([
                        'project_id' => $projectId,
                        'tag_name' => $tag
                    ]);

                    if ($stmt->rowCount() > 0) {
                        $addedTags[] = $tag;
                    }
                } catch (\PDOException $e) {
                    // [AI:Claude] Ignorer les erreurs de doublon
                    continue;
                }
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => count($addedTags) . ' tag(s) ajouté(s)',
                'tags_added' => $addedTags
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'ajout des tags',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/projects/{id}/tags - Récupérer les tags d'un projet
     *
     * @param int $projectId ID du projet
     * @return void JSON response
     */
    public function getTags(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            $project = $this->projectModel->findById($projectId);
            if (!$project || (int)$project['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Projet introuvable ou accès non autorisé'
                ]);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $query = "SELECT tag_name, created_at FROM project_tags WHERE project_id = :project_id ORDER BY created_at ASC";
            $stmt = $db->prepare($query);
            $stmt->execute(['project_id' => $projectId]);
            $tags = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $this->sendResponse(200, [
                'success' => true,
                'tags' => $tags,
                'count' => count($tags)
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des tags',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] DELETE /api/projects/{id}/tags/{tag_name} - Supprimer un tag
     *
     * @param int $projectId ID du projet
     * @param string $tagName Nom du tag à supprimer
     * @return void JSON response
     */
    public function deleteTag(int $projectId, string $tagName): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            $project = $this->projectModel->findById($projectId);
            if (!$project || (int)$project['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Projet introuvable ou accès non autorisé'
                ]);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();
            $query = "DELETE FROM project_tags WHERE project_id = :project_id AND tag_name = :tag_name";
            $stmt = $db->prepare($query);
            $stmt->execute([
                'project_id' => $projectId,
                'tag_name' => urldecode($tagName)
            ]);

            if ($stmt->rowCount() === 0) {
                $this->sendResponse(404, [
                    'success' => false,
                    'error' => 'Tag introuvable'
                ]);
                return;
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Tag supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression du tag',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/user/tags/popular - Tags populaires pour suggestions
     *
     * @return void JSON response
     */
    public function getPopularTags(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que l'utilisateur a accès aux suggestions
            $features = $this->userModel->getSubscriptionFeatures($userId);
            if (!$features['tag_suggestions']) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Les suggestions de tags sont réservées aux plans PLUS et PRO'
                ]);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();

            // [AI:Claude] Récupérer les 20 tags les plus utilisés par cet utilisateur
            $query = "SELECT pt.tag_name, COUNT(*) as usage_count
                      FROM project_tags pt
                      INNER JOIN projects p ON pt.project_id = p.id
                      WHERE p.user_id = :user_id
                      GROUP BY pt.tag_name
                      ORDER BY usage_count DESC, pt.tag_name ASC
                      LIMIT 20";

            $stmt = $db->prepare($query);
            $stmt->execute(['user_id' => $userId]);
            $tags = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $this->sendResponse(200, [
                'success' => true,
                'popular_tags' => $tags,
                'count' => count($tags)
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des tags populaires',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] PUT /api/projects/{id}/favorite - Toggle favori
     *
     * @param int $projectId ID du projet
     * @return void JSON response
     */
    public function toggleFavorite(int $projectId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            $project = $this->projectModel->findById($projectId);
            if (!$project || (int)$project['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Projet introuvable ou accès non autorisé'
                ]);
                return;
            }

            $db = \App\Config\Database::getInstance()->getConnection();

            // [AI:Claude] Toggle is_favorite
            $newValue = !$project['is_favorite'];
            $query = "UPDATE projects SET is_favorite = :is_favorite WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute([
                'is_favorite' => $newValue,
                'id' => $projectId
            ]);

            $this->sendResponse(200, [
                'success' => true,
                'is_favorite' => $newValue,
                'message' => $newValue ? 'Projet ajouté aux favoris' : 'Projet retiré des favoris'
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la modification du favori',
                'message' => $e->getMessage()
            ]);
        }
    }
}
