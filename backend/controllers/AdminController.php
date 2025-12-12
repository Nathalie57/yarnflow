<?php
/**
 * @file AdminController.php
 * @brief Contrôleur pour l'administration de l'application
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création initiale
 *
 * @history
 *   2025-11-13 [AI:Claude] Création du contrôleur admin avec stats et gestion templates
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Models\Pattern;
use App\Models\Payment;
use App\Models\PatternTemplate;
use App\Utils\Response;
use App\Utils\Validator;

/**
 * [AI:Claude] Contrôleur d'administration (accès réservé aux admins)
 */
class AdminController
{
    private User $userModel;
    private Pattern $patternModel;
    private Payment $paymentModel;
    private PatternTemplate $templateModel;

    public function __construct()
    {
        $this->userModel = new User();
        $this->patternModel = new Pattern();
        $this->paymentModel = new Payment();
        $this->templateModel = new PatternTemplate();
    }

    /**
     * [AI:Claude] Vérifier que l'utilisateur est admin
     */
    private function requireAdmin(): ?array
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return null;

        if ($userData['role'] !== 'admin') {
            Response::error('Accès réservé aux administrateurs', HTTP_FORBIDDEN);
            return null;
        }

        return $userData;
    }

    /**
     * [AI:Claude] Obtenir les statistiques globales de l'application YarnFlow
     * GET /api/admin/stats
     * @modified 2025-12-12 - Mise à jour pour YarnFlow (projets + photos IA)
     */
    public function getStats(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $db = $this->userModel->getDb();

        // [AI:Claude] Statistiques utilisateurs
        $stmtUsers = $db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN subscription_type = 'free' THEN 1 ELSE 0 END) as free,
                SUM(CASE WHEN subscription_type = 'pro' THEN 1 ELSE 0 END) as pro,
                SUM(CASE WHEN subscription_type = 'pro_annual' THEN 1 ELSE 0 END) as pro_annual,
                SUM(CASE WHEN subscription_type = 'early_bird' THEN 1 ELSE 0 END) as early_bird,
                SUM(CASE WHEN DATE(created_at) >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END) as new_this_month
            FROM users
        ");
        $userStats = $stmtUsers->fetch(\PDO::FETCH_ASSOC);

        // [AI:Claude] Statistiques projets (CŒUR DE L'APP)
        $stmtProjects = $db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN technique = 'crochet' THEN 1 ELSE 0 END) as crochet,
                SUM(CASE WHEN technique = 'tricot' THEN 1 ELSE 0 END) as tricot,
                SUM(CASE WHEN DATE(created_at) >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END) as this_month
            FROM projects
        ");
        $projectStats = $stmtProjects->fetch(\PDO::FETCH_ASSOC);

        // [AI:Claude] Statistiques photos IA (AI PHOTO STUDIO)
        $stmtPhotos = $db->query("
            SELECT
                COUNT(*) as total,
                COUNT(DISTINCT user_id) as users_using_ai,
                SUM(CASE WHEN DATE(created_at) >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN 1 ELSE 0 END) as this_month
            FROM user_photos
            WHERE enhanced_path IS NOT NULL
        ");
        $photoStats = $stmtPhotos->fetch(\PDO::FETCH_ASSOC);

        // [AI:Claude] Crédits photos utilisés
        $stmtCredits = $db->query("
            SELECT
                COALESCE(SUM(monthly_credits), 0) as monthly_credits_allocated,
                COALESCE(SUM(purchased_credits), 0) as purchased_credits_total,
                COALESCE(SUM(credits_used_this_month), 0) as used_this_month,
                COALESCE(SUM(total_credits_used), 0) as total_used
            FROM user_photo_credits
        ");
        $creditStats = $stmtCredits->fetch(\PDO::FETCH_ASSOC);

        // [AI:Claude] Statistiques paiements
        $paymentStats = $this->paymentModel->getPaymentStats();

        // [AI:Claude] Revenus du mois en cours
        $currentMonthStart = date('Y-m-01');
        $currentMonthEnd = date('Y-m-t');
        $monthlyRevenue = $this->paymentModel->getTotalRevenue($currentMonthStart, $currentMonthEnd);

        // [AI:Claude] Derniers utilisateurs
        $stmtRecentUsers = $db->query("
            SELECT id, email, first_name, last_name, subscription_type, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $recentUsers = $stmtRecentUsers->fetchAll(\PDO::FETCH_ASSOC);

        // [AI:Claude] Derniers projets
        $stmtRecentProjects = $db->query("
            SELECT p.id, p.name, p.technique, p.status, p.created_at,
                   u.first_name, u.last_name
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 5
        ");
        $recentProjects = $stmtRecentProjects->fetchAll(\PDO::FETCH_ASSOC);

        Response::success([
            'users' => [
                'total' => (int)$userStats['total'],
                'free' => (int)$userStats['free'],
                'pro' => (int)$userStats['pro'],
                'pro_annual' => (int)$userStats['pro_annual'],
                'early_bird' => (int)$userStats['early_bird'],
                'new_this_month' => (int)$userStats['new_this_month']
            ],
            'projects' => [
                'total' => (int)$projectStats['total'],
                'in_progress' => (int)$projectStats['in_progress'],
                'completed' => (int)$projectStats['completed'],
                'crochet' => (int)$projectStats['crochet'],
                'tricot' => (int)$projectStats['tricot'],
                'this_month' => (int)$projectStats['this_month']
            ],
            'photos' => [
                'total_ai' => (int)$photoStats['total'],
                'users_using_ai' => (int)$photoStats['users_using_ai'],
                'this_month' => (int)$photoStats['this_month']
            ],
            'credits' => [
                'monthly_allocated' => (int)$creditStats['monthly_credits_allocated'],
                'purchased_total' => (int)$creditStats['purchased_credits_total'],
                'used_this_month' => (int)$creditStats['used_this_month'],
                'total_used' => (int)$creditStats['total_used']
            ],
            'subscriptions' => [
                'active' => (int)$userStats['pro'] + (int)$userStats['pro_annual'] + (int)$userStats['early_bird'],
                'pro' => (int)$userStats['pro'],
                'pro_annual' => (int)$userStats['pro_annual'],
                'early_bird' => (int)$userStats['early_bird']
            ],
            'revenue' => [
                'this_month' => $monthlyRevenue,
                'total' => $paymentStats['total_revenue']
            ],
            'recent_users' => $recentUsers,
            'recent_projects' => $recentProjects
        ]);
    }

    /**
     * [AI:Claude] Lister tous les utilisateurs
     * GET /api/admin/users
     */
    public function listUsers(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;

        $users = $this->userModel->findAll($limit, $offset);
        $total = $this->userModel->count([]);

        // [AI:Claude] Retirer les mots de passe
        foreach ($users as &$user) {
            unset($user['password']);
        }

        Response::success([
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]);
    }

    /**
     * [AI:Claude] Obtenir les détails d'un utilisateur
     * GET /api/admin/users/{id}
     */
    public function getUserDetails(int $userId): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $user = $this->userModel->findById($userId);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        unset($user['password']);

        // [AI:Claude] Statistiques de l'utilisateur
        $patterns = $this->patternModel->findByUserId($userId, 10);
        $payments = $this->paymentModel->findByUserId($userId, 10);
        $totalSpent = $this->paymentModel->getTotalPaidByUser($userId);

        Response::success([
            'user' => $user,
            'patterns' => $patterns,
            'payments' => $payments,
            'stats' => [
                'total_patterns' => count($patterns),
                'total_spent' => $totalSpent
            ]
        ]);
    }

    /**
     * [AI:Claude] Mettre à jour l'abonnement d'un utilisateur
     * PUT /api/admin/users/{id}/subscription
     */
    public function updateUserSubscription(int $userId): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['subscription_type'] ?? null, 'subscription_type')
            ->in($data['subscription_type'] ?? null, [SUBSCRIPTION_FREE, SUBSCRIPTION_MONTHLY, SUBSCRIPTION_YEARLY], 'subscription_type');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->findById($userId);

        if ($user === null)
            Response::notFound('Utilisateur introuvable');

        $subscriptionType = $data['subscription_type'];
        $expiresAt = null;

        if ($subscriptionType === SUBSCRIPTION_MONTHLY)
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 month'));
        elseif ($subscriptionType === SUBSCRIPTION_YEARLY)
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 year'));

        try {
            $this->userModel->updateSubscription($userId, $subscriptionType, $expiresAt);

            Response::success([], HTTP_OK, 'Abonnement mis à jour');

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur mise à jour abonnement : '.$e->getMessage());
            Response::serverError('Erreur lors de la mise à jour');
        }
    }

    /**
     * [AI:Claude] Lister tous les patrons (avec filtres)
     * GET /api/admin/patterns
     */
    public function listPatterns(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;
        $status = $_GET['status'] ?? null;

        $conditions = [];
        if ($status !== null)
            $conditions['status'] = $status;

        $patterns = $this->patternModel->findBy($conditions, $limit, $offset);
        $total = $this->patternModel->count($conditions);

        Response::success([
            'patterns' => $patterns,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]);
    }

    /**
     * [AI:Claude] Supprimer un patron
     * DELETE /api/admin/patterns/{id}
     */
    public function deletePattern(int $patternId): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $pattern = $this->patternModel->findById($patternId);

        if ($pattern === null)
            Response::notFound('Patron introuvable');

        try {
            $this->patternModel->delete($patternId);
            Response::success([], HTTP_OK, 'Patron supprimé');

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur suppression patron : '.$e->getMessage());
            Response::serverError('Erreur lors de la suppression');
        }
    }

    /**
     * [AI:Claude] Lister tous les pattern templates
     * GET /api/admin/templates
     */
    public function listTemplates(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 50);
        $offset = ($page - 1) * $limit;

        $templates = $this->templateModel->findAll($limit, $offset);
        $total = $this->templateModel->count([]);

        Response::success([
            'templates' => $templates,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]);
    }

    /**
     * [AI:Claude] Créer un nouveau pattern template
     * POST /api/admin/templates
     */
    public function createTemplate(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['name'] ?? null, 'name')
            ->required($data['type'] ?? null, 'type')
            ->required($data['level'] ?? null, 'level')
            ->required($data['content'] ?? null, 'content');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        try {
            $templateId = $this->templateModel->createTemplate([
                'name' => $data['name'],
                'type' => $data['type'],
                'subtype' => $data['subtype'] ?? null,
                'level' => $data['level'],
                'size' => $data['size'] ?? null,
                'content' => is_string($data['content']) ? $data['content'] : json_encode($data['content']),
                'tags' => isset($data['tags']) ? json_encode($data['tags']) : null,
                'is_active' => $data['is_active'] ?? true
            ]);

            $template = $this->templateModel->findById($templateId);

            Response::created([
                'template' => $template
            ], 'Template créé avec succès');

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur création template : '.$e->getMessage());
            Response::serverError('Erreur lors de la création du template');
        }
    }

    /**
     * [AI:Claude] Mettre à jour un pattern template
     * PUT /api/admin/templates/{id}
     */
    public function updateTemplate(int $templateId): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $template = $this->templateModel->findById($templateId);

        if ($template === null)
            Response::notFound('Template introuvable');

        $data = json_decode(file_get_contents('php://input'), true);

        $updateData = [];

        if (isset($data['name']))
            $updateData['name'] = $data['name'];

        if (isset($data['type']))
            $updateData['type'] = $data['type'];

        if (isset($data['subtype']))
            $updateData['subtype'] = $data['subtype'];

        if (isset($data['level']))
            $updateData['level'] = $data['level'];

        if (isset($data['size']))
            $updateData['size'] = $data['size'];

        if (isset($data['content']))
            $updateData['content'] = is_string($data['content']) ? $data['content'] : json_encode($data['content']);

        if (isset($data['tags']))
            $updateData['tags'] = json_encode($data['tags']);

        if (isset($data['is_active']))
            $updateData['is_active'] = $data['is_active'];

        if (empty($updateData))
            Response::error('Aucune donnée à mettre à jour', HTTP_UNPROCESSABLE);

        try {
            $this->templateModel->update($templateId, $updateData);

            $updated = $this->templateModel->findById($templateId);

            Response::success([
                'template' => $updated
            ], HTTP_OK, 'Template mis à jour');

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur mise à jour template : '.$e->getMessage());
            Response::serverError('Erreur lors de la mise à jour');
        }
    }

    /**
     * [AI:Claude] Supprimer un pattern template
     * DELETE /api/admin/templates/{id}
     */
    public function deleteTemplate(int $templateId): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $template = $this->templateModel->findById($templateId);

        if ($template === null)
            Response::notFound('Template introuvable');

        try {
            $this->templateModel->delete($templateId);
            Response::success([], HTTP_OK, 'Template supprimé');

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur suppression template : '.$e->getMessage());
            Response::serverError('Erreur lors de la suppression');
        }
    }

    /**
     * [AI:Claude] Lister tous les paiements récents
     * GET /api/admin/payments
     */
    public function listPayments(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $limit = (int)($_GET['limit'] ?? 50);
        $payments = $this->paymentModel->getRecentPayments($limit);

        Response::success([
            'payments' => $payments
        ]);
    }

    /**
     * [AI:Claude] Générer les codes Early Bird pour tous les inscrits waitlist
     * POST /api/admin/early-bird/generate-codes
     *
     * Body optionnel :
     * - validity_hours : Durée de validité en heures (défaut: 72h)
     */
    public function generateEarlyBirdCodes(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);
        $validityHours = $data['validity_hours'] ?? 72;

        try {
            $earlyBirdService = new \Services\EarlyBirdCodeService($this->userModel->getDb());
            $result = $earlyBirdService->generateCodesForWaitlist($validityHours);

            if (!$result['success']) {
                Response::error($result['message'], HTTP_UNPROCESSABLE);
            }

            Response::success([
                'total_emails' => $result['total'],
                'new_codes' => $result['new_codes'],
                'existing_codes' => $result['existing_codes'],
                'validity_hours' => $validityHours,
                'expires_at' => date('Y-m-d H:i:s', strtotime("+{$validityHours} hours")),
                'codes' => $result['codes']
            ], HTTP_OK, "Codes Early Bird générés avec succès");

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur génération codes Early Bird : '.$e->getMessage());
            Response::serverError('Erreur lors de la génération des codes');
        }
    }

    /**
     * [AI:Claude] Obtenir les statistiques des codes Early Bird
     * GET /api/admin/early-bird/stats
     */
    public function getEarlyBirdStats(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        try {
            $earlyBirdService = new \Services\EarlyBirdCodeService($this->userModel->getDb());

            $stats = $earlyBirdService->getStats();
            $availability = $earlyBirdService->checkEarlyBirdAvailability();

            // Récupérer les codes actifs
            $stmt = $this->userModel->getDb()->query("
                SELECT * FROM v_early_bird_codes_active
                ORDER BY hours_remaining ASC
                LIMIT 100
            ");
            $activeCodes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            Response::success([
                'codes' => $stats,
                'availability' => $availability,
                'active_codes' => $activeCodes
            ]);

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur stats Early Bird : '.$e->getMessage());
            Response::serverError('Erreur lors de la récupération des stats');
        }
    }

    /**
     * [AI:Claude] Récupérer le code d'un email spécifique
     * GET /api/admin/early-bird/code?email=xxx@example.com
     */
    public function getEarlyBirdCodeByEmail(): void
    {
        $userData = $this->requireAdmin();
        if ($userData === null)
            return;

        $email = $_GET['email'] ?? null;

        if (empty($email)) {
            Response::error('Email requis', HTTP_UNPROCESSABLE);
        }

        try {
            $earlyBirdService = new \Services\EarlyBirdCodeService($this->userModel->getDb());
            $code = $earlyBirdService->getCodeByEmail($email);

            if ($code === null) {
                Response::notFound("Aucun code trouvé pour l'email : {$email}");
            }

            Response::success([
                'email' => $email,
                'code_data' => $code
            ]);

        } catch (\Exception $e) {
            error_log('[AdminController] Erreur recherche code : '.$e->getMessage());
            Response::serverError('Erreur lors de la recherche');
        }
    }
}
