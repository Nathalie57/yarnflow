<?php
/**
 * @file PaymentController.php
 * @brief Contrôleur pour la gestion des paiements Stripe
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création initiale
 *
 * @history
 *   2025-11-13 [AI:Claude] Création du contrôleur de paiement avec Stripe
 */

declare(strict_types=1);

namespace App\Controllers;

use App\Models\User;
use App\Models\Pattern;
use App\Models\Payment;
use App\Services\StripeService;
use App\Services\PricingService;
use App\Services\EarlyBirdService;
use App\Services\CreditManager;
use App\Utils\Response;
use App\Utils\Validator;

/**
 * [AI:Claude] Contrôleur de gestion des paiements
 */
class PaymentController
{
    private User $userModel;
    private Pattern $patternModel;
    private Payment $paymentModel;
    private StripeService $stripeService;
    private PricingService $pricingService;
    private EarlyBirdService $earlyBirdService;
    private CreditManager $creditManager;

    public function __construct()
    {
        $this->userModel = new User();
        $this->patternModel = new Pattern();
        $this->paymentModel = new Payment();
        $this->stripeService = new StripeService();
        $this->pricingService = new PricingService();
        $this->earlyBirdService = new EarlyBirdService();
        $this->creditManager = new CreditManager();
    }

    /**
     * [AI:Claude] Créer une session de paiement pour un patron
     * POST /api/payments/checkout/pattern
     */
    public function createPatternCheckout(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['pattern_id'] ?? null, 'pattern_id')
            ->isInteger($data['pattern_id'] ?? null, 'pattern_id');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $patternId = (int)$data['pattern_id'];
        $pattern = $this->patternModel->findById($patternId);

        if ($pattern === null)
            Response::notFound('Patron introuvable');

        // [AI:Claude] Vérifier que le patron appartient à l'utilisateur
        if ($pattern['user_id'] !== $userData['user_id'])
            Response::error('Accès non autorisé', HTTP_FORBIDDEN);

        $user = $this->userModel->findById($userData['user_id']);

        // [AI:Claude] Créer la session Stripe
        $result = $this->stripeService->createPatternCheckoutSession(
            $userData['user_id'],
            $patternId,
            $pattern['price_paid'],
            $user['email']
        );

        if (!$result['success'])
            Response::serverError('Erreur lors de la création de la session de paiement');

        // [AI:Claude] Enregistrer le paiement en attente
        $this->paymentModel->create([
            'user_id' => $userData['user_id'],
            'pattern_id' => $patternId,
            'stripe_session_id' => $result['session_id'],
            'amount' => $pattern['price_paid'],
            'status' => PAYMENT_PENDING,
            'payment_type' => PAYMENT_PATTERN
        ]);

