#!/usr/bin/env php
<?php
/**
 * @file worker.php
 * @brief Script CLI pour lancer le worker de génération de patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-14 by [AI:Claude] - Création du script CLI worker
 *
 * @history
 *   2025-11-14 [AI:Claude] Création initiale avec gestion signaux
 */

declare(strict_types=1);

// [AI:Claude] Vérifier que le script est lancé en CLI
if (php_sapi_name() !== 'cli') {
    die('Ce script doit être lancé en ligne de commande' . PHP_EOL);
}

// [AI:Claude] Charger l'autoloader Composer
require_once __DIR__ . '/../vendor/autoload.php';

// [AI:Claude] Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../config');
$dotenv->load();

// [AI:Claude] Charger les constantes globales
require_once __DIR__ . '/../config/constants.php';

// [AI:Claude] Importer le worker
use App\Workers\PatternGeneratorWorker;

// [AI:Claude] Afficher le banner de démarrage
echo "\n";
echo "╔════════════════════════════════════════════╗\n";
echo "║   🧶 Crochet Hub - Pattern Worker 🧶     ║\n";
echo "╚════════════════════════════════════════════╝\n";
echo "\n";

// [AI:Claude] Parser les arguments
$options = getopt('h::s::', ['help::', 'sleep::']);

if (isset($options['h']) || isset($options['help'])) {
    showHelp();
    exit(0);
}

$sleepSeconds = (int)($options['s'] ?? $options['sleep'] ?? 5);

if ($sleepSeconds < 1 || $sleepSeconds > 60) {
    echo "❌ Erreur : Le délai doit être entre 1 et 60 secondes\n\n";
    showHelp();
    exit(1);
}

// [AI:Claude] Vérifier que les extensions nécessaires sont installées
if (!extension_loaded('pcntl')) {
    echo "⚠️  Attention : L'extension pcntl n'est pas installée.\n";
    echo "   Le worker fonctionnera mais ne gérera pas les signaux proprement.\n\n";
}

// [AI:Claude] Créer et démarrer le worker
try {
    echo "🚀 Démarrage du worker...\n";
    echo "⏱️  Intervalle de polling : {$sleepSeconds}s\n";
    echo "🔄 Appuyez sur Ctrl+C pour arrêter proprement\n";
    echo "\n";
    echo str_repeat('─', 50) . "\n\n";

    $worker = new PatternGeneratorWorker();

    // [AI:Claude] Afficher les stats initiales
    $stats = $worker->getStats();
    echo "📊 Stats de la queue :\n";
    echo "   - En attente : {$stats['pending']}\n";
    echo "   - En cours : {$stats['processing']}\n";
    echo "   - Complétés : {$stats['completed']}\n";
    echo "   - Échoués : {$stats['failed']}\n";
    echo "\n" . str_repeat('─', 50) . "\n\n";

    // [AI:Claude] Démarrer le worker
    $worker->start($sleepSeconds);

} catch (\Exception $e) {
    echo "\n❌ Erreur fatale : " . $e->getMessage() . "\n";
    echo "Trace : " . $e->getTraceAsString() . "\n";
    exit(1);
}

/**
 * [AI:Claude] Afficher l'aide
 */
function showHelp(): void
{
    echo "Usage: php worker.php [OPTIONS]\n\n";
    echo "Options:\n";
    echo "  -h, --help         Afficher cette aide\n";
    echo "  -s, --sleep <sec>  Délai entre chaque vérification de la queue (défaut: 5s)\n\n";
    echo "Exemples:\n";
    echo "  php worker.php                    # Démarrer avec les paramètres par défaut\n";
    echo "  php worker.php --sleep 10         # Vérifier la queue toutes les 10 secondes\n";
    echo "  php worker.php -s 2               # Vérifier la queue toutes les 2 secondes\n\n";
    echo "Gestion:\n";
    echo "  Ctrl+C                            # Arrêter le worker proprement\n";
    echo "  kill -TERM <pid>                  # Arrêter le worker via signal\n\n";
}
