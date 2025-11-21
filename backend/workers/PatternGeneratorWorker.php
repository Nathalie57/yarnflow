<?php
/**
 * @file PatternGeneratorWorker.php
 * @brief Worker pour traiter les jobs de génération de patrons en arrière-plan
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création du worker asynchrone avec validation
 *
 * @history
 *   2025-11-14 [AI:Claude] Création initiale avec validation et retry automatique
 */

declare(strict_types=1);

namespace App\Workers;

use App\Models\Job;
use App\Models\Pattern;
use App\Models\User;
use App\Services\AIPatternService;
use App\Services\PatternValidationService;

/**
 * [AI:Claude] Worker qui traite les jobs de génération de patrons
 * Tourne en boucle et traite les jobs disponibles dans la queue
 */
class PatternGeneratorWorker
{
    private Job $jobModel;
    private Pattern $patternModel;
    private User $userModel;
    private AIPatternService $aiService;
    private PatternValidationService $validationService;
    private string $workerName;
    private bool $shouldStop = false;

    public function __construct()
    {
        $this->jobModel = new Job();
        $this->patternModel = new Pattern();
        $this->userModel = new User();
        $this->aiService = new AIPatternService();
        $this->validationService = new PatternValidationService();
        $this->workerName = 'worker_'.getmypid();

        // [AI:Claude] Gestion propre de l'arrêt du worker
        pcntl_signal(SIGTERM, [$this, 'handleShutdown']);
        pcntl_signal(SIGINT, [$this, 'handleShutdown']);
    }

    /**
     * [AI:Claude] Démarrer le worker
     *
     * @param int $sleepSeconds Temps d'attente entre chaque vérification de la queue
     * @return void
     */
    public function start(int $sleepSeconds = 5): void
    {
        $this->log('Worker démarré : '.$this->workerName);

        while (!$this->shouldStop) {
            pcntl_signal_dispatch();

            // [AI:Claude] Libérer les jobs bloqués avant de commencer
            $released = $this->jobModel->releaseStuckJobs(15);
            if ($released > 0)
                $this->log("Jobs bloqués libérés : {$released}");

            // [AI:Claude] Réserver un job disponible
            $job = $this->jobModel->reserveNextJob(
                $this->workerName,
                [Job::TYPE_GENERATE_PATTERN]
            );

            if ($job) {
                $this->log("Job #{$job['id']} réservé (tentative {$job['attempts']}/{$job['max_attempts']})");
                $this->processJob($job);
            } else {
                // [AI:Claude] Aucun job disponible, on attend
                sleep($sleepSeconds);
            }
        }

        $this->log('Worker arrêté proprement');
    }

    /**
     * [AI:Claude] Traiter un job de génération de patron
     *
     * @param array $job Données du job
     * @return void
     */
    private function processJob(array $job): void
    {
        $startTime = microtime(true);
        $payload = $job['payload'];

        try {
            $patternId = $payload['pattern_id'];
            $userId = $payload['user_id'];
            $params = $payload['params'];

            $this->log("Génération du patron #{$patternId} pour utilisateur #{$userId}");

            // [AI:Claude] Générer le patron via l'IA
            $result = $this->aiService->generatePattern($params);

            if (!$result['success'])
                throw new \Exception($result['error'] ?? 'Erreur inconnue');

            // [AI:Claude] Validation stricte du contenu généré
            $validationResult = $this->validationService->validatePattern(
                $result['pattern'],
                $params
            );

            if (!$validationResult['valid']) {
                $errorMsg = 'Patron invalide : ' . implode(', ', $validationResult['errors']);
                $this->log($errorMsg, 'WARNING');
                throw new \Exception($errorMsg);
            }

            // [AI:Claude] Logger les warnings même si valide
            if (!empty($validationResult['warnings'])) {
                $warningsMsg = 'Warnings : ' . implode(', ', $validationResult['warnings']);
                $this->log($warningsMsg, 'WARNING');
            }

            // [AI:Claude] Calculer le score de qualité
            $qualityScore = $this->validationService->calculateQualityScore($validationResult);
            $this->log("Score de qualité : {$qualityScore}/100");

            // [AI:Claude] Sauvegarder le patron
            $this->patternModel->saveGeneratedContent($patternId, $result['pattern']);
            $this->patternModel->saveAiMetadata(
                $patternId,
                $result['provider'],
                'Auto-generated',
                $result['tokens_used'] ?? null
            );

            // [AI:Claude] Ajouter le filigrane
            $user = $this->userModel->findById($userId);
            if ($user)
                $this->patternModel->setWatermark($patternId, $user['email']);

            // [AI:Claude] Incrémenter le compteur utilisateur
            $this->userModel->incrementPatternCount($userId);

            // [AI:Claude] Marquer le job comme complété
            $this->jobModel->markAsCompleted($job['id']);

            $duration = round(microtime(true) - $startTime, 2);
            $this->log("Job #{$job['id']} complété avec succès en {$duration}s");

        } catch (\Exception $e) {
            $this->log("Job #{$job['id']} échoué : ".$e->getMessage(), 'ERROR');

            // [AI:Claude] Marquer le pattern en erreur si échec définitif
            if ($job['attempts'] >= $job['max_attempts'])
                $this->patternModel->saveError($payload['pattern_id'], $e->getMessage());

            // [AI:Claude] Marquer le job comme échoué (avec retry si possible)
            $this->jobModel->markAsFailed($job['id'], $e->getMessage());

            $duration = round(microtime(true) - $startTime, 2);
            $this->log("Job #{$job['id']} marqué comme échoué après {$duration}s");
        }
    }

    /**
     * [AI:Claude] Logger un message avec timestamp
     *
     * @param string $message Message à logger
     * @param string $level Niveau de log (INFO, ERROR, WARNING)
     * @return void
     */
    private function log(string $message, string $level = 'INFO'): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $formattedMessage = "[{$timestamp}] [{$level}] [{$this->workerName}] {$message}";

        echo $formattedMessage.PHP_EOL;
        error_log($formattedMessage);
    }

    /**
     * [AI:Claude] Gérer l'arrêt propre du worker
     *
     * @return void
     */
    public function handleShutdown(): void
    {
        $this->log('Signal d\'arrêt reçu...');
        $this->shouldStop = true;
    }

    /**
     * [AI:Claude] Obtenir les statistiques du worker
     *
     * @return array Stats de la queue
     */
    public function getStats(): array
    {
        return $this->jobModel->getQueueStats();
    }
}
