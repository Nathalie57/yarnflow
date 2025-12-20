#!/bin/bash
# Script de déploiement YarnFlow
# Usage: ./deploy.sh [staging|production]

set -e  # Arrêter en cas d'erreur

ENVIRONMENT=$1

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier l'argument
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

# Configuration selon l'environnement
if [ "$ENVIRONMENT" = "staging" ]; then
    SERVER="najo1022@staging.yarnflow.fr"
    REMOTE_PATH="/home/najo1022/staging.yarnflow.fr"
    BRANCH="staging"
    URL="https://staging.yarnflow.fr"
elif [ "$ENVIRONMENT" = "production" ]; then
    SERVER="najo1022@yarnflow.fr"
    REMOTE_PATH="/home/najo1022/yarnflow.fr"
    BRANCH="main"
    URL="https://yarnflow.fr"

    # Confirmation pour la production
    print_warning "Vous allez déployer en PRODUCTION !"
    read -p "Êtes-vous sûr ? (oui/non) : " confirm
    if [ "$confirm" != "oui" ]; then
        print_error "Déploiement annulé"
        exit 1
    fi
fi

echo ""
echo "🚀 Déploiement YarnFlow vers $ENVIRONMENT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Vérifier la branche Git
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    print_error "Vous devez être sur la branche $BRANCH (actuellement sur $CURRENT_BRANCH)"
    exit 1
fi
print_success "Branche correcte : $BRANCH"

# 2. Vérifier qu'il n'y a pas de modifications non commitées
if ! git diff-index --quiet HEAD --; then
    print_error "Vous avez des modifications non commitées"
    git status --short
    exit 1
fi
print_success "Aucune modification non commitée"

# 3. Pull des dernières modifications
echo ""
echo "📥 Récupération des dernières modifications..."
git pull origin $BRANCH
print_success "Modifications récupérées"

# 4. Build backend
echo ""
echo "📦 Build du backend..."
cd backend
chmod +x build-${ENVIRONMENT}.sh
./build-${ENVIRONMENT}.sh
cd ..
print_success "Backend buildé"

# 5. Build frontend
echo ""
echo "📦 Build du frontend..."
cd frontend
chmod +x build-${ENVIRONMENT}.sh
./build-${ENVIRONMENT}.sh
cd ..
print_success "Frontend buildé"

# 6. Confirmation avant upload
echo ""
print_warning "Prêt à uploader vers $URL"
read -p "Continuer ? (oui/non) : " upload_confirm
if [ "$upload_confirm" != "oui" ]; then
    print_error "Upload annulé"
    exit 1
fi

# 7. Upload backend
echo ""
echo "📤 Upload du backend..."
rsync -avz --delete \
    --exclude='.env' \
    backend/build-${ENVIRONMENT}/ \
    ${SERVER}:${REMOTE_PATH}/api/

print_success "Backend uploadé"

# 8. Upload frontend
echo ""
echo "📤 Upload du frontend..."
rsync -avz --delete \
    --exclude='node_modules' \
    --exclude='.env' \
    frontend/dist/ \
    ${SERVER}:${REMOTE_PATH}/

print_success "Frontend uploadé"

# 9. Vérifications post-déploiement
echo ""
echo "🔍 Vérifications post-déploiement..."

# Vérifier que le serveur répond
if curl -s --head --fail "$URL/api/health" > /dev/null; then
    print_success "API accessible"
else
    print_warning "API non accessible (vérifier le endpoint /health)"
fi

# 10. Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "Déploiement terminé !"
echo ""
echo "🌐 URL : $URL"
echo "📊 Vérifiez les logs : ssh ${SERVER} 'tail -f /home/najo1022/logs/error.log'"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    print_warning "N'oubliez pas :"
    echo "  - Vérifier les webhooks Stripe"
    echo "  - Tester les paiements"
    echo "  - Monitorer les erreurs"
    echo ""
fi

# 11. Tag de version (production uniquement)
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    read -p "Créer un tag de version ? (oui/non) : " tag_confirm
    if [ "$tag_confirm" = "oui" ]; then
        read -p "Numéro de version (ex: 0.17.0) : " version
        git tag -a "v${version}" -m "Release v${version}"
        git push origin "v${version}"
        print_success "Tag v${version} créé et pushé"
    fi
fi

echo ""
print_success "Tout est terminé ! 🎉"
