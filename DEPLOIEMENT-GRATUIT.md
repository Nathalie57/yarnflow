# 🆓 DÉPLOIEMENT 100% GRATUIT - YarnFlow

**Coût total : 0€**
**Durée : 1-2 heures**

---

## 📋 Stack Gratuite

| Service | Rôle | Coût | Limites |
|---------|------|------|---------|
| **Vercel** | Frontend React | 0€ | Illimité (Hobby plan) |
| **InfinityFree** | Backend PHP + MySQL | 0€ | 5GB, quotas API raisonnables |

---

## 🚀 ÉTAPE 1 : Setup Vercel (Frontend) - 15 min

### 1.1 Créer compte GitHub
Si pas déjà fait : https://github.com/signup

### 1.2 Push code sur GitHub
```bash
cd /mnt/d/wamp64/www/pattern-maker

git init
git add .
git commit -m "YarnFlow v0.12.0 - Waitlist ready"

# Créer repo sur GitHub, puis :
git remote add origin https://github.com/TON-USERNAME/yarnflow.git
git branch -M main
git push -u origin main
```

### 1.3 Déployer sur Vercel
1. Aller sur https://vercel.com/signup
2. **Sign up with GitHub**
3. **Import Git Repository** → Sélectionner `yarnflow`
4. Configuration :
   - Framework : **Vite**
   - Root Directory : **`frontend`**
   - Build Command : `npm run build`
   - Output Directory : `dist`

5. **NE PAS AJOUTER** de variables d'environnement maintenant (on le fera après InfinityFree)

6. Cliquer **Deploy**

7. **Attendre 2 min** → Déploiement terminé ✅

8. **Noter l'URL** : `https://yarnflow.vercel.app` (ou similaire)

---

## 🖥️ ÉTAPE 2 : Setup InfinityFree (Backend) - 30 min

### 2.1 Créer compte InfinityFree
1. Aller sur https://infinityfree.com/signup
2. **Email** + **Mot de passe**
3. Vérifier email
4. ✅ Compte créé

### 2.2 Créer un site
1. Cliquer **Create Account**
2. **Subdomain** : `yarnflow` (donnera `yarnflow.infinityfreeapp.com`)
3. **Password** (pour FTP)
4. Cliquer **Create Account**
5. Attendre 5-10 min → Compte actif ✅

### 2.3 Récupérer credentials FTP
Dans le Control Panel :
- **FTP Hostname** : `ftpupload.net` (ou similaire)
- **FTP Username** : `if0_xxxxxxxx`
- **FTP Password** : Celui que tu as créé
- **FTP Port** : `21`

### 2.4 Créer Database MySQL
1. Dans Control Panel → **MySQL Databases**
2. **Create Database**
3. Noter :
   ```
   Database Name : if0_xxxxxxxx_yarnflow
   Username : if0_xxxxxxxx
   Password : [généré automatiquement]
   Hostname : sqlxxx.infinityfreeapp.com
   ```

### 2.5 Importer Database Schema
1. Control Panel → **phpMyAdmin**
2. Login avec credentials database
3. Sélectionner `if0_xxxxxxxx_yarnflow`
4. Onglet **Import**
5. Uploader `database/schema.sql`
6. Cliquer **Go**
7. Répéter pour :
   - `database/add_projects_system.sql`
   - `database/add_knitting_types.sql`
   - `database/add_parent_photo_id.sql`

✅ Database prête

---

## 📤 ÉTAPE 3 : Uploader Backend sur InfinityFree - 20 min

### 3.1 Installer FileZilla (Client FTP)
- Windows : https://filezilla-project.org/download.php?type=client
- Installer et lancer

### 3.2 Se connecter au FTP
Dans FileZilla :
- **Host** : `ftpupload.net`
- **Username** : `if0_xxxxxxxx`
- **Password** : Ton mot de passe FTP
- **Port** : `21`
- Cliquer **Quickconnect**

### 3.3 Naviguer vers htdocs
Dans FileZilla, partie droite (serveur) :
- Double-cliquer `htdocs/`

### 3.4 Uploader le backend
Dans FileZilla :
- **Partie gauche** : Naviguer vers `/mnt/d/wamp64/www/pattern-maker/backend`
- **Sélectionner tous les fichiers/dossiers** dans `backend/` :
  - `config/`
  - `controllers/`
  - `models/`
  - `services/`
  - `utils/`
  - `vendor/`
  - `public/`
  - `composer.json`
  - `composer.lock`

- **Glisser-déposer** vers la partie droite (serveur)
- **Attendre upload complet** (5-10 min)

### 3.5 Créer .env sur le serveur
InfinityFree ne permet pas d'uploader `.env` directement.

**Solution** : Renommer en `.env.production` localement, upload, puis renommer sur serveur

1. Dans ton dossier local, créer `/backend/.env` avec ce contenu :

```bash
# Database InfinityFree
DB_HOST=sqlxxx.infinityfreeapp.com
DB_PORT=3306
DB_NAME=if0_xxxxxxxx_yarnflow
DB_USER=if0_xxxxxxxx
DB_PASSWORD=ton_mot_de_passe_db
DB_CHARSET=utf8mb4

# App
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yarnflow.infinityfreeapp.com
FRONTEND_URL=https://yarnflow.vercel.app

# JWT - GÉNÉRER NOUVEAU !
JWT_SECRET=METTRE_UNE_CLE_SECURISEE_32_CARACTERES
JWT_EXPIRATION=604800

# Gemini
GEMINI_API_KEY=ta_cle_api_gemini
GEMINI_MODEL=gemini-2.0-flash-exp

# Stripe (mode test OK pour waitlist)
STRIPE_SECRET_KEY=sk_test_ta_cle
STRIPE_PUBLISHABLE_KEY=pk_test_ta_cle
STRIPE_WEBHOOK_SECRET=whsec_ta_cle
```

