# Scripts Cron - Emails de Réengagement

## 📧 Emails automatiques

Ce système envoie automatiquement 3 types d'emails de réengagement :

- **J+3** (`onboarding_day3`) : Aide au démarrage pour utilisateurs qui n'ont pas encore créé de projet
- **J+7** (`reengagement_day7`) : Relance pour utilisateurs inactifs depuis 3+ jours
- **J+21** (`need_help_day21`) : Dernière tentative pour utilisateurs très inactifs (14+ jours)

## 🚀 Installation

### 1. Envoi des emails rétroactifs (une seule fois)

Ce script envoie les emails manquants aux utilisateurs existants :

```bash
cd /path/to/backend/cron
php send-retroactive-emails.php
```

**Attention** : Ce script va envoyer TOUS les emails manquants d'un coup.

### 2. Configuration du cron quotidien

```bash
# Emails de réengagement - tous les jours à 10h00
0 10 * * * /usr/bin/php /home/VOTRE_USER/www/pattern-maker/backend/cron/send-engagement-emails.php
```

**Sur o2switch** :
1. Panel o2switch → **Cron jobs**
2. Créer une nouvelle tâche quotidienne à 10h00
3. Remplacer `VOTRE_USER` par votre nom d'utilisateur

## 📊 Logs

Les scripts affichent leur progression en temps réel avec résumé final.

## 🔍 Vérifications

### Tester manuellement
```bash
php send-engagement-emails.php
```

### Vérifier les emails envoyés
```sql
SELECT email_type, COUNT(*) as total, status
FROM emails_sent_log
WHERE email_type IN ('onboarding_day3', 'reengagement_day7', 'need_help_day21')
GROUP BY email_type, status;
```

---

**Créé le** : 2026-01-04
**Version** : 1.0.0
