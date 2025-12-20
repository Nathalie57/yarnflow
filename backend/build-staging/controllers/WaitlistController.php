<?php
/**
 * @file WaitlistController.php
 * @brief Contrôleur pour la waitlist landing page
 * @author YarnFlow Team + AI Assistants
 * @created 2025-11-20
 * @version 0.12.0
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Utils\Response;
use App\Utils\Validator;
use App\Services\EmailService;

class WaitlistController
{
    private \PDO $db;
    private EmailService $emailService;

    public function __construct()
    {
        $this->db = \App\Config\Database::getInstance()->getConnection();
        $this->emailService = new EmailService();
    }

    /**
     * Inscrire un email à la waitlist
     * POST /api/waitlist/subscribe
     */
    public function subscribe(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validation
        $validator = new Validator();
        $validator
            ->required($data['email'] ?? null, 'email')
            ->email($data['email'] ?? null, 'email');

        if ($validator->fails()) {
            Response::validationError($validator->getErrors());
        }

        $email = strtolower(trim($data['email']));
        $name = $data['name'] ?? null;
        $interests = $data['interests'] ?? null;
        $source = $data['source'] ?? null;

        // Récupérer IP et User Agent
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        try {
            // Vérifier si l'email existe déjà
            $stmt = $this->db->prepare('SELECT id FROM waitlist_emails WHERE email = ?');
            $stmt->execute([$email]);

            if ($stmt->fetch()) {
                Response::error('Cet email est déjà inscrit !', 409);
            }

            // Insérer le nouvel inscrit
            $stmt = $this->db->prepare('
                INSERT INTO waitlist_emails (email, name, interests, source, ip_address, user_agent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ');

            $stmt->execute([
                $email,
                $name,
                $interests,
                $source,
                $ipAddress,
                $userAgent
            ]);

            // Incrémenter le compteur
            $this->db->exec('UPDATE waitlist_stats SET total_subscribers = total_subscribers + 1 WHERE id = 1');

            // Envoyer l'email de bienvenue
            try {
                $this->emailService->sendWelcomeEmail($email, $name);
                error_log("[WaitlistController] Email de bienvenue envoyé à {$email}");
            } catch (\Exception $emailError) {
                // Ne pas bloquer l'inscription si l'email échoue
                error_log("[WaitlistController] Erreur envoi email (inscription OK) : " . $emailError->getMessage());
            }

            Response::created([
                'message' => 'Inscription réussie !',
                'email' => $email
            ], 'Bienvenue dans la waitlist YarnFlow ! 🎉');

        } catch (\Exception $e) {
            error_log('[WaitlistController] Erreur inscription : ' . $e->getMessage());
            Response::serverError('Erreur lors de l\'inscription');
        }
    }

    /**
     * Obtenir le nombre d'inscrits
     * GET /api/waitlist/count
     */
    public function getCount(): void
    {
        try {
            $stmt = $this->db->query('SELECT total_subscribers FROM waitlist_stats WHERE id = 1');
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);

            $count = $result['total_subscribers'] ?? 0;

            Response::success([
                'count' => (int)$count
            ]);

        } catch (\Exception $e) {
            error_log('[WaitlistController] Erreur count : ' . $e->getMessage());
            Response::success(['count' => 0]);
        }
    }

    /**
     * Obtenir tous les inscrits (ADMIN ONLY)
     * GET /api/waitlist/subscribers
     */
    public function getSubscribers(): void
    {
        // Vérifier que l'utilisateur est admin
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null) {
            return;
        }

        // Vérifier le rôle admin
        $userModel = new \App\Models\User();
        $user = $userModel->findById($userData['user_id']);

        if (!$user || $user['role'] !== 'admin') {
            Response::error('Accès refusé', 403);
        }

        try {
            $stmt = $this->db->query('
                SELECT id, email, name, interests, source, created_at
                FROM waitlist_emails
                ORDER BY created_at DESC
            ');

            $subscribers = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            Response::success([
                'subscribers' => $subscribers,
                'total' => count($subscribers)
            ]);

        } catch (\Exception $e) {
            error_log('[WaitlistController] Erreur subscribers : ' . $e->getMessage());
            Response::serverError('Erreur lors de la récupération des inscrits');
        }
    }
}
