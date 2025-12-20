<?php
/**
 * @file StripeService.php
 * @brief Service de gestion des paiements Stripe
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création initiale
 *
 * @history
 *   2025-11-13 [AI:Claude] Création du service Stripe avec checkout et webhooks
 */

declare(strict_types=1);

namespace App\Services;

use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\Webhook;
use Stripe\Customer;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;

/**
 * [AI:Claude] Service de gestion des paiements via Stripe
 */
class StripeService
{
    private string $secretKey;
    private string $webhookSecret;
    private string $successUrl;
    private string $cancelUrl;

    // Price IDs Stripe (créés dans le Dashboard)
    private string $plusMonthlyPriceId;
    private string $plusAnnualPriceId;
    private string $proMonthlyPriceId;
    private string $proAnnualPriceId;
    private string $earlyBirdPriceId;
    private string $credits50PriceId;
    private string $credits150PriceId;

    public function __construct()
    {
        $this->secretKey = $_ENV['STRIPE_SECRET_KEY'] ?? '';
        $this->webhookSecret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
        $this->successUrl = $_ENV['FRONTEND_URL'].'/payment/success?session_id={CHECKOUT_SESSION_ID}';
        $this->cancelUrl = $_ENV['FRONTEND_URL'].'/payment/cancel';

        // Charger les Price IDs depuis .env
        $this->plusMonthlyPriceId = $_ENV['STRIPE_PRICE_ID_PLUS_MONTHLY'] ?? '';
        $this->plusAnnualPriceId = $_ENV['STRIPE_PRICE_ID_PLUS_ANNUAL'] ?? '';
        $this->proMonthlyPriceId = $_ENV['STRIPE_PRICE_ID_PRO_MONTHLY'] ?? '';
        $this->proAnnualPriceId = $_ENV['STRIPE_PRICE_ID_PRO_ANNUAL'] ?? '';
        $this->earlyBirdPriceId = $_ENV['STRIPE_PRICE_ID_EARLY_BIRD'] ?? '';
        $this->credits50PriceId = $_ENV['STRIPE_PRICE_ID_CREDITS_50'] ?? '';
        $this->credits150PriceId = $_ENV['STRIPE_PRICE_ID_CREDITS_150'] ?? '';

        Stripe::setApiKey($this->secretKey);
    }

