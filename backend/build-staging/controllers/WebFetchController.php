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

class WebFetchController {
    /**
     * Récupère le HTML d'une URL externe
     * POST /api/web-fetch
     * Body: { "url": "https://example.com" }
     */
    public function fetch() {
        try {
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
        } catch (Exception $e) {
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
            $url = $_GET['url'] ?? null;

            if (empty($url)) {
                http_response_code(400);
                echo 'URL manquante';
                return;
            }

            // Récupérer le HTML
            $result = WebFetchService::fetchHTML($url);

            if (!$result['success']) {
                http_response_code(400);
                echo 'Erreur: ' . $result['error'];
                return;
            }

            // Réécrire les URLs
            $html = WebFetchService::rewriteUrls($result['html'], $url);

            // Servir le HTML avec les bons headers
            header('Content-Type: text/html; charset=UTF-8');
            // Ne pas mettre de restrictions X-Frame-Options pour permettre l'affichage dans l'iframe
            // Le contenu provient de sites externes, on ne peut pas imposer SAMEORIGIN

            echo $html;
        } catch (\Exception $e) {
            http_response_code(500);
            echo 'Erreur: ' . $e->getMessage();
        }
    }

    /**
     * Récupère les métadonnées d'une URL (titre, description, image OG)
     * POST /api/web-fetch/metadata
     * Body: { "url": "https://example.com" }
     */
    public function fetchMetadata() {
        try {
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
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
