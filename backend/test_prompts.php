<?php
/**
 * Script de test pour générer tous les prompts AI Photo
 * Usage: php test_prompts.php
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\AIPhotoService;

// Récupérer tous les contextes disponibles
$contexts = AIPhotoService::getAvailableContexts();

// Catégories de projets
$categories = [
    'Vêtements',
    'Accessoires',
    'Maison/Déco',
    'Jouets/Peluches',
    'Accessoires bébé',
    'Autre' // Pour tester le fallback
];

echo "╔═══════════════════════════════════════════════════════════════════════════════╗\n";
echo "║               GÉNÉRATION DE TOUS LES PROMPTS AI PHOTO                        ║\n";
echo "╚═══════════════════════════════════════════════════════════════════════════════╝\n\n";

// Utiliser la réflexion pour accéder à la méthode privée buildPrompt
$service = new AIPhotoService();
$reflection = new ReflectionClass($service);
$buildPromptMethod = $reflection->getMethod('buildPrompt');
$buildPromptMethod->setAccessible(true);

foreach ($categories as $category) {
    echo "\n";
    echo "═══════════════════════════════════════════════════════════════════════════════\n";
    echo "CATÉGORIE : $category\n";
    echo "═══════════════════════════════════════════════════════════════════════════════\n\n";

    foreach ($contexts as $context) {
        echo "───────────────────────────────────────────────────────────────────────────────\n";
        echo "Contexte : $context\n";
        echo "───────────────────────────────────────────────────────────────────────────────\n";

        $prompt = $buildPromptMethod->invoke($service, $category, $context);

        // Affichage formaté avec retour à la ligne
        $wrappedPrompt = wordwrap($prompt, 75, "\n");
        echo "$wrappedPrompt\n\n";
    }
}

echo "\n╔═══════════════════════════════════════════════════════════════════════════════╗\n";
echo "║                            FIN DU TEST                                        ║\n";
echo "╚═══════════════════════════════════════════════════════════════════════════════╝\n";
