#!/bin/bash
# Build frontend pour PRODUCTION

echo "🚀 Build du frontend pour PRODUCTION..."
echo ""

# Vérifier que Node est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Build avec le mode production
echo "📦 Build en cours..."
npm run build -- --mode production

# Vérifier que le build a réussi
if [ -d "dist" ]; then
    echo ""
    echo "✅ Build terminé avec succès !"
    echo ""
    echo "📤 UPLOADEZ le contenu de dist/ vers :"
    echo "   /home/najo1022/yarnflow.fr/"
    echo ""
    echo "Fichiers générés :"
    ls -la dist/
    echo ""
    echo "⚠️  N'oubliez pas de vérifier :"
    echo "   - Les variables d'environnement dans .env.production"
    echo "   - Le fichier .htaccess pour la réécriture d'URL"
    echo "   - La configuration HTTPS"
else
    echo "❌ Erreur lors du build"
    exit 1
fi
