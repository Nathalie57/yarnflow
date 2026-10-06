<?php

declare(strict_types=1);

namespace FlowEval;

final class Runner
{
    public static function options(array $args): array
    {
        $options = ['scenario' => 'all', 'repeat' => 3, 'run' => false, 'help' => false];
        for ($i = 0; $i < count($args); $i++) {
            $arg = $args[$i];
            if ($arg === '--run') $options['run'] = true;
            elseif ($arg === '--help') $options['help'] = true;
            elseif (in_array($arg, ['--scenario', '--repeat'], true)) {
                if (!isset($args[$i + 1])) throw new \InvalidArgumentException('Missing option value: ' . $arg);
                $options[substr($arg, 2)] = $args[++$i];
            } else throw new \InvalidArgumentException('Unknown option: ' . $arg);
        }
        if (!ctype_digit((string)$options['repeat']) || (int)$options['repeat'] < 1 || (int)$options['repeat'] > 20) {
            throw new \InvalidArgumentException('--repeat must be between 1 and 20');
        }
        $options['repeat'] = (int)$options['repeat'];
        return $options;
    }

    public static function select(array $scenarios, string $id): array
    {
        $selected = $id === 'all' ? $scenarios : array_values(array_filter($scenarios, static fn(array $s): bool => $s['id'] === $id));
        if (!$selected) throw new \InvalidArgumentException('Unknown scenario: ' . $id);
        return $selected;
    }

    /** Le transport injecté est simulé dans les tests ; seul le CLI --run utilise Gemini. */
    public static function evaluate(array $scenarios, int $repeat, callable $transport, array $metadata, ?callable $checkpoint = null): array
    {
        $result = ['schema_version' => 1, 'started_at' => gmdate('c'), 'completed_at' => null,
            'metadata' => $metadata, 'repeat' => $repeat, 'scenarios' => $scenarios, 'runs' => []];
        if ($checkpoint) $checkpoint($result);
        foreach ($scenarios as $scenario) {
            for ($iteration = 1; $iteration <= $repeat; $iteration++) {
                $adapter = new FlowAdapter($scenario);
                $history = $scenario['history'];
                $run = ['scenario_id' => $scenario['id'], 'iteration' => $iteration, 'turns' => [],
                    'human_review' => array_map(static fn(string $criterion): array => [
                        'criterion' => $criterion, 'status' => 'indéterminé', 'evidence' => '',
                    ], $scenario['criteria'])];
                $runIndex = count($result['runs']);
                $result['runs'][] = $run;
                foreach ($scenario['turns'] as $index => $question) {
                    $history[] = ['role' => 'user', 'content' => $question];
                    $turn = ['turn' => $index + 1, 'input_messages' => $history, 'request' => null,
                        'execution_status' => 'pending',
                        'raw_response' => null, 'display' => null, 'technical_error' => null,
                        'automatic_checks' => [], 'warnings' => []];
                    $start = microtime(true);
                    try {
                        $turn['request'] = $adapter->prepare($scenario, $history);
                        if ($checkpoint) {
                            $pendingRun = $run;
                            $pendingRun['turns'][] = $turn;
                            $result['runs'][$runIndex] = $pendingRun;
                            $checkpoint($result);
                        }
                        $turn['raw_response'] = $transport($turn['request'], $scenario);
                        $status = $turn['raw_response']['http_status'] ?? 0;
                        if ($status < 200 || $status >= 300) throw new \RuntimeException('HTTP response not successful');
                        $raw = json_decode($turn['raw_response']['body'], true, 512, JSON_THROW_ON_ERROR);
                        if (!is_array($raw)) throw new \RuntimeException('Invalid Gemini response structure');
                        $turn['display'] = FlowAdapter::display($raw);
                        if ($turn['display']['error'] !== null) {
                            $turn['technical_error'] = ['type' => $turn['display']['error']];
                        } else {
                            $reply = $turn['display']['reply'];
                            $turn['automatic_checks'] = [
                                'nonempty_display_reply' => trim($reply) !== '',
                                'internal_markers_removed' => !str_contains($reply, '###SUGGESTIONS###') && !str_contains($reply, '###TRANSLATE_REQUEST###'),
                            ];
                            if (mb_strlen($reply) > 1600) $turn['warnings'][] = 'Long response: review concision; this is not a semantic failure.';
                            if (count($turn['display']['suggestions']) > 2) $turn['warnings'][] = 'More than two follow-up suggestions.';
                            $history[] = ['role' => 'assistant', 'content' => $reply];
                        }
                    } catch (\Throwable $error) {
                        // Les exceptions HTTP peuvent contenir une URL avec la clé API.
                        // Ne jamais enregistrer leur message ni leur trace.
                        $turn['technical_error'] = ['type' => get_class($error),
                            'http_status' => $turn['raw_response']['http_status'] ?? null];
                    }
                    $turn['duration_seconds'] = round(microtime(true) - $start, 4);
                    $turn['execution_status'] = $turn['technical_error'] === null ? 'completed' : 'technical_error';
                    $run['turns'][] = $turn;
                    $result['runs'][$runIndex] = $run;
                    if ($checkpoint) $checkpoint($result);
                    if ($turn['technical_error'] !== null) break;
                }
            }
        }
        $result['completed_at'] = gmdate('c');
        if ($checkpoint) $checkpoint($result);
        return $result;
    }

