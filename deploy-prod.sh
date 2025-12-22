#!/bin/bash
# ==============================================================================
# Script de déploiement PRODUCTION - YarnFlow
# Usage: ./deploy-prod.sh
# ==============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement PRODUCTION - YarnFlow"
echo "====================================="
echo ""
echo "⚠️  ATTENTION : Vous allez déployer en PRODUCTION !"
echo ""
read -p "Êtes-vous sûr(e) ? (tapez 'oui' pour continuer) : " confirmation

if [ "$confirmation" != "oui" ]; then
  echo "❌ Déploiement annulé."
  exit 1
fi

echo ""

# 1. Vérifier qu'on est sur la branche main
echo "🔍 Étape 1/5 : Vérification de la branche Git..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Vous devez être sur la branche 'main' pour déployer en prod."
  echo "   Branche actuelle : $BRANCH"
  exit 1
fi
echo "✅ Branche 'main' confirmée"
echo ""

# 2. Valider les variables d'environnement
echo "📋 Étape 2/5 : Validation des variables d'environnement..."
cd frontend
node validate-env.js
if [ $? -ne 0 ]; then
  echo "❌ Validation échouée. Corrigez les fichiers .env avant de continuer."
  exit 1
fi
echo "✅ Variables validées"
echo ""

# 3. Builder le frontend
echo "🏗️  Étape 3/5 : Build du frontend pour PRODUCTION..."
npm run build:prod
echo "✅ Build terminé"
echo ""

# 4. Afficher les fichiers générés
echo "📦 Étape 4/5 : Fichiers générés :"
ls -lh dist/ | grep -E "index.html|assets"
echo ""

# 5. Instructions de déploiement
echo "📤 Étape 5/5 : Instructions de déploiement"
echo "==========================================="
echo ""
echo "Le build est prêt dans : frontend/dist/"
echo ""
echo "Pour déployer sur yarnflow.fr (PRODUCTION) :"
echo "  1. Se connecter en SSH ou FTP"
echo "  2. Uploader TOUT le contenu de frontend/dist/"
echo "  3. Destination : ~/yarnflow.fr/ (ou chemin configuré)"
echo "  4. Écraser les fichiers existants"
echo "  5. ⚠️  ATTENTION : Ne PAS écraser le dossier backend/public/uploads/ !"
echo ""
echo "Ou via SCP (plus rapide) :"
echo "  scp -r dist/* najo1022@yarnflow.fr:~/yarnflow.fr/"
echo ""
echo "✅ Build PRODUCTION prêt !"
echo ""
echo "🔔 RAPPEL : Pensez à :"
echo "  - Tester sur staging AVANT de déployer en prod"
echo "  - Vérifier que la BDD prod est à jour (migrations SQL)"
echo "  - Faire un backup avant déploiement majeur"
