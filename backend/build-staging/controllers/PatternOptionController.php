<?php
/**
 * @file PatternOptionController.php
 * @brief Contrôleur pour gérer les options de personnalisation des patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création du contrôleur PatternOption
 *
 * @history
 *   2025-11-13 [AI:Claude] Création initiale avec routes CRUD
 */

namespace App\Controllers;

use App\Models\PatternOption;
use App\Utils\Response;
use App\Middleware\AuthMiddleware;

class PatternOptionController
{
    private PatternOption $optionModel;

    public function __construct()
    {
        $this->optionModel = new PatternOption();
    }

    /**
     * [AI:Claude] GET /api/pattern-options
     * Récupérer toutes les options groupées (public)
     */
    public function index(): void
    {
        try {
            $categoryKey = $_GET['category'] ?? null;
            $level = $_GET['level'] ?? null;

            $options = $this->optionModel->getOptionsGrouped($categoryKey, $level);

            Response::success($options, 'Options récupérées avec succès');
        } catch (\Exception $e) {
            Response::error('Erreur lors de la récupération des options', 500);
        }
    }

    /**
     * [AI:Claude] GET /api/pattern-options/required/{categoryKey}
     * Récupérer les options requises pour une catégorie
     */
    public function getRequired(string $categoryKey): void
    {
        try {
            $options = $this->optionModel->getRequiredOptions($categoryKey);

            Response::success($options, 'Options requises récupérées');
        } catch (\Exception $e) {
            Response::error('Erreur lors de la récupération', 500);
        }
    }

    /**
     * [AI:Claude] POST /api/admin/pattern-options
     * Créer une nouvelle option (admin seulement)
     */
    public function create(): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        $data = json_decode(file_get_contents('php://input'), true);

        // [AI:Claude] Validation
        if (empty($data['option_key']) || empty($data['option_group']) || empty($data['option_label'])) {
            Response::error('La clé, le groupe et le label sont requis', 400);
            return;
        }

        try {
            // [AI:Claude] Vérifier que la clé n'existe pas déjà
            if ($this->optionModel->optionKeyExists($data['option_key'])) {
                Response::error('Cette clé d\'option existe déjà', 400);
                return;
            }

            $optionId = $this->optionModel->createOption($data);

            if ($optionId) {
                Response::success([
                    'id' => $optionId,
                    'option_key' => $data['option_key']
                ], 'Option créée avec succès', 201);
            } else {
                Response::error('Erreur lors de la création de l\'option', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la création : ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] PUT /api/admin/pattern-options/{id}
     * Mettre à jour une option (admin seulement)
     */
    public function update(int $id): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        $data = json_decode(file_get_contents('php://input'), true);

        // [AI:Claude] Vérifier que l'ID existe
        $existing = $this->optionModel->findById($id);
        if (!$existing) {
            Response::error('Option introuvable', 404);
            return;
        }

        try {
            $success = $this->optionModel->updateOption($id, $data);

            if ($success) {
                Response::success(['id' => $id], 'Option mise à jour avec succès');
            } else {
                Response::error('Erreur lors de la mise à jour', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la mise à jour : ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] DELETE /api/admin/pattern-options/{id}
     * Supprimer une option (soft delete, admin seulement)
     */
    public function delete(int $id): void
    {
        // [AI:Claude] Vérifier l'authentification admin
        $userId = AuthMiddleware::authenticate(true);

        // [AI:Claude] Vérifier que l'ID existe
        $existing = $this->optionModel->findById($id);
        if (!$existing) {
            Response::error('Option introuvable', 404);
            return;
        }

        try {
            $success = $this->optionModel->deleteOption($id);

            if ($success) {
                Response::success(null, 'Option supprimée avec succès');
            } else {
                Response::error('Erreur lors de la suppression', 500);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la suppression : ' . $e->getMessage(), 500);
        }
    }

    /**
     * [AI:Claude] GET /api/pattern-options/{optionKey}
     * Récupérer une option par sa clé (public)
     */
    public function getByKey(string $optionKey): void
    {
        try {
            $option = $this->optionModel->findByKey($optionKey);

            if ($option) {
                Response::success($option, 'Option trouvée');
            } else {
                Response::error('Option introuvable', 404);
            }
        } catch (\Exception $e) {
            Response::error('Erreur lors de la récupération', 500);
        }
    }

    /**
     * [AI:Claude] GET /api/pattern-options/group/{group}
     * Récupérer les options d'un groupe spécifique
     */
    public function getByGroup(string $group): void
    {
        try {
            $options = $this->optionModel->getOptionsByGroup($group);

            Response::success($options, 'Options du groupe récupérées');
        } catch (\Exception $e) {
            Response::error('Erreur lors de la récupération', 500);
        }
    }
}
