# Guide d'initialisation Git sur O2Switch

**Pour** : staging.yarnflow.fr et yarnflow.fr
**Date** : 2025-12-20

## 🎯 Objectif

Initialiser Git sur vos serveurs O2Switch pour pouvoir déployer avec `git pull` + script automatisé.

---

## 📋 Prérequis

1. Avoir un compte GitHub ou GitLab
2. Avoir accès SSH aux serveurs O2Switch
3. Avoir les credentials de connexion

---

## 🚀 Étape 1 : Créer le repository Git (sur votre machine locale)

### Si vous n'avez pas encore de repo Git

```bash
# Sur votre machine Windows (WSL)
cd /mnt/d/wamp64/www/pattern-maker

# Initialiser Git
git init
git add .
git commit -m "Initial commit - YarnFlow v0.16.0"

# Créer le repo sur GitHub
# Allez sur https://github.com/new
# Nom : yarnflow (ou autre)
# Visibility : Private
# Ne pas créer README, .gitignore, license

# Lier au repo distant
git remote add origin https://github.com/VOTRE_USERNAME/yarnflow.git
git branch -M main
git push -u origin main

# Créer la branche staging
git checkout -b staging
git push -u origin staging
```

### Si vous avez déjà un repo Git

```bash
# Vérifier l'état
git status
git remote -v

# Créer staging si elle n'existe pas
git checkout -b staging
git push -u origin staging
```

---

## 🔑 Étape 2 : Configurer SSH sur O2Switch

### Option A : SSH avec clé (recommandé)

**Sur staging.yarnflow.fr** :

```bash
# Se connecter au serveur
ssh najo1022@staging.yarnflow.fr

# Générer une clé SSH
ssh-keygen -t ed25519 -C "staging@yarnflow.fr"
# Appuyez sur Entrée 3 fois (pas de passphrase)

# Afficher la clé publique
cat ~/.ssh/id_ed25519.pub
```

Copiez la clé affichée, puis allez sur GitHub :
- **GitHub** : Settings → SSH and GPG keys → New SSH key
- Titre : "O2Switch Staging"
- Clé : Collez la clé copiée
- Cliquez "Add SSH key"

**Sur production (yarnflow.fr)** :

```bash
ssh najo1022@yarnflow.fr
ssh-keygen -t ed25519 -C "production@yarnflow.fr"
cat ~/.ssh/id_ed25519.pub
```

Ajoutez cette clé aussi sur GitHub avec le titre "O2Switch Production".

### Option B : HTTPS (plus simple mais moins sécurisé)

Vous utiliserez l'URL HTTPS et taperez votre mot de passe à chaque pull.

---

## 📦 Étape 3 : Initialiser Git sur STAGING

```bash
# 1. Se connecter au serveur
ssh najo1022@staging.yarnflow.fr

# 2. Créer les dossiers nécessaires
mkdir -p ~/backups

# 3. Aller dans le dossier web
cd ~/staging.yarnflow.fr

# 4. BACKUP des fichiers existants (important !)
mkdir -p ~/backup_old_files
cp -r api ~/backup_old_files/
cp index.html ~/backup_old_files/ 2>/dev/null || true

# 5. Cloner le repository dans un dossier temporaire
# AVEC SSH (si configuré) :
git clone git@github.com:VOTRE_USERNAME/yarnflow.git temp_clone

# OU AVEC HTTPS (si pas de SSH) :
# git clone https://github.com/VOTRE_USERNAME/yarnflow.git temp_clone

# 6. Se placer dans le clone et changer de branche
cd temp_clone
git checkout staging

# 7. Déplacer les fichiers à la racine
shopt -s dotglob  # Pour inclure les fichiers cachés
mv * /home/najo1022/staging.yarnflow.fr/
cd ..
rm -rf temp_clone

# 8. Configurer Git
git config user.name "YarnFlow Staging"
git config user.email "staging@yarnflow.fr"

# 9. Vérifier
git status
git branch  # Doit afficher "staging"
pwd  # Doit afficher /home/najo1022/staging.yarnflow.fr
```

---

## 📦 Étape 4 : Configurer le backend sur STAGING

```bash
# Toujours dans ~/staging.yarnflow.fr

# 1. Créer la structure API
mkdir -p api/public/uploads

# 2. Copier le .env depuis le template
cp backend/.env.staging api/.env

# 3. Modifier le .env avec vos vraies valeurs
nano api/.env

# Vérifiez notamment :
# DB_NAME=najo1022_staging_yarnflow
# DB_USER=najo1022_staging_user
# DB_PASSWORD=oQ!)s2)g[PZH
# JWT_SECRET=493kqAIEt7d85QHy2vZ5ZClJzVAtlzbkp5h5uQJsO0s=
# STRIPE_SECRET_KEY=sk_live_...
# GEMINI_API_KEY=AIzaSy...

# Sauvegardez avec Ctrl+X, puis Y, puis Entrée

# 4. Installer Composer (si pas déjà fait)
cd backend
composer install --no-dev
cd ..

# 5. Copier les fichiers backend vers api/
cp -r backend/controllers api/
cp -r backend/models api/
cp -r backend/services api/
cp -r backend/config api/
cp -r backend/utils api/
cp -r backend/routes api/
cp -r backend/middleware api/
cp -r backend/vendor api/
cp backend/public/index.php api/
cp backend/public/.htaccess api/
```

