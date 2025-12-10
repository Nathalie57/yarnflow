# 🚀 Guide Déploiement YarnFlow sur Railway

**Railway** : Plateforme moderne de déploiement avec $5 gratuits/mois

---

## 📋 ÉTAPE 1 : Créer votre compte Railway

1. **Allez sur** : https://railway.app
2. Cliquez sur **Start a New Project**
3. **Connectez-vous avec GitHub** (recommandé)
   - Cliquez sur **Login with GitHub**
   - Autorisez Railway à accéder à vos repos

✅ Vous avez maintenant $5 de crédit gratuit/mois !

---

## 🗄️ ÉTAPE 2 : Créer le projet Backend + MySQL

### 2.1 Créer un nouveau projet

1. Sur Railway Dashboard, cliquez sur **New Project**
2. Sélectionnez **Deploy from GitHub repo**
3. Cherchez et sélectionnez votre repo : `pattern-maker`
4. Railway détecte automatiquement PHP ✅

### 2.2 Configurer le service backend

1. Cliquez sur votre service qui vient d'être créé
2. Allez dans **Settings**
3. **Root Directory** : Laissez vide OU mettez `/backend` si Railway ne détecte pas automatiquement
4. **Start Command** : `cd backend/public && php -S 0.0.0.0:$PORT`

### 2.3 Ajouter MySQL

1. Dans votre projet Railway, cliquez sur **+ New**
2. Sélectionnez **Database** → **Add MySQL**
3. Railway crée automatiquement une base de données MySQL ✅

---

## ⚙️ ÉTAPE 3 : Configurer les variables d'environnement

### 3.1 Récupérer les credentials MySQL de Railway

1. Cliquez sur votre service **MySQL**
2. Allez dans l'onglet **Variables**
3. Railway génère automatiquement :
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_DATABASE`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_URL` (format : `mysql://user:pass@host:port/database`)

### 3.2 Ajouter les variables au service Backend

1. Cliquez sur votre service **pattern-maker** (le backend)
2. Allez dans **Variables**
3. Cliquez sur **+ New Variable**
4. Ajoutez ces variables **UNE PAR UNE** :

```env
# Database (utilisez les valeurs de votre MySQL Railway)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_CHARSET=utf8mb4

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://yarnflow.vercel.app

# JWT (générer une clé sécurisée)
JWT_SECRET=WieTrFkz0FUpRH9tuyE2hc1F+iavcF02/ohynm48Yyo=
JWT_EXPIRATION=604800

# Gemini AI
GEMINI_API_KEY=AIzaSyAD1czoQ4IDaA20ykhK_GhMmkZh-KKJEJs
GEMINI_MODEL=gemini-2.5-flash-image-preview
GEMINI_SIMULATION_MODE=false

# Limites
MAX_PROJECTS_FREE=3
PATTERN_BASE_PRICE=2.99
```

💡 **Astuce** : Railway peut référencer automatiquement les variables MySQL avec la syntaxe `${{MySQL.VARIABLE}}`

---

## 🌐 ÉTAPE 4 : Générer le domaine public

1. Dans votre service Backend, allez dans **Settings**
2. Scrollez jusqu'à **Networking**
3. Cliquez sur **Generate Domain**
4. Railway génère une URL : `https://votre-projet.up.railway.app`

✅ Notez cette URL, c'est votre backend URL !

---

## 📊 ÉTAPE 5 : Importer la base de données

### 5.1 Se connecter à MySQL Railway

**Option A : Via Railway CLI** (recommandé)
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Login
railway login

# Connecter au projet
railway link

# Shell MySQL
railway connect MySQL
```

**Option B : Via MySQL Workbench / TablePlus**
1. Utilisez les credentials de l'étape 3.1
2. Connectez-vous à `MYSQL_HOST:MYSQL_PORT`

### 5.2 Importer les fichiers SQL

Dans l'ordre :
```bash
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backend/database/schema.sql
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backend/database/add_projects_system.sql
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backend/database/add_knitting_types.sql
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backend/database/add_parent_photo_id.sql
```

OU via Railway CLI :
```bash
railway connect MySQL < backend/database/schema.sql
railway connect MySQL < backend/database/add_projects_system.sql
railway connect MySQL < backend/database/add_knitting_types.sql
railway connect MySQL < backend/database/add_parent_photo_id.sql
```

---

## 🔄 ÉTAPE 6 : Déployer

Railway déploie **automatiquement** à chaque push sur GitHub !

```bash
git add .
git commit -m "Configure Railway deployment"
git push
```

Railway va :
1. ✅ Détecter le push
2. ✅ Installer les dépendances (`composer install`)
3. ✅ Démarrer le serveur PHP
4. ✅ Rendre l'API publique

---

## ✅ ÉTAPE 7 : Tester le backend

### 7.1 Test de santé

Ouvrez dans votre navigateur :
```
https://votre-projet.up.railway.app/health.php
```

**Attendu :**
```json
{"status":"ok","timestamp":"2025-11-22..."}
```

### 7.2 Test API

```bash
# Categories
curl https://votre-projet.up.railway.app/api/categories

# Auth (doit retourner 401)
curl https://votre-projet.up.railway.app/api/auth/me
```

---

## 🔗 ÉTAPE 8 : Mettre à jour le frontend

1. **Modifiez** `frontend/src/services/api.js` ligne 12 :
```javascript
if (import.meta.env.PROD) {
  return 'https://votre-projet.up.railway.app/api'  // ← Votre URL Railway
}
```

2. **Push** :
```bash
git add frontend/src/services/api.js
git commit -m "Update API URL to Railway"
git push
```

3. Vercel redéploie automatiquement ✅

---

## 💰 Coûts Railway

**Gratuit** : $5/mois de crédit
- Largement suffisant pour 50-100 utilisateurs
- Backend PHP : ~$2-3/mois
- MySQL : ~$1-2/mois

**Total** : ~$3-5/mois = **GRATUIT** avec le crédit

---

## ⚠️ Problèmes courants

### Build fail
- Vérifier que `composer.json` est à la racine de `/backend`
- Vérifier les logs dans Railway → **Deployments**

### Erreur 500
- Vérifier les variables d'environnement
- Vérifier les logs : Railway → **Deployments** → **View Logs**

### Base de données vide
- Importer les fichiers SQL via Railway CLI
- Vérifier la connexion MySQL

### CORS errors
- Vérifier que `APP_URL` et `FRONTEND_URL` sont corrects
- Vérifier le fichier `backend/public/.htaccess`

---

## 📞 Avantages Railway vs InfinityFree

✅ **Pas de suspension arbitraire**
✅ **Déploiement automatique depuis Git**
✅ **Logs en temps réel**
✅ **Scaling automatique**
✅ **HTTPS inclus**
✅ **Support moderne (PHP 8.1+)**

---

**Créé le 2025-11-22 - YarnFlow v0.13.0**
