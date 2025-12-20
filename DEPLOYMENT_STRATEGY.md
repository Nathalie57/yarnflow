# Stratégie de déploiement Git - YarnFlow

**Version** : 1.0.0
**Date** : 2025-12-20

## 🎯 Vue d'ensemble

Deux environnements :
- **staging.yarnflow.fr** : Tests et validation avant production
- **yarnflow.fr** : Production (utilisateurs réels)

---

## 📋 Structure des branches

```
main (production)
  ↑
  |-- staging (pré-production)
        ↑
        |-- feature/nom-feature (développement)
        |-- fix/nom-bug (corrections)
```

### Branches principales

| Branche | Environnement | Protection | Description |
|---------|---------------|------------|-------------|
| `main` | **yarnflow.fr** | ✅ Protégée | Code production validé |
| `staging` | **staging.yarnflow.fr** | ⚠️ Semi-protégée | Tests avant prod |
| `feature/*` | Local | ❌ Libre | Nouvelles fonctionnalités |
| `fix/*` | Local | ❌ Libre | Corrections de bugs |

---

## 🔄 Workflow de développement

### 1. Développer une nouvelle feature

```bash
# Créer une branche depuis staging
git checkout staging
git pull origin staging
git checkout -b feature/nom-feature

# Travailler sur la feature
git add .
git commit -m "feat: description de la feature"
git push origin feature/nom-feature
```

### 2. Tester sur staging

```bash
# Merger dans staging
git checkout staging
git pull origin staging
git merge feature/nom-feature
git push origin staging

# Déployer sur staging.yarnflow.fr (voir section déploiement)
```

### 3. Déployer en production

```bash
# Une fois validé sur staging
git checkout main
git pull origin main
git merge staging
git tag -a v0.17.0 -m "Release v0.17.0: Description"
git push origin main --tags

# Déployer sur yarnflow.fr (voir section déploiement)
```

---

## 🚀 Déploiement automatique (recommandé)

### Option A : Git hooks sur le serveur

**Sur staging.yarnflow.fr :**

```bash
# SSH sur le serveur
ssh najo1022@staging.yarnflow.fr

# Initialiser le repo Git
cd /home/najo1022/staging.yarnflow.fr
git init
git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
git fetch
git checkout staging

# Créer un hook post-receive (optionnel)
# Permet de déclencher un build automatique après un git push
```

**Sur yarnflow.fr (production) :**

```bash
ssh najo1022@yarnflow.fr
cd /home/najo1022/yarnflow.fr
git init
git remote add origin https://github.com/VOTRE_USER/VOTRE_REPO.git
git fetch
git checkout main
```

### Option B : Script de déploiement local

Créer un script `deploy.sh` dans le projet :

```bash
#!/bin/bash
# Script de déploiement vers staging ou production

ENVIRONMENT=$1

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

if [ "$ENVIRONMENT" = "staging" ]; then
    SERVER="najo1022@staging.yarnflow.fr"
    REMOTE_PATH="/home/najo1022/staging.yarnflow.fr"
    BRANCH="staging"
    BACKEND_BUILD="./backend/build-staging.sh"
    FRONTEND_BUILD="./frontend/build-staging.sh"
elif [ "$ENVIRONMENT" = "production" ]; then
    SERVER="najo1022@yarnflow.fr"
    REMOTE_PATH="/home/najo1022/yarnflow.fr"
    BRANCH="main"
    BACKEND_BUILD="./backend/build-production.sh"
    FRONTEND_BUILD="./frontend/build-production.sh"
fi

echo "🚀 Déploiement vers $ENVIRONMENT..."
echo ""

# 1. Vérifier qu'on est sur la bonne branche
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "❌ Erreur : Vous devez être sur la branche $BRANCH"
    exit 1
fi

# 2. Vérifier qu'il n'y a pas de modifications non commitées
if ! git diff-index --quiet HEAD --; then
    echo "❌ Erreur : Vous avez des modifications non commitées"
    exit 1
fi

# 3. Build backend
echo "📦 Build backend..."
cd backend && ./build-${ENVIRONMENT}.sh && cd ..

# 4. Build frontend
echo "📦 Build frontend..."
cd frontend && npm run build:${ENVIRONMENT} && cd ..

# 5. Upload vers le serveur
echo "📤 Upload vers $SERVER..."

# Backend
rsync -avz --delete \
    backend/build-${ENVIRONMENT}/ \
    ${SERVER}:${REMOTE_PATH}/api/

# Frontend
rsync -avz --delete \
    frontend/dist/ \
    ${SERVER}:${REMOTE_PATH}/

echo ""
echo "✅ Déploiement terminé !"
echo "🌐 Vérifiez : https://${ENVIRONMENT}.yarnflow.fr"
```

---

## 📦 Scripts de build par environnement

### Backend

**backend/build-staging.sh** (existe déjà, améliorations à faire)
**backend/build-production.sh** (à créer)

