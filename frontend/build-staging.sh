#!/bin/bash
# Build pour STAGING avec les variables .env.staging

echo "🚀 Building for STAGING environment..."
echo ""

# Nettoyer le build précédent
rm -rf dist

# Builder avec le mode staging (utilise .env.staging)
npm run build -- --mode staging

echo ""
echo "✅ Build terminé !"
echo "📁 Fichiers dans dist/ prêts à être uploadés sur staging.yarnflow.fr"
echo ""
echo "Variables utilisées :"
echo "  - VITE_API_URL=https://staging.yarnflow.fr/api"
echo "  - VITE_BACKEND_URL=https://staging.yarnflow.fr/api"
