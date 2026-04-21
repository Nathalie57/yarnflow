#!/bin/bash
# ==============================================================================
# Script de déploiement STAGING - YarnFlow
# Usage: ./deploy-staging.sh
# ==============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement STAGING - YarnFlow"
echo "=================================="
echo ""

# Vérifier qu'on est sur main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Vous n'êtes pas sur la branche main (branche actuelle : $CURRENT_BRANCH)"
  echo "   Faites 'git checkout main' avant de déployer."
  exit 1
fi

# Vérifier qu'il n'y a pas de modifications non commitées
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Des modifications non commitées existent. Commitez avant de déployer."
  git status --short
  exit 1
fi

# 1. Merge main → staging et push
echo "📋 Étape 1/3 : Mise à jour de la branche staging..."
git checkout staging
git merge main --no-edit
git push origin staging
git checkout main
echo "✅ Branche staging mise à jour et poussée"
echo ""

# 2. Valider les variables d'environnement
echo "🏗️  Étape 2/3 : Validation des variables d'environnement..."
cd frontend
node validate-env.js
if [ $? -ne 0 ]; then
  echo "❌ Validation échouée. Corrigez les fichiers .env avant de continuer."
  exit 1
fi
echo "✅ Variables validées"
echo ""

# 3. Instructions pour le serveur
cd ..
echo "📤 Étape 3/3 : Déploiement sur le serveur"
echo "==========================================="
echo ""
echo "La branche staging est prête. Pour finir le déploiement :"
echo ""
echo "  ssh najo1022@staging.yarnflow.fr"
echo "  cd ~/staging.yarnflow.fr && ./deploy-server.sh"
echo ""
echo "✅ Staging prêt à déployer !"
