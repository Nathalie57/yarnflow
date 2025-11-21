# 🚀 LANCEMENT RAPIDE - YarnFlow Waitlist

## ⏱️ Timeline : 2-3 heures

Ce guide te permet de lancer ta waitlist en **2-3 heures chrono**.

---

## 📋 ÉTAPE 1 : Remplir les infos légales (30 min)

### 1.1 Infos à préparer
Ouvre un fichier texte et note :
```
NOM/SOCIÉTÉ : _________________
STATUT JURIDIQUE : _____________ (Auto-entrepreneur / SARL / etc.)
SIRET : _______________________
TVA INTRACOMMUNAUTAIRE : _______
ADRESSE COMPLÈTE : _____________
EMAIL CONTACT : ________________
TÉLÉPHONE (optionnel) : ________
```

### 1.2 Remplacer dans les pages légales
Ouvrir ces 3 fichiers et faire **Ctrl+H** :
- `frontend/src/pages/CGU.jsx`
- `frontend/src/pages/Privacy.jsx`
- `frontend/src/pages/Mentions.jsx`

**Remplacer** :
- `[Votre Nom/Société]` → Ton nom/société
- `[votre-email@domaine.com]` → Ton email
- `[Adresse]` → Ton adresse
- `[SIRET]` → Ton SIRET
- `[Numéro TVA]` → Ta TVA
- `[Nom du responsable légal]` → Ton nom

---

## 🔧 ÉTAPE 2 : Créer comptes hébergement (20 min)

### 2.1 GitHub
1. Aller sur https://github.com/signup
2. Créer compte (gratuit)
3. Créer nouveau repo "yarnflow" (public ou privé)

### 2.2 Vercel (Frontend)
1. Aller sur https://vercel.com/signup
2. **Sign up with GitHub**
3. ✅ Compte créé

### 2.3 Railway (Backend + DB)
1. Aller sur https://railway.app
2. **Login with GitHub**
3. ✅ Compte créé (5$ offerts)

---

## 📤 ÉTAPE 3 : Push sur GitHub (10 min)

```bash
cd /mnt/d/wamp64/www/pattern-maker

# Init Git
git init
git add .
git commit -m "YarnFlow v0.12.0 - Waitlist ready"

# Lier au repo GitHub (remplacer TON-USERNAME)
git remote add origin https://github.com/TON-USERNAME/yarnflow.git
git branch -M main
git push -u origin main
```

✅ Code sur GitHub

---

## 🗄️ ÉTAPE 4 : Déployer Database Railway (15 min)

### 4.1 Créer MySQL
1. Aller sur https://railway.app/dashboard
2. Cliquer **New Project**
3. Sélectionner **Provision MySQL**
4. Attendre 30 secondes → Base créée ✅

### 4.2 Récupérer credentials
1. Cliquer sur service MySQL
2. Aller dans onglet **Variables**
3. Noter :
   ```
   MYSQLHOST=_________________
   MYSQLPORT=_________________
   MYSQLDATABASE=_____________
   MYSQLUSER=_________________
   MYSQLPASSWORD=_____________
   ```

### 4.3 Importer schemas
```bash
# Remplacer XXX par tes credentials Railway
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p MYSQLDATABASE < database/schema.sql
# Enter password: [copier MYSQLPASSWORD]

# Importer les autres schemas
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p MYSQLDATABASE < database/add_projects_system.sql
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p MYSQLDATABASE < database/add_knitting_types.sql
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p MYSQLDATABASE < database/add_parent_photo_id.sql
```

✅ Database prête

---

## 🖥️ ÉTAPE 5 : Déployer Backend Railway (15 min)

### 5.1 Créer service backend
1. Dans Railway, cliquer **New** → **GitHub Repo**
2. Sélectionner repo `yarnflow`
3. Cliquer **Deploy**

### 5.2 Configurer
1. Aller dans **Settings**
2. **Root Directory** : `backend`
3. **Start Command** : `cd public && php -S 0.0.0.0:$PORT`

### 5.3 Générer JWT Secret
```bash
cd /mnt/d/wamp64/www/pattern-maker
bash scripts/generate-jwt-secret.sh
# Copier la clé générée
```

### 5.4 Variables d'environnement
Dans Railway, onglet **Variables**, ajouter :

```bash
# Database (copier depuis MySQL service - Variables > Reference)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_CHARSET=utf8mb4

# App
APP_ENV=production
APP_DEBUG=false
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://yarnflow.vercel.app

# JWT (COLLER LA CLÉ GÉNÉRÉE)
JWT_SECRET=TA_CLE_GENEREE_ICI
JWT_EXPIRATION=604800

# Gemini (ta clé API)
GEMINI_API_KEY=ta_cle_gemini
GEMINI_MODEL=gemini-2.0-flash-exp

# Stripe TEST (ok pour waitlist)
STRIPE_SECRET_KEY=sk_test_ta_cle
STRIPE_PUBLISHABLE_KEY=pk_test_ta_cle
STRIPE_WEBHOOK_SECRET=whsec_ta_cle
```

