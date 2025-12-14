# Requêtes SQL - Statistiques Utilisateurs

## 📊 Requête simple : Liste complète

```sql
-- Liste de tous les utilisateurs avec leur email et abonnement
SELECT
    id,
    email,
    subscription_type,
    subscription_status,
    DATE_FORMAT(created_at, '%d/%m/%Y à %H:%i') as date_inscription
FROM users
ORDER BY created_at DESC;
```

---

## 👥 Combien d'utilisateurs par type d'abonnement ?

```sql
SELECT
    subscription_type,
    COUNT(*) as nombre,
    GROUP_CONCAT(email ORDER BY email SEPARATOR ', ') as emails
FROM users
GROUP BY subscription_type
ORDER BY nombre DESC;
```

**Résultat exemple :**
```
subscription_type | nombre | emails
free             | 45     | alice@gmail.com, bob@yahoo.fr, ...
pro              | 12     | julie@gmail.com, marie@hotmail.fr, ...
early_bird       | 8      | sarah@gmail.com, ...
```

---

## 🆕 Nouveaux utilisateurs cette semaine

```sql
SELECT
    email,
    subscription_type,
    DATE_FORMAT(created_at, '%d/%m/%Y à %H:%i') as inscription
FROM users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;
```

---

## 🔥 Utilisateurs actifs (avec projets récents)

```sql
SELECT
    u.email,
    u.subscription_type,
    COUNT(DISTINCT p.id) as nb_projets,
    MAX(p.updated_at) as derniere_activite
FROM users u
INNER JOIN projects p ON u.id = p.user_id
WHERE p.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id, u.email, u.subscription_type
ORDER BY derniere_activite DESC;
```

---

## 📈 Statistiques complètes par utilisateur

```sql
SELECT
    u.id,
    u.email,
    u.subscription_type,
    DATE_FORMAT(u.created_at, '%d/%m/%Y') as inscription,
    DATEDIFF(NOW(), u.created_at) as jours_depuis_inscription,
    COUNT(DISTINCT p.id) as nb_projets,
    COUNT(DISTINCT pr.id) as nb_rangs_tricotes,
    COUNT(DISTINCT ph.id) as nb_photos_ia,
    SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as projets_termines,
    SUM(CASE WHEN p.status = 'in_progress' THEN 1 ELSE 0 END) as projets_en_cours
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN project_rows pr ON p.id = pr.project_id
LEFT JOIN user_photos ph ON u.id = ph.user_id
GROUP BY u.id
ORDER BY nb_projets DESC, u.created_at DESC;
```

---

## 💰 Utilisateurs PRO avec leur statut de paiement

```sql
SELECT
    u.email,
    u.subscription_type,
    u.subscription_status,
    u.subscription_end_date,
    CASE
        WHEN u.subscription_end_date IS NULL THEN 'Pas de fin'
        WHEN u.subscription_end_date < NOW() THEN 'EXPIRÉ'
        WHEN u.subscription_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'Expire bientôt'
        ELSE 'Actif'
    END as etat_abonnement,
    DATE_FORMAT(u.subscription_end_date, '%d/%m/%Y') as date_fin
FROM users u
WHERE u.subscription_type IN ('pro', 'pro_annual', 'early_bird')
ORDER BY u.subscription_end_date ASC;
```

---

## 😴 Utilisateurs inactifs (aucun projet depuis 30j)

```sql
SELECT
    u.email,
    u.subscription_type,
    DATE_FORMAT(u.created_at, '%d/%m/%Y') as inscription,
    COALESCE(MAX(p.updated_at), u.created_at) as derniere_activite,
    DATEDIFF(NOW(), COALESCE(MAX(p.updated_at), u.created_at)) as jours_inactivite
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
GROUP BY u.id
HAVING jours_inactivite >= 30
ORDER BY jours_inactivite DESC;
```

---

## 📧 Export CSV simple (pour mailing)

```sql
-- Tous les emails
SELECT email FROM users ORDER BY email;

-- Emails FREE seulement
SELECT email FROM users WHERE subscription_type = 'free' ORDER BY email;

-- Emails PRO seulement
SELECT email FROM users WHERE subscription_type IN ('pro', 'pro_annual', 'early_bird') ORDER BY email;
```

---

## 🎯 Résumé global

```sql
SELECT
    'Total utilisateurs' as stat,
    COUNT(*) as valeur
FROM users
UNION ALL
SELECT
    CONCAT('Abonnement ', subscription_type),
    COUNT(*)
FROM users
GROUP BY subscription_type
UNION ALL
SELECT
    'Nouveaux 7j',
    COUNT(*)
FROM users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT
    'Nouveaux 30j',
    COUNT(*)
FROM users
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
UNION ALL
SELECT
    'Avec projets',
    COUNT(DISTINCT user_id)
FROM projects
UNION ALL
SELECT
    'Ont utilisé AI Photo Studio',
    COUNT(DISTINCT user_id)
FROM user_photos;
```

---

## 🔍 Utilisation

**Option 1 : Fichier PHP** (plus joli)
```
https://yarnflow.fr/stats-utilisateurs.php
```

**Option 2 : phpMyAdmin**
1. Aller dans phpMyAdmin
2. Sélectionner la base `patron_maker`
3. Onglet "SQL"
4. Copier-coller une des requêtes ci-dessus
5. Cliquer "Exécuter"
6. Export possible en CSV/Excel

---

**Mise à jour** : Décembre 2025
