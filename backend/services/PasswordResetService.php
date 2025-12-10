<?php
/**
 * @file PasswordResetService.php
 * @brief Service de réinitialisation de mot de passe
 * @author Claude AI Assistant
 * @created 2025-12-07
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use PDO;

class PasswordResetService
{
    private PDO $db;
    private EmailService $emailService;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
        $this->emailService = new EmailService();
    }

    /**
     * Demander une réinitialisation de mot de passe
     *
     * @param string $email Email de l'utilisateur
     * @return array Résultat de l'opération
     */
    public function requestPasswordReset(string $email): array
    {
        try {
            // Vérifier que FRONTEND_URL est configuré
            $frontendUrl = $_ENV['FRONTEND_URL'] ?? null;
            if (!$frontendUrl) {
                error_log("[PASSWORD RESET] FRONTEND_URL non configuré dans .env");
                // On retourne quand même success pour ne pas révéler d'infos
                return [
                    'success' => true,
                    'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
                ];
            }

            // Vérifier que l'utilisateur existe
            $query = "SELECT id, email, first_name FROM users WHERE email = :email";
            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':email', $email, PDO::PARAM_STR);
            $stmt->execute();

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                // Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
                error_log("[PASSWORD RESET] Email non trouvé: $email");
                return [
                    'success' => true,
                    'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
                ];
            }

            // Générer un token unique
            $token = bin2hex(random_bytes(32));

            // Token valide 24 heures (temporaire pour debug)
            $expiresAt = date('Y-m-d H:i:s', time() + 86400);

            // Invalider les anciens tokens de cet utilisateur
            $invalidateQuery = "UPDATE password_resets SET used = TRUE WHERE user_id = :user_id AND used = FALSE";
            $invalidateStmt = $this->db->prepare($invalidateQuery);
            $invalidateStmt->bindValue(':user_id', $user['id'], PDO::PARAM_INT);
            $invalidateStmt->execute();

            // Créer le nouveau token
            $insertQuery = "INSERT INTO password_resets (user_id, token, expires_at)
                           VALUES (:user_id, :token, :expires_at)";
            $insertStmt = $this->db->prepare($insertQuery);
            $insertStmt->bindValue(':user_id', $user['id'], PDO::PARAM_INT);
            $insertStmt->bindValue(':token', $token, PDO::PARAM_STR);
            $insertStmt->bindValue(':expires_at', $expiresAt, PDO::PARAM_STR);
            $insertStmt->execute();

            // Envoyer l'email
            $resetLink = $frontendUrl . '/reset-password?token=' . $token;

            try {
                $emailSent = $this->emailService->sendPasswordResetEmail(
                    $user['email'],
                    $user['first_name'] ?? 'Utilisateur',
                    $resetLink
                );

                if (!$emailSent) {
                    error_log("[PASSWORD RESET] Échec envoi email pour user_id: " . $user['id']);
                }
            } catch (\Exception $emailError) {
                error_log("[PASSWORD RESET] Exception envoi email: " . $emailError->getMessage());
                // On continue quand même pour ne pas révéler si l'email existe
            }

            return [
                'success' => true,
                'message' => 'Un email de réinitialisation a été envoyé.'
            ];

        } catch (\Exception $e) {
            error_log("[PASSWORD RESET ERROR] " . $e->getMessage());
            error_log("[PASSWORD RESET TRACE] " . $e->getTraceAsString());
            return [
                'success' => false,
                'error' => 'Erreur lors de la demande de réinitialisation'
            ];
        }
    }

    /**
     * Vérifier qu'un token est valide
     *
     * @param string $token Token de réinitialisation
     * @return array Résultat avec user_id si valide
     */
    public function verifyToken(string $token): array
    {
        try {
            error_log("[TOKEN VERIFY] Token reçu: " . substr($token, 0, 20) . "... (longueur: " . strlen($token) . ")");

            $query = "SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.email
                     FROM password_resets pr
                     JOIN users u ON pr.user_id = u.id
                     WHERE pr.token = :token";

            $stmt = $this->db->prepare($query);
            $stmt->bindValue(':token', $token, PDO::PARAM_STR);
            $stmt->execute();

            $reset = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$reset) {
                error_log("[TOKEN VERIFY] Token non trouvé en base");
                return [
                    'valid' => false,
                    'error' => 'Token invalide'
                ];
            }

            error_log("[TOKEN VERIFY] Token trouvé - User: " . $reset['email'] . ", Utilisé: " . ($reset['used'] ? 'OUI' : 'NON') . ", Expire: " . $reset['expires_at']);

            if ($reset['used']) {
                error_log("[TOKEN VERIFY] Token déjà utilisé");
                return [
                    'valid' => false,
                    'error' => 'Ce lien a déjà été utilisé'
                ];
            }

            if (strtotime($reset['expires_at']) < time()) {
                error_log("[TOKEN VERIFY] Token expiré");
                return [
                    'valid' => false,
                    'error' => 'Ce lien a expiré'
                ];
            }

            error_log("[TOKEN VERIFY] Token VALIDE");
            return [
                'valid' => true,
                'user_id' => $reset['user_id'],
                'email' => $reset['email']
            ];

        } catch (\Exception $e) {
            error_log("[TOKEN VERIFY ERROR] " . $e->getMessage());
            return [
                'valid' => false,
                'error' => 'Erreur de vérification'
            ];
        }
    }

    /**
     * Réinitialiser le mot de passe
     *
     * @param string $token Token de réinitialisation
     * @param string $newPassword Nouveau mot de passe
     * @return array Résultat de l'opération
     */
    public function resetPassword(string $token, string $newPassword): array
    {
        try {
            // Vérifier le token
            $verification = $this->verifyToken($token);

            if (!$verification['valid']) {
                return [
                    'success' => false,
                    'error' => $verification['error']
                ];
            }

            $userId = $verification['user_id'];

            // Valider le mot de passe
            if (strlen($newPassword) < 8) {
                return [
                    'success' => false,
                    'error' => 'Le mot de passe doit contenir au moins 8 caractères'
                ];
            }

            // Hasher le nouveau mot de passe
            $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

            // Mettre à jour le mot de passe
            $updateQuery = "UPDATE users SET password = :password WHERE id = :id";
            $updateStmt = $this->db->prepare($updateQuery);
            $updateStmt->bindValue(':password', $hashedPassword, PDO::PARAM_STR);
            $updateStmt->bindValue(':id', $userId, PDO::PARAM_INT);
            $updateStmt->execute();

            // Marquer le token comme utilisé
            $markUsedQuery = "UPDATE password_resets SET used = TRUE WHERE token = :token";
            $markUsedStmt = $this->db->prepare($markUsedQuery);
            $markUsedStmt->bindValue(':token', $token, PDO::PARAM_STR);
            $markUsedStmt->execute();

            return [
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès'
            ];

        } catch (\Exception $e) {
            error_log("[PASSWORD RESET ERROR] " . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Erreur lors de la réinitialisation'
            ];
        }
    }

    /**
     * Nettoyer les tokens expirés (à appeler via cron job)
     */
    public function cleanExpiredTokens(): int
    {
        try {
            $query = "DELETE FROM password_resets WHERE expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY)";
            $stmt = $this->db->prepare($query);
            $stmt->execute();

            return $stmt->rowCount();
        } catch (\Exception $e) {
            error_log("[CLEAN TOKENS ERROR] " . $e->getMessage());
            return 0;
        }
    }
}
