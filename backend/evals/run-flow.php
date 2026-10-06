<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/src/FlowAdapter.php';
require_once __DIR__ . '/src/Runner.php';

use FlowEval\Runner;
use FlowEval\FlowAdapter;

try {
    $options = Runner::options(array_slice($argv, 1));
    if ($options['help']) {
        echo "Usage: php backend/evals/run-flow.php [--run] [--scenario all|ID] [--repeat 1..20]\n"
            . "Sans --run : affiche le plan, aucun appel réseau. Avec --run : appels Gemini facturables.\n";
        exit(0);
    }
    $suite = require __DIR__ . '/scenarios.php';
    $scenarios = Runner::select($suite, $options['scenario']);
    $turns = array_sum(array_map(static fn(array $s): int => count($s['turns']), $scenarios)) * $options['repeat'];
    echo count($scenarios) . " scénarios, {$options['repeat']} répétitions, au plus {$turns} générations (hors reprises HTTP de Flow).\n";
    foreach ($scenarios as $scenario) echo "- {$scenario['id']} : {$scenario['title']}\n";
    if (!$options['run']) exit(0);

    // Ne pas charger le bootstrap HTTP : ni connexion BDD, ni middleware, ni événements.
    \Dotenv\Dotenv::createImmutable(__DIR__ . '/..')->safeLoad();
    \Dotenv\Dotenv::createMutable(__DIR__ . '/..', '.env.local')->safeLoad();
    $apiKey = $_ENV['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY');
    if (!is_string($apiKey) || $apiKey === '') throw new \InvalidArgumentException('GEMINI_API_KEY manque dans l’environnement ou dans backend/.env[.local].');
    $directory = __DIR__ . '/results/' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3));
    echo "Artefacts : {$directory}\n";
    $metadata = Runner::metadata(dirname(__DIR__, 2));
    $transport = static function (array $prepared, array $scenario) use ($apiKey): array {
        $adapter = new FlowAdapter($scenario);
        try {
            $response = $adapter->generate($prepared, $apiKey);
        } catch (\GuzzleHttp\Exception\RequestException $error) {
            if (!$error->getResponse()) throw $error;
            $response = ['http_status' => $error->getResponse()->getStatusCode(), 'body' => $error->getResponse()->getBody()->getContents()];
        }
        $response['body'] = str_replace([$apiKey, rawurlencode($apiKey)], '[REDACTED]', $response['body']);
        return $response;
    };
    $finishedTurns = 0;
    $result = Runner::evaluate($scenarios, $options['repeat'], $transport, $metadata,
        static function (array $partial) use ($directory, &$finishedTurns): void {
            Runner::save($partial, $directory);
            $count = 0;
            foreach ($partial['runs'] as $run) foreach ($run['turns'] as $turn) {
                if ($turn['execution_status'] !== 'pending') $count++;
            }
            if ($count > $finishedTurns) echo "{$count} tours terminés (résultats sauvegardés).\n";
            $finishedTurns = $count;
        });
    echo "Résultats : {$directory}\n";
    $technical = 0;
    foreach ($result['runs'] as $run) foreach ($run['turns'] as $turn) if ($turn['technical_error']) $technical++;
    echo "{$technical} erreurs techniques. Qualité sémantique : à relire avec la grille humaine.\n";
    exit($technical > 0 ? 2 : 0);
} catch (\InvalidArgumentException $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
} catch (\Throwable $error) {
    // Ne pas afficher les exceptions du client HTTP, dont les URL portent la clé.
    fwrite(STDERR, 'Évaluation interrompue (' . get_class($error) . "). Vérifier la configuration et les artefacts éventuels.\n");
    exit(1);
}
