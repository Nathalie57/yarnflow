<?php
/**
 * @file Category.php
 * @brief Modèle pour gérer les catégories et sous-catégories de patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création du modèle Category
 *
 * @history
 *   2025-11-13 [AI:Claude] Création initiale avec CRUD complet
 */

namespace App\Models;

use App\Config\Database;
use PDO;

class Category extends BaseModel
{
    protected string $table = 'pattern_categories';

    /**
     * [AI:Claude] Récupérer toutes les catégories avec leurs sous-catégories organisées
     *
     * @return array Structure hiérarchique des catégories
     */
    public function getCategoriesHierarchy(): array
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE is_active = 1
                  ORDER BY display_order ASC";

        $stmt = $this->db->prepare($query);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // [AI:Claude] Organiser en structure hiérarchique
        $categories = [];
        foreach ($rows as $row) {
            $categoryKey = $row['category_key'];

            // [AI:Claude] Initialiser la catégorie si elle n'existe pas encore
            if (!isset($categories[$categoryKey])) {
                $categories[$categoryKey] = [
                    'key' => $row['category_key'],
                    'label' => $row['category_label'],
                    'icon' => $row['category_icon'],
                    'sizes' => $row['available_sizes'] ? json_decode($row['available_sizes'], true) : [],
                    'subtypes' => []
                ];
            }

            // [AI:Claude] Ajouter le sous-type s'il existe
            if ($row['subtype_key'] !== null) {
                $categories[$categoryKey]['subtypes'][$row['subtype_key']] = [
                    'key' => $row['subtype_key'],
                    'label' => $row['subtype_label'],
                    'description' => $row['subtype_description'],
                    'display_order' => $row['display_order']
                ];
            }
        }

