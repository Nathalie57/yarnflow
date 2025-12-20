# Guide de Migration Production v0.15.0 - YarnFlow

**Date:** 2025-12-19
**Version:** 0.15.0
**Nouveautés:** Tags personnalisés, Favoris, Système de satisfaction photos IA

---

## 🎯 Ce qui a changé dans la v0.15.0

### Nouvelles fonctionnalités

1. **Tags personnalisés** (PLUS/PRO uniquement)
   - Nouvelle table : `project_tags`
   - Permet aux utilisateurs de créer leurs propres tags
   - Filtrage multi-tags

2. **Favoris** (tous les plans)
   - Nouvelle colonne : `projects.is_favorite`
   - Marquer des projets comme favoris
   - Filtrer par favoris

3. **Système de satisfaction photos IA**
   - Nouvelles colonnes dans `user_photos` :
     - `satisfaction_rating` (1-5 étoiles)
     - `feedback_comment` (texte libre)
     - `feedback_submitted_at` (timestamp)

4. **Améliorations paiements**
   - Nouvelle colonne : `payments.completed_at`
   - Fix ENUM : `payment_type` inclut maintenant `'photo_credits'`

5. **Compteur de rangs pour projets sans sections**
   - Correction backend : `current_row` autorisé dans `updateProject()`
   - Nouvelle route : `DELETE /api/projects/{id}/rows/{row_id}`

---

## 🔍 Étape 1 : Vérifier l'état de votre base de données

### Sur votre environnement LOCAL (développement)

```bash
cd backend/public
php check_database_schema.php
```

**Résultat attendu** :
```
✅ TOUT EST OK ! Votre base de données est à jour pour la v0.15.0
```

### Sur votre environnement PRODUCTION (via SSH ou terminal cPanel)

**Option A : Via SSH**

```bash
# Se connecter en SSH
ssh username@votre-domaine.com

# Aller dans le dossier
cd public_html/api

# Exécuter le script de vérification
php check_database_schema.php
```

**Option B : Via cPanel > Terminal**

```bash
cd public_html/api
php check_database_schema.php
```

**Option C : Créer un fichier temporaire**

1. Télécharger `check_database_schema.php` via FTP dans votre dossier `public_html/api/`
2. Modifier la ligne de connexion MySQL :
   ```php
   $db = new PDO(
       "mysql:host=localhost;dbname=VOTRE_BASE_PROD;charset=utf8mb4",
       "VOTRE_USER_PROD",
       "VOTRE_PASSWORD_PROD",
       [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
   );
   ```
3. Accéder à `https://votre-domaine.com/api/check_database_schema.php` dans votre navigateur
4. **⚠️ SUPPRIMER LE FICHIER APRÈS** pour des raisons de sécurité !

---

## ⚙️ Étape 2 : Appliquer les migrations

### Si le script de vérification affiche des erreurs

#### Méthode 1 : Via phpMyAdmin (RECOMMANDÉ pour O2switch)

1. **Connexion à phpMyAdmin**
   ```
   cPanel > Bases de données > phpMyAdmin
   ```

2. **Sélectionner votre base de données de production**
   - Cliquer sur le nom de la base dans la liste de gauche

3. **Onglet "Importer"**
   - Cliquer sur **Choisir un fichier**
   - Sélectionner `database/MIGRATION_PRODUCTION_v0.15.0.sql`
   - Format : **SQL**
   - Cliquer sur **Exécuter**

4. **Vérifier l'import**
   - Vous devriez voir : `✅ Migration v0.15.0 terminée avec succès !`
   - Vérifier que les nouvelles tables/colonnes apparaissent

#### Méthode 2 : Via ligne de commande (SSH)

```bash
# Se connecter en SSH
ssh username@votre-domaine.com

# Aller dans le dossier
cd /home/username/

# Télécharger le fichier de migration (via FTP au préalable)
# Ou utiliser wget si vous avez mis le fichier sur un serveur temporaire

# Exécuter la migration
mysql -u VOTRE_USER_PROD -p VOTRE_BASE_PROD < MIGRATION_PRODUCTION_v0.15.0.sql

# Entrer le mot de passe quand demandé
```

#### Méthode 3 : Via terminal cPanel

1. **cPanel > Advanced > Terminal**
2. **Copier la migration dans le dossier** (via FTP)
3. **Exécuter** :
   ```bash
   cd /home/username/
   mysql -u VOTRE_USER_PROD -p VOTRE_BASE_PROD < MIGRATION_PRODUCTION_v0.15.0.sql
   ```

---

## ✅ Étape 3 : Vérifier que tout fonctionne

### 1. Re-vérifier le schéma

```bash
php check_database_schema.php
```

**Résultat attendu** :
```
✅ TOUT EST OK ! Votre base de données est à jour pour la v0.15.0
```

### 2. Tester les nouvelles fonctionnalités

#### Tags personnalisés

1. Se connecter avec un compte PLUS ou PRO
2. Créer un projet
3. Ajouter un tag (ex: "cadeau")
4. Vérifier que le tag apparaît
5. Filtrer par ce tag

**API Test** :
```bash
# Ajouter un tag
curl -X POST https://votre-domaine.com/api/projects/1/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{"tags": ["cadeau", "urgent"]}'

# Lister les tags populaires
curl https://votre-domaine.com/api/user/tags/popular \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### Favoris

1. Se connecter (n'importe quel plan)
2. Créer un projet
3. Marquer comme favori (⭐)
4. Filtrer les favoris

**API Test** :
```bash
# Toggle favori
curl -X PUT https://votre-domaine.com/api/projects/1/favorite \
  -H "Authorization: Bearer VOTRE_TOKEN"

