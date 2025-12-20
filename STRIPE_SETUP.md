# Guide de Configuration Stripe - YarnFlow

**Version** : 0.15.0
**Date** : 2025-12-19

---

## 📋 Prérequis

- Compte Stripe (créer sur https://stripe.com si nécessaire)
- Accès au Dashboard Stripe
- Accès au fichier `.env` de production

---

## 🔧 Étape 1 : Créer les produits dans Stripe Dashboard

### Connexion
1. Se connecter sur https://dashboard.stripe.com
2. **IMPORTANT** : Activer le mode **Production** (toggle en haut à droite)

### Créer les produits récurrents (Abonnements)

#### 1. YarnFlow PLUS
- Aller dans **Produits** > **Ajouter un produit**
- **Nom** : `YarnFlow PLUS`
- **Description** : `7 projets actifs + 15 crédits photos/mois + Tags personnalisés + Organisation premium`

**Prix mensuel** :
- **Prix** : `2.99 EUR`
- **Récurrent** : `Mensuel`
- **ID du prix** : Copier le `price_xxxxx` généré → `STRIPE_PRICE_ID_PLUS_MONTHLY`

**Prix annuel** :
- Cliquer sur **Ajouter un autre prix**
- **Prix** : `29.99 EUR`
- **Récurrent** : `Annuel`
- **ID du prix** : Copier le `price_xxxxx` généré → `STRIPE_PRICE_ID_PLUS_ANNUAL`

#### 2. YarnFlow PRO
- Aller dans **Produits** > **Ajouter un produit**
- **Nom** : `YarnFlow PRO`
- **Description** : `Projets illimités + 30 crédits photos/mois + Support prioritaire + Accès premium aux nouveautés`

**Prix mensuel** :
- **Prix** : `4.99 EUR`
- **Récurrent** : `Mensuel`
- **ID du prix** : Copier → `STRIPE_PRICE_ID_PRO_MONTHLY`

**Prix annuel** :
- **Prix** : `49.99 EUR`
- **Récurrent** : `Annuel`
- **ID du prix** : Copier → `STRIPE_PRICE_ID_PRO_ANNUAL`

#### 3. YarnFlow Early Bird (Waitlist uniquement)
- **Nom** : `YarnFlow Early Bird`
- **Description** : `Offre limitée 200 places - Tous les avantages PRO à 2.99€/mois pendant 12 mois`
- **Prix** : `2.99 EUR`
- **Récurrent** : `Mensuel`
- **ID du prix** : Copier → `STRIPE_PRICE_ID_EARLY_BIRD`

### Créer les produits ponctuels (Packs de crédits)

#### Pack 50 crédits photos
- **Nom** : `Pack 50 crédits photos`
- **Description** : `50 crédits pour générer des photos IA de vos projets tricot/crochet`
- **Prix** : `4.99 EUR`
- **Type** : `Paiement unique`
- **ID du prix** : Copier → `STRIPE_PRICE_ID_CREDITS_50`

#### Pack 150 crédits photos
- **Nom** : `Pack 150 crédits photos`
- **Description** : `150 crédits pour générer des photos IA de vos projets tricot/crochet`
- **Prix** : `9.99 EUR`
- **Type** : `Paiement unique`
- **ID du prix** : Copier → `STRIPE_PRICE_ID_CREDITS_150`

---

## 🔔 Étape 2 : Configurer le Webhook

### Créer le webhook
1. Aller dans **Développeurs** > **Webhooks**
2. Cliquer sur **Ajouter un point de terminaison**
3. **URL du point de terminaison** : `https://yarnflow.fr/api/payments/webhook`
4. **Événements à écouter** :
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

5. Cliquer sur **Ajouter un point de terminaison**
6. **Copier le secret de signature** : `whsec_xxxxx` → `STRIPE_WEBHOOK_SECRET`

---

## 🔑 Étape 3 : Récupérer les clés API

1. Aller dans **Développeurs** > **Clés API**
2. **Clé secrète** (Secret key) :
   - Format : `sk_live_xxxxx`
   - Copier → `STRIPE_SECRET_KEY`
3. **Clé publiable** (Publishable key) - pour le frontend :
   - Format : `pk_live_xxxxx`
   - Copier pour la config frontend

---

## ⚙️ Étape 4 : Mettre à jour le fichier .env

Éditer `/backend/.env` et ajouter :

```ini
# ============================================================================
# Stripe Production
# ============================================================================
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Prix des abonnements
STRIPE_PRICE_ID_PLUS_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PLUS_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx
STRIPE_PRICE_ID_EARLY_BIRD=price_xxxxx

# Prix des packs de crédits
STRIPE_PRICE_ID_CREDITS_50=price_xxxxx
STRIPE_PRICE_ID_CREDITS_150=price_xxxxx

# Pricing (pour affichage, doit correspondre aux prix Stripe)
SUBSCRIPTION_PLUS_MONTHLY_PRICE=2.99
SUBSCRIPTION_PLUS_ANNUAL_PRICE=29.99
SUBSCRIPTION_PRO_MONTHLY_PRICE=4.99
SUBSCRIPTION_PRO_ANNUAL_PRICE=49.99

# URLs de redirection
FRONTEND_URL=https://yarnflow.fr
```

---

## 🧪 Étape 5 : Tester en mode Test

Avant de passer en production, tester avec les clés de test :

1. Basculer en mode **Test** dans Stripe Dashboard
2. Créer les mêmes produits/prix en mode test
3. Utiliser les clés de test : `sk_test_xxxxx` et `pk_test_xxxxx`
4. Tester un paiement avec une carte test : `4242 4242 4242 4242`
5. Vérifier que le webhook reçoit bien les événements

### Cartes de test Stripe
- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`
- CVV : n'importe quel 3 chiffres
- Date : n'importe quelle date future

---

## ✅ Checklist finale

Avant de lancer en production :

- [ ] Compte Stripe vérifié (documents d'identité, infos bancaires)
- [ ] Mode Production activé dans Dashboard
- [ ] 7 produits/prix créés (PLUS mensuel/annuel, PRO mensuel/annuel, Early Bird, 2 packs crédits)
- [ ] Webhook configuré avec l'URL de production
- [ ] Tous les events webhook cochés
- [ ] Clés API copiées dans `.env` de production
- [ ] Test de paiement en mode Test réussi
- [ ] Webhook reçu et traité correctement
- [ ] Frontend mis à jour avec `pk_live_xxxxx`

---

## 📊 Suivi après lancement

### Dashboard Stripe
- Suivre les paiements dans **Paiements**
- Suivre les abonnements dans **Abonnements**
- Vérifier les webhooks dans **Développeurs** > **Webhooks** > **Logs**

### Logs backend
- Vérifier `/backend/logs/` pour les événements de paiement
- Surveiller les erreurs webhook

### Base de données
- Table `payments` : tous les paiements
- Table `users` : `subscription_type` et `subscription_expires_at`
- Table `user_photo_credits` : crédits photos

---

## 🚨 Problèmes courants

### Webhook ne fonctionne pas
1. Vérifier que l'URL est accessible publiquement (pas de localhost)
2. Vérifier `STRIPE_WEBHOOK_SECRET` dans `.env`
3. Vérifier les logs webhook dans Stripe Dashboard

### Paiement ne met pas à jour l'abonnement
1. Vérifier que le webhook `checkout.session.completed` est bien reçu
2. Vérifier les logs dans `/backend/logs/`
3. Vérifier que `metadata.payment_type` est bien renseigné

### Early Bird ne fonctionne pas
1. Vérifier la table `early_bird_slots` (200 places max)
2. Vérifier que l'utilisateur est bien sur la waitlist
3. Vérifier les logs Early Bird

---

## 📞 Support

- Documentation Stripe : https://stripe.com/docs
- Support Stripe : https://support.stripe.com
- Tests API Stripe : https://stripe.com/docs/testing

---

**Bon lancement ! 🚀**
