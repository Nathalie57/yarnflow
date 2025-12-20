# Déploiement Git depuis O2Switch - YarnFlow

**Version** : 1.0.0
**Date** : 2025-12-20

## 🎯 Stratégie

Gérer le déploiement **directement depuis les serveurs O2Switch** via Git :
- Pas de build local
- Pas de rsync
- Simple `git pull` sur le serveur
- Build automatique sur le serveur

---

## 📋 Configuration initiale

### 1. Créer le repository Git (GitHub/GitLab)

Si pas encore fait :

```bash
# Depuis votre machine locale
cd /mnt/d/wamp64/www/pattern-maker

# Initialiser Git si nécessaire
git init
git add .
git commit -m "Initial commit v0.16.0"

# Créer le repo sur GitHub/GitLab puis :
git remote add origin https://github.com/VOTRE_USERNAME/yarnflow.git
git branch -M main
git push -u origin main

# Créer la branche staging
git checkout -b staging
git push -u origin staging
```

### 2. Configurer SSH sur O2Switch (recommandé)

Pour éviter de taper le mot de passe à chaque `git pull` :

```bash
# SSH sur staging
ssh najo1022@staging.yarnflow.fr

# Générer une clé SSH
ssh-keygen -t ed25519 -C "staging@yarnflow.fr"
# Appuyez sur Entrée 3 fois (pas de passphrase)

# Afficher la clé publique
cat ~/.ssh/id_ed25519.pub

# Copiez cette clé et ajoutez-la dans :
# - GitHub : Settings > SSH and GPG keys > New SSH key
# - GitLab : Settings > SSH Keys
```

Répétez pour la production :

```bash
ssh najo1022@yarnflow.fr
ssh-keygen -t ed25519 -C "production@yarnflow.fr"
cat ~/.ssh/id_ed25519.pub
# Ajouter cette clé aussi dans GitHub/GitLab
```

---

## 🚀 Initialisation sur les serveurs

### Sur staging.yarnflow.fr

```bash
# 1. SSH sur le serveur
ssh najo1022@staging.yarnflow.fr

# 2. Aller dans le dossier web
cd /home/najo1022/staging.yarnflow.fr

# 3. Supprimer les fichiers existants (BACKUP d'abord si important !)
# Ou renommer : mv api api_backup && mv index.html index_backup.html

# 4. Cloner le repository
git clone git@github.com:VOTRE_USERNAME/yarnflow.git temp_clone
# Ou en HTTPS si pas de SSH : git clone https://github.com/VOTRE_USERNAME/yarnflow.git temp_clone

# 5. Déplacer les fichiers
cd temp_clone
git checkout staging
mv * .[^.]* /home/najo1022/staging.yarnflow.fr/
cd ..
rm -rf temp_clone

# 6. Configurer Git
git config user.name "YarnFlow Staging"
git config user.email "staging@yarnflow.fr"

# 7. Vérifier
git status
git branch
```

### Sur yarnflow.fr (production)

```bash
# 1. SSH sur le serveur
ssh najo1022@yarnflow.fr

# 2. Même processus que staging
cd /home/najo1022/yarnflow.fr

# 3. Cloner
git clone git@github.com:VOTRE_USERNAME/yarnflow.git temp_clone
cd temp_clone
git checkout main
mv * .[^.]* /home/najo1022/yarnflow.fr/
cd ..
rm -rf temp_clone

# 4. Configurer Git
git config user.name "YarnFlow Production"
git config user.email "production@yarnflow.fr"

git status
git branch
```

---

## 📦 Scripts de déploiement sur le serveur

### Script pour staging

Créez `/home/najo1022/staging.yarnflow.fr/deploy-server.sh` :

