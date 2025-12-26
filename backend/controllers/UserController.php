<?php
/**
 * @file UserController.php
 * @brief Contrôleur pour la gestion du profil utilisateur
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-17 by [AI:Claude] - Ajout compteur photos dans getDashboard
 *
 * @history
 *   2025-11-17 [AI:Claude] Ajout compteur total_photos dans stats dashboard
 *   2025-11-13 [AI:Claude] Création du contrôleur utilisateur avec gestion profil
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Models\Pattern;
use App\Models\Payment;
use App\Models\Project;
use App\Utils\Response;
use App\Utils\Validator;

/**
 * [AI:Claude] Contrôleur de gestion du profil utilisateur
 */
class UserController
{
    private User $userModel;
    private Pattern $patternModel;
    private Payment $paymentModel;
    private Project $projectModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->patternModel = new Pattern();
        $this->paymentModel = new Payment();
        $this->projectModel = new Project();
    }

    /**
     * [AI:Claude] Obtenir le profil utilisateur avec statistiques
     * GET /api/user/profile
     */
    public function getProfile(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        unset($user['password']);

        // [AI:Claude] Statistiques projets tracker (calculées en temps réel)
        $projectStats = $this->projectModel->getUserStatsByPeriod($userData['user_id'], 'all');

        // [AI:Claude] Compter les photos générées par l'IA
        $db = \App\Config\Database::getInstance()->getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) as ai_photos_count FROM user_photos WHERE user_id = ? AND enhanced_path IS NOT NULL');
        $stmt->execute([$userData['user_id']]);
        $aiPhotosCount = $stmt->fetch(\PDO::FETCH_ASSOC)['ai_photos_count'] ?? 0;

        // [AI:Claude] Crédits photos restants
        $stmt = $db->prepare('SELECT monthly_credits, purchased_credits, credits_used_this_month FROM user_photo_credits WHERE user_id = ?');
        $stmt->execute([$userData['user_id']]);
        $credits = $stmt->fetch(\PDO::FETCH_ASSOC);
        $creditsRemaining = ($credits['monthly_credits'] ?? 0) + ($credits['purchased_credits'] ?? 0) - ($credits['credits_used_this_month'] ?? 0);

        $hasActiveSubscription = $this->userModel->hasActiveSubscription($user['id']);
        $totalSpent = $this->paymentModel->getTotalPaidByUser($user['id']);

        Response::success([
            'user' => $user,
            'stats' => [
                // [AI:Claude] Stats projets YarnFlow
                'total_projects' => $projectStats['total_projects'] ?? 0,
                'active_projects' => $projectStats['active_projects'] ?? 0,
                'completed_projects' => $projectStats['completed_projects'] ?? 0,
                'total_rows' => $projectStats['total_rows'] ?? 0,
                'total_time' => $projectStats['total_crochet_time'] ?? 0,
                // [AI:Claude] Stats photos IA
                'ai_photos_generated' => $aiPhotosCount,
                'photo_credits_remaining' => max(0, $creditsRemaining),
                // [AI:Claude] Stats abonnement
                'has_active_subscription' => $hasActiveSubscription,
                'total_spent' => $totalSpent
            ]
        ]);
    }

    /**
     * [AI:Claude] Mettre à jour le profil utilisateur
     * PUT /api/user/profile
     */
    public function updateProfile(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();

        if (isset($data['first_name']))
            $validator->minLength($data['first_name'], 2, 'first_name');

        if (isset($data['last_name']))
            $validator->minLength($data['last_name'], 2, 'last_name');

        if (isset($data['email'])) {
            $validator->email($data['email'], 'email');

            // [AI:Claude] Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
            $existingUser = $this->userModel->findByEmail($data['email']);
            if ($existingUser && $existingUser['id'] !== $userData['user_id'])
                Response::error('Cet email est déjà utilisé', HTTP_UNPROCESSABLE);
        }

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        // [AI:Claude] Préparer les données à mettre à jour
        $updateData = [];

        if (isset($data['first_name']))
            $updateData['first_name'] = $data['first_name'];

        if (isset($data['last_name']))
            $updateData['last_name'] = $data['last_name'];

        if (isset($data['email']))
            $updateData['email'] = $data['email'];

        if (empty($updateData))
            Response::error('Aucune donnée à mettre à jour', HTTP_UNPROCESSABLE);

        $updateData['updated_at'] = date('Y-m-d H:i:s');

        try {
            $this->userModel->update($userData['user_id'], $updateData);

            $user = $this->userModel->findById($userData['user_id']);
            unset($user['password']);

            Response::success([
                'user' => $user
            ], HTTP_OK, 'Profil mis à jour avec succès');

        } catch (\Exception $e) {
            error_log('[UserController] Erreur mise à jour profil : '.$e->getMessage());
            Response::serverError('Erreur lors de la mise à jour du profil');
        }
    }

    /**
     * [AI:Claude] Changer le mot de passe
     * PUT /api/user/password
     */
    public function changePassword(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['current_password'] ?? null, 'current_password')
            ->required($data['new_password'] ?? null, 'new_password')
            ->minLength($data['new_password'] ?? null, 6, 'new_password');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        // [AI:Claude] Vérifier que le mot de passe actuel est correct
        if (!password_verify($data['current_password'], $user['password']))
            Response::error('Mot de passe actuel incorrect', HTTP_UNAUTHORIZED);

        // [AI:Claude] Mettre à jour le mot de passe
        try {
            $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);

            $this->userModel->update($userData['user_id'], [
                'password' => $hashedPassword,
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            Response::success([], HTTP_OK, 'Mot de passe modifié avec succès');

        } catch (\Exception $e) {
            error_log('[UserController] Erreur changement mot de passe : '.$e->getMessage());
            Response::serverError('Erreur lors du changement de mot de passe');
        }
    }

    /**
     * [AI:Claude] Supprimer le compte utilisateur (RGPD compliant)
     * DELETE /api/user/account
     *
     * Cette fonction effectue une suppression complète et conforme RGPD :
     * 1. Annule l'abonnement Stripe si actif
     * 2. Supprime tous les projets et données associées
     * 3. Supprime toutes les photos
     * 4. Supprime la bibliothèque de patrons
     * 5. Anonymise l'utilisateur (au lieu de supprimer pour traçabilité légale)
     */
    public function deleteAccount(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator->required($data['password'] ?? null, 'password');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        // [AI:Claude] Vérifier le mot de passe avant suppression
        if (!password_verify($data['password'], $user['password']))
            Response::error('Mot de passe incorrect', HTTP_UNAUTHORIZED);

        $db = \App\Config\Database::getInstance()->getConnection();

        try {
            $db->beginTransaction();
            $userId = $userData['user_id'];

            // [AI:Claude] 1. Annuler l'abonnement Stripe si actif
            if (!empty($user['stripe_customer_id']) && !empty($user['stripe_subscription_id'])) {
                try {
                    $stripeService = new \App\Services\StripeService();
                    $stripeService->cancelSubscription($user['stripe_subscription_id']);
                    error_log("[UserController] Abonnement Stripe annulé pour user_id: $userId");
                } catch (\Exception $e) {
                    error_log("[UserController] Erreur annulation Stripe : " . $e->getMessage());
                    // Continuer même si Stripe échoue
                }
            }

            // [AI:Claude] 2. Supprimer toutes les photos utilisateur
            $db->prepare("DELETE FROM user_photos WHERE user_id = ?")->execute([$userId]);

            // [AI:Claude] 3. Supprimer les crédits photos
            $db->prepare("DELETE FROM user_photo_credits WHERE user_id = ?")->execute([$userId]);

            // [AI:Claude] 4. Supprimer les données de projets (cascade)
            // 4a. Supprimer les rows de projets
            $db->prepare("DELETE FROM project_rows WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)")->execute([$userId]);

            // 4b. Supprimer les sections de projets
            $db->prepare("DELETE FROM project_sections WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)")->execute([$userId]);

            // 4c. Supprimer les tags de projets
            $db->prepare("DELETE FROM project_tags WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)")->execute([$userId]);

            // 4d. Supprimer les stats de projets
            $db->prepare("DELETE FROM project_stats WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)")->execute([$userId]);

            // 4e. Supprimer les sessions de projets
            $db->prepare("DELETE FROM project_sessions WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?)")->execute([$userId]);

            // 4f. Supprimer les projets
            $db->prepare("DELETE FROM projects WHERE user_id = ?")->execute([$userId]);

            // [AI:Claude] 5. Supprimer la bibliothèque de patrons
            $db->prepare("DELETE FROM pattern_library WHERE user_id = ?")->execute([$userId]);

            // [AI:Claude] 6. Supprimer tous les anciens patrons
            $patterns = $this->patternModel->findByUserId($userId, 1000);
            foreach ($patterns as $pattern) {
                $this->patternModel->delete($pattern['id']);
            }

            // [AI:Claude] 7. Anonymiser les paiements (garder pour comptabilité légale)
            $db->prepare("
                UPDATE payments
                SET user_email = CONCAT('deleted_', user_id, '@anonymized.local')
                WHERE user_id = ?
            ")->execute([$userId]);

            // [AI:Claude] 8. Anonymiser les messages de contact
            $db->prepare("
                UPDATE contact_messages
                SET name = 'Utilisateur supprimé',
                    email = CONCAT('deleted_', user_id, '@anonymized.local'),
                    message = '[Message supprimé - compte utilisateur supprimé]'
                WHERE user_id = ?
            ")->execute([$userId]);

            // [AI:Claude] 9. Anonymiser l'utilisateur (au lieu de supprimer complètement)
            // Cela permet de garder une trace pour la comptabilité et les logs
            $db->prepare("
                UPDATE users
                SET email = CONCAT('deleted_', id, '@anonymized.local'),
                    first_name = 'Utilisateur',
                    last_name = 'Supprimé',
                    password = NULL,
                    stripe_customer_id = NULL,
                    stripe_subscription_id = NULL,
                    google_id = NULL,
                    facebook_id = NULL,
                    updated_at = NOW()
                WHERE id = ?
            ")->execute([$userId]);

            $db->commit();

            error_log("[UserController] Compte utilisateur $userId supprimé avec succès (RGPD)");
            Response::success([], HTTP_OK, 'Compte supprimé avec succès');

        } catch (\Exception $e) {
            $db->rollBack();
            error_log('[UserController] Erreur suppression compte : ' . $e->getMessage());
            Response::serverError('Erreur lors de la suppression du compte');
        }
    }

    /**
     * [AI:Claude] Obtenir le dashboard utilisateur
     * GET /api/user/dashboard
     */
    public function getDashboard(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        // [AI:Claude] Récupérer les derniers patrons
        $recentPatterns = $this->patternModel->findByUserId($userData['user_id'], 5);

        // [AI:Claude] Récupérer les derniers paiements
        $recentPayments = $this->paymentModel->findByUserId($userData['user_id'], 5);

        // [AI:Claude] Statistiques projets
        $projectStats = $this->projectModel->getUserStats($userData['user_id']);

        // [AI:Claude] Compter les photos générées par l'IA (celles qui ont coûté des crédits)
        $db = \App\Config\Database::getInstance()->getConnection();

        // [AI:Claude] Photos générées par IA = celles avec enhanced_path (ont utilisé des crédits)
        $stmt = $db->prepare('SELECT COUNT(*) as ai_photos_count FROM user_photos WHERE user_id = ? AND enhanced_path IS NOT NULL');
        $stmt->execute([$userData['user_id']]);
        $aiPhotosCount = $stmt->fetch(\PDO::FETCH_ASSOC)['ai_photos_count'] ?? 0;

        // [AI:Claude] Statistiques
        $stats = [
            'total_patterns' => $this->patternModel->count(['user_id' => $userData['user_id']]),
            'patterns_remaining' => $this->userModel->getRemainingPatterns($userData['user_id']),
            'has_active_subscription' => $this->userModel->hasActiveSubscription($userData['user_id']),
            'subscription_expires_at' => $user['subscription_expires_at'],
            'total_spent' => $this->paymentModel->getTotalPaidByUser($userData['user_id']),
            'member_since' => $user['created_at'],
            // [AI:Claude] Stats projets tracker
            'total_projects' => $projectStats['total_projects'] ?? 0,
            'active_projects' => $projectStats['in_progress'] ?? 0,
            'completed_projects' => $projectStats['completed'] ?? 0,
            'total_rows' => $projectStats['total_rows'] ?? 0,
            'total_time' => $projectStats['total_time'] ?? 0,
            // [AI:Claude] Stats photos IA (uniquement celles générées, qui ont coûté des crédits)
            'ai_photos_generated' => $aiPhotosCount
        ];

        Response::success([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'subscription_type' => $user['subscription_type']
            ],
            'stats' => $stats,
            'recent_patterns' => $recentPatterns,
            'recent_payments' => $recentPayments
        ]);
    }

    /**
     * [AI:Claude] Obtenir les informations d'abonnement
     * GET /api/user/subscription
     */
    public function getSubscription(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $user = $this->userModel->findById($userData['user_id']);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        $hasActiveSubscription = $this->userModel->hasActiveSubscription($userData['user_id']);
        $remainingPatterns = $this->userModel->getRemainingPatterns($userData['user_id']);

        // [AI:Claude] Calculer les jours restants si abonnement actif
        $daysRemaining = null;
        if ($hasActiveSubscription && $user['subscription_expires_at']) {
            $expiresAt = new \DateTime($user['subscription_expires_at']);
            $now = new \DateTime();
            $interval = $now->diff($expiresAt);
            $daysRemaining = (int)$interval->format('%a');
        }

        Response::success([
            'subscription' => [
                'type' => $user['subscription_type'],
                'is_active' => $hasActiveSubscription,
                'expires_at' => $user['subscription_expires_at'],
                'days_remaining' => $daysRemaining,
                'patterns_generated' => $user['patterns_generated_count'],
                'patterns_remaining' => $remainingPatterns
            ]
        ]);
    }
}
