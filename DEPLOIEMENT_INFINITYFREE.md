# 🚀 Guide Déploiement InfinityFree - YarnFlow Waitlist

## 📋 Étapes de déploiement

### 1️⃣ Préparer les fichiers localement

```bash
cd /mnt/d/wamp64/www/pattern-maker/backend

# Installer les dépendances composer (si pas déjà fait)
composer install --no-dev --optimize-autoloader
```

### 2️⃣ Uploader les fichiers sur InfinityFree

**Via le File Manager d'InfinityFree (ou FTP) :**

Uploader **TOUT** le contenu du dossier `backend/` dans `htdocs/` :

```
htdocs/
├── public/           # Contenu à mettre dans htdocs/
│   ├── index.php
│   ├── health.php
│   ├── .htaccess
├── config/           # Créer ce dossier
│   └── .env          # À CRÉER (voir étape 3)
├── vendor/           # UPLOADER TOUT LE DOSSIER
├── controllers/
├── models/
├── services/
├── routes/
└── utils/
```

**⚠️ IMPORTANT :** Le dossier `htdocs/` sur InfinityFree doit contenir :
- `htdocs/public/` → tout ce qui était dans `backend/public/`
- `htdocs/config/` → créer et mettre le `.env`
- `htdocs/vendor/` → uploader depuis local
- `htdocs/controllers/`, `models/`, etc. → tous les dossiers backend

### 3️⃣ Créer le fichier .env sur InfinityFree

**Dans `htdocs/config/.env` :**

```ini
# Database MySQL InfinityFree
# ⚠️ REMPLACER par tes vraies credentials InfinityFree !
DB_HOST=sqlXXX.infinityfreeapp.com
DB_PORT=3306
DB_NAME=if0_XXXXXXXX_yarnflow
DB_USER=if0_XXXXXXXX
DB_PASSWORD=TON_MOT_DE_PASSE_DB
DB_CHARSET=utf8mb4

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yarnflow.infinityfreeapp.com
FRONTEND_URL=https://yarnflow.vercel.app

# JWT - Utiliser la clé sécurisée
JWT_SECRET=6xbNgFk7gSr8d9KllnebhrCFLzLHuI2OChlXwxMvaW4=
JWT_EXPIRATION=604800

# Stripe TEST (pour waitlist, pas besoin en prod)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder

# Gemini AI (optionnel pour waitlist)
GEMINI_API_KEY=placeholder
GEMINI_MODEL=gemini-2.0-flash-exp

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=placeholder@gmail.com
SMTP_PASSWORD=placeholder

# Limites
MAX_PROJECTS_FREE=3
```

### 4️⃣ Récupérer tes credentials InfinityFree

**Sur ton compte InfinityFree :**

1. Va dans **MySQL Databases**
2. Note ces infos :
   - `DB_HOST` : par exemple `sql304.infinityfreeapp.com`
   - `DB_NAME` : par exemple `if0_37654321_yarnflow`
   - `DB_USER` : par exemple `if0_37654321`
   - `DB_PASSWORD` : le mot de passe que tu as créé

3. Remplace dans le fichier `.env` que tu as créé

### 5️⃣ Importer la base de données

**Via phpMyAdmin sur InfinityFree :**

1. Sélectionne ta database
2. Importe dans l'ordre :
   ```
   schema.sql
   add_waitlist.sql
   ```

3. **Optionnel** (si tu veux les features complètes) :
   ```
   add_projects_system_notriggers.sql
   add_ai_photo_studio_notriggers.sql
   ```

### 6️⃣ Tester le déploiement

**Test 1 - Health check simple :**
```
https://yarnflow.infinityfreeapp.com/public/health.php
```

Devrait retourner :
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-21 10:30:00",
  "php_version": "8.x",
  "server": "LiteSpeed"
}
```

**Test 2 - API via routing :**
```
https://yarnflow.infinityfreeapp.com/public/index.php
```

**Test 3 - Waitlist count :**
```
https://yarnflow.infinityfreeapp.com/api/waitlist/count
```

### 7️⃣ Problèmes courants

#### ❌ Erreur 500
**Cause :** Fichier .env manquant ou mauvaise config database
**Solution :** Vérifier que `htdocs/config/.env` existe avec les bonnes credentials

#### ❌ "No such file or directory" vendor/autoload.php
**Cause :** Dossier vendor/ pas uploadé
**Solution :** Uploader tout le dossier `vendor/` depuis ton local

#### ❌ Class not found
**Cause :** Autoloader pas chargé
**Solution :** Vérifier que `vendor/autoload.php` existe et est accessible

#### ❌ CORS errors frontend
**Cause :** Headers CORS mal configurés
**Solution :** Vérifier que `public/.htaccess` contient :
```apache
Header set Access-Control-Allow-Origin "https://yarnflow.vercel.app"
```

### 8️⃣ Structure finale attendue sur InfinityFree

```
htdocs/
├── public/
│   ├── index.php          ← Point d'entrée API
│   ├── health.php         ← Diagnostic simple
│   └── .htaccess          ← Routing + CORS
├── config/
│   └── .env              ← CRÉER CE FICHIER !
├── vendor/               ← UPLOADER DEPUIS LOCAL
│   └── autoload.php
├── controllers/          ← Tous les controllers
├── models/              ← Tous les models
├── services/            ← Tous les services
├── routes/
│   └── api.php          ← Routes API
└── utils/               ← Utilitaires

```

---

## ✅ Checklist finale

- [ ] Dossier `vendor/` uploadé
- [ ] Fichier `config/.env` créé avec bonnes credentials
- [ ] Database importée (schema.sql + add_waitlist.sql)
- [ ] Test `https://yarnflow.infinityfreeapp.com/public/health.php` fonctionne
- [ ] Test `https://yarnflow.infinityfreeapp.com/api/waitlist/count` fonctionne
- [ ] CORS configuré dans `public/.htaccess`
- [ ] Frontend Vercel pointe vers la bonne URL backend

---

**Créé le 2025-11-21 pour déploiement YarnFlow Waitlist v0.13.0**
