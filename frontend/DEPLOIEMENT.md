# 🚀 Guide Déploiement YarnFlow - Option 1 (Waitlist)

## 📋 Prérequis
- Compte GitHub (gratuit)
- Compte Vercel (gratuit)
- Compte Railway (gratuit - $5 crédit offert)
- Nom de domaine (optionnel mais recommandé - ~10€/an)

---

## 🎯 FRONTEND - Vercel (Gratuit)

### 1. Préparer le Repository GitHub

```bash
# Créer un repo GitHub
git init
git add .
git commit -m "Initial commit - YarnFlow v0.12.0"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/yarnflow.git
git push -u origin main
```

### 2. Déployer sur Vercel

1. **Se connecter à Vercel** : https://vercel.com/signup
2. **Import Git Repository** : Sélectionner votre repo GitHub
3. **Configure Project** :
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables** (dans Vercel Dashboard) :
   ```
   VITE_API_URL = https://VOTRE-BACKEND.railway.app/api
   ```
   ⚠️ Remplacer par votre URL Railway (voir section backend)

5. **Deploy** : Cliquer "Deploy" ✅

### 3. Domaine personnalisé (optionnel)

**Option A - Sous-domaine Vercel (gratuit) :**
- URL : `yarnflow.vercel.app`
- Déjà configuré, rien à faire

**Option B - Domaine perso (recommandé - ~10€/an) :**
1. Acheter domaine sur OVH/Namecheap/Google Domains
2. Dans Vercel : `Settings > Domains`
3. Ajouter `yarnflow.com` + `www.yarnflow.com`
4. Configurer DNS (Vercel donne instructions)

---

## 🗄️ BACKEND - Railway (Gratuit $5/mois)

### 1. Créer compte Railway

1. **Signup** : https://railway.app
2. **Login avec GitHub**

### 2. Déployer Database MySQL

1. **New Project** → **Provision MySQL**
2. Récupérer les credentials :
   - Host
   - Port
   - Database
   - Username
   - Password
   - Connection URL

### 3. Déployer Backend PHP

1. **Add Service** → **GitHub Repo** → Sélectionner `yarnflow`
2. **Settings** :
   - Root Directory: `backend`
   - Start Command: `php -S 0.0.0.0:$PORT -t public`

3. **Environment Variables** (Variables tab) :

```bash
# Database (copier depuis MySQL service)
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6379
DB_NAME=railway
DB_USER=root
DB_PASSWORD=xxxxx
DB_CHARSET=utf8mb4

# App
APP_ENV=production
APP_DEBUG=false
APP_URL=https://VOTRE-APP.railway.app
FRONTEND_URL=https://yarnflow.vercel.app

# JWT (CHANGER ABSOLUMENT!)
JWT_SECRET=GENERER_CLE_SECURISEE_32_CARACTERES
JWT_EXPIRATION=604800

# Stripe (TEST pour waitlist)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET

# Gemini AI
GEMINI_API_KEY=VOTRE_CLE_GEMINI
GEMINI_MODEL=gemini-2.0-flash-exp
AI_PROVIDER=claude

# SMTP (optionnel pour waitlist)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASSWORD=app_password
SMTP_FROM_EMAIL=noreply@yarnflow.com
SMTP_FROM_NAME=YarnFlow
```

4. **Deploy** : Railway déploie automatiquement

### 4. Importer Database Schema

```bash
# Récupérer Railway MySQL connection string
mysql -h containers-us-west-xxx.railway.app -u root -p railway < database/schema.sql
mysql -h containers-us-west-xxx.railway.app -u root -p railway < database/add_projects_system.sql
mysql -h containers-us-west-xxx.railway.app -u root -p railway < database/add_knitting_types.sql
mysql -h containers-us-west-xxx.railway.app -u root -p railway < database/add_parent_photo_id.sql
```

### 5. Récupérer URL Backend

- Railway génère URL type : `https://yarnflow-backend.railway.app`
- Copier cette URL

### 6. Mettre à jour Vercel

1. Retour dans Vercel Dashboard
2. `Settings > Environment Variables`
3. Modifier `VITE_API_URL` avec l'URL Railway

---

## ✅ VÉRIFICATION

### Frontend (Vercel)
- ✅ Landing page accessible : `https://yarnflow.vercel.app`
- ✅ Formulaire waitlist visible
- ✅ Pages légales accessibles (`/cgu`, `/privacy`, `/mentions`)

### Backend (Railway)
- ✅ API accessible : `https://VOTRE-BACKEND.railway.app/api/health`
- ✅ Database connectée
- ✅ Inscription waitlist fonctionne

### Test Complet
1. Ouvrir landing page
2. S'inscrire à la waitlist
3. Vérifier dans Database Railway que l'email est bien enregistré

---

## 🔐 SÉCURITÉ PRODUCTION

### À FAIRE ABSOLUMENT :

1. **Générer JWT Secret sécurisé** :
```bash
openssl rand -base64 32
```
Copier dans `JWT_SECRET` Railway

2. **CORS Backend** :
Vérifier que `backend/public/index.php` autorise UNIQUEMENT votre domaine Vercel

3. **Rate Limiting** :
Activer rate limiting sur API (à implémenter si trafic élevé)

---

## 💰 COÛTS ESTIMÉS

| Service | Plan | Coût |
|---------|------|------|
| **Vercel** | Hobby (gratuit) | 0€/mois |
| **Railway** | Trial (5$ offerts) | 0€/mois (puis ~5-10€) |
| **Domaine** | OVH/Namecheap | ~10€/an |
| **Gemini API** | Pay-as-you-go | ~0-5€/mois (waitlist) |
| **TOTAL Mois 1** | | **~1€** |

---

## 📊 ANALYTICS WAITLIST

### Option 1 : Plausible (Recommandé - RGPD)
1. Signup : https://plausible.io (9€/mois après trial)
2. Ajouter script dans `frontend/index.html`
3. Dashboard : trafic, conversions waitlist

### Option 2 : Google Analytics (Gratuit mais cookies)
1. Créer propriété GA4
2. Installer `react-ga4`
3. Tracking events waitlist

---

## 🚨 TROUBLESHOOTING

### Erreur CORS
- Vérifier `APP_URL` et `FRONTEND_URL` dans Railway
- Vérifier headers dans `backend/public/index.php`

### Database connection failed
- Vérifier credentials MySQL Railway
- Tester connection depuis Railway CLI

### Build failed Vercel
- Vérifier `package.json` dans `frontend/`
- Logs détaillés dans Vercel Dashboard

---

## 📞 SUPPORT

**Questions ?** Contactez [votre-email@domaine.com]

**Docs** :
- Vercel : https://vercel.com/docs
- Railway : https://docs.railway.app
- YarnFlow : `docs/` dans ce repo
