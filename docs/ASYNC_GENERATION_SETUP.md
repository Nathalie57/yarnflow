# 🚀 Installation du système de génération asynchrone

**Date** : 2025-11-14
**Version** : 1.0.0
**Auteur** : Claude Code (Anthropic)

---

## 📋 Vue d'ensemble

Le système de génération asynchrone permet de générer les patrons en arrière-plan via une queue de jobs, évitant ainsi le blocage de l'interface utilisateur pendant 5-15 secondes.

### Avantages

✅ **UX améliorée** : L'utilisateur n'attend plus sur une page bloquée
✅ **Fiabilité** : Retry automatique en cas d'échec (3 tentatives)
✅ **Scalabilité** : Possibilité de lancer plusieurs workers en parallèle
✅ **Monitoring** : Logs détaillés et statistiques de la queue
✅ **Validation** : Vérification automatique du contenu généré

---

## 🗄️ 1. Installation de la base de données

### Exécuter le script SQL

```bash
mysql -u root -p patron_maker < database/add_jobs_table.sql
```

### Vérifier l'installation

```bash
mysql -u root -p patron_maker -e "SHOW TABLES LIKE 'jobs'; SHOW TABLES LIKE 'pattern_jobs';"
```

Vous devriez voir :
```
+----------------------------+
| Tables_in_patron_maker     |
+----------------------------+
| jobs                       |
+----------------------------+
+----------------------------+
| Tables_in_patron_maker     |
+----------------------------+
| pattern_jobs               |
+----------------------------+
```

---

## ⚙️ 2. Configuration

Aucune configuration supplémentaire nécessaire dans le `.env`. Le système utilise les mêmes clés API que la génération synchrone.

---

## 🔧 3. Démarrage du worker

### Option A : Lancement manuel (développement)

```bash
cd backend
php bin/worker.php
```

**Output attendu :**
```
╔════════════════════════════════════════════╗
║   🧶 Crochet Hub - Pattern Worker 🧶     ║
╚════════════════════════════════════════════╝

🚀 Démarrage du worker...
⏱️  Intervalle de polling : 5s
🔄 Appuyez sur Ctrl+C pour arrêter proprement

──────────────────────────────────────────────────

📊 Stats de la queue :
   - En attente : 0
   - En cours : 0
   - Complétés : 0
   - Échoués : 0

──────────────────────────────────────────────────
```

### Option B : Lancement avec intervalle personnalisé

```bash
# Vérifier toutes les 2 secondes (mode intensif)
php bin/worker.php --sleep 2

# Vérifier toutes les 10 secondes (mode économie)
php bin/worker.php --sleep 10
```

### Option C : Lancement en arrière-plan (production)

```bash
# Lancer le worker en daemon
nohup php bin/worker.php > logs/worker.log 2>&1 &

# Voir le PID du worker
echo $!

# Vérifier que le worker tourne
ps aux | grep worker.php
```

### Option D : Avec Supervisor (recommandé en production)

**Installer Supervisor :**
```bash
sudo apt-get install supervisor
```

**Créer `/etc/supervisor/conf.d/crochet-hub-worker.conf` :**
```ini
[program:crochet-hub-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/patron-maker/backend/bin/worker.php --sleep 5
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/patron-maker/logs/worker.log
stopwaitsecs=3600
```

**Démarrer avec Supervisor :**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start crochet-hub-worker:*
sudo supervisorctl status
```

---

## 🔍 4. Vérification du fonctionnement

### Test complet

1. **Lancer le worker** :
   ```bash
   php bin/worker.php
   ```

2. **Dans un autre terminal, générer un patron** via le frontend ou avec curl :
   ```bash
   curl -X POST http://localhost:8000/api/patterns/generate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "type": "hat",
       "level": "beginner",
       "size": "adulte"
     }'
   ```

3. **Observer les logs du worker** :
   ```
   [2025-11-14 10:30:15] [INFO] [worker_12345] Job #1 réservé (tentative 1/3)
   [2025-11-14 10:30:15] [INFO] [worker_12345] Génération du patron #42 pour utilisateur #1
   [2025-11-14 10:30:28] [INFO] [worker_12345] Job #1 complété avec succès en 13.2s
   ```

4. **Vérifier dans la base de données** :
   ```sql
   SELECT * FROM jobs ORDER BY id DESC LIMIT 1;
   SELECT * FROM patterns WHERE id = 42;
   ```

---

## 📊 5. Monitoring

### Vérifier les stats de la queue

```bash
mysql -u root -p patron_maker -e "
SELECT
    status,
    COUNT(*) as count