---

## 📦 Étape 5 : Configurer le frontend sur STAGING

```bash
# Dans ~/staging.yarnflow.fr

# 1. Vérifier que Node.js est disponible
node --version
npm --version

# Si Node n'est pas installé, installer nvm puis Node
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# source ~/.bashrc
# nvm install 18
# nvm use 18

# 2. Installer les dépendances
cd frontend
npm install

# 3. Build le frontend
npm run build -- --mode staging

# 4. Copier les fichiers buildés à la racine
cp -r dist/* /home/najo1022/staging.yarnflow.fr/

cd ..
```

---

## 📦 Étape 6 : Créer le script de déploiement

```bash
# Dans ~/staging.yarnflow.fr

# Créer le script
nano deploy-server.sh
```

Copiez le contenu du fichier `deploy-server-staging.sh` (voir dans votre projet local).

Ou copiez directement depuis le serveur avec cette commande :

```bash
cat > deploy-server.sh << 'DEPLOY_SCRIPT_EOF'
#!/bin/bash
# Script de déploiement sur le serveur STAGING

set -e

echo "🚀 Déploiement YarnFlow STAGING..."
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📥 Récupération des modifications..."
git fetch origin
git reset --hard origin/staging
echo -e "${GREEN}✅ Code mis à jour${NC}"

echo ""
echo "📦 Configuration backend..."

mkdir -p api/public/uploads

cp -r backend/controllers api/ 2>/dev/null || true
cp -r backend/models api/ 2>/dev/null || true
cp -r backend/services api/ 2>/dev/null || true
cp -r backend/config api/ 2>/dev/null || true
cp -r backend/utils api/ 2>/dev/null || true
cp -r backend/routes api/ 2>/dev/null || true
cp -r backend/middleware api/ 2>/dev/null || true
cp -r backend/vendor api/ 2>/dev/null || true
cp backend/public/index.php api/ 2>/dev/null || true
cp backend/public/.htaccess api/ 2>/dev/null || true

echo -e "${GREEN}✅ Backend configuré${NC}"

echo ""
echo "📦 Build frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

npm run build -- --mode staging

cp -r dist/* /home/najo1022/staging.yarnflow.fr/

cd ..

echo -e "${GREEN}✅ Frontend buildé${NC}"

echo ""
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}⚠️  ATTENTION : api/.env n'existe pas !${NC}"
else
    echo -e "${GREEN}✅ .env présent${NC}"
fi

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
DEPLOY_SCRIPT_EOF

chmod +x deploy-server.sh
```

---

## 📦 Étape 7 : Tester le premier déploiement

```bash
# Dans ~/staging.yarnflow.fr

./deploy-server.sh
```

Si tout se passe bien, vous devriez voir :
```
✅ Code mis à jour
✅ Backend configuré
✅ Frontend buildé
✅ .env présent
✅ Déploiement terminé !
```

---

## 🌐 Étape 8 : Vérifier que tout fonctionne

```bash
# Vérifier les logs
tail -f ~/logs/error.log

# Dans un autre terminal, tester l'API
curl https://staging.yarnflow.fr/api/health
```

Ouvrez votre navigateur et allez sur :
- **Frontend** : https://staging.yarnflow.fr
- **API** : https://staging.yarnflow.fr/api

---

## 🔄 Workflow futur

### Sur votre machine locale

```bash
# Développer
git checkout staging
git pull origin staging
git checkout -b feature/ma-feature

# ... coder ...

git add .
git commit -m "feat: ma feature"
git push origin feature/ma-feature

# Merger dans staging
git checkout staging
git merge feature/ma-feature
git push origin staging
```

### Sur le serveur O2Switch

```bash
ssh najo1022@staging.yarnflow.fr
cd ~/staging.yarnflow.fr
./deploy-server.sh
```

C'est tout ! 🎉

---

## 🚀 Répéter pour PRODUCTION

Une fois que staging fonctionne bien, répétez les étapes 3 à 8 pour la production :

- Serveur : `yarnflow.fr`
- Branche : `main`
- Script : `deploy-server-production.sh`
- .env : Utiliser les vraies credentials de production

---

## ✅ Checklist finale

- [ ] Repository Git créé sur GitHub/GitLab
- [ ] Branche `staging` créée et pushée
- [ ] SSH configuré sur O2Switch (optionnel)
- [ ] Git initialisé sur staging.yarnflow.fr
- [ ] Fichier api/.env configuré
- [ ] Composer installé (`backend/vendor`)
- [ ] Node.js disponible et frontend buildé
- [ ] Script deploy-server.sh créé et exécutable
- [ ] Premier déploiement réussi
- [ ] Site accessible sur https://staging.yarnflow.fr

---

**Besoin d'aide ?** Consultez `DEPLOYMENT_O2SWITCH.md` pour plus de détails.
