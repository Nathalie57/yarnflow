<?php
declare(strict_types=1);

namespace App\Services;

final class SmartCreationTrackingService
{
    public const STAGES = ['source_selected', 'left_during_analysis', 'gate_shown', 'notice_shown', 'notice_clicked'];

    public static function startedData(string $attemptId, string $sourceType): array
    {
        return ['attempt_id' => $attemptId, 'source' => $sourceType, 'source_type' => $sourceType];
    }
    public static function normalizeAttemptId(?string $attemptId): string
    {
        $attemptId = trim((string)$attemptId);
        if (preg_match('/^[a-zA-Z0-9-]{16,64}$/', $attemptId)) {
            return $attemptId;
        }
        return bin2hex(random_bytes(16));
    }

    public static function gateTypes(?array $data, string $status, ?string $targetLanguage = null): array
    {
        $types = [];
        if (!empty($data['contains_diagram'])) $types[] = 'diagram';
        if ($status === 'partial') $types[] = 'partial';

        // La porte de traduction n'est affichée que lorsqu'aucun avertissement prioritaire
        // (diagramme/partiel) n'est présent.
        $sourceLanguage = strtolower(substr((string)($data['language'] ?? ''), 0, 2));
        $targetLanguage = strtolower(substr((string)$targetLanguage, 0, 2));
        if (!$types && $sourceLanguage && $targetLanguage && $sourceLanguage !== $targetLanguage) {
            $types[] = 'translation';
        }
        return $types;
    }

    public static function completionData(
        string $attemptId,
        string $sourceType,
        string $status,
        bool $cached,
        int $processingTimeMs,
        ?int $importId = null,
        ?string $errorCode = null,
        array $gateTypes = []
    ): array {
        $data = [
            'attempt_id' => $attemptId,
            'source' => $sourceType, // compatibilité avec les événements historiques
            'source_type' => $sourceType,
            'status' => $status,
            'cached' => $cached,
            'processing_time_ms' => max(0, $processingTimeMs),
        ];
        if ($importId !== null) $data['import_id'] = $importId;
        if ($errorCode) $data['error_code'] = $errorCode;
        if ($errorCode === 'analyze_already_in_progress') $data['reason'] = 'already_in_progress';
        if ($gateTypes) {
            $data['gate_type'] = $gateTypes[0];
            $data['gate_types'] = array_values(array_unique($gateTypes));
        }
        return $data;
    }
}
