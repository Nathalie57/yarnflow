#!/bin/bash
# Script de déploiement sur le serveur PRODUCTION
# À copier sur : /home/najo1022/yarnflow.fr/deploy-server.sh
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
mkdir -p ~/backups
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

# Lire les credentials depuis .env
if [ -f "api/.env" ]; then
    DB_NAME=$(grep DB_NAME api/.env | cut -d '=' -f2)
    DB_USER=$(grep DB_USER api/.env | cut -d '=' -f2)
    echo "Base de données : $DB_NAME"

    # Backup avec prompt du mot de passe
    mysqldump -u $DB_USER -p $DB_NAME > ~/backups/$BACKUP_FILE
    echo -e "${GREEN}✅ Backup créé : ~/backups/$BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  .env non trouvé, backup manuel recommandé${NC}"
fi

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
cp -r backend/middleware api/ 2>/dev/null || true
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
    echo -e "${RED}❌ ERREUR : api/.env n'existe pas !${NC}"
    echo "Le déploiement ne peut pas continuer sans .env"
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
echo "  - Tester l'inscription/connexion"
echo "  - Tester la création de projet"
echo ""
