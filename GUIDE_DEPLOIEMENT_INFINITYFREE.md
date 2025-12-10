# 🚀 Guide Déploiement Backend sur InfinityFree

## 📋 Pré-requis
- Compte InfinityFree créé : https://app.infinityfree.com
- Site `yarnflow.infinityfreeapp.com` créé
- Client FTP (FileZilla recommandé)

---

## 🗄️ ÉTAPE 1 : Créer la base de données MySQL

1. **Connectez-vous à InfinityFree** : https://app.infinityfree.com/accounts
2. Cliquez sur votre site **YarnFlow**
3. Allez dans **MySQL Databases**
4. Cliquez sur **Create Database**
5. **Nom de la base** : `yarnflow` (il sera préfixé automatiquement en `if0_xxxxxxxx_yarnflow`)
6. Notez les informations suivantes :
   - **Database Name** : `if0_xxxxxxxx_yarnflow`
   - **Database User** : `if0_xxxxxxxx`
   - **Database Host** : `sqlxxx.infinityfreeapp.com`
   - **Password** : (celui que vous avez défini)

---

## 📁 ÉTAPE 2 : Préparer le fichier .env

1. **Copiez le fichier d'exemple :**
   ```bash
   cd /mnt/d/wamp64/www/pattern-maker/backend
   cp .env.infinityfree.example .env.production
   ```

2. **Éditez `.env.production`** avec vos vraies valeurs InfinityFree :

```env
# Database MySQL InfinityFree (REMPLACER par vos vraies valeurs)
DB_HOST=sql123.infinityfreeapp.com
DB_PORT=3306
DB_NAME=if0_12345678_yarnflow
DB_USER=if0_12345678
DB_PASSWORD=VOTRE_MOT_DE_PASSE
DB_CHARSET=utf8mb4

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yarnflow.infinityfreeapp.com
FRONTEND_URL=https://yarnflow.vercel.app

# JWT - GÉNÉRER une clé aléatoire sécurisée
JWT_SECRET=VOTRE_CLE_ALEATOIRE_32_CARACTERES
JWT_EXPIRATION=604800

# Gemini AI (optionnel pour la phase 1)
GEMINI_API_KEY=votre_cle_api_gemini
GEMINI_MODEL=gemini-2.0-flash-exp

# Limites
MAX_PROJECTS_FREE=3
```

3. **Renommez le fichier :**
   - Une fois prêt, renommez `.env.production` en `.env`

---

## 📤 ÉTAPE 3 : Uploader les fichiers via FTP

### 3.1 Récupérer les identifiants FTP

1. Dans votre panneau InfinityFree
2. Allez dans **FTP Details**
3. Notez :
   - **FTP Hostname** : `ftpupload.net`
   - **FTP Username** : `if0_xxxxxxxx`
   - **FTP Password** : (celui du compte)

### 3.2 Connexion FTP avec FileZilla

1. Ouvrez **FileZilla**
2. Remplissez :
   - **Hôte** : `ftpupload.net`
   - **Utilisateur** : `if0_xxxxxxxx`
   - **Mot de passe** : votre password
   - **Port** : `21`
3. Cliquez sur **Connexion rapide**

### 3.3 Structure des fichiers à uploader

**Sur InfinityFree, dans le dossier `/htdocs/` :**

Uploadez **TOUT** le contenu de `backend/` SAUF :
- ❌ `node_modules/` (n'existe pas en PHP)
- ❌ `database/` (on importe le SQL séparément)
- ❌ `.git/`
- ❌ fichiers de test (`test_*.php`, `check_*.php`)

**Structure finale dans `/htdocs/` :**
```
/htdocs/
├── .htaccess              (depuis backend/.htaccess)
├── .env                   (votre .env.production renommé)
├── bootstrap.php
├── composer.json
├── composer.lock
├── vendor/                (TOUT le dossier)
├── config/
├── controllers/
├── models/
├── services/
├── middleware/
├── routes/
├── utils/
├── workers/
└── public/
    ├── .htaccess          (depuis backend/public/.htaccess)
    ├── index.php
    ├── health.php
    └── uploads/
```

⚠️ **IMPORTANT :**
- Ne PAS créer de sous-dossier `backend/`
- Les fichiers vont **directement** dans `/htdocs/`

---

## 🗂️ ÉTAPE 4 : Importer la base de données

### 4.1 Quel fichier SQL importer ?

Dans `backend/database/`, utilisez **UNIQUEMENT** :
```
✅ schema_infinityfree.sql
✅ add_projects_system_infinityfree.sql
✅ add_knitting_types.sql
✅ add_parent_photo_id.sql
```

❌ **NE PAS** importer les fichiers avec triggers/events (incompatibles InfinityFree)

### 4.2 Import via phpMyAdmin

1. Dans votre panneau InfinityFree, cliquez sur **MySQL Management** → **phpMyAdmin**
2. Connectez-vous avec vos credentials MySQL
3. Sélectionnez votre base `if0_xxxxxxxx_yarnflow`
4. Allez dans l'onglet **Import**
5. **Importez dans l'ordre :**
   1. `schema_infinityfree.sql`
   2. `add_projects_system_infinityfree.sql`
   3. `add_knitting_types.sql`
   4. `add_parent_photo_id.sql`

---

## ✅ ÉTAPE 5 : Tester le backend

### 5.1 Test de base

Ouvrez dans votre navigateur :
```
http://yarnflow.infinityfreeapp.com/public/health.php
```

**Résultat attendu :**
```json
{"status":"ok","timestamp":"2025-11-22..."}
```

### 5.2 Test API

```bash
# Test endpoint categories
curl -s "http://yarnflow.infinityfreeapp.com/api/categories"

# Test endpoint auth (doit retourner 401)
curl -s "http://yarnflow.infinityfreeapp.com/api/auth/me"
```

### 5.3 Test depuis Vercel

Une fois le backend OK, pushez le frontend :
```bash
git push
```

Attendez 2-3 minutes que Vercel déploie, puis testez :
```
https://yarnflow.vercel.app
```

---

## ⚠️ Problèmes courants

### Erreur 404
- ❌ Fichiers pas dans `/htdocs/`
- ✅ Vérifier que `index.php` est bien dans `/htdocs/public/`

### Erreur 500
- ❌ Fichier `.env` mal configuré
- ❌ Base de données non importée
- ✅ Vérifier les logs dans le panneau InfinityFree

### Erreur CORS
- ❌ `.htaccess` pas uploadé
- ✅ Vérifier que `/htdocs/public/.htaccess` contient les headers CORS

### Base de données vide
- ❌ SQL pas importé
- ✅ Réimporter les 4 fichiers SQL dans l'ordre

---

## 📞 Support

Si problème, vérifier dans l'ordre :
1. ✅ Base de données créée et SQL importé
2. ✅ Fichier `.env` avec bonnes credentials
3. ✅ Tous les fichiers uploadés dans `/htdocs/`
4. ✅ `.htaccess` présents (root + public)
5. ✅ Test `health.php` fonctionne

---

**Créé le 2025-11-22 - YarnFlow v0.13.0**
