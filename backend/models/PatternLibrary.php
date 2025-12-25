<?php
/**
 * @file PatternLibrary.php
 * @brief Modèle pour la bibliothèque de patrons utilisateur
 * @author Nathalie + AI Assistants
 * @created 2025-11-19
 * @modified 2025-11-19 by [AI:Claude] - Création bibliothèque centralisée patrons
 *
 * @history
 *   2025-11-19 [AI:Claude] Création bibliothèque de patrons (PDF, images, URLs)
 */

declare(strict_types=1);

namespace App\Models;

use PDO;

class PatternLibrary
{
    private PDO $db;
    private string $table = 'pattern_library';

    public function __construct()
    {
        $this->db = \App\Config\Database::getInstance()->getConnection();
    }

    /**
     * [AI:Claude] Récupérer tous les patrons d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param array $filters Filtres (category, technique, favorite)
     * @param int $limit Limite
     * @param int $offset Offset
     * @return array Liste des patrons
     */
    public function getUserPatterns(int $userId, array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $conditions = ['user_id = :user_id'];
        $params = [':user_id' => $userId];

        // [AI:Claude] Filtres optionnels
        if (!empty($filters['category'])) {
            $conditions[] = 'category = :category';
            $params[':category'] = $filters['category'];
        }

        if (!empty($filters['technique'])) {
            $conditions[] = 'technique = :technique';
            $params[':technique'] = $filters['technique'];
        }

        if (!empty($filters['source_type'])) {
            $conditions[] = 'source_type = :source_type';
            $params[':source_type'] = $filters['source_type'];
        }

        if (isset($filters['favorite']) && $filters['favorite']) {
            $conditions[] = 'is_favorite = 1';
        }

        if (!empty($filters['search'])) {
            $conditions[] = '(name LIKE :search OR description LIKE :search)';
            $params[':search'] = '%'.$filters['search'].'%';
        }

        $whereClause = implode(' AND ', $conditions);

        $query = "SELECT * FROM {$this->table}
                  WHERE $whereClause
                  ORDER BY is_favorite DESC, created_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Récupérer un patron par ID
     *
     * @param int $id ID du patron
     * @return array|null Patron ou null
     */
    public function getPatternById(int $id): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $pattern = $stmt->fetch(PDO::FETCH_ASSOC);
        return $pattern ?: null;
    }

    /**
     * [AI:Claude] Créer un nouveau patron
     *
     * @param array $data Données du patron
     * @return int|false ID du patron créé ou false
     */
    public function createPattern(array $data): int|false
    {
        $query = "INSERT INTO {$this->table} (
                    user_id, name, description, source_type, file_path, file_type,
                    url, pattern_text, category, technique, difficulty, thumbnail_path, tags, notes
                  )
                  VALUES (
                    :user_id, :name, :description, :source_type, :file_path, :file_type,
                    :url, :pattern_text, :category, :technique, :difficulty, :thumbnail_path, :tags, :notes
                  )";

        $stmt = $this->db->prepare($query);

        $stmt->bindValue(':user_id', $data['user_id'], PDO::PARAM_INT);
        $stmt->bindValue(':name', $data['name']);
        $stmt->bindValue(':description', $data['description'] ?? null);
        $stmt->bindValue(':source_type', $data['source_type']);
        $stmt->bindValue(':file_path', $data['file_path'] ?? null);
        $stmt->bindValue(':file_type', $data['file_type'] ?? null);
        $stmt->bindValue(':url', $data['url'] ?? null);
        $stmt->bindValue(':pattern_text', $data['pattern_text'] ?? null);
        $stmt->bindValue(':category', $data['category'] ?? null);
        $stmt->bindValue(':technique', $data['technique'] ?? null);
        $stmt->bindValue(':difficulty', $data['difficulty'] ?? null);
        $stmt->bindValue(':thumbnail_path', $data['thumbnail_path'] ?? null);
        $stmt->bindValue(':tags', isset($data['tags']) ? json_encode($data['tags']) : null);
        $stmt->bindValue(':notes', $data['notes'] ?? null);

        if ($stmt->execute())
            return (int)$this->db->lastInsertId();

        return false;
    }

    /**
     * [AI:Claude] Mettre à jour un patron
     *
     * @param int $id ID du patron
     * @param array $data Données à mettre à jour
     * @return bool Succès
     */
    public function updatePattern(int $id, array $data): bool
    {
        $allowedFields = [
            'name', 'description', 'category', 'technique', 'difficulty',
            'thumbnail_path', 'tags', 'notes', 'is_favorite'
        ];

        $updates = [];
        $params = [':id' => $id];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updates[] = "$field = :$field";

                if ($field === 'tags' && is_array($data[$field]))
                    $params[":$field"] = json_encode($data[$field]);
                else
                    $params[":$field"] = $data[$field];
            }
        }

        if (empty($updates))
            return false;

        $query = "UPDATE {$this->table} SET ".implode(', ', $updates)." WHERE id = :id";

        $stmt = $this->db->prepare($query);

        foreach ($params as $key => $value) {
            if ($key === ':is_favorite')
                $stmt->bindValue($key, $value, PDO::PARAM_BOOL);
            else
                $stmt->bindValue($key, $value);
        }

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Supprimer un patron
     *
     * @param int $id ID du patron
     * @return bool Succès
     */
    public function deletePattern(int $id): bool
    {
        $query = "DELETE FROM {$this->table} WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Vérifier que le patron appartient à l'utilisateur
     *
     * @param int $patternId ID du patron
     * @param int $userId ID de l'utilisateur
     * @return bool Appartient ou non
     */
    public function belongsToUser(int $patternId, int $userId): bool
    {
        $query = "SELECT COUNT(*) FROM {$this->table}
                  WHERE id = :pattern_id AND user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':pattern_id', $patternId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchColumn() > 0;
    }

    /**
     * [AI:Claude] Incrémenter le compteur d'utilisation
     *
     * @param int $patternId ID du patron
     * @return bool Succès
     */
    public function incrementUsage(int $patternId): bool
    {
        $query = "UPDATE {$this->table}
                  SET times_used = times_used + 1,
                      last_used_at = NOW()
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $patternId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Obtenir les catégories uniques d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array Liste des catégories
     */
    public function getUserCategories(int $userId): array
    {
        $query = "SELECT DISTINCT category
                  FROM {$this->table}
                  WHERE user_id = :user_id
                    AND category IS NOT NULL
                    AND category != ''
                  ORDER BY category";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * [AI:Claude] Obtenir le nombre de patrons d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return int Nombre de patrons
     */
    public function getUserPatternCount(int $userId): int
    {
        $query = "SELECT COUNT(*) FROM {$this->table} WHERE user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return (int)$stmt->fetchColumn();
    }

    /**
     * [AI:Claude] Obtenir les stats de la bibliothèque
     *
     * @param int $userId ID de l'utilisateur
     * @return array Statistiques
     */
    public function getStats(int $userId): array
    {
        $query = "SELECT
                    COUNT(*) as total_patterns,
                    SUM(CASE WHEN source_type = 'file' THEN 1 ELSE 0 END) as file_patterns,
                    SUM(CASE WHEN source_type = 'url' THEN 1 ELSE 0 END) as url_patterns,
                    SUM(CASE WHEN source_type = 'text' THEN 1 ELSE 0 END) as text_patterns,
                    SUM(CASE WHEN is_favorite = 1 THEN 1 ELSE 0 END) as favorite_patterns,
                    SUM(times_used) as total_uses
                  FROM {$this->table}
                  WHERE user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
}