FROM jobs
GROUP BY status;
"
```

### Voir les jobs en erreur

```bash
mysql -u root -p patron_maker -e "
SELECT
    id,
    type,
    attempts,
    error_message,
    created_at
FROM jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
"
```

### Voir les jobs bloqués

```bash
mysql -u root -p patron_maker -e "
SELECT
    id,
    type,
    reserved_by,
    reserved_at,
    TIMESTAMPDIFF(MINUTE, reserved_at, NOW()) as minutes_stuck
FROM jobs
WHERE status = 'processing'
AND reserved_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE);
"
```

---

## 🧹 6. Maintenance

### Nettoyer les vieux jobs complétés

Le système nettoie automatiquement les jobs > 7 jours. Pour un nettoyage manuel :

```sql
DELETE FROM jobs
WHERE status = 'completed'
AND completed_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Relancer les jobs échoués

```sql
-- Remettre en pending avec reset des tentatives
UPDATE jobs
SET status = 'pending',
    attempts = 0,
    available_at = NOW(),
    reserved_at = NULL,
    reserved_by = NULL
WHERE status = 'failed';
```

### Libérer les jobs bloqués manuellement

```sql
UPDATE jobs
SET status = 'pending',
    reserved_at = NULL,
    reserved_by = NULL,
    available_at = NOW()
WHERE status = 'processing'
AND reserved_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE);
```

---

## 🐛 7. Dépannage

### Le worker ne démarre pas

**Erreur : "Extension pcntl not installed"**
```bash
# Installer pcntl (Ubuntu/Debian)
sudo apt-get install php-dev
sudo pecl install pcntl

# Vérifier l'installation
php -m | grep pcntl
```

**Erreur : "Permission denied"**
```bash
chmod +x backend/bin/worker.php
```

### Les jobs restent en "pending"

1. **Vérifier que le worker tourne** :
   ```bash
   ps aux | grep worker.php
   ```

2. **Vérifier les logs** :
   ```bash
   tail -f logs/worker.log
   ```

3. **Vérifier la connexion à la base** :
   ```bash
   php -r "require 'backend/config/Database.php'; \$db = new App\Config\Database(); echo 'OK';"
   ```

### Les patrons ne se génèrent pas

1. **Vérifier les clés API** dans `.env` :
   ```ini
   ANTHROPIC_API_KEY=sk-ant-...
   AI_PROVIDER=claude
   ```

2. **Tester l'API manuellement** :
   ```bash
   php -r "
   require 'backend/vendor/autoload.php';
   \$dotenv = Dotenv\Dotenv::createImmutable('backend/config');
   \$dotenv->load();
   \$service = new App\Services\AIPatternService();
   var_dump(\$service->testConnection());
   "
   ```

3. **Vérifier les erreurs dans les jobs** :
   ```sql
   SELECT error_message FROM jobs WHERE status = 'failed' ORDER BY id DESC LIMIT 5;
   ```

---

## 📈 8. Performance

### Recommandations

| Charge | Workers | Sleep (sec) | Description |
|--------|---------|-------------|-------------|
| **Faible** (< 10 patrons/jour) | 1 | 10 | Économie de ressources |
| **Moyenne** (10-100/jour) | 2 | 5 | Équilibré |
| **Élevée** (100-1000/jour) | 4-8 | 2 | Haute performance |
| **Très élevée** (> 1000/jour) | 10+ | 1 | Utiliser Redis au lieu de MySQL |

### Optimisation pour forte charge

Si vous dépassez 1000 patrons/jour, envisagez :

1. **Migrer vers Redis** pour la queue (plus performant que MySQL)
2. **Load balancer** pour distribuer les workers sur plusieurs serveurs
3. **CDN** pour servir les PDFs générés
4. **Cache** des templates les plus utilisés

---

## ✅ Checklist de déploiement

- [ ] Tables `jobs` et `pattern_jobs` créées
- [ ] Script `bin/worker.php` exécutable
- [ ] Extension `pcntl` installée (optionnel mais recommandé)
- [ ] Worker démarre sans erreur
- [ ] Test de génération réussi
- [ ] Supervisor configuré (production)
- [ ] Logs rotatifs configurés
- [ ] Monitoring en place

---

## 🔗 Liens utiles

- [Documentation complète](../CLAUDE.md)
- [Guide de test](../GUIDE_TEST_COMPLET.md)
- [Architecture backend](./guides/PERSONNALISATION_AVANCEE_BACKEND.md)

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-11-14
