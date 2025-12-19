<?php
/**
 * @file api.php
 * @brief Définition des routes de l'API
 * @author Nathalie + AI Assistants
 * @created 2025-11-12
 * @modified 2025-11-12 by [AI:Claude] - Création initiale
 */

declare(strict_types=1);

use App\Controllers\AuthController;
use App\Controllers\PatternController;
use App\Controllers\PaymentController;
use App\Controllers\UserController;
use App\Controllers\AdminController;
use App\Controllers\CategoryController;
use App\Controllers\PatternOptionController;
use App\Controllers\ProjectController;
use App\Controllers\PhotoController;
use App\Controllers\PatternLibraryController;
use App\Controllers\WaitlistController;
use App\Controllers\PasswordResetController;
use App\Controllers\WebFetchController;

/**
 * [AI:Claude] Router simple basé sur les méthodes HTTP et les URIs
 *
 * @param string $method Méthode HTTP
 * @param string $uri URI demandée
 * @return void
 */
function route(string $method, string $uri): void
{
    $originalUri = $uri;

    // [AI:Claude] Nettoyer l'URI en enlevant le préfixe /api
    $uri = trim($uri, '/');

    // [AI:Claude] Retirer le préfixe "api/" si présent (pour VirtualHost)
    if (str_starts_with($uri, 'api/')) {
        $uri = substr($uri, 4);
    }

    $uri = trim($uri, '/');

    // [AI:Claude] Debug temporaire - afficher toujours en mode debug
    if (isset($_ENV['APP_DEBUG']) && $_ENV['APP_DEBUG'] === 'true') {
        error_log("[ROUTE DEBUG] Method: $method | Original URI: $originalUri | Processed URI: $uri");
        error_log("[ROUTE DEBUG] Match register: ".($method === 'POST' && $uri === 'auth/register' ? 'TRUE' : 'FALSE'));
        error_log("[ROUTE DEBUG] Match login: ".($method === 'POST' && $uri === 'auth/login' ? 'TRUE' : 'FALSE'));
    }

    match(true) {
        // [AI:Claude] Routes d'authentification
        $method === 'POST' && $uri === 'auth/register' => (new AuthController())->register(),
        $method === 'POST' && $uri === 'auth/login' => (new AuthController())->login(),
        $method === 'GET' && $uri === 'auth/me' => (new AuthController())->me(),
        $method === 'POST' && $uri === 'auth/refresh' => (new AuthController())->refresh(),

        // [AI:Claude] Routes OAuth
        $method === 'GET' && $uri === 'auth/google/url' => (new AuthController())->googleAuthUrl(),
        $method === 'GET' && $uri === 'auth/google/callback' => (new AuthController())->googleCallback(),
        $method === 'GET' && $uri === 'auth/facebook/url' => (new AuthController())->facebookAuthUrl(),
        $method === 'GET' && $uri === 'auth/facebook/callback' => (new AuthController())->facebookCallback(),

        // [AI:Claude] Routes de réinitialisation de mot de passe
        $method === 'POST' && $uri === 'auth/forgot-password' => (new PasswordResetController())->requestReset(),
        $method === 'POST' && $uri === 'auth/verify-reset-token' => (new PasswordResetController())->verifyToken(),
        $method === 'POST' && $uri === 'auth/reset-password' => (new PasswordResetController())->resetPassword(),

        // [AI:Claude] Routes waitlist (publiques)
        $method === 'POST' && $uri === 'waitlist/subscribe' => (new WaitlistController())->subscribe(),
        $method === 'GET' && $uri === 'waitlist/count' => (new WaitlistController())->getCount(),
        $method === 'GET' && $uri === 'waitlist/subscribers' => (new WaitlistController())->getSubscribers(),

        // [AI:Claude] Routes de patrons
        $method === 'POST' && $uri === 'patterns/calculate-price' => (new PatternController())->calculatePrice(),
        $method === 'POST' && $uri === 'patterns/generate' => (new PatternController())->generate(),
        $method === 'GET' && $uri === 'patterns' => (new PatternController())->index(),
        $method === 'GET' && preg_match('/^patterns\/(\d+)\/status$/', $uri, $matches) => (new PatternController())->checkStatus((int)$matches[1]),
        $method === 'GET' && preg_match('/^patterns\/(\d+)\/pdf$/', $uri, $matches) => (new PatternController())->downloadPDF((int)$matches[1]),
        $method === 'GET' && preg_match('/^patterns\/(\d+)$/', $uri, $matches) => (new PatternController())->show((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^patterns\/(\d+)$/', $uri, $matches) => (new PatternController())->delete((int)$matches[1]),

        // [AI:Claude] Routes de paiement
        $method === 'POST' && $uri === 'payments/checkout/pattern' => (new PaymentController())->createPatternCheckout(),
        $method === 'POST' && $uri === 'payments/checkout/subscription' => (new PaymentController())->createSubscriptionCheckout(),
        $method === 'GET' && preg_match('/^payments\/status\/(.+)$/', $uri, $matches) => (new PaymentController())->checkStatus($matches[1]),
        $method === 'POST' && $uri === 'payments/webhook' => (new PaymentController())->handleWebhook(),
        $method === 'GET' && $uri === 'payments/history' => (new PaymentController())->getHistory(),
        $method === 'POST' && preg_match('/^payments\/(\d+)\/refund$/', $uri, $matches) => (new PaymentController())->createRefund((int)$matches[1]),

        // [AI:Claude] Routes utilisateur
        $method === 'GET' && $uri === 'user/profile' => (new UserController())->getProfile(),
        $method === 'PUT' && $uri === 'user/profile' => (new UserController())->updateProfile(),
        $method === 'PUT' && $uri === 'user/password' => (new UserController())->changePassword(),
        $method === 'DELETE' && $uri === 'user/account' => (new UserController())->deleteAccount(),
        $method === 'GET' && $uri === 'user/dashboard' => (new UserController())->getDashboard(),
        $method === 'GET' && $uri === 'user/subscription' => (new UserController())->getSubscription(),

        // [AI:Claude] Routes admin
        $method === 'GET' && $uri === 'admin/stats' => (new AdminController())->getStats(),
        $method === 'GET' && $uri === 'admin/users' => (new AdminController())->listUsers(),
        $method === 'GET' && preg_match('/^admin\/users\/(\d+)$/', $uri, $matches) => (new AdminController())->getUserDetails((int)$matches[1]),
        $method === 'PUT' && preg_match('/^admin\/users\/(\d+)\/subscription$/', $uri, $matches) => (new AdminController())->updateUserSubscription((int)$matches[1]),
        $method === 'GET' && $uri === 'admin/patterns' => (new AdminController())->listPatterns(),
        $method === 'DELETE' && preg_match('/^admin\/patterns\/(\d+)$/', $uri, $matches) => (new AdminController())->deletePattern((int)$matches[1]),
        $method === 'GET' && $uri === 'admin/templates' => (new AdminController())->listTemplates(),
        $method === 'POST' && $uri === 'admin/templates' => (new AdminController())->createTemplate(),
        $method === 'PUT' && preg_match('/^admin\/templates\/(\d+)$/', $uri, $matches) => (new AdminController())->updateTemplate((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^admin\/templates\/(\d+)$/', $uri, $matches) => (new AdminController())->deleteTemplate((int)$matches[1]),
        $method === 'GET' && $uri === 'admin/payments' => (new AdminController())->listPayments(),

        // [AI:Claude] Routes de gestion des catégories (public)
        $method === 'GET' && $uri === 'categories' => (new CategoryController())->index(),
        $method === 'GET' && preg_match('/^categories\/(.+)\/subtypes$/', $uri, $matches) => (new CategoryController())->getSubtypes($matches[1]),

        // [AI:Claude] Routes admin pour les catégories
        $method === 'POST' && $uri === 'admin/categories' => (new CategoryController())->create(),
        $method === 'POST' && preg_match('/^admin\/categories\/(.+)\/subtypes$/', $uri, $matches) => (new CategoryController())->createSubtype($matches[1]),
        $method === 'PUT' && preg_match('/^admin\/categories\/(\d+)$/', $uri, $matches) => (new CategoryController())->update((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^admin\/categories\/(\d+)$/', $uri, $matches) => (new CategoryController())->delete((int)$matches[1]),
        $method === 'POST' && $uri === 'admin/categories/reorder' => (new CategoryController())->reorder(),

        // [AI:Claude] Routes de gestion des options de personnalisation (public)
        $method === 'GET' && $uri === 'pattern-options' => (new PatternOptionController())->index(),
        $method === 'GET' && preg_match('/^pattern-options\/required\/(.+)$/', $uri, $matches) => (new PatternOptionController())->getRequired($matches[1]),
        $method === 'GET' && preg_match('/^pattern-options\/key\/(.+)$/', $uri, $matches) => (new PatternOptionController())->getByKey($matches[1]),
        $method === 'GET' && preg_match('/^pattern-options\/group\/(.+)$/', $uri, $matches) => (new PatternOptionController())->getByGroup($matches[1]),

        // [AI:Claude] Routes admin pour les options
        $method === 'POST' && $uri === 'admin/pattern-options' => (new PatternOptionController())->create(),
        $method === 'PUT' && preg_match('/^admin\/pattern-options\/(\d+)$/', $uri, $matches) => (new PatternOptionController())->update((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^admin\/pattern-options\/(\d+)$/', $uri, $matches) => (new PatternOptionController())->delete((int)$matches[1]),

        // [AI:Claude] Routes de gestion des projets (Crochet Hub)
        $method === 'GET' && $uri === 'projects' => (new ProjectController())->index($_GET),
        $method === 'POST' && $uri === 'projects' => (new ProjectController())->create(),
        $method === 'GET' && $uri === 'projects/stats' => (new ProjectController())->getStats($_GET),
        $method === 'GET' && $uri === 'projects/public' => (new ProjectController())->getPublicProjects($_GET),
        $method === 'GET' && preg_match('/^projects\/(\d+)$/', $uri, $matches) => (new ProjectController())->show((int)$matches[1]),
        $method === 'PUT' && preg_match('/^projects\/(\d+)$/', $uri, $matches) => (new ProjectController())->update((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^projects\/(\d+)$/', $uri, $matches) => (new ProjectController())->delete((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/rows$/', $uri, $matches) => (new ProjectController())->addRow((int)$matches[1]),
        $method === 'GET' && preg_match('/^projects\/(\d+)\/rows$/', $uri, $matches) => (new ProjectController())->getRows((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/sessions\/start$/', $uri, $matches) => (new ProjectController())->startSession((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/sessions\/end$/', $uri, $matches) => (new ProjectController())->endSession((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/pattern$/', $uri, $matches) => (new ProjectController())->uploadPattern((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/pattern-url$/', $uri, $matches) => (new ProjectController())->savePatternUrl((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/pattern-text$/', $uri, $matches) => (new ProjectController())->savePatternText((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/pattern-from-library$/', $uri, $matches) => (new ProjectController())->linkPatternFromLibrary((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/photo$/', $uri, $matches) => (new ProjectController())->uploadPhoto((int)$matches[1]),
        $method === 'PUT' && preg_match('/^projects\/(\d+)\/set-cover-photo$/', $uri, $matches) => (new ProjectController())->setCoverPhoto((int)$matches[1]),

        // [AI:Claude] Routes de gestion des sections de projet
        $method === 'POST' && preg_match('/^projects\/(\d+)\/sections$/', $uri, $matches) => (new ProjectController())->createSection((int)$matches[1]),
        $method === 'GET' && preg_match('/^projects\/(\d+)\/sections$/', $uri, $matches) => (new ProjectController())->getSections((int)$matches[1]),
        $method === 'PUT' && preg_match('/^projects\/(\d+)\/sections\/(\d+)$/', $uri, $matches) => (new ProjectController())->updateSection((int)$matches[1], (int)$matches[2]),
        $method === 'DELETE' && preg_match('/^projects\/(\d+)\/sections\/(\d+)$/', $uri, $matches) => (new ProjectController())->deleteSection((int)$matches[1], (int)$matches[2]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/current-section$/', $uri, $matches) => (new ProjectController())->setCurrentSection((int)$matches[1]),
        $method === 'POST' && preg_match('/^projects\/(\d+)\/sections\/(\d+)\/complete$/', $uri, $matches) => (new ProjectController())->toggleSectionComplete((int)$matches[1], (int)$matches[2]),
        $method === 'GET' && preg_match('/^projects\/(\d+)\/sections\/(\d+)\/rows$/', $uri, $matches) => (new ProjectController())->getSectionRows((int)$matches[1], (int)$matches[2], $_GET),

        // [AI:Claude] Routes de gestion des photos IA (AI Photo Studio v0.10.0)
        $method === 'GET' && $uri === 'photos' => (new PhotoController())->index($_GET),
        $method === 'POST' && $uri === 'photos/upload' => (new PhotoController())->upload(),
        $method === 'GET' && $uri === 'photos/credits' => (new PhotoController())->getCredits(),
        $method === 'GET' && $uri === 'photos/stats' => (new PhotoController())->getPhotoStats($_GET),
        $method === 'POST' && preg_match('/^photos\/(\d+)\/enhance-multiple$/', $uri, $matches) => (new PhotoController())->enhanceMultiple((int)$matches[1]),
        $method === 'POST' && preg_match('/^photos\/(\d+)\/preview$/', $uri, $matches) => (new PhotoController())->generatePreview((int)$matches[1]),
        $method === 'POST' && preg_match('/^photos\/(\d+)\/enhance$/', $uri, $matches) => (new PhotoController())->enhance((int)$matches[1]),
        $method === 'GET' && preg_match('/^photos\/(\d+)\/download$/', $uri, $matches) => (new PhotoController())->download((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^photos\/(\d+)$/', $uri, $matches) => (new PhotoController())->delete((int)$matches[1]),

        // [AI:Claude] Routes de la bibliothèque de patrons
        $method === 'GET' && $uri === 'pattern-library' => (new PatternLibraryController())->index($_GET),
        $method === 'POST' && $uri === 'pattern-library' => (new PatternLibraryController())->create(),
        $method === 'GET' && preg_match('/^pattern-library\/(\d+)\/file$/', $uri, $matches) => (new PatternLibraryController())->downloadFile((int)$matches[1]),
        $method === 'GET' && preg_match('/^pattern-library\/(\d+)$/', $uri, $matches) => (new PatternLibraryController())->show((int)$matches[1]),
        $method === 'PUT' && preg_match('/^pattern-library\/(\d+)$/', $uri, $matches) => (new PatternLibraryController())->update((int)$matches[1]),
        $method === 'DELETE' && preg_match('/^pattern-library\/(\d+)$/', $uri, $matches) => (new PatternLibraryController())->delete((int)$matches[1]),

        // [AI:Claude] Routes de récupération de contenu web externe
        $method === 'POST' && $uri === 'web-fetch' => (new WebFetchController())->fetch(),
        $method === 'POST' && $uri === 'web-fetch/metadata' => (new WebFetchController())->fetchMetadata(),
        $method === 'GET' && $uri === 'web-fetch/proxy' => (new WebFetchController())->proxy(),

        default => notFound()
    };
}

/**
 * [AI:Claude] Route 404
 */
function notFound(): void
{
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Route introuvable',
        'status' => 404
    ]);
    exit;
}
