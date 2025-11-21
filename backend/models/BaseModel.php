<?php
/**
 * @file BaseModel.php
 * @brief Classe de base pour tous les modèles
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Models;

use PDO;
use App\Config\Database;

/**
 * [AI:Claude] Classe abstraite de base pour tous les modèles
 * Fournit les méthodes CRUD communes et la connexion DB
 */
abstract class BaseModel
{
    protected PDO $db;
    protected string $table;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * [AI:Claude] Trouver un enregistrement par ID
     *
     * @param int $id ID de l'enregistrement
     * @return array|null Données de l'enregistrement ou null
     */
    public function findById(int $id): ?array
    {
        $sql = "SELECT * FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);

        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * [AI:Claude] Récupérer tous les enregistrements
     *
     * @param int $limit Limite de résultats
     * @param int $offset Décalage pour la pagination
     * @return array Liste des enregistrements
     */
    public function findAll(int $limit = 100, int $offset = 0): array
    {
        $sql = "SELECT * FROM {$this->table} LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * [AI:Claude] Créer un nouvel enregistrement
     *
     * @param array $data Données à insérer (clé => valeur)
     * @return int ID du nouvel enregistrement
     */
    public function create(array $data): int
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':'.implode(', :', array_keys($data));

        $sql = "INSERT INTO {$this->table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return (int)$this->db->lastInsertId();
    }

    /**
     * [AI:Claude] Mettre à jour un enregistrement
     *
     * @param int $id ID de l'enregistrement
     * @param array $data Données à mettre à jour
     * @return bool Succès de la mise à jour
     */
    public function update(int $id, array $data): bool
    {
        $setClause = [];
        foreach (array_keys($data) as $key)
            $setClause[] = "{$key} = :{$key}";

        $sql = "UPDATE {$this->table} SET ".implode(', ', $setClause)." WHERE id = :id";
        $data['id'] = $id;

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }

    /**
     * [AI:Claude] Supprimer un enregistrement
     *
     * @param int $id ID de l'enregistrement
     * @return bool Succès de la suppression
     */
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $id]);
    }

    /**
     * [AI:Claude] Compter le nombre total d'enregistrements
     *
     * @param array $conditions Conditions WHERE optionnelles
     * @return int Nombre d'enregistrements
     */
    public function count(array $conditions = []): int
    {
        $sql = "SELECT COUNT(*) as total FROM {$this->table}";

        if (!empty($conditions)) {
            $where = [];
            foreach (array_keys($conditions) as $key)
                $where[] = "{$key} = :{$key}";

            $sql .= " WHERE ".implode(' AND ', $where);
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($conditions);

        $result = $stmt->fetch();
        return (int)($result['total'] ?? 0);
    }

    /**
     * [AI:Claude] Trouver un enregistrement selon des conditions
     *
     * @param array $conditions Conditions de recherche (clé => valeur)
     * @return array|null Premier enregistrement trouvé ou null
     */
    public function findOne(array $conditions): ?array
    {
        $where = [];
        foreach (array_keys($conditions) as $key)
            $where[] = "{$key} = :{$key}";

        $sql = "SELECT * FROM {$this->table} WHERE ".implode(' AND ', $where)." LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($conditions);

        $result = $stmt->fetch();
        return $result ?: null;
    }

    /**
     * [AI:Claude] Trouver plusieurs enregistrements selon des conditions
     *
     * @param array $conditions Conditions de recherche
     * @param int $limit Limite de résultats
     * @param int $offset Décalage
     * @return array Liste des enregistrements
     */
    public function findBy(array $conditions, int $limit = 100, int $offset = 0): array
    {
        $where = [];
        foreach (array_keys($conditions) as $key)
            $where[] = "{$key} = :{$key}";

        $sql = "SELECT * FROM {$this->table} WHERE ".implode(' AND ', $where)
              ." LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($sql);

        foreach ($conditions as $key => $value)
            $stmt->bindValue(":{$key}", $value);

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll();
    }
}
