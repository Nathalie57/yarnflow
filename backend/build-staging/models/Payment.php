<?php
/**
 * @file Payment.php
 * @brief Modèle pour la gestion des paiements
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création initiale
 *
 * @history
 *   2025-11-13 [AI:Claude] Création du modèle Payment avec méthodes Stripe
 */

declare(strict_types=1);

namespace App\Models;

/**
 * [AI:Claude] Modèle de gestion des paiements Stripe
 */
class Payment extends BaseModel
{
    protected string $table = 'payments';

    /**
     * [AI:Claude] Créer un nouveau paiement
     *
     * @param int $userId ID de l'utilisateur
     * @param int|null $patternId ID du patron (null pour abonnement)
     * @param string $stripeSessionId ID de session Stripe
     * @param float $amount Montant en euros
     * @param string $paymentType Type de paiement
     * @return int ID du paiement créé
     */
    public function createPayment(
        int $userId,
        ?int $patternId,
        string $stripeSessionId,
        float $amount,
        string $paymentType
    ): int {
        return $this->create([
            'user_id' => $userId,
            'pattern_id' => $patternId,
            'stripe_session_id' => $stripeSessionId,
            'amount' => $amount,
            'status' => PAYMENT_PENDING,
            'payment_type' => $paymentType
        ]);
    }

    /**
     * [AI:Claude] Trouver un paiement par session Stripe
     *
     * @param string $sessionId ID de session Stripe
     * @return array|null Paiement ou null
     */
    public function findBySessionId(string $sessionId): ?array
    {
        return $this->findOne(['stripe_session_id' => $sessionId]);
    }

    /**
     * [AI:Claude] Trouver un paiement par payment intent Stripe
     *
     * @param string $paymentIntentId ID du payment intent
     * @return array|null Paiement ou null
     */
    public function findByPaymentIntentId(string $paymentIntentId): ?array
    {
        return $this->findOne(['stripe_payment_intent_id' => $paymentIntentId]);
    }

    /**
     * [AI:Claude] Récupérer tous les paiements d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param int $limit Nombre de résultats
     * @param int $offset Offset pour pagination
     * @return array Liste des paiements
     */
    public function findByUserId(int $userId, int $limit = 50, int $offset = 0): array
    {
        return $this->findBy(['user_id' => $userId], $limit, $offset);
    }

    /**
     * [AI:Claude] Mettre à jour le statut d'un paiement
     *
     * @param int $paymentId ID du paiement
     * @param string $status Nouveau statut
     * @return bool Succès de la mise à jour
     */
    public function updateStatus(int $paymentId, string $status): bool
    {
        return $this->update($paymentId, [
            'status' => $status,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * [AI:Claude] Marquer un paiement comme complété
     *
     * @param int $paymentId ID du paiement
     * @param string $paymentIntentId ID du payment intent Stripe
     * @return bool Succès de la mise à jour
     */
    public function markAsCompleted(int $paymentId, string $paymentIntentId): bool
    {
        return $this->update($paymentId, [
            'status' => PAYMENT_COMPLETED,
            'stripe_payment_intent_id' => $paymentIntentId,
            'completed_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * [AI:Claude] Marquer un paiement comme échoué
     *
     * @param int $paymentId ID du paiement
     * @param string $errorMessage Message d'erreur
     * @return bool Succès de la mise à jour
     */
    public function markAsFailed(int $paymentId, string $errorMessage): bool
    {
        return $this->update($paymentId, [
            'status' => PAYMENT_FAILED,
            'error_message' => $errorMessage,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * [AI:Claude] Marquer un paiement comme remboursé
     *
     * @param int $paymentId ID du paiement
     * @param string $refundId ID du remboursement Stripe
     * @return bool Succès de la mise à jour
     */
    public function markAsRefunded(int $paymentId, string $refundId): bool
    {
        return $this->update($paymentId, [
            'status' => PAYMENT_REFUNDED,
            'stripe_refund_id' => $refundId,
            'refunded_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * [AI:Claude] Obtenir le montant total des paiements complétés d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @return float Montant total
     */
    public function getTotalPaidByUser(int $userId): float
    {
        $sql = "SELECT SUM(amount) as total
                FROM {$this->table}
                WHERE user_id = :user_id
                AND status = :status";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'user_id' => $userId,
            'status' => PAYMENT_COMPLETED
        ]);

        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return (float)($result['total'] ?? 0);
    }

    /**
     * [AI:Claude] Obtenir le montant total des revenus (tous utilisateurs)
     *
     * @param string|null $startDate Date de début (format Y-m-d)
     * @param string|null $endDate Date de fin (format Y-m-d)
     * @return float Montant total
     */
    public function getTotalRevenue(?string $startDate = null, ?string $endDate = null): float
    {
        $sql = "SELECT SUM(amount) as total
                FROM {$this->table}
                WHERE status = :status";

        $params = ['status' => PAYMENT_COMPLETED];

        if ($startDate !== null) {
            $sql .= " AND created_at >= :start_date";
            $params['start_date'] = $startDate.' 00:00:00';
        }

        if ($endDate !== null) {
            $sql .= " AND created_at <= :end_date";
            $params['end_date'] = $endDate.' 23:59:59';
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return (float)($result['total'] ?? 0);
    }

    /**
     * [AI:Claude] Obtenir les statistiques de paiement
     *
     * @return array Statistiques
     */
    public function getPaymentStats(): array
    {
        // [AI:Claude] Note: On utilise directement les constantes au lieu de paramètres bindés
        // car PDO ne supporte pas la réutilisation du même paramètre nommé plusieurs fois
        $completed = PAYMENT_COMPLETED;
        $pending = PAYMENT_PENDING;
        $failed = PAYMENT_FAILED;
        $refunded = PAYMENT_REFUNDED;

        $sql = "SELECT
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = '$completed' THEN 1 ELSE 0 END) as completed_count,
                    SUM(CASE WHEN status = '$pending' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status = '$failed' THEN 1 ELSE 0 END) as failed_count,
                    SUM(CASE WHEN status = '$refunded' THEN 1 ELSE 0 END) as refunded_count,
                    SUM(CASE WHEN status = '$completed' THEN amount ELSE 0 END) as total_revenue,
                    AVG(CASE WHEN status = '$completed' THEN amount ELSE NULL END) as average_payment
                FROM {$this->table}";

        $stmt = $this->db->query($sql);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        return [
            'total_payments' => (int)$result['total_payments'],
            'completed_count' => (int)$result['completed_count'],
            'pending_count' => (int)$result['pending_count'],
            'failed_count' => (int)$result['failed_count'],
            'refunded_count' => (int)$result['refunded_count'],
            'total_revenue' => (float)$result['total_revenue'],
            'average_payment' => (float)$result['average_payment']
        ];
    }

    /**
     * [AI:Claude] Obtenir les derniers paiements (pour admin)
     *
     * @param int $limit Nombre de résultats
     * @return array Liste des paiements
     */
    public function getRecentPayments(int $limit = 10): array
    {
        $sql = "SELECT p.*, u.email as user_email, u.first_name, u.last_name
                FROM {$this->table} p
                LEFT JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
                LIMIT :limit";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * [AI:Claude] Nettoyer les paiements en attente de plus de 24h
     *
     * @return int Nombre de paiements supprimés
     */
    public function cleanExpiredPendingPayments(): int
    {
        $sql = "DELETE FROM {$this->table}
                WHERE status = :status
                AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute(['status' => PAYMENT_PENDING]);

        return $stmt->rowCount();
    }
}
