#!/bin/bash
# ==============================================================================
# Script de déploiement STAGING - YarnFlow
# Usage: ./deploy-staging.sh
# ==============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement STAGING - YarnFlow"
echo "=================================="
echo ""

# 1. Valider les variables d'environnement
echo "📋 Étape 1/4 : Validation des variables d'environnement..."
cd frontend
node validate-env.js
if [ $? -ne 0 ]; then
  echo "❌ Validation échouée. Corrigez les fichiers .env avant de continuer."
  exit 1
fi
echo "✅ Variables validées"
echo ""

# 2. Builder le frontend
echo "🏗️  Étape 2/4 : Build du frontend pour STAGING..."
npm run build:staging
echo "✅ Build terminé"
echo ""

# 3. Afficher les fichiers générés
echo "📦 Étape 3/4 : Fichiers générés :"
ls -lh dist/ | grep -E "index.html|assets"
echo ""

# 4. Instructions de déploiement
echo "📤 Étape 4/4 : Instructions de déploiement"
echo "==========================================="
echo ""
echo "Le build est prêt dans : frontend/dist/"
echo ""
echo "Pour déployer sur staging.yarnflow.fr :"
echo "  1. Se connecter en SSH ou FTP"
echo "  2. Uploader TOUT le contenu de frontend/dist/"
echo "  3. Destination : ~/staging.yarnflow.fr/ (ou chemin configuré)"
echo "  4. Écraser les fichiers existants"
echo ""
echo "Ou via SCP (plus rapide) :"
echo "  scp -r dist/* najo1022@staging.yarnflow.fr:~/staging.yarnflow.fr/"
echo ""
echo "✅ Build STAGING prêt !"
