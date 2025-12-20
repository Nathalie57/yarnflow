# Récapitulatif Migration Stripe - Price IDs

**Date** : 2025-12-19
**Version** : 0.15.0

---

## ✅ Modifications effectuées

### 1. StripeService.php - Migration vers Price IDs

**Fichier** : `/backend/services/StripeService.php`

**Changements** :
- ✅ Ajout de 7 propriétés privées pour stocker les Price IDs
- ✅ Chargement des Price IDs depuis `.env` dans le constructeur
- ✅ Modification de `createPlusMonthlySession()` - utilise `$this->plusMonthlyPriceId`
- ✅ Modification de `createPlusAnnualSession()` - utilise `$this->plusAnnualPriceId`
- ✅ Modification de `createProMonthlySession()` - utilise `$this->proMonthlyPriceId`
- ✅ Modification de `createProAnnualSession()` - utilise `$this->proAnnualPriceId`
- ✅ Modification de `createEarlyBirdSubscriptionSession()` - utilise `$this->earlyBirdPriceId`
- ✅ Ajout de `createCredits50Session()` - nouvelle méthode pour pack 50 crédits
- ✅ Ajout de `createCredits150Session()` - nouvelle méthode pour pack 150 crédits

**Avant** :
```php
'line_items' => [[
    'price_data' => [
        'currency' => 'eur',
        'product_data' => [
            'name' => 'YarnFlow PLUS - Mensuel',
            'description' => '...'
        ],
        'unit_amount' => (int)($plusPrice * 100),
        'recurring' => ['interval' => 'month']
    ],
    'quantity' => 1
]]
```

**Après** :
```php
'line_items' => [[
    'price' => $this->plusMonthlyPriceId,
    'quantity' => 1
]]
```

---

### 2. PaymentController.php - Gestion des packs de crédits

**Fichier** : `/backend/controllers/PaymentController.php`

**Changements** :
- ✅ Ajout de la méthode `createCreditsCheckout()` (lignes 201-264)
- ✅ Modification de `processCheckoutCompleted()` pour gérer les packs de crédits (lignes 394-406)
- ✅ Utilisation des constantes `PAYMENT_CREDITS_PACK_50` et `PAYMENT_CREDITS_PACK_150`

**Nouvelle route API** :
```
POST /api/payments/checkout/credits
Body: { "pack": "50" } ou { "pack": "150" }
```

---

### 3. Routes API - Nouvelle route crédits

**Fichier** : `/backend/routes/api.php`

**Changements** :
- ✅ Ajout de la route `POST payments/checkout/credits` (ligne 89)

---

### 4. Constantes - Nouveaux types de paiement

**Fichier** : `/backend/config/constants.php`

**Changements** :
- ✅ Ajout de `PAYMENT_CREDITS_PACK_50 = 'credits_pack_50'`
- ✅ Ajout de `PAYMENT_CREDITS_PACK_150 = 'credits_pack_150'`

---

### 5. Configuration .env - Nouvelles variables

**Fichier** : `/backend/.env.example`

**Changements** :
- ✅ Ajout de 7 variables `STRIPE_PRICE_ID_*` avec documentation
- ✅ Ajout des commentaires explicatifs pour chaque Price ID
- ✅ Conservation des variables `SUBSCRIPTION_*_PRICE` pour l'affichage

**Nouvelles variables requises** :
```ini
STRIPE_PRICE_ID_PLUS_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PLUS_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_EARLY_BIRD=price_xxxxx
STRIPE_PRICE_ID_CREDITS_50=price_xxxxx
STRIPE_PRICE_ID_CREDITS_150=price_xxxxx
```

---

## 📋 Checklist de déploiement

### Étape 1 : Configuration Stripe Dashboard

- [ ] Se connecter sur https://dashboard.stripe.com
- [ ] Activer le mode **Production**
- [ ] Créer le produit **YarnFlow PLUS** avec 2 prix (mensuel 2.99€, annuel 29.99€)
- [ ] Créer le produit **YarnFlow PRO** avec 2 prix (mensuel 4.99€, annuel 49.99€)
- [ ] Créer le produit **YarnFlow Early Bird** (mensuel 2.99€)
- [ ] Créer le produit **Pack 50 crédits photos** (paiement unique 4.99€)
- [ ] Créer le produit **Pack 150 crédits photos** (paiement unique 9.99€)
- [ ] Copier les 7 Price IDs (format `price_xxxxx`)

