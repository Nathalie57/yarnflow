<?php
/**
 * @file SecurityHelper.php
 * @brief Fonctions helper pour la sécurité
 * @author AI:Claude
 * @created 2025-12-26
 * @modified 2025-12-26 by [AI:Claude] - Création helper sécurité
 */

declare(strict_types=1);

namespace App\Helpers;

class SecurityHelper
{
    /**
     * [AI:Claude] Échapper un filename pour utilisation sécurisée dans Content-Disposition header
     * Prévient HTTP Response Splitting et injection de headers
     *
     * @param string $filename Nom de fichier à échapper
     * @return string Filename sécurisé
     */
    public static function escapeFilename(string $filename): string
    {
        // [AI:Claude] 1. Enlever les caractères de contrôle (CR, LF, etc.) pour prévenir HTTP Response Splitting
        $filename = preg_replace('/[\x00-\x1F\x7F]/', '', $filename);

        // [AI:Claude] 2. Enlever les caractères dangereux pour les filenames
        $filename = str_replace(['\\', '/', ':', '*', '?', '"', '<', '>', '|'], '_', $filename);

        // [AI:Claude] 3. Limiter la longueur (max 255 caractères pour la plupart des filesystems)
        if (strlen($filename) > 255) {
            $extension = pathinfo($filename, PATHINFO_EXTENSION);
            $basename = substr(pathinfo($filename, PATHINFO_FILENAME), 0, 250);
            $filename = $basename . '.' . $extension;
        }

        // [AI:Claude] 4. Enlever les espaces en début/fin
        $filename = trim($filename);

        // [AI:Claude] 5. Si le filename est vide après nettoyage, utiliser un nom par défaut
        if (empty($filename)) {
            $filename = 'file_' . time();
        }

        return $filename;
    }

    /**
     * [AI:Claude] Échapper du contenu HTML pour prévenir XSS
     *
     * @param string $text Texte à échapper
     * @return string Texte échappé
     */
    public static function escapeHtml(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * [AI:Claude] Échapper un attribut HTML pour prévenir XSS dans les attributs
     *
     * @param string $value Valeur à échapper
     * @return string Valeur échappée
     */
    public static function escapeHtmlAttr(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * [AI:Claude] Échapper une URL pour prévenir XSS dans href/src
     *
     * @param string $url URL à échapper
     * @return string URL échappée
     */
    public static function escapeUrl(string $url): string
    {
        // [AI:Claude] Valider que l'URL ne commence pas par javascript: ou data:
        if (preg_match('/^(javascript|data|vbscript):/i', trim($url))) {
            return '';
        }

        return htmlspecialchars($url, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /**
     * [AI:Claude] Sanitizer un message d'erreur pour affichage sécurisé
     * Enlève les informations sensibles tout en gardant le message utilisable
     *
     * @param string $errorMessage Message d'erreur brut
     * @return string Message sanitizé
     */
    public static function sanitizeErrorMessage(string $errorMessage): string
    {
        // [AI:Claude] Enlever les chemins de fichiers absolus
        $errorMessage = preg_replace('/\/[^\s]+\.php/', '[fichier]', $errorMessage);

        // [AI:Claude] Enlever les stack traces
        $errorMessage = preg_replace('/Stack trace:.*/s', '', $errorMessage);

        // [AI:Claude] Limiter la longueur
        if (strlen($errorMessage) > 500) {
            $errorMessage = substr($errorMessage, 0, 500) . '...';
        }

        // [AI:Claude] Échapper le HTML
        return self::escapeHtml($errorMessage);
    }

    /**
     * [AI:Claude] Valider et sanitizer un header HTTP value
     *
     * @param string $value Valeur du header
     * @return string Valeur sanitizée
     */
    public static function sanitizeHeaderValue(string $value): string
    {
        // [AI:Claude] Enlever CR, LF et autres caractères de contrôle pour prévenir HTTP Response Splitting
        return preg_replace('/[\x00-\x1F\x7F]/', '', $value);
    }
}