    /**
     * [AI:Claude] Créer une session de paiement pour un patron unique
     *
     * @param int $userId ID de l'utilisateur
     * @param int $patternId ID du patron
     * @param float $amount Montant en euros
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createPatternCheckoutSession(
        int $userId,
        int $patternId,
        float $amount,
        string $customerEmail
    ): array {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'eur',
                        'product_data' => [
                            'name' => 'Patron de crochet personnalisé',
                            'description' => 'Génération d\'un patron sur mesure'
                        ],
                        'unit_amount' => (int)($amount * 100)
                    ],
                    'quantity' => 1
                ]],
                'mode' => 'payment',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'pattern_id' => $patternId,
                    'payment_type' => 'pattern'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création session : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session PLUS mensuel
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createPlusMonthlySession(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->plusMonthlyPriceId,
                    'quantity' => 1
                ]],
                'mode' => 'subscription',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'subscription_plus'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création PLUS mensuel : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session PLUS annuel
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createPlusAnnualSession(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->plusAnnualPriceId,
                    'quantity' => 1
                ]],
                'mode' => 'subscription',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'subscription_plus_annual'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création PLUS annuel : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session PRO mensuel
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createProMonthlySession(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->proMonthlyPriceId,
                    'quantity' => 1
                ]],
                'mode' => 'subscription',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'subscription_pro'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création PRO mensuel : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session PRO annuel
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createProAnnualSession(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->proAnnualPriceId,
                    'quantity' => 1
                ]],
                'mode' => 'subscription',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'subscription_pro_annual'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création PRO annuel : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session de paiement pour Early Bird (2.99€/mois x 12 mois)
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session créée ou erreur
     */
    public function createEarlyBirdSubscriptionSession(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->earlyBirdPriceId,
                    'quantity' => 1
                ]],
                'mode' => 'subscription',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'subscription_early_bird'
                ],
                'subscription_data' => [
                    'metadata' => [
                        'early_bird' => 'true',
                        'duration_months' => '12'
                    ]
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création Early Bird : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session pour pack 50 crédits
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createCredits50Session(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->credits50PriceId,
                    'quantity' => 1
                ]],
                'mode' => 'payment',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'credits_pack_50'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création pack 50 crédits : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer une session pour pack 150 crédits
     *
     * @param int $userId ID de l'utilisateur
     * @param string $customerEmail Email du client
     * @return array Session Stripe créée
     */
    public function createCredits150Session(int $userId, string $customerEmail): array
    {
        try {
            $session = Session::create([
                'payment_method_types' => ['card'],
                'customer_email' => $customerEmail,
                'line_items' => [[
                    'price' => $this->credits150PriceId,
                    'quantity' => 1
                ]],
                'mode' => 'payment',
                'success_url' => $this->successUrl,
                'cancel_url' => $this->cancelUrl,
                'metadata' => [
                    'user_id' => $userId,
                    'payment_type' => 'credits_pack_150'
                ]
            ]);

            return [
                'success' => true,
                'session_id' => $session->id,
                'checkout_url' => $session->url
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création pack 150 crédits : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Vérifier le statut d'une session de paiement
     *
     * @param string $sessionId ID de la session Stripe
     * @return array Informations sur la session
     */
    public function getSessionStatus(string $sessionId): array
    {
        try {
            $session = Session::retrieve($sessionId);

            return [
                'success' => true,
                'status' => $session->payment_status,
                'customer_email' => $session->customer_email,
                'amount_total' => $session->amount_total / 100,
                'metadata' => $session->metadata
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur récupération session : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Créer ou récupérer un client Stripe
     *
     * @param string $email Email du client
     * @param string $name Nom complet (optionnel)
     * @return string|null ID du client Stripe
     */
    public function createOrGetCustomer(string $email, string $name = ''): ?string
    {
        try {
            // [AI:Claude] Chercher si le client existe déjà
            $customers = Customer::all(['email' => $email, 'limit' => 1]);

            if (count($customers->data) > 0)
                return $customers->data[0]->id;

            // [AI:Claude] Créer un nouveau client
            $customer = Customer::create([
                'email' => $email,
                'name' => $name
            ]);

            return $customer->id;

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur création client : '.$e->getMessage());
            return null;
        }
    }

    /**
     * [AI:Claude] Vérifier et traiter un webhook Stripe
     *
     * @param string $payload Corps de la requête
     * @param string $signature Signature Stripe
     * @return array Événement traité
     */
    public function handleWebhook(string $payload, string $signature): array
    {
        try {
            $event = Webhook::constructEvent($payload, $signature, $this->webhookSecret);

            // [AI:Claude] Traiter selon le type d'événement
            return match($event->type) {
                'checkout.session.completed' => $this->handleCheckoutCompleted($event->data->object),
                'payment_intent.succeeded' => $this->handlePaymentSucceeded($event->data->object),
                'payment_intent.payment_failed' => $this->handlePaymentFailed($event->data->object),
                'customer.subscription.created' => $this->handleSubscriptionCreated($event->data->object),
                'customer.subscription.deleted' => $this->handleSubscriptionDeleted($event->data->object),
                default => [
                    'success' => true,
                    'message' => 'Événement non géré : '.$event->type
                ]
            };

        } catch (\Exception $e) {
            error_log('[Stripe Webhook] Erreur : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * [AI:Claude] Gérer la complétion d'un paiement
     */
    private function handleCheckoutCompleted(object $session): array
    {
        $metadata = $session->metadata;

        return [
            'success' => true,
            'event' => 'checkout_completed',
            'user_id' => $metadata->user_id ?? null,
            'pattern_id' => $metadata->pattern_id ?? null,
            'payment_type' => $metadata->payment_type ?? null,
            'amount' => $session->amount_total / 100
        ];
    }

    /**
     * [AI:Claude] Gérer le succès d'un paiement
     */
    private function handlePaymentSucceeded(object $paymentIntent): array
    {
        return [
            'success' => true,
            'event' => 'payment_succeeded',
            'payment_intent_id' => $paymentIntent->id,
            'amount' => $paymentIntent->amount / 100
        ];
    }

    /**
     * [AI:Claude] Gérer l'échec d'un paiement
     */
    private function handlePaymentFailed(object $paymentIntent): array
    {
        return [
            'success' => true,
            'event' => 'payment_failed',
            'payment_intent_id' => $paymentIntent->id,
            'error' => $paymentIntent->last_payment_error->message ?? 'Erreur inconnue'
        ];
    }

    /**
     * [AI:Claude] Gérer la création d'un abonnement
     */
    private function handleSubscriptionCreated(object $subscription): array
    {
        return [
            'success' => true,
            'event' => 'subscription_created',
            'subscription_id' => $subscription->id,
            'customer_id' => $subscription->customer,
            'status' => $subscription->status
        ];
    }

    /**
     * [AI:Claude] Gérer l'annulation d'un abonnement
     */
    private function handleSubscriptionDeleted(object $subscription): array
    {
        return [
            'success' => true,
            'event' => 'subscription_deleted',
            'subscription_id' => $subscription->id,
            'customer_id' => $subscription->customer
        ];
    }

    /**
     * [AI:Claude] Créer un remboursement
     *
     * @param string $paymentIntentId ID du paiement
     * @param float|null $amount Montant à rembourser (null = total)
     * @return array Résultat du remboursement
     */
    public function createRefund(string $paymentIntentId, ?float $amount = null): array
    {
        try {
            $refundData = ['payment_intent' => $paymentIntentId];

            if ($amount !== null)
                $refundData['amount'] = (int)($amount * 100);

            $refund = \Stripe\Refund::create($refundData);

            return [
                'success' => true,
                'refund_id' => $refund->id,
                'status' => $refund->status,
                'amount' => $refund->amount / 100
            ];

        } catch (ApiErrorException $e) {
            error_log('[Stripe] Erreur remboursement : '.$e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
