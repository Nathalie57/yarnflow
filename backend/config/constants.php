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

// Types d'abonnement — FREE (0€) et PRO (3.99€/mois ou 39.99€/an)
define('SUBSCRIPTION_FREE', 'free');
define('SUBSCRIPTION_PRO', 'pro');
define('SUBSCRIPTION_PRO_ANNUAL', 'pro_annual');
define('SUBSCRIPTION_EARLY_BIRD', 'early_bird');       // Early Bird = PRO au tarif réduit
// Aliases legacy (utilisateurs existants en base avec anciens types)
define('SUBSCRIPTION_PLUS', 'pro');
define('SUBSCRIPTION_PLUS_ANNUAL', 'pro');
define('SUBSCRIPTION_STANDARD', 'pro');
define('SUBSCRIPTION_PREMIUM', 'pro');
define('SUBSCRIPTION_STARTER', 'pro');
define('SUBSCRIPTION_MONTHLY', 'pro');
define('SUBSCRIPTION_YEARLY', 'pro_annual');

// [AI:Claude] Statuts de paiement
define('PAYMENT_PENDING', 'pending');
define('PAYMENT_COMPLETED', 'completed');
define('PAYMENT_FAILED', 'failed');
define('PAYMENT_REFUNDED', 'refunded');

// Types de paiement
define('PAYMENT_PATTERN', 'pattern');
define('PAYMENT_SUBSCRIPTION_PRO', 'subscription_pro');
define('PAYMENT_SUBSCRIPTION_PRO_ANNUAL', 'subscription_pro_annual');
define('PAYMENT_SUBSCRIPTION_EARLY_BIRD', 'subscription_early_bird');
define('PAYMENT_PHOTO_CREDITS', 'photo_credits');
define('PAYMENT_CREDITS_PACK_50', 'credits_pack_50');
define('PAYMENT_CREDITS_PACK_150', 'credits_pack_150');
// Aliases legacy
define('PAYMENT_SUBSCRIPTION_PLUS', 'subscription_pro');
define('PAYMENT_SUBSCRIPTION_PLUS_ANNUAL', 'subscription_pro_annual');
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

// Features par plan — source de vérité alignée avec Subscription.jsx et Landing.jsx
define('SUBSCRIPTION_FEATURES', [
    'free' => [
        'name' => 'YarnFlow Free',
        'price' => 0,
        'max_active_projects' => -1,       // Illimité
        'photo_credits_per_month' => 2,
        'ai_questions_per_month' => 3,
        'max_library_patterns' => -1,      // Illimité
        'can_use_tags' => false,
        'can_mark_favorite' => true,
        'second_counter' => false,
        'section_notes' => false,
        'advanced_stats' => false,
        'timer_history' => false,
        'all_photo_styles' => false,
        'smart_project_creation' => false,
    ],
    'pro' => [
        'name' => 'YarnFlow Pro',
        'price' => 3.99,
        'max_active_projects' => -1,       // Illimité
        'photo_credits_per_month' => 20,
        'ai_questions_per_month' => 30,
        'max_library_patterns' => -1,      // Illimité
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'second_counter' => true,
        'section_notes' => true,
        'advanced_stats' => true,
        'timer_history' => true,
        'all_photo_styles' => true,
        'smart_project_creation' => true,
    ],
    'pro_annual' => [
        'name' => 'YarnFlow Pro (Annuel)',
        'price' => 39.99,
        'max_active_projects' => -1,
        'photo_credits_per_month' => 20,
        'ai_questions_per_month' => 30,
        'max_library_patterns' => -1,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'second_counter' => true,
        'section_notes' => true,
        'advanced_stats' => true,
        'timer_history' => true,
        'all_photo_styles' => true,
        'smart_project_creation' => true,
    ],
    'early_bird' => [
        'name' => 'YarnFlow Early Bird',
        'price' => 2.99,
        'max_active_projects' => -1,
        'photo_credits_per_month' => 20,
        'ai_questions_per_month' => 30,
        'max_library_patterns' => -1,
        'can_use_tags' => true,
        'can_mark_favorite' => true,
        'second_counter' => true,
        'section_notes' => true,
        'advanced_stats' => true,
        'timer_history' => true,
        'all_photo_styles' => true,
        'smart_project_creation' => true,
    ],
]);
