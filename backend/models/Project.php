<?php
/**
 * @file Project.php
 * @brief Modèle pour gérer les projets de crochet et le compteur de rangs
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-18 by [AI:Claude] - Ajout système de sections/parties de projet
 *
 * @history
 *   2025-11-18 [AI:Claude] Ajout gestion sections (face, dos, manches, etc.)
 *   2025-11-13 [AI:Claude] Création initiale avec gestion projets + compteur
 */

declare(strict_types=1);

namespace App\Models;

use PDO;

class Project extends BaseModel
{
    protected string $table = 'projects';

    /**
     * [AI:Claude] Créer un nouveau projet
     *
     * @param array $data Données du projet
     * @return int|false ID du projet créé ou false
     */
    public function createProject(array $data): int|false
    {
        $query = "INSERT INTO {$this->table}
                  (user_id, name, technique, type, description, pattern_id, main_photo, status,
                   total_rows, yarn_brand, yarn_color, yarn_weight, hook_size, notes, technical_details, is_public)
                  VALUES
                  (:user_id, :name, :technique, :type, :description, :pattern_id, :main_photo, :status,
                   :total_rows, :yarn_brand, :yarn_color, :yarn_weight, :hook_size, :notes, :technical_details, :is_public)";

        $stmt = $this->db->prepare($query);

        $params = [
            ':user_id' => $data['user_id'],
            ':name' => $data['name'],
            ':technique' => $data['technique'] ?? 'crochet', // [AI:Claude] Yarn Hub v0.9.0
            ':type' => $data['type'] ?? null,
            ':description' => $data['description'] ?? null,
            ':pattern_id' => $data['pattern_id'] ?? null,
            ':main_photo' => $data['main_photo'] ?? null,
            ':status' => $data['status'] ?? 'in_progress',
            ':total_rows' => $data['total_rows'] ?? null,
            ':yarn_brand' => $data['yarn_brand'] ?? null,
            ':yarn_color' => $data['yarn_color'] ?? null,
            ':yarn_weight' => $data['yarn_weight'] ?? null,
            ':hook_size' => $data['hook_size'] ?? null,
            ':notes' => $data['notes'] ?? null,
            ':technical_details' => $data['technical_details'] ?? null, // [AI:Claude] Détails techniques (JSON)
            ':is_public' => isset($data['is_public']) ? (int)$data['is_public'] : 0
        ];

        if ($stmt->execute($params)) {
            $projectId = (int) $this->db->lastInsertId();
            $this->recalculateUserStats((int)$data['user_id']);
            return $projectId;
        }

        return false;
    }

    /**
     * [AI:Claude] Récupérer tous les projets d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param string|null $status Filtrer par statut (optionnel)
     * @param int $limit Limite
     * @param int $offset Offset
     * @return array Liste des projets
     */
    public function getUserProjects(int $userId, ?string $status = null, int $limit = 50, int $offset = 0): array
    {
        $query = "SELECT p.*,
                  COUNT(DISTINCT pr.id) as rows_count,
                  CONCAT(
                      FLOOR(
                          CASE
                              WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                  COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                              ELSE p.total_time
                          END / 3600
                      ), 'h ',
                      FLOOR(
                          (CASE
                              WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                  COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                              ELSE p.total_time
                          END % 3600) / 60
                      ), 'min ',
                      (CASE
                          WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                              COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                          ELSE p.total_time
                      END % 60), 'sec'
                  ) as time_formatted,
                  CASE
                      WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                          (SELECT CASE
                              WHEN SUM(total_rows) > 0 THEN ROUND((SUM(current_row) / SUM(total_rows)) * 100, 1)
                              ELSE NULL
                          END FROM project_sections WHERE project_id = p.id)
                      WHEN p.total_rows IS NOT NULL THEN ROUND((p.current_row / p.total_rows) * 100, 1)
                      ELSE NULL
                  END as completion_percentage,
                  CASE
                      WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                          COALESCE((SELECT SUM(current_row) FROM project_sections WHERE project_id = p.id), 0)
                      ELSE p.current_row
                  END as current_row,
                  CASE
                      WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                          (SELECT SUM(total_rows) FROM project_sections WHERE project_id = p.id)
                      ELSE p.total_rows
                  END as total_rows,
                  (SELECT name FROM project_sections WHERE id = p.current_section_id) as current_section_name,
                  (SELECT current_row FROM project_sections WHERE id = p.current_section_id) as current_section_row,
                  (SELECT total_rows FROM project_sections WHERE id = p.current_section_id) as current_section_total_rows,
                  (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) as sections_count
                  FROM {$this->table} p
                  LEFT JOIN project_rows pr ON p.id = pr.project_id
                  WHERE p.user_id = :user_id";

        if ($status !== null)
            $query .= " AND p.status = :status";

        $query .= " GROUP BY p.id
                    ORDER BY p.last_worked_at DESC, p.updated_at DESC
                    LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        if ($status !== null)
            $stmt->bindValue(':status', $status, PDO::PARAM_STR);

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Récupérer un projet par ID
     *
     * @param int $projectId ID du projet
     * @return array|null Projet ou null
     */
    public function getProjectById(int $projectId): ?array
    {
        $query = "SELECT p.*,
                  COUNT(DISTINCT pr.id) as rows_count,
                  CONCAT(
                      FLOOR(
                          CASE
                              WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                  COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                              ELSE p.total_time
                          END / 3600
                      ), 'h ',
                      FLOOR(
                          (CASE
                              WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                                  COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                              ELSE p.total_time
                          END % 3600) / 60
                      ), 'min ',
                      (CASE
                          WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                              COALESCE((SELECT SUM(time_spent) FROM project_sections WHERE project_id = p.id), 0)
                          ELSE p.total_time
                      END % 60), 'sec'
                  ) as time_formatted,
                  CASE
                      WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                          (SELECT CASE
                              WHEN SUM(total_rows) > 0 THEN ROUND((SUM(current_row) / SUM(total_rows)) * 100, 1)
                              ELSE NULL
                          END FROM project_sections WHERE project_id = p.id)
                      WHEN p.total_rows IS NOT NULL THEN ROUND((p.current_row / p.total_rows) * 100, 1)
                      ELSE NULL
                  END as completion_percentage,
                  CASE
                      WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                          COALESCE((SELECT SUM(current_row) FROM project_sections WHERE project_id = p.id), 0)
                      ELSE p.current_row
                  END as current_row,
                  CASE
                      WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                          (SELECT SUM(total_rows) FROM project_sections WHERE project_id = p.id)
                      ELSE p.total_rows
                  END as total_rows,
                  (SELECT name FROM project_sections WHERE id = p.current_section_id) as current_section_name,
                  (SELECT current_row FROM project_sections WHERE id = p.current_section_id) as current_section_row,
                  (SELECT total_rows FROM project_sections WHERE id = p.current_section_id) as current_section_total_rows,
                  (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) as sections_count
                  FROM {$this->table} p
                  LEFT JOIN project_rows pr ON p.id = pr.project_id
                  WHERE p.id = :id
                  GROUP BY p.id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $projectId, PDO::PARAM_INT);
        $stmt->execute();

        $project = $stmt->fetch(PDO::FETCH_ASSOC);
        return $project ?: null;
    }

