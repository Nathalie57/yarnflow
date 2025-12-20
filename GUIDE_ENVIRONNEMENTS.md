# Guide des Environnements - YarnFlow

## 📋 Vue d'ensemble

YarnFlow supporte 3 environnements avec des configurations séparées :
- **Development** : Développement local (`http://patron-maker.local`)
- **Staging** : Tests pré-production (`https://staging.yarnflow.fr`)
- **Production** : Site en ligne (`https://yarnflow.fr`)

---

## 🗂️ Fichiers de configuration

### `.env.development` - Développement local
```env
VITE_API_URL=http://patron-maker.local/api
VITE_BACKEND_URL=http://patron-maker.local/api
VITE_ENV=development
```

### `.env.staging` - Environnement de staging
```env
VITE_API_URL=https://staging.yarnflow.fr/api
VITE_BACKEND_URL=https://staging.yarnflow.fr/api
VITE_ENV=staging
```

### `.env.production` - Environnement de production
```env
VITE_API_URL=https://yarnflow.fr/api
VITE_BACKEND_URL=https://yarnflow.fr/api
VITE_ENV=production
```

---

## 🚀 Commandes de build

### Développement local
```bash
npm run dev
# Utilise automatiquement .env.development
# Accessible sur http://localhost:5173
```

### Build pour STAGING
```bash
./build-staging.sh
# OU
npm run build -- --mode staging

# Génère dist/ avec les URLs de staging
# À uploader sur staging.yarnflow.fr
```

### Build pour PRODUCTION
```bash
./build-production.sh
# OU
npm run build

# Génère dist/ avec les URLs de production
# À uploader sur yarnflow.fr
```

---

## ✅ Vérifications après build

### Vérifier les URLs dans le build
```bash
# Compter les URLs staging
grep -o "https://staging.yarnflow.fr/api" dist/assets/*.js | wc -l

# Compter les URLs production
grep -o "https://yarnflow.fr/api" dist/assets/*.js | wc -l
```

**Build staging correct** : ~25 URLs staging, 0 URL production
**Build production correct** : 0 URL staging, ~25 URLs production

---

## ⚠️ IMPORTANT : Ne JAMAIS commit

Ces fichiers ne doivent **JAMAIS** être committés :
- `.env.local`
- `.env.*.local`
- `dist/`

Ces fichiers **DOIVENT** être committés :
- `.env.development`
- `.env.staging`
- `.env.production`
- `.env.example`

---

## 🔧 Déploiement

### Staging (O2switch)
1. `./build-staging.sh`
2. Upload `dist/*` vers `/home/najo1022/staging.yarnflow.fr/`
3. Tester sur https://staging.yarnflow.fr

### Production (O2switch)
1. `./build-production.sh`
2. Upload `dist/*` vers `/home/najo1022/www/` (ou domaine principal)
3. Tester sur https://yarnflow.fr

---

## 🐛 Troubleshooting

### "Ça pointe toujours vers production/staging"
1. Vérifier que vous avez bien rebuilder **après** avoir modifié les .env
2. Vider le cache : `rm -rf dist && npm run build -- --mode staging`
3. Vérifier les URLs dans le build (commandes ci-dessus)
4. Re-uploader **tout le dossier** dist/

### "CORS errors"
- Vérifier que l'API backend a bien les headers CORS configurés
- Vérifier que l'URL dans .env correspond au serveur backend

---

**Version** : v0.16.0
**Date** : 2025-12-20
