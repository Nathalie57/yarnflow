<?php
/**
 * @file PatternLibraryFile.php
 * @brief Modèle pour les fichiers additionnels d'un patron de bibliothèque
 * @author Nathalie + AI Assistants
 * @created 2026-04-12
 * @modified 2026-04-12 by [AI:Claude] - Création support multi-fichiers
 */

declare(strict_types=1);

namespace App\Models;

use PDO;

class PatternLibraryFile
{
    private PDO $db;
    private string $table = 'pattern_library_files';

    public function __construct()
    {
        $this->db = \App\Config\Database::getInstance()->getConnection();
    }

    /**
     * Récupérer tous les fichiers additionnels d'un patron
     */
    public function getFilesByPatternId(int $patternId): array
    {
        $query = "SELECT * FROM {$this->table}
                  WHERE pattern_library_id = :pattern_id
                  ORDER BY sort_order ASC, created_at ASC";

        $stmt = $this->db->prepare($query);
        $stmt->execute([':pattern_id' => $patternId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupérer un fichier par son ID
     */
    public function getFileById(int $fileId): ?array
    {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $fileId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Ajouter un fichier à un patron
     */
    public function addFile(int $patternId, string $filePath, string $fileType, string $fileName): int|false
    {
        // Déterminer l'ordre (après le dernier fichier existant)
        $sortOrder = $this->getNextSortOrder($patternId);

        $query = "INSERT INTO {$this->table} (pattern_library_id, file_path, file_type, file_name, sort_order)
                  VALUES (:pattern_id, :file_path, :file_type, :file_name, :sort_order)";

        $stmt = $this->db->prepare($query);
        $success = $stmt->execute([
            ':pattern_id' => $patternId,
            ':file_path'  => $filePath,
            ':file_type'  => $fileType,
            ':file_name'  => $fileName,
            ':sort_order' => $sortOrder,
        ]);

        return $success ? (int)$this->db->lastInsertId() : false;
    }

    /**
     * Supprimer un fichier additionnel
     */
    public function deleteFile(int $fileId): bool
    {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':id' => $fileId]);
    }

    /**
     * Vérifier qu'un fichier appartient bien à un patron donné
     */
    public function belongsToPattern(int $fileId, int $patternId): bool
    {
        $query = "SELECT COUNT(*) FROM {$this->table}
                  WHERE id = :id AND pattern_library_id = :pattern_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $fileId, ':pattern_id' => $patternId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    /**
     * Compter les fichiers additionnels d'un patron
     */
    public function countByPatternId(int $patternId): int
    {
        $query = "SELECT COUNT(*) FROM {$this->table} WHERE pattern_library_id = :pattern_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':pattern_id' => $patternId]);
        return (int)$stmt->fetchColumn();
    }

    private function getNextSortOrder(int $patternId): int
    {
        $query = "SELECT COALESCE(MAX(sort_order), -1) + 1 FROM {$this->table}
                  WHERE pattern_library_id = :pattern_id";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':pattern_id' => $patternId]);
        return (int)$stmt->fetchColumn();
    }
}
