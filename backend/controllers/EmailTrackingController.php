<?php
/**
 * @file EmailTrackingController.php
 * @brief Endpoint public de suivi d'ouverture des emails (pixel invisible)
 * @author AI Assistants
 * @created 2026-07-20
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;

class EmailTrackingController
{
    // 1x1 GIF transparent — le plus petit format d'image valide universellement supporté
    private const TRANSPARENT_GIF = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xFF\xFF\xFF\x21\xF9\x04\x01\x00\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3B";

    /**
     * GET /api/email/track-open?t={token}
     *
     * [AI:Claude] Marque l'email comme ouvert (une seule fois, au premier
     * chargement) puis renvoie systématiquement le pixel — un token inconnu ou
     * absent ne doit jamais faire échouer l'affichage de l'image côté client mail.
     */
    public function trackOpen(): void
    {
        $token = $_GET['t'] ?? null;

        if (is_string($token) && $token !== '') {
            try {
                $db = Database::getInstance()->getConnection();
                $stmt = $db->prepare(
                    "UPDATE emails_sent_log SET opened_at = NOW()
                     WHERE tracking_token = :token AND opened_at IS NULL"
                );
                $stmt->execute(['token' => $token]);
            } catch (\Exception $e) {
                error_log('[EmailTrackingController] Erreur tracking ouverture: ' . $e->getMessage());
            }
        }

        header('Content-Type: image/gif');
        header('Content-Length: ' . strlen(self::TRANSPARENT_GIF));
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        echo self::TRANSPARENT_GIF;
    }
}