```bash
#!/bin/bash
# Script de déploiement sur le serveur STAGING
# Usage: ./deploy-server.sh

set -e

echo "🚀 Déploiement YarnFlow STAGING..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Pull des dernières modifications
echo "📥 Récupération des modifications..."
git fetch origin
git reset --hard origin/staging
echo -e "${GREEN}✅ Code mis à jour${NC}"

# 2. Backend - Copier les fichiers
echo ""
echo "📦 Configuration backend..."

# Créer la structure si elle n'existe pas
mkdir -p api/public/uploads

# Copier les fichiers backend
cp -r backend/controllers api/ 2>/dev/null || true
cp -r backend/models api/ 2>/dev/null || true
cp -r backend/services api/ 2>/dev/null || true
cp -r backend/config api/ 2>/dev/null || true
cp -r backend/utils api/ 2>/dev/null || true
cp -r backend/routes api/ 2>/dev/null || true
cp -r backend/vendor api/ 2>/dev/null || true
cp backend/public/index.php api/ 2>/dev/null || true
cp backend/public/.htaccess api/ 2>/dev/null || true

echo -e "${GREEN}✅ Backend configuré${NC}"

# 3. Frontend - Build
echo ""
echo "📦 Build frontend..."
cd frontend

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Build
npm run build -- --mode staging

# Copier les fichiers dist à la racine
cp -r dist/* /home/najo1022/staging.yarnflow.fr/

cd ..

echo -e "${GREEN}✅ Frontend buildé${NC}"

# 4. Vérifier le .env
echo ""
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}⚠️  ATTENTION : api/.env n'existe pas !${NC}"
    echo "Créez-le depuis api/.env.example avec vos vraies valeurs"
else
    echo -e "${GREEN}✅ .env présent${NC}"
fi

# 5. Permissions
echo ""
echo "🔐 Configuration des permissions..."
chmod -R 755 /home/najo1022/staging.yarnflow.fr
chmod -R 777 /home/najo1022/staging.yarnflow.fr/api/public/uploads

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "🌐 URL : https://staging.yarnflow.fr"
echo "📊 Logs : tail -f ~/logs/error.log"
echo ""
```

### Script pour production

Créez `/home/najo1022/yarnflow.fr/deploy-server.sh` :

```bash
#!/bin/bash
# Script de déploiement sur le serveur PRODUCTION
# Usage: ./deploy-server.sh

set -e

echo "🚀 Déploiement YarnFlow PRODUCTION..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Confirmation
echo -e "${RED}⚠️  ATTENTION : Déploiement en PRODUCTION !${NC}"
read -p "Êtes-vous sûr ? (oui/non) : " confirm
if [ "$confirm" != "oui" ]; then
    echo "Déploiement annulé"
    exit 1
fi

# 1. Backup de la base de données
echo ""
echo "💾 Backup de la base de données..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u najo1022_user -p najo1022_yarnflow > ~/backups/$BACKUP_FILE
echo -e "${GREEN}✅ Backup créé : ~/backups/$BACKUP_FILE${NC}"

# 2. Pull des dernières modifications
echo ""
echo "📥 Récupération des modifications..."
git fetch origin
git reset --hard origin/main
echo -e "${GREEN}✅ Code mis à jour${NC}"

# 3. Backend - Copier les fichiers
echo ""
echo "📦 Configuration backend..."

mkdir -p api/public/uploads

cp -r backend/controllers api/ 2>/dev/null || true
cp -r backend/models api/ 2>/dev/null || true
cp -r backend/services api/ 2>/dev/null || true
cp -r backend/config api/ 2>/dev/null || true
cp -r backend/utils api/ 2>/dev/null || true
cp -r backend/routes api/ 2>/dev/null || true
cp -r backend/vendor api/ 2>/dev/null || true
cp backend/public/index.php api/ 2>/dev/null || true
cp backend/public/.htaccess api/ 2>/dev/null || true

echo -e "${GREEN}✅ Backend configuré${NC}"

# 4. Frontend - Build
echo ""
echo "📦 Build frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

npm run build -- --mode production

cp -r dist/* /home/najo1022/yarnflow.fr/

cd ..

echo -e "${GREEN}✅ Frontend buildé${NC}"

# 5. Vérifier le .env
echo ""
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}⚠️  ATTENTION : api/.env n'existe pas !${NC}"
    exit 1
else
    echo -e "${GREEN}✅ .env présent${NC}"
fi

# 6. Permissions
echo ""
echo "🔐 Configuration des permissions..."
chmod -R 755 /home/najo1022/yarnflow.fr
chmod -R 777 /home/najo1022/yarnflow.fr/api/public/uploads

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "🌐 URL : https://yarnflow.fr"
echo "📊 Logs : tail -f ~/logs/error.log"
echo "💾 Backup BDD : ~/backups/$BACKUP_FILE"
echo ""
echo -e "${YELLOW}⚠️  N'oubliez pas de vérifier :${NC}"
echo "  - Les webhooks Stripe"
echo "  - Les paiements"
echo "  - Les erreurs dans les logs"
echo ""
```

---

## 🔄 Workflow quotidien

### Développer une nouvelle feature (local)

```bash
# Sur votre machine locale
git checkout staging
git pull origin staging
git checkout -b feature/ma-feature

# ... développer ...

git add .
git commit -m "feat: ma nouvelle feature"
git push origin feature/ma-feature

# Merger dans staging
git checkout staging
git merge feature/ma-feature
git push origin staging
```

### Déployer sur staging (serveur O2Switch)

```bash
# SSH sur staging
ssh najo1022@staging.yarnflow.fr
cd /home/najo1022/staging.yarnflow.fr

# Exécuter le script de déploiement
./deploy-server.sh
```

