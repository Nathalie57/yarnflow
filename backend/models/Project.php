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
                   total_rows, yarn_brand, yarn_color, yarn_weight, hook_size, notes, is_public)
                  VALUES
                  (:user_id, :name, :technique, :type, :description, :pattern_id, :main_photo, :status,
                   :total_rows, :yarn_brand, :yarn_color, :yarn_weight, :hook_size, :notes, :is_public)";

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
            ':is_public' => isset($data['is_public']) ? (int)$data['is_public'] : 0
        ];

        if ($stmt->execute($params))
            return (int) $this->db->lastInsertId();

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
                      FLOOR(p.total_time / 3600), 'h ',
                      FLOOR((p.total_time % 3600) / 60), 'min ',
                      (p.total_time % 60), 's'
                  ) as time_formatted,
                  CASE
                      WHEN p.total_rows IS NOT NULL THEN ROUND((p.current_row / p.total_rows) * 100, 1)
                      ELSE NULL
                  END as completion_percentage
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
                      FLOOR(p.total_time / 3600), 'h ',
                      FLOOR((p.total_time % 3600) / 60), 'min ',
                      (p.total_time % 60), 's'
                  ) as time_formatted,
                  CASE
                      WHEN p.total_rows IS NOT NULL THEN ROUND((p.current_row / p.total_rows) * 100, 1)
                      ELSE NULL
                  END as completion_percentage
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
            'yarn_brand', 'yarn_color', 'yarn_weight', 'hook_size', 'yarn_used_grams',
            'notes', 'pattern_notes', 'is_public', 'is_favorite', 'completed_at',
            'pattern_path', 'pattern_url' // [AI:Claude] v0.11.0 - Import patron multi-format
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

        return $stmt->execute($params);
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
                  (project_id, section_id, row_num, stitch_count, stitch_type, duration, notes, difficulty_rating, photo, completed_at)
                  VALUES
                  (:project_id, :section_id, :row_num, :stitch_count, :stitch_type, :duration, :notes, :difficulty_rating, :photo, :completed_at)
                  ON DUPLICATE KEY UPDATE
                  section_id = VALUES(section_id),
                  stitch_count = VALUES(stitch_count),
                  stitch_type = VALUES(stitch_type),
                  duration = VALUES(duration),
                  notes = VALUES(notes),
                  difficulty_rating = VALUES(difficulty_rating),
                  photo = VALUES(photo),
                  completed_at = VALUES(completed_at)";

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
            ':completed_at' => $rowData['completed_at'] ?? date('Y-m-d H:i:s')
        ];

        if ($stmt->execute($params))
            return (int) $this->db->lastInsertId();

        return false;
    }

    /**
     * [AI:Claude] Récupérer l'historique des rangs d'un projet
     *
     * @param int $projectId ID du projet
     * @param int $limit Limite
     * @return array Historique des rangs
     */
    public function getProjectRows(int $projectId, int $limit = 100): array
    {
        $query = "SELECT * FROM project_rows
                  WHERE project_id = :project_id
                  ORDER BY row_num DESC
                  LIMIT :limit";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':project_id', $projectId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
     * [AI:Claude] Terminer une session de travail
     *
     * @param int $sessionId ID de la session
     * @param int $rowsCompleted Nombre de rangs complétés
     * @param string|null $notes Notes de la session
     * @return bool Succès
     */
    public function endSession(int $sessionId, int $rowsCompleted = 0, ?string $notes = null): bool
    {
        // [AI:Claude] Récupérer la session pour obtenir project_id et section_id
        $sessionQuery = "SELECT project_id, section_id FROM project_sessions WHERE id = :id";
        $sessionStmt = $this->db->prepare($sessionQuery);
        $sessionStmt->bindValue(':id', $sessionId, PDO::PARAM_INT);
        $sessionStmt->execute();
        $session = $sessionStmt->fetch(PDO::FETCH_ASSOC);

        if (!$session)
            return false;

        // [AI:Claude] Mettre à jour la session avec durée calculée
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

        if (!$stmt->execute())
            return false;

        // [AI:Claude] Mettre à jour le temps total du projet avec la durée de la session
        $updateProjectQuery = "UPDATE projects p
                               SET p.total_time = p.total_time + (
                                   SELECT duration FROM project_sessions WHERE id = :session_id
                               ),
                               p.last_worked_at = NOW()
                               WHERE p.id = :project_id";

        $updateStmt = $this->db->prepare($updateProjectQuery);
        $updateStmt->bindValue(':session_id', $sessionId, PDO::PARAM_INT);
        $updateStmt->bindValue(':project_id', $session['project_id'], PDO::PARAM_INT);

        if (!$updateStmt->execute())
            return false;

        // [AI:Claude] Mettre à jour le temps passé sur la section si définie
        if ($session['section_id'] !== null) {
            $updateSectionQuery = "UPDATE project_sections
                                   SET time_spent = time_spent + (
                                       SELECT duration FROM project_sessions WHERE id = :session_id
                                   )
                                   WHERE id = :section_id";

            $updateSectionStmt = $this->db->prepare($updateSectionQuery);
            $updateSectionStmt->bindValue(':session_id', $sessionId, PDO::PARAM_INT);
            $updateSectionStmt->bindValue(':section_id', $session['section_id'], PDO::PARAM_INT);

            if (!$updateSectionStmt->execute())
                return false;
        }

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
        $query = "SELECT
                    COUNT(*) as total_projects,
                    SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
                    SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) as active_projects,
                    SUM(p.total_time) as total_crochet_time,
                    SUM(p.total_stitches) as total_stitches,
                    SUM(p.current_row) as total_rows
                  FROM {$this->table} p
                  WHERE p.user_id = :user_id
                  $dateCondition";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
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

        // [AI:Claude] Streak calculation (jours consécutifs)
        $streakQuery = "SELECT DATEDIFF(NOW(), MAX(last_worked_at)) as days_since_last
                        FROM {$this->table}
                        WHERE user_id = :user_id
                        AND last_worked_at IS NOT NULL";

        $stmt = $this->db->prepare($streakQuery);
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_INT);
        $stmt->execute();

        $streakData = $stmt->fetch(\PDO::FETCH_ASSOC);
        $daysSinceLast = (int)($streakData['days_since_last'] ?? 999);

        // [AI:Claude] Streak actuel (si dernier travail < 2 jours)
        $currentStreak = $daysSinceLast < 2 ? 1 : 0;

        // [AI:Claude] TODO: Calculer le streak réel jour par jour (requête plus complexe)
        $longestStreak = $currentStreak;

        return [
            'total_projects' => $totalProjects,
            'completed_projects' => $completedProjects,
            'active_projects' => (int)$stats['active_projects'],
            'total_crochet_time' => $totalTime,
            'total_rows' => $totalRows,
            'total_stitches' => $totalStitches,
            'completion_rate' => $completionRate,
            'avg_rows_per_hour' => $avgRowsPerHour,
            'avg_stitches_per_hour' => $avgStitchesPerHour,
            'average_session_time' => $avgSessionTime,
            'current_streak' => $currentStreak,
            'longest_streak' => $longestStreak,
            'period' => $period
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
        $query = "INSERT INTO project_stats (
                      user_id,
                      total_projects,
                      completed_projects,
                      in_progress_projects,
                      total_crochet_time,
                      total_stitches,
                      total_rows,
                      first_project_at,
                      last_project_at,
                      last_calculated_at
                  )
                  SELECT
                      :user_id,
                      COUNT(*),
                      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END),
                      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END),
                      SUM(total_time),
                      SUM(total_stitches),
                      SUM(current_row),
                      MIN(started_at),
                      MAX(last_worked_at),
                      NOW()
                  FROM projects
                  WHERE user_id = :user_id2
                  ON DUPLICATE KEY UPDATE
                      total_projects = VALUES(total_projects),
                      completed_projects = VALUES(completed_projects),
                      in_progress_projects = VALUES(in_progress_projects),
                      total_crochet_time = VALUES(total_crochet_time),
                      total_stitches = VALUES(total_stitches),
                      total_rows = VALUES(total_rows),
                      first_project_at = VALUES(first_project_at),
                      last_project_at = VALUES(last_project_at),
                      last_calculated_at = VALUES(last_calculated_at)";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':user_id2', $userId, PDO::PARAM_INT);

        return $stmt->execute();
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
                  (project_id, name, description, display_order, total_rows)
                  VALUES
                  (:project_id, :name, :description, :display_order, :total_rows)";

        $stmt = $this->db->prepare($query);

        $params = [
            ':project_id' => $projectId,
            ':name' => $sectionData['name'],
            ':description' => $sectionData['description'] ?? null,
            ':display_order' => $sectionData['display_order'] ?? 0,
            ':total_rows' => $sectionData['total_rows'] ?? null
        ];

        if ($stmt->execute($params))
            return (int) $this->db->lastInsertId();

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
                      FLOOR((s.time_spent % 3600) / 60), 'min'
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
        $allowedFields = ['name', 'description', 'display_order', 'total_rows', 'is_completed'];

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

    /**
     * [AI:Claude] Supprimer une section
     *
     * @param int $sectionId ID de la section
     * @return bool Succès
     */
    public function deleteSection(int $sectionId): bool
    {
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
