# Cron Jobs YarnFlow

Scripts d'automatisation pour les tâches planifiées de YarnFlow.

## 📧 Notifications Email Automatiques

### Description

Le script `send-notifications.php` envoie automatiquement 3 types d'emails :

1. **Onboarding J+3** - Utilisateurs inscrits depuis 3 jours sans aucun projet
   - Sujet : "🎓 Besoin d'aide pour démarrer avec YarnFlow ?"
   - Aide à la prise en main

2. **Réengagement J+14** - Utilisateurs inactifs depuis 14 jours (avec projets)
   - Sujet : "🧵 Votre tricot vous attend !"
   - Rappel personnalisé avec progression du projet

3. **On vous manque J+30** - Utilisateurs inactifs depuis 30 jours
   - Sujet : "💔 Vous nous manquez sur YarnFlow !"
   - Liste des nouvelles fonctionnalités

### Protection anti-spam

- **1 email maximum par type par mois** par utilisateur
- Respect de la préférence `email_notifications` (users.email_notifications = 1)
- Tracking dans la table `email_notifications_sent`

## 🚀 Installation

### 1. Appliquer la migration SQL

```bash
cd /path/to/pattern-maker
mysql -u root -p patron_maker < database/add_email_notifications.sql
```

Cela crée :
- Colonne `email_notifications` dans `users`
- Table `email_notifications_sent` pour le tracking

### 2. Tester le script manuellement

```bash
cd /path/to/pattern-maker/backend
php cron/send-notifications.php
```

### 3. Configurer le cron (production)

Ouvrir crontab :
```bash
crontab -e
```

Ajouter cette ligne (exécution quotidienne à 9h du matin) :
```cron
0 9 * * * /usr/bin/php /chemin/absolu/vers/pattern-maker/backend/cron/send-notifications.php >> /var/log/yarnflow-notifications.log 2>&1
```

**⚠️ Important** : Remplacer `/chemin/absolu/vers/` par le vrai chemin du projet !

### Exemples de planification

```cron
# Tous les jours à 9h00
0 9 * * * /usr/bin/php /path/to/cron/send-notifications.php >> /var/log/yarnflow.log 2>&1

# Tous les jours à 8h30 et 17h00
30 8,17 * * * /usr/bin/php /path/to/cron/send-notifications.php >> /var/log/yarnflow.log 2>&1

# Du lundi au vendredi à 10h00
0 10 * * 1-5 /usr/bin/php /path/to/cron/send-notifications.php >> /var/log/yarnflow.log 2>&1
```

## 📊 Monitoring

### Logs

Les logs sont écrits dans `/var/log/yarnflow-notifications.log` :

```bash
# Voir les derniers logs
tail -f /var/log/yarnflow-notifications.log

# Rechercher les erreurs
grep "❌" /var/log/yarnflow-notifications.log

# Compter les emails envoyés aujourd'hui
grep "$(date +%Y-%m-%d)" /var/log/yarnflow-notifications.log | grep "envoyés"
```

### Vérifier en base de données

```sql
-- Emails envoyés aujourd'hui
SELECT notification_type, COUNT(*) as count
FROM email_notifications_sent
WHERE DATE(sent_at) = CURDATE()
GROUP BY notification_type;

-- Emails envoyés ce mois-ci
SELECT notification_type, COUNT(*) as count, DATE(sent_at) as date
FROM email_notifications_sent
WHERE YEAR(sent_at) = YEAR(NOW())
  AND MONTH(sent_at) = MONTH(NOW())
GROUP BY notification_type, DATE(sent_at)
ORDER BY date DESC;

-- Utilisateurs qui ont désactivé les notifications
SELECT COUNT(*) FROM users WHERE email_notifications = 0;
```

## 🧪 Tests

### Test sur compte spécifique

Pour tester, modifier temporairement un utilisateur :

```sql
-- Simuler un utilisateur inscrit il y a 3 jours sans projet
UPDATE users SET created_at = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE id = 123;
DELETE FROM projects WHERE user_id = 123;

-- Simuler un utilisateur inactif depuis 14 jours
UPDATE users SET last_seen_at = DATE_SUB(NOW(), INTERVAL 14 DAY) WHERE id = 456;

-- Simuler un utilisateur inactif depuis 30 jours
UPDATE users SET last_seen_at = DATE_SUB(NOW(), INTERVAL 30 DAY) WHERE id = 789;
```

Puis exécuter :
```bash
php cron/send-notifications.php
```

## 🔧 Désabonner un utilisateur

### Via SQL
```sql
UPDATE users SET email_notifications = 0 WHERE email = 'user@example.com';
```

### Via API (à implémenter)
TODO: Créer une route `POST /api/user/unsubscribe` pour permettre aux utilisateurs de se désabonner

## 📝 Notes

- Les emails sont envoyés de manière **non-bloquante** via PHPMailer
- SMTP configuré dans `.env` (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)
- Les erreurs sont loggées dans `error_log` PHP
- Le script retourne un code de sortie 0 (succès) ou 1 (erreur) pour le monitoring cron

## 🆘 Dépannage

### Le cron ne s'exécute pas

1. Vérifier que le cron est bien configuré :
   ```bash
   crontab -l
   ```

2. Vérifier les permissions :
   ```bash
   chmod +x backend/cron/send-notifications.php
   ```

3. Tester manuellement avec le user cron :
   ```bash
   sudo -u www-data php backend/cron/send-notifications.php
   ```

### Les emails ne partent pas

1. Vérifier la config SMTP dans `.env`
2. Tester la connexion SMTP (voir EmailService::testConnection())
3. Vérifier les logs d'erreur PHP
4. Vérifier que `email_notifications = 1` pour les utilisateurs cibles

### Trop d'emails envoyés

- Vérifier la contrainte UNIQUE dans `email_notifications_sent`
- Vérifier la condition `YEAR(sent_at) = YEAR(NOW()) AND MONTH(sent_at) = MONTH(NOW())`
