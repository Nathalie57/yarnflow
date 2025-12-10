# Déploiement Propre O2Switch - YarnFlow

## 📋 Étapes de déploiement complet

### 1. Préparation locale

#### Frontend (React)
```bash
cd frontend
npm run build
```
Cela crée le dossier `frontend/dist/` avec tous les fichiers statiques

#### Backend (PHP)
Vérifier que ces fichiers existent :
- `backend/.env` (avec les credentials O2Switch)
- `backend/vendor/` (dossier Composer complet)
- Tous les dossiers : controllers/, models/, routes/, config/, services/, Middleware/

### 2. Suppression sur O2Switch

Via cPanel > Gestionnaire de fichiers :
1. **Supprimer TOUT** dans `/www/`
2. **Supprimer TOUT** dans `/www/api/` (si existe)

### 3. Upload Frontend

Dans `/www/` (racine web) :
```
Uploader TOUT le contenu de frontend/dist/ :
- index.html
- dossier assets/
- manifest.json
- tous les fichiers icons/
- service-worker.js (si existe)
```

**IMPORTANT** : Uploader les FICHIERS, pas le dossier dist lui-même

### 4. Upload Backend

Créer le dossier `/www/api/` puis uploader :

```
backend/
├── .env                    ← IMPORTANT (credentials O2Switch)
├── .htaccess
├── composer.json
├── composer.lock
├── Middleware/            ← Dossier complet
├── config/                ← Dossier complet
├── controllers/           ← Dossier complet
├── models/                ← Dossier complet
├── routes/                ← Dossier complet
├── services/              ← Dossier complet
├── public/                ← Dossier complet (avec index.php)
└── vendor/                ← DOSSIER COMPLET OBLIGATOIRE
```

**CRITIQUE** : Le dossier `vendor/` doit être uploadé complètement (peut prendre du temps, ~50MB)

### 5. Création de la base de données

Via cPanel > phpMyAdmin :

```sql
-- 1. Sélectionner la base najo1022_yarnflow

-- 2. Exécuter add_waitlist.sql
CREATE TABLE IF NOT EXISTS waitlist_emails (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    interests TEXT,
    source VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS waitlist_stats (
    id INT UNSIGNED PRIMARY KEY DEFAULT 1,
    total_subscribers INT UNSIGNED DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO waitlist_stats (id, total_subscribers) VALUES (1, 0);
```

### 6. Vérification du .env backend

Dans `/www/api/.env` :

```ini
# Base de données O2Switch
DB_HOST=localhost
DB_PORT=3306
DB_NAME=najo1022_yarnflow
DB_USER=najo1022_yarnflow_user
DB_PASSWORD=~*y*HYJ%hYKb
DB_CHARSET=utf8mb4

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yarnflow.fr
FRONTEND_URL=https://yarnflow.fr

# JWT
JWT_SECRET=493kqAIEt7d85QHy2vZ5ZClJzVAtlzbkp5h5uQJsO0s=
JWT_EXPIRATION=604800

# Gemini
GEMINI_API_KEY=AIzaSyAD1czoQ4IDaA20ykhK_GhMmkZh-KKJEJs
GEMINI_MODEL=gemini-2.5-flash-image-preview
GEMINI_SIMULATION_MODE=false
```

### 7. Tests de diagnostic (IMPORTANT)

Uploader aussi les fichiers de test dans `/www/api/public/` :
- `test-minimal.php`
- `test-autoload.php`
- `test-env.php`
- `test-db-connexion.php`

Puis tester **dans l'ordre** :

#### Test 1: PHP fonctionne
https://yarnflow.fr/api/public/test-minimal.php
- ✅ Doit afficher : "OK PHP fonctionne"
- ❌ Si page blanche → Problème de configuration PHP sur O2Switch

#### Test 2: vendor/autoload.php existe
https://yarnflow.fr/api/public/test-autoload.php
- ✅ Doit afficher : "Autoload chargé avec succès"
- ❌ Si erreur → Le dossier vendor/ n'est pas complet

#### Test 3: .env se charge
https://yarnflow.fr/api/public/test-env.php
- ✅ Doit afficher : ".env chargé avec succès" + variables DB
- ❌ Si erreur → Le fichier .env n'est pas au bon endroit

#### Test 4: Connexion DB
https://yarnflow.fr/api/public/test-db-connexion.php
- ✅ Doit afficher : "Connexion DB réussie" + liste des tables
- ❌ Si erreur → Problème de credentials DB dans le .env

#### Test 5: API Count
https://yarnflow.fr/api/waitlist/count
- ✅ Doit retourner : `{"success":true,"count":0}`
- ❌ Si erreur → Problème de routing ou de code

#### Test 6: Frontend
https://yarnflow.fr
- ✅ Doit afficher la landing page

#### Test 7: Inscription
Via le formulaire sur la landing page

### 8. Fichiers .htaccess

#### `/www/.htaccess` (frontend)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

#### `/www/api/.htaccess` (backend)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ public/index.php [QSA,L]
```

### 9. Permissions

Si nécessaire, via cPanel > Gestionnaire de fichiers :
- Dossiers : 755
- Fichiers : 644

### 10. Checklist finale

- [ ] Frontend uploadé dans `/www/`
- [ ] Backend uploadé dans `/www/api/`
- [ ] Dossier `vendor/` complet dans `/www/api/vendor/`
- [ ] Fichier `.env` dans `/www/api/.env`
- [ ] Tables `waitlist_emails` et `waitlist_stats` créées
- [ ] https://yarnflow.fr affiche la landing page
- [ ] https://yarnflow.fr/api/waitlist/count retourne du JSON
- [ ] Inscription via formulaire fonctionne

## 🚨 Erreurs communes

### Erreur 500
- Vérifier que `vendor/` existe
- Vérifier les credentials DB dans `.env`
- Vérifier que les tables existent

### Page blanche
- Vérifier que `vendor/` est complet
- Vérifier les permissions des fichiers

### CORS error
- Vérifier `FRONTEND_URL` dans le `.env` backend

## 📁 Structure finale sur O2Switch

```
/www/
├── .htaccess
├── index.html
├── manifest.json
├── assets/
│   ├── index-XXX.js
│   └── index-XXX.css
├── icons/
│   └── *.png
└── api/
    ├── .env                    ← Credentials
    ├── .htaccess
    ├── vendor/                 ← Dépendances PHP
    ├── public/
    │   └── index.php           ← Point d'entrée API
    ├── controllers/
    ├── models/
    ├── routes/
    ├── config/
    ├── services/
    └── Middleware/
```
