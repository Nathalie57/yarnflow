# Guide d'optimisation de project_rows

## 📊 Problème

La table `project_rows` peut grossir très rapidement :
- 1 utilisatrice active = ~500 rangs/mois
- 1000 utilisatrices = 6 millions de rangs/an
- Taille : **~1.2 GB/an**

## ✅ Solutions proposées

### Option 1 : Agrégation automatique (Recommandé)

**Principe** : Garder 30 jours de détails, archiver le reste en stats quotidiennes

**Avantages** :
- ✅ Réduit la table de 90% après 3 mois
- ✅ Garde toutes les stats pour les graphiques
- ✅ Transparent pour l'utilisateur
- ✅ Compatible tous hébergeurs

**Installation** :

1. **Importer la table d'agrégation** (une seule fois)
```bash
mysql -u user -p database < database/add_row_aggregation.sql
```

2. **Configurer le CRON** (chaque semaine, dimanche 3h)
```bash
crontab -e
# Ajouter :
0 3 * * 0 cd /path/to/backend && php scripts/archive-old-rows.php >> logs/archive.log 2>&1
```

3. **Test manuel** (première fois)
```bash
cd backend
php scripts/archive-old-rows.php
```

**Résultat attendu** :
```
=== Archivage des rangs anciens ===
Rangs à archiver: 15430
Stats agrégées créées
✅ Archivage terminé avec succès
   - Rangs archivés: 15430
   - Espace libéré: ~3.01 MB

État final:
   - Rangs détaillés (< 30j): 2341
   - Jours archivés: 287
```

---

### Option 2 : Partitionnement MySQL (Avancé)

**Principe** : MySQL sépare automatiquement les données par année

**Avantages** :
- ✅ Transparent pour le code
- ✅ Suppression rapide des vieilles années
- ✅ Performances optimales

**Inconvénients** :
- ⚠️ Nécessite MySQL 5.7+
- ⚠️ Difficile à migrer avec données existantes

**Installation** (UNIQUEMENT si table vide) :
```bash
mysql -u user -p database < database/add_row_partitioning.sql
```

---

### Option 3 : Limite simple (Temporaire)

Si vous ne voulez pas vous embêter maintenant :

**Modifier `backend/models/Project.php`** pour limiter l'historique :
```php
// Dans getProjectRows(), changer le LIMIT
public function getProjectRows(int $projectId, int $limit = 30): array
{
    // Au lieu de 100, limiter à 30 rangs récents
}
```

**Ajouter une suppression automatique** :
```sql
-- Dans un CRON quotidien
DELETE FROM project_rows
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
AND project_id IN (SELECT id FROM projects WHERE status = 'completed')
LIMIT 10000;
```

---

## 📈 Monitoring

**Vérifier la taille de la table** :
```sql
SELECT
    table_name AS "Table",
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)",
    table_rows AS "Rows"
FROM information_schema.TABLES
WHERE table_schema = "patron_maker"
AND table_name = "project_rows";
```

**Compter les rangs par période** :
```sql
SELECT
    CASE
        WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'Recent (< 30d)'
        WHEN created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'Medium (30-90d)'
        ELSE 'Old (> 90d)'
    END as age,
    COUNT(*) as count,
    ROUND(COUNT(*) * 0.2 / 1024, 2) as size_mb
FROM project_rows
GROUP BY age;
```

---

## 🎯 Recommandation finale

**Phase Beta (< 100 utilisatrices)** :
➡️ Rien à faire, la croissance est gérable

**Phase Croissance (100-1000 utilisatrices)** :
➡️ Implémenter **Option 1 : Agrégation** (script CRON)

**Phase Scale (> 1000 utilisatrices)** :
➡️ **Option 1** + **Option 2** (Partitionnement)

---

## 🔧 Migration depuis la version actuelle

**Si vous avez déjà des données** :

1. Tester l'archivage en dry-run :
```bash
php scripts/archive-old-rows.php
```

2. Vérifier que les stats sont bien créées :
```sql
SELECT * FROM project_rows_daily_stats LIMIT 10;
```

3. Comparer avant/après :
```sql
-- Avant
SELECT COUNT(*) FROM project_rows;

-- Après archivage
SELECT
    COUNT(*) as detail_rows FROM project_rows
UNION ALL
SELECT
    SUM(total_rows) as archived_rows FROM project_rows_daily_stats;
```

---

**Questions ?** Consultez `backend/scripts/archive-old-rows.php` pour les détails d'implémentation.
