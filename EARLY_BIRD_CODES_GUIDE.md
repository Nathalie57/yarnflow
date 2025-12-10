# 🎯 Guide Complet : Codes Early Bird YarnFlow

**Version** : 1.0.0
**Date** : 2025-11-30
**Auteur** : YarnFlow Team + Claude Code

---

## 📋 Vue d'ensemble

Ce système permet de donner un **accès prioritaire de 72h** aux inscrits de la waitlist pour profiter de l'offre **Early Bird (2.99€/mois)**.

### Comment ça fonctionne ?

1. **Génération** : Un admin génère des codes uniques pour tous les emails de la waitlist
2. **Envoi** : Un script envoie les codes par email avec un lien d'inscription personnalisé
3. **Inscription** : L'utilisateur s'inscrit avec le code, qui est validé automatiquement
4. **Accès prioritaire** : L'utilisateur a 72h pour souscrire à l'offre Early Bird
5. **Souscription** : L'utilisateur paie via Stripe et obtient son abonnement Early Bird

---

## 🚀 Déploiement Initial (À faire une seule fois)

### Étape 1 : Exécuter la migration SQL

Connectez-vous à phpMyAdmin et exécutez le fichier :

```bash
database/add_early_bird_codes.sql
```

**Ce qui est créé :**
- ✅ Colonne `early_bird_eligible_until` dans la table `users`
- ✅ Table `early_bird_codes` (stockage des codes)
- ✅ Vues SQL : `v_early_bird_codes_active`, `v_early_bird_codes_stats`
- ✅ Index pour performance

**Vérification** :
```sql
SHOW TABLES LIKE '%early_bird%';
-- Résultat attendu : early_bird_codes, early_bird_config, early_bird_subscriptions

SHOW COLUMNS FROM users LIKE 'early_bird_eligible_until';
-- Résultat attendu : 1 ligne
```

### Étape 2 : Uploader les fichiers backend

Uploadez ces nouveaux fichiers sur O2Switch via FTP :

**Nouveau service :**
```
backend/services/EarlyBirdCodeService.php
```

**Fichiers modifiés :**
```
backend/controllers/AuthController.php      (accepte early_bird_code à l'inscription)
backend/controllers/AdminController.php     (endpoints de gestion des codes)
```

**Nouveau script :**
```
backend/scripts/send-early-bird-emails.php  (envoi emails automatique)
```

### Étape 3 : Vérifier les routes API

Assurez-vous que ces routes existent dans votre fichier de routes :

```php
// Routes admin (nécessite authentification admin)
$router->post('/api/admin/early-bird/generate-codes', [AdminController::class, 'generateEarlyBirdCodes']);
$router->get('/api/admin/early-bird/stats', [AdminController::class, 'getEarlyBirdStats']);
$router->get('/api/admin/early-bird/code', [AdminController::class, 'getEarlyBirdCodeByEmail']);
```

---

## 📧 Utilisation : Lancement Early Bird

### Étape 1 : Générer les codes

**Via API (recommandé) :**

```bash
# Depuis Postman ou curl
POST https://yarnflow.fr/api/admin/early-bird/generate-codes
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "validity_hours": 72
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Codes Early Bird générés avec succès",
  "data": {
    "total_emails": 50,
    "new_codes": 50,
    "existing_codes": 0,
    "validity_hours": 72,
    "expires_at": "2025-12-03 15:30:00",
    "codes": [
      {
        "code": "EB-A7K9-M2P5",
        "email": "user1@example.com",
        "expires_at": "2025-12-03 15:30:00",
        "is_new": true
      },
      ...
    ]
  }
}
```

**Notes importantes :**
- ✅ Si un email a déjà un code actif, il n'est PAS régénéré
- ✅ La validité par défaut est 72h (3 jours)
- ✅ Les codes ont le format `EB-XXXX-XXXX`

### Étape 2 : Envoyer les emails

**Depuis SSH sur O2Switch :**

```bash
cd /www/backend
php scripts/send-early-bird-emails.php
```

**Ce que fait le script :**
1. Récupère tous les codes actifs (non utilisés, non expirés)
2. Affiche le nombre d'emails à envoyer
3. Demande confirmation (tapez `yes`)
4. Envoie les emails un par un avec un délai de 500ms
5. Affiche le résultat (réussis/échecs)

**Sortie console :**
```
╔══════════════════════════════════════════════════════════╗
║   YarnFlow - Envoi Emails Early Bird                    ║
╚══════════════════════════════════════════════════════════╝

✓ Connexion base de données établie
✓ Services initialisés

📧 50 emails à envoyer

Voulez-vous vraiment envoyer 50 emails ? (yes/no): yes

Envoi à user1@example.com... ✓
Envoi à user2@example.com... ✓
...

═══════════════════════════════════════════════
✓ Envoyés : 50
═══════════════════════════════════════════════
```

