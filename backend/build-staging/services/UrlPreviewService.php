<?php
/**
 * @file UrlPreviewService.php
 * @brief Service pour récupérer les previews d'URL (Open Graph)
 * @author Nathalie + AI Assistants
 * @created 2025-12-07
 */

declare(strict_types=1);

namespace App\Services;

/**
 * Service pour récupérer les métadonnées Open Graph d'une URL
 */
class UrlPreviewService
{
    /**
     * Récupérer l'image de preview d'une URL
     *
     * @param string $url URL à analyser
     * @return string|null URL de l'image de preview ou null
     */
    public function getPreviewImage(string $url): ?string
    {
        try {
            // [AI:Claude] Timeout de 5 secondes max
            $context = stream_context_create([
                'http' => [
                    'timeout' => 5,
                    'user_agent' => 'YarnFlow/1.0 (Pattern Preview Bot)'
                ]
            ]);

            // [AI:Claude] Récupérer le contenu HTML
            $html = @file_get_contents($url, false, $context);

            if ($html === false) {
                error_log("[UrlPreview] Impossible de récupérer l'URL: $url");
                return null;
            }

            // [AI:Claude] Parser les meta tags Open Graph
            // Chercher og:image
            if (preg_match('/<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
                return $matches[1];
            }

            // [AI:Claude] Fallback: chercher twitter:image
            if (preg_match('/<meta\s+name=["\']twitter:image["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
                return $matches[1];
            }

            // [AI:Claude] Fallback: chercher la première image
            if (preg_match('/<img\s+[^>]*src=["\'](.*?)["\']/i', $html, $matches)) {
                $imageUrl = $matches[1];

                // Si URL relative, la convertir en absolue
                if (strpos($imageUrl, 'http') !== 0) {
                    $parsedUrl = parse_url($url);
                    $baseUrl = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

                    if ($imageUrl[0] === '/') {
                        $imageUrl = $baseUrl . $imageUrl;
                    } else {
                        $imageUrl = $baseUrl . '/' . $imageUrl;
                    }
                }

                return $imageUrl;
            }

            return null;
        } catch (\Exception $e) {
            error_log("[UrlPreview] Erreur: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Récupérer toutes les métadonnées Open Graph
     *
     * @param string $url URL à analyser
     * @return array Métadonnées (image, title, description)
     */
    public function getMetadata(string $url): array
    {
        $metadata = [
            'image' => null,
            'title' => null,
            'description' => null
        ];

        try {
            $context = stream_context_create([
                'http' => [
                    'timeout' => 5,
                    'user_agent' => 'YarnFlow/1.0 (Pattern Preview Bot)'
                ]
            ]);

            $html = @file_get_contents($url, false, $context);

            if ($html === false) {
                return $metadata;
            }

            // og:image
            if (preg_match('/<meta\s+property=["\']og:image["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
                $metadata['image'] = $matches[1];
            }

            // og:title
            if (preg_match('/<meta\s+property=["\']og:title["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
                $metadata['title'] = $matches[1];
            }

            // og:description
            if (preg_match('/<meta\s+property=["\']og:description["\']\s+content=["\'](.*?)["\']/i', $html, $matches)) {
                $metadata['description'] = $matches[1];
            }

            return $metadata;
        } catch (\Exception $e) {
            error_log("[UrlPreview] Erreur getMetadata: " . $e->getMessage());
            return $metadata;
        }
    }
}
