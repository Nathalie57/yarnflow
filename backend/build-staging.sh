#!/bin/bash
# Build backend pour STAGING

echo "🚀 Préparation du backend pour STAGING..."
echo ""

# Créer le dossier de build
BUILD_DIR="build-staging"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

echo "📦 Copie des fichiers PHP..."

# Copier les dossiers du backend
cp -r controllers $BUILD_DIR/
cp -r models $BUILD_DIR/
cp -r services $BUILD_DIR/
cp -r config $BUILD_DIR/
cp -r utils $BUILD_DIR/
cp -r routes $BUILD_DIR/
cp -r vendor $BUILD_DIR/

# Copier les fichiers de public/ à la racine de build
cp public/index.php $BUILD_DIR/
cp public/.htaccess $BUILD_DIR/

# Créer le dossier uploads
mkdir -p $BUILD_DIR/public/uploads

# Créer le .env staging
cat > $BUILD_DIR/.env << 'ENVEOF'
# Configuration BACKEND STAGING
# ⚠️ MODIFIEZ LES VALEURS CI-DESSOUS

# Application
APP_ENV=prod
APP_DEBUG=false
APP_URL=https://staging.yarnflow.fr/api

# Database
DB_HOST=localhost
DB_NAME=najo1022_staging_yarnflow
DB_USER=najo1022_staging_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_DB
DB_CHARSET=utf8mb4

# JWT
JWT_SECRET=VOTRE_SECRET_JWT_UNIQUE

# URLs
FRONTEND_URL=https://staging.yarnflow.fr
BACKEND_URL=https://staging.yarnflow.fr/api

# Stripe (clés TEST)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET

# Gemini API
GEMINI_API_KEY=VOTRE_CLE_GEMINI

# Pricing
SUBSCRIPTION_PRO_MONTHLY_PRICE=4.99
SUBSCRIPTION_PRO_ANNUAL_PRICE=49.99
SUBSCRIPTION_PLUS_MONTHLY_PRICE=2.99
SUBSCRIPTION_PLUS_ANNUAL_PRICE=29.99
ENVEOF

echo ""
echo "✅ Build terminé dans le dossier : $BUILD_DIR/"
echo ""
echo "📤 UPLOADEZ TOUT LE CONTENU de $BUILD_DIR/ vers :"
echo "   /home/najo1022/staging.yarnflow.fr/api/"
echo ""
echo "⚠️  N'OUBLIEZ PAS de modifier le fichier .env avec vos vraies valeurs !"
echo ""
echo "Fichiers à uploader :"
ls -la $BUILD_DIR/