    /**
     * [AI:Claude] Mettre à jour un projet
     *
     * @param int $projectId ID du projet
     * @param array $data Nouvelles données
     * @return bool Succès
     */
    public function updateProject(int $projectId, array $data): bool
    {
        $allowedFields = [
            'name', 'technique', 'type', 'description', 'main_photo', 'status', 'total_rows',
            'current_row', // [AI:Claude] FIX: Permettre la mise à jour du compteur de rangs
            'counter_unit', 'counter_unit_increment', // [AI:Claude] v0.16.2 - Support unité compteur (rangs/cm)
            'yarn_brand', 'yarn_color', 'yarn_weight', 'hook_size', 'yarn_used_grams',
            'notes', 'pattern_notes', 'is_public', 'is_favorite', 'completed_at',
            'pattern_path', 'pattern_url', 'pattern_text', 'pattern_library_id', // [AI:Claude] v0.13.0 - Support texte patron
            'technical_details', // [AI:Claude] v0.13.0 - Détails techniques structurés (laine, aiguilles, échantillon)
            'secondary_label', 'secondary_target', 'secondary_count', // [AI:Claude] Sync compteur secondaire multi-appareils
            'reminders', 'deadline' // Rappels de rang + objectif de date
        ];

        $fields = [];
        $params = [':id' => $projectId];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields))
            return false;

        // [AI:Claude] Si status change vers completed, set completed_at
        if (isset($data['status']) && $data['status'] === 'completed' && !isset($data['completed_at']))
            $fields[] = "completed_at = NOW()";

        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $result = $stmt->execute($params);

        // Recalculer les stats seulement si le statut change (pas sur chaque incrément de rang)
        if ($result && isset($data['status'])) {
            $userStmt = $this->db->prepare("SELECT user_id FROM {$this->table} WHERE id = :id");
            $userStmt->execute([':id' => $projectId]);
            $userId = $userStmt->fetchColumn();
            if ($userId) $this->recalculateUserStats((int)$userId);
        }

        return $result;
    }

    /**
     * [AI:Claude] v0.16.2 - Valider la valeur du compteur selon l'unité
     *
     * @param float $value Valeur du compteur
     * @param string $unit Unité ('rows' ou 'cm')
     * @return bool Valide ou non
     */
    public function validateCounterValue(float $value, string $unit): bool
    {
        // Valeur négative invalide
        if ($value < 0) {
            return false;
        }

        if ($unit === 'rows') {
            // Mode rangs : doit être un entier
            return floor($value) == $value;
        } elseif ($unit === 'cm') {
            // Mode cm : doit être un multiple de 0.5 (0.0, 0.5, 1.0, 1.5...)
            return ($value * 2) == floor($value * 2);
        }

        return false;
    }

    /**
     * [AI:Claude] Supprimer un projet
     *
     * @param int $projectId ID du projet
     * @return bool Succès
     */
    public function deleteProject(int $projectId): bool
    {
        return $this->delete($projectId);
    }

    /**
     * [AI:Claude] Vérifier si un projet appartient à un utilisateur
     *
     * @param int $projectId ID du projet
     * @param int $userId ID de l'utilisateur
     * @return bool Appartient ou non
     */
    public function belongsToUser(int $projectId, int $userId): bool
    {
        $query = "SELECT COUNT(*) as count FROM {$this->table}
                  WHERE id = :project_id AND user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }

    /**
     * [AI:Claude] Ajouter un rang au compteur
     *
     * @param int $projectId ID du projet
     * @param array $rowData Données du rang
     * @return int|false ID du rang créé ou false
     */
    public function addRow(int $projectId, array $rowData): int|false
    {
        $query = "INSERT INTO project_rows
                  (project_id, section_id, row_num, stitch_count, stitch_type, duration, notes, difficulty_rating, photo, completed_at,
                   secondary_count, secondary_target, secondary_label)
                  VALUES
                  (:project_id, :section_id, :row_num, :stitch_count, :stitch_type, :duration, :notes, :difficulty_rating, :photo, :completed_at,
                   :secondary_count, :secondary_target, :secondary_label)
                  ON DUPLICATE KEY UPDATE
                  section_id = VALUES(section_id),
                  stitch_count = VALUES(stitch_count),
                  stitch_type = VALUES(stitch_type),
                  duration = VALUES(duration),
                  notes = VALUES(notes),
                  difficulty_rating = VALUES(difficulty_rating),
                  photo = VALUES(photo),
                  completed_at = VALUES(completed_at),
                  secondary_count = VALUES(secondary_count),
                  secondary_target = VALUES(secondary_target),
                  secondary_label = VALUES(secondary_label)";

        $stmt = $this->db->prepare($query);

        $params = [
            ':project_id' => $projectId,
            ':section_id' => $rowData['section_id'] ?? null,
            ':row_num' => $rowData['row_number'],
            ':stitch_count' => $rowData['stitch_count'] ?? null,
            ':stitch_type' => $rowData['stitch_type'] ?? null,
            ':duration' => $rowData['duration'] ?? null,
            ':notes' => $rowData['notes'] ?? null,
            ':difficulty_rating' => $rowData['difficulty_rating'] ?? null,
            ':photo' => $rowData['photo'] ?? null,
            ':completed_at' => $rowData['completed_at'] ?? date('Y-m-d H:i:s'),
            ':secondary_count' => $rowData['secondary_count'] ?? null,
            ':secondary_target' => $rowData['secondary_target'] ?? null,
            ':secondary_label' => $rowData['secondary_label'] ?? null,
        ];

        if (!$stmt->execute($params))
            return false;

        $rowId = (int) $this->db->lastInsertId();

        // [AI:Claude] Mettre à jour current_row dans la section si définie
        if (isset($rowData['section_id']) && $rowData['section_id'] !== null) {
            $updateSectionQuery = "UPDATE project_sections
                                   SET current_row = :row_num
                                   WHERE id = :section_id";

            $updateStmt = $this->db->prepare($updateSectionQuery);
            $updateStmt->bindValue(':row_num', $rowData['row_number'], PDO::PARAM_INT);
            $updateStmt->bindValue(':section_id', $rowData['section_id'], PDO::PARAM_INT);
            $updateStmt->execute();
        }

        return $rowId;
    }

    /**
     * [AI:Claude] Récupérer l'historique des rangs d'un projet
     *
     * @param int $projectId ID du projet
     * @param int $limit Limite
     * @return array Historique des rangs
     */
    public function getProjectRows(int $projectId, int $limit = 100, ?int $sectionId = null): array
    {
        // [AI:Claude] FIX: Support du filtrage par section_id
        if ($sectionId !== null) {
            $query = "SELECT * FROM project_rows
                      WHERE project_id = :project_id AND section_id = :section_id
                      ORDER BY row_num DESC
                      LIMIT :limit";
        } else {
            $query = "SELECT * FROM project_rows
                      WHERE project_id = :project_id AND section_id IS NULL
                      ORDER BY row_num DESC
                      LIMIT :limit";
        }

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        if ($sectionId !== null) {
            $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Supprimer un rang
     *
     * @param int $projectId ID du projet
     * @param int $rowId ID du rang à supprimer
     * @return bool True si supprimé, false sinon
     */
    public function deleteRow(int $projectId, int $rowId): bool
    {
        $query = "DELETE FROM project_rows
                  WHERE id = :row_id AND project_id = :project_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':row_id', $rowId, PDO::PARAM_INT);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Démarrer une session de travail
     *
     * @param int $projectId ID du projet
     * @param int|null $sectionId ID de la section en cours (optionnel)
     * @return int|false ID de la session créée ou false
     */
    public function startSession(int $projectId, ?int $sectionId = null): int|false
    {
        // [AI:Claude] `beforeunload` (seul déclencheur de fermeture normale)
        // ne se déclenche pas de façon fiable sur mobile/PWA quand l'app est
        // mise en arrière-plan ou tuée par l'OS — ça laissait des sessions
        // avec ended_at=NULL/duration=0 s'accumuler indéfiniment. On ferme
        // donc toute session restée ouverte sur ce projet avant d'en démarrer
        // une nouvelle (voir closeDanglingSessions pour le plafond de durée).
        $this->closeDanglingSessions($projectId);

        $query = "INSERT INTO project_sessions (project_id, section_id, started_at)
                  VALUES (:project_id, :section_id, NOW())";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);

        if ($stmt->execute())
            return (int) $this->db->lastInsertId();

        return false;
    }

    /**
     * [AI:Claude] Referme les sessions restées ouvertes (ended_at IS NULL) sur
     * un projet, avec une durée plafonnée pour ne pas polluer les stats si la
     * session est restée ouverte des heures/jours (app tuée en arrière-plan,
     * téléphone éteint, etc.) — voir startSession() et le cron
     * close-stale-sessions.php pour les sessions dont l'utilisateur ne
     * revient jamais démarrer de nouvelle session sur le même projet.
     *
     * @param int $projectId ID du projet
     * @param int $maxDurationSeconds Plafond de durée recréditée (défaut 3h)
     */
    public function closeDanglingSessions(int $projectId, int $maxDurationSeconds = 10800): void
    {
        $query = "SELECT id, TIMESTAMPDIFF(SECOND, started_at, NOW()) as elapsed
                  FROM project_sessions
                  WHERE project_id = :project_id AND ended_at IS NULL";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->execute();
        $dangling = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($dangling as $row) {
            $cappedDuration = max(0, min((int) $row['elapsed'], $maxDurationSeconds));
            $this->endSession((int) $row['id'], 0, 'Fermée automatiquement (session non terminée normalement)', $cappedDuration);
        }
    }

    /**
     * [AI:Claude] Terminer une session de travail
     *
     * @param int $sessionId ID de la session
     * @param int $rowsCompleted Nombre de rangs complétés
     * @param string|null $notes Notes de la session
     * @param int|null $duration Durée exacte en secondes (du frontend, plus précis)
     * @return bool Succès
     */
    public function endSession(int $sessionId, int $rowsCompleted = 0, ?string $notes = null, ?int $duration = null): bool
    {
        $sessionQuery = "SELECT ps.project_id, ps.section_id, ps.ended_at, p.user_id
                         FROM project_sessions ps
                         JOIN projects p ON p.id = ps.project_id
                         WHERE ps.id = :id";
        $sessionStmt = $this->db->prepare($sessionQuery);
        $sessionStmt->bindValue(':id', $sessionId, PDO::PARAM_INT);
        $sessionStmt->execute();
        $session = $sessionStmt->fetch(PDO::FETCH_ASSOC);

        if (!$session)
            return false;

        // [AI:Claude] Session déjà fermée (ex: par closeDanglingSessions() suite à un
        // démarrage sur un autre appareil) — ne rien refaire, sinon la durée serait
        // recréditée une seconde fois sur total_time/time_spent.
        if ($session['ended_at'] !== null)
            return true;

        // [AI:Claude] FIX BUG: Si la durée est fournie par le frontend, l'utiliser directement
        // Sinon, calculer avec TIMESTAMPDIFF (rétrocompatibilité)
        if ($duration !== null) {
            // ended_at = started_at + durée réelle : évite les écarts quand la requête arrive tardivement
            // [AI:Claude] :duration_end / :duration_val distincts — PDO en mode prepared
            // statements natif (non émulé) refuse de réutiliser le même paramètre nommé
            // deux fois dans une requête (SQLSTATE[HY093]: Invalid parameter number).
            $query = "UPDATE project_sessions
                      SET ended_at = DATE_ADD(started_at, INTERVAL :duration_end SECOND),
                          duration = :duration_val,
                          rows_completed = :rows_completed,
                          notes = :notes
                      WHERE id = :id";

            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':id', $sessionId, PDO::PARAM_INT);
            $stmt->bindValue(':duration_end', $duration, PDO::PARAM_INT);
            $stmt->bindValue(':duration_val', $duration, PDO::PARAM_INT);
            $stmt->bindValue(':rows_completed', $rowsCompleted, PDO::PARAM_INT);
            $stmt->bindValue(':notes', $notes, PDO::PARAM_STR);
        } else {
            // Fallback : calculer la durée côté backend (pas de timer frontend)
            $query = "UPDATE project_sessions
                      SET ended_at = NOW(),
                          duration = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                          rows_completed = :rows_completed,
                          notes = :notes
                      WHERE id = :id";

            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':id', $sessionId, PDO::PARAM_INT);
            $stmt->bindValue(':rows_completed', $rowsCompleted, PDO::PARAM_INT);
            $stmt->bindValue(':notes', $notes, PDO::PARAM_STR);
        }

        if (!$stmt->execute())
            return false;

        // [AI:Claude] Récupérer la durée de la session (soit celle fournie, soit celle calculée)
        if ($duration === null) {
            $getDurationQuery = "SELECT duration FROM project_sessions WHERE id = :session_id";
            $durationStmt = $this->db->prepare($getDurationQuery);
            $durationStmt->bindValue(':session_id', $sessionId, PDO::PARAM_INT);
            $durationStmt->execute();
            $duration = (int)$durationStmt->fetchColumn();
        }

        error_log("[Project] Session $sessionId terminée: durée={$duration}s, project_id={$session['project_id']}, section_id={$session['section_id']}");

        if ($duration > 0) {
            // [AI:Claude] Mettre à jour le temps total du projet
            $updateProjectQuery = "UPDATE projects
                                   SET total_time = total_time + :duration,
                                       last_worked_at = NOW()
                                   WHERE id = :project_id";

            $updateStmt = $this->db->prepare($updateProjectQuery);
            $updateStmt->bindValue(':duration', $duration, PDO::PARAM_INT);
            $updateStmt->bindValue(':project_id', $session['project_id'], PDO::PARAM_INT);

            if (!$updateStmt->execute()) {
                error_log("[Project] Erreur mise à jour total_time projet {$session['project_id']}: duration=$duration");
                return false;
            }

            error_log("[Project] Projet {$session['project_id']}: +{$duration}s ajoutés au total_time");

            // [AI:Claude] Mettre à jour le temps passé sur la section si définie
            if ($session['section_id'] !== null) {
                $updateSectionQuery = "UPDATE project_sections
                                       SET time_spent = time_spent + :duration
                                       WHERE id = :section_id";

                $updateSectionStmt = $this->db->prepare($updateSectionQuery);
                $updateSectionStmt->bindValue(':duration', $duration, PDO::PARAM_INT);
                $updateSectionStmt->bindValue(':section_id', $session['section_id'], PDO::PARAM_INT);

                if (!$updateSectionStmt->execute()) {
                    error_log("[Project] Erreur mise à jour time_spent section {$session['section_id']}: duration=$duration");
                    return false;
                }

                error_log("[Project] Section {$session['section_id']}: +{$duration}s ajoutés au time_spent");
            }
        } else {
            error_log("[Project] ATTENTION: durée de session = 0, rien à ajouter");
        }

        $this->recalculateUserStats((int)$session['user_id']);

        return true;
    }

    /**
     * [AI:Claude] Récupérer les statistiques d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array|null Statistiques ou null
     */
    public function getUserStats(int $userId): ?array
    {
        $query = "SELECT * FROM project_stats WHERE user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        return $stats ?: null;
    }

    /**
     * [AI:Claude] Récupérer les statistiques selon une période (week|month|year|all)
     *
     * @param int $userId ID de l'utilisateur
     * @param string $period Période (week, month, year, all)
     * @return array Statistiques calculées
     */
    public function getUserStatsByPeriod(int $userId, string $period = 'all'): array
    {
        // [AI:Claude] Déterminer la date de début selon la période
        $dateCondition = '';
        if ($period === 'week')
            $dateCondition = "AND p.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        elseif ($period === 'month')
            $dateCondition = "AND p.started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        elseif ($period === 'year')
            $dateCondition = "AND p.started_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)";

        // [AI:Claude] Requête pour calculer les stats de base
        // total_rows via project_rows pour compter tous les rangs historiques (sections incluses)
        $query = "SELECT
                    COUNT(*) as total_projects,
                    SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
                    SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) as active_projects,
                    SUM(p.total_time) as total_crochet_time,
                    SUM(p.total_stitches) as total_stitches,
                    (SELECT COUNT(*) FROM project_rows pr WHERE pr.project_id IN (SELECT id FROM {$this->table} WHERE user_id = :user_id_rows)) as total_rows
                  FROM {$this->table} p
                  WHERE p.user_id = :user_id
                  $dateCondition";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->bindValue(':user_id_rows', $userId, \PDO::PARAM_INT);
        $stmt->execute();

        $stats = $stmt->fetch(\PDO::FETCH_ASSOC);

        // [AI:Claude] Calculer les stats dérivées
        $totalTime = (int)($stats['total_crochet_time'] ?? 0);
        $totalRows = (int)($stats['total_rows'] ?? 0);
        $totalStitches = (int)($stats['total_stitches'] ?? 0);
        $totalProjects = (int)($stats['total_projects'] ?? 0);
        $completedProjects = (int)($stats['completed_projects'] ?? 0);

        // [AI:Claude] Taux de complétion
        $completionRate = $totalProjects > 0
            ? round(($completedProjects / $totalProjects) * 100)
            : 0;

        // [AI:Claude] Vitesse (rangs/heure et mailles/heure)
        $avgRowsPerHour = $totalTime > 0
            ? round(($totalRows / ($totalTime / 3600)), 1)
            : 0;

        $avgStitchesPerHour = $totalTime > 0
            ? round(($totalStitches / ($totalTime / 3600)))
            : 0;

        // [AI:Claude] Temps moyen de session (depuis project_sessions)
        $sessionQuery = "SELECT AVG(duration) as avg_session_duration
                         FROM project_sessions ps
                         JOIN {$this->table} p ON ps.project_id = p.id
                         WHERE p.user_id = :user_id
                         AND ps.ended_at IS NOT NULL
                         $dateCondition";

        $stmt = $this->db->prepare($sessionQuery);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();

        $sessionStats = $stmt->fetch(\PDO::FETCH_ASSOC);
        $avgSessionTime = $sessionStats['avg_session_duration']
            ? round($sessionStats['avg_session_duration'] / 60)
            : 0;

        // Meilleure heure de la journée (heure avec le plus de rangs/h en moyenne)
        $bestHourQuery = "SELECT HOUR(ps.started_at) as hour,
                                 AVG(ps.rows_completed / NULLIF(ps.duration / 3600, 0)) as avg_speed
                          FROM project_sessions ps
                          JOIN {$this->table} p ON ps.project_id = p.id
                          WHERE p.user_id = :user_id
                          AND ps.ended_at IS NOT NULL
                          AND ps.duration > 0
                          AND ps.rows_completed > 0
                          $dateCondition
                          GROUP BY HOUR(ps.started_at)
                          ORDER BY avg_speed DESC
                          LIMIT 1";

        $stmt = $this->db->prepare($bestHourQuery);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();
        $bestHourResult = $stmt->fetch(\PDO::FETCH_ASSOC);
        $bestHour = $bestHourResult ? (int)$bestHourResult['hour'] : null;

        // Progression par jour (rangs/cm complétés par jour sur les 30 derniers jours)
        $progressionQuery = "SELECT DATE(ps.started_at) as day,
                                    SUM(ps.rows_completed) as row_count
                             FROM project_sessions ps
                             JOIN {$this->table} p ON ps.project_id = p.id
                             WHERE p.user_id = :user_id
                             AND ps.ended_at IS NOT NULL
                             AND ps.started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                             GROUP BY DATE(ps.started_at)
                             ORDER BY day ASC";

        $stmt = $this->db->prepare($progressionQuery);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();
        $progressionData = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Streak basé sur project_rows (fonctionne même sans timer)
        $workDaysQuery = "SELECT DISTINCT DATE(pr.completed_at) as work_date
                          FROM project_rows pr
                          JOIN {$this->table} p ON pr.project_id = p.id
                          WHERE p.user_id = :user_id
                          ORDER BY work_date DESC
                          LIMIT 365";

        $stmt = $this->db->prepare($workDaysQuery);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();
        $workDays = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        // Calculer le streak actuel
        $currentStreak = 0;
        $today = new \DateTime();
        $today->setTime(0, 0, 0);

        if (count($workDays) > 0) {
            $yesterday = clone $today;
            $yesterday->modify('-1 day');

            // Vérifier si l'utilisateur a travaillé aujourd'hui ou hier
            $lastWorkDate = new \DateTime($workDays[0]);
            $lastWorkDate->setTime(0, 0, 0);

            if ($lastWorkDate >= $yesterday) {
                // Compter les jours consécutifs
                $expectedDate = clone $lastWorkDate;

                foreach ($workDays as $dateStr) {
                    $workDate = new \DateTime($dateStr);
                    $workDate->setTime(0, 0, 0);

                    if ($workDate == $expectedDate) {
                        $currentStreak++;
                        $expectedDate->modify('-1 day');
                    } else {
                        break;
                    }
                }
            }
        }

        // Calculer le plus long streak historique
        $longestStreak = 0;
        $tempStreak = 0;

        if (count($workDays) > 0) {
            $tempStreak = 1;

            for ($i = 0; $i < count($workDays) - 1; $i++) {
                $currentDate = new \DateTime($workDays[$i]);
                $nextDate = new \DateTime($workDays[$i + 1]);

                // Calculer la différence en jours
                $diff = $currentDate->diff($nextDate)->days;

                if ($diff === 1) {
                    $tempStreak++;
                    $longestStreak = max($longestStreak, $tempStreak);
                } else {
                    $longestStreak = max($longestStreak, $tempStreak);
                    $tempStreak = 1;
                }
            }

            $longestStreak = max($longestStreak, $tempStreak);
        }

        // [AI:Claude] v0.17.0 - Vérifier si l'utilisateur a au moins un projet avec current_row > 0
        $hasStartedQuery = "SELECT COUNT(*) > 0 as has_started_rows
                            FROM {$this->table}
                            WHERE user_id = :user_id
                            AND current_row > 0";

        $stmt = $this->db->prepare($hasStartedQuery);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();
        $hasStartedResult = $stmt->fetch(\PDO::FETCH_ASSOC);
        $hasStartedRows = (bool)($hasStartedResult['has_started_rows'] ?? false);

        return [
            'total_projects' => $totalProjects,
            'completed_projects' => $completedProjects,
            'active_projects' => (int)$stats['active_projects'],
            'total_crochet_time' => $totalTime,
            'total_rows' => $totalRows,
            'total_stitches' => $totalStitches,
            'completion_rate' => $completionRate,
            'avg_rows_per_hour' => $avgRowsPerHour,
            'avg_cm_per_hour' => $avgRowsPerHour, // [AI:Claude] v0.16.2 - Même valeur, label différent selon unité
            'avg_stitches_per_hour' => $avgStitchesPerHour,
            'average_session_time' => $avgSessionTime,
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'best_hour' => $bestHour,
            'progression' => $progressionData,
            'period' => $period,
            'has_started_rows' => $hasStartedRows // [AI:Claude] v0.17.0 - Onboarding premier rang
        ];
    }

    /**
     * [AI:Claude] Recalculer les statistiques d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return bool Succès
     */
    public function recalculateUserStats(int $userId): bool
    {
        try {
            // Stats de base depuis projects
            $baseStmt = $this->db->prepare(
                "SELECT COUNT(*) as total_projects,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
                        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_projects,
                        SUM(total_time) as total_crochet_time,
                        SUM(total_stitches) as total_stitches,
                        SUM(current_row) as total_rows,
                        MIN(started_at) as first_project_at,
                        MAX(last_worked_at) as last_project_at
                 FROM projects WHERE user_id = :user_id"
            );
            $baseStmt->execute([':user_id' => $userId]);
            $base = $baseStmt->fetch(PDO::FETCH_ASSOC);

            $totalProjects    = (int)($base['total_projects'] ?? 0);
            $completedProjects = (int)($base['completed_projects'] ?? 0);
            $completionRate   = $totalProjects > 0 ? round($completedProjects / $totalProjects * 100, 2) : 0;

            // Technique favorite
            $techStmt = $this->db->prepare(
                "SELECT technique FROM projects
                 WHERE user_id = :user_id AND technique IS NOT NULL
                 GROUP BY technique ORDER BY COUNT(*) DESC LIMIT 1"
            );
            $techStmt->execute([':user_id' => $userId]);
            $favTechnique = $techStmt->fetchColumn() ?: null;

            // Sessions
            $sessionStmt = $this->db->prepare(
                "SELECT COUNT(*) as total_sessions,
                        COALESCE(AVG(NULLIF(duration, 0)), 0) as avg_duration
                 FROM project_sessions ps
                 JOIN projects p ON p.id = ps.project_id
                 WHERE p.user_id = :user_id AND ps.ended_at IS NOT NULL"
            );
            $sessionStmt->execute([':user_id' => $userId]);
            $sessions = $sessionStmt->fetch(PDO::FETCH_ASSOC);

            // Streak basé sur project_rows (fonctionne même sans timer)
            $daysStmt = $this->db->prepare(
                "SELECT DISTINCT DATE(pr.completed_at) as active_day
                 FROM project_rows pr
                 JOIN projects p ON p.id = pr.project_id
                 WHERE p.user_id = :user_id
                 ORDER BY active_day DESC
                 LIMIT 365"
            );
            $daysStmt->execute([':user_id' => $userId]);
            $days = $daysStmt->fetchAll(PDO::FETCH_COLUMN);

            [$currentStreak, $longestStreak] = $this->calculateStreaks($days);

            $stmt = $this->db->prepare(
                "INSERT INTO project_stats (
                     user_id, total_projects, completed_projects, in_progress_projects,
                     total_crochet_time, total_stitches, total_rows,
                     current_streak, longest_streak, completion_rate,
                     total_sessions, avg_session_duration, favorite_technique,
                     first_project_at, last_project_at, last_calculated_at
                 ) VALUES (
                     :user_id, :total_projects, :completed_projects, :in_progress_projects,
                     :total_crochet_time, :total_stitches, :total_rows,
                     :current_streak, :longest_streak, :completion_rate,
                     :total_sessions, :avg_session_duration, :favorite_technique,
                     :first_project_at, :last_project_at, NOW()
                 )
                 ON DUPLICATE KEY UPDATE
                     total_projects = VALUES(total_projects),
                     completed_projects = VALUES(completed_projects),
                     in_progress_projects = VALUES(in_progress_projects),
                     total_crochet_time = VALUES(total_crochet_time),
                     total_stitches = VALUES(total_stitches),
                     total_rows = VALUES(total_rows),
                     current_streak = VALUES(current_streak),
                     longest_streak = VALUES(longest_streak),
                     completion_rate = VALUES(completion_rate),
                     total_sessions = VALUES(total_sessions),
                     avg_session_duration = VALUES(avg_session_duration),
                     favorite_technique = VALUES(favorite_technique),
                     first_project_at = VALUES(first_project_at),
                     last_project_at = VALUES(last_project_at),
                     last_calculated_at = VALUES(last_calculated_at)"
            );

            return $stmt->execute([
                ':user_id'              => $userId,
                ':total_projects'       => $totalProjects,
                ':completed_projects'   => $completedProjects,
                ':in_progress_projects' => (int)($base['in_progress_projects'] ?? 0),
                ':total_crochet_time'   => (int)($base['total_crochet_time'] ?? 0),
                ':total_stitches'       => (int)($base['total_stitches'] ?? 0),
                ':total_rows'           => (int)($base['total_rows'] ?? 0),
                ':current_streak'       => $currentStreak,
                ':longest_streak'       => $longestStreak,
                ':completion_rate'      => $completionRate,
                ':total_sessions'       => (int)($sessions['total_sessions'] ?? 0),
                ':avg_session_duration' => (int)($sessions['avg_duration'] ?? 0),
                ':favorite_technique'   => $favTechnique,
                ':first_project_at'     => $base['first_project_at'],
                ':last_project_at'      => $base['last_project_at'],
            ]);

        } catch (\Exception $e) {
            error_log("[Project] Erreur recalculateUserStats user $userId: " . $e->getMessage());
            return false;
        }
    }

    private function calculateStreaks(array $days): array
    {
        if (empty($days)) return [0, 0];

        $yesterday = (new \DateTime('today'))->modify('-1 day');
        $firstDay  = new \DateTime($days[0]);

        $streak        = 1;
        $longestStreak = 1;
        $isActive      = ($firstDay >= $yesterday);
        $currentStreak = $isActive ? 1 : 0;

        for ($i = 1; $i < count($days); $i++) {
            $prev = new \DateTime($days[$i - 1]);
            $curr = new \DateTime($days[$i]);
            $diff = (int)$prev->diff($curr)->days;

            if ($diff === 1) {
                $streak++;
                if ($isActive) $currentStreak++;
                $longestStreak = max($longestStreak, $streak);
            } else {
                $isActive = false;
                $longestStreak = max($longestStreak, $streak);
                $streak = 1;
            }
        }

        return [$currentStreak, $longestStreak];
    }

    /**
     * [AI:Claude] Récupérer les projets publics (galerie communautaire)
     *
     * @param int $limit Limite
     * @param int $offset Offset
     * @return array Liste des projets publics
     */
    public function getPublicProjects(int $limit = 20, int $offset = 0): array
    {
        $query = "SELECT p.*, u.first_name, u.last_name,
                  CONCAT(u.first_name, ' ', SUBSTR(u.last_name, 1, 1), '.') as author_name
                  FROM {$this->table} p
                  JOIN users u ON p.user_id = u.id
                  WHERE p.is_public = 1 AND p.status = 'completed'
                  ORDER BY p.completed_at DESC
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ========================================================================
    // [AI:Claude] GESTION DES SECTIONS/PARTIES DE PROJET
    // ========================================================================

    /**
     * [AI:Claude] Créer une section pour un projet
     *
     * @param int $projectId ID du projet
     * @param array $sectionData Données de la section
     * @return int|false ID de la section créée ou false
     */
    public function createSection(int $projectId, array $sectionData): int|false
    {
        $query = "INSERT INTO project_sections
                  (project_id, name, description, notes, display_order, total_rows, current_row)
                  VALUES
                  (:project_id, :name, :description, :notes, :display_order, :total_rows, :current_row)";

        $stmt = $this->db->prepare($query);

        $params = [
            ':project_id' => $projectId,
            ':name' => $sectionData['name'],
            ':description' => $sectionData['description'] ?? null,
            ':notes' => $sectionData['notes'] ?? null,
            ':display_order' => $sectionData['display_order'] ?? 0,
            ':total_rows' => $sectionData['total_rows'] ?? null,
            ':current_row' => $sectionData['current_row'] ?? 0  // [AI:Claude] v0.16.2: Support initial row count
        ];

        if ($stmt->execute($params)) {
            $sectionId = (int) $this->db->lastInsertId();

            // [AI:Claude] Si le projet n'a pas de section courante, définir automatiquement cette nouvelle section
            $checkQuery = "SELECT current_section_id FROM projects WHERE id = :project_id";
            $checkStmt = $this->db->prepare($checkQuery);
            $checkStmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
            $checkStmt->execute();
            $project = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($project && $project['current_section_id'] === null) {
                $updateQuery = "UPDATE projects SET current_section_id = :section_id WHERE id = :project_id";
                $updateStmt = $this->db->prepare($updateQuery);
                $updateStmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
                $updateStmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
                $updateStmt->execute();
            }

            return $sectionId;
        }

        return false;
    }

    /**
     * [AI:Claude] Récupérer toutes les sections d'un projet
     *
     * @param int $projectId ID du projet
     * @return array Liste des sections
     */
    public function getProjectSections(int $projectId): array
    {
        $query = "SELECT s.*,
                  COUNT(DISTINCT pr.id) as rows_count,
                  CASE
                      WHEN s.total_rows IS NOT NULL THEN ROUND((s.current_row / s.total_rows) * 100, 1)
                      ELSE NULL
                  END as completion_percentage,
                  CONCAT(
                      FLOOR(s.time_spent / 3600), 'h ',
                      FLOOR((s.time_spent % 3600) / 60), 'min ',
                      FLOOR(s.time_spent % 60), 'sec'
                  ) as time_formatted
                  FROM project_sections s
                  LEFT JOIN project_rows pr ON s.id = pr.section_id
                  WHERE s.project_id = :project_id
                  GROUP BY s.id
                  ORDER BY s.display_order ASC, s.id ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Récupérer une section par ID
     *
     * @param int $sectionId ID de la section
     * @return array|null Section ou null
     */
    public function getSectionById(int $sectionId): ?array
    {
        $query = "SELECT * FROM project_sections WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $sectionId, PDO::PARAM_INT);
        $stmt->execute();

        $section = $stmt->fetch(PDO::FETCH_ASSOC);
        return $section ?: null;
    }

    /**
     * [AI:Claude] Mettre à jour une section
     *
     * @param int $sectionId ID de la section
     * @param array $data Nouvelles données
     * @return bool Succès
     */
    public function updateSection(int $sectionId, array $data): bool
    {
        $allowedFields = ['name', 'description', 'notes', 'display_order', 'total_rows', 'current_row', 'counter_unit', 'is_completed',
                          'secondary_label', 'secondary_target', 'secondary_count', 'secondary_sequence',
                          'reminders']; // Rappels de rang

        $fields = [];
        $params = [':id' => $sectionId];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (empty($fields))
            return false;

        $query = "UPDATE project_sections SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    // -------------------------------------------------------------------------
    // [AI:Claude] Compteurs secondaires (plusieurs par section ou par projet)
    // -------------------------------------------------------------------------

    private const MAX_SECONDARY_COUNTERS = 10;

    /**
     * Liste les compteurs secondaires d'une section (ou du projet si $sectionId est null).
     *
     * @param int $projectId ID du projet
     * @param int|null $sectionId ID de la section, ou null pour un projet sans sections
     * @return array Liste des compteurs, triés par display_order
     */
    public function getSecondaryCounters(int $projectId, ?int $sectionId): array
    {
        $query = "SELECT * FROM project_secondary_counters
                  WHERE project_id = :project_id AND section_id " . ($sectionId === null ? 'IS NULL' : '= :section_id') . "
                  ORDER BY display_order ASC, id ASC";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        if ($sectionId !== null) {
            $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Ajoute un compteur secondaire. Retourne false si la limite (10) est atteinte.
     *
     * @param int $projectId ID du projet
     * @param int|null $sectionId ID de la section, ou null pour un projet sans sections
     * @param array $data label (requis), target (optionnel), sequence (optionnel)
     * @return int|false ID du compteur créé, ou false
     */
    public function addSecondaryCounter(int $projectId, ?int $sectionId, array $data): int|false
    {
        $existing = $this->getSecondaryCounters($projectId, $sectionId);
        if (count($existing) >= self::MAX_SECONDARY_COUNTERS) {
            return false;
        }

        $maxOrder = 0;
        foreach ($existing as $counter) {
            $maxOrder = max($maxOrder, (int)$counter['display_order']);
        }

        $query = "INSERT INTO project_secondary_counters
                  (project_id, section_id, label, target, count, sequence, display_order)
                  VALUES (:project_id, :section_id, :label, :target, :count, :sequence, :display_order)";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        if ($sectionId === null) {
            $stmt->bindValue(':section_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        }
        $stmt->bindValue(':label', $data['label']);
        $stmt->bindValue(':target', $data['target'] ?? null, isset($data['target']) ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':count', (int)($data['count'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(':sequence', isset($data['sequence']) ? json_encode($data['sequence']) : null);
        $stmt->bindValue(':display_order', $maxOrder + 1, PDO::PARAM_INT);

        if (!$stmt->execute()) {
            return false;
        }

        return (int) $this->db->lastInsertId();
    }

    /**
     * Récupère un compteur secondaire par ID, en vérifiant qu'il appartient au projet donné.
     *
     * @param int $counterId ID du compteur
     * @param int $projectId ID du projet (contrôle d'appartenance)
     * @return array|null Compteur ou null
     */
    public function getSecondaryCounterById(int $counterId, int $projectId): ?array
    {
        $query = "SELECT * FROM project_secondary_counters WHERE id = :id AND project_id = :project_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $counterId, PDO::PARAM_INT);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->execute();

        $counter = $stmt->fetch(PDO::FETCH_ASSOC);
        return $counter ?: null;
    }

    /**
     * Met à jour un compteur secondaire (label, target, count, sequence).
     *
     * @param int $counterId ID du compteur
     * @param array $data Champs à modifier
     * @return bool Succès
     */
    public function updateSecondaryCounter(int $counterId, array $data): bool
    {
        $allowedFields = ['label', 'target', 'count', 'display_order'];
        $fields = [];
        $params = [':id' => $counterId];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (array_key_exists('sequence', $data)) {
            $fields[] = "sequence = :sequence";
            $params[':sequence'] = $data['sequence'] !== null ? json_encode($data['sequence']) : null;
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE project_secondary_counters SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    /**
     * Supprime un compteur secondaire.
     *
     * @param int $counterId ID du compteur
     * @return bool Succès
     */
    public function deleteSecondaryCounter(int $counterId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM project_secondary_counters WHERE id = :id");
        $stmt->bindValue(':id', $counterId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    // -------------------------------------------------------------------------
    // Grilles jacquard/colorwork
    // -------------------------------------------------------------------------

    /**
     * [AI:Claude] Liste TOUTES les grilles d'un utilisateur, tous projets
     * confondus — vue globale "Mes grilles" (outil bac à sable).
     *
     * @param int $userId ID de l'utilisateur
     * @return array Liste des grilles avec nom du projet/section
     */
    public function getAllChartsForUser(int $userId): array
    {
        // [AI:Claude] LEFT JOIN sur projects : une grille peut n'être rattachée
        // à aucun projet (enregistrée directement dans "Mes grilles").
        $query = "SELECT pc.id, pc.project_id, pc.section_id, pc.name, pc.width, pc.height,
                         pc.current_row, pc.created_at, pc.updated_at,
                         p.name AS project_name, ps.name AS section_name
                  FROM project_charts pc
                  LEFT JOIN projects p ON p.id = pc.project_id
                  LEFT JOIN project_sections ps ON ps.id = pc.section_id
                  WHERE pc.user_id = :user_id
                  ORDER BY pc.updated_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Liste les grilles d'un projet (et éventuellement filtrées par section).
     *
     * @param int $projectId ID du projet
     * @param int|null $sectionId ID de la section pour filtrer, ou null pour tout le projet
     * @return array Liste des grilles (sans le détail des cases, pour l'affichage en liste)
     */
    public function getCharts(int $projectId, ?int $sectionId = null): array
    {
        $query = "SELECT id, project_id, section_id, name, width, height, current_row, created_at, updated_at
                  FROM project_charts
                  WHERE project_id = :project_id" . ($sectionId !== null ? " AND section_id = :section_id" : "") . "
                  ORDER BY created_at DESC";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        if ($sectionId !== null) {
            $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        }
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère une grille par ID (avec palette et cases), en vérifiant qu'elle appartient au projet donné.
     *
     * @param int $chartId ID de la grille
     * @param int $projectId ID du projet (contrôle d'appartenance)
     * @return array|null Grille (palette et cells décodés) ou null
     */
    public function getChartById(int $chartId, int $projectId): ?array
    {
        // [AI:Claude] Jointure sur la section pour lier la progression de la
        // grille au compteur de rangs de la section (source unique) quand la
        // grille y est rattachée, au lieu de son propre current_row isolé.
        $query = "SELECT pc.*, ps.name AS section_name, ps.current_row AS section_current_row,
                         ps.total_rows AS section_total_rows, ps.counter_unit AS section_counter_unit
                  FROM project_charts pc
                  LEFT JOIN project_sections ps ON ps.id = pc.section_id
                  WHERE pc.id = :id AND pc.project_id = :project_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $chartId, PDO::PARAM_INT);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->execute();

        $chart = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$chart) {
            return null;
        }

        $chart['palette'] = json_decode($chart['palette'], true);
        $chart['cells'] = json_decode($chart['cells'], true);

        if ($chart['section_id'] !== null && $chart['section_current_row'] !== null) {
            // [AI:Claude] Un jacquard ne couvre en général qu'une partie des rangs
            // d'une section (ex: 5 rangs unis, puis 50 de motif, puis 15 unis) —
            // start_row indique combien de rangs de la section sont déjà faits
            // quand la grille démarre. On décale donc le rang de section pour
            // obtenir le rang correspondant DANS la grille, borné à sa hauteur.
            $startRow = (int) ($chart['start_row'] ?? 0);
            $sectionRow = (int) round((float) $chart['section_current_row']);
            $chart['current_row'] = max(0, min((int) $chart['height'], $sectionRow - $startRow));
            $chart['linked_to_section'] = true;
        } else {
            $chart['linked_to_section'] = false;
        }

        return $chart;
    }

    /**
     * [AI:Claude] Récupère une grille par ID en vérifiant l'appartenance directe
     * via user_id (pas via un projet) — utilisé pour les grilles sans projet
     * ("Mes grilles") créées/éditées depuis l'outil bac à sable.
     *
     * @param int $chartId ID de la grille
     * @param int $userId ID de l'utilisateur (contrôle d'appartenance)
     * @return array|null Grille (palette et cells décodés) ou null
     */
    public function getChartByUser(int $chartId, int $userId): ?array
    {
        $query = "SELECT * FROM project_charts WHERE id = :id AND user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $chartId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $chart = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$chart) {
            return null;
        }

        $chart['palette'] = json_decode($chart['palette'], true);
        $chart['cells'] = json_decode($chart['cells'], true);

        return $chart;
    }

    /**
     * Crée une grille vide (toutes les cases à l'indice 0 de la palette).
     *
     * @param int|null $projectId ID du projet, ou null pour une grille sans projet ("Mes grilles")
     * @param int|null $sectionId ID de la section, ou null pour une grille sans section
     * @param int $userId ID de l'utilisateur propriétaire (appartenance directe, indépendante du projet)
     * @param array $data name (requis), width (requis), height (requis), palette (optionnel, défaut 2 couleurs)
     * @return int ID de la grille créée
     */
    public function createChart(?int $projectId, ?int $sectionId, int $userId, array $data): int
    {
        $palette = $data['palette'] ?? ['#FFFFFF', '#000000'];
        $width = (int)$data['width'];
        $height = (int)$data['height'];
        // [AI:Claude] Permet de créer une grille déjà dessinée (ex: conçue dans
        // l'outil "bac à sable" puis enregistrée dans un projet) — sinon grille vierge
        $cells = $data['cells'] ?? array_fill(0, $height, array_fill(0, $width, 0));

        $startRow = (int) ($data['start_row'] ?? 0);

        $query = "INSERT INTO project_charts
                  (user_id, project_id, section_id, start_row, name, width, height, palette, cells, current_row)
                  VALUES (:user_id, :project_id, :section_id, :start_row, :name, :width, :height, :palette, :cells, 0)";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        if ($projectId === null) {
            $stmt->bindValue(':project_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        }
        if ($sectionId === null) {
            $stmt->bindValue(':section_id', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        }
        $stmt->bindValue(':start_row', $startRow, PDO::PARAM_INT);
        $stmt->bindValue(':name', $data['name']);
        $stmt->bindValue(':width', $width, PDO::PARAM_INT);
        $stmt->bindValue(':height', $height, PDO::PARAM_INT);
        $stmt->bindValue(':palette', json_encode($palette));
        $stmt->bindValue(':cells', json_encode($cells));
        $stmt->execute();

        return (int) $this->db->lastInsertId();
    }

    /**
     * Met à jour une grille (nom, palette, cases, dimensions, ligne en cours).
     *
     * @param int $chartId ID de la grille
     * @param array $data Champs à modifier
     * @return bool Succès
     */
    public function updateChart(int $chartId, array $data): bool
    {
        // [AI:Claude] project_id/section_id : réassignation d'une grille existante à un
        // autre projet/section (voir ProjectController::updateChart pour la validation
        // d'appartenance avant d'autoriser le changement).
        $allowedFields = ['name', 'width', 'height', 'current_row', 'start_row', 'project_id', 'section_id'];
        $fields = [];
        $params = [':id' => $chartId];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }

        if (array_key_exists('locked', $data)) {
            $fields[] = "locked = :locked";
            $params[':locked'] = $data['locked'] ? 1 : 0;
        }

        if (array_key_exists('palette', $data)) {
            $fields[] = "palette = :palette";
            $params[':palette'] = json_encode($data['palette']);
        }

        if (array_key_exists('cells', $data)) {
            $fields[] = "cells = :cells";
            $params[':cells'] = json_encode($data['cells']);
        }

        if (empty($fields)) {
            return false;
        }

        $query = "UPDATE project_charts SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->db->prepare($query);

        return $stmt->execute($params);
    }

    /**
     * Supprime une grille.
     *
     * @param int $chartId ID de la grille
     * @return bool Succès
     */
    public function deleteChart(int $chartId): bool
    {
        $stmt = $this->db->prepare("DELETE FROM project_charts WHERE id = :id");
        $stmt->bindValue(':id', $chartId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Supprimer une section
     *
     * @param int $sectionId ID de la section
     * @return bool Succès
     */
    public function deleteSection(int $sectionId): bool
    {
        // [AI:Claude] Récupérer le project_id avant de supprimer la section
        $queryGetProject = "SELECT project_id FROM project_sections WHERE id = :section_id";
        $stmtGetProject = $this->db->prepare($queryGetProject);
        $stmtGetProject->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        $stmtGetProject->execute();
        $result = $stmtGetProject->fetch(PDO::FETCH_ASSOC);
        $projectId = $result ? $result['project_id'] : null;

        // [AI:Claude] Trouver la prochaine section non terminée à activer
        $nextSectionId = null;
        if ($projectId) {
            $queryNextSection = "SELECT id FROM project_sections
                                WHERE project_id = :project_id
                                AND id != :section_id
                                AND is_completed = 0
                                ORDER BY display_order ASC, id ASC
                                LIMIT 1";
            $stmtNext = $this->db->prepare($queryNextSection);
            $stmtNext->bindValue(':project_id', $projectId, PDO::PARAM_INT);
            $stmtNext->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
            $stmtNext->execute();
            $nextSection = $stmtNext->fetch(PDO::FETCH_ASSOC);
            $nextSectionId = $nextSection ? $nextSection['id'] : null;
        }

        // [AI:Claude] Mettre à jour le current_section_id vers la prochaine section ou NULL
        if ($projectId) {
            $queryResetCurrent = "UPDATE projects
                                 SET current_section_id = :next_section_id
                                 WHERE current_section_id = :section_id";
            $stmtReset = $this->db->prepare($queryResetCurrent);
            $stmtReset->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
            $stmtReset->bindValue(':next_section_id', $nextSectionId, PDO::PARAM_INT);
            $stmtReset->execute();
        }

        // [AI:Claude] Supprimer la section
        $query = "DELETE FROM project_sections WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $sectionId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Définir la section courante d'un projet
     *
     * @param int $projectId ID du projet
     * @param int|null $sectionId ID de la section (null pour aucune)
     * @return bool Succès
     */
    public function setCurrentSection(int $projectId, ?int $sectionId): bool
    {
        $query = "UPDATE projects SET current_section_id = :section_id WHERE id = :project_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Récupérer les rangs d'une section spécifique
     *
     * @param int $sectionId ID de la section
     * @param int $limit Limite
     * @return array Historique des rangs de la section
     */
    public function getSectionRows(int $sectionId, int $limit = 100): array
    {
        $query = "SELECT * FROM project_rows
                  WHERE section_id = :section_id
                  ORDER BY row_num DESC
                  LIMIT :limit";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':section_id', $sectionId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
