#!/usr/bin/env php
<?php
/**
 * @file oneshot-user-survey.php
 * @brief Script ONE-SHOT pour envoyer le questionnaire personas à tous les users existants
 * @author YarnFlow Team + AI:Claude
 * @created 2026-09-20
 *
 * ATTENTION: Ce script est prévu pour être exécuté UNE SEULE FOIS.
 * Il envoie un email avec le lien du questionnaire à tous les utilisateurs vérifiés.
 *
 * Prérequis: exécuter database/migrations/add_user_survey_email_type_2026_09.sql
 * avant de lancer ce script (ajout de 'user_survey' à l'ENUM email_type).
 *
 * Usage: php oneshot-user-survey.php [--dry-run]
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

// Lien du formulaire (Google Forms - personas YarnFlow)
const SURVEY_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdjO3MXguWG97Lt0I2PcfFhG3oVCXqjrrjANeH4QCHn4V4hvw/viewform';

// Vérifier les arguments
$dryRun = in_array('--dry-run', $argv);

echo "╔══════════════════════════════════════════════════════════════╗\n";
echo "║  ONE-SHOT: Email 'Questionnaire personas'                    ║\n";
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
        'errors' => 0
    ];

    // Requête pour trouver tous les utilisateurs vérifiés n'ayant pas déjà reçu ce sondage
    echo "[QUERY] Recherche des utilisateurs à contacter...\n";

    // [AI:Claude] email_verified n'est fiable que pour les comptes OAuth
    // (Google/Facebook) : l'inscription classique email/mot de passe ne le
    // met jamais a 1, donc ce filtre exclurait la majorite des vrais users.
    // On cible tous les comptes 'user', hors admin.
    $stmt = $db->prepare("
        SELECT id AS user_id, email, first_name
        FROM users
        WHERE role = 'user'
        AND id NOT IN (
            SELECT user_id
            FROM emails_sent_log
            WHERE email_type = 'user_survey'
            AND user_id IS NOT NULL
        )
        ORDER BY id ASC
    ");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stats['found'] = count($users);
    echo "[INFO] " . $stats['found'] . " utilisateur(s) à contacter\n";
    echo str_repeat("-", 60) . "\n\n";

    // Liste des utilisateurs
    echo "Liste des utilisateurs concernés:\n";
    echo str_repeat("-", 60) . "\n";
    printf("%-4s | %s\n", "ID", "Email");
    echo str_repeat("-", 60) . "\n";

    foreach ($users as $row) {
        printf("%-4d | %s\n", $row['user_id'], $row['email']);
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

        foreach ($users as $row) {
            $userId = (int)$row['user_id'];
            $name = $row['first_name'] ?? 'Utilisatrice';
            echo "[" . date('H:i:s') . "] Envoi à {$row['email']}... ";

            try {
                $success = $emailService->sendUserSurveyEmail(
                    $row['email'],
                    $name,
                    SURVEY_URL,
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
