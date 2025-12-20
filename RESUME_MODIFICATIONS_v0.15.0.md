# Résumé des modifications v0.15.0 - YarnFlow

**Date:** 2025-12-19
**Modifications apportées aujourd'hui**

---

## 🗄️ Modifications de la base de données

### Nouvelles tables

#### 1. `project_tags`
```sql
CREATE TABLE project_tags (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id INT UNSIGNED NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_tag (project_id, tag_name)
);
```

**Fichier SQL:** `database/add_project_tags.sql`

### Nouvelles colonnes

#### 2. `projects.is_favorite`
```sql
ALTER TABLE projects
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE AFTER is_public,
ADD INDEX idx_user_favorite (user_id, is_favorite, updated_at DESC);
```

**Fichier SQL:** `database/add_projects_favorite.sql`

#### 3. Colonnes de feedback dans `user_photos`
```sql
ALTER TABLE user_photos
ADD COLUMN satisfaction_rating TINYINT(1) DEFAULT NULL COMMENT '1-5 étoiles',
ADD COLUMN feedback_comment TEXT DEFAULT NULL,
ADD COLUMN feedback_submitted_at TIMESTAMP NULL DEFAULT NULL;
```

**Fichier SQL:** `database/add_photo_feedback_simple.sql`

#### 4. `payments.completed_at`
```sql
ALTER TABLE payments
ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL AFTER created_at;

-- Mise à jour des paiements existants
UPDATE payments SET completed_at = created_at WHERE status = 'completed';
```

**Fichier SQL:** `database/add_completed_at_to_payments.sql`

#### 5. Fix ENUM `payments.payment_type`
```sql
ALTER TABLE payments
MODIFY COLUMN payment_type ENUM('subscription', 'photo_credits', 'early_bird', 'pattern')
NOT NULL DEFAULT 'subscription';
```

**Fichier SQL:** `database/fix_payment_type_enum.sql`

---

## 🔧 Modifications du code Backend

### 1. Nouvelles routes API

**Routes Tags** (dans `backend/routes/api.php`) :
```php
POST   /api/projects/{id}/tags              // Ajouter tags
GET    /api/projects/{id}/tags              // Lister tags du projet
DELETE /api/projects/{id}/tags/{tag_name}   // Supprimer un tag
GET    /api/user/tags/popular               // Top 20 tags utilisateur
```

**Routes Favoris** :
```php
PUT    /api/projects/{id}/favorite          // Toggle favori
```

**Routes Feedback** :
```php
POST   /api/photos/{id}/feedback            // Soumettre feedback
```

**Nouvelle route pour décrémentation** :
```php
DELETE /api/projects/{id}/rows/{row_id}     // Supprimer un rang
```

### 2. Modifications dans `ProjectController.php`

- **Ligne 509-542** : Nouvelle méthode `deleteRow()`
- **Ligne 480-486** : Support filtrage `section_id` dans `getRows()`

### 3. Modifications dans `Project.php` (model)

- **Ligne 160** : Ajout de `'current_row'` dans les champs autorisés de `updateProject()`
- **Ligne 286-310** : Modification de `getProjectRows()` pour supporter `section_id` (ou IS NULL)
- **Ligne 319-329** : Nouvelle méthode `deleteRow()`

### 4. Nouveaux fichiers backend

- `backend/controllers/AdminController.php` (si pas déjà présent)
- Méthodes pour gérer les tags dans `ProjectController.php`

---

## 🎨 Modifications du code Frontend

### 1. Nouveaux composants

**Fichiers créés** :
- `frontend/src/components/TagInput.jsx` - Input pour ajouter des tags
- `frontend/src/components/TagBadge.jsx` - Badge d'affichage d'un tag
- `frontend/src/components/ProjectFilters.jsx` - Filtres avancés (statut, tags, favoris, tri)
- `frontend/src/components/UpgradePrompt.jsx` - Prompt pour upgrade vers PLUS/PRO
- `frontend/src/components/SatisfactionModal.jsx` - Modal de notation des photos IA

### 2. Pages modifiées

**`frontend/src/pages/MyProjects.jsx`** :
- Intégration du composant `ProjectFilters`
- Ajout du bouton favori (⭐)
- Support du filtrage par tags
- Gestion de l'upgrade prompt pour FREE users

**`frontend/src/pages/ProjectCounter.jsx`** :
- Corrections pour projets sans sections :
  - Ligne 1455-1461 : Mise à jour `project.current_row` lors de l'incrémentation
  - Ligne 1527-1533 : Rollback pour projets sans sections
  - Ligne 1555-1561 : Mise à jour lors de la décrémentation
  - Ligne 1573-1587 : Filtrage corrigé pour trouver le rang à supprimer
  - Ligne 1604-1610 : Rollback décrémentation
