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
     * Envoyer les emails d'onboarding J+3 (utilisateurs sans projet)
     *
     * @return array Résultat de l'envoi
     */
    public function sendOnboardingDay3Emails(): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Trouver les utilisateurs inscrits il y a 3 jours qui n'ont aucun projet
            $sql = "
                SELECT u.id, u.email, u.first_name
                FROM users u
                LEFT JOIN projects p ON p.user_id = u.id
                WHERE DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
                  AND p.id IS NULL
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
                $success = $this->emailService->sendOnboardingDay3Email($user['email'], $name, $user['id']);

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
     * Envoyer les emails de réengagement J+14 (utilisateurs inactifs)
     *
     * @return array Résultat de l'envoi
     */
    public function sendReengagementDay14Emails(): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Trouver les utilisateurs inactifs depuis 14 jours qui ont au moins 1 projet
            $sql = "
                SELECT u.id, u.email, u.first_name,
                       (SELECT COUNT(*) FROM projects WHERE user_id = u.id) as project_count
                FROM users u
                WHERE u.last_seen_at <= DATE_SUB(NOW(), INTERVAL 14 DAY)
                  AND u.email_notifications = 1
                  AND EXISTS (SELECT 1 FROM projects WHERE user_id = u.id)
                  AND NOT EXISTS (
                      SELECT 1 FROM email_notifications_sent
                      WHERE user_id = u.id
                        AND notification_type = 'reengagement_day14'
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

                $success = $this->emailService->sendReengagementDay14Email(
                    $user['email'],
                    $name,
                    $projectData,
                    $user['id']
                );

                if ($success) {
                    $this->recordEmailSent($user['id'], 'reengagement_day14', '🧵 Votre tricot vous attend !');
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
                'message' => "Emails réengagement J+14 : {$sent} envoyés, {$failed} échoués"
            ];

        } catch (\Exception $e) {
            error_log("[NotificationService] Erreur envoi réengagement J+14: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Envoyer les emails "On vous manque" J+30 (utilisateurs très inactifs)
     *
     * @return array Résultat de l'envoi
     */
    public function sendMissedYouDay30Emails(): array
    {
        $sent = 0;
        $skipped = 0;
        $failed = 0;

        try {
            // Trouver les utilisateurs inactifs depuis 30 jours
            $sql = "
                SELECT u.id, u.email, u.first_name
                FROM users u
                WHERE u.last_seen_at <= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  AND u.email_notifications = 1
                  AND NOT EXISTS (
                      SELECT 1 FROM email_notifications_sent
                      WHERE user_id = u.id
                        AND notification_type = 'missed_you_day30'
                        AND sent_year = YEAR(NOW())
                        AND sent_month = MONTH(NOW())
                  )
            ";

            $stmt = $this->db->query($sql);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($users as $user) {
                $name = $user['first_name'] ?? 'Membre';
                $success = $this->emailService->sendMissedYouDay30Email($user['email'], $name, $user['id']);

                if ($success) {
                    $this->recordEmailSent($user['id'], 'missed_you_day30', '💔 Vous nous manquez sur YarnFlow !');
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
                'message' => "Emails 'on vous manque' J+30 : {$sent} envoyés, {$failed} échoués"
            ];

        } catch (\Exception $e) {
            error_log("[NotificationService] Erreur envoi 'on vous manque' J+30: " . $e->getMessage());
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
                name,
                current_row,
                total_rows,
                CASE
                    WHEN total_rows > 0 THEN ROUND((current_row / total_rows) * 100)
                    ELSE 0
                END as progress
            FROM projects
            WHERE user_id = :user_id
              AND status != 'completed'
            ORDER BY updated_at DESC
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
            'progress' => (int)$project['progress']
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

        // Réengagement J+14
        $results['reengagement'] = $this->sendReengagementDay14Emails();

        // On vous manque J+30
        $results['missed_you'] = $this->sendMissedYouDay30Emails();

        // Calcul du total
        $totalSent =
            ($results['onboarding']['sent'] ?? 0) +
            ($results['reengagement']['sent'] ?? 0) +
            ($results['missed_you']['sent'] ?? 0);

        $totalFailed =
            ($results['onboarding']['failed'] ?? 0) +
            ($results['reengagement']['failed'] ?? 0) +
            ($results['missed_you']['failed'] ?? 0);

        return [
            'success' => true,
            'total_sent' => $totalSent,
            'total_failed' => $totalFailed,
            'details' => $results,
            'summary' => "Total: {$totalSent} emails envoyés, {$totalFailed} échoués"
        ];
    }
}