```bash
#!/bin/bash
# Build backend pour PRODUCTION

echo "🚀 Préparation du backend pour PRODUCTION..."

BUILD_DIR="build-production"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Copier les fichiers
cp -r controllers models services config utils routes vendor $BUILD_DIR/
cp public/index.php public/.htaccess $BUILD_DIR/
mkdir -p $BUILD_DIR/public/uploads

# .env production (template)
cat > $BUILD_DIR/.env << 'ENVEOF'
# Configuration PRODUCTION
APP_ENV=prod
APP_DEBUG=false
APP_URL=https://yarnflow.fr/api

# Database
DB_HOST=localhost
DB_NAME=najo1022_yarnflow
DB_USER=najo1022_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_PROD
DB_CHARSET=utf8mb4

# JWT
JWT_SECRET=VOTRE_SECRET_JWT_PROD

# URLs
FRONTEND_URL=https://yarnflow.fr
BACKEND_URL=https://yarnflow.fr/api

# Stripe PRODUCTION
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET

# ... (autres variables)
ENVEOF

echo "✅ Build production terminé : $BUILD_DIR/"
```

### Frontend

**frontend/package.json** - Ajouter les scripts :

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production"
  }
}
```

**frontend/.env.staging** (existe déjà)
**frontend/.env.production** (à créer)

```env
VITE_API_URL=https://yarnflow.fr/api
VITE_FRONTEND_URL=https://yarnflow.fr
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE
VITE_APP_ENV=production
```

---

## 🔒 Configuration Git

### .gitignore (vérifier)

```gitignore
# Environnements
.env
.env.local
.env.production
backend/.env
frontend/.env

# Builds
backend/build-*/
frontend/dist/

# Uploads
backend/public/uploads/*
!backend/public/uploads/.gitkeep

# Dependencies
node_modules/
vendor/

# Logs
*.log
```

### Fichiers à versionner

✅ **À committer** :
- `.env.example`
- `.env.staging.example`
- Scripts de build
- Configuration de base

❌ **À NE PAS committer** :
- `.env` (contient les secrets réels)
- `build-*/` (généré)
- `dist/` (généré)
- `uploads/` (données utilisateurs)

---

## 📝 Convention de commits

```bash
# Types de commits
feat:     # Nouvelle fonctionnalité
fix:      # Correction de bug
refactor: # Refactoring sans changement fonctionnel
docs:     # Documentation
style:    # Formatage (pas de changement de code)
test:     # Ajout/modification de tests
chore:    # Tâches de maintenance

# Exemples
git commit -m "feat: add project tags system (v0.15.0)"
git commit -m "fix: database connection in test_register.php"
git commit -m "docs: update deployment strategy guide"
```

---

## 🎯 Checklist de déploiement

### Avant staging

- [ ] Code testé en local
- [ ] Tests unitaires passent
- [ ] Variables .env.staging configurées
- [ ] Migrations SQL préparées si nécessaire

### Avant production

- [ ] Validé sur staging pendant 24-48h
- [ ] Backup base de données production
- [ ] Variables .env.production configurées
- [ ] Tag de version créé (`v0.x.x`)
- [ ] Notes de version rédigées
- [ ] Migrations SQL testées sur staging

### Après déploiement

- [ ] Vérifier les logs d'erreur
- [ ] Tester les fonctionnalités critiques
- [ ] Vérifier Stripe webhooks
- [ ] Monitorer les performances

---

## 🆘 Rollback en cas de problème

### Sur staging

```bash
# Revenir au commit précédent
ssh najo1022@staging.yarnflow.fr
cd /home/najo1022/staging.yarnflow.fr
git reset --hard HEAD~1
# Rebuild si nécessaire
```

### Sur production

```bash
# Revenir au tag précédent
ssh najo1022@yarnflow.fr
cd /home/najo1022/yarnflow.fr
git checkout v0.16.0  # Version stable précédente
# Rebuild et restaurer la BDD si nécessaire
```

---

## 🔧 Maintenance courante

### Mettre à jour staging

```bash
git checkout staging
git pull origin staging
ssh najo1022@staging.yarnflow.fr "cd /home/najo1022/staging.yarnflow.fr && git pull"
```

### Mettre à jour production

```bash
git checkout main
git pull origin main
ssh najo1022@yarnflow.fr "cd /home/najo1022/yarnflow.fr && git pull"
```

---

## 📊 Tableau récapitulatif

| Action | Staging | Production |
|--------|---------|------------|
| **Branche** | `staging` | `main` |
| **Fréquence** | Quotidienne | Hebdomadaire |
| **Tests** | Validation features | Validé staging |
| **Rollback** | Facile | Avec backup BDD |
| **Monitoring** | Optionnel | Obligatoire |

---

## 🚦 Prochaines étapes recommandées

1. **Créer le repository Git GitHub/GitLab** si pas déjà fait
2. **Initialiser Git sur les serveurs** (staging + prod)
3. **Créer la branche `staging`** depuis `main`
4. **Créer les scripts de build production**
5. **Tester le workflow complet** sur staging
6. **Configurer les sauvegardes automatiques** de la BDD
7. **Mettre en place un monitoring** (logs, erreurs, performances)

---

**Besoin d'aide ?** Consultez :
- `GUIDE_ENVIRONNEMENTS.md` : Configuration des environnements
- `MIGRATION_GUIDE_v0.x.x.md` : Guides de migration
- Logs serveur : `/home/najo1022/logs/`
