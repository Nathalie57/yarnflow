# Guide de Déploiement YarnFlow

**Version** : 0.16.1
**Dernière mise à jour** : 2025-12-22

---

## 🎯 Déploiement en un coup d'œil

### ⚡ STAGING
```bash
./deploy-staging.sh
```

### 🚀 PRODUCTION
```bash
./deploy-prod.sh
```

---

## 📋 Pré-requis

### Vérifier les variables d'environnement

**AVANT chaque déploiement**, valider les fichiers `.env` :

```bash
cd frontend
npm run validate:env
```

✅ Toutes les variables doivent être présentes (pas de `VOTRE_...` ou `TODO`)

---

## 🏗️ Processus de déploiement complet

### ÉTAPE 1 : Développement et tests locaux

```bash
# Développer en local
cd frontend
npm run dev

# Tester les changements
```

### ÉTAPE 2 : Déployer sur STAGING

```bash
# Vérifier qu'on est sur la branche staging
git checkout staging

# Committer les changements
git add .
git commit -m "feat: description"

# Pousser sur GitHub
git push origin staging

# Builder et préparer le déploiement
./deploy-staging.sh

# Uploader le contenu de frontend/dist/ sur staging.yarnflow.fr
# Via FTP, cPanel File Manager, ou SCP :
scp -r frontend/dist/* najo1022@staging.yarnflow.fr:~/staging.yarnflow.fr/
```

### ÉTAPE 3 : Tester sur STAGING

- ✅ Ouvrir https://staging.yarnflow.fr
- ✅ Tester TOUTES les fonctionnalités modifiées
- ✅ Vérifier les images, tags, API, etc.
- ✅ Tester sur mobile/PWA

### ÉTAPE 4 : Merger vers MAIN (production)

```bash
# Se placer sur main
git checkout main

# Merger staging dans main
git merge staging

# Pousser sur GitHub
git push origin main
```

### ÉTAPE 5 : Déployer en PRODUCTION

```bash
# Builder et préparer le déploiement (avec confirmation)
./deploy-prod.sh

# Uploader le contenu de frontend/dist/ sur yarnflow.fr
scp -r frontend/dist/* najo1022@yarnflow.fr:~/yarnflow.fr/

# ⚠️ NE PAS écraser backend/public/uploads/ !
```

### ÉTAPE 6 : Vider le cache utilisateurs

Après déploiement en prod, informer les utilisateurs de vider leur cache PWA :
- Ctrl+Shift+R (hard refresh)
- Ou vider cache navigateur

---

## 📁 Fichiers d'environnement

### `.env` (local - défaut)
```bash
VITE_API_URL=http://patron-maker.local/api
VITE_BACKEND_URL=http://patron-maker.local/api
VITE_ENV=development
```

### `.env.staging`
```bash
VITE_API_URL=https://staging.yarnflow.fr/api
VITE_BACKEND_URL=https://staging.yarnflow.fr/api
VITE_FRONTEND_URL=https://staging.yarnflow.fr
VITE_ENV=staging
```

### `.env.production`
```bash
VITE_API_URL=https://yarnflow.fr/api
VITE_BACKEND_URL=https://yarnflow.fr/api
VITE_FRONTEND_URL=https://yarnflow.fr
VITE_ENV=production
VITE_APP_DEBUG=false
```

---

## 🔧 Variables d'environnement requises

### ✅ OBLIGATOIRES (toujours)
- `VITE_API_URL` - URL de l'API backend
- `VITE_BACKEND_URL` - URL du backend (pour images, uploads)
- `VITE_ENV` - Environnement (development/staging/production)

### 📌 RECOMMANDÉES
- `VITE_FRONTEND_URL` - URL du frontend
- `VITE_STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe
- `VITE_APP_ENV` - Environnement applicatif
- `VITE_APP_DEBUG` - Mode debug (true/false)

---

## ⚠️ Problèmes courants et solutions

### Images ne se chargent pas après déploiement

**Cause** : `VITE_BACKEND_URL` manquant dans le `.env`

**Solution** :
1. Vérifier `.env.production` ou `.env.staging`
2. Ajouter `VITE_BACKEND_URL=https://yarnflow.fr/api`
3. Rebuilder : `npm run build:prod`
4. Redéployer le build

### Build dans le mauvais environnement

**Cause** : Mauvaise commande ou mauvais fichier `.env`

**Solution** :
- Staging : `npm run build:staging` (utilise `.env.staging`)
- Production : `npm run build:prod` (utilise `.env.production`)

### Ancienne version en cache (PWA)

**Cause** : Service Worker en cache

**Solution** :
1. F12 → Application → Service Workers → Unregister
2. Clear storage → Clear site data
3. Ctrl+Shift+R (hard refresh)

### Déployé au mauvais endroit

**Symptôme** : Changements visibles sur staging mais pas prod (ou inverse)

**Solution** :
- Staging : `~/staging.yarnflow.fr/`
- Production : `~/yarnflow.fr/`

---

## 🛠️ Commandes utiles

### Validation
```bash
cd frontend
npm run validate:env        # Valider tous les .env
```

### Build
```bash
npm run build              # Build avec .env (local)
npm run build:staging      # Build staging
npm run build:prod         # Build production
```

### Déploiement
```bash
./deploy-staging.sh        # Script complet staging
./deploy-prod.sh           # Script complet production
```

---

## 📝 Checklist avant déploiement PROD

- [ ] Testé sur staging
- [ ] Toutes les fonctionnalités OK
- [ ] Images chargent correctement
- [ ] Tags fonctionnent (ajout/suppression)
- [ ] API répond correctement
- [ ] Sur branche `main`
- [ ] Variables `.env.production` validées
- [ ] Build généré avec `npm run build:prod`
- [ ] Migrations BDD appliquées si nécessaire
- [ ] Backup récent de la BDD prod

---

## 🆘 En cas de problème

1. **Vérifier les logs backend** : `~/logs/error_log`
2. **Vérifier la console navigateur** : F12 → Console
3. **Vérifier les requêtes réseau** : F12 → Network
4. **Revenir à la version précédente** : Redéployer le dernier build stable
5. **Contacter le support** : [email/contact]

---

**Créé le** : 2025-12-22
**Auteur** : Nathalie + Claude
**Projet** : YarnFlow v0.16.1
