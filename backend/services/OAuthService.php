<?php
/**
 * @file OAuthService.php
 * @brief Service pour gérer l'authentification OAuth (Google, Facebook)
 * @author Nathalie + AI Assistants
 * @created 2025-12-05
 * @modified 2025-12-05 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

namespace App\Services;

/**
 * [AI:Claude] Service d'authentification OAuth
 */
class OAuthService
{
    private string $googleClientId;
    private string $googleClientSecret;
    private string $googleRedirectUri;

    private string $facebookAppId;
    private string $facebookAppSecret;
    private string $facebookRedirectUri;

    public function __construct()
    {
        // [AI:Claude] Configuration depuis .env
        $this->googleClientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
        $this->googleClientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
        $this->googleRedirectUri = $_ENV['GOOGLE_REDIRECT_URI'] ?? '';

        $this->facebookAppId = $_ENV['FACEBOOK_APP_ID'] ?? '';
        $this->facebookAppSecret = $_ENV['FACEBOOK_APP_SECRET'] ?? '';
        $this->facebookRedirectUri = $_ENV['FACEBOOK_REDIRECT_URI'] ?? '';
    }

    /**
     * [AI:Claude] Obtenir l'URL d'autorisation Google
     */
    public function getGoogleAuthUrl(): string
    {
        $params = [
            'client_id' => $this->googleClientId,
            'redirect_uri' => $this->googleRedirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'online',
            'prompt' => 'select_account'
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * [AI:Claude] Échanger le code Google contre un access token et récupérer les infos utilisateur
     */
    public function handleGoogleCallback(string $code): ?array
    {
        try {
            // [AI:Claude] Échanger le code contre un access token
            $tokenData = $this->exchangeGoogleCode($code);

            if (!$tokenData || !isset($tokenData['access_token'])) {
                error_log('[OAuthService] Erreur échange code Google');
                return null;
            }

            // [AI:Claude] Récupérer les infos utilisateur
            $userInfo = $this->getGoogleUserInfo($tokenData['access_token']);

            if (!$userInfo) {
                error_log('[OAuthService] Erreur récupération infos Google');
                return null;
            }

            return [
                'provider' => 'google',
                'provider_id' => $userInfo['sub'] ?? $userInfo['id'],
                'email' => $userInfo['email'],
                'first_name' => $userInfo['given_name'] ?? null,
                'last_name' => $userInfo['family_name'] ?? null,
                'avatar' => $userInfo['picture'] ?? null,
                'email_verified' => $userInfo['email_verified'] ?? false
            ];

        } catch (\Exception $e) {
            error_log('[OAuthService] Exception Google callback: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Obtenir l'URL d'autorisation Facebook
     */
    public function getFacebookAuthUrl(): string
    {
        $params = [
            'client_id' => $this->facebookAppId,
            'redirect_uri' => $this->facebookRedirectUri,
            'response_type' => 'code',
            'scope' => 'email,public_profile'
        ];

        return 'https://www.facebook.com/v18.0/dialog/oauth?' . http_build_query($params);
    }

    /**
     * [AI:Claude] Échanger le code Facebook contre un access token et récupérer les infos utilisateur
     */
    public function handleFacebookCallback(string $code): ?array
    {
        try {
            // [AI:Claude] Échanger le code contre un access token
            $tokenData = $this->exchangeFacebookCode($code);

            if (!$tokenData || !isset($tokenData['access_token'])) {
                error_log('[OAuthService] Erreur échange code Facebook');
                return null;
            }

            // [AI:Claude] Récupérer les infos utilisateur
            $userInfo = $this->getFacebookUserInfo($tokenData['access_token']);

            if (!$userInfo) {
                error_log('[OAuthService] Erreur récupération infos Facebook');
                return null;
            }

            return [
                'provider' => 'facebook',
                'provider_id' => $userInfo['id'],
                'email' => $userInfo['email'] ?? null,
                'first_name' => $userInfo['first_name'] ?? null,
                'last_name' => $userInfo['last_name'] ?? null,
                'avatar' => $userInfo['picture']['data']['url'] ?? null,
                'email_verified' => true // Facebook vérifie les emails par défaut
            ];

        } catch (\Exception $e) {
            error_log('[OAuthService] Exception Facebook callback: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Échanger le code Google contre un access token
     */
    private function exchangeGoogleCode(string $code): ?array
    {
        $params = [
            'code' => $code,
            'client_id' => $this->googleClientId,
            'client_secret' => $this->googleClientSecret,
            'redirect_uri' => $this->googleRedirectUri,
            'grant_type' => 'authorization_code'
        ];

        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[OAuthService] Erreur token Google: ' . $response);
            return null;
        }

        return json_decode($response, true);
    }

    /**
     * [AI:Claude] Récupérer les infos utilisateur Google
     */
    private function getGoogleUserInfo(string $accessToken): ?array
    {
        $ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[OAuthService] Erreur userinfo Google: ' . $response);
            return null;
        }

        return json_decode($response, true);
    }

    /**
     * [AI:Claude] Échanger le code Facebook contre un access token
     */
    private function exchangeFacebookCode(string $code): ?array
    {
        $params = [
            'code' => $code,
            'client_id' => $this->facebookAppId,
            'client_secret' => $this->facebookAppSecret,
            'redirect_uri' => $this->facebookRedirectUri
        ];

        $url = 'https://graph.facebook.com/v18.0/oauth/access_token?' . http_build_query($params);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[OAuthService] Erreur token Facebook: ' . $response);
            return null;
        }

        return json_decode($response, true);
    }

    /**
     * [AI:Claude] Récupérer les infos utilisateur Facebook
     */
    private function getFacebookUserInfo(string $accessToken): ?array
    {
        $fields = 'id,email,first_name,last_name,picture.type(large)';
        $url = 'https://graph.facebook.com/v18.0/me?fields=' . $fields . '&access_token=' . $accessToken;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('[OAuthService] Erreur userinfo Facebook: ' . $response);
            return null;
        }

        return json_decode($response, true);
    }
}
