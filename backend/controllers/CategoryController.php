<?php
/**
 * @file CategoryController.php
 * @brief Contrôleur pour gérer les catégories et sous-catégories de patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création du contrôleur Category
 *
 * @history
 *   2025-11-13 [AI:Claude] Création initiale avec CRUD complet
 */

namespace App\Controllers;

use App\Models\Category;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class CategoryController
{
    private Category $categoryModel;

    public function __construct()
    {
        $this->categoryModel = new Category();
    }

    /**
     * [AI:Claude] GET /api/categories
     * Récupérer la hiérarchie complète des catégories (public)
     */
    public function index(): void
    {
        try {
            $categories = $this->categoryModel->getCategoriesHierarchy();

            Response::success($categories, 200, 'Catégories récupérées avec succès');
        } catch (\Exception $e) {
            Response::error('Erreur lors de la récupération des catégories', 500);
        }
    }

    /**
     * [AI:Claude] GET /api/categories/{categoryKey}/subtypes
     * Récupérer les sous-catégories d'une catégorie
     */
    public function getSubtypes(string $categoryKey): void
    {
        try {
            $subtypes = $this->categoryModel->getSubcategories($categoryKey);

            Response::success($subtypes, 200, 'Sous-catégories récupérées avec succès');
        } catch (\Exception $e) {
            Response::error('Erreur lors de la récupération des sous-catégories', 500);
        }
    }

    /**
     * [AI:Claude] POST /api/admin/categories
     * Créer une nouvelle catégorie principale (admin seulement)
     */
    public function create(): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        $data = json_decode(file_get_contents('php://input'), true);

        // [AI:Claude] Validation
        if (empty($data['category_key']) || empty($data['category_label'])) {
            Response::error('La clé et le label de la catégorie sont requis', 400);
            return;
        }

        try {
            // [AI:Claude] Vérifier que la clé n'existe pas déjà
            if ($this->categoryModel->categoryKeyExists($data['category_key'])) {
                Response::error('Cette clé de catégorie existe déjà', 400);
                return;
            }

            $categoryId = $this->categoryModel->createMainCategory($data);

            if ($categoryId) {
                Response::success([
                    'id' => $categoryId,
                    'category_key' => $data['category_key']
                ], 'Catégorie créée avec succès', 201);
            } else {
                Response::error('Erreur lors de la création de la catégorie', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la création de la catégorie: ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] POST /api/admin/categories/{categoryKey}/subtypes
     * Créer une nouvelle sous-catégorie (admin seulement)
     */
    public function createSubtype(string $categoryKey): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        $data = json_decode(file_get_contents('php://input'), true);

        // [AI:Claude] Validation
        if (empty($data['subtype_key']) || empty($data['subtype_label'])) {
            Response::error('La clé et le label de la sous-catégorie sont requis', 400);
            return;
        }

        try {
            // [AI:Claude] Vérifier que la catégorie parente existe
            if (!$this->categoryModel->categoryKeyExists($categoryKey)) {
                Response::error('Cette catégorie n\'existe pas', 404);
                return;
            }

            // [AI:Claude] Vérifier que la clé de sous-type n'existe pas déjà
            if ($this->categoryModel->subtypeKeyExists($categoryKey, $data['subtype_key'])) {
                Response::error('Cette sous-catégorie existe déjà', 400);
                return;
            }

            $subtypeId = $this->categoryModel->createSubcategory($categoryKey, $data);

            if ($subtypeId) {
                Response::success([
                    'id' => $subtypeId,
                    'category_key' => $categoryKey,
                    'subtype_key' => $data['subtype_key']
                ], 'Sous-catégorie créée avec succès', 201);
            } else {
                Response::error('Erreur lors de la création de la sous-catégorie', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la création de la sous-catégorie: ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] PUT /api/admin/categories/{id}
     * Mettre à jour une catégorie ou sous-catégorie (admin seulement)
     */
    public function update(int $id): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        $data = json_decode(file_get_contents('php://input'), true);

        // [AI:Claude] Vérifier que l'ID existe
        $existing = $this->categoryModel->findById($id);
        if (!$existing) {
            Response::error('Catégorie introuvable', 404);
            return;
        }

        try {
            $success = $this->categoryModel->updateCategory($id, $data);

            if ($success) {
                Response::success(['id' => $id], 'Catégorie mise à jour avec succès');
            } else {
                Response::error('Erreur lors de la mise à jour de la catégorie', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la mise à jour: ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] DELETE /api/admin/categories/{id}
     * Supprimer une catégorie ou sous-catégorie (soft delete, admin seulement)
     */
    public function delete(int $id): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        // [AI:Claude] Vérifier que l'ID existe
        $existing = $this->categoryModel->findById($id);
        if (!$existing) {
            Response::error('Catégorie introuvable', 404);
            return;
        }

        try {
            $success = $this->categoryModel->deleteCategory($id);

            if ($success) {
                Response::success(null, 'Catégorie supprimée avec succès');
            } else {
                Response::error('Erreur lors de la suppression de la catégorie', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la suppression: ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] POST /api/admin/categories/reorder
     * Réorganiser l'ordre des catégories (admin seulement)
     */
    public function reorder(): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['order']) || !is_array($data['order'])) {
            Response::error('Données d\'ordre invalides', 400);
            return;
        }

        try {
            $success = $this->categoryModel->reorderCategories($data['order']);

            if ($success) {
                Response::success(null, 'Ordre mis à jour avec succès');
            } else {
                Response::error('Erreur lors de la mise à jour de l\'ordre', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la réorganisation: ' . $e->getMessage(), 500);
        }
    }
}
