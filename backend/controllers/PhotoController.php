<?php
/**
 * @file PhotoController.php
 * @brief Contrôleur REST API pour AI Photo Studio
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création API photos IA
 *
 * @history
 *   2025-11-14 [AI:Claude] Création contrôleur galerie + génération IA
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Services\AIPhotoService;
use App\Services\CreditManager;
use App\Middleware\AuthMiddleware;
use App\Helpers\SecurityHelper;
use App\Config\Database;
use PDO;

class PhotoController
{
    private PDO $db;
    private AIPhotoService $photoService;
    private CreditManager $creditManager;
    private User $userModel;
    private AuthMiddleware $authMiddleware;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->photoService = new AIPhotoService();
        $this->creditManager = new CreditManager();
        $this->userModel = new User();
        $this->authMiddleware = new AuthMiddleware();
    }

    /**
     * [AI:Claude] GET /api/photos - Liste des photos de l'utilisateur
     *
     * @param array $params Query params (project_id, limit, offset)
     * @return void JSON response
     */
    public function index(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $projectId = isset($params['project_id']) ? (int)$params['project_id'] : null;
            $limit = isset($params['limit']) ? (int)$params['limit'] : 50;
            $offset = isset($params['offset']) ? (int)$params['offset'] : 0;

            if ($limit > 100)
                $limit = 100;

            $photos = $this->getUserPhotos($userId, $projectId, $limit, $offset);

            $this->sendResponse(200, [
                'success' => true,
                'photos' => $photos,
                'count' => count($photos)
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/photos/upload - Upload photo originale
     *
     * @return void JSON response
     */
    public function upload(): void
    {
        try {
            error_log("[PHOTO UPLOAD] Début upload");
            error_log("[PHOTO UPLOAD] FILES: " . json_encode($_FILES));
            error_log("[PHOTO UPLOAD] POST: " . json_encode($_POST));

            $userId = $this->getUserIdFromAuth();
            error_log("[PHOTO UPLOAD] User ID: $userId");

            // [AI:Claude] Vérifier le fichier uploadé
            if (!isset($_FILES['photo'])) {
                error_log("[PHOTO UPLOAD] ERREUR: Fichier photo manquant");
                throw new \InvalidArgumentException('Fichier photo manquant');
            }

            $file = $_FILES['photo'];
            error_log("[PHOTO UPLOAD] File error code: " . $file['error']);

            if ($file['error'] !== UPLOAD_ERR_OK) {
                error_log("[PHOTO UPLOAD] ERREUR Upload: " . $file['error']);
                throw new \Exception('Erreur lors de l\'upload - Code: ' . $file['error']);
            }

            // [AI:Claude] Valider le fichier de manière sécurisée
            $this->validateImageFile($file);

            // [AI:Claude] Sauvegarder le fichier
            $originalPath = $this->saveUploadedFile($file, $userId);

            // [AI:Claude] Récupérer les métadonnées
            $data = $_POST;
            $projectId = isset($data['project_id']) ? (int)$data['project_id'] : null;

            // [AI:Claude] Enregistrer en base
            $photoId = $this->createPhotoRecord($userId, $projectId, $originalPath, $data);

            $photo = $this->getPhotoById($photoId);

            $this->sendResponse(201, [
                'success' => true,
                'message' => 'Photo uploadée avec succès',
                'photo' => $photo
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/photos/{id}/enhance - Embellir avec IA
     *
     * @param int $photoId ID de la photo
     * @return void JSON response
     */
    public function enhance(int $photoId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que la photo appartient à l'utilisateur
            $photo = $this->getPhotoById($photoId);

            if (!$photo || (int)$photo['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Vérifier les crédits
            if (!$this->creditManager->hasEnoughCredits($userId)) {
                $credits = $this->creditManager->getUserCredits($userId);
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Crédits insuffisants',
                    'credits_available' => $credits['total_available']
                ]);
                return;
            }

            // [AI:Claude] Récupérer les options
            $style = $data['style'] ?? 'lifestyle';
            $purpose = $data['purpose'] ?? 'instagram';

            // [AI:Claude] Récupérer le type du projet si la photo est liée à un projet
            $projectType = 'handmade craft';
            if (!empty($photo['project_id'])) {
                $db = \App\Config\Database::getInstance()->getConnection();
                $projectQuery = "SELECT type FROM projects WHERE id = :project_id";
                $projectStmt = $db->prepare($projectQuery);
                $projectStmt->bindValue(':project_id', $photo['project_id'], \PDO::PARAM_INT);
                $projectStmt->execute();
                $project = $projectStmt->fetch(\PDO::FETCH_ASSOC);

                if ($project && !empty($project['type'])) {
                    $projectType = $project['type'];
                }
            }

            // [AI:Claude] Chemin complet de l'image
            $imagePath = __DIR__ . '/../public' . $photo['original_path'];

            // [AI:Claude] Générer avec IA
            $startTime = microtime(true);

            $result = $this->photoService->enhancePhoto($imagePath, [
                'project_type' => $projectType,
                'context' => $style, // [AI:Claude] Utiliser 'context' pour correspondre au service
                'purpose' => $purpose
            ]);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Erreur génération IA');
            }

            // [AI:Claude] Sauvegarder l'image générée
            $enhancedPath = $this->photoService->saveGeneratedImage(
                $result['enhanced_image_data'],
                (string)$userId
            );

            // [AI:Claude] Utiliser un crédit
            $creditResult = $this->creditManager->useCredit($userId);

            // [AI:Claude] Mettre à jour la photo en base
            $this->updatePhotoWithEnhanced($photoId, $enhancedPath, $style, $purpose, $result['prompt_used']);

            // [AI:Claude] Logger la génération
            $this->logPhotoGeneration($userId, $photoId, $creditResult['credit_type'], $result);

            // [AI:Claude] Récupérer la photo mise à jour
            $updatedPhoto = $this->getPhotoById($photoId);

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Photo embellie avec succès',
                'photo' => $updatedPhoto,
                'credits_used' => 1,
                'credit_type' => $creditResult['credit_type'],
                'credits_remaining' => $creditResult['remaining_credits'],
                'generation_time_ms' => $result['generation_time_ms']
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] POST /api/photos/{id}/enhance-multiple - Générer multiples variations avec contextes
     *
     * @param int $photoId ID de la photo
     * @return void JSON response
     */
    public function enhanceMultiple(int $photoId): void
    {
        // [AI:Claude] Augmenter le timeout PHP pour la génération d'images
        set_time_limit(180); // 3 minutes

        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que la photo appartient à l'utilisateur
            $photo = $this->getPhotoById($photoId);

            if (!$photo || (int)$photo['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Récupérer les contextes demandés
            $contexts = $data['contexts'] ?? [];
            $projectCategory = $data['project_category'] ?? 'other';

            if (empty($contexts)) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'Aucun contexte fourni'
                ]);
                return;
            }

            // [AI:Claude] Récupérer le type du projet si la photo est liée à un projet
            $projectType = 'handmade craft';
            if (!empty($photo['project_id'])) {
                $db = \App\Config\Database::getInstance()->getConnection();
                $projectQuery = "SELECT type FROM projects WHERE id = :project_id";
                $projectStmt = $db->prepare($projectQuery);
                $projectStmt->bindValue(':project_id', $photo['project_id'], \PDO::PARAM_INT);
                $projectStmt->execute();
                $project = $projectStmt->fetch(\PDO::FETCH_ASSOC);

                if ($project && !empty($project['type'])) {
                    $projectType = $project['type'];
                }
            }

            $quantity = count($contexts);

            // [AI:Claude] Calculer le coût (5 photos = 4 crédits, sinon 1 crédit/photo)
            $cost = $quantity === 5 ? 4 : $quantity;

            // [AI:Claude] Vérifier les crédits
            $userCredits = $this->creditManager->getUserCredits($userId);
            if ($userCredits['total_available'] < $cost) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Crédits insuffisants',
                    'credits_needed' => $cost,
                    'credits_available' => $userCredits['total_available']
                ]);
                return;
            }

            // [AI:Claude] Chemin complet de l'image
            $imagePath = __DIR__.'/../public'.$photo['original_path'];

            // [AI:Claude] v0.15.0 FIX: Toujours utiliser l'image originale pour garantir la cohérence
            // Ne plus utiliser la logique de preview/upscaling qui causait des incohérences
            error_log("[ENHANCE] Using original image for consistent generation (photo {$photoId})");

            // [AI:Claude] Supprimer la preview temporaire si elle existe (ne plus l'utiliser)
            $previewTempPath = sys_get_temp_dir() . "/preview_{$photoId}.jpg";
            if (file_exists($previewTempPath)) {
                unlink($previewTempPath);
                error_log("[ENHANCE] Deleted unused preview file");
            }

            // [AI:Claude] Générer chaque variation
            $generatedPhotos = [];
            $successCount = 0;

            foreach ($contexts as $context) {
                try {
                    // [AI:Claude] Générer avec IA pour ce contexte depuis l'original
                    $result = $this->photoService->enhancePhoto(
                        $imagePath,
                        [
                            'project_type' => $projectType,
                            'context' => $context,
                            'project_category' => $projectCategory,
                            'from_preview' => false,
                            'item_name' => $photo['item_name'] ?? ''
                        ]
                    );

                    if (!$result['success']) {
                        throw new \Exception($result['error'] ?? 'Erreur génération IA');
                    }

                    // [AI:Claude] Sauvegarder l'image générée
                    $enhancedPath = $this->photoService->saveGeneratedImage(
                        $result['enhanced_image_data'],
                        (string)$userId
                    );

                    // [AI:Claude] Créer un nouvel enregistrement pour cette variation
                    $newPhotoId = $this->createEnhancedVariation(
                        $userId,
                        $photo['project_id'],
                        $photoId,
                        $enhancedPath,
                        $context,
                        $result['prompt_used'],
                        $photo
                    );

                    $generatedPhotos[] = [
                        'context' => $context,
                        'photo_id' => $newPhotoId,
                        'enhanced_path' => $enhancedPath,
                        'success' => true
                    ];

                    $successCount++;

                } catch (\Exception $e) {
                    $generatedPhotos[] = [
                        'context' => $context,
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }

            // [AI:Claude] Utiliser les crédits (seulement pour les photos réussies)
            for ($i = 0; $i < $successCount; $i++) {
                // [AI:Claude] Promo 5 photos = 4 crédits
                if ($quantity === 5 && $i === 4)
                    break;

                $this->creditManager->useCredit($userId);
            }

            $this->sendResponse(200, [
                'success' => true,
                'message' => "$successCount photo(s) générée(s) avec succès",
                'generated_photos' => $generatedPhotos,
                'credits_used' => $quantity === 5 ? 4 : $successCount,
                'success_count' => $successCount,
                'total_requested' => $quantity
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/photos/credits - Crédits disponibles
     *
     * @return void JSON response
     */
    public function getCredits(): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $credits = $this->creditManager->getUserCredits($userId);
            $packs = CreditManager::getAvailablePacks();

            $this->sendResponse(200, [
                'success' => true,
                'credits' => $credits,
                'available_packs' => $packs
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] DELETE /api/photos/{id} - Supprimer une photo
     *
     * @param int $photoId ID de la photo
     * @return void JSON response
     */
    public function delete(int $photoId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $photo = $this->getPhotoById($photoId);

            if (!$photo || (int)$photo['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Supprimer les fichiers
            $this->deletePhotoFiles($photo);

            // [AI:Claude] Supprimer l'enregistrement
            $query = "DELETE FROM user_photos WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':id', $photoId, PDO::PARAM_INT);
            $stmt->execute();

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Photo supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] GET /api/photos/{id}/download - Télécharger une photo
     *
     * @param int $photoId ID de la photo
     * @return void File download
     */
    public function download(int $photoId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();

            $photo = $this->getPhotoById($photoId);

            if (!$photo || (int)$photo['user_id'] !== $userId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Accès non autorisé']);
                return;
            }

            // Déterminer le chemin du fichier
            $filePath = $photo['enhanced_path'] ?? $photo['original_path'];
            $fullPath = __DIR__ . '/../public' . $filePath;

            if (!file_exists($fullPath)) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Fichier introuvable']);
                return;
            }

            // Déterminer le nom du fichier
            $filename = basename($filePath);

            // [AI:Claude] SÉCURITÉ: Échapper le filename pour prévenir HTTP Response Splitting
            $safeFilename = SecurityHelper::escapeFilename($filename);

            // Forcer le téléchargement
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
            header('Content-Length: ' . filesize($fullPath));
            header('Cache-Control: no-cache, must-revalidate');
            header('Pragma: public');

            readfile($fullPath);
            exit;

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    /**
     * [AI:Claude] POST /api/photos/{id}/preview - Générer une preview IA basse résolution (gratuit)
     *
     * @param int $photoId ID de la photo
     * @return void JSON response
     */
    public function generatePreview(int $photoId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que la photo appartient à l'utilisateur
            $photo = $this->getPhotoById($photoId);

            if (!$photo || (int)$photo['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Rate limiting : max 3 previews par 30 secondes
            $rateLimitKey = "preview_ratelimit_{$userId}";
            $cacheFile = sys_get_temp_dir() . "/{$rateLimitKey}.txt";

            if (file_exists($cacheFile)) {
                $attempts = json_decode(file_get_contents($cacheFile), true);
                $attempts = array_filter($attempts, fn($time) => time() - $time < 30);

                if (count($attempts) >= 3) {
                    $this->sendResponse(429, [
                        'success' => false,
                        'error' => 'Trop de previews. Attendez 30 secondes.'
                    ]);
                    return;
                }

                $attempts[] = time();
                file_put_contents($cacheFile, json_encode($attempts));
            } else {
                file_put_contents($cacheFile, json_encode([time()]));
            }

            // [AI:Claude] Récupérer le contexte
            $context = $data['context'] ?? 'lifestyle';

            // [AI:Claude] Récupérer le type du projet
            $projectType = 'handmade craft';
            if (!empty($photo['project_id'])) {
                $db = \App\Config\Database::getInstance()->getConnection();
                $projectQuery = "SELECT type FROM projects WHERE id = :project_id";
                $projectStmt = $db->prepare($projectQuery);
                $projectStmt->bindValue(':project_id', $photo['project_id'], \PDO::PARAM_INT);
                $projectStmt->execute();
                $project = $projectStmt->fetch(\PDO::FETCH_ASSOC);

                if ($project && !empty($project['type'])) {
                    $projectType = $project['type'];
                }
            }

            // [AI:Claude] Chemin complet de l'image
            $imagePath = __DIR__.'/../public'.$photo['original_path'];

            // [AI:Claude] Générer la preview (pas de crédit consommé)
            $result = $this->photoService->generatePreview($imagePath, [
                'project_type' => $projectType,
                'context' => $context
            ]);

            if (!$result['success']) {
                throw new \Exception($result['error'] ?? 'Erreur génération preview');
            }

            // [AI:Claude] Sauvegarder la preview temporairement pour génération HD ultérieure
            $previewTempPath = sys_get_temp_dir() . "/preview_{$photoId}.jpg";
            file_put_contents($previewTempPath, base64_decode($result['preview_image_base64']));
            error_log("[PREVIEW SAVED] Photo {$photoId} preview saved at: {$previewTempPath}");

            // [AI:Claude] Retourner l'image en base64 (pas de sauvegarde en BDD)
            $this->sendResponse(200, [
                'success' => true,
                'preview_image' => $result['preview_image_base64'],
                'prompt_used' => $result['prompt_used']
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la génération de la preview',
                'message' => $e->getMessage()
            ]);
        }
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * [AI:Claude] Récupérer les photos d'un utilisateur
     */
    private function getUserPhotos(
        int $userId,
        ?int $projectId,
        int $limit,
        int $offset
    ): array {
        $query = "SELECT * FROM user_photos
                  WHERE user_id = :user_id";

        if ($projectId !== null)
            $query .= " AND project_id = :project_id";

        $query .= " ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        if ($projectId !== null)
            $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Récupérer une photo par ID
     */
    private function getPhotoById(int $photoId): ?array
    {
        $query = "SELECT * FROM user_photos WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $photoId, PDO::PARAM_INT);
        $stmt->execute();

        $photo = $stmt->fetch(PDO::FETCH_ASSOC);
        return $photo ?: null;
    }

    /**
     * [AI:Claude] Créer un enregistrement photo
     */
    private function createPhotoRecord(
        int $userId,
        ?int $projectId,
        string $originalPath,
        array $data
    ): int {
        $query = "INSERT INTO user_photos
                  (user_id, project_id, original_path, item_name, item_type, technique, description)
                  VALUES
                  (:user_id, :project_id, :original_path, :item_name, :item_type, :technique, :description)";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->bindValue(':original_path', $originalPath, PDO::PARAM_STR);
        $stmt->bindValue(':item_name', $data['item_name'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':item_type', $data['item_type'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':technique', $data['technique'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'] ?? null, PDO::PARAM_STR);

        $stmt->execute();

        return (int)$this->db->lastInsertId();
    }

    /**
     * [AI:Claude] Mettre à jour la photo avec version IA
     */
    private function updatePhotoWithEnhanced(
        int $photoId,
        string $enhancedPath,
        string $style,
        string $purpose,
        string $prompt
    ): bool {
        $query = "UPDATE user_photos
                  SET enhanced_path = :enhanced_path,
                      ai_style = :style,
                      ai_purpose = :purpose,
                      ai_prompt_used = :prompt,
                      ai_generated_at = NOW()
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $photoId, PDO::PARAM_INT);
        $stmt->bindValue(':enhanced_path', $enhancedPath, PDO::PARAM_STR);
        $stmt->bindValue(':style', $style, PDO::PARAM_STR);
        $stmt->bindValue(':purpose', $purpose, PDO::PARAM_STR);
        $stmt->bindValue(':prompt', $prompt, PDO::PARAM_STR);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Créer une variation améliorée d'une photo
     */
    private function createEnhancedVariation(
        int $userId,
        ?int $projectId,
        int $originalPhotoId,
        string $enhancedPath,
        string $context,
        string $prompt,
        array $originalPhoto
    ): int {
        $query = "INSERT INTO user_photos
                  (user_id, project_id, original_path, enhanced_path,
                   item_name, item_type, technique, description,
                   ai_style, ai_purpose, ai_prompt_used, ai_generated_at,
                   parent_photo_id)
                  VALUES
                  (:user_id, :project_id, :original_path, :enhanced_path,
                   :item_name, :item_type, :technique, :description,
                   :ai_style, :ai_purpose, :ai_prompt, NOW(),
                   :parent_photo_id)";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->bindValue(':original_path', $originalPhoto['original_path'], PDO::PARAM_STR);
        $stmt->bindValue(':enhanced_path', $enhancedPath, PDO::PARAM_STR);
        $stmt->bindValue(':item_name', $originalPhoto['item_name'], PDO::PARAM_STR);
        $stmt->bindValue(':item_type', $originalPhoto['item_type'], PDO::PARAM_STR);
        $stmt->bindValue(':technique', $originalPhoto['technique'], PDO::PARAM_STR);
        $stmt->bindValue(':description', $originalPhoto['description'], PDO::PARAM_STR);
        $stmt->bindValue(':ai_style', $context, PDO::PARAM_STR);
        $stmt->bindValue(':ai_purpose', $context, PDO::PARAM_STR);
        $stmt->bindValue(':ai_prompt', $prompt, PDO::PARAM_STR);
        $stmt->bindValue(':parent_photo_id', $originalPhotoId, PDO::PARAM_INT);

        $stmt->execute();

        return (int)$this->db->lastInsertId();
    }

    /**
     * [AI:Claude] Logger une génération de photo IA
     */
    private function logPhotoGeneration(
        int $userId,
        int $photoId,
        string $creditType,
        array $result
    ): void {
        $query = "INSERT INTO photo_generations_log
                  (user_id, photo_id, credits_used, credit_type, ai_model,
                   generation_time_ms, success, error_message)
                  VALUES
                  (:user_id, :photo_id, 1, :credit_type, :ai_model,
                   :generation_time, :success, :error)";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':photo_id', $photoId, PDO::PARAM_INT);
        $stmt->bindValue(':credit_type', $creditType, PDO::PARAM_STR);
        $stmt->bindValue(':ai_model', $result['ai_model'] ?? 'gemini-2.0-flash', PDO::PARAM_STR);
        $stmt->bindValue(':generation_time', $result['generation_time_ms'] ?? null, PDO::PARAM_INT);
        $stmt->bindValue(':success', $result['success'], PDO::PARAM_BOOL);
        $stmt->bindValue(':error', $result['error'] ?? null, PDO::PARAM_STR);

        $stmt->execute();
    }

    /**
     * [AI:Claude] Sauvegarder un fichier uploadé
     */
    /**
     * [AI:Claude] Valider un fichier image de manière sécurisée
     *
     * @param array $file Fichier uploadé ($_FILES)
     * @return void
     * @throws \InvalidArgumentException Si le fichier est invalide
     */
    private function validateImageFile(array $file): void
    {
        // [AI:Claude] 1. Vérifier la taille du fichier (max 10 MB)
        $maxSize = 10 * 1024 * 1024; // 10 MB
        if ($file['size'] > $maxSize) {
            throw new \InvalidArgumentException('Fichier trop volumineux. Taille maximale : 10 MB');
        }

        if ($file['size'] === 0) {
            throw new \InvalidArgumentException('Fichier vide');
        }

        // [AI:Claude] 2. Vérifier le type MIME réel (pas juste le type déclaré)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($mimeType, $allowedMimes)) {
            throw new \InvalidArgumentException('Type de fichier invalide. Formats acceptés : JPEG, PNG, WebP');
        }

        // [AI:Claude] 3. Vérifier que c'est vraiment une image avec getimagesize()
        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            throw new \InvalidArgumentException('Fichier image corrompu ou invalide');
        }

        // [AI:Claude] 4. Vérifier les dimensions (max 8000x8000 pixels)
        [$width, $height] = $imageInfo;
        if ($width > 8000 || $height > 8000) {
            throw new \InvalidArgumentException('Image trop grande. Dimensions maximales : 8000x8000 pixels');
        }

        if ($width < 10 || $height < 10) {
            throw new \InvalidArgumentException('Image trop petite. Dimensions minimales : 10x10 pixels');
        }

        // [AI:Claude] 5. Vérifier que le type MIME correspond bien au format détecté
        $detectedType = $imageInfo[2]; // IMAGETYPE_* constant
        $validTypes = [
            IMAGETYPE_JPEG => 'image/jpeg',
            IMAGETYPE_PNG => 'image/png',
            IMAGETYPE_WEBP => 'image/webp'
        ];

        if (!isset($validTypes[$detectedType]) || $validTypes[$detectedType] !== $mimeType) {
            throw new \InvalidArgumentException('Le type de fichier ne correspond pas au contenu');
        }

        error_log("[PHOTO VALIDATION] Fichier validé : {$mimeType}, {$width}x{$height}, " . round($file['size'] / 1024, 2) . " KB");
    }

    private function saveUploadedFile(array $file, int $userId): string
    {
        // [AI:Claude] Sauvegarder dans public/uploads pour accès web
        $uploadsDir = __DIR__ . '/../public/uploads/photos/original';

        if (!is_dir($uploadsDir))
            mkdir($uploadsDir, 0755, true);

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = sprintf(
            '%s_%s_%s.%s',
            $userId,
            date('Ymd_His'),
            bin2hex(random_bytes(8)),
            $extension
        );

        $filepath = $uploadsDir . '/' . $filename;

        // [AI:Claude] Debug upload
        error_log("[PHOTO UPLOAD] Tentative upload: {$file['tmp_name']} -> {$filepath}");
        error_log("[PHOTO UPLOAD] Dossier existe: " . (is_dir($uploadsDir) ? 'OUI' : 'NON'));
        error_log("[PHOTO UPLOAD] Temp file existe: " . (file_exists($file['tmp_name']) ? 'OUI' : 'NON'));

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            $error = error_get_last();
            error_log("[PHOTO UPLOAD] ECHEC move_uploaded_file: " . json_encode($error));
            throw new \Exception('Erreur sauvegarde fichier: impossible de déplacer le fichier uploadé');
        }

        error_log("[PHOTO UPLOAD] SUCCESS: fichier sauvegardé dans {$filepath}");

        return '/uploads/photos/original/' . $filename;
    }

    /**
     * [AI:Claude] Supprimer les fichiers d'une photo
     * v0.14.0 - FIX: Ne supprimer original_path QUE pour les photos originales
     */
    private function deletePhotoFiles(array $photo): void
    {
        $basePath = __DIR__ . '/../public';

        // [AI:Claude] v0.14.0 FIX CRITIQUE : Ne supprimer original_path QUE si c'est une photo originale
        // Les variations partagent le même original_path que leur parent
        // Si on supprime une variation, on NE DOIT PAS supprimer le fichier original !
        $isOriginal = empty($photo['parent_photo_id']);

        if ($isOriginal && $photo['original_path'] && file_exists($basePath . $photo['original_path'])) {
            unlink($basePath . $photo['original_path']);
            error_log("[PHOTO DELETE] Fichier original supprimé : {$photo['original_path']}");
        }

        // [AI:Claude] Toujours supprimer enhanced_path car chaque variation a son propre fichier
        if ($photo['enhanced_path'] && file_exists($basePath . $photo['enhanced_path'])) {
            unlink($basePath . $photo['enhanced_path']);
            error_log("[PHOTO DELETE] Fichier enhanced supprimé : {$photo['enhanced_path']}");
        }

        if ($photo['thumbnail_path'] && file_exists($basePath . $photo['thumbnail_path'])) {
            unlink($basePath . $photo['thumbnail_path']);
            error_log("[PHOTO DELETE] Fichier thumbnail supprimé : {$photo['thumbnail_path']}");
        }
    }

    /**
     * [AI:Claude] GET /api/photos/stats - Statistiques photos IA selon période
     *
     * @param array $params Query params (period: week|month|year|all)
     * @return void JSON response
     */
    public function getPhotoStats(array $params = []): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $period = $params['period'] ?? 'all';

            // [AI:Claude] Valider le paramètre period
            $validPeriods = ['week', 'month', 'year', 'all'];
            if (!in_array($period, $validPeriods))
                $period = 'all';

            // [AI:Claude] Déterminer la date de début selon la période
            $dateCondition = '';
            if ($period === 'week')
                $dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            elseif ($period === 'month')
                $dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            elseif ($period === 'year')
                $dateCondition = "AND created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)";

            // [AI:Claude] Stats photos IA générées (avec enhanced_path)
            $query = "SELECT
                        COUNT(*) as total_ai_photos,
                        COUNT(CASE WHEN parent_photo_id IS NULL THEN 1 END) as original_photos,
                        COUNT(CASE WHEN parent_photo_id IS NOT NULL THEN 1 END) as variations,
                        ai_style,
                        COUNT(*) as style_count
                      FROM user_photos
                      WHERE user_id = :user_id
                      AND enhanced_path IS NOT NULL
                      $dateCondition
                      GROUP BY ai_style
                      ORDER BY style_count DESC";

            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
            $stmt->execute();

            $styleStats = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            // [AI:Claude] Calculer le total et le style préféré
            $totalAiPhotos = 0;
            $originalPhotos = 0;
            $variations = 0;
            $topStyle = null;
            $topStyleCount = 0;

            foreach ($styleStats as $stat) {
                $totalAiPhotos += (int)$stat['style_count'];
                if ($stat['original_photos'])
                    $originalPhotos = (int)$stat['original_photos'];
                if ($stat['variations'])
                    $variations = (int)$stat['variations'];

                if ((int)$stat['style_count'] > $topStyleCount && $stat['ai_style']) {
                    $topStyle = $stat['ai_style'];
                    $topStyleCount = (int)$stat['style_count'];
                }
            }

            // [AI:Claude] Récupérer les crédits
            $credits = $this->creditManager->getUserCredits($userId);

            // [AI:Claude] Photos par projet
            $projectQuery = "SELECT
                                p.name as project_name,
                                COUNT(up.id) as photo_count
                             FROM user_photos up
                             LEFT JOIN projects p ON up.project_id = p.id
                             WHERE up.user_id = :user_id
                             AND up.enhanced_path IS NOT NULL
                             $dateCondition
                             GROUP BY up.project_id, p.name
                             ORDER BY photo_count DESC
                             LIMIT 3";

            $stmt = $this->db->prepare($projectQuery);
            $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
            $stmt->execute();

            $topProjects = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $this->sendResponse(200, [
                'success' => true,
                'stats' => [
                    'total_ai_photos' => $totalAiPhotos,
                    'original_photos' => $originalPhotos,
                    'variations' => $variations,
                    'top_style' => $topStyle,
                    'top_style_count' => $topStyleCount,
                    'styles_breakdown' => array_filter($styleStats, fn($s) => $s['ai_style'] !== null),
                    'top_projects' => $topProjects,
                    'credits_remaining' => $credits['total_available'] ?? 0,
                    'credits_used' => $credits['total_credits_used'] ?? 0,
                    'period' => $period
                ]
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de la récupération des statistiques photos',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] v0.15.0 - POST /api/photos/{id}/feedback - Feedback utilisateur simple (étoiles + commentaire)
     *
     * @param int $photoId ID de la photo
     * @return void JSON response
     */
    public function submitFeedback(int $photoId): void
    {
        try {
            $userId = $this->getUserIdFromAuth();
            $data = $this->getJsonInput();

            // [AI:Claude] Vérifier que la photo appartient à l'utilisateur
            $photo = $this->getPhotoById($photoId);

            if (!$photo || (int)$photo['user_id'] !== $userId) {
                $this->sendResponse(403, [
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ]);
                return;
            }

            // [AI:Claude] Valider la note (1-5)
            $rating = isset($data['rating']) ? (int)$data['rating'] : null;
            $comment = $data['comment'] ?? null;

            if ($rating === null || $rating < 1 || $rating > 5) {
                $this->sendResponse(400, [
                    'success' => false,
                    'error' => 'La note doit être entre 1 et 5'
                ]);
                return;
            }

            // [AI:Claude] Enregistrer le feedback
            $feedbackQuery = "INSERT INTO photo_feedback
                             (user_id, photo_id, rating, comment)
                             VALUES
                             (:user_id, :photo_id, :rating, :comment)
                             ON DUPLICATE KEY UPDATE
                             rating = VALUES(rating),
                             comment = VALUES(comment)";

            $stmt = $this->db->prepare($feedbackQuery);
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':photo_id', $photoId, PDO::PARAM_INT);
            $stmt->bindValue(':rating', $rating, PDO::PARAM_INT);
            $stmt->bindValue(':comment', $comment, PDO::PARAM_STR);
            $stmt->execute();

            error_log("[PHOTO FEEDBACK] User $userId - Note {$rating}/5 pour photo $photoId");

            $this->sendResponse(200, [
                'success' => true,
                'message' => 'Merci pour votre retour !',
                'rating' => $rating
            ]);

        } catch (\Exception $e) {
            $this->sendResponse(500, [
                'success' => false,
                'error' => 'Erreur lors de l\'enregistrement du feedback',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * [AI:Claude] Récupérer l'ID utilisateur depuis JWT
     */
    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();

        if ($userData === null)
            throw new \Exception('Non authentifié');

        return (int)$userData['user_id'];
    }

    /**
     * [AI:Claude] Récupérer le JSON du body
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
     */
    private function sendResponse(int $statusCode, array $data): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
