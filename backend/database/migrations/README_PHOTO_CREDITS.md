# 💎 Système de Crédits Photos IA (v0.11.0)

## 📋 Vue d'ensemble

Ce système gère les **crédits photos IA** pour l'AI Photo Studio de YarnFlow. Il permet de :
- ✅ Attribuer des **crédits mensuels** selon le plan d'abonnement
- ✅ Vendre des **packs de crédits** permanents via Stripe
- ✅ **Reset automatique** des crédits mensuels chaque mois
- ✅ **Audit trail** complet de toutes les générations IA

---

## 🗄️ Tables créées

### 1. `user_photo_credits`
Stocke les crédits disponibles par utilisateur.

**Colonnes principales :**
- `monthly_credits` : Crédits inclus dans l'abonnement (reset chaque mois)
- `purchased_credits` : Crédits achetés (permanents, jamais réinitialisés)
- `credits_used_this_month` : Crédits consommés ce mois
- `total_credits_used` : Total historique des crédits consommés
- `last_reset_at` : Date du dernier reset mensuel

**Quotas mensuels :**
- FREE : 3 crédits/mois
- MONTHLY (Standard 4.99€) : 30 crédits/mois
- YEARLY (Premium 9.99€) : 120 crédits/mois

### 2. `credit_purchases`
Historique des achats de packs de crédits.

**Packs disponibles :**
- **Small** : 2.99€ → 22 crédits (20 + 2 bonus)
- **Medium** : 6.99€ → 57 crédits (50 + 7 bonus)
- **Large** : 14.99€ → 220 crédits (200 + 20 bonus)

**Statuts possibles :**
- `pending` : Paiement en cours
- `completed` : Paiement validé, crédits ajoutés
- `failed` : Échec du paiement
- `refunded` : Remboursé

### 3. `photo_generations_log`
Audit trail de toutes les générations photos IA.

**Informations trackées :**
- Utilisateur, photo concernée
- Crédits utilisés et type (monthly/purchased)
- Modèle IA, style, purpose, prompt
- Temps de génération, succès/erreur

---

## 🔄 Logique de consommation des crédits

Ordre de priorité (géré par `CreditManager::useCredit()`) :

```
1. Crédits mensuels (monthly_credits)
   ↓ Si épuisés
2. Crédits achetés (purchased_credits)
   ↓ Si épuisés
❌ Erreur : Crédits insuffisants
```

**Exemple :**
- Utilisateur FREE : 3 crédits mensuels
- Achète pack Small : +22 crédits permanents
- Total disponible : 25 crédits
- Génère 5 photos → Utilise d'abord les 3 mensuels, puis 2 achetés
- Reste : 0 mensuels + 20 achetés

---

## ⏰ Reset automatique mensuel

### Event MySQL : `reset_monthly_photo_credits`

- **Fréquence** : Tous les jours à 00h00
- **Action** : Reset les crédits mensuels si >= 1 mois depuis le dernier reset
- **Fonctionnement** :
  ```sql
  -- Si dernier reset = 2025-10-18 et aujourd'hui = 2025-11-18
  -- → Reset effectué automatiquement
  ```

### Trigger : `init_user_photo_credits`

- **Déclencheur** : Création d'un nouvel utilisateur
- **Action** : Initialise automatiquement ses crédits selon son plan

---

## 🚀 Installation

### 1. Exécuter la migration

```bash
mysql -u root -p patron_maker < database/migrations/add_photo_credits_system.sql
```

### 2. Vérifier les tables créées

```bash
mysql -u root -p patron_maker -e "SHOW TABLES LIKE '%credit%';"
```

Résultat attendu :
```
+--------------------------------+
| Tables_in_patron_maker (%credit%) |
+--------------------------------+
| credit_purchases               |
| photo_generations_log          |
| user_photo_credits             |
+--------------------------------+
```

### 3. Vérifier l'initialisation des utilisateurs

```sql
SELECT
    u.email,
    u.subscription_type,
    upc.monthly_credits,
    upc.purchased_credits
FROM users u
LEFT JOIN user_photo_credits upc ON upc.user_id = u.id;
```

---

## 📊 Vues SQL disponibles

### `v_user_credits_summary`
Vue complète des crédits par utilisateur avec infos abonnement.

```sql
SELECT * FROM v_user_credits_summary WHERE user_id = 1;
```

**Colonnes :**
- `user_id`, `email`, `subscription_type`
- `monthly_credits`, `purchased_credits`, `total_available`
- `credits_used_this_month`, `total_credits_used`
- `last_reset_at`, `days_since_reset`

### `v_user_generation_stats`
Statistiques de génération par utilisateur.

```sql
SELECT * FROM v_user_generation_stats WHERE user_id = 1;
```

