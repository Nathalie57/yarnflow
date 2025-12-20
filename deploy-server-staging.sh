#!/bin/bash
# Script de déploiement sur le serveur STAGING
# À copier sur : /home/najo1022/staging.yarnflow.fr/deploy-server.sh
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
cp -r backend/middleware api/ 2>/dev/null || true
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
    echo "Créez-le depuis backend/.env.staging avec vos vraies valeurs"
    echo ""
    echo "Commande : cp backend/.env.staging api/.env"
    echo "Puis modifiez api/.env avec vos credentials"
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
