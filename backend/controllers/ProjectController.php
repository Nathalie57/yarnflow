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

class ProjectController
{
    private Project $projectModel;
    private User $userModel;
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->projectModel = new Project();
        $this->userModel = new User();
        $this->authMiddleware = new AuthMiddleware();
    }

    /**
     * [AI:Claude] GET /api/projects - Liste des projets de l'utilisateur
     *
     * @param array $params Query params (status, limit, offset)
     * @return void JSON response
     */
    public function index(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $status = $params['status'] ?? null;
            $limit = isset($params['limit']) ? (int)$params['limit'] : 50;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;

            // [AI:Claude] Validation des paramètres
            if ($limit > 100)
                $limit = 100;

            $projects = $this->projectModel->getUserProjects($userId, $status, $limit, $offset);

            $this->sendResponse(200, [
                'success' => true,
                'projects' => $projects,
                'count' => count($projects)
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

            // [AI:Claude] Vérification des quotas (selon abonnement)
            $user = $this->userModel->findById($userId);
            $userProjects = $this->projectModel->getUserProjects($userId);
            $projectCount = count($userProjects);

            // [AI:Claude] Debug quota
            error_log("[PROJECT CREATE] User ID: $userId");
            error_log("[PROJECT CREATE] Subscription: ".$user['subscription_type']);
            error_log("[PROJECT CREATE] Current projects: $projectCount");
            error_log("[PROJECT CREATE] Can create: ".($this->canCreateProject($user, $projectCount) ? 'YES' : 'NO'));

            if (!$this->canCreateProject($user, $projectCount)) {
                $maxProjects = $user['subscription_type'] === 'free' ? 3 : 999;
                throw new \Exception("Quota de projets atteint. Vous avez $projectCount projet(s), maximum autorisé: $maxProjects (abonnement: {$user['subscription_type']}). Passez à Pro (4.99€/mois) pour des projets illimités.");
            }

            // [AI:Claude] Préparation des données
            $projectData = [
                'user_id' => $userId,
                'name' => $data['name'],
                'technique' => $data['technique'] ?? 'crochet', // [AI:Claude] Yarn Hub v0.9.0
                'type' => $data['type'] ?? null,
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
                'is_public' => $data['is_public'] ?? false
            ];

            $projectId = $this->projectModel->createProject($projectData);

            if (!$projectId)
                throw new \Exception('Erreur lors de la création du projet');

            $project = $this->projectModel->getProjectById($projectId);

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

            // [AI:Claude] Validation du numéro de rang
            if (!isset($data['row_number']) || $data['row_number'] < 1)
                throw new \InvalidArgumentException('Numéro de rang invalide');

            $rowData = [
                'row_number' => (int)$data['row_number'],
                'section_id' => $data['section_id'] ?? null, // [AI:Claude] Support des sections
                'stitch_count' => $data['stitch_count'] ?? null,
                'stitch_type' => $data['stitch_type'] ?? null,
                'duration' => $data['duration'] ?? null,
                'notes' => $data['notes'] ?? null,
                'difficulty_rating' => $data['difficulty_rating'] ?? null,
                'photo' => $data['photo'] ?? null,
                'completed_at' => $data['completed_at'] ?? date('Y-m-d H:i:s')
            ];

            $rowId = $this->projectModel->addRow($id, $rowData);

            if (!$rowId) {
                throw new \Exception('Erreur lors de l\'ajout du rang');
            }

            // [AI:Claude] Récupérer le projet mis à jour (trigger auto-update)
            $project = $this->projectModel->getProjectById($id);

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Rang ajouté avec succès',
                'row_id' => $rowId,
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
                'error' => 'Erreur lors de l\'ajout du rang',
                'message' => $e->getMessage()
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

            $rows = $this->projectModel->getProjectRows($id, $limit);

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

            $success = $this->projectModel->endSession($sessionId, $rowsCompleted, $notes);

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
        try {
            error_log("[PATTERN UPLOAD] Début upload pour projet $id");
            error_log("[PATTERN UPLOAD] FILES: ".print_r($_FILES, true));
            error_log("[PATTERN UPLOAD] POST: ".print_r($_POST, true));

            $userId = $this->getUserIdFromAuth();
            error_log("[PATTERN UPLOAD] User ID: $userId");

            // [AI:Claude] Vérifier que le projet appartient à l'utilisateur
            if (!$this->projectModel->belongsToUser($id, $userId)) {
                error_log("[PATTERN UPLOAD] Projet n'appartient pas à l'utilisateur");
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Vérifier qu'un fichier a été uploadé
            if (!isset($_FILES['pattern'])) {
                error_log("[PATTERN UPLOAD] Aucun fichier dans \$_FILES");
                throw new \Exception('Aucun fichier uploadé');
            }

            if ($_FILES['pattern']['error'] !== UPLOAD_ERR_OK) {
                error_log("[PATTERN UPLOAD] Erreur upload: ".$_FILES['pattern']['error']);
                throw new \Exception('Erreur lors de l\'upload du fichier (code: '.$_FILES['pattern']['error'].')');
            }

            $file = $_FILES['pattern'];
            $patternType = $_POST['pattern_type'] ?? 'pdf';
            error_log("[PATTERN UPLOAD] Fichier reçu: {$file['name']}, Type: $patternType");

            // [AI:Claude] Validation du type de fichier
            $allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp'
            ];

            error_log("[PATTERN UPLOAD] Type MIME: {$file['type']}");
            if (!in_array($file['type'], $allowedTypes)) {
                error_log("[PATTERN UPLOAD] Type non autorisé!");
                throw new \Exception('Type de fichier non autorisé. Utilisez PDF ou images (JPG, PNG, WEBP)');
            }
            error_log("[PATTERN UPLOAD] Type validé");

            // [AI:Claude] Validation de la taille (max 10MB)
            $maxSize = 10 * 1024 * 1024;
            error_log("[PATTERN UPLOAD] Taille: {$file['size']} bytes (max: $maxSize)");
            if ($file['size'] > $maxSize)
                throw new \Exception('Fichier trop volumineux (max 10MB)');
            error_log("[PATTERN UPLOAD] Taille validée");

            // [AI:Claude] Déterminer l'extension
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if ($extension === 'jpg')
                $extension = 'jpeg';
            error_log("[PATTERN UPLOAD] Extension: $extension");

            // [AI:Claude] Créer le dossier d'uploads s'il n'existe pas
            $uploadDir = __DIR__.'/../../uploads/patterns';
            error_log("[PATTERN UPLOAD] Upload dir: $uploadDir");
            if (!is_dir($uploadDir)) {
                error_log("[PATTERN UPLOAD] Création dossier...");
                mkdir($uploadDir, 0755, true);
            }
            error_log("[PATTERN UPLOAD] Dossier OK");

            // [AI:Claude] Nom de fichier unique
            $filename = 'pattern_'.$id.'_'.time().'.'.$extension;
            $destination = $uploadDir.'/'.$filename;
            error_log("[PATTERN UPLOAD] Destination: $destination");

            // [AI:Claude] Déplacer le fichier uploadé
            error_log("[PATTERN UPLOAD] Déplacement fichier...");
            if (!move_uploaded_file($file['tmp_name'], $destination)) {
                error_log("[PATTERN UPLOAD] ERREUR move_uploaded_file!");
                throw new \Exception('Erreur lors de l\'enregistrement du fichier');
            }
            error_log("[PATTERN UPLOAD] Fichier déplacé avec succès");

            // [AI:Claude] Mettre à jour le projet avec le chemin du patron
            $relativePath = '/uploads/patterns/'.$filename;
            error_log("[PATTERN UPLOAD] Mise à jour BDD avec path: $relativePath");

            $success = $this->projectModel->updateProject($id, [
                'pattern_path' => $relativePath,
                'pattern_url' => null
            ]);

            error_log("[PATTERN UPLOAD] updateProject result: ".($success ? 'true' : 'false'));

            if (!$success)
                throw new \Exception('Erreur lors de la mise à jour du projet');

            error_log("[PATTERN UPLOAD] Récupération projet...");
            $project = $this->projectModel->getProjectById($id);
            error_log("[PATTERN UPLOAD] Projet récupéré");

            error_log("[PATTERN UPLOAD] Envoi réponse 200...");
            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Patron importé avec succès',
                'pattern_path' => $relativePath,
                'project' => $project
            ]);
        } catch (\Exception $e) {
            error_log("[PATTERN UPLOAD] EXCEPTION: ".$e->getMessage());
            error_log("[PATTERN UPLOAD] Stack trace: ".$e->getTraceAsString());
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'import du patron',
                'message' => $e->getMessage()
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

            // [AI:Claude] Mettre à jour le projet avec l'URL du patron
            $success = $this->projectModel->updateProject($id, [
                'pattern_url' => $url,
                'pattern_path' => null
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
                'display_order' => $data['display_order'] ?? 0,
                'total_rows' => $data['total_rows'] ?? null
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

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Section supprimée avec succès'
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
     * [AI:Claude] Vérifier si l'utilisateur peut créer un projet (quotas v0.12.0 - Final)
     *
     * @param array $user Données utilisateur
     * @param int $currentCount Nombre de projets actuels
     * @return bool Peut créer ou non
     */
    private function canCreateProject(array $user, int $currentCount): bool
    {
        // [AI:Claude] Free: 3 projets max
        if ($user['subscription_type'] === 'free')
            return $currentCount < 3;

        // [AI:Claude] Pro: illimité
        // Legacy support: tous les anciens plans sont considérés comme 'pro'
        return true;
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
}
