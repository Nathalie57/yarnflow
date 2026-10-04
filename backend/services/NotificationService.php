<?php
/**
 * @file NotificationService.php
 * @brief Service pour gérer les notifications automatiques par email
 * @author YarnFlow Team + AI Assistants
 * @created 2025-12-28
 */

declare(strict_types=1);

namespace App\Services;

use PDO;
use App\Services\EmailService;

/**
 * Service de gestion des notifications automatiques
 */
class NotificationService
{
    private PDO $db;
    private EmailService $emailService;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->emailService = new EmailService($db);
    }

    /**
     * Envoyer les emails d'onboarding J+3 (utilisateurs inactifs depuis inscription)
     *
     * @return array Résultat de l'envoi
     */
    public function sendOnboardingDay3Emails(): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Trouver les utilisateurs inactifs depuis 3 jours (avec ou sans projet)
            $sql = "
                SELECT u.id, u.email, u.first_name,
                       (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
                FROM users u
                WHERE DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
                  AND (u.last_seen_at IS NULL OR u.last_seen_at <= DATE_SUB(NOW(), INTERVAL 3 DAY))
                  AND u.email_notifications = 1
                  AND NOT EXISTS (
                      SELECT 1 FROM email_notifications_sent
                      WHERE user_id = u.id
                        AND notification_type = 'onboarding_day3'
                        AND sent_year = YEAR(NOW())
                        AND sent_month = MONTH(NOW())
                  )
            ";

            $stmt = $this->db->query($sql);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as $user) {
                $name = $user['first_name'] ?? 'Nouveau membre';
                $hasProjects = $user['project_count'] > 0;

                $success = $this->emailService->sendOnboardingDay3Email(
                    $user['email'],
                    $name,
                    $user['id'],
                    $hasProjects
                );

                if ($success) {
                    $this->recordEmailSent($user['id'], 'onboarding_day3', '🎓 Besoin d\'aide pour démarrer avec YarnFlow ?');
                    $sent++;
                } else {
                    $failed++;
                }
            }

            return [
                'success' => true,
                'sent' => $sent,
                'skipped' => $skipped,
                'failed' => $failed,
                'message' => "Emails onboarding J+3 : {$sent} envoyés, {$failed} échoués"
            ];

        } catch (\Exception $e) {
            error_log("[NotificationService] Erreur envoi onboarding J+3: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Envoyer les emails de réengagement J+7 (utilisateurs inactifs)
     *
     * @return array Résultat de l'envoi
     */
    public function sendReengagementDay7Emails(): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Trouver les utilisateurs inactifs depuis 7 jours qui ont au moins 1 projet
            $sql = "
                SELECT u.id, u.email, u.first_name,
                       (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
                FROM users u
                WHERE u.last_seen_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)
                  AND u.email_notifications = 1
                  AND EXISTS (SELECT 1 FROM projects WHERE user_id = u.id)
                  AND NOT EXISTS (
                      SELECT 1 FROM email_notifications_sent
                      WHERE user_id = u.id
                        AND notification_type = 'reengagement_day7'
                        AND sent_year = YEAR(NOW())
                        AND sent_month = MONTH(NOW())
                  )
            ";

            $stmt = $this->db->query($sql);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as $user) {
                $name = $user['first_name'] ?? 'Membre';

                // Récupérer le projet en cours (dernier modifié, non terminé)
                $projectData = $this->getActiveProject($user['id']);

                $success = $this->emailService->sendReengagementDay7Email(
                    $user['email'],
                    $name,
                    $projectData,
                    $user['id']
                );

                if ($success) {
                    $this->recordEmailSent($user['id'], 'reengagement_day7', '🧵 Votre tricot vous attend !');
                    $sent++;
                } else {
                    $failed++;
                }
            }

            return [
                'success' => true,
                'sent' => $sent,
                'skipped' => $skipped,
                'failed' => $failed,
                'message' => "Emails réengagement J+7 : {$sent} envoyés, {$failed} échoués"
            ];

        } catch (\Exception $e) {
            error_log("[NotificationService] Erreur envoi réengagement J+7: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Envoyer les emails "Besoin d'aide ?" J+21 (utilisateurs très inactifs)
     *
     * @return array Résultat de l'envoi
     */
    public function sendNeedHelpDay21Emails(): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Trouver les utilisateurs inactifs depuis 21 jours
            $sql = "
                SELECT u.id, u.email, u.first_name
                FROM users u
                WHERE u.last_seen_at <= DATE_SUB(NOW(), INTERVAL 21 DAY)
                  AND u.email_notifications = 1
                  AND NOT EXISTS (
                      SELECT 1 FROM email_notifications_sent
                      WHERE user_id = u.id
                        AND notification_type = 'need_help_day21'
                        AND sent_year = YEAR(NOW())
                        AND sent_month = MONTH(NOW())
                  )
            ";

            $stmt = $this->db->query($sql);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as $user) {
                $name = $user['first_name'] ?? 'Membre';
                $success = $this->emailService->sendNeedHelpDay21Email($user['email'], $name, $user['id']);

                if ($success) {
                    $this->recordEmailSent($user['id'], 'need_help_day21', '🆘 Besoin d\'aide avec YarnFlow ?');
                    $sent++;
                } else {
                    $failed++;
                }
            }

            return [
                'success' => true,
                'sent' => $sent,
                'skipped' => $skipped,
                'failed' => $failed,
                'message' => "Emails 'besoin d'aide' J+21 : {$sent} envoyés, {$failed} échoués"
            ];

        } catch (\Exception $e) {
            error_log("[NotificationService] Erreur envoi 'besoin d'aide' J+21: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Récupérer le projet actif d'un utilisateur (dernier modifié, non terminé)
     *
     * @param int $userId ID de l'utilisateur
     * @return array Données du projet
     */
    private function getActiveProject(int $userId): array
    {
        $sql = "
            SELECT
                p.name,
                CASE
                    WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0 THEN
                        (SELECT CASE
                            WHEN SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) THEN 1 ELSE 0 END) = 0
                             AND COUNT(DISTINCT CASE WHEN COALESCE(progression_type, 'simple') <> 'action' THEN COALESCE(counter_unit, 'rows') END) <= 1
                             AND SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN total_rows ELSE 0 END) > 0
                            THEN ROUND(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN current_row ELSE 0 END) /
                                       SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN total_rows ELSE 0 END) * 100)
                            ELSE NULL END FROM project_sections WHERE project_id = p.id)
                    WHEN p.total_rows > 0 THEN ROUND((p.current_row / p.total_rows) * 100)
                    ELSE NULL
                END as progress,
                (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) AS sections_count,
                (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id AND is_completed = 1) AS completed_sections_count,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_current_rows,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 THEN total_rows ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_total_rows,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS unquantifiable_current_rows,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND COALESCE(counter_unit, 'rows') = 'rows' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_current_rows_unit,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND COALESCE(counter_unit, 'rows') = 'rows' THEN total_rows ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_total_rows_unit,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND counter_unit = 'cm' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_current_cm,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND total_rows > 0 AND counter_unit = 'cm' THEN total_rows ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS quantifiable_total_cm,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) AND COALESCE(counter_unit, 'rows') = 'rows' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS unquantifiable_current_rows_unit,
                (SELECT COALESCE(SUM(CASE WHEN COALESCE(progression_type, 'simple') <> 'action' AND (total_rows IS NULL OR total_rows <= 0) AND counter_unit = 'cm' THEN current_row ELSE 0 END), 0) FROM project_sections WHERE project_id = p.id) AS unquantifiable_current_cm,
                CASE WHEN (SELECT COUNT(*) FROM project_sections WHERE project_id = p.id) > 0
                     THEN (SELECT COALESCE(SUM(current_row), 0) FROM project_sections WHERE project_id = p.id)
                     ELSE COALESCE(p.current_row, 0) END AS activity_rows
            FROM projects p
            WHERE p.user_id = :user_id
              AND p.status != 'completed'
            ORDER BY p.updated_at DESC
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$project) {
            return [];
        }

        return [
            'name' => $project['name'],
            'progress' => $project['progress'] !== null ? (int)$project['progress'] : null,
            'sections_count' => (int)$project['sections_count'],
            'completed_sections_count' => (int)$project['completed_sections_count'],
            'quantifiable_current_rows' => (int)$project['quantifiable_current_rows'],
            'quantifiable_total_rows' => (int)$project['quantifiable_total_rows'],
            'unquantifiable_current_rows' => (int)$project['unquantifiable_current_rows'],
            'quantifiable_current_rows_unit' => (float)$project['quantifiable_current_rows_unit'],
            'quantifiable_total_rows_unit' => (float)$project['quantifiable_total_rows_unit'],
            'quantifiable_current_cm' => (float)$project['quantifiable_current_cm'],
            'quantifiable_total_cm' => (float)$project['quantifiable_total_cm'],
            'unquantifiable_current_rows_unit' => (float)$project['unquantifiable_current_rows_unit'],
            'unquantifiable_current_cm' => (float)$project['unquantifiable_current_cm'],
            'activity_rows' => (int)$project['activity_rows'],
        ];
    }

    /**
     * Enregistrer l'envoi d'un email dans la table de tracking
     *
     * @param int $userId ID de l'utilisateur
     * @param string $notificationType Type de notification
     * @param string $subject Sujet de l'email
     * @return bool True si enregistré avec succès
     */
    private function recordEmailSent(int $userId, string $notificationType, string $subject): bool
    {
        try {
            $sql = "
                INSERT INTO email_notifications_sent
                (user_id, notification_type, email_subject, email_status, sent_at)
                VALUES (:user_id, :notification_type, :email_subject, 'sent', NOW())
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'user_id' => $userId,
                'notification_type' => $notificationType,
                'email_subject' => $subject
            ]);

            return true;

        } catch (\Exception $e) {
            error_log("[NotificationService] Erreur enregistrement email : " . $e->getMessage());
            return false;
        }
    }

    /**
     * Exécuter tous les types de notifications
     *
     * @return array Résumé global
     */
    public function sendAllNotifications(): array
    {
        $results = [];

        // Onboarding J+3
        $results['onboarding'] = $this->sendOnboardingDay3Emails();

        // Réengagement J+7
        $results['reengagement'] = $this->sendReengagementDay7Emails();

        // Besoin d'aide J+21
        $results['need_help'] = $this->sendNeedHelpDay21Emails();

        // Calcul du total
        $totalSent =
            ($results['onboarding']['sent'] ?? 0) +
            ($results['reengagement']['sent'] ?? 0) +
            ($results['need_help']['sent'] ?? 0);

        $totalFailed =
            ($results['onboarding']['failed'] ?? 0) +
            ($results['reengagement']['failed'] ?? 0) +
            ($results['need_help']['failed'] ?? 0);

        return [
            'success' => true,
            'total_sent' => $totalSent,
            'total_failed' => $totalFailed,
            'details' => $results,
            'summary' => "Total: {$totalSent} emails envoyés, {$totalFailed} échoués"
        ];
    }
}
