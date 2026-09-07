<?php
/**
 * @file RavelryService.php
 * @brief Service OAuth2 pour la connexion à un compte Ravelry (Palier 1 — connexion seule)
 * @author Nathalie + AI Assistants
 * @created 2026-08-25
 *
 * [AI:Claude] Mirroir d'OAuthService.php (Google/Facebook), avec deux différences propres
 * à Ravelry : échange du code par Basic Auth (pas de "body auth", explicitement non supporté),
 * et scope "offline" pour obtenir un refresh_token (les jetons Ravelry expirent en 24h).
 */

declare(strict_types=1);

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\GuzzleException;

class RavelryService
{
    private const AUTHORIZE_URL = 'https://www.ravelry.com/oauth2/auth';
    private const TOKEN_URL = 'https://www.ravelry.com/oauth2/token';
    private const API_BASE = 'https://api.ravelry.com';

    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;
    private Client $httpClient;

    public function __construct()
    {
        $this->clientId = $_ENV['RAVELRY_CLIENT_ID'] ?? '';
        $this->clientSecret = $_ENV['RAVELRY_CLIENT_SECRET'] ?? '';
        $this->redirectUri = $_ENV['RAVELRY_REDIRECT_URI'] ?? '';

        $this->httpClient = new Client([
            'timeout' => 15,
        ]);
    }

    /**
     * [AI:Claude] URL vers laquelle rediriger l'utilisatrice pour autoriser YarnFlow.
     * scope=offline est indispensable pour recevoir un refresh_token.
     */
    public function getAuthorizeUrl(string $state): string
    {
        $params = [
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUri,
            'response_type' => 'code',
            'scope' => 'offline',
            'state' => $state,
        ];

        return self::AUTHORIZE_URL . '?' . http_build_query($params);
    }

    /**
     * [AI:Claude] Échange le code d'autorisation contre un access_token + refresh_token.
     * Ravelry exige une authentification Basic Auth pour cet appel ("body auth" refusé).
     */
    public function exchangeCodeForToken(string $code): ?array
    {
        return $this->postToTokenEndpoint([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->redirectUri,
        ]);
    }

    /**
     * [AI:Claude] Rafraîchit un access_token expiré (durée de vie de 24h) via le refresh_token.
     */
    public function refreshToken(string $refreshToken): ?array
    {
        return $this->postToTokenEndpoint([
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]);
    }

    private function postToTokenEndpoint(array $params): ?array
    {
        try {
            $response = $this->httpClient->post(self::TOKEN_URL, [
                'auth' => [$this->clientId, $this->clientSecret],
                'form_params' => $params,
            ]);

            return json_decode((string)$response->getBody(), true);
        } catch (GuzzleException $e) {
            error_log('[RavelryService] Erreur échange/rafraîchissement de jeton: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Récupère l'identité Ravelry (username/id) juste après la connexion.
     */
    public function fetchCurrentUser(string $accessToken): ?array
    {
        try {
            $response = $this->authenticatedRequest('GET', '/current_user.json', $accessToken);
            $data = json_decode((string)$response->getBody(), true);

            return $data['user'] ?? null;
        } catch (GuzzleException $e) {
            error_log('[RavelryService] Erreur fetchCurrentUser: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Enveloppe les appels authentifiés à l'API Ravelry, avec une tentative
     * de nouvelle connexion réseau en cas de coupure (même schéma que Gemini).
     */
    private function authenticatedRequest(string $method, string $path, string $accessToken, int $maxAttempts = 2)
    {
        $attempt = 0;
        while (true) {
            $attempt++;
            try {
                return $this->httpClient->request($method, self::API_BASE . $path, [
                    'headers' => ['Authorization' => 'Bearer ' . $accessToken],
                ]);
            } catch (ConnectException $e) {
                if ($attempt >= $maxAttempts) {
                    throw $e;
                }
                error_log("[RavelryService] Timeout/coupure réseau Ravelry, nouvelle tentative ({$attempt}/{$maxAttempts})...");
            }
        }
    }
}
