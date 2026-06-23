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
use App\Services\EmailService;
use App\Services\PushService;
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
    private EmailService $emailService;
    private PushService $pushService;

    public function __construct()
    {
        $this->userModel = new User();
        $this->patternModel = new Pattern();
        $this->paymentModel = new Payment();
        $this->stripeService = new StripeService();
        $this->pricingService = new PricingService();
        $this->earlyBirdService = new EarlyBirdService();
        $this->creditManager = new CreditManager();
        $db = \App\Config\Database::getInstance()->getConnection();
        $this->emailService = new EmailService($db);
        $this->pushService = new PushService();
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
     * [AI:Claude] Créer une session d'achat de pack de crédits
     * POST /api/payments/checkout/credits
     */
    public function createCreditsCheckout(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $data = json_decode(file_get_contents('php://input'), true);

        $validator = new Validator();
        $validator
            ->required($data['pack'] ?? null, 'pack')
            ->in($data['pack'] ?? null, ['50', '150'], 'pack');

        if ($validator->fails())
            Response::validationError($validator->getErrors());

        $user = $this->userModel->findById($userData['user_id']);
        $pack = $data['pack'];

        // [AI:Claude] Créer la session selon le pack
        $result = match($pack) {
            '50' => $this->stripeService->createCredits50Session($userData['user_id'], $user['email']),
            '150' => $this->stripeService->createCredits150Session($userData['user_id'], $user['email']),
            default => ['success' => false]
        };

        if (!$result['success'])
            Response::serverError('Erreur lors de la création de la session d\'achat');

        $amount = match($pack) {
            '50' => 4.99,
            '150' => 9.99,
            default => 0
        };

        $credits = (int)$pack;

        // [AI:Claude] Enregistrer le paiement en attente
        $paymentType = match($pack) {
            '50' => PAYMENT_CREDITS_PACK_50,
            '150' => PAYMENT_CREDITS_PACK_150,
            default => PAYMENT_CREDITS_PACK_50
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
        ], HTTP_OK, 'Session d\'achat de crédits créée');
    }

    /**
     * [AI:Claude] Vérifier le statut d'un paiement
     * GET /api/payments/status/{sessionId}
     */
    public function checkStatus(string $sessionId): void
    {
        // Pas d'auth requise : le session_id Stripe est suffisant (non-devinable)
        $result = $this->stripeService->getSessionStatus($sessionId);

        if (!$result['success'])
            Response::serverError('Erreur lors de la vérification du paiement');

        $paymentType = $result['metadata']['payment_type'] ?? null;

        // [AI:Claude] Déterminer le type (credits, subscription, pattern)
        $type = 'unknown';
        $creditsAmount = null;
        $plan = null;

        if ($paymentType !== null && str_contains($paymentType, 'credits_pack')) {
            $type = 'credits';
            $creditsAmount = match($paymentType) {
                'credits_pack_50' => 50,
                'credits_pack_150' => 150,
                default => null
            };
        } elseif ($paymentType !== null && str_contains($paymentType, 'subscription')) {
            $type = 'subscription';
            $plan = match($paymentType) {
                'subscription_plus' => 'PLUS Mensuel',
                'subscription_plus_annual' => 'PLUS Annuel',
                'subscription_pro' => 'PRO Mensuel',
                'subscription_pro_annual' => 'PRO Annuel',
                'subscription_early_bird' => 'Early Bird',
                default => 'Unknown'
            };
        } elseif ($paymentType === 'pattern') {
            $type = 'pattern';
        }

        Response::success([
            'status' => $result['status'],
            'type' => $type,
            'credits_amount' => $creditsAmount,
            'plan' => $plan,
            'amount' => $result['amount_total'],
            'metadata' => $result['metadata']
        ]);
    }

    /**
     * [AI:Claude] Webhook Stripe pour traiter les événements
     * POST /api/payments/webhook
     */

    /**
     * [AI:Claude] Créer une session Customer Portal Stripe pour gérer l'abonnement
     * POST /api/payments/portal
     */
    public function createPortal(): void
    {
        $authMiddleware = new \App\Middleware\AuthMiddleware();
        $userData = $authMiddleware->authenticate();

        if ($userData === null)
            return;

        $user = $this->userModel->findById($userData['user_id']);

        $customerId = $user['stripe_customer_id'] ?? null;

        // [AI:Claude] Si pas de customer_id en base, le chercher/créer via l'email
        if (!$customerId) {
            $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
            $customerId = $this->stripeService->createOrGetCustomer($user['email'], $name ?: $user['email']);
            if ($customerId) {
                $this->userModel->update($userData['user_id'], ['stripe_customer_id' => $customerId]);
            }
        }

        if (!$customerId) {
            Response::serverError('Impossible d\'accéder au portail : aucun compte Stripe trouvé');
            return;
        }

        $returnUrl = rtrim($_ENV['FRONTEND_URL'] ?? 'https://yarnflow.fr', '/') . '/subscription';
        $result = $this->stripeService->createPortalSession($customerId, $returnUrl);

        if (!$result['success'])
            Response::serverError('Erreur lors de la création du portail client');

        Response::success(['portal_url' => $result['url']]);
    }

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

        // Traiter l'événement selon son type
        try {
            if ($result['event'] === 'checkout_completed') {
                $this->processCheckoutCompleted($result);
            } elseif ($result['event'] === 'invoice_paid') {
                $this->processInvoicePaid($result);
            } elseif ($result['event'] === 'subscription_updated') {
                $this->processSubscriptionUpdated($result);
            } elseif ($result['event'] === 'subscription_deleted') {
                $this->processSubscriptionDeleted($result);
            } elseif ($result['event'] === 'payment_succeeded') {
                $this->processPaymentSucceeded($result);
            } elseif ($result['event'] === 'subscription_created') {
                $this->processSubscriptionCreated($result);
            }
        } catch (\Throwable $e) {
            error_log('[Webhook ERROR] ' . get_class($e) . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            error_log('[Webhook Stack] ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }

        http_response_code(200);
        echo json_encode(['success' => true]);
        exit;
    }

    /**
     * Traiter le renouvellement d'abonnement (invoice.paid)
     * Étend subscription_expires_at et remet les crédits mensuels à jour
     */
    private function processInvoicePaid(array $data): void
    {
        if (($data['billing_reason'] ?? '') === 'subscription_create') {
            return;
        }

        $customerId = $data['customer_id'] ?? null;
        if (!$customerId) return;

        $user = $this->userModel->findOne(['stripe_customer_id' => $customerId]);
        if (!$user) {
            error_log("[invoice.paid] Utilisateur introuvable pour customer {$customerId}");
            return;
        }

        $userId = (int)$user['id'];
        $subscriptionType = $user['subscription_type'];

        // Ne prolonger que les abonnements actifs (pas FREE)
        if ($subscriptionType === SUBSCRIPTION_FREE) return;

        // Prolonger d'un mois ou d'un an selon le plan
        $isAnnual = in_array($subscriptionType, [SUBSCRIPTION_PLUS_ANNUAL, SUBSCRIPTION_PRO_ANNUAL]);
        $newExpiry = date('Y-m-d H:i:s', strtotime($isAnnual ? '+1 year' : '+1 month'));

        $this->userModel->updateSubscription($userId, $subscriptionType, $newExpiry);
        $this->creditManager->initializeUserCredits($userId, $subscriptionType);

        error_log("[invoice.paid] User {$userId} → plan {$subscriptionType} prolongé jusqu'au {$newExpiry}, crédits réinitialisés");
    }

    /**
     * Traiter le changement de statut d'abonnement (customer.subscription.updated)
     * Dégrade en FREE si past_due ou unpaid.
     * Met à jour le plan si changement via le Customer Portal Stripe.
     */
    private function processSubscriptionUpdated(array $data): void
    {
        $status = $data['status'] ?? '';
        $customerId = $data['customer_id'] ?? null;
        if (!$customerId) return;

        $user = $this->userModel->findOne(['stripe_customer_id' => $customerId]);
        if (!$user) return;

        $userId = (int)$user['id'];

        if (in_array($status, ['past_due', 'unpaid'])) {
            $this->userModel->updateSubscription($userId, SUBSCRIPTION_FREE, null);
            $this->creditManager->initializeUserCredits($userId, SUBSCRIPTION_FREE);
            error_log("[subscription.updated] user={$userId} rétrogradé FREE — statut={$status}");
            return;
        }

        if ($status !== 'active') return;

        $subscriptionId = $data['subscription_id'] ?? null;
        $storedSubId    = $user['stripe_subscription_id'] ?? null;
        $currentPlan    = $user['subscription_type'] ?? SUBSCRIPTION_FREE;
        $priceId        = $data['price_id'] ?? null;

        // Guard 1 : l'activation initiale FREE → paid appartient à checkout.session.completed.
        if ($currentPlan === SUBSCRIPTION_FREE) return;

        // Guard 2 : ignorer les events d'un abonnement différent (vieux tests, anciens abonnements).
        if ($subscriptionId && $storedSubId && $subscriptionId !== $storedSubId) {
            error_log("[subscription.updated] ignoré — subId différent pour user={$userId}");
            return;
        }

        if ($priceId) {
            $newPlan = $this->resolvePlanFromPriceId($priceId);
            if ($newPlan && $newPlan !== $currentPlan) {
                $isAnnual = in_array($newPlan, [SUBSCRIPTION_PLUS_ANNUAL, SUBSCRIPTION_PRO_ANNUAL]);
                $newExpiry = date('Y-m-d H:i:s', strtotime($isAnnual ? '+1 year' : '+1 month'));
                $this->userModel->updateSubscription($userId, $newPlan, $newExpiry);
                $this->creditManager->initializeUserCredits($userId, $newPlan);
                error_log("[subscription.updated] user={$userId} changement de plan : {$currentPlan} → {$newPlan}");
            }
        }
    }

    /**
     * Résoudre le type d'abonnement à partir d'un Stripe price ID.
     */
    private function resolvePlanFromPriceId(string $priceId): ?string
    {
        $map = [
            $_ENV['STRIPE_PRICE_ID_PLUS_MONTHLY']  ?? '' => SUBSCRIPTION_PLUS,
            $_ENV['STRIPE_PRICE_ID_PLUS_ANNUAL']   ?? '' => SUBSCRIPTION_PLUS_ANNUAL,
            $_ENV['STRIPE_PRICE_ID_PRO_MONTHLY']   ?? '' => SUBSCRIPTION_PRO,
            $_ENV['STRIPE_PRICE_ID_PRO_ANNUAL']    ?? '' => SUBSCRIPTION_PRO_ANNUAL,
            $_ENV['STRIPE_PRICE_ID_EARLY_BIRD']    ?? '' => SUBSCRIPTION_EARLY_BIRD,
        ];
        unset($map['']);
        return $map[$priceId] ?? null;
    }

    /**
     * [AI:Claude] Traiter la complétion d'un paiement
     */
    private function processCheckoutCompleted(array $data): void
    {
        $userId = (int)$data['user_id'];
        $patternId = isset($data['pattern_id']) ? (int)$data['pattern_id'] : null;
        $paymentType = $data['payment_type'];

        if ($userId === 0) {
            error_log("[checkout.completed] ABORT: user_id manquant dans les metadata Stripe (session=" . ($data['session_id'] ?? 'N/A') . ")");
            return;
        }

        // Vérifier que le montant payé correspond au prix attendu
        if (isset($data['amount'])) {
            $expectedAmount = $this->getExpectedAmount($paymentType);
            $actualAmount = $data['amount'];

            if ($expectedAmount !== null && abs($expectedAmount - $actualAmount) > 0.01) {
                error_log("[checkout.completed] SECURITY BLOCK: paymentType={$paymentType} expected={$expectedAmount} actual={$actualAmount} session=" . ($data['session_id'] ?? 'N/A'));
                return;
            }
        }

        // Idempotence : ne pas traiter deux fois la même session
        $payment = $this->paymentModel->findOne(['stripe_session_id' => $data['session_id'] ?? '']);
        if ($payment && $payment['status'] === PAYMENT_COMPLETED) {
            error_log("[checkout.completed] Session {$data['session_id']} déjà traitée — ignorée");
            return;
        }

        if ($payment) {
            $this->paymentModel->updateStatus($payment['id'], PAYMENT_COMPLETED);
        }

        // Sauvegarder stripe_customer_id et stripe_subscription_id
        $updateFields = [];
        if (!empty($data['customer_id'])) {
            $existingUser = $this->userModel->findById($userId);
            if (empty($existingUser['stripe_customer_id'])) {
                $updateFields['stripe_customer_id'] = $data['customer_id'];
            }
        }
        if (!empty($data['subscription_id'])) {
            $updateFields['stripe_subscription_id'] = $data['subscription_id'];
        }
        if (!empty($updateFields)) {
            $this->userModel->update($userId, $updateFields);
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

            // Allouer les crédits mensuels correspondant au nouveau plan
            $this->creditManager->initializeUserCredits($userId, $subscriptionType);
            error_log("[checkout.completed] user={$userId} plan={$subscriptionType} expires={$expiresAt}");

            // Email de bienvenue plan payant
            $user = $this->userModel->findById($userId);
            if ($user && !empty($user['email'])) {
                $planLabel = str_contains($subscriptionType, 'pro') ? 'PRO' : 'PLUS';
                $this->emailService->sendPlusWelcomeEmail($user['email'], $user['first_name'] ?? '', $subscriptionType, $userId);
                $this->pushService->sendToUser($userId, "Bienvenue dans YarnFlow {$planLabel} !", 'Ton abonnement est actif. Découvre tes nouvelles fonctionnalités.', '/subscription');
            }

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

        // [AI:Claude] Si c'est un pack de crédits, ajouter les crédits
        if (in_array($paymentType, [PAYMENT_CREDITS_PACK_50, PAYMENT_CREDITS_PACK_150])) {
            $creditsToAdd = match($paymentType) {
                PAYMENT_CREDITS_PACK_50 => 50,
                PAYMENT_CREDITS_PACK_150 => 150,
                default => 0
            };

            if ($creditsToAdd > 0) {
                $this->creditManager->addPurchasedCredits($userId, $creditsToAdd);
                error_log("[CREDITS] {$creditsToAdd} crédits ajoutés pour user {$userId} (pack: {$paymentType})");
            }
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
     * [AI:Claude] Obtenir le montant attendu pour un type de paiement
     *
     * @param string $paymentType Type de paiement
     * @return float|null Montant attendu en euros, null si inconnu
     */
    private function getExpectedAmount(string $paymentType): ?float
    {
        return match($paymentType) {
            'subscription_plus' => 3.99,
            'subscription_plus_annual' => 35.88,
            'subscription_pro' => 6.99,
            'subscription_pro_annual' => 59.99,
            'subscription_early_bird' => 2.99,
            PAYMENT_CREDITS_PACK_50 => 4.99,
            PAYMENT_CREDITS_PACK_150 => 9.99,
            default => null // Patron personnalisé, pas de montant fixe
        };
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