    public static function report(array $result): string
    {
        $metadata = $result['metadata'];
        $dirty = $metadata['dirty'] ?? null;
        $text = "# Évaluation Flow\n\nCommit : " . ($metadata['commit'] ?? 'inconnu')
            . "\n\nÉtat local : " . ($dirty === null ? 'inconnu' : ($dirty ? 'modifié' : 'propre'))
            . "\n\nDébut : {$result['started_at']} — répétitions : {$result['repeat']}\n\n"
            . "Aucun verdict sémantique automatique. Les contrôles mécaniques et les erreurs techniques ne remplacent pas la grille humaine.\n"
            . "Le JSON est la référence. Statuts autorisés : conforme / non conforme / indéterminé. Renseigner un extrait justificatif.\n";
        foreach ($result['runs'] as $run) {
            $text .= "\n## {$run['scenario_id']} — répétition {$run['iteration']}\n";
            foreach ($run['turns'] as $turn) {
                $text .= "\n### Tour {$turn['turn']}\n\n";
                if ($turn['request']) $text .= 'Modèle : ' . $turn['request']['model'] . ' — empreinte du prompt : ' . $turn['request']['prompt_sha256'] . "\n\n";
                $question = $turn['input_messages'][count($turn['input_messages']) - 1]['content'];
                $text .= "Question :\n\n" . self::quote($question) . "\n\n";
                if (($turn['execution_status'] ?? '') === 'pending') {
                    $text .= "Génération en attente lors de la sauvegarde ; aucune réponse évaluée.\n";
                } elseif ($turn['technical_error']) {
                    $text .= 'Erreur technique : ' . $turn['technical_error']['type'] . "\n";
                } else {
                    $text .= "Réponse affichable :\n\n" . self::quote($turn['display']['reply']) . "\n\n";
                    foreach ($turn['display']['suggestions'] as $suggestion) $text .= 'Suggestion : ' . self::quote($suggestion) . "\n\n";
                    $text .= 'Contrôles mécaniques : ' . json_encode($turn['automatic_checks'], JSON_UNESCAPED_UNICODE) . "\n";
                }
                foreach ($turn['warnings'] as $warning) $text .= "\nAvertissement : {$warning}\n";
                if (isset($turn['duration_seconds'])) $text .= "\nDurée : {$turn['duration_seconds']} s\n";
            }
            $text .= "\nGrille humaine :\n\n";
            foreach ($run['human_review'] as $criterion) {
                $text .= '- **' . $criterion['status'] . '** — ' . $criterion['criterion']
                    . ($criterion['evidence'] !== '' ? ' Justification : ' . $criterion['evidence'] : '') . "\n";
            }
        }
        return $text;
    }

    private static function quote(string $text): string { return '> ' . str_replace("\n", "\n> ", trim($text)); }

    public static function save(array $result, string $directory): void
    {
        if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new \RuntimeException('Cannot create results directory');
        $json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        if (file_put_contents($directory . '/results.json.tmp', $json) === false
            || !rename($directory . '/results.json.tmp', $directory . '/results.json')
            || file_put_contents($directory . '/report.md', self::report($result)) === false) {
            throw new \RuntimeException('Cannot save evaluation artifacts');
        }
    }

    public static function metadata(string $root): array
    {
        $git = static function (array $args) use ($root): ?string {
            $process = proc_open(array_merge(['git', '-C', $root], $args), [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
            if (!is_resource($process)) return null;
            $output = stream_get_contents($pipes[1]);
            stream_get_contents($pipes[2]);
            fclose($pipes[1]); fclose($pipes[2]);
            return proc_close($process) === 0 ? rtrim($output) : null;
        };
        $status = $git(['status', '--porcelain', '--untracked-files=all']);
        $files = array_merge([
            $root . '/backend/controllers/AiAssistantController.php',
            $root . '/backend/services/AIPatternExtractorService.php',
            $root . '/backend/services/PatternExtractionValidator.php',
            $root . '/backend/services/FlowContextGuidance.php',
            $root . '/backend/composer.lock',
        ], glob($root . '/backend/services/FlowPattern*.php'), glob($root . '/backend/evals/src/*.php'),
            [$root . '/backend/evals/scenarios.php', $root . '/backend/evals/run-flow.php']);
        $hashes = [];
        foreach ($files as $file) if (is_file($file)) $hashes[substr($file, strlen($root) + 1)] = hash_file('sha256', $file);
        return ['commit' => $git(['rev-parse', 'HEAD']), 'dirty' => $status === null ? null : $status !== '',
            'git_status' => $status, 'source_sha256' => $hashes, 'php_version' => PHP_VERSION,
            'protocol' => 'flow-eval-v1', 'network_mode' => 'explicit_cli_only'];
    }
}
