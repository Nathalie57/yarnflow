<?php

declare(strict_types=1);

namespace App\Services;

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use App\Config\Database;
use PDO;

class PushService
{
    private PDO $db;
    private WebPush $webPush;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();

        $auth = [
            'VAPID' => [
                'subject'    => 'mailto:' . ($_ENV['VAPID_SUBJECT'] ?? 'contact@yarnflow.fr'),
                'publicKey'  => $_ENV['VAPID_PUBLIC_KEY']  ?? '',
                'privateKey' => $_ENV['VAPID_PRIVATE_KEY'] ?? '',
            ],
        ];

        $this->webPush = new WebPush($auth);
        $this->webPush->setReuseVAPIDHeaders(true);
    }

    /**
     * Enregistre ou met à jour la subscription push d'un utilisateur
     */
    public function saveSubscription(int $userId, array $subscription, ?string $userAgent = null): bool
    {
        $endpoint = $subscription['endpoint'] ?? '';
        $p256dh   = $subscription['keys']['p256dh'] ?? '';
        $auth     = $subscription['keys']['auth'] ?? '';

        if (empty($endpoint) || empty($p256dh) || empty($auth)) {
            return false;
        }

        $stmt = $this->db->prepare("
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
            VALUES (:user_id, :endpoint, :p256dh, :auth, :user_agent)
            ON DUPLICATE KEY UPDATE
                user_id    = VALUES(user_id),
                p256dh     = VALUES(p256dh),
                auth       = VALUES(auth),
                user_agent = VALUES(user_agent),
                updated_at = NOW()
        ");

        return $stmt->execute([
            'user_id'    => $userId,
            'endpoint'   => $endpoint,
            'p256dh'     => $p256dh,
            'auth'       => $auth,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Supprime la subscription d'un utilisateur (désabonnement)
     */
    public function deleteSubscription(int $userId, string $endpoint): bool
    {
        $stmt = $this->db->prepare(
            "DELETE FROM push_subscriptions WHERE user_id = :user_id AND endpoint = :endpoint"
        );
        return $stmt->execute(['user_id' => $userId, 'endpoint' => $endpoint]);
    }

    /**
     * Envoie une notification push à un utilisateur (toutes ses subscriptions)
     */
    public function sendToUser(int $userId, string $title, string $body, ?string $url = null): int
    {
        $stmt = $this->db->prepare(
            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = :user_id"
        );
        $stmt->execute(['user_id' => $userId]);
        $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($subscriptions)) {
            return 0;
        }

        return $this->sendToSubscriptions($subscriptions, $title, $body, $url);
    }

    /**
     * Envoie une notification push à plusieurs utilisateurs
     * @param int[] $userIds
     */
    public function sendToUsers(array $userIds, string $title, string $body, ?string $url = null): int
    {
        if (empty($userIds)) {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($userIds), '?'));
        $stmt = $this->db->prepare(
            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id IN ($placeholders)"
        );
        $stmt->execute($userIds);
        $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($subscriptions)) {
            return 0;
        }

        return $this->sendToSubscriptions($subscriptions, $title, $body, $url);
    }

    /**
     * Envoie aux subscriptions et purge les endpoints expirés
     */
    private function sendToSubscriptions(array $subscriptions, string $title, string $body, ?string $url): int
    {
        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'icon'  => '/icons/icon-192x192.png',
            'badge' => '/icons/icon-72x72.png',
            'url'   => $url ?? '/',
        ]);

        foreach ($subscriptions as $sub) {
            $subscription = Subscription::create([
                'endpoint'        => $sub['endpoint'],
                'keys'            => [
                    'p256dh' => $sub['p256dh'],
                    'auth'   => $sub['auth'],
                ],
            ]);

            $this->webPush->queueNotification($subscription, $payload);
        }

        $sent = 0;
        foreach ($this->webPush->flush() as $report) {
            if ($report->isSuccess()) {
                $sent++;
            } else {
                // Supprimer les subscriptions expirées/invalides
                if ($report->isSubscriptionExpired()) {
                    $this->db->prepare(
                        "DELETE FROM push_subscriptions WHERE endpoint = ?"
                    )->execute([$report->getEndpoint()]);

                    error_log("[PushService] Subscription expirée supprimée: " . substr($report->getEndpoint(), 0, 60));
                } else {
                    error_log("[PushService] Échec envoi: " . $report->getReason());
                }
            }
        }

        return $sent;
    }
}
