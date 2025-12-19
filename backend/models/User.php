<?php
/**
 * @file User.php
 * @brief Modèle pour la gestion des utilisateurs
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Models;

/**
 * [AI:Claude] Modèle User pour gérer les utilisateurs de l'application
 */
class User extends BaseModel
{
    protected string $table = 'users';

    /**
     * [AI:Claude] Créer un nouvel utilisateur avec mot de passe hashé
     *
     * @param string $email Email de l'utilisateur
     * @param string $password Mot de passe en clair
     * @param string|null $firstName Prénom
     * @param string|null $lastName Nom
     * @return int ID du nouvel utilisateur
     */
    public function createUser(
        string $email,
        string $password,
        ?string $firstName = null,
        ?string $lastName = null
    ): int {
        $data = [
            'email' => $email,
            'password' => password_hash($password, PASSWORD_BCRYPT),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => ROLE_USER,
            'subscription_type' => SUBSCRIPTION_FREE
        ];

        return $this->create($data);
    }

    /**
     * [AI:Claude] Trouver un utilisateur par email
     *
     * @param string $email Email de l'utilisateur
     * @return array|null Données de l'utilisateur ou null
     */
    public function findByEmail(string $email): ?array
    {
        return $this->findOne(['email' => $email]);
    }

    /**
     * [AI:Claude] Vérifier si un email existe déjà
     *
     * @param string $email Email à vérifier
     * @return bool True si l'email existe
     */
    public function emailExists(string $email): bool
    {
        return $this->findByEmail($email) !== null;
    }

