<?php
/**
 * Service pour gérer les codes beta de la waitlist
 */

declare(strict_types=1);

namespace App\Services;

use PDO;

class BetaCodeService
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Valider un code beta
     *
     * @return array ['valid' => bool, 'message' => string, 'beta_type' => 'pro'|'free', 'email' => string]
     */
    public function validateCode(string $code): array
    {
        if (empty($code)) {
            return [
                'valid' => false,
                'message' => 'Code beta requis'
            ];
        }

        $query = "SELECT id, email, beta_type, beta_activated
                  FROM waitlist_emails
                  WHERE beta_code = :code
                  AND is_subscribed = 1";

        $stmt = $this->db->prepare($query);
        $stmt->execute([':code' => $code]);
        $betaEntry = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$betaEntry) {
            return [
                'valid' => false,
                'message' => 'Code beta invalide'
            ];
        }

        if ($betaEntry['beta_activated']) {
            return [
                'valid' => false,
                'message' => 'Ce code beta a déjà été utilisé'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Code beta valide',
            'beta_type' => $betaEntry['beta_type'],
            'email' => $betaEntry['email'],
            'waitlist_id' => $betaEntry['id']
        ];
    }

    /**
     * Marquer un code beta comme utilisé
     */
    public function markCodeAsUsed(string $code, int $userId): bool
    {
        $query = "UPDATE waitlist_emails
                  SET beta_activated = 1,
                      activated_user_id = :user_id,
                      activated_at = NOW()
                  WHERE beta_code = :code";

        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':code' => $code,
            ':user_id' => $userId
        ]);
    }

    /**
     * Appliquer les bénéfices du code beta à un utilisateur
     */
    public function applyBetaBenefits(int $userId, string $betaType): bool
    {
        if ($betaType === 'pro') {
            // Accès PRO offert 1 mois
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 month'));

            $query = "UPDATE users
                      SET subscription_type = 'pro',
                          subscription_expires_at = :expires_at
                      WHERE id = :user_id";

            $stmt = $this->db->prepare($query);
            $result = $stmt->execute([
                ':user_id' => $userId,
                ':expires_at' => $expiresAt
            ]);

            if (!$result) {
                return false;
            }

            // Initialiser les crédits photos PRO (30 crédits/mois)
            $creditsQuery = "INSERT INTO user_photo_credits
                            (user_id, monthly_credits, purchased_credits, credits_used_this_month, total_credits_used, last_reset_at)
                            VALUES (:user_id, 30, 0, 0, 0, NOW())
                            ON DUPLICATE KEY UPDATE
                            monthly_credits = 30,
                            credits_used_this_month = 0,
                            last_reset_at = NOW()";

            $creditsStmt = $this->db->prepare($creditsQuery);
            return $creditsStmt->execute([':user_id' => $userId]);

        } elseif ($betaType === 'free') {
            // Plan FREE classique : initialiser avec 3 crédits/mois
            $creditsQuery = "INSERT INTO user_photo_credits
                            (user_id, monthly_credits, purchased_credits, credits_used_this_month, total_credits_used, last_reset_at)
                            VALUES (:user_id, 3, 0, 0, 0, NOW())
                            ON DUPLICATE KEY UPDATE
                            monthly_credits = 3,
                            last_reset_at = NOW()";

            $creditsStmt = $this->db->prepare($creditsQuery);
            return $creditsStmt->execute([':user_id' => $userId]);
        }

        return false;
    }
}
