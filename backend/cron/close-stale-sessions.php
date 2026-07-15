<?php
/**
 * Cron : referme les sessions de travail (project_sessions) restées ouvertes
 * (ended_at IS NULL) depuis plus de 6 heures.
 *
 * Contexte : la fermeture normale d'une session dépend soit d'un clic
 * explicite sur "Stop", soit de l'événement navigateur `beforeunload` — qui
 * ne se déclenche pas de façon fiable sur mobile/PWA quand l'app est mise en
 * arrière-plan ou tuée par l'OS. `Project::startSession()` referme déjà les
 * sessions abandonnées du même projet quand on en démarre une nouvelle, mais
 * si l'utilisateur ne revient jamais sur ce projet, la ligne reste orpheline
 * indéfiniment. Ce cron couvre ce cas.
 *
 * La durée recréditée est plafonnée (3h) pour ne pas polluer les stats avec
 * une session restée ouverte des heures/jours durant.
 *
 * Commande cron (o2switch), toutes les 6h : 0 0,6,12,18 * * * php /path/to/backend/cron/close-stale-sessions.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\Project;

const STALE_AFTER_HOURS = 6;
const MAX_CREDITED_DURATION_SECONDS = 10800; // 3h

$configPath = __DIR__ . '/../config/database.php';
if (!file_exists($configPath)) {
    error_log('[CRON close-stale-sessions] Config DB introuvable');
    exit(1);
}

$dbConfig = require $configPath;

try {
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    error_log('[CRON close-stale-sessions] Connexion DB échouée : ' . $e->getMessage());
    exit(1);
}

$staleQuery = $pdo->prepare(
    "SELECT id, project_id FROM project_sessions
     WHERE ended_at IS NULL AND started_at < DATE_SUB(NOW(), INTERVAL :hours HOUR)"
);
$staleQuery->bindValue(':hours', STALE_AFTER_HOURS, PDO::PARAM_INT);
$staleQuery->execute();
$staleSessions = $staleQuery->fetchAll(PDO::FETCH_ASSOC);

if (empty($staleSessions)) {
    echo "Aucune session orpheline à fermer.\n";
    exit(0);
}

$projectModel = new Project();
$closed = 0;

foreach ($staleSessions as $row) {
    $projectModel->closeDanglingSessions((int) $row['project_id'], MAX_CREDITED_DURATION_SECONDS);
    $closed++;
}

echo "Fermé {$closed} session(s) orpheline(s) sur " . count(array_unique(array_column($staleSessions, 'project_id'))) . " projet(s).\n";
