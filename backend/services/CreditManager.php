<?php
/**
 * @file CreditManager.php
 * @brief Gestion des crédits photos IA
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création système crédits photos
 *
 * @history
 *   2025-11-14 [AI:Claude] Création service gestion crédits photos IA
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;

class CreditManager
{
    private PDO $db;

    /**
     * [AI:Claude] Quotas mensuels par plan (v0.12.0 - YarnFlow Pricing Final)
     * Aligné sur CLAUDE.md
     */
    private const MONTHLY_QUOTAS = [
        'free' => 3,          // FREE : 3 photos/mois
        'pro' => 30,          // PRO 4.99€/mois : 30 photos
        'pro_annual' => 30,   // PRO ANNUAL 39.99€/an : 30 photos/mois
        'early_bird' => 30,   // EARLY BIRD 2.99€/mois : 30 photos/mois (accès PRO complet)
        // Legacy support (deprecated - tous migrés vers 'pro')
        'standard' => 30,
        'premium' => 30,
        'monthly' => 30,
        'yearly' => 30,
        'starter' => 30
    ];

    /**
     * [AI:Claude] Packs de crédits disponibles (v0.12.0 - YarnFlow Pricing Final)
     * Aligné sur CLAUDE.md
     */
    private const CREDIT_PACKS = [
        'pack_50' => [
            'price' => 4.99,
            'credits' => 50,
            'bonus' => 0,
            'total' => 50
        ],
        'pack_150' => [
            'price' => 9.99,
            'credits' => 150,
            'bonus' => 0,
            'total' => 150
        ]
    ];

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * [AI:Claude] Obtenir les crédits disponibles d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return array Crédits disponibles (monthly, purchased, total)
     */
    public function getUserCredits(int $userId): array
    {
        // [AI:Claude] D'abord vérifier si reset mensuel nécessaire
        $this->checkAndResetMonthlyCredits($userId);

        $query = "SELECT
                    monthly_credits,
                    purchased_credits,
                    credits_used_this_month,
                    total_credits_used,
                    last_reset_at
                  FROM user_photo_credits
                  WHERE user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $credits = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$credits) {
            // [AI:Claude] Initialiser les crédits si pas encore créés
            $this->initializeUserCredits($userId);
            return $this->getUserCredits($userId);
        }

        return [
            'monthly_credits' => (int)$credits['monthly_credits'],
            'purchased_credits' => (int)$credits['purchased_credits'],
            'total_available' => (int)$credits['monthly_credits'] + (int)$credits['purchased_credits'],
            'credits_used_this_month' => (int)$credits['credits_used_this_month'],
            'total_credits_used' => (int)$credits['total_credits_used'],
            'last_reset_at' => $credits['last_reset_at']
        ];
    }

    /**
     * [AI:Claude] Vérifier si l'utilisateur a des crédits disponibles
     *
     * @param int $userId ID de l'utilisateur
     * @param int $creditsNeeded Nombre de crédits nécessaires
     * @return bool True si assez de crédits
     */
    public function hasEnoughCredits(int $userId, int $creditsNeeded = 1): bool
    {
        $credits = $this->getUserCredits($userId);
        return $credits['total_available'] >= $creditsNeeded;
    }

    /**
     * [AI:Claude] Utiliser un crédit photo
     *
     * @param int $userId ID de l'utilisateur
     * @return array Résultat avec success et credit_type utilisé
     * @throws \Exception Si pas assez de crédits
     */
    public function useCredit(int $userId): array
    {
        $credits = $this->getUserCredits($userId);

        if ($credits['total_available'] < 1)
            throw new \Exception('Crédits insuffisants');

        $this->db->beginTransaction();

        try {
            // [AI:Claude] Priorité 1 : Utiliser crédits mensuels d'abord
            if ($credits['monthly_credits'] > 0) {
                $this->decrementMonthlyCredits($userId);
                $creditType = 'monthly';
            } else {
                // [AI:Claude] Priorité 2 : Utiliser crédits achetés
                $this->decrementPurchasedCredits($userId);
                $creditType = 'purchased';
            }

            $this->db->commit();

            return [
                'success' => true,
                'credit_type' => $creditType,
                'remaining_credits' => $credits['total_available'] - 1
            ];

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * [AI:Claude] Décrémenter les crédits mensuels
     *
     * @param int $userId ID de l'utilisateur
     * @return bool Succès
     */
    private function decrementMonthlyCredits(int $userId): bool
    {
        $query = "UPDATE user_photo_credits
                  SET monthly_credits = monthly_credits - 1,
                      credits_used_this_month = credits_used_this_month + 1,
                      total_credits_used = total_credits_used + 1
                  WHERE user_id = :user_id
                  AND monthly_credits > 0";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Décrémenter les crédits achetés
     *
     * @param int $userId ID de l'utilisateur
     * @return bool Succès
     */
    private function decrementPurchasedCredits(int $userId): bool
    {
        $query = "UPDATE user_photo_credits
                  SET purchased_credits = purchased_credits - 1,
                      total_credits_used = total_credits_used + 1
                  WHERE user_id = :user_id
                  AND purchased_credits > 0";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Ajouter des crédits achetés
     *
     * @param int $userId ID de l'utilisateur
     * @param int $credits Nombre de crédits à ajouter
     * @return bool Succès
     */
    public function addPurchasedCredits(int $userId, int $credits): bool
    {
        $query = "UPDATE user_photo_credits
                  SET purchased_credits = purchased_credits + :credits
                  WHERE user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':credits', $credits, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Initialiser les crédits pour un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param string $subscriptionType Type d'abonnement
     * @return bool Succès
     */
    public function initializeUserCredits(int $userId, string $subscriptionType = 'free'): bool
    {
        $monthlyCredits = self::MONTHLY_QUOTAS[$subscriptionType] ?? self::MONTHLY_QUOTAS['free'];

        $query = "INSERT INTO user_photo_credits
                  (user_id, monthly_credits, last_reset_at)
                  VALUES (:user_id, :monthly_credits, NOW())
                  ON DUPLICATE KEY UPDATE
                  monthly_credits = :monthly_credits";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':monthly_credits', $monthlyCredits, PDO::PARAM_INT);

        return $stmt->execute();
    }

    /**
     * [AI:Claude] Enregistrer un achat de pack de crédits
     *
     * @param int $userId ID de l'utilisateur
     * @param string $packType Type de pack (small, medium, large)
     * @param string $stripePaymentIntentId ID Stripe
     * @return int ID de l'achat
     */
    public function recordCreditPurchase(
        int $userId,
        string $packType,
        string $stripePaymentIntentId
    ): int {
        $pack = self::CREDIT_PACKS[$packType] ?? null;

        if (!$pack)
            throw new \InvalidArgumentException("Pack type invalide: $packType");

        $query = "INSERT INTO credit_purchases
                  (user_id, pack_type, amount, credits_purchased, bonus_credits,
                   total_credits, payment_method, stripe_payment_intent_id, status)
                  VALUES
                  (:user_id, :pack_type, :amount, :credits, :bonus, :total,
                   'stripe', :payment_intent_id, 'pending')";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':pack_type', $packType, PDO::PARAM_STR);
        $stmt->bindValue(':amount', $pack['price'], PDO::PARAM_STR);
        $stmt->bindValue(':credits', $pack['credits'], PDO::PARAM_INT);
        $stmt->bindValue(':bonus', $pack['bonus'], PDO::PARAM_INT);
        $stmt->bindValue(':total', $pack['total'], PDO::PARAM_INT);
        $stmt->bindValue(':payment_intent_id', $stripePaymentIntentId, PDO::PARAM_STR);

        $stmt->execute();

        return (int)$this->db->lastInsertId();
    }

    /**
     * [AI:Claude] Compléter un achat de crédits (après paiement Stripe)
     *
     * @param string $stripePaymentIntentId ID Stripe
     * @return bool Succès
     */
    public function completeCreditPurchase(string $stripePaymentIntentId): bool
    {
        // [AI:Claude] Récupérer l'achat
        $query = "SELECT id, user_id, total_credits, status
                  FROM credit_purchases
                  WHERE stripe_payment_intent_id = :payment_intent_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':payment_intent_id', $stripePaymentIntentId, PDO::PARAM_STR);
        $stmt->execute();

        $purchase = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$purchase || $purchase['status'] === 'completed')
            return false;

        $this->db->beginTransaction();

        try {
            // [AI:Claude] Marquer comme completed
            $updateQuery = "UPDATE credit_purchases
                           SET status = 'completed',
                               completed_at = NOW()
                           WHERE id = :id";

            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->bindValue(':id', $purchase['id'], PDO::PARAM_INT);
            $updateStmt->execute();

            // [AI:Claude] Créditer l'utilisateur
            $this->addPurchasedCredits(
                (int)$purchase['user_id'],
                (int)$purchase['total_credits']
            );

            $this->db->commit();
            return true;

        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * [AI:Claude] Obtenir les packs disponibles
     *
     * @return array Liste des packs avec prix et crédits
     */
    public static function getAvailablePacks(): array
    {
        return self::CREDIT_PACKS;
    }

    /**
     * [AI:Claude] Obtenir le quota mensuel selon le plan
     *
     * @param string $subscriptionType Type d'abonnement
     * @return int Nombre de crédits mensuels
     */
    public static function getMonthlyQuota(string $subscriptionType): int
    {
        return self::MONTHLY_QUOTAS[$subscriptionType] ?? self::MONTHLY_QUOTAS['free'];
    }

    /**
     * [AI:Claude] Vérifier et réinitialiser les crédits mensuels si nécessaire
     *
     * @param int $userId ID de l'utilisateur
     * @return bool True si reset effectué
     */
    private function checkAndResetMonthlyCredits(int $userId): bool
    {
        // [AI:Claude] Récupérer les infos utilisateur et crédits
        $query = "SELECT
                    upc.last_reset_at,
                    u.subscription_type,
                    u.subscription_expires_at
                  FROM user_photo_credits upc
                  INNER JOIN users u ON u.id = upc.user_id
                  WHERE upc.user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $data = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$data)
            return false;

        // [AI:Claude] Vérifier si le dernier reset date de plus d'un mois
        $lastReset = new \DateTime($data['last_reset_at']);
        $now = new \DateTime();
        $interval = $lastReset->diff($now);

        // [AI:Claude] Si >= 1 mois, reset
        if ($interval->m >= 1 || $interval->y >= 1) {
            // [AI:Claude] Vérifier si l'abonnement est expiré
            $subscriptionType = $data['subscription_type'];
            if ($subscriptionType !== 'free' && isset($data['subscription_expires_at']) && $data['subscription_expires_at'] !== null) {
                $expiresAt = strtotime($data['subscription_expires_at']);
                if ($expiresAt <= time()) {
                    // Abonnement expiré, utiliser quota FREE
                    $subscriptionType = 'free';
                    error_log("[CREDIT RESET] User $userId - Abonnement expiré, quota FREE appliqué");
                }
            }

            $newQuota = self::getMonthlyQuota($subscriptionType);

            $updateQuery = "UPDATE user_photo_credits
                           SET monthly_credits = :new_quota,
                               credits_used_this_month = 0,
                               last_reset_at = NOW()
                           WHERE user_id = :user_id";

            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $updateStmt->bindValue(':new_quota', $newQuota, PDO::PARAM_INT);
            $updateStmt->execute();

            error_log("[CREDIT RESET] User $userId - Quota resetté à $newQuota crédits (plan: {$subscriptionType})");

            return true;
        }

        return false;
    }
}