# Filtrer les favoris
curl "https://votre-domaine.com/api/projects?favorite=true" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### Système de satisfaction

1. Générer une photo IA
2. La modale de satisfaction apparaît
3. Noter 1-5 étoiles
4. Ajouter un commentaire (optionnel)
5. Soumettre

**API Test** :
```bash
# Soumettre feedback
curl -X POST https://votre-domaine.com/api/photos/1/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{"rating": 5, "comment": "Super qualité !"}'
```

#### Compteur de rangs sans sections

1. Créer un projet **SANS sections**
2. Incrémenter le compteur (+)
3. Décrémenter le compteur (-)
4. Vérifier qu'il n'y a pas d'erreur 404 ou 500

---

## 📊 Étape 4 : Monitoring post-migration

### Vérifier les logs d'erreurs

**cPanel > Métriques > Erreurs**

Surveiller les erreurs PHP dans les 24h suivant la migration.

### Statistiques de la base

Le script `check_database_schema.php` affiche :
- ✅ Nombre de projets favoris
- ✅ Nombre de tags
- ✅ Top 5 tags les plus utilisés
- ✅ Nombre de photos avec feedback
- ✅ Note moyenne des photos

### Requêtes SQL utiles

```sql
-- Projets favoris par utilisateur
SELECT user_id, COUNT(*) as fav_count
FROM projects
WHERE is_favorite = 1
GROUP BY user_id
ORDER BY fav_count DESC
LIMIT 10;

-- Tags les plus utilisés
SELECT tag_name, COUNT(*) as usage_count
FROM project_tags
GROUP BY tag_name
ORDER BY usage_count DESC
LIMIT 20;

-- Satisfaction moyenne par style
SELECT style_code, AVG(satisfaction_rating) as avg_rating, COUNT(*) as total_votes
FROM user_photos
WHERE satisfaction_rating IS NOT NULL
GROUP BY style_code
ORDER BY avg_rating DESC;

-- Paiements de crédits photos
SELECT COUNT(*) as credits_purchases, SUM(amount) as total_revenue
FROM payments
WHERE payment_type = 'photo_credits' AND status = 'completed';
```

---

## 🚨 Rollback en cas de problème

### Si la migration échoue

1. **Restaurer la sauvegarde**
   - Vous avez fait une sauvegarde avant, n'est-ce pas ? 😅
   - Via phpMyAdmin > Importer > Sélectionner votre backup.sql

2. **Annuler les changements manuellement**

   ```sql
   -- Supprimer la table project_tags
   DROP TABLE IF EXISTS project_tags;

   -- Supprimer la colonne is_favorite
   ALTER TABLE projects DROP COLUMN is_favorite;

   -- Supprimer les colonnes de feedback
   ALTER TABLE user_photos
     DROP COLUMN satisfaction_rating,
     DROP COLUMN feedback_comment,
     DROP COLUMN feedback_submitted_at;

   -- Supprimer la colonne completed_at
   ALTER TABLE payments DROP COLUMN completed_at;
   ```

3. **Restaurer l'ancien code backend**
   - Via Git : `git checkout v0.14.0`
   - Redéployer l'ancienne version

---

## 📝 Checklist de migration

Avant de commencer :
- [ ] Sauvegarder la base de données de production
- [ ] Sauvegarder les fichiers backend de production
- [ ] Tester la migration en LOCAL d'abord
- [ ] Tester la migration en STAGING ensuite
- [ ] Planifier une fenêtre de maintenance (si nécessaire)

Pendant la migration :
- [ ] Exécuter `check_database_schema.php` en PROD
- [ ] Noter les erreurs détectées
- [ ] Exécuter `MIGRATION_PRODUCTION_v0.15.0.sql`
- [ ] Re-vérifier avec `check_database_schema.php`
- [ ] Vérifier les logs d'erreurs

Après la migration :
- [ ] Tester les tags personnalisés
- [ ] Tester les favoris
- [ ] Tester le système de satisfaction
- [ ] Tester le compteur de rangs (projets sans sections)
- [ ] Vérifier les statistiques
- [ ] Monitorer les logs pendant 24h

---

## 🆘 Support

### En cas de problème

1. **Vérifier les logs** : cPanel > Métriques > Erreurs
2. **Vérifier la console navigateur** : F12 > Console
3. **Vérifier les appels API** : F12 > Network

### Contact O2switch

- Email : support@o2switch.fr
- Ticket : Via l'espace client

### Fichiers de debug

Créer un fichier `backend/public/test_v0.15.0.php` :

```php
<?php
require_once __DIR__ . '/../config/database.php';

// Tester la connexion
try {
    $db = App\Config\Database::getInstance()->getConnection();
    echo "✅ Connexion DB OK\n";

    // Tester table project_tags
    $stmt = $db->query("SELECT COUNT(*) as count FROM project_tags");
    echo "✅ Table project_tags: " . $stmt->fetch()['count'] . " tags\n";

    // Tester colonne is_favorite
    $stmt = $db->query("SELECT COUNT(*) as count FROM projects WHERE is_favorite = 1");
    echo "✅ Projets favoris: " . $stmt->fetch()['count'] . "\n";

    echo "\n✅ Tout fonctionne !\n";
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
```

---

## 📚 Références

- **Guide staging** : `GUIDE_STAGING_O2SWITCH.md`
- **Schéma complet** : `database/schema.sql`
- **Tags** : `database/add_project_tags.sql`
- **Favoris** : `database/add_projects_favorite.sql`
- **Feedback** : `database/add_photo_feedback_simple.sql`

---

**Bonne migration ! 🚀**