2. Remplacer les valeurs par tes vraies credentials InfinityFree
3. Générer JWT Secret :
   ```bash
   openssl rand -base64 32
   ```
   Copier dans `JWT_SECRET`

4. Sauvegarder comme `.env` dans `/backend/`
5. Upload via FileZilla dans `htdocs/`

---

## ⚙️ ÉTAPE 4 : Configuration .htaccess - 10 min

### 4.1 Créer .htaccess pour InfinityFree
InfinityFree utilise Apache, besoin d'un `.htaccess` pour router correctement.

Créer `/backend/public/.htaccess` avec ce contenu :

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect all requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>

# CORS Headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://yarnflow.vercel.app"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

### 4.2 Upload .htaccess
- Via FileZilla, uploader dans `htdocs/public/`

### 4.3 Configurer index.php comme page d'accueil
InfinityFree cherche `index.html` par défaut. Besoin de pointer vers `public/index.php`.

**Solution** : Créer `htdocs/.htaccess` (racine) :

```apache
DirectoryIndex public/index.php

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

Upload dans `htdocs/` (racine, pas dans `public/`)

---

## 🔗 ÉTAPE 5 : Connecter Frontend ↔️ Backend - 5 min

### 5.1 Récupérer URL Backend
Ton backend InfinityFree est accessible sur :
```
https://yarnflow.infinityfreeapp.com
```

L'API sera sur :
```
https://yarnflow.infinityfreeapp.com/api
```

### 5.2 Configurer Vercel
1. Aller sur https://vercel.com/dashboard
2. Cliquer sur ton projet `yarnflow`
3. **Settings** → **Environment Variables**
4. Ajouter :
   ```
   Name: VITE_API_URL
   Value: https://yarnflow.infinityfreeapp.com/api
   ```
5. **Save**
6. Onglet **Deployments** → Cliquer sur dernier deploy → **Redeploy**

✅ Frontend connecté au backend

---

## ✅ ÉTAPE 6 : Test Final - 10 min

### 6.1 Tester API Backend
Ouvrir dans navigateur :
```
https://yarnflow.infinityfreeapp.com/api/health
```

**Attendu** : `{"status":"ok"}` ou erreur PHP lisible

### 6.2 Tester Landing Page
1. Ouvrir `https://yarnflow.vercel.app`
2. Vérifier design OK
3. Vérifier pages légales (`/cgu`, `/privacy`, `/mentions`)

### 6.3 Tester Waitlist
1. S'inscrire avec ton email
2. Vérifier message succès
3. Vérifier dans phpMyAdmin InfinityFree :
   - Table `waitlist_subscribers`
   - Ton email doit apparaître ✅

### 6.4 Tester sur mobile
Ouvrir sur smartphone, vérifier responsive

---

## 🎉 TERMINÉ - 100% GRATUIT !

**URLs finales** :
- 🌐 Landing : `https://yarnflow.vercel.app`
- 🔌 API : `https://yarnflow.infinityfreeapp.com/api`

**Coût total : 0€**

---

## ⚠️ Limites InfinityFree (à connaître)

### Quotas
- ✅ 5GB stockage (largement suffisant)
- ✅ Illimité bandwidth
- ⚠️ 50,000 hits/jour (OK pour waitlist <500 personnes)
- ⚠️ CPU/RAM partagés (peut être lent si grosse charge)

### Restrictions
- ⚠️ Suspend compte si inactif 30 jours (visite régulièrement)
- ⚠️ Pas de support email officiel
- ⚠️ Publicités InfinityFree en cas d'erreur 404 (évitable avec .htaccess)

### Si tu dépasses les limites
**Signal** : Erreur 508 ou site lent

**Solution** :
1. Court terme : Optimiser requêtes, cache
2. Long terme : Migrer vers Railway (5-10€/mois)

---

## 🚀 Prochaines Étapes

### Immédiat
- ✅ Publier sur Reddit/Twitter
- ✅ Monitorer inscriptions (phpMyAdmin)
- ✅ Répondre feedback

### Après 50+ emails
- 💰 Acheter domaine `yarnflow.com` (10€/an)
- 🔗 Pointer vers Vercel (config DNS)

### Après 200+ emails
- 🆙 Migrer vers Railway (5-10€/mois) pour perfs
- 📊 Activer analytics (Plausible 9€/mois)

---

## 🆘 Troubleshooting

### Erreur "Database connection failed"
- Vérifier credentials DB dans `.env`
- Vérifier DB_HOST = `sqlxxx.infinityfreeapp.com`

### Erreur 404 sur /api/...
- Vérifier `.htaccess` dans `htdocs/` et `htdocs/public/`
- Vérifier `mod_rewrite` activé (normalement oui)

### CORS Error
- Vérifier `Access-Control-Allow-Origin` dans `.htaccess`
- Doit correspondre exactement à ton URL Vercel

### Upload FTP échoue
- Vérifier que compte InfinityFree est actif (10 min après création)
- Essayer avec un autre client FTP (WinSCP)

---

## 📞 Support

**InfinityFree Forum** : https://forum.infinityfree.com
**Vercel Docs** : https://vercel.com/docs

**Bon lancement gratuit ! 🎉🧶**
