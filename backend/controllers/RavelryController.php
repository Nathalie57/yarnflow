<?php
/**
 * @file RavelryController.php
 * @brief Connexion/déconnexion OAuth2 à un compte Ravelry (Palier 1 — pas d'import)
 * @author Nathalie + AI Assistants
 * @created 2026-08-25
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\RavelryService;
use App\Utils\Response;

class RavelryController
{
    private RavelryService $ravelryService;
    private AuthMiddleware $authMiddleware;
    private \PDO $db;

    public function __construct()
    {
        $this->ravelryService = new RavelryService();
        $this->authMiddleware = new AuthMiddleware();
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * GET /api/ravelry/connect (authentifié)
     * Génère un état CSRF et renvoie l'URL d'autorisation Ravelry.
     */
    public function connectStart(): void
    {
        $userId = $this->getUserIdFromAuth();

        $state = bin2hex(random_bytes(16));

        // [AI:Claude] Une seule tentative de connexion en attente à la fois par utilisatrice
        $this->db->prepare('DELETE FROM ravelry_oauth_pending WHERE user_id = :user_id')
            ->execute(['user_id' => $userId]);

        $this->db->prepare('INSERT INTO ravelry_oauth_pending (user_id, state) VALUES (:user_id, :state)')
            ->execute(['user_id' => $userId, 'state' => $state]);

        Response::success([
            'authorize_url' => $this->ravelryService->getAuthorizeUrl($state),
        ]);
    }

    /**
     * GET /api/ravelry/callback?code=...&state=... (public — appelé depuis le frontend
     * après la redirection Ravelry, l'identité vient du state, pas d'un JWT)
     */
    public function connectCallback(): void
    {
        $code = $_GET['code'] ?? null;
        $state = $_GET['state'] ?? null;

        if (!$code || !$state) {
            Response::error('Paramètres OAuth manquants', HTTP_BAD_REQUEST);
            return;
        }

        $stmt = $this->db->prepare('SELECT user_id FROM ravelry_oauth_pending WHERE state = :state');
        $stmt->execute(['state' => $state]);
        $pending = $stmt->fetch();

        if (!$pending) {
            Response::error('État OAuth invalide ou expiré', HTTP_UNAUTHORIZED);
            return;
        }

        $userId = (int)$pending['user_id'];
        $this->assertTesterAccess($userId);

        // [AI:Claude] État à usage unique, consommé qu'on réussisse ou non
        $this->db->prepare('DELETE FROM ravelry_oauth_pending WHERE state = :state')
            ->execute(['state' => $state]);

        $tokenData = $this->ravelryService->exchangeCodeForToken($code);

        if (!$tokenData || !isset($tokenData['access_token'])) {
            Response::error('Erreur lors de l\'authentification Ravelry', HTTP_UNAUTHORIZED);
            return;
        }

        $ravelryUser = $this->ravelryService->fetchCurrentUser($tokenData['access_token']);

        if (!$ravelryUser) {
            Response::error('Impossible de récupérer le compte Ravelry', HTTP_UNAUTHORIZED);
            return;
        }

        $expiresAt = date('Y-m-d H:i:s', time() + (int)($tokenData['expires_in'] ?? 86400));

        $stmt = $this->db->prepare(
            'INSERT INTO ravelry_connections
                (user_id, ravelry_user_id, ravelry_username, access_token, refresh_token, token_expires_at, status, connected_at)
             VALUES (:user_id, :ravelry_user_id, :ravelry_username, :access_token, :refresh_token, :token_expires_at, "connected", NOW())
             ON DUPLICATE KEY UPDATE
                ravelry_user_id = VALUES(ravelry_user_id),
                ravelry_username = VALUES(ravelry_username),
                access_token = VALUES(access_token),
                refresh_token = VALUES(refresh_token),
                token_expires_at = VALUES(token_expires_at),
                status = "connected",
                connected_at = NOW(),
                revoked_at = NULL'
        );
        $stmt->execute([
            'user_id' => $userId,
            'ravelry_user_id' => $ravelryUser['id'] ?? null,
            'ravelry_username' => $ravelryUser['username'] ?? null,
            'access_token' => $this->encryptSecret($tokenData['access_token']),
            'refresh_token' => isset($tokenData['refresh_token']) ? $this->encryptSecret($tokenData['refresh_token']) : null,
            'token_expires_at' => $expiresAt,
        ]);

        Response::success([
            'ravelry_username' => $ravelryUser['username'] ?? null,
        ], HTTP_OK, 'Compte Ravelry connecté');
    }

    /**
     * POST /api/ravelry/disconnect (authentifié)
     */
    public function disconnect(): void
    {
        $userId = $this->getUserIdFromAuth();

        $this->db->prepare(
            'UPDATE ravelry_connections
             SET status = "revoked", revoked_at = NOW(), access_token = NULL, refresh_token = NULL
             WHERE user_id = :user_id'
        )->execute(['user_id' => $userId]);

        Response::success(null, HTTP_OK, 'Compte Ravelry déconnecté');
    }

    /**
     * GET /api/ravelry/status (authentifié)
     */
    public function status(): void
    {
        $userId = $this->getUserIdFromAuth();

        $stmt = $this->db->prepare(
            'SELECT ravelry_username, status, connected_at, last_stash_synced_at, last_library_synced_at
             FROM ravelry_connections WHERE user_id = :user_id'
        );
        $stmt->execute(['user_id' => $userId]);
        $connection = $stmt->fetch();

        Response::success([
            'connected' => $connection !== false && $connection['status'] === 'connected',
            'ravelry_username' => $connection['ravelry_username'] ?? null,
            'connected_at' => $connection['connected_at'] ?? null,
            'last_stash_synced_at' => $connection['last_stash_synced_at'] ?? null,
            'last_library_synced_at' => $connection['last_library_synced_at'] ?? null,
        ]);
    }

    // [AI:Claude] 2026-09-07 — TEMPORAIRE : intégration jamais testée en conditions réelles,
    // déployée pendant un pic de trafic organique (staging indisponible). Réservée à
    // l'utilisatrice elle-même le temps de valider que ça fonctionne, avant ouverture à
    // toutes. À retirer (ainsi que dans connectCallback()) une fois la validation faite.
    private const TESTER_USER_ID = 7;

    private function assertTesterAccess(int $userId): void
    {
        if ($userId !== self::TESTER_USER_ID) {
            Response::error('Fonctionnalité pas encore disponible', HTTP_FORBIDDEN);
            exit;
        }
    }

    private function getUserIdFromAuth(): int
    {
        $userData = $this->authMiddleware->authenticate();
        if (!$userData) {
            exit;
        }
        $userId = (int)$userData['user_id'];
        $this->assertTesterAccess($userId);
        return $userId;
    }

    private function encryptSecret(string $value): string
    {
        $key = $_ENV['RAVELRY_TOKEN_ENC_KEY'] ?? '';
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($value, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        return base64_encode($iv . $encrypted);
    }
}
