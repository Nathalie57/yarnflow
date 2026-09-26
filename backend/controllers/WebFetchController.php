<?php
/**
 * @file WebFetchController.php
 * @brief Contrôleur pour récupérer du contenu web externe
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 * @version 1.0.0
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Services\WebFetchService;
use App\Services\RateLimiter;
use App\Helpers\SecurityHelper;
use App\Middleware\AuthMiddleware;

class WebFetchController {
    // [AI:Claude] 2026-09-26 — SÉCURITÉ : fetch()/fetchMetadata() n'ont plus aucune raison
    // d'être accessibles sans compte (accès direct au JSON extrait, contrairement à proxy()
    // qui sert une iframe et ne peut pas envoyer de header Authorization).
    private function getUserIdFromAuth(): int
    {
        $userData = (new AuthMiddleware())->authenticate();
        if ($userData === null) {
            throw new \Exception('Non authentifié');
        }
        return (int)$userData['user_id'];
    }

    /**
     * Récupère le HTML d'une URL externe
     * POST /api/web-fetch
     * Body: { "url": "https://example.com" }
     */
    public function fetch() {
        try {
            $this->getUserIdFromAuth();

            // Récupérer l'URL depuis le body
            $data = json_decode(file_get_contents('php://input'), true);
            $url = $data['url'] ?? null;

            if (empty($url)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'URL manquante'
                ]);
                return;
            }

            // Récupérer le HTML
            $result = WebFetchService::fetchHTML($url);

            if (!$result['success']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $result['error']
                ]);
                return;
            }

            // Retourner le HTML
            echo json_encode([
                'success' => true,
                'html' => $result['html'],
                'status_code' => $result['status_code'],
                'url' => $result['url']
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Sert le HTML proxyfié d'une URL (avec URLs réécrites)
     * GET /api/web-fetch/proxy?url=https://example.com
     */
    public function proxy() {
        try {
            // [AI:Claude] 2026-09-26 — SÉCURITÉ : reste sans compte (iframe de preview, ne peut
            // pas envoyer de header Authorization), donc pas de vérification d'identité
            // possible ici ; un plafond par IP limite au moins l'abus en serveur mandataire
            // ouvert (voir RateLimiter::LIMITS). Le filtrage SSRF (WebFetchService) reste la
            // vraie protection contre l'accès au réseau interne.
            if (!(new RateLimiter())->check('/api/web-fetch/proxy', RateLimiter::getClientIP())) {
                http_response_code(429);
                echo SecurityHelper::escapeHtml('Trop de requêtes, réessaie dans un instant.');
                return;
            }

            $url = $_GET['url'] ?? null;

            if (empty($url)) {
                http_response_code(400);
                // [AI:Claude] SÉCURITÉ: Échapper les erreurs pour prévenir XSS
                echo SecurityHelper::escapeHtml('URL manquante');
                return;
            }

            // Récupérer le HTML
            $result = WebFetchService::fetchHTML($url);

            if (!$result['success']) {
                http_response_code(400);
                // [AI:Claude] SÉCURITÉ: Échapper les erreurs pour prévenir XSS
                echo SecurityHelper::escapeHtml('Erreur: ' . $result['error']);
                return;
            }

            // Le contenu distant n'est pas forcément du HTML (ex: lien direct vers un PDF) :
            // le servir tel quel avec son vrai Content-Type évite de l'afficher comme du texte brut
            $contentType = $result['content_type'] ?? '';
            $isHtml = $contentType === '' || stripos($contentType, 'html') !== false;

            if (!$isHtml) {
                header('Content-Type: ' . $contentType);
                header('X-Content-Type-Options: nosniff');
                echo $result['html'];
                return;
            }

            // Réécrire les URLs
            $html = WebFetchService::rewriteUrls($result['html'], $url);

            // [AI:Claude] SÉCURITÉ: Headers CSP pour limiter les risques du contenu externe
            header('Content-Type: text/html; charset=UTF-8');
            header("Content-Security-Policy: default-src 'self' *; script-src 'unsafe-inline' 'unsafe-eval' *; style-src 'unsafe-inline' *; img-src * data: blob:; font-src * data:; connect-src *;");
            header('X-Content-Type-Options: nosniff');
            // Ne pas mettre de restrictions X-Frame-Options pour permettre l'affichage dans l'iframe
            // Le contenu provient de sites externes, on ne peut pas imposer SAMEORIGIN

            // [AI:Claude] SÉCURITÉ: Le HTML vient d'un site externe et est affiché tel quel
            // C'est nécessaire pour le fonctionnement du proxy, mais potentiellement dangereux
            // L'iframe côté React doit avoir l'attribut sandbox pour limiter les risques
            echo $html;
        } catch (\Exception $e) {
            http_response_code(500);
            // [AI:Claude] SÉCURITÉ: Sanitizer le message d'erreur
            echo SecurityHelper::sanitizeErrorMessage($e->getMessage());
        }
    }

    /**
     * Récupère les métadonnées d'une URL (titre, description, image OG)
     * POST /api/web-fetch/metadata
     * Body: { "url": "https://example.com" }
     */
    public function fetchMetadata() {
        try {
            $this->getUserIdFromAuth();

            $data = json_decode(file_get_contents('php://input'), true);
            $url = $data['url'] ?? null;

            if (empty($url)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'URL manquante'
                ]);
                return;
            }

            // Récupérer le HTML
            $result = WebFetchService::fetchHTML($url);

            if (!$result['success']) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => $result['error']
                ]);
                return;
            }

            // Extraire les métadonnées
            $metadata = WebFetchService::extractMetadata($result['html'], $url);

            echo json_encode([
                'success' => true,
                'metadata' => $metadata,
                'url' => $url
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