        return $categories;
    }

    /**
     * [AI:Claude] Récupérer toutes les catégories principales (sans sous-types)
     *
     * @return array Liste des catégories principales
     */
    public function getMainCategories(): array
    {
        $query = "SELECT DISTINCT category_key, category_label, category_icon, available_sizes, display_order
                  FROM {$this->table}
                  WHERE is_active = 1 AND subtype_key IS NULL
                  ORDER BY display_order ASC";

        $stmt = $this->db->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Récupérer les sous-catégories d'une catégorie
     *
     * @param string $categoryKey Clé de la catégorie
     * @return array Liste des sous-catégories
     */
    public function getSubcategories(string $categoryKey): array
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE category_key = :category_key
                  AND subtype_key IS NOT NULL
                  AND is_active = 1
                  ORDER BY display_order ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':category_key', $categoryKey);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Créer une nouvelle catégorie principale
     *
     * @param array $data Données de la catégorie
     * @return int|false ID de la catégorie créée ou false
     */
    public function createMainCategory(array $data): int|false
    {
        $query = "INSERT INTO {$this->table}
                  (category_key, category_label, category_icon, available_sizes, display_order, is_active)
                  VALUES (:category_key, :category_label, :category_icon, :available_sizes, :display_order, :is_active)";

        $stmt = $this->db->prepare($query);

        $availableSizes = json_encode($data['available_sizes'] ?? []);
        $displayOrder = $data['display_order'] ?? 0;
        $isActive = $data['is_active'] ?? true;

        $stmt->bindParam(':category_key', $data['category_key']);
        $stmt->bindParam(':category_label', $data['category_label']);
        $stmt->bindParam(':category_icon', $data['category_icon']);
        $stmt->bindParam(':available_sizes', $availableSizes);
        $stmt->bindParam(':display_order', $displayOrder);
        $stmt->bindParam(':is_active', $isActive);

        if ($stmt->execute()) {
            return (int) $this->db->lastInsertId();
        }

        return false;
    }

    /**
     * [AI:Claude] Créer une nouvelle sous-catégorie
     *
     * @param string $categoryKey Clé de la catégorie parente
     * @param array $data Données de la sous-catégorie
     * @return int|false ID de la sous-catégorie créée ou false
     */
    public function createSubcategory(string $categoryKey, array $data): int|false
    {
        $query = "INSERT INTO {$this->table}
                  (category_key, category_label, category_icon, subtype_key, subtype_label,
                   subtype_description, display_order, is_active)
                  SELECT category_key, category_label, category_icon,
                         :subtype_key, :subtype_label, :subtype_description,
                         :display_order, :is_active
                  FROM {$this->table}
                  WHERE category_key = :category_key AND subtype_key IS NULL
                  LIMIT 1";

        $stmt = $this->db->prepare($query);

        $displayOrder = $data['display_order'] ?? 0;
        $isActive = $data['is_active'] ?? true;

        $stmt->bindParam(':category_key', $categoryKey);
        $stmt->bindParam(':subtype_key', $data['subtype_key']);
        $stmt->bindParam(':subtype_label', $data['subtype_label']);
        $stmt->bindParam(':subtype_description', $data['subtype_description']);
        $stmt->bindParam(':display_order', $displayOrder);
        $stmt->bindParam(':is_active', $isActive);

        if ($stmt->execute()) {
            return (int) $this->db->lastInsertId();
        }

        return false;
    }

    /**
     * [AI:Claude] Mettre à jour une catégorie ou sous-catégorie
     *
     * @param int $id ID de l'entrée
     * @param array $data Nouvelles données
     * @return bool Succès de la mise à jour
     */
    public function updateCategory(int $id, array $data): bool
    {
        $fields = [];
        $params = [':id' => $id];

        // [AI:Claude] Construction dynamique de la requête selon les champs fournis
        $allowedFields = [
            'category_label', 'category_icon', 'subtype_label',
            'subtype_description', 'available_sizes', 'display_order', 'is_active'
        ];

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'available_sizes') {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = json_encode($data[$field]);
                } else {
                    $fields[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }
        }

        if (empty($fields))
            return false;

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    /**
     * [AI:Claude] Supprimer une catégorie ou sous-catégorie (soft delete)
     *
     * @param int $id ID de l'entrée
     * @return bool Succès de la suppression
     */
    public function deleteCategory(int $id): bool
    {
        return $this->updateCategory($id, ['is_active' => false]);
    }

    /**
     * [AI:Claude] Supprimer définitivement une entrée
     *
     * @param int $id ID de l'entrée
     * @return bool Succès de la suppression
     */
    public function hardDeleteCategory(int $id): bool
    {
        return $this->delete($id);
    }

    /**
     * [AI:Claude] Vérifier si une clé de catégorie existe
     *
     * @param string $categoryKey Clé de catégorie
     * @return bool Existe ou non
     */
    public function categoryKeyExists(string $categoryKey): bool
    {
        $query = "SELECT COUNT(*) as count FROM {$this->table}
                  WHERE category_key = :category_key AND subtype_key IS NULL";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':category_key', $categoryKey);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }

    /**
     * [AI:Claude] Vérifier si une clé de sous-catégorie existe
     *
     * @param string $categoryKey Clé de catégorie
     * @param string $subtypeKey Clé de sous-catégorie
     * @return bool Existe ou non
     */
    public function subtypeKeyExists(string $categoryKey, string $subtypeKey): bool
    {
        $query = "SELECT COUNT(*) as count FROM {$this->table}
                  WHERE category_key = :category_key AND subtype_key = :subtype_key";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':category_key', $categoryKey);
        $stmt->bindParam(':subtype_key', $subtypeKey);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }

    /**
     * [AI:Claude] Réorganiser l'ordre d'affichage
     *
     * @param array $orderData Tableau [id => display_order]
     * @return bool Succès de la réorganisation
     */
    public function reorderCategories(array $orderData): bool
    {
        $this->db->beginTransaction();

        try {
            $query = "UPDATE {$this->table} SET display_order = :display_order WHERE id = :id";
            $stmt = $this->db->prepare($query);

            foreach ($orderData as $id => $order) {
                $stmt->execute([':id' => $id, ':display_order' => $order]);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}