### 5.5 Générer domaine public
1. **Settings** → **Networking**
2. **Generate Domain**
3. Noter l'URL : `https://yarnflow-backend-production.up.railway.app`

✅ Backend déployé

---

## 🌐 ÉTAPE 6 : Déployer Frontend Vercel (15 min)

### 6.1 Import projet
1. Aller sur https://vercel.com/dashboard
2. Cliquer **Add New** → **Project**
3. **Import Git Repository** → Sélectionner `yarnflow`

### 6.2 Configurer
- **Framework Preset** : Vite
- **Root Directory** : `frontend`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

### 6.3 Variables d'environnement
Avant de deploy, ajouter :
```
VITE_API_URL = https://ton-backend.railway.app/api
```
⚠️ Remplacer par l'URL Railway générée étape 5.5

### 6.4 Deploy
Cliquer **Deploy** → Attendre 2 min

✅ Frontend déployé : `https://yarnflow.vercel.app`

---

## ✅ ÉTAPE 7 : Test final (10 min)

### 7.1 Tester landing
1. Ouvrir `https://yarnflow.vercel.app`
2. Vérifier design OK
3. Vérifier pages légales (`/cgu`, `/privacy`, `/mentions`)

### 7.2 Tester waitlist
1. S'inscrire avec ton email
2. Vérifier message de succès
3. Vérifier dans Railway Database :
   ```bash
   mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -p
   use MYSQLDATABASE;
   SELECT * FROM waitlist_subscribers;
   ```
   → Ton email doit apparaître ✅

### 7.3 Tester mobile
1. Ouvrir sur smartphone
2. Vérifier responsive OK

---

## 🎯 ÉTAPE 8 : Domaine perso (Optionnel - 30 min)

### Si tu veux `yarnflow.com` au lieu de `yarnflow.vercel.app` :

1. **Acheter domaine** (OVH, Namecheap, Google Domains - ~10€/an)
2. **Dans Vercel** :
   - Settings → Domains
   - Add `yarnflow.com`
   - Add `www.yarnflow.com`
3. **Configurer DNS** (Vercel donne instructions)
4. **Attendre propagation** (5-30 min)

✅ Domaine custom actif

---

## 📊 ÉTAPE 9 : Analytics (Optionnel - 15 min)

### Option Plausible (Recommandé)
1. Signup : https://plausible.io (trial 30 jours gratuit)
2. Add site : `yarnflow.com`
3. Copier script fourni
4. Décommenter dans `frontend/index.html` ligne 30
5. Push sur GitHub → Vercel redéploie auto

### Option Google Analytics (Gratuit)
Voir `frontend/ANALYTICS.md`

---

## 🚀 ÉTAPE 10 : LANCEMENT ! (30 min)

### Posts réseaux sociaux

**Twitter/X** :
```
🧶 YarnFlow - Le tracker ultime pour tricot & crochet

✅ Stats avancées (vitesse, temps, progression)
✅ AI Photo Studio (backgrounds pros en 1 clic)
✅ Bibliothèque de patrons centralisée

Rejoins la waitlist : https://yarnflow.com

#tricot #crochet #knitting #YarnFlow
```

**Reddit** (r/crochet, r/knitting, r/SideProject) :
```
Salut ! J'ai créé YarnFlow, un tracker de projets tricot/crochet

C'est comme Strava mais pour le tricot :
- Compteur de rangs/tours + timer
- Stats avancées (vitesse, temps total, graphiques)
- AI Photo Studio pour générer des photos pros
- Bibliothèque de patrons

Lancement early access bientôt, vous pouvez rejoindre la waitlist : https://yarnflow.com

Feedback bienvenu ! 🧶
```

**LinkedIn** :
```
🚀 Lancement de YarnFlow - SaaS B2C pour passionnés de tricot & crochet

Stack : React + PHP + MySQL + Google Gemini AI

Features :
• Tracker projets avec stats temps réel
• Génération photos IA pour créateurs Etsy
• Pricing : FREE (3 projets) / PRO (4.99€/mois)

Waitlist ouverte 👉 https://yarnflow.com

#SaaS #Entrepreneuriat #AI
```

---

## 🎉 TERMINÉ !

**Checklist finale** :
- ✅ Landing page en ligne
- ✅ Backend API fonctionnel
- ✅ Database configurée
- ✅ Waitlist fonctionne
- ✅ Pages légales OK
- ✅ Posts réseaux publiés

**Objectif Semaine 1** : 100 emails waitlist 🎯

**Next steps** :
- Répondre aux questions/feedback
- Préparer BETA fermée (20-50 testeurs)
- Monitorer inscriptions quotidiennement

---

**Besoin d'aide ?** Voir `CHECKLIST-LANCEMENT.md` et `DEPLOIEMENT.md`

**Bon lancement ! 🚀🧶**
