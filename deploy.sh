#!/bin/bash
# Script de déploiement YarnFlow sur O2Switch
# À placer à la racine du projet sur le serveur

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement YarnFlow..."

# Variables
REPO_DIR="/home/najo1022/repositories/yarnflow"
WEB_DIR="/home/najo1022/public_html"
API_DIR="$WEB_DIR/api"

# 1. Pull les dernières modifications
echo "📥 Pull des dernières modifications..."
cd "$REPO_DIR"
git pull origin main

# 2. Déployer le backend
echo "📦 Déploiement backend..."
rsync -av --delete \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='node_modules' \
  --exclude='database' \
  --exclude='test*.php' \
  --exclude='info.php' \
  "$REPO_DIR/backend/" "$API_DIR/"

# 3. Préserver le .env existant
echo "🔒 Préservation du fichier .env..."
# Le .env ne sera jamais écrasé grâce à --exclude

# 4. Déployer le frontend (si dist existe)
if [ -d "$REPO_DIR/frontend/dist" ]; then
  echo "🎨 Déploiement frontend..."
  rsync -av --delete \
    --exclude='api' \
    "$REPO_DIR/frontend/dist/" "$WEB_DIR/"
else
  echo "⚠️  Pas de build frontend (dist/) - skipping"
fi

# 5. Vérifier les permissions
echo "🔐 Vérification des permissions..."
chmod 755 "$API_DIR/public"
chmod 755 "$API_DIR/public/uploads" 2>/dev/null || mkdir -p "$API_DIR/public/uploads" && chmod 755 "$API_DIR/public/uploads"

echo "✅ Déploiement terminé !"
echo "🌐 Site : https://yarnflow.fr"
echo "🔧 API : https://yarnflow.fr/api/public/health.php"
