# 🚀 Guide Déploiement YarnFlow sur O2Switch

## 📋 Pré-requis
- ✅ Compte O2Switch actif : https://www.o2switch.fr
- ✅ Nom de domaine configuré (ex: `yarnflow.fr`)
- ✅ Accès cPanel
- ✅ Client FTP (FileZilla) ou SSH

**Avantages O2Switch** :
- 🇫🇷 Hébergeur français premium
- ⚡ PHP 8.1+, MySQL 8.0 complet (triggers, events, stored procedures)
- 🔒 SSL gratuit (Let's Encrypt)
- 📧 SMTP illimité
- 💾 Stockage illimité
- 🛡️ Support 24/7

---

## 🗄️ ÉTAPE 1 : Créer la base de données MySQL

### 1.1 Connexion cPanel
1. Connectez-vous à votre **cPanel O2Switch** : `https://cpanel.votredomaine.fr`
2. Username/Password : reçus par email O2Switch

### 1.2 Créer la base de données
1. Dans cPanel, cherchez **"MySQL Databases"** ou **"Bases de données MySQL"**
2. Section **"Create New Database"** :
   - **Nom** : `yarnflow` (sera préfixé automatiquement : `votreuser_yarnflow`)
   - Cliquez sur **"Create Database"**

### 1.3 Créer un utilisateur MySQL
1. Section **"MySQL Users"** → **"Add New User"**
   - **Username** : `yarnflow_user`
   - **Password** : Générer un mot de passe fort (cliquez sur "Generate Password")
   - ⚠️ **Notez ce mot de passe** quelque part de sûr !
   - Cliquez sur **"Create User"**

### 1.4 Associer l'utilisateur à la base
1. Section **"Add User To Database"**
   - **User** : `votreuser_yarnflow_user`
   - **Database** : `votreuser_yarnflow`
   - Cliquez sur **"Add"**
2. Cochez **"ALL PRIVILEGES"** (Tous les privilèges)
3. Cliquez sur **"Make Changes"**

### 1.5 Notez vos informations
```
📝 CREDENTIALS MYSQL À NOTER :
- DB_HOST: localhost
- DB_NAME: votreuser_yarnflow
- DB_USER: votreuser_yarnflow_user
- DB_PASSWORD: [le mot de passe généré]
```

---

## 📁 ÉTAPE 2 : Préparer les fichiers backend

### 2.1 Créer le fichier .env de production

```bash
cd /mnt/d/wamp64/www/pattern-maker/backend
```

Créez un fichier `.env.o2switch` avec ce contenu :

```env
# Configuration O2Switch Production - YarnFlow

# ====================================================================
# Base de données MySQL O2Switch
# ====================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=votreuser_yarnflow
DB_USER=votreuser_yarnflow_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
DB_CHARSET=utf8mb4

# ====================================================================
# Application
# ====================================================================
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yarnflow.fr
FRONTEND_URL=https://yarnflow.fr

# ====================================================================
# JWT - Sécurité des tokens
# ====================================================================
# Générer avec : openssl rand -base64 32
JWT_SECRET=VOTRE_CLE_ALEATOIRE_32_CARACTERES
JWT_EXPIRATION=604800

# ====================================================================
# Stripe (Paiements) - Mode PRODUCTION
# ====================================================================
# Clés trouvées sur : https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_votre_cle_secrete
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook

# ====================================================================
# AI Photo Studio - Gemini
# ====================================================================
GEMINI_API_KEY=AIzaSyAD1czoQ4IDaA20ykhK_GhMmkZh-KKJEJs
GEMINI_MODEL=gemini-2.5-flash-image-preview
GEMINI_SIMULATION_MODE=false

# ====================================================================
# Email SMTP (O2Switch fournit un SMTP illimité)
# ====================================================================
SMTP_HOST=mail.votredomaine.fr
SMTP_PORT=587
SMTP_USER=noreply@yarnflow.fr
SMTP_PASSWORD=votre_mot_de_passe_email
SMTP_FROM_EMAIL=noreply@yarnflow.fr
SMTP_FROM_NAME=YarnFlow

# ====================================================================
# Limites et tarification
# ====================================================================
MAX_PROJECTS_FREE=3
PATTERN_BASE_PRICE=2.99
PATTERN_ADVANCED_MULTIPLIER=1.5
SUBSCRIPTION_MONTHLY_PRICE=4.99
SUBSCRIPTION_YEARLY_PRICE=49.99
```

### 2.2 Générer une clé JWT sécurisée

```bash
# Dans WSL ou Git Bash
openssl rand -base64 32
# Résultat : Par exemple "xK3pL9mN2qR5sT8vW1yZ4aC7bE0fG6hJ"
# Copiez cette valeur dans JWT_SECRET
```

---

## 📤 ÉTAPE 3 : Upload du backend via FTP

### 3.1 Récupérer les identifiants FTP

**Option 1 : Depuis cPanel**
1. cPanel → **"FTP Accounts"**
2. Créez un compte FTP ou utilisez le compte principal
3. Notez :
   - **Host** : `ftp.votredomaine.fr`
   - **Username** : votre username cPanel
   - **Password** : votre password cPanel
   - **Port** : `21`

**Option 2 : Email O2Switch**
- Les credentials FTP sont dans l'email de bienvenue O2Switch

### 3.2 Connexion FTP avec FileZilla

1. Ouvrez **FileZilla**
2. Fichier → Gestionnaire de sites → Nouveau site
3. Remplissez :
   - **Hôte** : `ftp.votredomaine.fr`
   - **Port** : `21`
   - **Protocole** : FTP
   - **Chiffrement** : Connexion FTP explicite sur TLS si disponible
   - **Type d'authentification** : Normale
   - **Utilisateur** : votre username
   - **Mot de passe** : votre password
4. Cliquez sur **"Connexion"**

### 3.3 Structure d'upload

**Sur O2Switch, allez dans le dossier `/www/` (ou `/public_html/`)**

#### Option A : Landing page SEULE (recommandé pour début)

Si vous voulez juste déployer la **landing page** (frontend statique) :

```
/www/
├── index.html              ← dist/index.html
├── manifest.json
├── robots.txt
├── sitemap.xml
├── og-image.jpg
├── sw.js
├── workbox-*.js
├── assets/                 ← TOUT le dossier dist/assets/
│   ├── index-*.css
│   └── index-*.js
├── icons/                  ← TOUT le dossier dist/icons/
└── screenshots/
```

**Upload depuis** : `/mnt/d/wamp64/www/pattern-maker/frontend/dist/`
**Upload vers** : `/www/` (racine du site)

#### Option B : Site complet (frontend + backend API)

```
/www/
├── [Tous les fichiers de l'Option A - frontend]
│
└── api/                    ← Créer ce sous-dossier pour le backend
    ├── .htaccess           ← backend/.htaccess
    ├── .env                ← votre .env.o2switch renommé
    ├── config/
    ├── controllers/
    ├── models/
    ├── services/
    ├── middleware/
    ├── routes/
    ├── utils/
    ├── workers/
    ├── vendor/             ← TOUT le dossier (important!)
    └── public/
        ├── .htaccess       ← backend/public/.htaccess
        ├── index.php
        ├── health.php
        └── uploads/
```

### 3.4 Fichiers à NE PAS uploader

❌ **Ne jamais uploader** :
- `node_modules/` (n'existe pas en PHP)
- `.git/`
- `.env` de développement (uniquement `.env.o2switch` renommé en `.env`)
- `database/` (SQL importé via phpMyAdmin)
- Fichiers de test : `test*.php`, `debug*.php`, `info.php`

---

## 🗂️ ÉTAPE 4 : Importer la base de données

### 4.1 Accéder à phpMyAdmin

1. Dans cPanel, cherchez **"phpMyAdmin"**
2. Cliquez dessus (connexion automatique)
3. Dans la colonne de gauche, sélectionnez **`votreuser_yarnflow`**

### 4.2 Fichiers SQL à importer (dans l'ordre)

**O2Switch supporte TOUT MySQL**, donc utilisez les fichiers complets :

```bash
1. schema.sql                      # Structure de base
2. add_projects_system.sql         # Système de projets tricot
3. add_knitting_types.sql          # Types de points
4. add_parent_photo_id.sql         # Variations photos IA
5. add_ai_photo_studio.sql         # AI Photo Studio complet
6. add_categories_table.sql        # Catégories de patrons
7. add_pattern_options_table.sql   # Options avancées
8. add_pattern_library.sql         # Bibliothèque de patrons
9. add_waitlist.sql                # Liste d'attente (optionnel)
```

### 4.3 Import via phpMyAdmin

**Pour chaque fichier SQL :**
1. Onglet **"Import"** (en haut)
2. Cliquez sur **"Choisir un fichier"**
3. Sélectionnez le fichier (ex: `schema.sql`)
4. **Format** : SQL
5. **Encodage** : utf8mb4
6. Cliquez sur **"Exécuter"**
7. Attendez le message de succès ✅
8. Répétez pour chaque fichier **dans l'ordre**

⚠️ **Important** : Si un fichier échoue, lisez l'erreur et corrigez avant de continuer.

---

## ⚙️ ÉTAPE 5 : Configurer le .htaccess

### 5.1 Si backend dans `/www/api/`

**Fichier** : `/www/api/.htaccess`

```apache
# .htaccess pour O2Switch - Racine backend
DirectoryIndex public/index.php

<IfModule mod_rewrite.c>
    RewriteEngine On

    # Force HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Redirect all requests to public directory
    RewriteCond %{REQUEST_URI} !^/api/public/
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>

Options -Indexes

<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set X-Frame-Options "SAMEORIGIN"
</IfModule>
```

**Fichier** : `/www/api/public/.htaccess`

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Pass Authorization header to PHP
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect trailing slashes
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send requests to index.php
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [L]
</IfModule>

# CORS for frontend
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://yarnflow.fr"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
    Header set Access-Control-Allow-Credentials "true"

    # Preflight OPTIONS
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>

Options -Indexes
```

---

## 🔐 ÉTAPE 6 : Configurer SSL (HTTPS)

### 6.1 Activer Let's Encrypt (gratuit)

1. Dans cPanel, cherchez **"SSL/TLS Status"** ou **"Let's Encrypt SSL"**
2. Cochez votre domaine **`yarnflow.fr`** et **`www.yarnflow.fr`**
3. Cliquez sur **"Run AutoSSL"**
4. Attendez 2-3 minutes
5. Vérifiez que le certificat est actif ✅

### 6.2 Forcer HTTPS

Dans cPanel → **"Domaines"** → Activez **"Force HTTPS Redirect"**

Ou ajoutez dans `/www/.htaccess` (racine) :

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## ✅ ÉTAPE 7 : Tester le déploiement

### 7.1 Test de la landing page

Ouvrez dans votre navigateur :
```
https://yarnflow.fr
```

**Attendu** :
- ✅ Page d'accueil s'affiche
- ✅ Icônes et images chargent
- ✅ Certificat SSL actif (cadenas 🔒)
- ✅ Bouton "Installer l'app" (PWA)

### 7.2 Test du backend (si installé)

```bash
# Test health check
curl -s "https://yarnflow.fr/api/public/health.php"
# Attendu : {"status":"ok","timestamp":"..."}

# Test API categories
curl -s "https://yarnflow.fr/api/categories"
# Attendu : [{"id":1,"name":"Amigurumi",...}]

# Test auth (doit retourner 401 sans token)
curl -s "https://yarnflow.fr/api/auth/me"
# Attendu : {"error":"Missing authorization header"}
```

### 7.3 Test PWA

1. Ouvrez Chrome sur desktop
2. Allez sur `https://yarnflow.fr`
3. Cherchez l'icône **⊕ Installer** dans la barre d'adresse
4. Cliquez → L'app doit s'installer

**Mobile** :
1. Ouvrez Chrome sur Android
2. Un banner "Ajouter à l'écran d'accueil" doit apparaître
3. L'icône YarnFlow est ajoutée

### 7.4 Test Lighthouse (Performance)

1. Chrome DevTools (F12)
2. Onglet **"Lighthouse"**
3. Cochez : **Performance, PWA, SEO, Accessibility**
4. Cliquez sur **"Generate report"**

**Scores attendus** :
- Performance : 90+
- PWA : 90+
- SEO : 95+
- Accessibility : 85+

---

## 📧 ÉTAPE 8 : Configurer l'email SMTP (optionnel)

### 8.1 Créer une adresse email

1. cPanel → **"Email Accounts"**
2. Créer l'adresse **`noreply@yarnflow.fr`**
3. Notez le mot de passe

### 8.2 Mettre à jour le .env

```env
SMTP_HOST=mail.yarnflow.fr
SMTP_PORT=587
SMTP_USER=noreply@yarnflow.fr
SMTP_PASSWORD=le_mot_de_passe
SMTP_FROM_EMAIL=noreply@yarnflow.fr
SMTP_FROM_NAME=YarnFlow
```

### 8.3 Tester l'envoi d'email

```php
// test-email.php (à supprimer après test)
<?php
require_once '../config/bootstrap.php';

$to = 'votre@email.com';
$subject = 'Test YarnFlow';
$message = 'Email test depuis O2Switch';
$headers = 'From: noreply@yarnflow.fr';

if (mail($to, $subject, $message, $headers)) {
    echo "✅ Email envoyé";
} else {
    echo "❌ Échec envoi";
}
```

---

## 🎯 CHECKLIST finale avant lancement

### Infrastructure
- [ ] Domaine configuré et actif
- [ ] SSL activé (cadenas 🔒)
- [ ] Force HTTPS actif
- [ ] Base de données créée
- [ ] Tous les SQL importés (9 fichiers)

### Backend (si installé)
- [ ] Fichiers uploadés dans `/www/api/`
- [ ] `.env` configuré avec vraies valeurs
- [ ] `vendor/` uploadé complètement
- [ ] `.htaccess` en place (root + public)
- [ ] Test health.php OK
- [ ] Test API categories OK

### Frontend
- [ ] `dist/` buildé (`npm run build`)
- [ ] Tous les fichiers uploadés dans `/www/`
- [ ] PWA manifeste actif
- [ ] Service Worker enregistré
- [ ] Icônes chargent correctement

### Sécurité
- [ ] JWT_SECRET unique et fort (32+ chars)
- [ ] APP_DEBUG=false
- [ ] Passwords MySQL forts
- [ ] Fichiers sensibles pas uploadés (.env dev, .git)
- [ ] CORS configuré correctement

### Performance
- [ ] Test Lighthouse > 90 (tous critères)
- [ ] Images optimisées
- [ ] Gzip/Brotli actif (O2Switch par défaut)
- [ ] Cache navigateur configuré

### Fonctionnel
- [ ] Landing page s'affiche
- [ ] Formulaire waitlist fonctionne (si activé)
- [ ] Installation PWA fonctionne desktop + mobile
- [ ] Mode offline fonctionne
- [ ] Links SEO (robots.txt, sitemap.xml)

---

## ⚠️ Problèmes courants

### Erreur 500 - Internal Server Error

**Causes** :
- ❌ Fichier `.env` mal formaté ou manquant
- ❌ Erreur dans `.htaccess`
- ❌ Permissions fichiers incorrectes

**Solutions** :
```bash
# Via SSH (si accès)
chmod 755 /www/api/public/
chmod 644 /www/api/public/.htaccess
chmod 644 /www/api/.env

# Vérifier les logs
cPanel → "Errors" → Lire le dernier message d'erreur
```

### Erreur 404 - API introuvable

**Causes** :
- ❌ `.htaccess` pas uploadé ou mal configuré
- ❌ `mod_rewrite` pas actif

**Solutions** :
- Vérifier que `.htaccess` existe bien dans `/www/api/public/`
- Contacter support O2Switch pour activer `mod_rewrite` (normalement actif)

### Base de données : Connection refused

**Causes** :
- ❌ DB_HOST incorrect (doit être `localhost` sur O2Switch)
- ❌ Credentials MySQL erronés

**Solutions** :
```env
# Dans .env, vérifier :
DB_HOST=localhost  # PAS d'IP, juste "localhost"
DB_NAME=votreuser_yarnflow
DB_USER=votreuser_yarnflow_user
DB_PASSWORD=[le bon mot de passe]
```

### PWA ne s'installe pas

**Causes** :
- ❌ HTTPS pas activé
- ❌ `manifest.json` pas accessible
- ❌ Service Worker erreur

**Solutions** :
1. Vérifier `https://yarnflow.fr/manifest.json` accessible
2. Chrome DevTools → Application → Manifest (voir erreurs)
3. Chrome DevTools → Application → Service Workers (vérifier status)

### Images ne chargent pas

**Causes** :
- ❌ Chemins absolus au lieu de relatifs
- ❌ Permissions dossier `uploads/`

**Solutions** :
```bash
# Via cPanel File Manager
/www/api/public/uploads/ → Permissions : 755
```

---

## 🚀 Optimisations post-lancement

### 1. Activer le cache OpCache (PHP)

Dans cPanel → **"Select PHP Version"** → **"Options"** :
- `opcache.enable` = On
- `opcache.memory_consumption` = 128
- `opcache.max_accelerated_files` = 10000

### 2. Activer Gzip/Brotli

O2Switch l'active par défaut, mais vous pouvez forcer dans `.htaccess` :

```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript
</IfModule>
```

### 3. Cache navigateur

Dans `/www/.htaccess` (racine frontend) :

```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 4. CDN (optionnel)

Pour accélérer le chargement mondial :
- **Cloudflare** : Gratuit, CDN + protection DDoS
- Ajouter le site sur Cloudflare
- Pointer les DNS vers Cloudflare
- Activer "Always Use HTTPS" + "Auto Minify"

---

## 📞 Support O2Switch

**En cas de problème technique** :
- 📧 Email : support@o2switch.fr
- 💬 Chat : https://www.o2switch.fr (en bas à droite)
- 📞 Téléphone : 04 44 44 60 40
- ⏰ Disponibilité : 24/7/365

**Questions fréquentes** : https://faq.o2switch.fr/

---

## 📚 Ressources

- **Documentation O2Switch** : https://faq.o2switch.fr/
- **cPanel Guide** : https://cpanel.net/
- **Let's Encrypt SSL** : https://letsencrypt.org/
- **FileZilla** : https://filezilla-project.org/
- **PWA Tester** : https://www.pwabuilder.com/

---

## ✅ Résultat final attendu

Après déploiement complet :

```
✅ https://yarnflow.fr → Landing page PWA
✅ https://yarnflow.fr/api/public/health.php → {"status":"ok"}
✅ Installation PWA fonctionnelle (desktop + mobile)
✅ Mode offline actif
✅ SSL/HTTPS actif
✅ Base de données opérationnelle
✅ Score Lighthouse > 90
```

---

**Version** : 1.0
**Date** : 2025-11-25
**YarnFlow** : v0.11.0
**Status** : ✅ Production-ready O2Switch
