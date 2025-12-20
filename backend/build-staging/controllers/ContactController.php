<?php
/**
 * @file ContactController.php
 * @brief Contrôleur pour les messages de contact
 * @author Nathalie + AI Assistants
 * @created 2025-12-20
 * @modified 2025-12-20 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Services\JWTService;
use PDO;
use Exception;

class ContactController {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Envoie un message de contact
     * POST /api/contact
     */
    public function sendMessage() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);

            // Récupérer l'utilisateur connecté si disponible
            $userId = null;
            $userName = $data['name'] ?? '';
            $userEmail = $data['email'] ?? '';

            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                try {
                    $jwtService = new JWTService();
                    $decoded = $jwtService->validateToken($matches[1]);

                    if ($decoded) {
                        $userId = $decoded['user_id'];

                        // Si connecté, récupérer nom et email de la BDD
                        $stmt = $this->db->prepare("SELECT first_name, last_name, email FROM users WHERE id = ?");
                        $stmt->execute([$userId]);
                        $user = $stmt->fetch(PDO::FETCH_ASSOC);
                        if ($user) {
                            $userName = trim($user['first_name'] . ' ' . $user['last_name']);
                            $userEmail = $user['email'];
                        }
                    }
                } catch (Exception $e) {
                    // Token invalide, l'utilisateur n'est pas connecté
                }
            }

            // Validation des champs requis pour utilisateurs non connectés
            if (!$userId) {
                if (empty($data['name']) || empty($data['email'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Nom et email requis']);
                    return;
                }

                if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Email invalide']);
                    return;
                }
            }

            // Validation des autres champs
            if (empty($data['subject']) || empty($data['message'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Sujet et message requis']);
                return;
            }

            $category = $data['category'] ?? 'other';
            if (!in_array($category, ['bug', 'question', 'suggestion', 'other'])) {
                $category = 'other';
            }

            // Limites de caractères
            if (strlen($data['subject']) > 200) {
                http_response_code(400);
                echo json_encode(['error' => 'Le sujet ne peut pas dépasser 200 caractères']);
                return;
            }

            if (strlen($data['message']) > 5000) {
                http_response_code(400);
                echo json_encode(['error' => 'Le message ne peut pas dépasser 5000 caractères']);
                return;
            }

            // Rate limiting (3 messages max par heure par IP)
            $ipAddress = $this->getClientIP();
            if (!$this->checkRateLimit($ipAddress)) {
                http_response_code(429);
                echo json_encode(['error' => 'Trop de messages envoyés. Veuillez réessayer dans 1 heure.']);
                return;
            }

            // Insérer le message en BDD
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

            $stmt = $this->db->prepare("
                INSERT INTO contact_messages
                (user_id, name, email, category, subject, message, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $userId,
                $userName,
                $userEmail,
                $category,
                $data['subject'],
                $data['message'],
                $ipAddress,
                $userAgent
            ]);

            $messageId = $this->db->lastInsertId();

            // Envoyer les emails
            $this->sendNotificationEmails($messageId, $userName, $userEmail, $category, $data['subject'], $data['message']);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
                'id' => $messageId
            ]);

        } catch (Exception $e) {
            error_log("Erreur sendMessage: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Erreur lors de l\'envoi du message']);
        }
    }

    /**
     * Récupère l'IP du client (compatible proxies)
     */
    private function getClientIP() {
        $ipAddress = '';

        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else {
            $ipAddress = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        }

        return $ipAddress;
    }

    /**
     * Vérifie le rate limit (3 messages/heure max)
     */
    private function checkRateLimit($ipAddress) {
        // Nettoyer les anciennes entrées (> 1 heure)
        $stmt = $this->db->prepare("
            DELETE FROM contact_rate_limit
            WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $stmt->execute();

        // Vérifier le compteur actuel
        $stmt = $this->db->prepare("
            SELECT message_count, window_start
            FROM contact_rate_limit
            WHERE ip_address = ?
        ");
        $stmt->execute([$ipAddress]);
        $rateLimit = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rateLimit) {
            // Première requête dans cette fenêtre
            $stmt = $this->db->prepare("
                INSERT INTO contact_rate_limit (ip_address, message_count, window_start)
                VALUES (?, 1, NOW())
                ON DUPLICATE KEY UPDATE message_count = 1, window_start = NOW()
            ");
            $stmt->execute([$ipAddress]);
            return true;
        }

        if ($rateLimit['message_count'] >= 3) {
            return false; // Rate limit dépassé
        }

        // Incrémenter le compteur
        $stmt = $this->db->prepare("
            UPDATE contact_rate_limit
            SET message_count = message_count + 1
            WHERE ip_address = ?
        ");
        $stmt->execute([$ipAddress]);

        return true;
    }

    /**
     * Envoie les emails de notification
     */
    private function sendNotificationEmails($messageId, $name, $email, $category, $subject, $message) {
        // CONTACT_EMAIL = adresse qui REÇOIT les messages de contact
        $contactEmail = $_ENV['CONTACT_EMAIL'] ?? 'contact@yarnflow.fr';
        // FROM_EMAIL = adresse d'expédition (peut être noreply@)
        $fromEmail = $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@yarnflow.fr';
        $appName = 'YarnFlow';

        // Emoji selon la catégorie
        $categoryEmoji = [
            'bug' => '🐛',
            'question' => '❓',
            'suggestion' => '💡',
            'other' => '📧'
        ];

        $categoryLabels = [
            'bug' => 'Bug',
            'question' => 'Question',
            'suggestion' => 'Suggestion',
            'other' => 'Autre'
        ];

        $emoji = $categoryEmoji[$category] ?? '📧';
        $categoryLabel = $categoryLabels[$category] ?? 'Autre';

        // Email à l'admin
        $adminSubject = "$emoji [$appName] Nouveau message de contact (#$messageId)";
        $adminBody = "
Nouveau message de contact reçu :

━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE #$messageId
━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 De : $name <$email>
📁 Catégorie : $categoryLabel
📌 Sujet : $subject

━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

$message

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Détails techniques :
• ID message : $messageId
• Date : " . date('d/m/Y à H:i:s') . "
• IP : " . $this->getClientIP() . "
• User Agent : " . ($_SERVER['HTTP_USER_AGENT'] ?? 'N/A') . "

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pour répondre, envoyez un email à : $email
";

        $this->sendEmail($contactEmail, $adminSubject, $adminBody);

        // Email de confirmation à l'utilisateur
        $userSubject = "✅ Message reçu - $appName";
        $userBody = "
Bonjour $name,

Nous avons bien reçu votre message et vous en remercions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOTRE MESSAGE (#$messageId)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sujet : $subject
Catégorie : $categoryLabel

$message

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre équipe vous répondra dans les plus brefs délais à l'adresse : $email

Merci de votre confiance ! 🧶

L'équipe $appName
$contactEmail
https://yarnflow.fr
";

        $this->sendEmail($email, $userSubject, $userBody);
    }

    /**
     * Envoie un email (wrapper pour faciliter les tests)
     */
    private function sendEmail($to, $subject, $body) {
        $contactEmail = $_ENV['CONTACT_EMAIL'] ?? 'contact@yarnflow.fr';

        $headers = "From: YarnFlow <$contactEmail>\r\n";
        $headers .= "Reply-To: $contactEmail\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

        // En dev, logger au lieu d'envoyer
        if (($_ENV['APP_ENV'] ?? 'development') === 'development') {
            error_log("=== EMAIL ===");
            error_log("To: $to");
            error_log("Subject: $subject");
            error_log("Body:\n$body");
            error_log("=============");
            return true;
        }

        return mail($to, $subject, $body, $headers);
    }

    /**
     * Liste les messages de contact (admin uniquement)
     * GET /api/admin/contact-messages
     */
    public function listMessages() {
        try {
            // Vérifier que l'utilisateur est admin
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Non authentifié']);
                return;
            }

            $jwtService = new JWTService();
            $decoded = $jwtService->validateToken($matches[1]);

            if (!$decoded) {
                http_response_code(401);
                echo json_encode(['error' => 'Token invalide']);
                return;
            }

            $stmt = $this->db->prepare("SELECT is_admin FROM users WHERE id = ?");
            $stmt->execute([$decoded['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !$user['is_admin']) {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
                return;
            }

            // Récupérer les paramètres de filtrage
            $status = $_GET['status'] ?? null;
            $category = $_GET['category'] ?? null;
            $limit = min((int)($_GET['limit'] ?? 50), 100);
            $offset = max((int)($_GET['offset'] ?? 0), 0);

            $where = [];
            $params = [];

            if ($status && in_array($status, ['unread', 'read', 'replied', 'archived'])) {
                $where[] = "status = ?";
                $params[] = $status;
            }

            if ($category && in_array($category, ['bug', 'question', 'suggestion', 'other'])) {
                $where[] = "category = ?";
                $params[] = $category;
            }

            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

            $stmt = $this->db->prepare("
                SELECT
                    id, user_id, name, email, category, subject,
                    LEFT(message, 200) as message_preview,
                    status, created_at, read_at
                FROM contact_messages
                $whereClause
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ");

            $params[] = $limit;
            $params[] = $offset;
            $stmt->execute($params);

            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Compter le total
            $countStmt = $this->db->prepare("SELECT COUNT(*) as total FROM contact_messages $whereClause");
            $countStmt->execute(array_slice($params, 0, -2));
            $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

            echo json_encode([
                'messages' => $messages,
                'total' => (int)$total,
                'limit' => $limit,
                'offset' => $offset
            ]);

        } catch (Exception $e) {
            error_log("Erreur listMessages: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Erreur serveur']);
        }
    }

    /**
     * Marque un message comme lu (admin uniquement)
     * PUT /api/admin/contact-messages/{id}/read
     */
    public function markAsRead($id) {
        try {
            // Vérifier que l'utilisateur est admin
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['error' => 'Non authentifié']);
                return;
            }

            $jwtService = new JWTService();
            $decoded = $jwtService->validateToken($matches[1]);

            if (!$decoded) {
                http_response_code(401);
                echo json_encode(['error' => 'Token invalide']);
                return;
            }

            $stmt = $this->db->prepare("SELECT is_admin FROM users WHERE id = ?");
            $stmt->execute([$decoded['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !$user['is_admin']) {
                http_response_code(403);
                echo json_encode(['error' => 'Accès refusé']);
                return;
            }

            $stmt = $this->db->prepare("
                UPDATE contact_messages
                SET status = 'read', read_at = NOW()
                WHERE id = ? AND status = 'unread'
            ");
            $stmt->execute([$id]);

            echo json_encode(['success' => true]);

        } catch (Exception $e) {
            error_log("Erreur markAsRead: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Erreur serveur']);
        }
    }
}
