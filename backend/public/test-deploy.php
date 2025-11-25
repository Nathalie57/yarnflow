<?php
/**
 * Fichier de test du déploiement Git
 * Dernière mise à jour : 2025-11-25 21:45
 */

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'Déploiement Git fonctionne !',
    'version' => '1.0',
    'deployed_at' => date('Y-m-d H:i:s'),
    'deployment_method' => 'Git Version Control + .cpanel.yml'
]);