### Déployer en production (serveur O2Switch)

```bash
# 1. Merger staging dans main (local)
git checkout main
git pull origin main
git merge staging
git tag -a v0.17.0 -m "Release v0.17.0"
git push origin main --tags

# 2. SSH sur production
ssh najo1022@yarnflow.fr
cd /home/najo1022/yarnflow.fr

# 3. Exécuter le script de déploiement
./deploy-server.sh
```

---

## 📋 Checklist de première installation

### Sur staging.yarnflow.fr

```bash
# 1. SSH
ssh najo1022@staging.yarnflow.fr

# 2. Créer les dossiers nécessaires
mkdir -p ~/backups
mkdir -p ~/staging.yarnflow.fr/api/public/uploads

# 3. Cloner le repo (voir section "Initialisation")
cd ~/staging.yarnflow.fr
# ... suivre les étapes ...

# 4. Créer le script de déploiement
nano deploy-server.sh
# ... coller le contenu du script staging ...
chmod +x deploy-server.sh

# 5. Créer le .env backend
cd api
cp ../backend/.env.staging .env
nano .env
# Modifier avec les vraies valeurs

# 6. Installer Composer (si pas déjà fait)
cd ../backend
composer install --no-dev

# 7. Premier déploiement
cd ~/staging.yarnflow.fr
./deploy-server.sh
```

### Sur yarnflow.fr

Même processus, mais :
- Utiliser la branche `main`
- Utiliser `.env.production`
- Créer le backup de BDD

---

## 🛠️ Commandes utiles sur le serveur

### Vérifier l'état Git

```bash
git status
git log --oneline -5
git branch
```

### Mettre à jour manuellement

```bash
git fetch origin
git pull origin staging  # ou main en production
```

### Voir les logs d'erreur

```bash
tail -f ~/logs/error.log
tail -f ~/logs/access.log
```

### Rollback à une version précédente

```bash
# Voir les tags
git tag -l

# Revenir à un tag
git checkout v0.16.0

# Ou revenir au commit précédent
git reset --hard HEAD~1

# Redéployer
./deploy-server.sh
```

### Nettoyer les fichiers temporaires

```bash
cd frontend
rm -rf node_modules dist
npm install
```

---

## 🔒 Sécurité

### Fichiers à protéger

Le `.env` ne doit JAMAIS être commité. Ajoutez dans `.gitignore` :

```gitignore
# Environnement
.env
.env.local
backend/.env
frontend/.env

# Builds
backend/build-*/
frontend/dist/

# Uploads
backend/public/uploads/*
!backend/public/uploads/.gitkeep
```

### Créer les .env sur le serveur

**Sur staging** :

```bash
ssh najo1022@staging.yarnflow.fr
cd ~/staging.yarnflow.fr/api
nano .env
# Coller le contenu de backend/.env.staging avec vos vraies valeurs
```

**Sur production** :

```bash
ssh najo1022@yarnflow.fr
cd ~/yarnflow.fr/api
nano .env
# Créer avec les vraies valeurs de production
```

---

## 📊 Structure finale sur O2Switch

```
/home/najo1022/staging.yarnflow.fr/
├── api/                      # Backend (copié depuis backend/)
│   ├── controllers/
│   ├── models/
│   ├── services/
│   ├── .env                  # À CRÉER MANUELLEMENT
│   └── index.php
├── assets/                   # Frontend buildé
├── index.html               # Frontend buildé
├── backend/                 # Source (du repo Git)
├── frontend/                # Source (du repo Git)
├── deploy-server.sh         # Script de déploiement
└── .git/                    # Repository Git
```

---

## ⚡ Avantages de cette méthode

✅ **Simple** : Juste un `git pull` + `./deploy-server.sh`
✅ **Rapide** : Pas de transfert réseau (déjà sur le serveur)
✅ **Sûr** : Scripts avec confirmations
✅ **Traçable** : Tout versionné avec Git
✅ **Rollback facile** : `git checkout TAG`

---

## 🆘 Troubleshooting

### Erreur "Permission denied (publickey)"

```bash
# Vérifier la clé SSH
ssh -T git@github.com

# Si erreur, utiliser HTTPS
git remote set-url origin https://github.com/VOTRE_USERNAME/yarnflow.git
```

### Erreur "node: command not found"

```bash
# Installer Node.js sur O2Switch
# Contacter le support O2Switch pour activer Node.js
# Ou utiliser nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Build frontend échoue

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build -- --mode staging
```

---

**Prochaine étape** : Voulez-vous que je vous guide pour l'initialisation sur staging.yarnflow.fr ?
