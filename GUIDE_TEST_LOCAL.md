# Guide de Test Local YarnFlow

Ce guide te permet de tester l'application complète en local avant le déploiement.

---

## 🚀 ÉTAPE 1 : Démarrer les serveurs

### 1.1 Démarrer WAMP
1. Lance **WAMP** (icône verte dans la barre des tâches)
2. Vérifie que MySQL est démarré (icône WAMP verte)

### 1.2 Vérifier la base de données
1. Ouvre **phpMyAdmin** : http://localhost/phpmyadmin/
2. Vérifie que la base `patron_maker` existe
3. Si elle n'existe pas, crée-la :
   ```sql
   CREATE DATABASE patron_maker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. Importe les tables (si pas déjà fait) :
   - Clique sur `patron_maker`
   - Onglet **Importer**
   - Sélectionne et importe dans cet ordre :
     1. `database/schema.sql`
     2. `database/add_projects_system.sql`
     3. `database/add_knitting_types.sql`
     4. `database/add_ai_photo_studio.sql`
     5. `database/add_parent_photo_id.sql`
     6. `backend/database/add_waitlist.sql`

### 1.3 Démarrer le backend PHP
Ouvre un terminal dans le dossier `backend/` :

```bash
cd /mnt/d/wamp64/www/pattern-maker/backend
php -S localhost:8000 -t public
```

Tu devrais voir :
```
[Wed Nov 27 14:30:00 2025] PHP 8.1.x Development Server (http://localhost:8000) started
```

### 1.4 Démarrer le frontend React
Ouvre un **NOUVEAU** terminal dans le dossier `frontend/` :

```bash
cd /mnt/d/wamp64/www/pattern-maker/frontend
npm run dev
```

Tu devrais voir :
```
VITE v5.4.21  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## ✅ ÉTAPE 2 : Test d'inscription

### 2.1 Accéder à l'application
Ouvre ton navigateur : **http://localhost:5173/**

### 2.2 S'inscrire
1. Clique sur **"Créer un compte"** ou va sur http://localhost:5173/register
2. Remplis le formulaire :
   - **Prénom** : Nathalie
   - **Email** : test@yarnflow.local
   - **Mot de passe** : Test1234!
   - **Confirmer** : Test1234!
3. Clique sur **"S'inscrire"**

**✅ Résultat attendu :**
- Tu es redirigé vers le dashboard
- Tu vois "Bienvenue Nathalie !"
- Un token JWT est stocké dans localStorage

**❌ Si erreur :**
- Ouvre la console (F12) et note l'erreur
- Vérifie que le backend tourne sur http://localhost:8000
- Vérifie dans phpMyAdmin que la table `users` existe

---

## ✅ ÉTAPE 3 : Test de connexion

### 3.1 Se déconnecter
1. Clique sur ton nom en haut à droite
2. **"Déconnexion"**

### 3.2 Se reconnecter
1. Va sur http://localhost:5173/login
2. Entre :
   - **Email** : test@yarnflow.local
   - **Mot de passe** : Test1234!
3. Clique sur **"Se connecter"**

**✅ Résultat attendu :**
- Tu arrives sur le dashboard
- Tu vois tes informations

**❌ Si erreur "Identifiants invalides" :**
- Vérifie dans phpMyAdmin la table `users`
- L'utilisateur `test@yarnflow.local` doit exister
- Le mot de passe est hashé (bcrypt)

---

## ✅ ÉTAPE 4 : Test création de projet

### 4.1 Créer un nouveau projet
1. Sur le dashboard, clique sur **"Nouveau projet"**
2. Remplis le formulaire :
   - **Nom** : Pull marinière
   - **Type** : Tricot
   - **Description** : Mon premier projet de test
   - **Sections** : Devant, Dos, Manches
3. Clique sur **"Créer le projet"**

**✅ Résultat attendu :**
- Le projet apparaît dans la liste
- Tu peux cliquer dessus pour voir les détails

**❌ Si erreur :**
- Console F12 → onglet Network → regarde la requête `POST /api/projects`
- Vérifie le code d'erreur et le message

### 4.2 Tester le compteur de rangs
1. Clique sur le projet "Pull marinière"
2. Clique sur **"Compteur"** ou **"Démarrer session"**
3. Clique sur **"+1 rang"** plusieurs fois
4. Le compteur doit s'incrémenter
5. Clique sur **"Terminer la session"**

**✅ Résultat attendu :**
- Les rangs sont sauvegardés
- Tu vois les stats (temps passé, vitesse rangs/h)
- Dans phpMyAdmin, la table `project_rows` contient les rangs
- La table `project_stats` contient les statistiques

**❌ Si le compteur ne s'incrémente pas :**
- F12 → Console → regarde les erreurs
- Vérifie que la requête `POST /api/projects/{id}/rows` fonctionne

---

## ✅ ÉTAPE 5 : Test AI Photo Studio

### 5.1 Accéder à la galerie
1. Dans le menu, clique sur **"AI Photo Studio"** ou **"Galerie"**
2. Tu arrives sur la page de génération de photos IA

### 5.2 Upload une photo
1. Clique sur **"Uploader une photo"**
2. Sélectionne une photo de tricot/crochet (JPG/PNG, < 5 MB)
3. Attends que l'upload se termine

**✅ Résultat attendu :**
- La photo apparaît en miniature
- Status : "Uploaded" ou "Ready"

**❌ Si erreur d'upload :**
- Vérifie que le dossier `backend/public/uploads/` existe
- Permissions : `chmod 755 backend/public/uploads/`

### 5.3 Générer une photo IA
1. Clique sur la photo uploadée
2. Choisis un style (ex: "Studio professionnel")
3. Clique sur **"Générer avec IA"**
4. **Attends 10-30 secondes** (appel API Gemini)

**✅ Résultat attendu :**
- Une nouvelle photo améliorée s'affiche
- Elle a un fond propre, éclairage amélioré
- La photo est sauvegardée dans `backend/public/uploads/enhanced/`
- Dans phpMyAdmin, la table `user_photos` contient l'entrée

**❌ Si erreur "Erreur génération IA" :**
1. Ouvre le terminal backend (où tourne `php -S localhost:8000`)
2. Regarde les logs d'erreur
3. Vérifie que `GEMINI_API_KEY` est bien défini dans `.env.local`
4. Test rapide de l'API :
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAD1czoQ4IDaA20ykhK_GhMmkZh-KKJEJs"
   ```
   - Si tu reçois une liste de modèles → API OK
   - Si erreur 403 → Clé invalide

### 5.4 Vérifier les crédits
1. Après génération, vérifie le compteur de crédits IA
2. Pour un compte FREE, tu devrais avoir **5 crédits/mois**
3. Après 1 génération, il reste **4 crédits**

**❌ Si les crédits ne diminuent pas :**
- Vérifie la table `user_photo_credits` dans phpMyAdmin
- Il doit y avoir une ligne pour ton user_id

---

## ✅ ÉTAPE 6 : Test des stats

### 6.1 Accéder aux stats
1. Dans le menu, clique sur **"Statistiques"** ou **"Stats"**
2. Tu vois les graphiques de tes projets

**✅ Résultat attendu :**
- Graphique de progression (rangs par jour)
- Vitesse moyenne (rangs/heure)
- Temps total passé
- Projets actifs vs terminés

**❌ Si les graphiques sont vides :**
- Crée d'abord des sessions de compteur (étape 4.2)
- Vérifie que `project_stats` contient des données

---

## ✅ ÉTAPE 7 : Test de la bibliothèque de patrons

### 7.1 Ajouter un patron
1. Va dans **"Bibliothèque"** ou **"Mes patrons"**
2. Clique sur **"Ajouter un patron"**
3. Remplis :
   - **Nom** : Bonnet simple
   - **Source** : Ravelry
   - **URL** : https://www.ravelry.com/patterns/library/...
   - **Notes** : Super patron facile
4. Upload un PDF (optionnel)

**✅ Résultat attendu :**
- Le patron apparaît dans la liste
- Tu peux le consulter, modifier, supprimer

---

## ✅ ÉTAPE 8 : Test de l'email de bienvenue waitlist

### 8.1 Tester l'envoi d'email (optionnel)

**Note :** Les emails ne fonctionneront PAS en local sans configuration SMTP.

Pour tester quand même :
1. Va sur http://localhost:8000/public/test-welcome-email.php?email=ton@email.com&name=Test
2. Regarde les logs dans le terminal backend

**✅ Si configuré avec Gmail SMTP :**
- Tu recevras un email de bienvenue
- Vérifie ton dossier spam

**❌ Si pas configuré :**
- Tu verras "SMTP connection failed" → **C'est normal en local**
- On configurera SMTP lors du déploiement O2Switch

---

## 📋 CHECKLIST COMPLÈTE

| Test | Status | Notes |
|------|--------|-------|
| ✅ WAMP démarré | ⬜ | Icône verte |
| ✅ BDD `patron_maker` créée | ⬜ | phpMyAdmin |
| ✅ Tables importées (6 fichiers SQL) | ⬜ | schema.sql + 5 migrations |
| ✅ Backend lancé (port 8000) | ⬜ | `php -S localhost:8000` |
| ✅ Frontend lancé (port 5173) | ⬜ | `npm run dev` |
| ✅ Inscription fonctionne | ⬜ | test@yarnflow.local |
| ✅ Connexion fonctionne | ⬜ | Même email |
| ✅ Création projet | ⬜ | Pull marinière |
| ✅ Compteur rangs | ⬜ | +1 rang fonctionne |
| ✅ Upload photo | ⬜ | Image dans uploads/ |
| ✅ Génération IA Gemini | ⬜ | Photo améliorée |
| ✅ Crédits IA décomptés | ⬜ | 5 → 4 crédits |
| ✅ Stats affichées | ⬜ | Graphiques visibles |
| ✅ Bibliothèque patrons | ⬜ | Ajouter/lire/modifier |
| ⚠️ Email SMTP | ⬜ | Optionnel (déploiement) |

---

## 🐛 BUGS COURANTS ET SOLUTIONS

### "Cannot connect to database"
**Solution :**
- Vérifie que WAMP tourne (icône verte)
- Vérifie `.env.local` ligne 5-9 (DB_HOST, DB_NAME, etc.)
- Crée la base dans phpMyAdmin si elle n'existe pas

### "JWT token invalid"
**Solution :**
- Déconnecte-toi et reconnecte-toi
- Vide le localStorage (F12 → Application → LocalStorage → Clear)
- Vérifie que `JWT_SECRET` est défini dans `.env.local`

### "CORS error" dans la console
**Solution :**
- Vérifie `backend/middleware/CorsMiddleware.php`
- Le backend doit autoriser `http://localhost:5173`
- Redémarre le serveur backend

### "API Gemini timeout"
**Solution :**
- L'API peut être lente (10-30s)
- Vérifie ta connexion internet
- Test l'API directement :
  ```bash
  curl "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAD1czoQ4IDaA20ykhK_GhMmkZh-KKJEJs"
  ```

### Photo IA de mauvaise qualité
**Cause :** Photo source trop petite ou floue
**Solution :**
- Utilise une photo > 800x800 pixels
- Format JPG ou PNG
- Bonne luminosité

### Crédits IA négatifs
**Solution :**
- Va dans phpMyAdmin → `user_photo_credits`
- Update la ligne de ton user : `credits_remaining = 5`

---

## 📊 APRÈS LES TESTS : RAPPORT

Une fois tous les tests faits, note :

### ✅ Ce qui fonctionne
- Liste des features OK

### ❌ Ce qui ne fonctionne pas
- Liste des bugs trouvés
- Messages d'erreur exacts (copie depuis F12)

### 💡 Améliorations UX
- Idées pour améliorer l'expérience utilisateur

---

**Prêt pour les tests ?** Lance WAMP, démarre les serveurs et suis ce guide étape par étape !

📝 Note tous les bugs dans un fichier `BUGS_TROUVES.md` pour qu'on les corrige ensemble.
