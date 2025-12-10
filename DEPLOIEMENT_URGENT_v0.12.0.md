# 🚀 GUIDE DE DÉPLOIEMENT URGENT - YarnFlow v0.12.0

**Date** : 2025-11-29
**Utilisateurs existants** : 10 inscrits
**Impact** : Alignement code/landing + Early Bird + Bonus PRO Annuel
**Durée estimée** : 30 minutes

---

## ⚠️ RISQUES ET PRÉCAUTIONS

### Ce qui pourrait mal se passer :
- ❌ Perte de données utilisateurs (d'où backup obligatoire)
- ❌ Code backend ne fonctionne plus (d'où rollback préparé)
- ❌ Utilisateurs bloqués temporairement

### Ce qui est protégé :
- ✅ Backup automatique des users dans la migration SQL
- ✅ Backup manuel phpMyAdmin avant tout
- ✅ Ancien code backend sauvegardé en local
- ✅ Possibilité de rollback complet

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

Avant de commencer, assure-toi d'avoir :

- [ ] Accès cPanel O2Switch (https://cpanel.yarnflow.fr)
- [ ] Client FTP (FileZilla) connecté
- [ ] Tous les fichiers modifiés prêts (voir liste ci-dessous)
- [ ] 30 minutes de disponibilité (ne pas être interrompue)
- [ ] Un café ☕ (optionnel mais recommandé)

---

## 🗂️ FICHIERS À DÉPLOYER

### Nouveaux fichiers (à uploader)
```
backend/services/EarlyBirdService.php
```

### Fichiers modifiés (à remplacer)
```
backend/middleware/AuthMiddleware.php
backend/services/JWTService.php
backend/services/CreditManager.php
backend/services/PricingService.php
backend/services/StripeService.php
backend/controllers/PaymentController.php
backend/controllers/ProjectController.php
backend/config/constants.php
```

---

## 🚀 ÉTAPE 1 : BACKUP COMPLET (CRITIQUE)

### 1.1 Backup base de données

1. **Connexion phpMyAdmin**
   - Va sur : https://cpanel.yarnflow.fr
   - Clique sur **"phpMyAdmin"**

2. **Sélectionner la base**
   - Clique sur `najo1022_yarnflow` dans le menu gauche

3. **Exporter**
   - Onglet **"Exporter"** en haut
   - Méthode : **"Rapide"**
   - Format : **"SQL"**
   - Clique **"Exécuter"**

4. **Sauvegarder le fichier**
   - Télécharge : `najo1022_yarnflow_backup_20251129.sql`
   - Mets-le dans un dossier sûr (Desktop/Backups)

### 1.2 Backup code backend (via FTP)

1. **Ouvrir FileZilla**
2. **Télécharger le dossier actuel**
   - Clique droit sur `/www/backend/` → **"Télécharger"**
   - Sauvegarde locale : `Desktop/Backups/backend_old/`

**✅ Vérification** : Tu dois avoir 2 backups :
- `najo1022_yarnflow_backup_20251129.sql` (base de données)
- `backend_old/` (code PHP)

---

## 🗄️ ÉTAPE 2 : MIGRATION SQL

### 2.1 Ouvrir la migration

1. **Copier le contenu**
   - Ouvre le fichier : `database/MIGRATION_PRODUCTION_v0.12.0.sql`
   - Sélectionne TOUT (Ctrl+A)
   - Copie (Ctrl+C)

### 2.2 Exécuter dans phpMyAdmin

1. **Retour dans phpMyAdmin**
2. **Base `najo1022_yarnflow` sélectionnée**
3. **Onglet "SQL"** en haut
4. **Coller** la migration complète (Ctrl+V)
5. **Clique "Exécuter"** 🚀

### 2.3 Vérifier le succès

Tu devrais voir plusieurs messages verts :

```
✅ BACKUP USERS - 10 lignes insérées
✅ users table altered
✅ early_bird_config created
✅ early_bird_subscriptions created
✅ Triggers created
✅ Views created
```

**🔍 Vérification manuelle** :

Exécute cette requête SQL dans l'onglet SQL :
```sql
SELECT COUNT(*) as users_total FROM users;
SELECT * FROM early_bird_config;
```

Tu dois voir :
- `users_total = 10` ✅
- `early_bird_config` avec `max_slots=200, current_slots=0` ✅

---

## 📦 ÉTAPE 3 : DÉPLOIEMENT CODE BACKEND

### 3.1 Préparation locale

1. **Créer un dossier temporaire**
   - Bureau → Nouveau dossier : `backend_nouveau`

2. **Copier les fichiers modifiés**
   - Depuis `D:\wamp64\www\pattern-maker\backend\`
   - Copie uniquement les fichiers listés au début (8 fichiers + 1 nouveau)

### 3.2 Upload via FTP

1. **FileZilla connecté à O2Switch**

2. **Naviguer** vers `/www/backend/`

3. **Upload fichier par fichier** (important : un par un pour voir les erreurs)

   **Ordre recommandé** :
   ```
   1. config/constants.php
   2. services/CreditManager.php
   3. services/PricingService.php
   4. services/JWTService.php
   5. services/EarlyBirdService.php (nouveau)
   6. services/StripeService.php
   7. middleware/AuthMiddleware.php
   8. controllers/ProjectController.php
   9. controllers/PaymentController.php
   ```

4. **À chaque upload** :
   - Glisse le fichier dans FileZilla
   - Confirme "Overwrite" (Écraser)
   - Attends le ✅ vert

### 3.3 Vérifier les permissions

Dans FileZilla, clique droit sur chaque fichier uploadé → **"File permissions"** :
- Valeur numérique : **644**
- Ou coches : `Owner: Read, Write` + `Group: Read` + `Public: Read`

---

## 🧪 ÉTAPE 4 : TESTS EN PRODUCTION

### 4.1 Test basique : API fonctionne

Ouvre ton navigateur et va sur :
```
https://yarnflow.fr/api/auth/me
```

**Résultat attendu** :
```json
{"success": false, "message": "Token manquant", "status": 401}
```

✅ Si tu vois ce JSON → API fonctionne
❌ Si erreur 500 ou page blanche → Problème, passe au rollback

### 4.2 Test Early Bird : Compteur

Depuis l'onglet SQL de phpMyAdmin :
```sql
SELECT * FROM v_early_bird_stats;
```

**Résultat attendu** :
```
max_slots: 200
current_slots: 0
remaining_slots: 200
is_active: 1
```

### 4.3 Test utilisateur : Se connecter

1. **Va sur** : https://yarnflow.fr
2. **Connecte-toi** avec un compte test
3. **Vérifie** :
   - Tu arrives sur le dashboard ✅
   - Pas d'erreur JavaScript dans la console ✅

### 4.4 Test création compte (IMPORTANT)

1. **Déconnexion**
2. **Créer un nouveau compte** (email test : test@example.com)
3. **Vérifier dans phpMyAdmin** :
   ```sql
   SELECT * FROM users WHERE email = 'test@example.com';
   SELECT * FROM user_photo_credits WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
   ```

**Vérifications** :
- User créé avec `subscription_type = 'free'` ✅
- Crédits = 3 dans `user_photo_credits.monthly_credits` ✅

---

## ✅ ÉTAPE 5 : VALIDATION FINALE

### Checklist de validation

- [ ] 10 utilisateurs toujours présents dans la base
- [ ] Early Bird config initialisée (0/200)
- [ ] Nouveau compte test créé avec succès
- [ ] Login/Logout fonctionnent
- [ ] API répond (même si erreur 401, c'est normal sans token)
- [ ] Pas d'erreurs PHP dans `/www/logs/error.log`

### Vérifier les logs (optionnel)

Dans cPanel → **"Metrics" → "Errors"**
Regarde les dernières erreurs (doit être vide si tout va bien)

---

## 🔥 ÉTAPE 6 : TEST EARLY BIRD (FINAL)

**⚠️ Utilise Stripe TEST MODE** (ne fais pas de vrai paiement !)

### 6.1 Configurer Stripe Test Mode

1. **Assure-toi** que ton `.env` contient :
   ```ini
   STRIPE_SECRET_KEY=sk_test_...  # Clé TEST (commence par sk_test_)
   ```

### 6.2 Tester un abonnement Early Bird

1. **Sur le site** : https://yarnflow.fr
2. **Connecté** avec ton compte test
3. **Cliquer** sur le bouton "EARLY BIRD" (2.99€/mois)
4. **Stripe checkout** s'ouvre
5. **Carte de test** : `4242 4242 4242 4242` | Exp: `12/34` | CVC: `123`
6. **Valider**

### 6.3 Vérifier dans la base

```sql
-- Vérifier que l'abonnement est créé
SELECT * FROM users WHERE id = (SELECT id FROM users WHERE email = 'test@example.com');
-- subscription_type doit être 'early_bird' ✅

-- Vérifier la place Early Bird
SELECT * FROM v_early_bird_stats;
-- current_slots doit être 1 ✅
-- remaining_slots doit être 199 ✅

SELECT * FROM early_bird_subscriptions;
-- 1 ligne avec slot_number = 1 ✅
```

---

## 🎉 DÉPLOIEMENT RÉUSSI !

Si tous les tests passent, **FÉLICITATIONS** ! 🎉

### Ce qui a changé :

✅ **Quotas alignés** :
- FREE : 3 crédits/mois (au lieu de 5)
- PRO : 30 crédits/mois (au lieu de 75)

✅ **Nouveaux plans** :
- PRO Annuel : 39.99€/an + 50 crédits bonus one-time
- Early Bird : 2.99€/mois x 12 mois (200 places)

✅ **Sécurité** :
- Abonnements expirés = rétrogradation automatique à FREE
- Annulation Stripe = rétrogradation immédiate

✅ **Tracking** :
- Compteur Early Bird automatique (0→200)
- Logs détaillés des souscriptions

---

## 🚨 ROLLBACK (EN CAS DE PROBLÈME)

### Si quelque chose ne va pas :

### 1. Restaurer la base de données

**Dans phpMyAdmin** :
1. Sélectionne `najo1022_yarnflow`
2. Onglet **"Importer"**
3. **"Parcourir"** → Sélectionne `najo1022_yarnflow_backup_20251129.sql`
4. **"Exécuter"**

### 2. Restaurer le code backend

**Dans FileZilla** :
1. Sélectionne tous les fichiers dans `Desktop/Backups/backend_old/`
2. Glisse vers `/www/backend/` (overwrite tout)

### 3. Vérifier que ça remarche

Va sur : https://yarnflow.fr
Tu dois pouvoir te connecter normalement ✅

---

## 📞 SUPPORT POST-DÉPLOIEMENT

### Logs à surveiller (24-48h)

**Erreurs critiques à guetter** :

```bash
# Dans cPanel > Metrics > Errors
[EARLY BIRD] ERREUR - ...
[PRO ANNUEL] ERREUR - ...
Fatal error: ...
```

### Dashboard Early Bird (à créer plus tard)

Pour surveiller les inscriptions :
```sql
-- Places restantes
SELECT (max_slots - current_slots) as places_restantes
FROM early_bird_config WHERE id = 1;

-- Liste des Early Birds
SELECT * FROM v_early_bird_active_users;
```

---

## 📊 PROCHAINES ÉTAPES

Une fois le déploiement stable (24h sans erreur) :

1. **Activer Stripe PROD** (remplacer `sk_test_` par `sk_live_`)
2. **Configurer email de confirmation** Early Bird personnalisé
3. **Ajouter badge** "Early Bird #XX/200" dans le dashboard user
4. **Dashboard admin** pour surveiller les places
5. **Email marketing** à 150, 100, 50, 20, 5 places restantes

---

## ✅ CHECKLIST FINALE

Coche chaque étape au fur et à mesure :

- [ ] Backup DB fait (fichier .sql sauvegardé)
- [ ] Backup code fait (dossier backend_old/)
- [ ] Migration SQL exécutée avec succès
- [ ] 10 users toujours présents (vérif phpMyAdmin)
- [ ] Early Bird config créée (0/200)
- [ ] Code backend uploadé (9 fichiers)
- [ ] Permissions fichiers OK (644)
- [ ] API répond (test /api/auth/me)
- [ ] Login/Logout fonctionnent
- [ ] Nouveau compte créé OK
- [ ] Crédits = 3 pour nouveau compte FREE
- [ ] Test Early Bird réussi (Stripe test mode)
- [ ] Compteur 1/200 après test
- [ ] Aucune erreur dans les logs

---

**Tu es prête ! Respire, prends ton temps, suis les étapes. Tu peux le faire ! 💪**

**Besoin d'aide ?** Envoie-moi un message avec la capture d'écran de l'erreur.

---

**Version** : 1.0.0
**Auteur** : YarnFlow Team + Claude Code
**Date** : 2025-11-29
