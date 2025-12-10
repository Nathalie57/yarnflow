<?php
/**
 * @file EarlyBirdService.php
 * @brief Service de gestion de l'offre Early Bird limitée (200 places)
 * @author [AI:Claude]
 * @created 2025-11-29
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;

class EarlyBirdService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * [AI:Claude] Vérifier si l'Early Bird est encore disponible
     *
     * @return bool True si des places restantes
     */
    public function isAvailable(): bool
    {
        $query = "SELECT is_active, current_slots, max_slots
                  FROM early_bird_config
                  WHERE id = 1";

        $stmt = $this->db->query($query);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config)
            return false;

        return $config['is_active'] && $config['current_slots'] < $config['max_slots'];
    }

    /**
     * [AI:Claude] Obtenir les statistiques Early Bird
     *
     * @return array|null Stats ou null
     */
    public function getStats(): ?array
    {
        $query = "SELECT * FROM v_early_bird_stats";
        $stmt = $this->db->query($query);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * [AI:Claude] Réserver une place Early Bird pour un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param string|null $stripeCustomerId ID client Stripe
     * @param string|null $stripeSubscriptionId ID abonnement Stripe
     * @return array Résultat avec slot_number ou error
     */
    public function reserveSlot(
        int $userId,
        ?string $stripeCustomerId = null,
        ?string $stripeSubscriptionId = null
    ): array {
        // [AI:Claude] Vérifier disponibilité
        if (!$this->isAvailable()) {
            return [
                'success' => false,
                'error' => 'Offre Early Bird épuisée (200/200 places)'
            ];
        }

        // [AI:Claude] Vérifier si user n'a pas déjà une place
        if ($this->hasSlot($userId)) {
            return [
                'success' => false,
                'error' => 'Vous avez déjà une place Early Bird'
            ];
        }

        try {
            $this->db->beginTransaction();

            // [AI:Claude] Obtenir le prochain numéro de slot
            $query = "SELECT current_slots + 1 as next_slot FROM early_bird_config WHERE id = 1 FOR UPDATE";
            $stmt = $this->db->query($query);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $slotNumber = (int)$result['next_slot'];

            // [AI:Claude] Créer la souscription Early Bird (12 mois)
            $query = "INSERT INTO early_bird_subscriptions
                      (user_id, slot_number, stripe_customer_id, stripe_subscription_id, expires_at)
                      VALUES (:user_id, :slot_number, :stripe_customer_id, :stripe_subscription_id, DATE_ADD(NOW(), INTERVAL 12 MONTH))";

            $stmt = $this->db->prepare($query);
            $stmt->execute([
                'user_id' => $userId,
                'slot_number' => $slotNumber,
                'stripe_customer_id' => $stripeCustomerId,
                'stripe_subscription_id' => $stripeSubscriptionId
            ]);

            $this->db->commit();

            error_log("[EARLY BIRD] Place #{$slotNumber} réservée pour user {$userId}");

            return [
                'success' => true,
                'slot_number' => $slotNumber,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+12 months'))
            ];

        } catch (\Exception $e) {
            $this->db->rollBack();
            error_log("[EARLY BIRD] Erreur réservation : ".$e->getMessage());

            return [
                'success' => false,
                'error' => 'Erreur lors de la réservation Early Bird'
            ];
        }
    }

    /**
     * [AI:Claude] Vérifier si un utilisateur a une place Early Bird
     *
     * @param int $userId ID de l'utilisateur
     * @return bool True si place active
     */
    public function hasSlot(int $userId): bool
    {
        $query = "SELECT id FROM early_bird_subscriptions
                  WHERE user_id = :user_id AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetch() !== false;
    }

    /**
     * [AI:Claude] Annuler une place Early Bird
     *
     * @param int $userId ID de l'utilisateur
     * @return bool Succès de l'annulation
     */
    public function cancelSlot(int $userId): bool
    {
        $query = "UPDATE early_bird_subscriptions
                  SET is_active = FALSE, cancelled_at = NOW()
                  WHERE user_id = :user_id AND is_active = TRUE";

        $stmt = $this->db->prepare($query);
        $result = $stmt->execute(['user_id' => $userId]);

        if ($result && $stmt->rowCount() > 0) {
            error_log("[EARLY BIRD] Place annulée pour user {$userId}");
            return true;
        }

        return false;
    }

    /**
     * [AI:Claude] Obtenir les détails de la souscription Early Bird d'un user
     *
     * @param int $userId ID de l'utilisateur
     * @return array|null Détails ou null
     */
    public function getUserSubscription(int $userId): ?array
    {
        $query = "SELECT
                    slot_number,
                    subscribed_at,
                    expires_at,
                    is_active,
                    DATEDIFF(expires_at, NOW()) as days_remaining
                  FROM early_bird_subscriptions
                  WHERE user_id = :user_id";

        $stmt = $this->db->prepare($query);
        $stmt->execute(['user_id' => $userId]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * [AI:Claude] Fermer définitivement l'offre Early Bird
     *
     * @return bool Succès
     */
    public function closeOffer(): bool
    {
        $query = "UPDATE early_bird_config
                  SET is_active = FALSE, closed_at = NOW()
                  WHERE id = 1";

        $stmt = $this->db->query($query);

        error_log("[EARLY BIRD] Offre fermée définitivement");

        return $stmt->rowCount() > 0;
    }

    /**
     * [AI:Claude] Obtenir la liste des Early Birds actifs (admin)
     *
     * @return array Liste des souscriptions actives
     */
    public function getActiveSubscriptions(): array
    {
        $query = "SELECT * FROM v_early_bird_active_users ORDER BY slot_number ASC";
        $stmt = $this->db->query($query);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