        Response::success([
            'session_id' => $result['session_id'],
            'checkout_url' => $result['checkout_url']
        ], HTTP_OK, 'Session de paiement créée');
    }

    /**
     * [AI:Claude] Créer une session d'abonnement
     * POST /api/payments/checkout/subscription
     */
    public function createSubscriptionCheckout(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['type'] ?? null, 'type')
            ->in($data['type'] ?? null, ['plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird'], 'type');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->findById($userData['user_id']);
        $type = $data['type'];

        // [AI:Claude] Si Early Bird, vérifier disponibilité
        if ($type === 'early_bird') {
            if (!$this->earlyBirdService->isAvailable()) {
                $stats = $this->earlyBirdService->getStats();
                Response::error(
                    "Offre Early Bird épuisée ({$stats['current_slots']}/{$stats['max_slots']} places)",
                    HTTP_FORBIDDEN
                );
                return;
            }

            if ($this->earlyBirdService->hasSlot($userData['user_id'])) {
                Response::error('Vous avez déjà une place Early Bird', HTTP_FORBIDDEN);
                return;
            }
        }

        // [AI:Claude] Créer la session selon le type d'abonnement
        $result = match($type) {
            'plus' => $this->stripeService->createPlusMonthlySession($userData['user_id'], $user['email']),
            'plus_annual' => $this->stripeService->createPlusAnnualSession($userData['user_id'], $user['email']),
            'pro' => $this->stripeService->createProMonthlySession($userData['user_id'], $user['email']),
            'pro_annual' => $this->stripeService->createProAnnualSession($userData['user_id'], $user['email']),
            'early_bird' => $this->stripeService->createEarlyBirdSubscriptionSession($userData['user_id'], $user['email']),
            default => ['success' => false]
        };

        if (!$result['success'])
            Response::serverError('Erreur lors de la création de la session d\'abonnement');

        $amount = match($type) {
            'plus' => $this->pricingService->getSubscriptionPrices()['plus']['monthly'],
            'plus_annual' => $this->pricingService->getSubscriptionPrices()['plus']['annual'],
            'pro' => $this->pricingService->getSubscriptionPrices()['pro']['monthly'],
            'pro_annual' => $this->pricingService->getSubscriptionPrices()['pro']['annual'],
            'early_bird' => 2.99,
            default => 0
        };

        // [AI:Claude] Enregistrer le paiement en attente
        $paymentType = match($type) {
            'plus' => PAYMENT_SUBSCRIPTION_PLUS,
            'plus_annual' => PAYMENT_SUBSCRIPTION_PLUS_ANNUAL,
            'pro' => PAYMENT_SUBSCRIPTION_PRO,
            'pro_annual' => PAYMENT_SUBSCRIPTION_PRO_ANNUAL,
            'early_bird' => PAYMENT_SUBSCRIPTION_EARLY_BIRD,
            default => PAYMENT_SUBSCRIPTION_PRO
        };

        $this->paymentModel->create([
            'user_id' => $userData['user_id'],
            'pattern_id' => null,
            'stripe_session_id' => $result['session_id'],
            'amount' => $amount,
            'status' => PAYMENT_PENDING,
            'payment_type' => $paymentType
        ]);

        Response::success([
            'session_id' => $result['session_id'],
            'checkout_url' => $result['checkout_url']
        ], HTTP_OK, 'Session d\'abonnement créée');
    }

    /**
     * [AI:Claude] Vérifier le statut d'un paiement
     * GET /api/payments/status/{sessionId}
     */
    public function checkStatus(string $sessionId): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $result = $this->stripeService->getSessionStatus($sessionId);

        if (!$result['success'])
            Response::serverError('Erreur lors de la vérification du paiement');

        Response::success([
            'status' => $result['status'],
            'amount' => $result['amount_total'],
            'metadata' => $result['metadata']
        ]);
    }

    /**
     * [AI:Claude] Webhook Stripe pour traiter les événements
     * POST /api/payments/webhook
     */
    public function handleWebhook(): void
    {
        $payload = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

        $result = $this->stripeService->handleWebhook($payload, $signature);

        if (!$result['success']) {
            http_response_code(400);
            echo json_encode(['error' => $result['error']]);
            exit;
        }

        // [AI:Claude] Traiter l'événement selon son type
        if ($result['event'] === 'checkout_completed') {
            $this->processCheckoutCompleted($result);
        } elseif ($result['event'] === 'payment_succeeded') {
            $this->processPaymentSucceeded($result);
        } elseif ($result['event'] === 'subscription_created') {
            $this->processSubscriptionCreated($result);
        } elseif ($result['event'] === 'subscription_deleted') {
            $this->processSubscriptionDeleted($result);
        }

        http_response_code(200);
        echo json_encode(['success' => true]);
        exit;
    }

    /**
     * [AI:Claude] Traiter la complétion d'un paiement
     */
    private function processCheckoutCompleted(array $data): void
    {
        $userId = (int)$data['user_id'];
        $patternId = isset($data['pattern_id']) ? (int)$data['pattern_id'] : null;
        $paymentType = $data['payment_type'];

        // [AI:Claude] Mettre à jour le paiement en base
        $payment = $this->paymentModel->findOne(['stripe_session_id' => $data['session_id'] ?? '']);

        if ($payment) {
            $this->paymentModel->update($payment['id'], [
                'status' => PAYMENT_COMPLETED,
                'completed_at' => date('Y-m-d H:i:s')
            ]);
        }

        // [AI:Claude] Si c'est un abonnement, mettre à jour l'utilisateur
        if (in_array($paymentType, ['subscription_plus', 'subscription_plus_annual', 'subscription_pro', 'subscription_pro_annual', 'subscription_early_bird'])) {
            $expiresAt = match($paymentType) {
                'subscription_plus' => date('Y-m-d H:i:s', strtotime('+1 month')),
                'subscription_plus_annual' => date('Y-m-d H:i:s', strtotime('+1 year')),
                'subscription_pro' => date('Y-m-d H:i:s', strtotime('+1 month')),
                'subscription_pro_annual' => date('Y-m-d H:i:s', strtotime('+1 year')),
                'subscription_early_bird' => date('Y-m-d H:i:s', strtotime('+12 months')),
                default => null
            };

            $subscriptionType = match($paymentType) {
                'subscription_plus' => SUBSCRIPTION_PLUS,
                'subscription_plus_annual' => SUBSCRIPTION_PLUS_ANNUAL,
                'subscription_pro' => SUBSCRIPTION_PRO,
                'subscription_pro_annual' => SUBSCRIPTION_PRO_ANNUAL,
                'subscription_early_bird' => SUBSCRIPTION_EARLY_BIRD,
                default => SUBSCRIPTION_FREE
            };

            $this->userModel->updateSubscription($userId, $subscriptionType, $expiresAt);

            // [AI:Claude] Si PRO Annuel, ajouter 50 crédits bonus (one-time)
            if ($paymentType === 'subscription_pro_annual') {
                $this->creditManager->addPurchasedCredits($userId, 50);
                error_log("[PRO ANNUEL] 50 crédits bonus ajoutés pour user {$userId}");
            }

            // [AI:Claude] Si Early Bird, réserver une place
            if ($paymentType === 'subscription_early_bird') {
                $user = $this->userModel->findById($userId);
                $result = $this->earlyBirdService->reserveSlot(
                    $userId,
                    $user['stripe_customer_id'] ?? null,
                    $data['subscription_id'] ?? null
                );

                if ($result['success']) {
                    error_log("[EARLY BIRD] Place #{$result['slot_number']} attribuée à user {$userId}");
                } else {
                    error_log("[EARLY BIRD] ERREUR - Paiement validé mais slot non réservé pour user {$userId}");
                }
            }
        }

        // [AI:Claude] Si c'est un patron, mettre à jour le statut
        if ($patternId !== null) {
            $this->patternModel->update($patternId, [
                'payment_status' => 'paid'
            ]);
        }
    }

    /**
     * [AI:Claude] Traiter le succès d'un paiement
     */
    private function processPaymentSucceeded(array $data): void
    {
        // [AI:Claude] Logger le succès
        error_log('[Payment] Paiement réussi : '.$data['payment_intent_id']);
    }

    /**
     * [AI:Claude] Traiter la création d'un abonnement
     */
    private function processSubscriptionCreated(array $data): void
    {
        // [AI:Claude] Logger la création
        error_log('[Payment] Abonnement créé : '.$data['subscription_id']);
    }

    /**
     * [AI:Claude] Traiter l'annulation d'un abonnement
     */
    private function processSubscriptionDeleted(array $data): void
    {
        // [AI:Claude] Retrouver l'utilisateur via le customer_id et désactiver son abonnement
        error_log('[Payment] Abonnement annulé : '.$data['subscription_id']);

        $customerId = $data['customer_id'] ?? null;

        if ($customerId === null) {
            error_log('[Payment] Impossible de traiter l\'annulation : customer_id manquant');
            return;
        }

        // [AI:Claude] Trouver l'utilisateur via stripe_customer_id
        $user = $this->userModel->findOne(['stripe_customer_id' => $customerId]);

        if ($user === null) {
            error_log('[Payment] Utilisateur introuvable pour customer_id : '.$customerId);
            return;
        }

        // [AI:Claude] Si c'était un Early Bird, libérer la place
        if ($user['subscription_type'] === SUBSCRIPTION_EARLY_BIRD) {
            $cancelled = $this->earlyBirdService->cancelSlot((int)$user['id']);
            if ($cancelled) {
                error_log("[Payment] Place Early Bird libérée pour user {$user['id']}");
            }
        }

        // [AI:Claude] Rétrograder l'utilisateur à FREE
        $this->userModel->updateSubscription(
            (int)$user['id'],
            SUBSCRIPTION_FREE,
            null  // Reset date d'expiration
        );

        error_log("[Payment] Utilisateur {$user['id']} ({$user['email']}) rétrogradé à FREE suite à annulation");
    }

    /**
     * [AI:Claude] Historique des paiements de l'utilisateur
     * GET /api/payments/history
     */
    public function getHistory(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 20);
        $offset = ($page - 1) * $limit;

        $payments = $this->paymentModel->findBy(
            ['user_id' => $userData['user_id']],
            $limit,
            $offset
        );

        $total = $this->paymentModel->count(['user_id' => $userData['user_id']]);

        Response::success([
            'payments' => $payments,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int)ceil($total / $limit)
            ]
        ]);
    }

    /**
     * [AI:Claude] Créer un remboursement
     * POST /api/payments/{id}/refund
     */
    public function createRefund(int $paymentId): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        // [AI:Claude] Vérifier que l'utilisateur est admin
        if ($userData['role'] !== 'admin')
            Response::error('Accès non autorisé', HTTP_FORBIDDEN);

        $payment = $this->paymentModel->findById($paymentId);

        if ($payment === null)
            Response::notFound('Paiement introuvable');

        if ($payment['status'] !== PAYMENT_COMPLETED)
            Response::error('Le paiement n\'est pas encore complété', HTTP_UNPROCESSABLE);

        if (!$payment['stripe_payment_intent_id'])
            Response::error('Aucun payment intent trouvé', HTTP_UNPROCESSABLE);

        $result = $this->stripeService->createRefund($payment['stripe_payment_intent_id']);

        if (!$result['success'])
            Response::serverError('Erreur lors du remboursement');

        // [AI:Claude] Mettre à jour le statut du paiement
        $this->paymentModel->update($paymentId, [
            'status' => PAYMENT_REFUNDED,
            'refunded_at' => date('Y-m-d H:i:s')
        ]);

        Response::success([
            'refund_id' => $result['refund_id'],
            'amount' => $result['amount']
        ], HTTP_OK, 'Remboursement effectué');
    }
}
