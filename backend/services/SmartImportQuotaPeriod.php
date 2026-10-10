<?php

declare(strict_types=1);

namespace App\Services;

final class SmartImportQuotaPeriod
{
    /** @return array{start: \DateTimeImmutable, next_reset: \DateTimeImmutable} */
    public static function forUser(array $user, ?\DateTimeImmutable $now = null): array
    {
        $now ??= new \DateTimeImmutable();
        if (empty($user['subscription_expires_at'])) {
            return [
                'start' => $now->modify('first day of this month midnight'),
                'next_reset' => $now->modify('first day of next month midnight'),
            ];
        }

        $expiresAt = new \DateTimeImmutable($user['subscription_expires_at']);
        $annual = in_array($user['subscription_type'] ?? '', [
            'plus_annual', 'pro_annual', 'early_bird', 'yearly',
        ], true);
        // Partir de l'activation, pas d'une fenêtre reculée depuis la fin annuelle :
        // celle-ci inclurait jusqu'à 29 jours d'essais gratuits avant l'abonnement.
        $start = $expiresAt->modify($annual ? '-1 year' : '-1 month');
        $nextReset = $start->modify('+30 days');
        while ($nextReset <= $now) {
            $start = $nextReset;
            $nextReset = $start->modify('+30 days');
        }

        return ['start' => $start, 'next_reset' => min($nextReset, $expiresAt)];
    }
}
