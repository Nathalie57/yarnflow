<?php
/**
 * @file JWTService.php
 * @brief Service de gestion des tokens JWT
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;

/**
 * [AI:Claude] Service de gestion des JSON Web Tokens pour l'authentification
 */
class JWTService
{
    private string $secret;
    private int $expiration;
    private string $algorithm = 'HS256';

    public function __construct()
    {
        $this->secret = $_ENV['JWT_SECRET'] ?? 'change_this_secret_key';
        $this->expiration = (int)($_ENV['JWT_EXPIRATION'] ?? 604800);
    }

    /**
     * [AI:Claude] Générer un token JWT pour un utilisateur
     *
     * @param array $user Données utilisateur
     * @return string Token JWT
     */
    public function generateToken(array $user): string
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + $this->expiration;

        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'data' => [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'subscription_type' => $user['subscription_type']
            ]
        ];

        return JWT::encode($payload, $this->secret, $this->algorithm);
    }

    /**
     * [AI:Claude] Valider et décoder un token JWT
     *
     * @param string $token Token à valider
     * @return array|null Données du token ou null si invalide
     */
    public function validateToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            return (array)$decoded->data;
        } catch (ExpiredException $e) {
            error_log('[JWT] Token expiré : '.$e->getMessage());
            return null;
        } catch (SignatureInvalidException $e) {
            error_log('[JWT] Signature invalide : '.$e->getMessage());
            return null;
        } catch (\Exception $e) {
            error_log('[JWT] Erreur validation : '.$e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Extraire le token du header Authorization
     *
     * @param string|null $authHeader Header Authorization
     * @return string|null Token ou null
     */
    public function extractTokenFromHeader(?string $authHeader): ?string
    {
        if ($authHeader === null)
            return null;

        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches))
            return $matches[1];

        return null;
    }

    /**
     * [AI:Claude] Rafraîchir un token (générer un nouveau avec même données)
     *
     * @param string $token Ancien token
     * @return string|null Nouveau token ou null si ancien invalide
     */
    public function refreshToken(string $token): ?string
    {
        $userData = $this->validateToken($token);

        if ($userData === null)
            return null;

        return $this->generateToken((array)$userData);
    }

    /**
     * [AI:Claude] Vérifier si un token est expiré
     *
     * @param string $token Token à vérifier
     * @return bool True si expiré
     */
    public function isTokenExpired(string $token): bool
    {
        try {
            JWT::decode($token, new Key($this->secret, $this->algorithm));
            return false;
        } catch (ExpiredException $e) {
            return true;
        } catch (\Exception $e) {
            return true;
        }
    }

    /**
     * [AI:Claude] Obtenir le temps restant avant expiration (en secondes)
     *
     * @param string $token Token à vérifier
     * @return int|null Secondes restantes ou null si invalide
     */
    public function getTimeToExpiration(string $token): ?int
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret, $this->algorithm));
            $expirationTime = $decoded->exp;
            $currentTime = time();

            return max(0, $expirationTime - $currentTime);
        } catch (\Exception $e) {
            return null;
        }
    }
}
