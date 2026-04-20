<?php
/**
 * @file PatternUsageNote.php
 * @brief Modèle pour les notes d'utilisation de patron (par projet)
 * @author Nathalie + AI Assistants
 * @created 2026-04-11
 * @modified 2026-04-11 by [AI:Claude] - Création
 */

declare(strict_types=1);

namespace App\Models;

use PDO;

class PatternUsageNote
{
    private PDO $db;
    private string $table = 'pattern_usage_notes';

    public function __construct()
    {
        $this->db = \App\Config\Database::getInstance()->getConnection();
    }

    /**
     * Récupérer toutes les notes d'un patron pour un utilisateur
     * Inclut le nom du projet associé si disponible
     */
    public function getNotesByPattern(int $patternId, int $userId): array
    {
        $query = "SELECT pun.*, p.name AS project_name
                  FROM {$this->table} pun
                  LEFT JOIN projects p ON p.id = pun.project_id
                  WHERE pun.pattern_library_id = :pattern_id
                    AND pun.user_id = :user_id
                  ORDER BY pun.created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->execute([':pattern_id' => $patternId, ':user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Créer une note
     */
    public function createNote(int $patternId, int $userId, ?int $projectId, string $note): int|false
    {
        $query = "INSERT INTO {$this->table} (user_id, pattern_library_id, project_id, note)
                  VALUES (:user_id, :pattern_id, :project_id, :note)";

        $stmt = $this->db->prepare($query);
        $success = $stmt->execute([
            ':user_id'    => $userId,
            ':pattern_id' => $patternId,
            ':project_id' => $projectId,
            ':note'       => $note,
        ]);

        return $success ? (int)$this->db->lastInsertId() : false;
    }

    /**
     * Mettre à jour une note (sécurisé par user_id)
     */
    public function updateNote(int $noteId, int $userId, string $note): bool
    {
        $query = "UPDATE {$this->table}
                  SET note = :note, updated_at = NOW()
                  WHERE id = :id AND user_id = :user_id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute([':note' => $note, ':id' => $noteId, ':user_id' => $userId]);
    }

    /**
     * Supprimer une note (sécurisé par user_id)
     */
    public function deleteNote(int $noteId, int $userId): bool
    {
        $query = "DELETE FROM {$this->table} WHERE id = :id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':id' => $noteId, ':user_id' => $userId]);
    }

    /**
     * Vérifier qu'une note appartient à un utilisateur
     */
    public function belongsToUser(int $noteId, int $userId): bool
    {
        $query = "SELECT COUNT(*) FROM {$this->table} WHERE id = :id AND user_id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $noteId, ':user_id' => $userId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    /**
     * Récupérer une note par son ID
     */
    public function getNoteById(int $noteId): ?array
    {
        $query = "SELECT pun.*, p.name AS project_name
                  FROM {$this->table} pun
                  LEFT JOIN projects p ON p.id = pun.project_id
                  WHERE pun.id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $noteId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }
}