- Modale de satisfaction après génération photo IA

**`frontend/src/pages/Gallery.jsx`** :
- Affichage des photos avec notes de satisfaction
- Filtrage par satisfaction (étoiles)

### 3. Services API modifiés

**`frontend/src/services/api.js`** :
- Nouvelles méthodes pour tags
- Nouvelles méthodes pour favoris
- Nouvelles méthodes pour feedback

---

## 📁 Nouveaux fichiers de documentation

### Fichiers créés aujourd'hui

1. **`GUIDE_STAGING_O2SWITCH.md`**
   - Guide complet de déploiement staging sur O2switch
   - Configuration sous-domaine, SSL, base de données
   - Déploiement des fichiers frontend/backend
   - Configuration Apache (.htaccess)

2. **`MIGRATION_PRODUCTION_v0.15.0.sql`**
   - Script de migration pour mettre à jour la production
   - Ajout conditionnel de toutes les tables/colonnes
   - Vérifications finales

3. **`MIGRATION_GUIDE_v0.15.0.md`**
   - Guide étape par étape pour migrer la production
   - Checklist complète
   - Tests de vérification
   - Procédure de rollback

4. **`check_database_schema.php`**
   - Script de vérification du schéma de la base
   - Détecte les tables/colonnes manquantes
   - Affiche des statistiques

5. **`backup_database.sh`**
   - Script de sauvegarde automatique
   - Support local et production
   - Compression automatique

6. **`RESUME_MODIFICATIONS_v0.15.0.md`** (ce fichier)
   - Résumé de toutes les modifications

---

## 🧪 Tests à effectuer avant déploiement production

### Backend

- [ ] API Tags : Créer, lister, supprimer
- [ ] API Favoris : Toggle favori
- [ ] API Feedback : Soumettre satisfaction
- [ ] API Rows : Décrémenter compteur (projets sans sections)
- [ ] Vérifier que `current_row` se met à jour correctement

### Frontend

- [ ] Créer un tag (utilisateur PLUS/PRO)
- [ ] Filtrer par tags
- [ ] Marquer un projet comme favori
- [ ] Filtrer les favoris
- [ ] Générer une photo IA et noter
- [ ] Incrémenter compteur (projet sans sections)
- [ ] Décrémenter compteur (projet sans sections)
- [ ] Upgrade prompt pour utilisateur FREE

### Base de données

- [ ] Table `project_tags` existe
- [ ] Colonne `projects.is_favorite` existe
- [ ] Colonnes feedback dans `user_photos` existent
- [ ] Colonne `payments.completed_at` existe
- [ ] ENUM `payment_type` contient `'photo_credits'`

---

## 📊 Statistiques de migration

### Fichiers modifiés

- **Backend** : 3 fichiers (ProjectController.php, Project.php, api.php)
- **Frontend** : 6 fichiers (5 nouveaux composants + 3 pages modifiées)
- **Database** : 5 scripts SQL

### Lignes de code ajoutées (estimation)

- **Backend** : ~150 lignes
- **Frontend** : ~800 lignes
- **SQL** : ~200 lignes
- **Documentation** : ~2000 lignes

### Tables/Colonnes ajoutées

- **Nouvelles tables** : 1 (`project_tags`)
- **Nouvelles colonnes** : 5
  - `projects.is_favorite`
  - `user_photos.satisfaction_rating`
  - `user_photos.feedback_comment`
  - `user_photos.feedback_submitted_at`
  - `payments.completed_at`

---

## 🚀 Ordre de déploiement recommandé

### 1. Préparation

```bash
# Sauvegarder la base de données
./backup_database.sh production

# Vérifier le schéma actuel
php backend/public/check_database_schema.php
```

### 2. Base de données

```bash
# Exécuter la migration
mysql -u user -p database < database/MIGRATION_PRODUCTION_v0.15.0.sql

# Vérifier que tout est OK
php backend/public/check_database_schema.php
```

### 3. Backend

```bash
# Déployer les fichiers modifiés
- backend/controllers/ProjectController.php
- backend/models/Project.php
- backend/routes/api.php
```

### 4. Frontend

```bash
# Builder le frontend
cd frontend
npm run build

# Déployer dist/ vers la production
```

### 5. Vérification

```bash
# Tester les nouvelles routes
curl https://production.com/api/user/tags/popular
curl https://production.com/api/projects?favorite=true
```

---

## 🔗 Liens utiles

- **Guide complet de migration** : `MIGRATION_GUIDE_v0.15.0.md`
- **Guide staging O2switch** : `GUIDE_STAGING_O2SWITCH.md`
- **Documentation CLAUDE** : `CLAUDE.md`

---

**Fin du résumé - v0.15.0**
