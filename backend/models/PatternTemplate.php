<?php
/**
 * @file PatternTemplate.php
 * @brief Modèle pour gérer les patrons de référence (prompt engineering)
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Models;

use PDO;

/**
 * [AI:Claude] Modèle PatternTemplate pour la bibliothèque de patrons de référence
 * Ces patrons servent d'exemples pour l'IA lors de la génération
 */
class PatternTemplate extends BaseModel
{
    protected string $table = 'pattern_templates';

    /**
     * [AI:Claude] Créer un nouveau patron de référence
     *
     * @param array $data Données du patron (name, type, level, content, etc.)
     * @return int ID du nouveau patron template
     */
    public function createTemplate(array $data): int
    {
        $templateData = [
            'name' => $data['name'],
            'type' => $data['type'],
            'subtype' => $data['subtype'] ?? null,
            'level' => $data['level'],
            'size' => $data['size'] ?? null,
            'content' => is_array($data['content'])
                ? json_encode($data['content'], JSON_UNESCAPED_UNICODE)
                : $data['content'],
            'yarn_weight' => $data['yarn_weight'] ?? null,
            'hook_size' => $data['hook_size'] ?? null,
            'materials' => isset($data['materials'])
                ? json_encode($data['materials'], JSON_UNESCAPED_UNICODE)
                : null,
            'estimated_time' => $data['estimated_time'] ?? null,
            'tags' => isset($data['tags'])
                ? json_encode($data['tags'], JSON_UNESCAPED_UNICODE)
                : null,
            'language' => $data['language'] ?? 'fr',
            'is_active' => $data['is_active'] ?? true,
            'created_by' => $data['created_by'] ?? null
        ];

        return $this->create($templateData);
    }

    /**
     * [AI:Claude] Trouver des patrons de référence par type et niveau
     * Utilisé pour récupérer les exemples à envoyer à l'IA
     *
     * @param string $type Type de projet (bonnet, chale, ourson, etc.)
     * @param string|null $level Niveau optionnel (beginner, intermediate, advanced)
     * @param int $limit Nombre maximum de patrons à récupérer
     * @return array Liste des patrons de référence
     */
    public function findByTypeAndLevel(
        string $type,
        ?string $level = null,
        int $limit = 5
    ): array {
        $sql = "SELECT * FROM {$this->table}
                WHERE type = :type
                AND is_active = 1";

        $params = ['type' => $type];

        if ($level !== null) {
            $sql .= " AND level = :level";
            $params['level'] = $level;
        }

        $sql .= " ORDER BY usage_count DESC, created_at DESC LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':type', $type);

        if ($level !== null)
            $stmt->bindValue(':level', $level);

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * [AI:Claude] Rechercher des patrons par tags
     *
     * @param array $tags Liste de tags à rechercher
     * @param int $limit Nombre maximum de résultats
     * @return array Liste des patrons correspondants
     */
    public function findByTags(array $tags, int $limit = 10): array
    {
        if (empty($tags))
            return [];

        $sql = "SELECT * FROM {$this->table} WHERE is_active = 1 AND (";

        $conditions = [];
        $params = [];

        foreach ($tags as $index => $tag) {
            $paramName = "tag_{$index}";
            $conditions[] = "JSON_CONTAINS(tags, JSON_QUOTE(:$paramName))";
            $params[$paramName] = $tag;
        }

        $sql .= implode(' OR ', $conditions);
        $sql .= ") ORDER BY usage_count DESC LIMIT :limit";

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value)
            $stmt->bindValue(":{$key}", $value);

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * [AI:Claude] Obtenir tous les types disponibles
     *
     * @return array Liste des types uniques
     */
    public function getAllTypes(): array
    {
        $sql = "SELECT DISTINCT type FROM {$this->table}
                WHERE is_active = 1
                ORDER BY type ASC";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * [AI:Claude] Obtenir les sous-types pour un type donné
     *
     * @param string $type Type principal
     * @return array Liste des sous-types
     */
    public function getSubtypesByType(string $type): array
    {
        $sql = "SELECT DISTINCT subtype FROM {$this->table}
                WHERE type = :type
                AND subtype IS NOT NULL
                AND is_active = 1
                ORDER BY subtype ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['type' => $type]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * [AI:Claude] Incrémenter le compteur d'utilisation d'un patron
     * Appelé à chaque fois qu'un patron est utilisé comme référence pour l'IA
     *
     * @param int $templateId ID du patron template
     * @return bool Succès de la mise à jour
     */
    public function incrementUsageCount(int $templateId): bool
    {
        $sql = "UPDATE {$this->table}
                SET usage_count = usage_count + 1
                WHERE id = :id";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $templateId]);
    }

    /**
     * [AI:Claude] Récupérer le contenu décodé d'un patron
     *
     * @param int $templateId ID du patron
     * @return array|null Contenu du patron décodé ou null
     */
    public function getDecodedContent(int $templateId): ?array
    {
        $template = $this->findById($templateId);

        if ($template === null)
            return null;

        return [
            'id' => $template['id'],
            'name' => $template['name'],
            'type' => $template['type'],
            'subtype' => $template['subtype'],
            'level' => $template['level'],
            'size' => $template['size'],
            'content' => json_decode($template['content'], true),
            'yarn_weight' => $template['yarn_weight'],
            'hook_size' => $template['hook_size'],
            'materials' => json_decode($template['materials'] ?? '[]', true),
            'estimated_time' => $template['estimated_time'],
            'tags' => json_decode($template['tags'] ?? '[]', true),
            'language' => $template['language']
        ];
    }

    /**
     * [AI:Claude] Activer ou désactiver un patron template
     *
     * @param int $templateId ID du patron
     * @param bool $active True pour activer, false pour désactiver
     * @return bool Succès de la mise à jour
     */
    public function setActive(int $templateId, bool $active): bool
    {
        return $this->update($templateId, ['is_active' => $active]);
    }

    /**
     * [AI:Claude] Recherche intelligente de patrons de référence
     * Combine type, niveau, taille et tags pour trouver les meilleurs exemples
     *
     * @param array $criteria Critères de recherche (type, level, size, tags)
     * @param int $limit Nombre maximum de résultats
     * @return array Liste des patrons les plus pertinents
     */
    public function findBestMatches(array $criteria, int $limit = 3): array
    {
        $sql = "SELECT *,
                (CASE
                    WHEN level = :level THEN 2
                    ELSE 0
                END) +
                (CASE
                    WHEN size = :size THEN 1
                    ELSE 0
                END) as relevance_score
                FROM {$this->table}
                WHERE type = :type
                AND is_active = 1
                ORDER BY relevance_score DESC, usage_count DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':type', $criteria['type']);
        $stmt->bindValue(':level', $criteria['level'] ?? '');
        $stmt->bindValue(':size', $criteria['size'] ?? '');
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * [AI:Claude] Obtenir les statistiques d'utilisation des templates
     *
     * @return array Statistiques par type
     */
    public function getUsageStats(): array
    {
        $sql = "SELECT type,
                       COUNT(*) as total_templates,
                       SUM(usage_count) as total_usage,
                       AVG(usage_count) as avg_usage
                FROM {$this->table}
                WHERE is_active = 1
                GROUP BY type
                ORDER BY total_usage DESC";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
}
