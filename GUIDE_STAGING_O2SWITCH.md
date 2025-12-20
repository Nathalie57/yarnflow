# Guide de déploiement STAGING sur O2switch - YarnFlow

**Version:** 0.16.0
**Date:** 2025-12-20
**Hébergeur:** O2switch (hébergement mutualisé avec cPanel)

---

## 🎯 Objectif

Déployer un environnement de **staging** (pré-production) pour YarnFlow sur O2switch afin de tester les nouvelles fonctionnalités avant de les déployer en production.

---

## 📋 Prérequis

### Sur votre machine locale
- Accès SSH ou FTP/SFTP (FileZilla recommandé)
- Git installé (pour versionner les déploiements)
- Node.js installé (pour builder le frontend)
- Composer installé (pour les dépendances PHP)

### Sur O2switch
- Un compte O2switch actif avec cPanel
- Accès cPanel (https://votre-domaine.com:2083)
- Un nom de domaine ou sous-domaine disponible (ex: `staging.yarnflow.fr`)

---

## 🚀 Étape 1 : Configuration du sous-domaine

### 1.1 Créer le sous-domaine dans cPanel

1. **Connexion à cPanel**
   - URL : `https://votre-domaine.com:2083`
   - Login : votre email ou username O2switch
   - Password : votre mot de passe cPanel

2. **Créer le sous-domaine**
   ```
   cPanel > Domaines > Sous-domaines
   ```
   - **Sous-domaine** : `staging`
   - **Domaine** : `yarnflow.fr` (ou votre domaine)
   - **Racine du document** : `/home/username/staging.yarnflow.fr`
   - Cliquer sur **Créer**

3. **Vérifier la création**
   - Le dossier `/home/username/staging.yarnflow.fr` doit être créé automatiquement
   - Vous pouvez accéder à `https://staging.yarnflow.fr` (page blanche normale pour l'instant)

### 1.2 Configurer SSL (HTTPS)

1. **Activer SSL gratuit (Let's Encrypt)**
   ```
   cPanel > Sécurité > SSL/TLS Status
   ```
   - Cocher `staging.yarnflow.fr`
   - Cliquer sur **Run AutoSSL**
   - Attendre 2-5 minutes pour la génération du certificat

2. **Forcer HTTPS (recommandé)**
   - Créer un fichier `.htaccess` à la racine du sous-domaine (voir Étape 4)

---

## 🗄️ Étape 2 : Créer la base de données MySQL

### 2.1 Créer la base de données

1. **Aller dans MySQL**
   ```
   cPanel > Bases de données > Bases de données MySQL
   ```

2. **Créer une nouvelle base de données**
   - **Nom de la base** : `staging_yarnflow` (préfixe automatique ajouté par cPanel)
   - Nom complet sera : `username_staging_yarnflow`
   - Cliquer sur **Créer une base de données**

### 2.2 Créer l'utilisateur MySQL

1. **Dans la même page, section "Utilisateurs MySQL"**
   - **Nom d'utilisateur** : `staging_user`
   - Nom complet sera : `username_staging_user`
   - **Mot de passe** : Générer un mot de passe sécurisé (bouton "Générer")
   - ⚠️ **IMPORTANT** : Noter le mot de passe dans un endroit sûr !
   - Cliquer sur **Créer un utilisateur**

### 2.3 Associer l'utilisateur à la base

1. **Section "Ajouter un utilisateur à une base de données"**
   - **Utilisateur** : `username_staging_user`
   - **Base de données** : `username_staging_yarnflow`
   - Cliquer sur **Ajouter**

2. **Gérer les privilèges**
   - Cocher **TOUS LES PRIVILÈGES**
   - Cliquer sur **Apporter des modifications**

### 2.4 Importer le schéma de la base de données

1. **Aller dans phpMyAdmin**
   ```
   cPanel > Bases de données > phpMyAdmin
   ```

2. **Sélectionner la base `username_staging_yarnflow`**

3. **Onglet "Importer"**
   - Cliquer sur **Choisir un fichier**
   - Sélectionner les fichiers SQL dans l'ordre :
     ```
     1. database/schema.sql
     2. database/add_projects_system.sql
     3. database/add_knitting_types.sql
     4. database/add_ai_photo_studio_notriggers.sql  ⚠️ AVANT add_parent_photo_id !
     5. database/add_parent_photo_id.sql
     6. database/add_project_sections.sql
     7. database/add_section_time_tracking.sql
     8. database/add_waitlist.sql
     9. database/update_subscription_plans.sql
     10. database/add_pattern_library.sql
     11. database/add_project_tags.sql
     12. database/add_projects_favorite.sql
     13. database/add_photo_feedback_simple.sql
     14. database/add_completed_at_to_payments.sql
     15. database/add_contact_messages.sql
     ```
   - ⚠️ **ATTENTION** : L'ordre est CRITIQUE ! Ne pas inverser !
   - ⚠️ `add_ai_photo_studio_notriggers.sql` crée la table `user_photos`
   - ⚠️ `add_parent_photo_id.sql` modifie cette table (doit venir après)
   - Format : **SQL**
   - Cliquer sur **Exécuter**

4. **Vérifier l'import**
   - Vous devriez voir toutes les tables créées dans la liste de gauche
   - Tables principales : `users`, `projects`, `project_rows`, `project_sections`, `user_photos`, `payments`, etc.

---

## 📂 Étape 3 : Déployer les fichiers

### 3.1 Préparer les fichiers en local

#### Backend
```bash
# Dans le dossier backend/
cd /mnt/d/wamp64/www/pattern-maker/backend

# Installer les dépendances Composer
composer install --no-dev --optimize-autoloader

# Créer le fichier .env pour staging
cp .env.example .env.staging
```

Éditer `.env.staging` :
```ini
# Database (remplacer par vos valeurs O2switch)
DB_HOST=localhost
DB_NAME=username_staging_yarnflow
DB_USER=username_staging_user
DB_PASS=VotreMotDePasseMySQL

# JWT Secret (générer une clé unique)
JWT_SECRET=VotreCleSecreteStagingDifferenteDeProduction123456

# Stripe (utiliser les clés TEST)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_TEST
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_TEST
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_TEST

# Gemini API (utiliser la vraie clé ou une clé de test)
GEMINI_API_KEY=AIzaSy...

# Pricing (en centimes)
SUBSCRIPTION_PLUS_MONTHLY_PRICE=2.99
SUBSCRIPTION_PLUS_ANNUAL_PRICE=29.99
SUBSCRIPTION_PRO_MONTHLY_PRICE=4.99
SUBSCRIPTION_PRO_ANNUAL_PRICE=49.99

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
SMTP_FROM_EMAIL=noreply@yarnflow.fr
SMTP_FROM_NAME=YarnFlow

# Contact System
# CONTACT_EMAIL : adresse qui REÇOIT les messages ET expédie les emails de confirmation
CONTACT_EMAIL=contact@yarnflow.fr

# Environment
APP_ENV=staging
```

#### Frontend
```bash
# Dans le dossier frontend/
cd /mnt/d/wamp64/www/pattern-maker/frontend

# Installer les dépendances
npm install

# Créer le fichier .env.staging
cp .env.example .env.staging
```

Éditer `.env.staging` :
```ini
VITE_API_URL=https://staging.yarnflow.fr/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_TEST
VITE_ENV=staging
```

**Builder le frontend pour la production** :
```bash
npm run build
```

Cela génère le dossier `frontend/dist/` avec les fichiers optimisés.

### 3.2 Structure des dossiers sur O2switch

⚠️ **IMPORTANT** : Sur staging, le backend n'a PAS de sous-dossier `public/`. Tout est au même niveau dans `/api/`.

Créer l'arborescence suivante sur le serveur :

```
/home/username/staging.yarnflow.fr/
├── .htaccess                    # Redirection HTTPS + SPA routing
├── index.html                   # Point d'entrée du frontend (copié depuis dist/)
├── assets/                      # Assets du frontend (copié depuis dist/assets/)
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
├── api/                         # ⚠️ Backend PHP (TOUT au même niveau!)
│   ├── .htaccess               # Configuration Apache pour API
│   ├── .env                    # ⚠️ Variables d'environnement (MÊME NIVEAU que index.php!)
│   ├── index.php               # Point d'entrée API
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── config/
│   │   └── Database.php
│   ├── routes/
│   │   └── api.php
│   └── vendor/                 # ⚠️ Composer (MÊME NIVEAU!)
│       └── autoload.php
└── uploads/                     # Dossier pour les photos (créer manuellement)
    ├── photos/
    └── patterns/
```

**Différence avec le développement local :**
- **Local** : `backend/public/index.php` + `backend/.env` + `backend/vendor/`
- **Staging** : `api/index.php` + `api/.env` + `api/vendor/` (TOUT au même niveau)

### 3.3 Transférer les fichiers via FTP/SFTP

**Méthode recommandée : FileZilla**

1. **Configurer la connexion SFTP**
   - **Hôte** : `ftpback.o2switch.net` ou `staging.yarnflow.fr`
   - **Port** : `22` (SFTP) ou `21` (FTP)
   - **Protocole** : SFTP (SSH File Transfer Protocol)
   - **Type d'authentification** : Normale
   - **Identifiant** : votre username cPanel
   - **Mot de passe** : votre mot de passe cPanel

2. **Naviguer vers le dossier**
   ```
   /home/username/staging.yarnflow.fr/
   ```

3. **Transférer les fichiers**

   **Frontend (depuis `frontend/dist/`)** :
   - Copier `dist/index.html` → `/home/username/staging.yarnflow.fr/index.html`
   - Copier `dist/assets/` → `/home/username/staging.yarnflow.fr/assets/`
   - Copier `dist/style-examples/` → `/home/username/staging.yarnflow.fr/style-examples/`

   **Backend (depuis `backend/`)** :
   - Créer le dossier `/home/username/staging.yarnflow.fr/api/`
   - ⚠️ **IMPORTANT** : Sur staging, TOUT est au même niveau dans `/api/` (pas de sous-dossier public/)
   - Copier les fichiers :
     ```
     backend/controllers/     → /api/controllers/
     backend/models/          → /api/models/
     backend/services/        → /api/services/
     backend/config/          → /api/config/
     backend/routes/          → /api/routes/
     backend/vendor/          → /api/vendor/
     backend/public/index.php → /api/index.php (enlever public/)
     backend/.env.staging     → /api/.env (RENOMMER et mettre au même niveau!)
     backend/public/.htaccess → /api/.htaccess
     ```
   - ⚠️ Ne PAS créer de dossier `/api/public/` - tout est directement dans `/api/`

   **Uploads** :
   - Créer `/home/username/staging.yarnflow.fr/uploads/`
   - Créer `/home/username/staging.yarnflow.fr/uploads/photos/`
   - Créer `/home/username/staging.yarnflow.fr/uploads/patterns/`

4. **Définir les permissions (CHMOD)**

   Via FileZilla (clic droit > Permissions de fichier) :
   - Dossier `uploads/` : **755** (rwxr-xr-x)
   - Dossier `uploads/photos/` : **755**
   - Dossier `uploads/patterns/` : **755**
   - Fichier `api/.env` : **600** (rw-------, sécurité)
   - Fichier `.htaccess` : **644**

---

## ⚙️ Étape 4 : Configuration Apache (.htaccess)

### 4.1 `.htaccess` à la racine (frontend)

Créer `/home/username/staging.yarnflow.fr/.htaccess` :

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API routing - Rediriger /api vers /api/index.php
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ /api/index.php [QSA,L]

# SPA routing - Toutes les autres requêtes vers index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 4.2 `.htaccess` dans /api (backend)

Créer `/home/username/staging.yarnflow.fr/api/.htaccess` :

```apache
# Activer le moteur de réécriture
RewriteEngine On

# Rediriger toutes les requêtes vers index.php
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# CORS Headers (autoriser staging uniquement)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "https://staging.yarnflow.fr"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>

# Empêcher l'accès direct au fichier .env
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

# Empêcher la navigation dans les dossiers
Options -Indexes
```

---

## 🧪 Étape 5 : Tests et vérification

### 5.1 Tester l'API backend

Ouvrir dans le navigateur ou avec Postman :

```
https://staging.yarnflow.fr/api/health
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "timestamp": "2025-12-19 23:00:00"
}
```

Si erreur 500, vérifier :
- Fichier `api/.env` correctement configuré
- Connexion base de données (credentials MySQL corrects)
- Permissions des dossiers
- Logs PHP dans cPanel > Erreurs

### 5.2 Tester le frontend

Ouvrir dans le navigateur :

```
https://staging.yarnflow.fr
```

**Vérifier** :
- ✅ La page Landing s'affiche correctement
- ✅ Pas d'erreurs dans la console (F12)
- ✅ Les appels API fonctionnent (onglet Network)

### 5.3 Tester l'inscription/connexion

1. Créer un compte de test
2. Se connecter
3. Créer un projet
4. Incrémenter/décrémenter le compteur
5. Tester l'upload de photo (AI Photo Studio)

### 5.4 Tester le système de contact (v0.16.0)

**En tant qu'utilisateur non connecté** :
1. Aller sur `https://staging.yarnflow.fr/contact`
2. Remplir le formulaire avec nom, email, catégorie, sujet et message
3. Vérifier que l'email de confirmation arrive à l'utilisateur
4. Vérifier que l'email de notification arrive à `CONTACT_EMAIL`

**En tant qu'utilisateur connecté** :
1. Se connecter
2. Cliquer sur "Contact" dans le menu profil
3. Vérifier que nom et email sont pré-remplis
4. Envoyer un message
5. Vérifier que la redirection va vers `/my-projects` (pas `/`)

**Tester le rate limiting** :
1. Envoyer 3 messages rapidement
2. Le 4e message doit être refusé avec erreur 429
3. Vérifier le message : "Trop de messages envoyés. Veuillez réessayer dans 1 heure."

**En mode développement** :
- Les emails ne sont pas réellement envoyés
- Vérifier les logs PHP pour voir le contenu des emails
- `cPanel > Métriques > Erreurs` ou fichier `error_log`

---

## 🔄 Étape 6 : Mises à jour et déploiement continu

### 6.1 Déploiement manuel (développement rapide)

Quand vous faites des modifications :

**Frontend** :
```bash
cd frontend
npm run build
# Transférer dist/ vers le serveur via FTP
```

**Backend** :
```bash
# Transférer les fichiers modifiés via FTP
# Ex: controllers/ProjectController.php
```

### 6.2 Script de déploiement automatisé (optionnel)

Créer `deploy-staging.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement STAGING YarnFlow"

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Upload via LFTP (installer lftp si nécessaire)
echo "📤 Uploading files..."
lftp -e "
  set sftp:auto-confirm yes;
  set ssl:verify-certificate no;
  open sftp://username:password@staging.yarnflow.fr;
  mirror -R dist/ /home/username/staging.yarnflow.fr/ --exclude .git --exclude node_modules;
  mirror -R ../backend/ /home/username/staging.yarnflow.fr/api/ --exclude .git --exclude node_modules --exclude vendor;
  bye
"

echo "✅ Déploiement terminé !"
```

---

## 🛡️ Étape 7 : Sécurité

### 7.1 Protéger l'accès staging (optionnel)

Si vous voulez restreindre l'accès au staging (bêta fermée) :

**Créer `.htpasswd`** :
```bash
# Dans cPanel > Confidentialité du répertoire
# Ou créer manuellement :
htpasswd -c /home/username/.htpasswd staging_user
```

**Ajouter dans `.htaccess` racine** :
```apache
# Protection par mot de passe
AuthType Basic
AuthName "Staging YarnFlow - Accès restreint"
AuthUserFile /home/username/.htpasswd
Require valid-user
```

### 7.2 Désactiver l'indexation Google

Ajouter dans `/home/username/staging.yarnflow.fr/robots.txt` :

```
User-agent: *
Disallow: /
```

### 7.3 Monitoring des erreurs

**Logs PHP** :
```
cPanel > Métriques > Erreurs
```

**Activer les logs détaillés dans `api/config/database.php`** :
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

⚠️ **IMPORTANT** : Désactiver en production !

---

## 📊 Étape 8 : Base de données de test

### 8.1 Créer un utilisateur admin de test

Dans phpMyAdmin :

```sql
INSERT INTO users (email, password, first_name, last_name, subscription_type, is_admin, email_verified)
VALUES (
  'admin@staging.yarnflow.fr',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
  'Admin',
  'Staging',
  'pro',
  1,
  1
);
```

### 8.2 Ajouter des données de test

Utiliser les scripts dans `database/seed_demo_minimal.sql` :

```bash
# Dans phpMyAdmin > Importer
database/seed_demo_minimal.sql
```

---

## 🎯 Checklist finale

- [ ] Sous-domaine `staging.yarnflow.fr` créé et accessible
- [ ] SSL (HTTPS) activé et fonctionnel
- [ ] Base de données MySQL créée et schéma importé
- [ ] Fichiers frontend déployés (dist/)
- [ ] Fichiers backend déployés (api/)
- [ ] Fichier `.env` configuré avec les bonnes credentials
- [ ] `.htaccess` configurés (racine + api/)
- [ ] Dossier `uploads/` créé avec permissions 755
- [ ] API accessible : `https://staging.yarnflow.fr/api/health`
- [ ] Frontend accessible : `https://staging.yarnflow.fr`
- [ ] Inscription/connexion fonctionnelle
- [ ] Stripe configuré en mode TEST
- [ ] Gemini API configurée
- [ ] Logs d'erreurs activés pour debugging

---

## 🆘 Dépannage

### Erreur 500 sur l'API

**Vérifier** :
1. Logs PHP : `cPanel > Métriques > Erreurs`
2. Fichier `.env` existe et credentials corrects
3. Connexion MySQL fonctionne (tester avec phpMyAdmin)
4. Version PHP >= 8.1 (vérifier dans cPanel > Select PHP Version)

### Erreur 404 sur /api/

**Vérifier** :
1. `.htaccess` dans `/api/` existe
2. Mod_rewrite activé (par défaut sur O2switch)
3. `RewriteEngine On` dans `.htaccess` racine

### CORS errors

**Vérifier** :
1. Headers CORS dans `api/.htaccess`
2. `VITE_API_URL` dans frontend pointe vers `https://staging.yarnflow.fr/api`

### Upload photos ne fonctionne pas

**Vérifier** :
1. Dossier `uploads/photos/` existe
2. Permissions 755 sur `uploads/`
3. `upload_max_filesize` et `post_max_size` dans PHP.ini (min 10M)

### Performance lente

**Optimiser** :
1. Activer OPcache dans cPanel > Select PHP Version > Extensions
2. Activer compression gzip dans `.htaccess`
3. Vérifier cache navigateur (F12 > Network)

---

## 📞 Support O2switch

**Contact** :
- Email : support@o2switch.fr
- Ticket : Via l'espace client
- Chat : Disponible dans cPanel

**Documentation O2switch** :
- https://faq.o2switch.fr/

---

## 🚀 Prochaines étapes

Une fois le staging validé :

1. **Tests utilisateurs** : Inviter des bêta-testeurs
2. **Collecter feedback** : Via système de feedback intégré
3. **Corriger bugs** : Déployer les fixes sur staging
4. **Valider** : Quand tout est stable
5. **Déployer en production** : Utiliser le même process sur le domaine principal

---

**Bon déploiement ! 🎉**
