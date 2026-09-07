<?php
/**
 * Cron : purge les lignes ravelry_oauth_pending de plus d'1h.
 *
 * Contexte : le flux OAuth2 Ravelry stocke un état CSRF temporaire dans cette
 * table (pas de session PHP côté backend) le temps que l'utilisatrice revienne
 * du site Ravelry. Si elle abandonne en cours de route, la ligne reste orpheline.
 *
 * Commande cron (o2switch), toutes les heures : 0 * * * * php /path/to/backend/cron/clean-ravelry-oauth-pending.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

const STALE_AFTER_HOURS = 1;

try {
    $pdo = Database::getInstance()->getConnection();
} catch (Exception $e) {
    error_log('[CRON clean-ravelry-oauth-pending] Connexion DB échouée : ' . $e->getMessage());
    exit(1);
}

$stmt = $pdo->prepare(
    "DELETE FROM ravelry_oauth_pending WHERE created_at < DATE_SUB(NOW(), INTERVAL :hours HOUR)"
);
$stmt->bindValue(':hours', STALE_AFTER_HOURS, PDO::PARAM_INT);
$stmt->execute();

echo "Purgé {$stmt->rowCount()} état(s) OAuth Ravelry orphelin(s).\n";
