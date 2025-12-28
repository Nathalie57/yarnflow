<?php
/**
 * @file send-notifications.php
 * @brief Script cron pour envoyer les notifications email automatiques
 * @author YarnFlow Team + AI Assistants
 * @created 2025-12-28
 *
 * Usage: php /path/to/backend/cron/send-notifications.php
 * Cron: 0 9 * * * php /path/to/backend/cron/send-notifications.php >> /var/log/yarnflow-notifications.log 2>&1
 */

// Désactiver l'affichage des erreurs (mais les logger)
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Chemin vers le dossier racine du backend
$backendRoot = dirname(__DIR__);

// Charger l'autoloader Composer
require_once $backendRoot . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable($backendRoot);
$dotenv->load();

use App\Config\Database;
use App\Services\NotificationService;

// Fonction pour logger avec timestamp
function logMessage(string $message): void
{
    $timestamp = date('Y-m-d H:i:s');
    echo "[{$timestamp}] {$message}\n";
}

try {
    logMessage("=== DÉBUT ENVOI NOTIFICATIONS EMAIL ===");

    // Connexion à la base de données
    $db = Database::getInstance()->getConnection();
    logMessage("✅ Connexion BDD établie");

    // Initialiser le service de notifications
    $notificationService = new NotificationService($db);

    // Envoyer toutes les notifications
    $results = $notificationService->sendAllNotifications();

    // Afficher les résultats
    if ($results['success']) {
        logMessage("✅ " . $results['summary']);
        logMessage("");

        // Détails par type
        foreach ($results['details'] as $type => $detail) {
            if (isset($detail['message'])) {
                logMessage("  - " . $detail['message']);
            }
        }
    } else {
        logMessage("❌ Erreur lors de l'envoi des notifications");
        if (isset($results['error'])) {
            logMessage("   Erreur: " . $results['error']);
        }
    }

    logMessage("=== FIN ENVOI NOTIFICATIONS EMAIL ===");
    logMessage("");

    // Code de sortie 0 = succès
    exit(0);

} catch (\Exception $e) {
    logMessage("❌ ERREUR CRITIQUE: " . $e->getMessage());
    logMessage("   Trace: " . $e->getTraceAsString());

    // Code de sortie 1 = erreur
    exit(1);
}