### Étape 2 : Configuration Webhook

- [ ] Créer un webhook pointant vers `https://yarnflow.fr/api/payments/webhook`
- [ ] Activer les événements :
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copier le Webhook Secret (format `whsec_xxxxx`)

### Étape 3 : Configuration Backend

- [ ] Éditer `/backend/.env` de production
- [ ] Ajouter `STRIPE_SECRET_KEY=sk_live_xxxxx`
- [ ] Ajouter `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
- [ ] Ajouter les 7 `STRIPE_PRICE_ID_*` copiés depuis Stripe Dashboard
- [ ] Vérifier les prix affichés dans `SUBSCRIPTION_*_PRICE`

### Étape 4 : Tests en mode Test

- [ ] Basculer en mode **Test** dans Stripe Dashboard
- [ ] Créer les mêmes produits en mode test
- [ ] Tester un abonnement PLUS avec carte `4242 4242 4242 4242`
- [ ] Tester un abonnement PRO avec carte test
- [ ] Tester un pack 50 crédits
- [ ] Tester un pack 150 crédits
- [ ] Vérifier que le webhook reçoit bien les événements
- [ ] Vérifier dans la BDD que :
  - L'abonnement est mis à jour (`users.subscription_type`)
  - Les crédits sont ajoutés (`user_photo_credits.purchased_credits`)
  - Le paiement est marqué `completed` (`payments.status`)

### Étape 5 : Mise en production

- [ ] Repasser en mode **Production** dans Stripe Dashboard
- [ ] Remplacer les clés test par les clés live dans `.env`
- [ ] Redémarrer le serveur backend
- [ ] Tester le flux d'achat complet
- [ ] Surveiller les logs webhook pendant 24h

---

## 🔍 Vérifications post-déploiement

### Webhook fonctionnel
```bash
# Vérifier les logs Stripe Dashboard
# Développeurs > Webhooks > Logs
# Tous les événements doivent être en vert (200 OK)
```

### Paiements enregistrés
```sql
-- Vérifier les paiements dans la BDD
SELECT * FROM payments
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;
```

### Abonnements actifs
```sql
-- Vérifier les abonnements
SELECT id, email, subscription_type, subscription_expires_at
FROM users
WHERE subscription_type IN ('plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird')
ORDER BY created_at DESC;
```

### Crédits photos
```sql
-- Vérifier les crédits achetés
SELECT u.email, c.purchased_credits, c.last_purchase_at
FROM user_photo_credits c
JOIN users u ON c.user_id = u.id
WHERE c.purchased_credits > 0
ORDER BY c.last_purchase_at DESC;
```

---

## 🚨 Problèmes connus et solutions

### "No such price: price_xxxxx"
**Cause** : Price ID invalide ou inexistant
**Solution** : Vérifier que le Price ID existe dans Stripe Dashboard (mode Production)

### Webhook retourne 400
**Cause** : Signature webhook invalide
**Solution** : Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env`

### Paiement réussi mais abonnement non activé
**Cause** : Webhook non reçu ou erreur dans `processCheckoutCompleted()`
**Solution** : Vérifier les logs webhook dans Stripe Dashboard et les logs backend

### Crédits non ajoutés après achat
**Cause** : `payment_type` incorrect ou erreur dans `CreditManager`
**Solution** : Vérifier les logs backend `[CREDITS]` et la table `user_photo_credits`

---

## 📚 Documentation

- Guide complet : `STRIPE_SETUP.md`
- Documentation Stripe : https://stripe.com/docs
- Tests cartes : https://stripe.com/docs/testing
- Webhooks : https://stripe.com/docs/webhooks

---

## ✨ Avantages de cette migration

1. **Contrôle centralisé** : Modification des prix depuis Stripe Dashboard sans redéploiement
2. **Analytics précis** : Meilleur suivi des conversions et MRR dans Stripe
3. **Flexibilité** : Support natif des coupons, essais gratuits, paliers de prix
4. **Performance** : Sessions Stripe plus rapides (pas de création de prix dynamique)
5. **Sécurité** : Réduction des risques d'erreurs de prix (single source of truth)

---

**Migration complétée avec succès ! 🎉**