    /**
     * [AI:Claude] Créer ou récupérer un utilisateur OAuth (Google, Facebook)
     *
     * @param string $provider Provider OAuth (google, facebook)
     * @param string $providerId ID fourni par le provider
     * @param string $email Email de l'utilisateur
     * @param string|null $firstName Prénom
     * @param string|null $lastName Nom
     * @param string|null $avatar URL de l'avatar
     * @return array Données de l'utilisateur (nouveau ou existant)
     */
    public function findOrCreateOAuthUser(
        string $provider,
        string $providerId,
        string $email,
        ?string $firstName = null,
        ?string $lastName = null,
        ?string $avatar = null
    ): array {
        // [AI:Claude] Chercher d'abord par provider + provider_id
        $sql = "SELECT * FROM {$this->table}
                WHERE oauth_provider = :provider
                AND oauth_provider_id = :provider_id
                LIMIT 1";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'provider' => $provider,
            'provider_id' => $providerId
        ]);
        $user = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($user) {
            // [AI:Claude] Utilisateur OAuth trouvé, le retourner
            return $user;
        }

        // [AI:Claude] Chercher par email (un utilisateur peut avoir créé un compte classique avant)
        $existingUser = $this->findByEmail($email);

        if ($existingUser) {
            // [AI:Claude] Lier le compte existant à OAuth
            $this->update($existingUser['id'], [
                'oauth_provider' => $provider,
                'oauth_provider_id' => $providerId,
                'oauth_avatar' => $avatar
            ]);

            return $this->findById($existingUser['id']);
        }

        // [AI:Claude] Créer un nouvel utilisateur OAuth
        $data = [
            'email' => $email,
            'password' => null, // Pas de mot de passe pour OAuth
            'first_name' => $firstName,
            'last_name' => $lastName,
            'oauth_provider' => $provider,
            'oauth_provider_id' => $providerId,
            'oauth_avatar' => $avatar,
            'role' => ROLE_USER,
            'subscription_type' => SUBSCRIPTION_FREE,
            'email_verified' => 1 // OAuth emails sont déjà vérifiés
        ];

        $userId = $this->create($data);
        return $this->findById($userId);
    }

    /**
     * [AI:Claude] Vérifier le mot de passe d'un utilisateur
     *
     * @param string $email Email de l'utilisateur
     * @param string $password Mot de passe à vérifier
     * @return array|null Données utilisateur si mot de passe correct, null sinon
     */
    public function verifyPassword(string $email, string $password): ?array
    {
        $user = $this->findByEmail($email);

        if ($user === null)
            return null;

        if (!password_verify($password, $user['password']))
            return null;

        return $user;
    }

    /**
     * [AI:Claude] Mettre à jour le type d'abonnement d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param string $subscriptionType Type d'abonnement (free, monthly, yearly)
     * @param string|null $expiresAt Date d'expiration (format Y-m-d H:i:s)
     * @return bool Succès de la mise à jour
     */
    public function updateSubscription(
        int $userId,
        string $subscriptionType,
        ?string $expiresAt = null
    ): bool {
        $data = ['subscription_type' => $subscriptionType];

        if ($expiresAt !== null)
            $data['subscription_expires_at'] = $expiresAt;

        return $this->update($userId, $data);
    }

    /**
     * [AI:Claude] Incrémenter le compteur de patrons générés
     *
     * @param int $userId ID de l'utilisateur
     * @return bool Succès de la mise à jour
     */
    public function incrementPatternCount(int $userId): bool
    {
        $sql = "UPDATE {$this->table}
                SET patterns_generated_count = patterns_generated_count + 1
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['id' => $userId]);
    }

    /**
     * [AI:Claude] Vérifier si l'utilisateur a un abonnement actif
     *
     * @param int $userId ID de l'utilisateur
     * @return bool True si abonnement actif
     */
    public function hasActiveSubscription(int $userId): bool
    {
        $user = $this->findById($userId);

        if ($user === null)
            return false;

        if ($user['subscription_type'] === SUBSCRIPTION_FREE)
            return false;

        if ($user['subscription_expires_at'] === null)
            return true;

        $expiresAt = strtotime($user['subscription_expires_at']);
        return $expiresAt > time();
    }

    /**
     * [AI:Claude] Obtenir le nombre de patrons BETA restants selon le quota (v0.8.0)
     *
     * @param int $userId ID de l'utilisateur
     * @return int|null Nombre de patrons restants, null si erreur
     */
    public function getRemainingPatterns(int $userId): ?int
    {
        $user = $this->findById($userId);

        if ($user === null)
            return 0;

        $subscriptionType = $user['subscription_type'] ?? SUBSCRIPTION_FREE;
        $used = (int)$user['patterns_generated_count'];

        // [AI:Claude] Quotas v0.8.0 - TRACKER-FIRST STRATEGY
        $quotas = [
            SUBSCRIPTION_FREE => (int)($_ENV['MAX_PATTERNS_FREE_BETA'] ?? 1),
            SUBSCRIPTION_STARTER => (int)($_ENV['MAX_PATTERNS_STARTER_BETA'] ?? 5),
            SUBSCRIPTION_PREMIUM => (int)($_ENV['MAX_PATTERNS_PREMIUM_BETA'] ?? 15)
        ];

        $maxPatterns = $quotas[$subscriptionType] ?? $quotas[SUBSCRIPTION_FREE];

        return max(0, $maxPatterns - $used);
    }

    /**
     * [AI:Claude] Obtenir le nombre de projets trackés restants selon le quota (v0.8.0)
     *
     * @param int $userId ID de l'utilisateur
     * @return int|null Nombre de projets restants, null si illimité
     */
    public function getRemainingProjects(int $userId): ?int
    {
        $user = $this->findById($userId);

        if ($user === null)
            return 0;

        $subscriptionType = $user['subscription_type'] ?? SUBSCRIPTION_FREE;

        // [AI:Claude] Quotas projets v0.14.0 - FREE 3 projets, PLUS 7 projets, PRO illimité
        $unlimitedPlans = [SUBSCRIPTION_PRO, SUBSCRIPTION_PRO_ANNUAL, SUBSCRIPTION_EARLY_BIRD, SUBSCRIPTION_PREMIUM];
        if (in_array($subscriptionType, $unlimitedPlans))
            return null; // Illimité

        $quotas = [
            SUBSCRIPTION_FREE => (int)($_ENV['MAX_PROJECTS_FREE'] ?? 3),
            SUBSCRIPTION_PLUS => (int)($_ENV['MAX_PROJECTS_PLUS'] ?? 7),
            SUBSCRIPTION_PLUS_ANNUAL => (int)($_ENV['MAX_PROJECTS_PLUS'] ?? 7),
            // Legacy support
            SUBSCRIPTION_STARTER => (int)($_ENV['MAX_PROJECTS_PLUS'] ?? 7)
        ];

        $maxProjects = $quotas[$subscriptionType] ?? $quotas[SUBSCRIPTION_FREE];

        // [AI:Claude] Compter les projets existants de l'utilisateur
        $sql = "SELECT COUNT(*) as count FROM projects WHERE user_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['user_id' => $userId]);
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        $currentCount = (int)($result['count'] ?? 0);

        return max(0, $maxProjects - $currentCount);
    }

    /**
     * [AI:Claude] Mettre à jour l'ID client Stripe
     *
     * @param int $userId ID de l'utilisateur
     * @param string $stripeCustomerId ID client Stripe
     * @return bool Succès de la mise à jour
     */
    public function updateStripeCustomerId(int $userId, string $stripeCustomerId): bool
    {
        return $this->update($userId, ['stripe_customer_id' => $stripeCustomerId]);
    }

    /**
     * [AI:Claude] Marquer l'email comme vérifié
     *
     * @param int $userId ID de l'utilisateur
     * @return bool Succès de la mise à jour
     */
    public function verifyEmail(int $userId): bool
    {
        return $this->update($userId, ['email_verified' => true]);
    }
}