### Étape 3 : Surveiller l'utilisation

**Voir les statistiques :**

```bash
GET https://yarnflow.fr/api/admin/early-bird/stats
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN
```

**Réponse :**
```json
{
  "codes": {
    "total_codes": 50,
    "used_codes": 12,
    "active_codes": 38,
    "expired_codes": 0,
    "conversion_rate": 24.00
  },
  "availability": {
    "available": true,
    "remaining_slots": 188,
    "max_slots": 200,
    "current_slots": 12
  },
  "active_codes": [
    {
      "email": "user@example.com",
      "code": "EB-A7K9-M2P5",
      "expires_at": "2025-12-03 15:30:00",
      "hours_remaining": 48.5
    }
  ]
}
```

---

## 🔍 Requêtes SQL Utiles

### Vérifier les codes actifs
```sql
SELECT * FROM v_early_bird_codes_active
ORDER BY hours_remaining ASC;
```

### Statistiques globales
```sql
SELECT * FROM v_early_bird_codes_stats;
```

### Trouver le code d'une personne
```sql
SELECT code, is_used, expires_at
FROM early_bird_codes
WHERE email = 'user@example.com';
```

### Voir qui a utilisé son code
```sql
SELECT
    c.email,
    c.code,
    c.used_at,
    u.id as user_id,
    u.subscription_type
FROM early_bird_codes c
LEFT JOIN users u ON u.id = c.used_by_user_id
WHERE c.is_used = TRUE
ORDER BY c.used_at DESC;
```

### Vérifier les abonnements Early Bird
```sql
SELECT
    u.id,
    u.email,
    u.subscription_type,
    u.early_bird_eligible_until,
    eb.slot_number,
    eb.subscribed_at
FROM users u
LEFT JOIN early_bird_subscriptions eb ON eb.user_id = u.id
WHERE u.subscription_type = 'early_bird'
ORDER BY eb.slot_number ASC;
```

---

## 🧪 Tests

### Test 1 : Inscription sans code (normal)

```bash
POST https://yarnflow.fr/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "first_name": "Test"
}
```

**Résultat attendu :**
- ✅ User créé avec `subscription_type = 'free'`
- ✅ `early_bird_eligible_until = NULL`

### Test 2 : Inscription avec code valide

```bash
POST https://yarnflow.fr/api/auth/register
Content-Type: application/json

{
  "email": "waitlist@example.com",
  "password": "password123",
  "first_name": "Early",
  "last_name": "Bird",
  "early_bird_code": "EB-A7K9-M2P5"
}
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Inscription réussie ! Vous avez 71.8h pour profiter de l'offre Early Bird.",
  "data": {
    "user": { ... },
    "token": "...",
    "early_bird_access": {
      "eligible": true,
      "expires_at": "2025-12-03 15:30:00",
      "hours_remaining": 71.8
    }
  }
}
```

**Vérifications DB :**
```sql
-- User créé
SELECT
    email,
    subscription_type,
    early_bird_eligible_until
FROM users
WHERE email = 'waitlist@example.com';
-- subscription_type = 'free' (normal, il n'a pas encore payé)
-- early_bird_eligible_until = '2025-12-03 15:30:00'

-- Code marqué comme utilisé
SELECT
    code,
    is_used,
    used_by_user_id,
    used_at
FROM early_bird_codes
WHERE code = 'EB-A7K9-M2P5';
-- is_used = TRUE
-- used_by_user_id = [ID du user créé]
-- used_at = [timestamp actuel]
```

### Test 3 : Code invalide

**Code expiré :**
```json
{
  "success": false,
  "message": "Ce code a expiré"
}
```

**Code déjà utilisé :**
```json
{
  "success": false,
  "message": "Ce code a déjà été utilisé"
}
```

**Code pour un autre email :**
```json
{
  "success": false,
  "message": "Ce code est réservé à une autre adresse email"
}
```

---

## 🎨 Frontend : Afficher l'offre Early Bird

### Vérifier l'éligibilité

Dans le frontend, après login/register, vérifier si l'utilisateur a accès Early Bird :

```javascript
// api/auth/me retourne :
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "subscription_type": "free",
    "early_bird_eligible_until": "2025-12-03 15:30:00" // null si pas éligible
  }
}

// Logique frontend :
const isEarlyBirdEligible = () => {
  if (!user.early_bird_eligible_until) return false;
  return new Date(user.early_bird_eligible_until) > new Date();
}

// Afficher l'offre seulement si éligible
{isEarlyBirdEligible() && (
  <EarlyBirdCard
    expiresAt={user.early_bird_eligible_until}
    price="2.99€/mois"
  />
)}
```

