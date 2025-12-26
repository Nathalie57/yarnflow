<?php
/**
 * @file SecurityHeadersMiddleware.php
 * @brief Middleware pour ajouter les headers de sécurité HTTP
 * @author AI:Claude
 * @created 2025-12-26
 * @modified 2025-12-26 by [AI:Claude] - Création middleware security headers
 */

declare(strict_types=1);

namespace App\Middleware;

/**
 * [AI:Claude] Middleware pour ajouter les headers de sécurité HTTP recommandés par OWASP
 * Ces headers protègent contre XSS, clickjacking, MIME sniffing, et autres attaques
 */
class SecurityHeadersMiddleware
{
    /**
     * [AI:Claude] Appliquer tous les headers de sécurité
     */
    public static function handle(): void
    {
        $isProduction = ($_ENV['APP_ENV'] ?? 'production') !== 'development';

        // [AI:Claude] 1. X-Content-Type-Options
        // Empêche le navigateur de deviner le type MIME (MIME sniffing)
        // Prévient les attaques où un fichier uploadé est interprété comme script
        header('X-Content-Type-Options: nosniff');

        // [AI:Claude] 2. X-Frame-Options
        // Empêche le site d'être affiché dans une iframe (prévient clickjacking)
        // SAMEORIGIN = autorise uniquement si même domaine
        header('X-Frame-Options: SAMEORIGIN');

        // [AI:Claude] 3. X-XSS-Protection
        // Active le filtre XSS du navigateur (legacy, mais encore utile)
        // mode=block: bloque complètement la page si XSS détecté
        header('X-XSS-Protection: 1; mode=block');

        // [AI:Claude] 4. Referrer-Policy
        // Contrôle combien d'informations sont envoyées dans le header Referer
        // strict-origin-when-cross-origin = envoie origine complète en same-origin, seulement domaine en cross-origin
        header('Referrer-Policy: strict-origin-when-cross-origin');

        // [AI:Claude] 5. Permissions-Policy
        // Désactive les features du navigateur non utilisées (réduit la surface d'attaque)
        header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()');

        // [AI:Claude] 6. Strict-Transport-Security (HSTS)
        // Force HTTPS pour les prochaines connexions
        // CRITIQUE: N'activer qu'en production HTTPS
        if ($isProduction) {
            // max-age=31536000 (1 an), includeSubDomains (sous-domaines aussi)
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }

        // [AI:Claude] 7. Content-Security-Policy (CSP)
        // Le plus important: contrôle quelles ressources peuvent être chargées
        // Prévient XSS, injection de scripts, et autres attaques
        self::setContentSecurityPolicy($isProduction);
    }

    /**
     * [AI:Claude] Définir la Content-Security-Policy
     * CSP est complexe et doit être adaptée à l'application
     *
     * @param bool $isProduction Si l'environnement est production
     */
    private static function setContentSecurityPolicy(bool $isProduction): void
    {
        // [AI:Claude] En production: CSP stricte
        // En développement: CSP plus permissive pour faciliter le debug
        if ($isProduction) {
            $csp = implode('; ', [
                "default-src 'self'",  // Par défaut, seulement ressources du même domaine
                "script-src 'self'",   // Scripts: seulement du même domaine
                "style-src 'self' 'unsafe-inline'",  // Styles: même domaine + inline (pour React)
                "img-src 'self' data: https:",  // Images: même domaine + data URLs + HTTPS
                "font-src 'self' data:",  // Fonts: même domaine + data URLs
                "connect-src 'self'",  // API calls: seulement même domaine
                "frame-ancestors 'self'",  // Peut être embedé uniquement par même domaine
                "base-uri 'self'",  // <base> tag: seulement même domaine
                "form-action 'self'",  // Forms: peuvent seulement soumettre à même domaine
                "object-src 'none'",  // Pas d'<object>, <embed>, <applet> (obsolète et dangereux)
                "upgrade-insecure-requests"  // Upgrade HTTP vers HTTPS automatiquement
            ]);
        } else {
            // [AI:Claude] En développement: CSP plus permissive
            $csp = implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Autoriser inline pour HMR
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https: http:",  // Autoriser HTTP en dev
                "font-src 'self' data:",
                "connect-src 'self' ws: wss:",  // Autoriser WebSocket pour HMR
                "frame-ancestors 'self'",
                "base-uri 'self'",
                "form-action 'self'",
                "object-src 'none'"
            ]);
        }

        header("Content-Security-Policy: $csp");
    }

    /**
     * [AI:Claude] Supprimer les headers qui révèlent des informations sensibles
     */
    public static function hideServerInfo(): void
    {
        // [AI:Claude] Masquer la version de PHP et du serveur web
        // Ces informations aident les attaquants à cibler des vulnérabilités spécifiques
        header_remove('X-Powered-By');
        header_remove('Server');

        // [AI:Claude] Note: Pour masquer complètement "Server:", il faut aussi configurer
        // le serveur web (Apache/Nginx). Ceci supprime juste le header PHP.
    }
}
