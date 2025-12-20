<?php
/**
 * Early Bird Code Service
 *
 * Gère les codes uniques d'accès prioritaire Early Bird pour les inscrits waitlist
 *
 * @author YarnFlow Team
 * @version 1.0.0
 * @date 2025-11-30
 */

namespace Services;

use PDO;
use Exception;

class EarlyBirdCodeService {
    private $db;
    private $codeLength = 12;
    private $validityHours = 72; // 72h d'accès prioritaire

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Génère un code unique aléatoire
     * Format: EB-XXXX-XXXX (exemple: EB-A7K9-M2P5)
     */
    private function generateUniqueCode(): string {
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans O, 0, I, 1 pour éviter confusion

        do {
            $code = 'EB-';
            $code .= substr(str_shuffle($characters), 0, 4) . '-';
            $code .= substr(str_shuffle($characters), 0, 4);

            // Vérifier que le code n'existe pas déjà
            $stmt = $this->db->prepare("
                SELECT COUNT(*) FROM early_bird_codes WHERE code = ?
            ");
            $stmt->execute([$code]);
            $exists = $stmt->fetchColumn() > 0;

        } while ($exists);

        return $code;
    }

    /**
     * Génère un code pour un email spécifique
     *
     * @param string $email Email de la personne
     * @param int $validityHours Durée de validité en heures (défaut: 72h)
     * @return array Code généré + infos
     */
    public function generateCodeForEmail(string $email, int $validityHours = null): array {
        if ($validityHours === null) {
            $validityHours = $this->validityHours;
        }

        // Vérifier si un code actif existe déjà pour cet email
        $stmt = $this->db->prepare("
            SELECT code, expires_at
            FROM early_bird_codes
            WHERE email = ?
              AND is_used = FALSE
              AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            return [
                'code' => $existing['code'],
                'email' => $email,
                'expires_at' => $existing['expires_at'],
                'is_new' => false
            ];
        }

        // Générer un nouveau code
        $code = $this->generateUniqueCode();
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$validityHours} hours"));

        $stmt = $this->db->prepare("
            INSERT INTO early_bird_codes (email, code, expires_at)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$email, $code, $expiresAt]);

        return [
            'code' => $code,
            'email' => $email,
            'expires_at' => $expiresAt,
            'is_new' => true
        ];
    }

    /**
     * Génère des codes pour tous les emails de la waitlist
     *
     * @param int $validityHours Durée de validité en heures
     * @return array Résultat de la génération
     */
    public function generateCodesForWaitlist(int $validityHours = null): array {
        if ($validityHours === null) {
            $validityHours = $this->validityHours;
        }

        // Récupérer tous les emails de la waitlist
        $stmt = $this->db->query("
            SELECT email, name, created_at
            FROM waitlist_emails
            ORDER BY created_at ASC
        ");
        $waitlistEmails = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($waitlistEmails)) {
            return [
                'success' => false,
                'message' => 'Aucun email dans la waitlist',
                'total' => 0
            ];
        }

        $results = [];
        $newCodes = 0;
        $existingCodes = 0;

        foreach ($waitlistEmails as $entry) {
            $result = $this->generateCodeForEmail($entry['email'], $validityHours);
            $results[] = $result;

            if ($result['is_new']) {
                $newCodes++;
            } else {
                $existingCodes++;
            }
        }

        return [
            'success' => true,
            'total' => count($waitlistEmails),
            'new_codes' => $newCodes,
            'existing_codes' => $existingCodes,
            'codes' => $results
        ];
    }

    /**
     * Valide un code Early Bird
     *
     * @param string $code Code à valider
     * @return array Résultat de la validation
     */
    public function validateCode(string $code): array {
        $code = strtoupper(trim($code));

        $stmt = $this->db->prepare("
            SELECT
                id,
                email,
                code,
                is_used,
                used_by_user_id,
                used_at,
                expires_at,
                created_at
            FROM early_bird_codes
            WHERE code = ?
            LIMIT 1
        ");
        $stmt->execute([$code]);
        $codeData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$codeData) {
            return [
                'valid' => false,
                'error' => 'CODE_NOT_FOUND',
                'message' => 'Code invalide'
            ];
        }

        if ($codeData['is_used']) {
            return [
                'valid' => false,
                'error' => 'CODE_ALREADY_USED',
                'message' => 'Ce code a déjà été utilisé',
                'used_at' => $codeData['used_at']
            ];
        }

        if (strtotime($codeData['expires_at']) < time()) {
            return [
                'valid' => false,
                'error' => 'CODE_EXPIRED',
                'message' => 'Ce code a expiré',
                'expired_at' => $codeData['expires_at']
            ];
        }

        // Code valide !
        return [
            'valid' => true,
            'email' => $codeData['email'],
            'code' => $codeData['code'],
            'expires_at' => $codeData['expires_at'],
            'hours_remaining' => round((strtotime($codeData['expires_at']) - time()) / 3600, 1)
        ];
    }

    /**
     * Marque un code comme utilisé
     *
     * @param string $code Code à marquer
     * @param int $userId ID de l'utilisateur qui utilise le code
     * @return bool Succès ou échec
     */
    public function markCodeAsUsed(string $code, int $userId): bool {
        $stmt = $this->db->prepare("
            UPDATE early_bird_codes
            SET is_used = TRUE,
                used_by_user_id = ?,
                used_at = NOW()
            WHERE code = ?
              AND is_used = FALSE
        ");

        return $stmt->execute([$userId, $code]);
    }

    /**
     * Récupère les statistiques des codes
     *
     * @return array Statistiques
     */
    public function getStats(): array {
        $stmt = $this->db->query("SELECT * FROM v_early_bird_codes_stats");
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'total_codes' => (int)$stats['total_codes'],
            'used_codes' => (int)$stats['used_codes'],
            'active_codes' => (int)$stats['active_codes'],
            'expired_codes' => (int)$stats['expired_codes'],
            'conversion_rate' => $stats['total_codes'] > 0
                ? round(($stats['used_codes'] / $stats['total_codes']) * 100, 2)
                : 0
        ];
    }

    /**
     * Récupère le code d'un email spécifique
     *
     * @param string $email Email à chercher
     * @return array|null Code trouvé ou null
     */
    public function getCodeByEmail(string $email): ?array {
        $stmt = $this->db->prepare("
            SELECT
                code,
                is_used,
                expires_at,
                CASE
                    WHEN is_used = TRUE THEN 'used'
                    WHEN expires_at <= NOW() THEN 'expired'
                    ELSE 'active'
                END as status
            FROM early_bird_codes
            WHERE email = ?
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$email]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }

    /**
     * Vérifie si Early Bird est encore disponible (< 200 places)
     *
     * @return array Disponibilité + infos
     */
    public function checkEarlyBirdAvailability(): array {
        $stmt = $this->db->query("
            SELECT
                max_slots,
                current_slots,
                (max_slots - current_slots) as remaining_slots,
                is_active
            FROM early_bird_config
            WHERE id = 1
        ");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'available' => $config['is_active'] && $config['remaining_slots'] > 0,
            'remaining_slots' => (int)$config['remaining_slots'],
            'max_slots' => (int)$config['max_slots'],
            'current_slots' => (int)$config['current_slots']
        ];
    }
}