**Colonnes :**
- `total_generations` : Nombre total de générations
- `total_credits_consumed` : Crédits consommés
- `successful_generations` : Générations réussies
- `failed_generations` : Générations échouées
- `avg_generation_time_ms` : Temps moyen de génération
- `last_generation_at` : Dernière génération

---

## 🔍 Requêtes SQL utiles

### Obtenir les crédits d'un utilisateur

```sql
SELECT * FROM v_user_credits_summary WHERE user_id = 1;
```

### Historique des achats de packs

```sql
SELECT
    id,
    pack_type,
    amount,
    total_credits,
    status,
    created_at
FROM credit_purchases
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Log des générations IA

```sql
SELECT
    id,
    photo_id,
    credit_type,
    ai_model,
    style,
    success,
    generation_time_ms,
    created_at
FROM photo_generations_log
WHERE user_id = 1
ORDER BY created_at DESC
LIMIT 10;
```

### Utilisateurs avec crédits épuisés

```sql
SELECT
    user_id,
    email,
    subscription_type,
    total_available
FROM v_user_credits_summary
WHERE total_available = 0;
```

### Statistiques globales

```sql
SELECT
    COUNT(DISTINCT user_id) as total_users,
    SUM(total_generations) as total_generations,
    SUM(successful_generations) as successful_gens,
    SUM(failed_generations) as failed_gens,
    AVG(avg_generation_time_ms) as avg_time_ms
FROM v_user_generation_stats;
```

---

## 🧪 Tests recommandés

### 1. Vérifier l'initialisation d'un nouvel utilisateur

```sql
-- Créer un utilisateur FREE
INSERT INTO users (email, password, subscription_type)
VALUES ('test@example.com', 'hash', 'free');

-- Vérifier ses crédits (doit avoir 3 crédits mensuels)
SELECT * FROM user_photo_credits WHERE user_id = LAST_INSERT_ID();
```

### 2. Simuler une génération photo

```sql
-- Utiliser 1 crédit mensuel
UPDATE user_photo_credits
SET monthly_credits = monthly_credits - 1,
    credits_used_this_month = credits_used_this_month + 1,
    total_credits_used = total_credits_used + 1
WHERE user_id = 1;

-- Logger la génération
INSERT INTO photo_generations_log
(user_id, photo_id, credits_used, credit_type, ai_model, success)
VALUES (1, 1, 1, 'monthly', 'gemini-2.5-flash-image', TRUE);
```

### 3. Simuler un achat de pack

```sql
-- Achat pack Small (22 crédits)
INSERT INTO credit_purchases
(user_id, pack_type, amount, credits_purchased, bonus_credits, total_credits, status)
VALUES (1, 'small', 2.99, 20, 2, 22, 'completed');

-- Créditer l'utilisateur
UPDATE user_photo_credits
SET purchased_credits = purchased_credits + 22
WHERE user_id = 1;
```

### 4. Tester le reset mensuel

```sql
-- Simuler un dernier reset il y a 2 mois
UPDATE user_photo_credits
SET last_reset_at = DATE_SUB(NOW(), INTERVAL 2 MONTH)
WHERE user_id = 1;

-- Déclencher manuellement l'event de reset
CALL reset_monthly_photo_credits();

-- Vérifier que les crédits ont été reset
SELECT * FROM user_photo_credits WHERE user_id = 1;
```

---

## ⚠️ Points d'attention

### Event Scheduler MySQL
L'event scheduler DOIT être activé pour le reset automatique :

```sql
-- Vérifier le statut
SHOW VARIABLES LIKE 'event_scheduler';

-- Activer si nécessaire
SET GLOBAL event_scheduler = ON;
```

### Trigger vs Application Logic
- Le **trigger** initialise les crédits à la création d'un user
- Le **CreditManager** gère la logique métier (consommation, reset, achat)
- Les deux DOIVENT être synchronisés

### Gestion des échecs de paiement
Si un paiement Stripe échoue :
1. Le statut reste `pending` ou passe à `failed`
2. Les crédits ne sont PAS ajoutés
3. Webhook Stripe DOIT appeler `CreditManager::completeCreditPurchase()`

---

## 📝 Changelog

### v0.11.0 - 2025-11-18
- ✅ Création tables `user_photo_credits`, `credit_purchases`, `photo_generations_log`
- ✅ Event scheduler pour reset automatique mensuel
- ✅ Trigger pour initialisation nouveaux utilisateurs
- ✅ Vues SQL pour reporting
- ✅ Initialisation des utilisateurs existants

---

## 🔗 Fichiers liés

- **Migration SQL** : `add_photo_credits_system.sql`
- **Service PHP** : `backend/services/CreditManager.php`
- **Controller** : `backend/controllers/PhotoController.php`
- **Documentation projet** : `CLAUDE.md` (section AI Photo Studio)

---

**Auteur** : Nathalie + AI Assistants
**Date** : 2025-11-18
**Version** : 0.11.0 - AI Photo Studio
