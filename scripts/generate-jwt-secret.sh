#!/bin/bash
# Génère un JWT secret sécurisé pour production

echo "🔐 Génération d'un JWT Secret sécurisé..."
echo ""

JWT_SECRET=$(openssl rand -base64 32)

echo "✅ JWT Secret généré :"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$JWT_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 À copier dans Railway > Variables > JWT_SECRET"
echo ""
echo "⚠️  ATTENTION : Ne partagez JAMAIS cette clé !"
echo "⚠️  Gardez-la confidentielle et stockez-la en sécurité."
