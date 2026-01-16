#!/usr/bin/env php
<?php
/**
 * @file oneshot-project-start-reminder.php
 * @brief Script ONE-SHOT pour envoyer l'email "projet créé mais jamais utilisé" à tous les users existants
 * @author YarnFlow Team + AI:Claude
 * @created 2026-01-16
 *
 * ATTENTION: Ce script est prévu pour être exécuté UNE SEULE FOIS.
 * Il envoie un email à tous les utilisateurs qui ont créé un projet mais n'ont jamais utilisé le compteur.
 *
 * Usage: php oneshot-project-start-reminder.php [--dry-run]
 *   --dry-run : Affiche les utilisateurs concernés sans envoyer d'emails
 */

declare(strict_types=1);

// Afficher toutes les erreurs PHP
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Charger l'environnement
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\EmailService;

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Vérifier les arguments
$dryRun = in_array('--dry-run', $argv);

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║  ONE-SHOT: Email 'Projet créé mais jamais utilisé'           ║\n";
echo "╠══════════════════════════════════════════════════════════════╣\n";
if ($dryRun) {
    echo "║  MODE: DRY-RUN (aucun email ne sera envoyé)                  ║\n";
} else {
    echo "║  MODE: ENVOI RÉEL                                            ║\n";
}
echo "╚══════════════════════════════════════════════════════════════╝\n";
echo "\n";
echo "[START] " . date('Y-m-d H:i:s') . "\n\n";

try {
    $db = Database::getInstance()->getConnection();
    $emailService = new EmailService($db);

    $stats = [
        'found' => 0,
        'sent' => 0,
        'skipped' => 0,
        'errors' => 0
    ];

    // Requête pour trouver tous les utilisateurs avec projets créés mais 0 rangs
    // Les rangs peuvent être dans : projects.current_row, project_sections.current_row, ou project_rows
    // Exclure ceux qui ont déjà reçu cet email
    echo "[QUERY] Recherche des utilisateurs avec projets non utilisés...\n";

    $stmt = $db->prepare("
        SELECT
            u.id AS user_id,
            u.email,
            u.first_name,
            u.created_at AS user_created_at,
            p.id AS project_id,
            p.name AS project_name,
            p.created_at AS project_created_at,
            COALESCE(p.current_row, 0) AS project_current_row,
            COALESCE((SELECT SUM(current_row) FROM project_sections ps WHERE ps.project_id = p.id), 0) AS sections_total_rows,
            (SELECT COUNT(*) FROM project_rows pr WHERE pr.project_id = p.id) AS project_rows_count
        FROM users u
        INNER JOIN projects p ON p.user_id = u.id
        WHERE u.id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'project_start_reminder'
            AND user_id IS NOT NULL
        )
        AND COALESCE(p.current_row, 0) = 0
        AND COALESCE((SELECT SUM(current_row) FROM project_sections ps WHERE ps.project_id = p.id), 0) = 0
        AND (SELECT COUNT(*) FROM project_rows pr WHERE pr.project_id = p.id) = 0
        ORDER BY u.id ASC, p.created_at DESC
    ");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "[QUERY] Trouvé " . count($results) . " projet(s) sans rangs comptés\n\n";

    // Grouper par utilisateur (un seul email par user, avec le projet le plus récent)
    $userProjects = [];
    foreach ($results as $row) {
        $userId = (int)$row['user_id'];
        if (!isset($userProjects[$userId])) {
            $userProjects[$userId] = $row; // Premier = le plus récent (ORDER BY p.created_at DESC)
        }
    }

    $stats['found'] = count($userProjects);
    echo "[INFO] " . $stats['found'] . " utilisateur(s) unique(s) à contacter\n";
    echo str_repeat("-", 60) . "\n\n";

    // Liste des utilisateurs
    echo "Liste des utilisateurs concernés:\n";
    echo str_repeat("-", 60) . "\n";
    printf("%-4s | %-35s | %s\n", "ID", "Email", "Projet");
    echo str_repeat("-", 60) . "\n";

    foreach ($userProjects as $userId => $row) {
        $email = mb_substr($row['email'], 0, 35);
        $projectName = mb_substr($row['project_name'], 0, 20);
        printf("%-4d | %-35s | %s\n", $userId, $email, $projectName);
    }

    echo str_repeat("-", 60) . "\n\n";

    if ($dryRun) {
        echo "[DRY-RUN] Aucun email envoyé. Relancez sans --dry-run pour envoyer.\n\n";
    } else {
        // Confirmation avant envoi
        echo "⚠️  ATTENTION: Vous êtes sur le point d'envoyer " . $stats['found'] . " emails.\n";
        echo "Tapez 'OUI' pour confirmer: ";

        $handle = fopen("php://stdin", "r");
        $confirmation = trim(fgets($handle));
        fclose($handle);

        if ($confirmation !== 'OUI') {
            echo "\n[ABORT] Annulé par l'utilisateur.\n";
            exit(0);
        }

        echo "\n[SEND] Début de l'envoi...\n";
        echo str_repeat("-", 60) . "\n";

        foreach ($userProjects as $userId => $row) {
            echo "[" . date('H:i:s') . "] Envoi à {$row['email']} (projet: {$row['project_name']})... ";

            try {
                $success = $emailService->sendProjectStartReminderEmail(
                    $row['email'],
                    $row['first_name'] ?? 'Utilisateur',
                    $row['project_name'],
                    $userId
                );

                if ($success) {
                    echo "✓ OK\n";
                    $stats['sent']++;
                } else {
                    echo "✗ ÉCHEC\n";
                    $stats['errors']++;
                }
            } catch (Exception $e) {
                echo "✗ ERREUR: {$e->getMessage()}\n";
                $stats['errors']++;
            }

            // Rate limiting : 2 secondes entre chaque email
            sleep(2);
        }
    }

    // Résumé final
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "RÉSUMÉ\n";
    echo str_repeat("=", 60) . "\n";
    echo "Utilisateurs trouvés  : {$stats['found']}\n";
    if (!$dryRun) {
        echo "Emails envoyés        : {$stats['sent']}\n";
        echo "Erreurs               : {$stats['errors']}\n";
    }
    echo str_repeat("=", 60) . "\n";

    echo "\n[END] " . date('Y-m-d H:i:s') . "\n";

} catch (Exception $e) {
    echo "[ERREUR FATALE] " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}

exit(0);
