<?php
/**
 * @file PatternLibraryController.php
 * @brief Contrôleur REST pour la bibliothèque de patrons
 * @author Nathalie + AI Assistants
 * @created 2025-11-19
 * @modified 2025-11-19 by [AI:Claude] - Création bibliothèque centralisée patrons
 *
 * @history
 *   2025-11-19 [AI:Claude] Création CRUD bibliothèque patrons avec upload
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\PatternLibrary;
use App\Models\User;
use App\Middleware\AuthMiddleware;
use App\Helpers\SecurityHelper;

class PatternLibraryController
{
    private PatternLibrary $patternLibrary;
    private User $userModel;
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->patternLibrary = new PatternLibrary();
        $this->userModel = new User();
        $this->authMiddleware = new AuthMiddleware();
    }

    /**
     * [AI:Claude] GET /api/pattern-library - Liste des patrons
     *
     * @param array $params Query params (category, technique, favorite, search)
     * @return void JSON response
     */
    public function index(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->checkSubscriptionAccess($userId, false);

            $filters = [
                'category' => $params['category'] ?? null,
                'technique' => $params['technique'] ?? null,
                'source_type' => $params['source_type'] ?? null,
                'favorite' => isset($params['favorite']) && $params['favorite'] === 'true',
                'search' => $params['search'] ?? null,
                'sort' => $params['sort'] ?? 'date_desc'
            ];

            $limit = isset($params['limit']) ? (int)$params['limit'] : 50;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;

            if ($limit > 100)
                $limit = 100;

            $patterns = $this->patternLibrary->getUserPatterns($userId, $filters, $limit, $offset);
            $stats = $this->patternLibrary->getStats($userId);
            $categories = $this->patternLibrary->getUserCategories($userId);

            $this->sendResponse(200, [
                'success' => true,
                'patterns' => $patterns,
                'stats' => $stats,
                'categories' => $categories,
                'count' => count($patterns)
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des patrons',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/pattern-library/{id} - Détails d'un patron
     *
     * @param int $id ID du patron
     * @return void JSON response
     */
    public function show(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->checkSubscriptionAccess($userId, false);

            $pattern = $this->patternLibrary->getPatternById($id);

            if (!$pattern) {
                $this->sendResponse(404, [
                    'success' => false,
                    'error' => 'Patron non trouvé'
                ]);
                return;
            }

            // [AI:Claude] Vérifier que le patron appartient à l'utilisateur
            if (!$this->patternLibrary->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            $this->sendResponse(200, [
                'success' => true,
                'pattern' => $pattern
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/pattern-library - Créer un nouveau patron (upload ou URL)
     *
     * @return void JSON response
     */
    public function create(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->checkSubscriptionAccess($userId, true); // Vérifier la limite lors de la création

            // [AI:Claude] Déterminer si c'est un upload de fichier, une URL, un texte ou un fichier existant
            if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                // Upload de fichier
                $this->handleFileUpload($userId);
            } else {
                // URL, texte ou données JSON
                $data = $this->getJsonInput();

                // [AI:Claude] Nouveau : Référencer un fichier déjà uploadé
                if (!empty($data['existing_file_path'])) {
                    $this->handleExistingFile($userId, $data);
                } elseif (!empty($data['source_type']) && $data['source_type'] === 'text') {
                    // [AI:Claude] Patron texte (copier-coller)
                    $this->handleTextPattern($userId, $data);
                } else {
                    // [AI:Claude] Patron URL par défaut
                    $this->handleUrlPattern($userId, $data);
                }
            }
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la création du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] PUT /api/pattern-library/{id} - Mettre à jour un patron
     *
     * @param int $id ID du patron
     * @return void JSON response
     */
    public function update(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->checkSubscriptionAccess($userId, false);

            // [AI:Claude] Vérifier que le patron appartient à l'utilisateur
            if (!$this->patternLibrary->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] DEBUG: Logger les infos de la requête
            error_log('[PatternLibrary UPDATE] Pattern ID: ' . $id);
            error_log('[PatternLibrary UPDATE] Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
            error_log('[PatternLibrary UPDATE] Has FILES: ' . (isset($_FILES['file']) ? 'yes' : 'no'));

            // [AI:Claude] Gérer upload fichier ou données JSON
            if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
                // Upload de fichier pour mise à jour
                error_log('[PatternLibrary UPDATE] Handling file upload');
                $this->handleFileUpdateWithUpload($id, $userId);
            } else {
                // Mise à jour JSON (sans changement de fichier)
                error_log('[PatternLibrary UPDATE] Handling JSON update');
                $data = $this->getJsonInput();
                error_log('[PatternLibrary UPDATE] Data received: ' . json_encode($data));
                $success = $this->patternLibrary->updatePattern($id, $data);

                if (!$success) {
                    $this->sendResponse(400, [
                        'success' => false,
                        'error' => 'Aucune modification à effectuer'
                    ]);
                    return;
                }

                $pattern = $this->patternLibrary->getPatternById($id);

                $this->sendResponse(200, [
                    'success' => true,
                    'message' => 'Patron mis à jour avec succès',
                    'pattern' => $pattern
                ]);
            }
        } catch (\InvalidArgumentException $e) {
            $this->sendResponse(400, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la mise à jour du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/pattern-library/{id}/file - Télécharger/afficher le fichier
     *
     * @param int $id ID du patron
     * @return void Fichier binaire
     */
    public function downloadFile(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->checkSubscriptionAccess($userId, false);

            // [AI:Claude] Vérifier que le patron appartient à l'utilisateur
            if (!$this->patternLibrary->belongsToUser($id, $userId)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Accès non autorisé']);
                exit;
            }

            $pattern = $this->patternLibrary->getPatternById($id);

            if (!$pattern || !$pattern['file_path']) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Fichier non trouvé']);
                exit;
            }

            // [AI:Claude] Le file_path commence par /uploads/... donc on ajoute /public
            $filePath = __DIR__.'/../public'.$pattern['file_path'];

            if (!file_exists($filePath)) {
                // [AI:Claude] Tentative alternative : peut-être que file_path est déjà complet
                error_log('[PatternLibrary] File not found at: ' . $filePath);
                error_log('[PatternLibrary] Trying alternative path...');

                // Essayer sans ../public si le chemin est déjà complet
                $alternativePath = __DIR__ . '/..' . $pattern['file_path'];

                if (file_exists($alternativePath)) {
                    $filePath = $alternativePath;
                    error_log('[PatternLibrary] File found at alternative path: ' . $filePath);
                } else {
                    http_response_code(404);
                    error_log('[PatternLibrary] File not found at alternative path either: ' . $alternativePath);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Fichier inexistant sur le serveur',
                        'debug' => [
                            'file_path_db' => $pattern['file_path'],
                            'tried_path_1' => $filePath,
                            'tried_path_2' => $alternativePath
                        ]
                    ]);
                    exit;
                }
            }

            // [AI:Claude] Déterminer le type MIME
            $mimeType = mime_content_type($filePath);
            $filename = basename($filePath);

            // [AI:Claude] SÉCURITÉ: Échapper le filename pour prévenir HTTP Response Splitting
            $safeFilename = SecurityHelper::escapeFilename($filename);

            // [AI:Claude] Headers pour le téléchargement
            header('Content-Type: '.$mimeType);
            header('Content-Disposition: inline; filename="'.$safeFilename.'"');
            header('Content-Length: '.filesize($filePath));
            header('Cache-Control: public, max-age=3600');

            readfile($filePath);
            exit;

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Erreur lors de la récupération du fichier',
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }

    /**
     * [AI:Claude] DELETE /api/pattern-library/{id} - Supprimer un patron
     *
     * @param int $id ID du patron
     * @return void JSON response
     */
    public function delete(int $id): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $this->checkSubscriptionAccess($userId, false);

            // [AI:Claude] Vérifier que le patron appartient à l'utilisateur
            if (!$this->patternLibrary->belongsToUser($id, $userId)) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Récupérer le patron avant suppression pour nettoyer les fichiers
            $pattern = $this->patternLibrary->getPatternById($id);

            $success = $this->patternLibrary->deletePattern($id);

            if (!$success) {
                $this->sendResponse(500, [
                    'success' => false,
                    'error' => 'Erreur lors de la suppression'
                ]);
                return;
            }

            // [AI:Claude] Supprimer les fichiers associés
            if ($pattern && $pattern['file_path']) {
                $this->deletePatternFiles($pattern);
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Patron supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la suppression du patron',
                'message' => $e->getMessage()
            ]);
        }
    }

    // ========================================================================
    // HELPERS PRIVÉS
    // ========================================================================

    /**
     * [AI:Claude] Gérer l'upload d'un fichier patron
     *
     * @param int $userId ID de l'utilisateur
     * @return void
     */
    private function handleFileUpload(int $userId): void
    {
        $file = $_FILES['file'];

        // [AI:Claude] Validation du type de fichier
        $allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($file['type'], $allowedTypes))
            throw new \InvalidArgumentException('Type de fichier non autorisé. Utilisez PDF ou images (JPG, PNG, WEBP)');

        // [AI:Claude] Validation de la taille (max 50MB) - Augmenté le 2025-12-21
        $maxSize = 50 * 1024 * 1024;
        if ($file['size'] > $maxSize)
            throw new \Exception('Fichier trop volumineux (max 50MB)');

        // [AI:Claude] Déterminer le type de fichier et l'extension
        $isPdf = $file['type'] === 'application/pdf';
        $fileType = $isPdf ? 'pdf' : 'image';

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($extension === 'jpg')
            $extension = 'jpeg';

        // [AI:Claude] Créer le dossier d'uploads s'il n'existe pas
        $uploadDir = __DIR__.'/../public/uploads/patterns';
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0755, true);

        // [AI:Claude] Nom de fichier unique
        $filename = 'pattern_'.$userId.'_'.time().'.'.$extension;
        $destination = $uploadDir.'/'.$filename;

        // [AI:Claude] Déplacer le fichier uploadé
        if (!move_uploaded_file($file['tmp_name'], $destination))
            throw new \Exception('Erreur lors de l\'enregistrement du fichier');

        // [AI:Claude] Chemin relatif
        $relativePath = '/uploads/patterns/'.$filename;

        // [AI:Claude] Récupérer les autres données du formulaire
        $name = $_POST['name'] ?? pathinfo($file['name'], PATHINFO_FILENAME);
        $description = $_POST['description'] ?? null;
        $category = $_POST['category'] ?? null;
        $technique = $_POST['technique'] ?? null;
        $difficulty = $_POST['difficulty'] ?? null;
        $notes = $_POST['notes'] ?? null;

        // [AI:Claude] Créer le patron dans la BDD
        $patternData = [
            'user_id' => $userId,
            'name' => $name,
            'description' => $description,
            'source_type' => 'file',
            'file_path' => $relativePath,
            'file_type' => $fileType,
            'url' => null,
            'category' => $category,
            'technique' => $technique,
            'difficulty' => $difficulty,
            'thumbnail_path' => null,
            'tags' => null,
            'notes' => $notes
        ];

        $patternId = $this->patternLibrary->createPattern($patternData);

        if (!$patternId)
            throw new \Exception('Erreur lors de la création du patron');

        $pattern = $this->patternLibrary->getPatternById($patternId);

        $this->sendResponse(201, [
            'success' => true,
            'message' => 'Patron importé avec succès',
            'pattern' => $pattern
        ]);
    }

    /**
     * [AI:Claude] Gérer l'ajout d'un patron via URL
     *
     * @param int $userId ID de l'utilisateur
     * @param array $data Données JSON
     * @return void
     */
    private function handleUrlPattern(int $userId, array $data): void
    {
        // [AI:Claude] Validation de l'URL
        if (empty($data['url']))
            throw new \InvalidArgumentException('URL du patron manquante');

        $url = filter_var($data['url'], FILTER_VALIDATE_URL);
        if ($url === false)
            throw new \InvalidArgumentException('URL invalide');

        if (empty($data['name']))
            throw new \InvalidArgumentException('Le nom du patron est obligatoire');

        // [AI:Claude] Récupérer l'image de preview
        $previewService = new \App\Services\UrlPreviewService();
        $previewImageUrl = $previewService->getPreviewImage($url);

        // [AI:Claude] Créer le patron dans la BDD
        $patternData = [
            'user_id' => $userId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'source_type' => 'url',
            'file_path' => null,
            'file_type' => null,
            'url' => $url,
            'preview_image_url' => $previewImageUrl,
            'category' => $data['category'] ?? null,
            'technique' => $data['technique'] ?? null,
            'difficulty' => $data['difficulty'] ?? null,
            'thumbnail_path' => null,
            'tags' => $data['tags'] ?? null,
            'notes' => $data['notes'] ?? null
        ];

        $patternId = $this->patternLibrary->createPattern($patternData);

        if (!$patternId)
            throw new \Exception('Erreur lors de la création du patron');

        $pattern = $this->patternLibrary->getPatternById($patternId);

        $this->sendResponse(201, [
            'success' => true,
            'message' => 'Patron ajouté avec succès',
            'pattern' => $pattern
        ]);
    }

    /**
     * [AI:Claude] Gérer l'ajout d'un patron texte (copier-coller)
     *
     * @param int $userId ID de l'utilisateur
     * @param array $data Données du patron
     * @return void JSON response
     */
    private function handleTextPattern(int $userId, array $data): void
    {
        // [AI:Claude] Validation du texte
        if (empty($data['pattern_text']))
            throw new \InvalidArgumentException('Le texte du patron est obligatoire');

        if (empty($data['name']))
            throw new \InvalidArgumentException('Le nom du patron est obligatoire');

        // [AI:Claude] Créer le patron dans la BDD
        $patternData = [
            'user_id' => $userId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'source_type' => 'text',
            'file_path' => null,
            'file_type' => null,
            'url' => null,
            'pattern_text' => $data['pattern_text'],
            'preview_image_url' => null,
            'category' => $data['category'] ?? null,
            'technique' => $data['technique'] ?? null,
            'difficulty' => $data['difficulty'] ?? null,
            'thumbnail_path' => null,
            'tags' => $data['tags'] ?? null,
            'notes' => $data['notes'] ?? null
        ];

        $patternId = $this->patternLibrary->createPattern($patternData);

        if (!$patternId)
            throw new \Exception('Erreur lors de la création du patron');

        $pattern = $this->patternLibrary->getPatternById($patternId);

        $this->sendResponse(201, [
            'success' => true,
            'message' => 'Patron texte ajouté avec succès',
            'pattern' => $pattern
        ]);
    }

    /**
     * [AI:Claude] Gérer l'ajout d'un patron depuis un fichier déjà uploadé
     *
     * @param int $userId ID de l'utilisateur
     * @param array $data Données JSON
     * @return void
     */
    private function handleExistingFile(int $userId, array $data): void
    {
        // [AI:Claude] Validation
        if (empty($data['existing_file_path']))
            throw new \InvalidArgumentException('Chemin du fichier manquant');

        if (empty($data['name']))
            throw new \InvalidArgumentException('Le nom du patron est obligatoire');

        $filePath = $data['existing_file_path'];

        // [AI:Claude] Vérifier que le fichier existe
        $fullPath = __DIR__.'/../public'.$filePath;
        if (!file_exists($fullPath))
            throw new \InvalidArgumentException('Le fichier n\'existe pas');

        // [AI:Claude] Déterminer le type de fichier
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $fileType = match($extension) {
            'pdf' => 'pdf',
            'jpg', 'jpeg', 'png', 'webp' => 'image',
            default => throw new \InvalidArgumentException('Type de fichier non supporté')
        };

        // [AI:Claude] Créer le patron dans la BDD
        $patternData = [
            'user_id' => $userId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'source_type' => 'file',
            'file_path' => $filePath,
            'file_type' => $fileType,
            'url' => null,
            'category' => $data['category'] ?? null,
            'technique' => $data['technique'] ?? null,
            'difficulty' => $data['difficulty'] ?? null,
            'thumbnail_path' => null,
            'tags' => $data['tags'] ?? null,
            'notes' => $data['notes'] ?? null
        ];

        $patternId = $this->patternLibrary->createPattern($patternData);

        if (!$patternId)
            throw new \Exception('Erreur lors de la création du patron');

        $pattern = $this->patternLibrary->getPatternById($patternId);

        $this->sendResponse(201, [
            'success' => true,
            'message' => 'Patron ajouté à votre bibliothèque avec succès',
            'pattern' => $pattern
        ]);
    }

    /**
     * [AI:Claude] Gérer la mise à jour avec upload de nouveau fichier
     *
     * @param int $id ID du patron
     * @param int $userId ID de l'utilisateur
     * @return void
     */
    private function handleFileUpdateWithUpload(int $id, int $userId): void
    {
        $file = $_FILES['file'];

        // [AI:Claude] Validation du type de fichier
        $allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ];

        if (!in_array($file['type'], $allowedTypes))
            throw new \InvalidArgumentException('Type de fichier non autorisé. Utilisez PDF ou images (JPG, PNG, WEBP)');

        // [AI:Claude] Validation de la taille (max 50MB)
        $maxSize = 50 * 1024 * 1024;
        if ($file['size'] > $maxSize)
            throw new \Exception('Fichier trop volumineux (max 50MB)');

        // [AI:Claude] Déterminer le type de fichier et l'extension
        $isPdf = $file['type'] === 'application/pdf';
        $fileType = $isPdf ? 'pdf' : 'image';

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($extension === 'jpg')
            $extension = 'jpeg';

        // [AI:Claude] Créer le dossier d'uploads s'il n'existe pas
        $uploadDir = __DIR__.'/../public/uploads/patterns';
        if (!is_dir($uploadDir))
            mkdir($uploadDir, 0755, true);

        // [AI:Claude] Nom de fichier unique
        $filename = 'pattern_'.$userId.'_'.time().'.'.$extension;
        $destination = $uploadDir.'/'.$filename;

        // [AI:Claude] Déplacer le fichier uploadé
        if (!move_uploaded_file($file['tmp_name'], $destination))
            throw new \Exception('Erreur lors de l\'enregistrement du fichier');

        // [AI:Claude] Chemin relatif
        $relativePath = '/uploads/patterns/'.$filename;

        // [AI:Claude] Récupérer les autres données du formulaire
        $updateData = [
            'name' => $_POST['name'] ?? null,
            'description' => $_POST['description'] ?? null,
            'category' => $_POST['category'] ?? null,
            'technique' => $_POST['technique'] ?? null,
            'difficulty' => $_POST['difficulty'] ?? null,
            'notes' => $_POST['notes'] ?? null,
            'source_type' => 'file',
            'file_path' => $relativePath,
            'file_type' => $fileType,
            'url' => null,
            'pattern_text' => null
        ];

        // [AI:Claude] Supprimer l'ancien fichier
        $oldPattern = $this->patternLibrary->getPatternById($id);
        if ($oldPattern && $oldPattern['file_path']) {
            $this->deletePatternFiles($oldPattern);
        }

        // [AI:Claude] Mettre à jour le patron
        $success = $this->patternLibrary->updatePattern($id, $updateData);

        if (!$success)
            throw new \Exception('Erreur lors de la mise à jour du patron');

        $pattern = $this->patternLibrary->getPatternById($id);

        $this->sendResponse(200, [
            'success' => true,
            'message' => 'Patron mis à jour avec succès',
            'pattern' => $pattern
        ]);
    }

    /**
     * [AI:Claude] Supprimer les fichiers d'un patron
     *
     * @param array $pattern Données du patron
     * @return void
     */
    private function deletePatternFiles(array $pattern): void
    {
        $basePath = __DIR__.'/../../';

        if ($pattern['file_path'] && file_exists($basePath.$pattern['file_path']))
            unlink($basePath.$pattern['file_path']);

        if ($pattern['thumbnail_path'] && file_exists($basePath.$pattern['thumbnail_path']))
            unlink($basePath.$pattern['thumbnail_path']);
    }

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
     * [AI:Claude] Vérifier l'accès à la bibliothèque de patrons
     * v0.16.0+ : Patrons illimités pour tous les plans
     *
     * @param int $userId ID de l'utilisateur
     * @param bool $isCreating True si on crée un nouveau patron (pour vérifier la limite)
     * @return void
     * @throws \Exception Si utilisateur introuvable
     */
    private function checkSubscriptionAccess(int $userId, bool $isCreating = false): void
    {
        $user = $this->userModel->findById($userId);

        if (!$user)
            throw new \Exception('Utilisateur introuvable');

        // [AI:Claude] Patrons illimités pour tous les plans (v0.16.0+)
        // Pas de limite sur les patrons de la bibliothèque
        // Les limites s'appliquent uniquement aux projets actifs (3/7/illimité selon plan)
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

        // [AI:Claude] Si le body est vide, retourner un tableau vide (requête valide sans body)
        if (empty($json) || trim($json) === '') {
            return [];
        }

        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('[PatternLibrary] JSON decode error: ' . json_last_error_msg());
            error_log('[PatternLibrary] JSON received: ' . substr($json, 0, 200));
            throw new \InvalidArgumentException('JSON invalide: ' . json_last_error_msg());
        }

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
