<?php
/**
 * Test d'envoi d'email via EmailService
 * À SUPPRIMER après tests
 */

require_once __DIR__.'/../config/bootstrap.php';

use App\Services\EmailService;

header('Content-Type: application/json');

try {
    $emailService = new EmailService();

    // Test de connexion SMTP
    $connectionTest = $emailService->testConnection();

    if (!$connectionTest['success']) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Échec test connexion SMTP',
            'error' => $connectionTest['message']
        ]);
        exit;
    }

    // Récupérer l'email de test depuis query param
    $testEmail = $_GET['email'] ?? null;

    if (!$testEmail) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Paramètre "email" manquant',
            'usage' => 'test-email.php?email=votre@email.com'
        ]);
        exit;
    }

    // Envoyer l'email de test
    $sent = $emailService->sendWelcomeEmail($testEmail, 'Testeur');

    if ($sent) {
        echo json_encode([
            'success' => true,
            'message' => "Email de bienvenue envoyé avec succès à {$testEmail}",
            'smtp_connection' => $connectionTest['message']
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Échec envoi email',
            'smtp_connection' => $connectionTest['message']
        ]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ]);
}
