<?php
/**
 * @file RateLimitMiddleware.php
 * @brief Middleware de rate limiting
 * @author Nathalie + AI Assistants
 * @created 2025-12-26
 * @modified 2025-12-26 by [AI:Claude] - Création middleware rate limiting
 */

declare(strict_types=1);

namespace App\Middleware;

use App\Services\RateLimiter;

/**
 * [AI:Claude] Middleware pour appliquer le rate limiting sur les routes
 */
class RateLimitMiddleware
{
    private RateLimiter $rateLimiter;

    public function __construct()
    {
        $this->rateLimiter = new RateLimiter();
    }

    /**
     * [AI:Claude] Vérifier le rate limit pour la requête actuelle
     *
     * @param string $endpoint Endpoint appelé
     * @return void Envoie une réponse 429 si limite atteinte
     */
    public function check(string $endpoint): void
    {
        $identifier = RateLimiter::getClientIP();

        if (!$this->rateLimiter->check($endpoint, $identifier)) {
            $timeRemaining = $this->rateLimiter->getTimeRemaining($endpoint, $identifier);

            http_response_code(429);
            header('Content-Type: application/json');
            header('Retry-After: ' . $timeRemaining);

            echo json_encode([
                'success' => false,
                'error' => 'Trop de tentatives. Veuillez réessayer plus tard.',
                'retry_after' => $timeRemaining,
                'message' => 'Rate limit exceeded. Please try again in ' . $this->formatDuration($timeRemaining) . '.'
            ]);

            exit;
        }
    }

    /**
     * [AI:Claude] Formater la durée en texte lisible
     *
     * @param int $seconds
     * @return string
     */
    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds . ' second' . ($seconds > 1 ? 's' : '');
        }

        $minutes = ceil($seconds / 60);
        return $minutes . ' minute' . ($minutes > 1 ? 's' : '');
    }
}
