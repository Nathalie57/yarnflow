<?php
/**
 * @file RateLimiter.php
 * @brief Service de limitation de débit (rate limiting)
 * @author Nathalie + AI Assistants
 * @created 2025-12-26
 * @modified 2025-12-26 by [AI:Claude] - Création système rate limiting
 */

declare(strict_types=1);

namespace App\Services;

use PDO;

/**
 * [AI:Claude] Service de rate limiting pour protéger contre les abus
 *
 * Utilise une table en base de données pour tracker les requêtes par IP/endpoint
 */
class RateLimiter
{
    private PDO $db;

    // Configuration des limites par endpoint
    private const LIMITS = [
        '/api/auth/login' => [5, 900],      // 5 requêtes / 15 minutes
        '/api/auth/register' => [3, 3600],  // 3 requêtes / 1 heure
        '/api/auth/forgot-password' => [3, 3600], // 3 requêtes / 1 heure
        '/api/photos/upload' => [10, 300],  // 10 requêtes / 5 minutes
        '/api/contact' => [3, 3600],        // 3 requêtes / 1 heure (déjà existant)
        'default' => [100, 60]              // 100 requêtes / 1 minute (global)
    ];

    public function __construct()
    {
        $this->db = \App\Config\Database::getInstance()->getConnection();
        $this->createTableIfNotExists();
    }

    /**
     * [AI:Claude] Créer la table rate_limit si elle n'existe pas
     */
    private function createTableIfNotExists(): void
    {
        $query = "CREATE TABLE IF NOT EXISTS rate_limit (
            id INT AUTO_INCREMENT PRIMARY KEY,
            identifier VARCHAR(255) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            attempts INT DEFAULT 1,
            window_start DATETIME NOT NULL,
            INDEX idx_identifier_endpoint (identifier, endpoint),
            INDEX idx_window_start (window_start)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

        $this->db->exec($query);
    }

    /**
     * [AI:Claude] Vérifier si une requête est autorisée
     *
     * @param string $endpoint Endpoint appelé (ex: /api/auth/login)
     * @param string $identifier Identifiant unique (IP, user_id, etc.)
     * @return bool True si autorisé, False si limite atteinte
     */
    public function check(string $endpoint, string $identifier): bool
    {
        [$maxAttempts, $windowSeconds] = $this->getLimit($endpoint);

        // Nettoyer les anciennes entrées expirées
        $this->cleanup();

        // Récupérer l'entrée actuelle
        $query = "SELECT id, attempts, window_start
                  FROM rate_limit
                  WHERE identifier = :identifier
                    AND endpoint = :endpoint
                  LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':identifier', $identifier);
        $stmt->bindValue(':endpoint', $endpoint);
        $stmt->execute();

        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record) {
            // Première requête, créer une nouvelle entrée
            $this->createRecord($identifier, $endpoint);
            return true;
        }

        // Vérifier si la fenêtre est expirée
        $windowStart = strtotime($record['window_start']);
        $now = time();

        if ($now - $windowStart > $windowSeconds) {
            // Fenêtre expirée, réinitialiser
            $this->resetRecord($record['id']);
            return true;
        }

        // Vérifier si la limite est atteinte
        if ($record['attempts'] >= $maxAttempts) {
            return false; // Limite atteinte
        }

        // Incrémenter le compteur
        $this->incrementRecord($record['id']);
        return true;
    }

    /**
     * [AI:Claude] Obtenir le temps restant avant reset (en secondes)
     *
     * @param string $endpoint
     * @param string $identifier
     * @return int Secondes restantes, 0 si pas de limite active
     */
    public function getTimeRemaining(string $endpoint, string $identifier): int
    {
        [$maxAttempts, $windowSeconds] = $this->getLimit($endpoint);

        $query = "SELECT window_start
                  FROM rate_limit
                  WHERE identifier = :identifier
                    AND endpoint = :endpoint
                  LIMIT 1";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':identifier', $identifier);
        $stmt->bindValue(':endpoint', $endpoint);
        $stmt->execute();

        $record = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$record) {
            return 0;
        }

        $windowStart = strtotime($record['window_start']);
        $now = time();
        $elapsed = $now - $windowStart;

        return max(0, $windowSeconds - $elapsed);
    }

    /**
     * [AI:Claude] Obtenir la limite pour un endpoint
     *
     * @param string $endpoint
     * @return array [maxAttempts, windowSeconds]
     */
    private function getLimit(string $endpoint): array
    {
        return self::LIMITS[$endpoint] ?? self::LIMITS['default'];
    }

    /**
     * [AI:Claude] Créer un nouvel enregistrement
     */
    private function createRecord(string $identifier, string $endpoint): void
    {
        $query = "INSERT INTO rate_limit (identifier, endpoint, attempts, window_start)
                  VALUES (:identifier, :endpoint, 1, NOW())";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':identifier', $identifier);
        $stmt->bindValue(':endpoint', $endpoint);
        $stmt->execute();
    }

    /**
     * [AI:Claude] Réinitialiser un enregistrement
     */
    private function resetRecord(int $id): void
    {
        $query = "UPDATE rate_limit
                  SET attempts = 1, window_start = NOW()
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * [AI:Claude] Incrémenter le compteur
     */
    private function incrementRecord(int $id): void
    {
        $query = "UPDATE rate_limit
                  SET attempts = attempts + 1
                  WHERE id = :id";

        $stmt = $this->db->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * [AI:Claude] Nettoyer les anciennes entrées (> 24h)
     */
    private function cleanup(): void
    {
        // Exécuter seulement 1% du temps pour ne pas surcharger
        if (rand(1, 100) !== 1) {
            return;
        }

        $query = "DELETE FROM rate_limit
                  WHERE window_start < DATE_SUB(NOW(), INTERVAL 24 HOUR)";

        $this->db->exec($query);
    }

    /**
     * [AI:Claude] Obtenir l'IP du client
     *
     * @return string
     */
    public static function getClientIP(): string
    {
        // Vérifier les headers de proxy
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];

                // Si multiple IPs (proxy chain), prendre la première
                if (strpos($ip, ',') !== false) {
                    $ips = explode(',', $ip);
                    $ip = trim($ips[0]);
                }

                // Valider que c'est une IP valide
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0'; // Fallback
    }
}
