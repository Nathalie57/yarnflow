# ✅ CHECKLIST LANCEMENT GRATUIT (0€)

**Durée totale : 1-2 heures**

---

## 📝 AVANT DE COMMENCER (10 min)

### Infos à préparer
- [ ] Nom/Société : `__________________`
- [ ] SIRET : `__________________`
- [ ] Email contact : `__________________`
- [ ] Clé API Gemini : `__________________`

### Comptes à créer (gratuits)
- [ ] GitHub : https://github.com/signup
- [ ] Vercel : https://vercel.com/signup (avec GitHub)
- [ ] InfinityFree : https://infinityfree.com/signup

---

## 🔧 ÉTAPE 1 : Préparer le Code (20 min)

### Pages légales
- [ ] Ouvrir `frontend/src/pages/CGU.jsx`
- [ ] Remplacer `[Votre Nom/Société]` par ton nom
- [ ] Remplacer `[votre-email@domaine.com]` par ton email
- [ ] Répéter pour `Privacy.jsx` et `Mentions.jsx`

### Générer JWT Secret
```bash
cd /mnt/d/wamp64/www/pattern-maker
openssl rand -base64 32
```
- [ ] Noter la clé générée : `6xbNgFk7gSr8d9KllnebhrCFLzLHuI2OChlXwxMvaW4=`

---

## 📤 ÉTAPE 2 : GitHub (10 min)

```bash
cd /mnt/d/wamp64/www/pattern-maker
git init
git add .
git commit -m "YarnFlow v0.12.0 - Ready for launch"
```

- [ ] Créer repo sur GitHub (public ou privé)
- [ ] Copier URL : `https://github.com/TON-USERNAME/yarnflow.git`

```bash
git remote add origin https://github.com/TON-USERNAME/yarnflow.git
git branch -M main
git push -u origin main
```

- [ ] Code sur GitHub ✅

---

## 🌐 ÉTAPE 3 : Vercel - Frontend (15 min)

1. [ ] Aller sur https://vercel.com/dashboard
2. [ ] **Import Git Repository**
3. [ ] Sélectionner repo `yarnflow`
4. [ ] Configuration :
   - Framework : **Vite**
   - Root Directory : **`frontend`**
   - Build Command : `npm run build`
   - Output Directory : `dist`
5. [ ] Cliquer **Deploy** (NE PAS ajouter de variables maintenant)
6. [ ] Attendre 2 min
7. [ ] Noter URL : `https://________________.vercel.app`

---

## 🖥️ ÉTAPE 4 : InfinityFree - Backend (40 min)

### 4.1 Créer compte
- [ ] Signup sur https://infinityfree.com/signup
- [ ] Vérifier email

### 4.2 Créer site
- [ ] **Create Account**
- [ ] Subdomain : `yarnflow` → `yarnflow.infinityfreeapp.com`
- [ ] Password FTP : `__________________`
- [ ] Attendre 5-10 min → Compte actif ✅

### 4.3 Credentials FTP
Dans Control Panel, noter :
- [ ] FTP Host : `__________________`
- [ ] FTP Username : `__________________`
- [ ] FTP Password : `__________________`

### 4.4 Database MySQL
- [ ] Control Panel → **MySQL Databases** → **Create**
- [ ] Noter credentials :
  - DB Name : `__________________`
  - Username : `__________________`
  - Password : `__________________`
  - Hostname : `__________________`

### 4.5 Importer Database
- [ ] Control Panel → **phpMyAdmin**
- [ ] Login
- [ ] Sélectionner la database
- [ ] Import → `database/schema.sql`
- [ ] Import → `database/add_projects_system.sql`
- [ ] Import → `database/add_knitting_types.sql`
- [ ] Import → `database/add_parent_photo_id.sql`
- [ ] Database prête ✅

### 4.6 Upload Backend (FileZilla)
- [ ] Télécharger FileZilla : https://filezilla-project.org
- [ ] Se connecter avec credentials FTP
- [ ] Naviguer vers `htdocs/`
- [ ] Uploader TOUT le contenu de `backend/` :
  - [ ] `config/`
  - [ ] `controllers/`
  - [ ] `models/`
  - [ ] `services/`
  - [ ] `utils/`
  - [ ] `vendor/`
  - [ ] `public/`
  - [ ] `.htaccess` (racine)
  - [ ] `composer.json`

### 4.7 Créer .env sur serveur
Créer fichier local `/backend/.env` avec :

