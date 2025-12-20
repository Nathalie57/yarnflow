#!/bin/bash

# ============================================================================
# Script de sauvegarde de la base de données YarnFlow
# Usage: ./backup_database.sh [local|production]
# ============================================================================

ENVIRONMENT=${1:-local}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "🗄️  Sauvegarde de la base de données YarnFlow"
echo "Environment: $ENVIRONMENT"
echo "Date: $TIMESTAMP"
echo ""

if [ "$ENVIRONMENT" == "local" ]; then
    # Configuration LOCAL
    DB_HOST="127.0.0.1"
    DB_PORT="3306"
    DB_NAME="patron_maker"
    DB_USER="root"
    DB_PASS=""
    BACKUP_FILE="$BACKUP_DIR/yarnflow_local_$TIMESTAMP.sql"

    echo "📦 Sauvegarde de la base de données locale..."
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

elif [ "$ENVIRONMENT" == "production" ]; then
    # Configuration PRODUCTION (à adapter)
    echo "⚠️  PRODUCTION MODE"
    echo ""
    read -p "Nom de la base de données: " DB_NAME
    read -p "Utilisateur MySQL: " DB_USER
    read -sp "Mot de passe MySQL: " DB_PASS
    echo ""

    DB_HOST="localhost"
    BACKUP_FILE="$BACKUP_DIR/yarnflow_prod_$TIMESTAMP.sql"

    echo "📦 Sauvegarde de la base de données de production..."
    mysqldump -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

else
    echo "❌ Environment invalide. Usage: ./backup_database.sh [local|production]"
    exit 1
fi

# Vérifier si la sauvegarde a réussi
if [ $? -eq 0 ]; then
    # Compresser la sauvegarde
    gzip "$BACKUP_FILE"
    COMPRESSED_FILE="$BACKUP_FILE.gz"

    # Afficher la taille
    SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

    echo ""
    echo "✅ Sauvegarde créée avec succès !"
    echo "📁 Fichier: $COMPRESSED_FILE"
    echo "📊 Taille: $SIZE"
    echo ""
    echo "💡 Pour restaurer:"
    echo "   gunzip $COMPRESSED_FILE"
    echo "   mysql -u$DB_USER -p $DB_NAME < $BACKUP_FILE"
else
    echo ""
    echo "❌ Erreur lors de la sauvegarde"
    exit 1
fi
