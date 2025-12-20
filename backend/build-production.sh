#!/bin/bash
# Build backend pour PRODUCTION

echo "🚀 Préparation du backend pour PRODUCTION..."
echo ""

# Créer le dossier de build
BUILD_DIR="build-production"
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

# Créer le .env production (TEMPLATE - à modifier)
cat > $BUILD_DIR/.env << 'ENVEOF'
# Configuration PRODUCTION - YarnFlow
# ⚠️ REMPLACER LES VALEURS CI-DESSOUS PAR VOS VRAIES CREDENTIALS

# Application
APP_ENV=prod
APP_DEBUG=false
APP_URL=https://yarnflow.fr/api
FRONTEND_URL=https://yarnflow.fr

# Base de données MySQL PRODUCTION
DB_HOST=localhost
DB_PORT=3306
DB_NAME=najo1022_yarnflow
DB_USER=najo1022_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_PROD
DB_CHARSET=utf8mb4

# JWT - Générer avec : openssl rand -base64 32
JWT_SECRET=VOTRE_SECRET_JWT_PROD_UNIQUE
JWT_EXPIRATION=604800

# Stripe - Mode PRODUCTION (clés sur dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_PRODUCTION
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_PRODUCTION

# Prix des abonnements (doivent correspondre aux prix Stripe)
STRIPE_PRICE_ID_PLUS_MONTHLY=price_VOTRE_ID
STRIPE_PRICE_ID_PLUS_ANNUAL=price_VOTRE_ID
STRIPE_PRICE_ID_PRO_MONTHLY=price_VOTRE_ID
STRIPE_PRICE_ID_PRO_ANNUAL=price_VOTRE_ID
STRIPE_PRICE_ID_EARLY_BIRD=price_VOTRE_ID

# Prix des packs de crédits
STRIPE_PRICE_ID_CREDITS_50=price_VOTRE_ID
STRIPE_PRICE_ID_CREDITS_150=price_VOTRE_ID

# Pricing (pour affichage)
SUBSCRIPTION_PLUS_MONTHLY_PRICE=2.99
SUBSCRIPTION_PLUS_ANNUAL_PRICE=29.99
SUBSCRIPTION_PRO_MONTHLY_PRICE=4.99
SUBSCRIPTION_PRO_ANNUAL_PRICE=49.99

# AI Photo Studio - Gemini
GEMINI_API_KEY=VOTRE_CLE_GEMINI
GEMINI_MODEL=gemini-2.5-flash-image-preview
GEMINI_SIMULATION_MODE=false

# Email SMTP - Production O2Switch
SMTP_HOST=mail.yarnflow.fr
SMTP_PORT=587
SMTP_USER=contact@yarnflow.fr
SMTP_PASSWORD=VOTRE_MOT_DE_PASSE_EMAIL
SMTP_FROM_EMAIL=contact@yarnflow.fr
SMTP_FROM_NAME=YarnFlow

ENVEOF

echo ""
echo "✅ Build terminé dans le dossier : $BUILD_DIR/"
echo ""
echo "📤 UPLOADEZ TOUT LE CONTENU de $BUILD_DIR/ vers :"
echo "   /home/najo1022/yarnflow.fr/api/"
echo ""
echo "⚠️  IMPORTANT :"
echo "   1. Modifiez le fichier .env avec vos vraies valeurs PRODUCTION"
echo "   2. Vérifiez que la base de données est créée"
echo "   3. Lancez les migrations SQL si nécessaire"
echo "   4. Configurez les webhooks Stripe en production"
echo ""
echo "Fichiers à uploader :"
ls -la $BUILD_DIR/