```bash
DB_HOST=sqlxxx.infinityfreeapp.com  # Ton hostname DB
DB_PORT=3306
DB_NAME=if0_xxxxxxxx_yarnflow       # Ton DB name
DB_USER=if0_xxxxxxxx                 # Ton DB user
DB_PASSWORD=ton_mot_de_passe_db      # Ton DB password
DB_CHARSET=utf8mb4

APP_ENV=production
APP_DEBUG=false
APP_URL=https://yarnflow.infinityfreeapp.com
FRONTEND_URL=https://yarnflow.vercel.app

JWT_SECRET=TA_CLE_GENEREE_ETAPE1
JWT_EXPIRATION=604800

GEMINI_API_KEY=ta_cle_api_gemini
GEMINI_MODEL=gemini-2.0-flash-exp

STRIPE_SECRET_KEY=sk_test_ta_cle
STRIPE_PUBLISHABLE_KEY=pk_test_ta_cle
STRIPE_WEBHOOK_SECRET=whsec_ta_cle
```

- [ ] Remplacer TOUTES les valeurs
- [ ] Sauvegarder comme `.env`
- [ ] Uploader via FileZilla dans `htdocs/`

### 4.8 Vérifier .htaccess
- [ ] Vérifier que `backend/.htaccess` est bien uploadé dans `htdocs/`
- [ ] Vérifier que `backend/public/.htaccess` est bien uploadé dans `htdocs/public/`

---

## 🔗 ÉTAPE 5 : Connecter Frontend ↔ Backend (5 min)

- [ ] Aller sur https://vercel.com/dashboard
- [ ] Cliquer sur projet `yarnflow`
- [ ] **Settings** → **Environment Variables**
- [ ] Ajouter :
  ```
  Name: VITE_API_URL
  Value: https://yarnflow.infinityfreeapp.com/api
  ```
- [ ] **Save**
- [ ] **Deployments** → Dernier deploy → **Redeploy**

---

## ✅ ÉTAPE 6 : Tests (10 min)

### Test Backend
- [ ] Ouvrir : `https://yarnflow.infinityfreeapp.com/api/health`
- [ ] Vérifier : `{"status":"ok"}` ou similaire

### Test Frontend
- [ ] Ouvrir : `https://yarnflow.vercel.app`
- [ ] Design OK ✅
- [ ] Pages légales accessibles :
  - [ ] `/cgu`
  - [ ] `/privacy`
  - [ ] `/mentions`

### Test Waitlist
- [ ] S'inscrire avec ton email
- [ ] Message succès ✅
- [ ] Vérifier dans phpMyAdmin InfinityFree :
  - [ ] Table `waitlist_subscribers` contient ton email

### Test Mobile
- [ ] Ouvrir sur smartphone
- [ ] Responsive OK ✅

---

## 🚀 ÉTAPE 7 : LANCEMENT ! (30 min)

### Préparer posts
- [ ] Twitter/X rédigé
- [ ] Reddit post rédigé (r/crochet, r/knitting, r/SideProject)
- [ ] LinkedIn post rédigé
- [ ] Instagram story préparée

### Publier
- [ ] Publier sur Twitter
- [ ] Publier sur Reddit
- [ ] Publier sur LinkedIn
- [ ] Partager sur Instagram/Facebook

### Notifier proches
- [ ] Email à amis/famille tricoteurs
- [ ] Message groupes Facebook tricot/crochet

---

## 🎉 TERMINÉ - 100% GRATUIT !

**URLs finales :**
- 🌐 Landing : `https://yarnflow.vercel.app`
- 🔌 API : `https://yarnflow.infinityfreeapp.com/api`

**Coût total : 0€**

---

## 📊 Suivi Jour 1

- [ ] Vérifier analytics (si configuré)
- [ ] Vérifier inscriptions (phpMyAdmin)
- [ ] Répondre aux commentaires/questions
- [ ] Noter feedback

**Objectif Semaine 1 : 100 emails waitlist** 🎯

---

## 🔄 Prochaines Étapes

### Si 50+ emails (1-2 semaines)
- [ ] Acheter domaine `yarnflow.com` (10€/an)
- [ ] Configurer sur Vercel

### Si 200+ emails (3-4 semaines)
- [ ] Migrer vers Railway (5-10€/mois)
- [ ] Activer analytics Plausible (9€/mois)
- [ ] Préparer BETA fermée

---

## 🆘 Si Problème

**Backend ne répond pas :**
1. Vérifier que compte InfinityFree est actif (10 min après création)
2. Vérifier `.htaccess` bien uploadés
3. Vérifier `.env` avec bons credentials

**CORS Error :**
1. Vérifier URL Vercel dans `backend/public/.htaccess`
2. Doit être EXACTEMENT `https://ton-url.vercel.app`

**Database connection failed :**
1. Vérifier credentials DB dans `.env`
2. Tester connexion depuis phpMyAdmin

---

**Support** : `DEPLOIEMENT-GRATUIT.md` (guide détaillé)

**Bon lancement ! 🚀🧶**
