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
     * [AI:Claude] 2026-09-26 — SÉCURITÉ (SSRF) : valide qu'une URL est http(s) et que
     * TOUTES les IP vers lesquelles son hôte résout sont publiques (ni privées, ni loopback,
     * ni link-local/réservées — couvre aussi bien IPv4 que IPv6). Renvoie l'IP à utiliser
     * (fixée ensuite via CURLOPT_RESOLVE, voir fetchHTML) plutôt que de laisser cURL
     * re-résoudre le nom au moment de la requête (fenêtre de DNS rebinding).
     *
     * @return array{ok: bool, error?: string, ip?: string}
     */
    private static function validateUrlSafety($url): array
    {
        if (!is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return ['ok' => false, 'error' => 'URL invalide'];
        }

        $parsed = parse_url($url);
        $scheme = strtolower($parsed['scheme'] ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return ['ok' => false, 'error' => 'Seuls les protocoles HTTP et HTTPS sont autorisés'];
        }

        // parse_url() garde les crochets d'un littéral IPv6 dans host ("[::1]") — filter_var()
        // ne reconnaît l'adresse qu'une fois ces crochets retirés.
        $host = trim($parsed['host'] ?? '', '[]');
        if ($host === '') {
            return ['ok' => false, 'error' => 'URL invalide'];
        }

        // Hôte déjà une IP littérale (ex: "http://127.0.0.1/") : pas de résolution DNS à faire
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $ips = [$host];
        } else {
            $ips = [];
            foreach (@dns_get_record($host, DNS_A + DNS_AAAA) ?: [] as $record) {
                if (!empty($record['ip'])) $ips[] = $record['ip'];
                if (!empty($record['ipv6'])) $ips[] = $record['ipv6'];
            }
            if (empty($ips)) {
                // Repli IPv4 seul si dns_get_record échoue (ex: DNS non configuré en local)
                $resolved = gethostbyname($host);
                if ($resolved !== $host) $ips[] = $resolved;
            }
        }

        if (empty($ips)) {
            return ['ok' => false, 'error' => "Impossible de résoudre cette adresse"];
        }

        foreach ($ips as $ip) {
            if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return ['ok' => false, 'error' => 'Cette adresse ne peut pas être récupérée'];
            }
        }

        return ['ok' => true, 'ip' => $ips[0]];
    }

    /**
     * Récupère le contenu HTML d'une URL en imitant un navigateur réel
     *
     * @param string $url L'URL à récupérer
     * @param array $options Options supplémentaires (cache, timeout, etc.)
     * @return array ['success' => bool, 'html' => string, 'error' => string, 'status_code' => int]
     */
    public static function fetchHTML($url, $options = []) {
        // [AI:Claude] 2026-09-26 — SÉCURITÉ (SSRF) : ce endpoint est appelable sans compte
        // (preview de patron externe). Sans ce contrôle, une URL comme "http://127.0.0.1/..."
        // ou une adresse du réseau interne de l'hébergeur était récupérée par le serveur, qui
        // en renvoyait la réponse — accès au réseau interne depuis l'extérieur, exploitable par
        // n'importe qui. Revalidé à CHAQUE redirection (voir la boucle plus bas), pas seulement
        // sur l'URL de départ, sinon une redirection suffisait à contourner ce contrôle.
        $safety = self::validateUrlSafety($url);
        if (!$safety['ok']) {
            return [
                'success' => false,
                'html' => null,
                'error' => $safety['error'],
                'error_code' => 'url_unsafe',
                'status_code' => 0
            ];
        }

        // Vérifier le cache si activé
        $useCache = $options['cache'] ?? true;
        $cacheKey = 'webfetch_' . md5($url);
        $cacheTimeout = $options['cache_timeout'] ?? 3600; // 1 heure par défaut

        if ($useCache) {
            $cached = self::getFromCache($cacheKey);
            // Un cache écrit avant l'ajout de content_type n'a pas cette clé :
            // on l'ignore pour forcer un refetch plutôt que de reservir une réponse incomplète
            if ($cached !== null && array_key_exists('content_type', $cached)) {
                return $cached;
            }
        }

        // Headers réalistes d'un navigateur moderne (Chrome sur Windows)
        $headers = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language: fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding: gzip, deflate, br',
            'Connection: keep-alive',
            'Upgrade-Insecure-Requests: 1',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Cache-Control: max-age=0',
            'sec-ch-ua: "Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
            'sec-ch-ua-mobile: ?0',
            'sec-ch-ua-platform: "Windows"',
        ];

        // Détection environnement local pour SSL
        $isLocal = in_array($_SERVER['SERVER_NAME'] ?? '', ['localhost', '127.0.0.1', 'patron-maker.local']);

        // [AI:Claude] 2026-09-26 — CURLOPT_FOLLOWLOCATION désactivé : on suit nous-mêmes les
        // redirections, une à une, pour revalider la sécurité de CHAQUE nouvelle URL (un site
        // autorisé pourrait rediriger vers une adresse interne). CURLOPT_RESOLVE fixe la
        // connexion sur l'IP déjà vérifiée par validateUrlSafety(), pour qu'un changement DNS
        // entre la vérification et la requête (DNS rebinding) ne puisse pas la contourner.
        $currentUrl = $url;
        $statusCode = 0;
        $contentType = null;
        $html = false;
        $error = null;

        for ($hop = 0; $hop <= self::MAX_REDIRECTS; $hop++) {
            $safety = self::validateUrlSafety($currentUrl);
            if (!$safety['ok']) {
                return [
                    'success' => false,
                    'html' => null,
                    'error' => $safety['error'],
                    'error_code' => 'url_unsafe',
                    'status_code' => $statusCode,
                    'url' => $currentUrl
                ];
            }

            $parsedHop = parse_url($currentUrl);
            $hopScheme = strtolower($parsedHop['scheme'] ?? 'https');
            $hopPort = $parsedHop['port'] ?? ($hopScheme === 'https' ? 443 : 80);
            $hopHost = trim($parsedHop['host'] ?? '', '[]');
            // Syntaxe cURL --resolve : une IPv6 dans le champ adresse doit être entre crochets
            $resolveIp = str_contains($safety['ip'], ':') ? '['.$safety['ip'].']' : $safety['ip'];

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $currentUrl,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_TIMEOUT => $options['timeout'] ?? self::TIMEOUT,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_ENCODING => '', // Accepter toutes les encodages
                CURLOPT_SSL_VERIFYPEER => !$isLocal, // Désactiver vérification SSL en local
                CURLOPT_SSL_VERIFYHOST => $isLocal ? 0 : 2,
                CURLOPT_COOKIEFILE => '', // Activer les cookies
                CURLOPT_HEADER => false,
                CURLOPT_RESOLVE => [$hopHost.':'.$hopPort.':'.$resolveIp],
            ]);

            $html = curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            $redirectUrl = curl_getinfo($ch, CURLINFO_REDIRECT_URL);
            $error = curl_error($ch);
            curl_close($ch);

            if ($statusCode >= 300 && $statusCode < 400 && !empty($redirectUrl)) {
                $currentUrl = $redirectUrl;
                continue;
            }
            break;
        }

        if ($statusCode >= 300 && $statusCode < 400) {
            return [
                'success' => false,
                'html' => null,
                'error' => 'Trop de redirections',
                'error_code' => 'too_many_redirects',
                'status_code' => $statusCode,
                'url' => $currentUrl
            ];
        }

        // Résultat
        $result = [
            'success' => $html !== false && $statusCode >= 200 && $statusCode < 400,
            'html' => $html ?: null,
            'content_type' => $contentType ?: null,
            'error' => $error ?: ($statusCode >= 400 ? "Erreur HTTP $statusCode" : null),
            'status_code' => $statusCode,
            'url' => $currentUrl
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
        if (!is_array($data) || !isset($data['expires'], $data['content'])) {
            unlink($file);
            return null;
        }
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
