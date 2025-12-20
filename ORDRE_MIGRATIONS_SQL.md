# Ordre d'importation des migrations SQL - YarnFlow

**Version:** 0.16.0
**Date:** 2025-12-20

---

## ⚠️ ORDRE CRITIQUE - NE PAS MODIFIER

Les fichiers SQL doivent être importés **EXACTEMENT dans cet ordre** pour éviter les erreurs de dépendances (foreign keys, tables inexistantes, etc.).

---

## 📋 Ordre correct d'importation

```sql
1.  database/schema.sql                           -- Schéma de base (users, projects, etc.)
2.  database/add_projects_system.sql              -- Système de projets complet
3.  database/add_knitting_types.sql               -- Types tricot/crochet
4.  database/add_ai_photo_studio_notriggers.sql   -- ⚠️ Crée table user_photos (AVANT add_parent_photo_id!)
5.  database/add_parent_photo_id.sql              -- ⚠️ Modifie user_photos (APRÈS add_ai_photo_studio!)
6.  database/add_project_sections.sql             -- Sections de projets
7.  database/add_section_time_tracking.sql        -- Tracking temps sections
8.  database/add_waitlist.sql                     -- Waitlist early bird
9.  database/update_subscription_plans.sql        -- Plans PLUS/PRO
10. database/add_pattern_library.sql              -- Bibliothèque de patrons
11. database/add_project_tags.sql                 -- Tags personnalisés (v0.15.0)
12. database/add_projects_favorite.sql            -- Favoris projets (v0.15.0)
13. database/add_photo_feedback_simple.sql        -- Satisfaction photos IA (v0.15.0)
14. database/add_completed_at_to_payments.sql     -- Date complétion paiements (v0.15.0)
15. database/add_contact_messages.sql             -- Système de contact (v0.16.0)
```

---

## 🚨 Points critiques

### Migration 4-5 : AI Photo Studio
**ERREUR SI MAL ORDONNÉ :**
```
#1146 - La table 'user_photos' n'existe pas
```

**SOLUTION :**
- `add_ai_photo_studio_notriggers.sql` (position 4) **CRÉE** la table `user_photos`
- `add_parent_photo_id.sql` (position 5) **MODIFIE** cette table
- ⚠️ Si vous inversez, vous aurez l'erreur ci-dessus !

### Migration 11-12-13-14 : v0.15.0
Ces 4 migrations sont indépendantes mais doivent venir après les tables de base.

### Migration 15 : v0.16.0
Système de contact, indépendant des autres mais nécessite `users` (créée dans schema.sql).

---

## 🛠️ Si vous avez déjà importé dans le mauvais ordre

### Situation 1 : Erreur sur add_parent_photo_id.sql

```sql
-- Vous avez cette erreur :
#1146 - La table 'user_photos' n'existe pas

-- Solution :
1. Importez d'abord add_ai_photo_studio_notriggers.sql
2. Puis réessayez add_parent_photo_id.sql
```

### Situation 2 : Base de données partiellement importée

```sql
-- Vérifier quelles tables existent déjà
SHOW TABLES;

-- Vérifier si user_photos existe
SHOW TABLES LIKE 'user_photos';

-- Si user_photos existe, vous pouvez passer add_ai_photo_studio_notriggers.sql
-- Sinon, importez-le en premier
```

### Situation 3 : Recommencer from scratch (⚠️ PERD TOUTES LES DONNÉES)

```sql
-- Dans phpMyAdmin, sélectionner la base de données
-- Onglet "Opérations" > "Supprimer la base de données"
-- Recréer la base de données vide
-- Réimporter dans l'ordre correct (1-15)
```

---

## ✅ Vérification après import

### Vérifier que toutes les tables existent

```sql
-- Devrait retourner ~25 tables
SHOW TABLES;

-- Tables critiques qui DOIVENT exister :
SELECT 'users' as table_name FROM users LIMIT 0
UNION ALL SELECT 'projects' FROM projects LIMIT 0
UNION ALL SELECT 'project_rows' FROM project_rows LIMIT 0
UNION ALL SELECT 'project_sections' FROM project_sections LIMIT 0
UNION ALL SELECT 'user_photos' FROM user_photos LIMIT 0
UNION ALL SELECT 'user_photo_credits' FROM user_photo_credits LIMIT 0
UNION ALL SELECT 'payments' FROM payments LIMIT 0
UNION ALL SELECT 'project_tags' FROM project_tags LIMIT 0
UNION ALL SELECT 'contact_messages' FROM contact_messages LIMIT 0
UNION ALL SELECT 'contact_rate_limit' FROM contact_rate_limit LIMIT 0;
```

### Vérifier les colonnes critiques

```sql
-- Vérifier parent_photo_id dans user_photos (migration 5)
SHOW COLUMNS FROM user_photos LIKE 'parent_photo_id';

-- Vérifier is_favorite dans projects (migration 12)
SHOW COLUMNS FROM projects LIKE 'is_favorite';

-- Vérifier completed_at dans payments (migration 14)
SHOW COLUMNS FROM payments LIKE 'completed_at';
```

---

## 📊 Liste complète des tables (v0.16.0)

Après toutes les migrations, vous devez avoir ces tables :

```
✅ users
✅ projects
✅ project_rows
✅ project_sections
✅ project_stats
✅ project_tags
✅ patterns
✅ pattern_library
✅ user_photos
✅ user_photo_credits
✅ payments
✅ waitlist_entries
✅ contact_messages
✅ contact_rate_limit
✅ password_resets (si activé)
+ autres tables selon config
```

---

## 🔄 Migrations alternatives

### Si vous utilisez add_ai_photo_studio.sql (avec triggers)

Remplacer la migration 4 par :
```
4. database/add_ai_photo_studio.sql  (au lieu de add_ai_photo_studio_notriggers.sql)
```

**Différence :**
- `add_ai_photo_studio.sql` : Inclut des triggers MySQL
- `add_ai_photo_studio_notriggers.sql` : Version sans triggers (recommandée)

### Si vous utilisez add_projects_system_notriggers.sql

Remplacer la migration 2 par :
```
2. database/add_projects_system_notriggers.sql
```

---

## 💡 Conseils

1. **Importez UN fichier à la fois** dans phpMyAdmin
2. **Vérifiez les erreurs** après chaque import
3. **Ne sautez AUCUN fichier** même si le nom semble optionnel
4. **Notez les numéros** au fur et à mesure (cochez-les dans cette liste)
5. **En cas d'erreur**, lisez le message et référez-vous à ce guide

---

## 🆘 Erreurs courantes

### Erreur : Table already exists
```
#1050 - La table 'xxx' existe déjà
```
→ Normal si vous réimportez. Utilisez `DROP TABLE IF EXISTS` ou ignorez.

### Erreur : Cannot add foreign key constraint
```
#1215 - Cannot add foreign key constraint
```
→ La table référencée n'existe pas encore. Vérifiez l'ordre d'import.

### Erreur : Unknown column
```
#1054 - Unknown column 'xxx' in 'field list'
```
→ Une migration précédente n'a pas été importée. Revenez en arrière.

---

**Bon import ! 🚀**

Si vous rencontrez un problème, vérifiez d'abord cet ordre avant de chercher ailleurs.