### URL d'inscription avec code

```
https://yarnflow.fr/register?early_bird=EB-A7K9-M2P5
```

Le frontend doit :
1. Détecter le paramètre `?early_bird=XXX`
2. Pré-remplir le champ `early_bird_code` dans le formulaire d'inscription
3. L'envoyer avec la requête POST `/api/auth/register`

---

## 📊 Dashboard Admin (À créer)

### Page suggérée : `/admin/early-bird`

**Métriques à afficher :**
- Places restantes : `188 / 200`
- Codes générés : `50`
- Codes utilisés : `12` (taux : 24%)
- Abonnements actifs : `12`

**Actions possibles :**
- Générer les codes (bouton)
- Envoyer les emails (bouton)
- Rechercher le code d'un email
- Voir la liste des codes actifs

---

## ⚠️ Sécurité

### Protections implémentées :

✅ **Codes uniques** : Chaque code ne peut être utilisé qu'une seule fois
✅ **Email verrouillé** : Le code est lié à un email spécifique
✅ **Expiration** : Les codes expirent après 72h
✅ **Admin only** : Seuls les admins peuvent générer les codes
✅ **Validation stricte** : Le backend vérifie tout (code, email, expiration)

### Attaques possibles et mitigations :

**Attaque** : Bruteforce de codes
**Mitigation** : Format `EB-XXXX-XXXX` = 36^8 combinaisons (~2.8 trillions), impossible à bruteforce

**Attaque** : Réutilisation de code
**Mitigation** : Flag `is_used` en DB, vérifié à chaque validation

**Attaque** : Utiliser le code d'un autre
**Mitigation** : Vérification que `code.email === register.email`

---

## 🐛 Dépannage

### Problème : "Aucun code trouvé"

**Cause** : Les codes n'ont pas été générés
**Solution** : Appeler `POST /api/admin/early-bird/generate-codes`

### Problème : "Code expiré"

**Cause** : Plus de 72h depuis la génération
**Solution** : Régénérer les codes (appeler à nouveau l'endpoint)

### Problème : Emails non envoyés

**Cause** : SMTP mal configuré
**Vérifications** :
```bash
# Vérifier .env
SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_PORT=587

# Tester manuellement
php backend/public/test-email.php
```

### Problème : "Code déjà utilisé" mais l'utilisateur n'existe pas

**Diagnostic** :
```sql
SELECT * FROM early_bird_codes WHERE code = 'EB-XXXX-XXXX';
-- Si is_used = TRUE mais used_by_user_id = NULL
-- → Corruption de données
```

**Solution** :
```sql
UPDATE early_bird_codes
SET is_used = FALSE,
    used_by_user_id = NULL,
    used_at = NULL
WHERE code = 'EB-XXXX-XXXX';
```

---

## 📈 Monitoring Recommandé

### Alertes à configurer :

**Alerte 1** : Places restantes < 50
→ Préparer la communication "Plus que 50 places !"

**Alerte 2** : Codes expirés > 50%
→ Relancer les non-convertis

**Alerte 3** : Taux de conversion < 10%
→ Analyser pourquoi (prix, landing, email ?)

### Métriques à suivre :

- **Taux d'ouverture email** : ~20-30% attendu
- **Taux de clic (CTR)** : ~5-10% attendu
- **Taux de conversion** : ~10-25% attendu (code → abonnement)

---

## ✅ Checklist de lancement

- [ ] Migration SQL exécutée (`add_early_bird_codes.sql`)
- [ ] Fichiers backend uploadés (Service + Controllers)
- [ ] Routes API testées
- [ ] SMTP configuré et fonctionnel
- [ ] Codes générés pour la waitlist
- [ ] Email de test envoyé et vérifié
- [ ] Inscription test avec code réussie
- [ ] Frontend affiche l'offre Early Bird si éligible
- [ ] Paiement Stripe Early Bird testé
- [ ] Dashboard admin fonctionnel

---

## 📞 Support

**En cas de problème :**
1. Vérifier les logs : `/www/logs/error.log` (O2Switch)
2. Vérifier phpMyAdmin : tables et données
3. Tester les endpoints avec Postman
4. Consulter ce guide

**Contact** : [Votre email support]

---

**Créé le** : 2025-11-30
**Version YarnFlow** : 0.12.0
**Prochaine mise à jour** : Dashboard admin visuel
