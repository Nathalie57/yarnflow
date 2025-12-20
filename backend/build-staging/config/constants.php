<?php
/**
 * @file constants.php
 * @brief Constantes globales de l'application
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

// [AI:Claude] Niveaux de compétence pour les patrons
define('LEVEL_BEGINNER', 'beginner');
define('LEVEL_INTERMEDIATE', 'intermediate');
define('LEVEL_ADVANCED', 'advanced');

// [AI:Claude] Types de projets de crochet
define('TYPE_HAT', 'hat');           // Bonnet
define('TYPE_SCARF', 'scarf');       // Écharpe
define('TYPE_AMIGURUMI', 'amigurumi'); // Amigurumi (peluches)
define('TYPE_BAG', 'bag');           // Sac
define('TYPE_GARMENT', 'garment');   // Vêtement

// [AI:Claude] Types d'abonnement (v0.14.0 - YarnFlow Launch avec PLUS)
define('SUBSCRIPTION_FREE', 'free');                   // 0€ - 3 projets actifs, 5 crédits photos/mois
define('SUBSCRIPTION_PLUS', 'plus');                   // 2.99€/mois - 7 projets, 15 crédits photos/mois
define('SUBSCRIPTION_PLUS_ANNUAL', 'plus_annual');     // 29.99€/an - Économisez 15%
define('SUBSCRIPTION_PRO', 'pro');                     // 4.99€/mois - Projets illimités + 30 crédits photos/mois
define('SUBSCRIPTION_PRO_ANNUAL', 'pro_annual');       // 49.99€/an - Économisez 17%
define('SUBSCRIPTION_EARLY_BIRD', 'early_bird');       // 2.99€/mois x 12 mois (200 places max)
// Legacy support (deprecated - sera migré vers les nouveaux types)
define('SUBSCRIPTION_STANDARD', 'pro');                // Alias pour PRO
define('SUBSCRIPTION_PREMIUM', 'pro');                 // Alias pour PRO
define('SUBSCRIPTION_STARTER', 'plus');                // Alias pour PLUS
define('SUBSCRIPTION_MONTHLY', 'pro');                 // Alias pour PRO monthly
define('SUBSCRIPTION_YEARLY', 'pro');                  // Alias pour PRO

// [AI:Claude] Statuts de paiement
define('PAYMENT_PENDING', 'pending');
define('PAYMENT_COMPLETED', 'completed');
define('PAYMENT_FAILED', 'failed');
define('PAYMENT_REFUNDED', 'refunded');

// [AI:Claude] Types de paiement
define('PAYMENT_PATTERN', 'pattern');
define('PAYMENT_SUBSCRIPTION_PLUS', 'subscription_plus');
define('PAYMENT_SUBSCRIPTION_PLUS_ANNUAL', 'subscription_plus_annual');
define('PAYMENT_SUBSCRIPTION_PRO', 'subscription_pro');
define('PAYMENT_SUBSCRIPTION_PRO_ANNUAL', 'subscription_pro_annual');
define('PAYMENT_SUBSCRIPTION_EARLY_BIRD', 'subscription_early_bird');
define('PAYMENT_PHOTO_CREDITS', 'photo_credits');
define('PAYMENT_CREDITS_PACK_50', 'credits_pack_50');
define('PAYMENT_CREDITS_PACK_150', 'credits_pack_150');
// Legacy (kept for backward compatibility)
define('PAYMENT_SUBSCRIPTION_MONTHLY', 'subscription_pro');
define('PAYMENT_SUBSCRIPTION_ANNUAL', 'subscription_pro_annual');

// [AI:Claude] Statuts de génération de patron
define('PATTERN_DRAFT', 'draft');
define('PATTERN_GENERATING', 'generating');
define('PATTERN_COMPLETED', 'completed');
define('PATTERN_ERROR', 'error');

// [AI:Claude] Rôles utilisateur
define('ROLE_USER', 'user');
define('ROLE_ADMIN', 'admin');

// [AI:Claude] Messages d'erreur standard
define('ERROR_UNAUTHORIZED', 'Non autorisé');
define('ERROR_NOT_FOUND', 'Ressource introuvable');
define('ERROR_VALIDATION', 'Erreur de validation');
define('ERROR_SERVER', 'Erreur serveur');
define('ERROR_DATABASE', 'Erreur de base de données');
define('ERROR_PAYMENT', 'Erreur de paiement');
define('ERROR_AI_GENERATION', 'Erreur lors de la génération du patron');

// [AI:Claude] Codes HTTP
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_FORBIDDEN', 403);
define('HTTP_NOT_FOUND', 404);
define('HTTP_UNPROCESSABLE', 422);
define('HTTP_SERVER_ERROR', 500);

// [AI:Claude] Configuration des plans d'abonnement (v0.15.0 - Système de tags)
define('SUBSCRIPTION_FEATURES', [
    'free' => [
        'name' => 'YarnFlow Basic',
        'price' => 0,
        'max_active_projects' => 3,
        'photo_credits_per_month' => 5,
        'can_use_tags' => false,           // Tags = feature premium
        'can_mark_favorite' => true,       // Favoris = feature de base
        'max_tags_per_project' => 0,
        'can_filter_multi_tags' => false,
        'tag_suggestions' => false,
        'tag_stats' => false
    ],
    'plus' => [
        'name' => 'YarnFlow Plus',
        'price' => 2.99,
        'max_active_projects' => 7,
        'photo_credits_per_month' => 15,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'max_tags_per_project' => -1,      // Illimité
        'can_filter_multi_tags' => true,
        'tag_suggestions' => true,
        'tag_stats' => false
    ],
    'plus_annual' => [
        'name' => 'YarnFlow Plus (Annuel)',
        'price' => 29.99,
        'max_active_projects' => 7,
        'photo_credits_per_month' => 15,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'max_tags_per_project' => -1,
        'can_filter_multi_tags' => true,
        'tag_suggestions' => true,
        'tag_stats' => false
    ],
    'pro' => [
        'name' => 'YarnFlow Pro',
        'price' => 4.99,
        'max_active_projects' => -1,       // Illimité
        'photo_credits_per_month' => 30,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'max_tags_per_project' => -1,      // Illimité
        'can_filter_multi_tags' => true,
        'tag_suggestions' => true,
        'tag_stats' => true                // Stats avancées par tag
    ],
    'pro_annual' => [
        'name' => 'YarnFlow Pro (Annuel)',
        'price' => 49.99,
        'max_active_projects' => -1,
        'photo_credits_per_month' => 30,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'max_tags_per_project' => -1,
        'can_filter_multi_tags' => true,
        'tag_suggestions' => true,
        'tag_stats' => true
    ],
    'early_bird' => [
        'name' => 'YarnFlow Early Bird',
        'price' => 2.99,
        'max_active_projects' => -1,
        'photo_credits_per_month' => 30,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'max_tags_per_project' => -1,
        'can_filter_multi_tags' => true,
        'tag_suggestions' => true,
        'tag_stats' => true
    ]
]);
