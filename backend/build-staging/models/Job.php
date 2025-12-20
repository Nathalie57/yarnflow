<?php
/**
 * @file Job.php
 * @brief Modèle pour la gestion des jobs asynchrones
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création du système de queue asynchrone
 *
 * @history
 *   2025-11-14 [AI:Claude] Création initiale avec système de retry
 */

declare(strict_types=1);

namespace App\Models;

/**
 * [AI:Claude] Modèle de gestion des jobs asynchrones pour la queue
 * Gère la création, réservation et traitement des jobs
 */
class Job extends BaseModel
{
    protected string $table = 'jobs';

    // [AI:Claude] Statuts possibles des jobs
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    // [AI:Claude] Types de jobs
    public const TYPE_GENERATE_PATTERN = 'generate_pattern';

    /**
     * [AI:Claude] Créer un nouveau job dans la queue
     *
     * @param string $type Type de job
     * @param array $payload Données du job
     * @param int $maxAttempts Nombre maximum de tentatives
     * @return int ID du job créé
     */
    public function createJob(string $type, array $payload, int $maxAttempts = 3): int
    {
        $query = "INSERT INTO {$this->table}
                  (type, payload, status, max_attempts, available_at)
                  VALUES (:type, :payload, :status, :max_attempts, :available_at)";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'type' => $type,
            'payload' => json_encode($payload),
            'status' => self::STATUS_PENDING,
            'max_attempts' => $maxAttempts,
            'available_at' => date('Y-m-d H:i:s')
        ]);

        return (int)$this->db->lastInsertId();
    }

    /**
     * [AI:Claude] Réserver un job disponible pour traitement
     * Utilise un lock pour éviter les conflits entre workers
     *
     * @param string $workerName Nom du worker qui réserve
     * @param array $types Types de jobs à traiter (vide = tous)
     * @return array|null Job réservé ou null si aucun disponible
     */
    public function reserveNextJob(string $workerName, array $types = []): ?array
    {
        // [AI:Claude] Lock pour éviter que deux workers prennent le même job
        $this->db->beginTransaction();

        try {
            $typeCondition = '';
            $params = [
                'status' => self::STATUS_PENDING,
                'now' => date('Y-m-d H:i:s')
            ];

            if (!empty($types)) {
                $placeholders = implode(',', array_fill(0, count($types), '?'));
                $typeCondition = "AND type IN ($placeholders)";
                $params = array_merge($params, $types);
            }

            $query = "SELECT * FROM {$this->table}
                      WHERE status = :status
                      AND available_at <= :now
                      {$typeCondition}
                      ORDER BY created_at ASC
                      LIMIT 1
                      FOR UPDATE";

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $job = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$job) {
                $this->db->commit();
                return null;
            }

            // [AI:Claude] Réserver le job pour ce worker
            $updateQuery = "UPDATE {$this->table}
                            SET status = :status,
                                reserved_at = :reserved_at,
                                reserved_by = :reserved_by,
                                attempts = attempts + 1
                            WHERE id = :id";

            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->execute([
                'status' => self::STATUS_PROCESSING,
                'reserved_at' => date('Y-m-d H:i:s'),
                'reserved_by' => $workerName,
                'id' => $job['id']
            ]);

            $this->db->commit();

            // [AI:Claude] Décoder le payload JSON
            $job['payload'] = json_decode($job['payload'], true);
            $job['attempts'] = (int)$job['attempts'] + 1;

            return $job;

        } catch (\Exception $e) {
            $this->db->rollBack();
            error_log('[Job] Erreur réservation : '.$e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Marquer un job comme complété avec succès
     *
     * @param int $jobId ID du job
     * @return bool Succès de l'opération
     */
    public function markAsCompleted(int $jobId): bool
    {
        $query = "UPDATE {$this->table}
                  SET status = :status,
                      completed_at = :completed_at
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => date('Y-m-d H:i:s'),
            'id' => $jobId
        ]);
    }

    /**
     * [AI:Claude] Marquer un job comme échoué
     * Si le nombre max de tentatives n'est pas atteint, le job sera retry avec un délai exponentiel
     *
     * @param int $jobId ID du job
     * @param string $errorMessage Message d'erreur
     * @return bool Succès de l'opération
     */
    public function markAsFailed(int $jobId, string $errorMessage): bool
    {
        // [AI:Claude] Récupérer le job pour vérifier le nombre de tentatives
        $job = $this->findById($jobId);

        if (!$job)
            return false;

        $attempts = (int)$job['attempts'];
        $maxAttempts = (int)$job['max_attempts'];

        // [AI:Claude] Si on peut encore retry, on remet en pending avec un délai
        if ($attempts < $maxAttempts) {
            // [AI:Claude] Backoff exponentiel : 1min, 5min, 15min
            $delay = min(pow(5, $attempts) * 60, 900);
            $availableAt = date('Y-m-d H:i:s', time() + $delay);

            $query = "UPDATE {$this->table}
                      SET status = :status,
                          error_message = :error_message,
                          available_at = :available_at,
                          reserved_at = NULL,
                          reserved_by = NULL
                      WHERE id = :id";

            $stmt = $this->db->prepare($query);
            return $stmt->execute([
                'status' => self::STATUS_PENDING,
                'error_message' => $errorMessage,
                'available_at' => $availableAt,
                'id' => $jobId
            ]);
        }

        // [AI:Claude] Trop de tentatives, on marque comme définitivement failed
        $query = "UPDATE {$this->table}
                  SET status = :status,
                      error_message = :error_message
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            'status' => self::STATUS_FAILED,
            'error_message' => $errorMessage,
            'id' => $jobId
        ]);
    }

    /**
     * [AI:Claude] Obtenir le statut d'un job
     *
     * @param int $jobId ID du job
     * @return string|null Statut ou null si introuvable
     */
    public function getStatus(int $jobId): ?string
    {
        $job = $this->findById($jobId);
        return $job ? $job['status'] : null;
    }

    /**
     * [AI:Claude] Lier un job à un patron
     *
     * @param int $patternId ID du patron
     * @param int $jobId ID du job
     * @return bool Succès de l'opération
     */
    public function linkToPattern(int $patternId, int $jobId): bool
    {
        $query = "INSERT INTO pattern_jobs (pattern_id, job_id)
                  VALUES (:pattern_id, :job_id)";

        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            'pattern_id' => $patternId,
            'job_id' => $jobId
        ]);
    }

    /**
     * [AI:Claude] Obtenir le job associé à un patron
     *
     * @param int $patternId ID du patron
     * @return array|null Job ou null si aucun lien
     */
    public function getJobByPattern(int $patternId): ?array
    {
        $query = "SELECT j.* FROM {$this->table} j
                  INNER JOIN pattern_jobs pj ON pj.job_id = j.id
                  WHERE pj.pattern_id = :pattern_id
                  ORDER BY j.created_at DESC
                  LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->execute(['pattern_id' => $patternId]);
        $job = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($job && $job['payload'])
            $job['payload'] = json_decode($job['payload'], true);

        return $job ?: null;
    }

    /**
     * [AI:Claude] Nettoyer les vieux jobs complétés (> 7 jours)
     *
     * @param int $days Nombre de jours à conserver
     * @return int Nombre de jobs supprimés
     */
    public function cleanOldJobs(int $days = 7): int
    {
        $query = "DELETE FROM {$this->table}
                  WHERE status = :status
                  AND completed_at < DATE_SUB(NOW(), INTERVAL :days DAY)";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'status' => self::STATUS_COMPLETED,
            'days' => $days
        ]);

        return $stmt->rowCount();
    }

    /**
     * [AI:Claude] Obtenir les statistiques de la queue
     *
     * @return array Stats par statut
     */
    public function getQueueStats(): array
    {
        $query = "SELECT status, COUNT(*) as count
                  FROM {$this->table}
                  GROUP BY status";

        $stmt = $this->db->query($query);
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $stats = [
            'pending' => 0,
            'processing' => 0,
            'completed' => 0,
            'failed' => 0,
            'total' => 0
        ];

        foreach ($results as $row) {
            $stats[$row['status']] = (int)$row['count'];
            $stats['total'] += (int)$row['count'];
        }

        return $stats;
    }

    /**
     * [AI:Claude] Libérer les jobs bloqués en processing depuis trop longtemps
     * (worker crashé ou timeout)
     *
     * @param int $timeoutMinutes Timeout en minutes (défaut 15min)
     * @return int Nombre de jobs libérés
     */
    public function releaseStuckJobs(int $timeoutMinutes = 15): int
    {
        $query = "UPDATE {$this->table}
                  SET status = :status,
                      reserved_at = NULL,
                      reserved_by = NULL,
                      available_at = NOW()
                  WHERE status = :processing_status
                  AND reserved_at < DATE_SUB(NOW(), INTERVAL :timeout MINUTE)
                  AND attempts < max_attempts";

        $stmt = $this->db->prepare($query);
        $stmt->execute([
            'status' => self::STATUS_PENDING,
            'processing_status' => self::STATUS_PROCESSING,
            'timeout' => $timeoutMinutes
        ]);

        return $stmt->rowCount();
    }
}
