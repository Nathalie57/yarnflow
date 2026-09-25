<?php
/**
 * @file AnalyticsService.php
 * @brief Journal des jalons du parcours produit, en base plutôt que dans GA4
 *
 * [AI:Claude] 2026-08-23 — created / opened / first_row_counted / section_changed
 * n'existaient pour aucun projet réel (seul le projet démo était instrumenté, via
 * tutorial_step côté GA4). Cette table permet de lire l'entonnoir en SQL, comme le
 * reste de l'analyse produit, sans dépendre de l'interface GA4.
 *
 * Ne doit jamais faire échouer l'action appelante : toute erreur est avalée et
 * loguée, jamais remontée (même logique que grantStreakBonusIfEligible dans
 * ProjectController).
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;

class AnalyticsService
{
    public static function log(int $userId, ?int $projectId, string $eventName, array $data = []): void
    {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                'INSERT INTO analytics_events (user_id, project_id, event_name, event_data)
                 VALUES (:user_id, :project_id, :event_name, :event_data)'
            );
            $stmt->execute([
                ':user_id' => $userId,
                ':project_id' => $projectId,
                ':event_name' => $eventName,
                ':event_data' => $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null,
            ]);
        } catch (\Exception $e) {
            error_log("[ANALYTICS ERROR] {$eventName}: " . $e->getMessage());
        }
    }

    /**
     * [AI:Claude] 2026-09-25 — Jalon unique par utilisatrice (onboarding_started,
     * real_project_started, activation_reached...) : n'insère rien si l'événement existe
     * déjà pour elle, quel que soit l'appareil. Insertion conditionnelle en une requête
     * (index idx_user_event) plutôt qu'un SELECT puis INSERT.
     *
     * Renvoie true seulement si la ligne vient d'être insérée (false si elle existait
     * déjà ou en cas d'erreur) — les appelants qui ne s'en servent pas l'ignorent.
     */
    public static function logOnce(int $userId, ?int $projectId, string $eventName, array $data = []): bool
    {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                'INSERT INTO analytics_events (user_id, project_id, event_name, event_data)
                 SELECT :user_id, :project_id, :event_name, :event_data FROM DUAL
                 WHERE NOT EXISTS (
                     SELECT 1 FROM analytics_events WHERE user_id = :user_id2 AND event_name = :event_name2
                 )'
            );
            $stmt->execute([
                ':user_id' => $userId,
                ':project_id' => $projectId,
                ':event_name' => $eventName,
                ':event_data' => $data ? json_encode($data, JSON_UNESCAPED_UNICODE) : null,
                ':user_id2' => $userId,
                ':event_name2' => $eventName,
            ]);
            return $stmt->rowCount() > 0;
        } catch (\Exception $e) {
            error_log("[ANALYTICS ERROR] {$eventName}: " . $e->getMessage());
            return false;
        }
    }

    public static function hasEvent(int $userId, string $eventName): bool
    {
        try {
            $stmt = Database::getInstance()->getConnection()->prepare(
                'SELECT 1 FROM analytics_events WHERE user_id = :uid AND event_name = :name LIMIT 1'
            );
            $stmt->execute([':uid' => $userId, ':name' => $eventName]);
            return (bool)$stmt->fetchColumn();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * [AI:Claude] 2026-09-25 — paywall_shown pour les murs payants décidés côté serveur
     * (quota assistant, traduction, Création Intelligente, photos). suggested_plan = palier
     * suivant (FREE → PLUS, PLUS → PRO), sans calcul fin par fonctionnalité.
     */
    public static function logPaywall(int $userId, string $source, string $feature, string $reason, ?string $currentPlan): void
    {
        if ($currentPlan === null) {
            try {
                $stmt = Database::getInstance()->getConnection()->prepare('SELECT subscription_type FROM users WHERE id = :id');
                $stmt->execute([':id' => $userId]);
                $currentPlan = $stmt->fetchColumn() ?: null;
            } catch (\Exception $e) {
                $currentPlan = null;
            }
        }
        $currentPlan = $currentPlan ?: 'free';
        $suggestedPlan = match (true) {
            $currentPlan === 'free' => 'plus',
            str_starts_with($currentPlan, 'plus') => 'pro',
            default => null,
        };
        self::log($userId, null, 'paywall_shown', [
            'source' => $source,
            'feature' => $feature,
            'reason' => $reason,
            'current_plan' => $currentPlan,
            'suggested_plan' => $suggestedPlan,
        ]);
    }

    /**
     * [AI:Claude] 2026-09-25 — Comment un projet a été créé, pour real_project_started et
     * activation_reached : 'smart' si un import Création Intelligente y est rattaché
     * (source = pdf/url/text/library), sinon 'manual'. null si le projet n'appartient pas
     * à l'utilisatrice ou est le projet démo — il ne doit alors jamais compter.
     */
    public static function realProjectOrigin(int $userId, int $projectId): ?array
    {
        try {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare(
                'SELECT p.is_demo, i.source_type
                 FROM projects p
                 LEFT JOIN ai_pattern_imports i ON i.project_id = p.id
                 WHERE p.id = :pid AND p.user_id = :uid
                 LIMIT 1'
            );
            $stmt->execute([':pid' => $projectId, ':uid' => $userId]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$row || (int)$row['is_demo'] === 1) {
                return null;
            }
            return $row['source_type']
                ? ['method' => 'smart', 'source' => $row['source_type']]
                : ['method' => 'manual'];
        } catch (\Exception $e) {
            error_log('[ANALYTICS ERROR] realProjectOrigin: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] 2026-09-25 — activation_reached : première progression réelle (rang
     * compté) sur un projet non démo, une seule fois par utilisatrice. Appelé à chaque
     * rang compté, d'où le court-circuit sur l'existence de l'événement avant de lire
     * le projet.
     */
    // Renvoie true uniquement si activation_reached vient d'être enregistré (sert au
    // frontend pour la célébration du premier rang, affichée une seule fois).
    public static function logActivationIfFirst(int $userId, int $projectId): bool
    {
        try {
            if (self::hasEvent($userId, 'activation_reached')) {
                return false;
            }

            $origin = self::realProjectOrigin($userId, $projectId);
            if ($origin === null) {
                return false;
            }

            return self::logOnce($userId, $projectId, 'activation_reached', $origin);
        } catch (\Exception $e) {
            error_log('[ANALYTICS ERROR] activation_reached: ' . $e->getMessage());
            return false;
        }
    }
}
