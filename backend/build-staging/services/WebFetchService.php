<?php
/**
 * @file WebFetchService.php
 * @brief Service pour récupérer le contenu HTML de sites externes
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 * @version 1.0.0
 */

declare(strict_types=1);

namespace App\Services;

class WebFetchService {
    private const TIMEOUT = 15; // secondes
    private const MAX_REDIRECTS = 5;

    /**
     * Récupère le contenu HTML d'une URL en imitant un navigateur réel
     *
     * @param string $url L'URL à récupérer
     * @param array $options Options supplémentaires (cache, timeout, etc.)
     * @return array ['success' => bool, 'html' => string, 'error' => string, 'status_code' => int]
     */
    public static function fetchHTML($url, $options = []) {
        // Validation de l'URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return [
                'success' => false,
                'html' => null,
                'error' => 'URL invalide',
                'status_code' => 0
            ];
        }

        // Sécurité : uniquement HTTP/HTTPS
        $parsed = parse_url($url);
        if (!in_array($parsed['scheme'] ?? '', ['http', 'https'])) {
            return [
                'success' => false,
                'html' => null,
                'error' => 'Seuls les protocoles HTTP et HTTPS sont autorisés',
                'status_code' => 0
            ];
        }

        // Vérifier le cache si activé
        $useCache = $options['cache'] ?? true;
        $cacheKey = 'webfetch_' . md5($url);
        $cacheTimeout = $options['cache_timeout'] ?? 3600; // 1 heure par défaut

        if ($useCache) {
            $cached = self::getFromCache($cacheKey);
            if ($cached !== null) {
                return $cached;
            }
        }

        // Initialiser cURL
        $ch = curl_init();

        // Headers réalistes d'un navigateur moderne (Chrome sur Windows)
        $headers = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding: gzip, deflate, br',
            'Connection: keep-alive',
            'Upgrade-Insecure-Requests: 1',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Cache-Control: max-age=0'
        ];

        // Détection environnement local pour SSL
        $isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', 'patron-maker.local']);

        // Configuration cURL
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => self::MAX_REDIRECTS,
            CURLOPT_TIMEOUT => $options['timeout'] ?? self::TIMEOUT,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_ENCODING => '', // Accepter toutes les encodages
            CURLOPT_SSL_VERIFYPEER => !$isLocal, // Désactiver vérification SSL en local
            CURLOPT_SSL_VERIFYHOST => $isLocal ? 0 : 2,
            CURLOPT_COOKIEFILE => '', // Activer les cookies
            CURLOPT_HEADER => false
        ]);

        // Exécuter la requête
        $html = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        // Résultat
        $result = [
            'success' => $html !== false && $statusCode >= 200 && $statusCode < 400,
            'html' => $html ?: null,
            'error' => $error ?: ($statusCode >= 400 ? "Erreur HTTP $statusCode" : null),
            'status_code' => $statusCode,
            'url' => $url
        ];

        // Mettre en cache si succès
        if ($result['success'] && $useCache) {
            self::saveToCache($cacheKey, $result, $cacheTimeout);
        }

        return $result;
    }

    /**
     * Réécrit les URLs relatives en URLs absolues dans le HTML
     *
     * @param string $html Le contenu HTML
     * @param string $baseUrl L'URL de base
     * @return string HTML avec URLs réécrites
     */
    public static function rewriteUrls($html, $baseUrl) {
        if (empty($html)) {
            return $html;
        }

        $parsed = parse_url($baseUrl);
        $baseScheme = $parsed['scheme'] ?? 'https';
        $baseHost = $parsed['host'] ?? '';

        // Réécrit les URLs dans différents attributs
        $patterns = [
            // href="..."
            '/href=["\']((?!http|\/\/|#|mailto:|tel:)[^"\']+)["\']/i' => 'href="' . $baseScheme . '://' . $baseHost . '/$1"',
            // src="..."
            '/src=["\']((?!http|\/\/|data:)[^"\']+)["\']/i' => 'src="' . $baseScheme . '://' . $baseHost . '/$1"',
            // srcset="..."
            '/srcset=["\']((?!http|\/\/|data:)[^"\']+)["\']/i' => 'srcset="' . $baseScheme . '://' . $baseHost . '/$1"',
            // url(...)
            '/url\(["\']?((?!http|\/\/|data:)[^"\')\s]+)["\']?\)/i' => 'url(' . $baseScheme . '://' . $baseHost . '/$1)',
        ];

        foreach ($patterns as $pattern => $replacement) {
            $html = preg_replace($pattern, $replacement, $html);
        }

        // Nettoyer les doubles slashes (sauf après :)
        $html = preg_replace('#(?<!:)//+#', '/', $html);

        // Ajouter base tag
        $baseTag = '<base href="' . $baseScheme . '://' . $baseHost . '/" target="_blank">';
        $html = preg_replace('/<head>/i', '<head>' . $baseTag, $html, 1);

        return $html;
    }

    /**
     * Extrait des métadonnées d'un HTML (titre, description, image OG)
     *
     * @param string $html Le contenu HTML
     * @param string $url L'URL d'origine (pour résoudre les URLs relatives)
     * @return array
     */
    public static function extractMetadata($html, $url) {
        if (empty($html)) {
            return null;
        }

        $metadata = [
            'title' => null,
            'description' => null,
            'image' => null,
            'site_name' => null
        ];

        // Désactiver les erreurs XML
        libxml_use_internal_errors(true);

        $dom = new DOMDocument();
        @$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));

        // Titre
        $titleTags = $dom->getElementsByTagName('title');
        if ($titleTags->length > 0) {
            $metadata['title'] = trim($titleTags->item(0)->textContent);
        }

        // Meta tags
        $metaTags = $dom->getElementsByTagName('meta');
        foreach ($metaTags as $meta) {
            $property = $meta->getAttribute('property');
            $name = $meta->getAttribute('name');
            $content = $meta->getAttribute('content');

            // Open Graph
            if ($property === 'og:title' && !$metadata['title']) {
                $metadata['title'] = $content;
            } elseif ($property === 'og:description' || $name === 'description') {
                $metadata['description'] = $content;
            } elseif ($property === 'og:image') {
                $metadata['image'] = self::resolveUrl($content, $url);
            } elseif ($property === 'og:site_name') {
                $metadata['site_name'] = $content;
            }
        }

        libxml_clear_errors();

        return $metadata;
    }

    /**
     * Résout une URL relative en URL absolue
     */
    private static function resolveUrl($relative, $base) {
        if (empty($relative)) {
            return null;
        }

        // Déjà absolue
        if (parse_url($relative, PHP_URL_SCHEME) != '') {
            return $relative;
        }

        $base_parts = parse_url($base);

        // Protocol-relative URL
        if (strpos($relative, '//') === 0) {
            return $base_parts['scheme'] . ':' . $relative;
        }

        // Absolute path
        if ($relative[0] === '/') {
            return $base_parts['scheme'] . '://' . $base_parts['host'] . $relative;
        }

        // Relative path
        $path = $base_parts['path'] ?? '/';
        $path = substr($path, 0, strrpos($path, '/') + 1);
        return $base_parts['scheme'] . '://' . $base_parts['host'] . $path . $relative;
    }

    /**
     * Cache simple basé sur fichiers
     */
    private static function getFromCache($key) {
        $cacheDir = __DIR__ . '/../cache';
        if (!is_dir($cacheDir)) {
            return null;
        }

        $file = $cacheDir . '/' . $key . '.cache';
        if (!file_exists($file)) {
            return null;
        }

        $data = unserialize(file_get_contents($file));
        if ($data['expires'] < time()) {
            unlink($file);
            return null;
        }

        return $data['content'];
    }

    private static function saveToCache($key, $content, $timeout) {
        $cacheDir = __DIR__ . '/../cache';
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0755, true);
        }

        $file = $cacheDir . '/' . $key . '.cache';
        $data = [
            'expires' => time() + $timeout,
            'content' => $content
        ];

        file_put_contents($file, serialize($data));
    }
}
