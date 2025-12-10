# Guide : Système de Codes Beta YarnFlow

## Vue d'ensemble

Le système de codes beta permet de distribuer des accès PRO ou FREE à la beta de YarnFlow via des codes uniques envoyés par email.

## Architecture

```
Waitlist Email → Code Beta → Email avec code → Inscription → Activation automatique
```

## Étapes de déploiement

### 1. Migration de la base de données

Exécutez la migration en production :

```bash
mysql -u votre_user -p yarnflow < database/add_beta_codes.sql
```

Cette migration ajoute à `waitlist_emails` :
- `beta_type` : ENUM('free', 'pro')
- `beta_code` : VARCHAR(32) UNIQUE
- `beta_activated` : BOOLEAN
- `activated_user_id` : INT (FK vers users)
- `activated_at` : TIMESTAMP

### 2. Assignation des types beta

**Option A : Manuellement via phpMyAdmin**
```sql
-- Définir les 20 premiers comme PRO
UPDATE waitlist_emails
SET beta_type = 'pro'
WHERE id IN (1,2,3,...,20);

-- Les autres restent FREE (défaut)
```

**Option B : Via script (recommandé si liste longue)**
Créez un script qui lit une liste d'emails PRO et fait l'UPDATE.

### 3. Génération des codes beta

```bash
cd backend
php scripts/generate-beta-codes.php
```

Options :
- `--type=pro` : Générer uniquement pour les PRO
- `--type=free` : Générer uniquement pour les FREE
- Pas d'option : Générer pour tous

Exemple de sortie :
```
📝 Génération de codes beta pour 50 email(s)...

✅ user1@example.com (pro) -> BETA-A1B2-C3D4
✅ user2@example.com (free) -> BETA-E5F6-G7H8
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Codes générés: 50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Envoi des emails beta

**Test en dry-run** :
```bash
php scripts/send-beta-emails.php --dry-run
```

**Envoi réel** :
```bash
# Envoyer aux PRO uniquement
php scripts/send-beta-emails.php --type=pro

# Envoyer aux FREE uniquement
php scripts/send-beta-emails.php --type=free

# Envoyer à tous
php scripts/send-beta-emails.php
```

Le script :
1. Récupère les emails avec `beta_code` non null
2. Filtre ceux qui n'ont pas déjà reçu l'email
3. Remplace `{{BETA_CODE}}` dans le template
4. Envoie via SMTP `contact@yarnflow.fr`
5. Marque comme envoyé dans la DB
6. Pause de 2s entre chaque envoi

### 5. Workflow utilisateur

1. **Réception email** avec code `BETA-XXXX-XXXX`
2. **Clic sur le bouton** "Créer mon compte PRO" (ou "Créer mon compte")
3. **Redirection** vers `https://yarnflow.fr/register?beta=BETA-XXXX-XXXX`
4. **Page d'inscription** :
   - Affiche un encadré : "🎉 Accès Beta Activé"
   - Montre le code beta
   - Message : "Votre code beta sera appliqué automatiquement"
5. **Remplissage du formulaire** (nom, email, mot de passe)
6. **Soumission** :
   - Frontend envoie `beta_code` dans les données
   - Backend valide le code
   - Backend vérifie que l'email correspond
   - Backend crée le compte
   - **PRO** : `subscription_type = 'pro'`, `expires_at = +1 mois`
   - **FREE** : Plan par défaut
   - Backend marque le code comme utilisé

### 6. Vérifications

**Vérifier qu'un code est utilisé** :
```sql
SELECT email, beta_code, beta_activated, activated_at, activated_user_id
FROM waitlist_emails
WHERE beta_code = 'BETA-XXXX-XXXX';
```

**Lister tous les codes actifs** :
```sql
SELECT email, beta_type, beta_code, beta_activated
FROM waitlist_emails
WHERE beta_code IS NOT NULL
ORDER BY beta_type DESC, created_at ASC;
```

**Vérifier les comptes créés** :
```sql
SELECT u.email, u.subscription_type, u.subscription_expires_at, w.beta_code
FROM users u
JOIN waitlist_emails w ON w.activated_user_id = u.id
WHERE w.beta_activated = 1;
```

## Sécurité

✅ **Code unique** par email (UNIQUE constraint)
✅ **Email validé** lors de l'inscription (doit correspondre au code)
✅ **Usage unique** (beta_activated = true après utilisation)
✅ **Format BETA-XXXX-XXXX** (12 caractères aléatoires)

## Troubleshooting

### Email pas reçu
- Vérifier `beta_email_sent` = 1 dans la DB
- Vérifier les logs SMTP
- Tester en dry-run d'abord

### Code invalide lors de l'inscription
- Vérifier que le code existe : `SELECT * FROM waitlist_emails WHERE beta_code = 'XXX'`
- Vérifier `beta_activated` = 0
- Vérifier que l'email correspond

### Accès PRO pas appliqué
- Vérifier `users.subscription_type` et `subscription_expires_at`
- Vérifier que le code était bien de type 'pro'
- Vérifier les logs backend

## Format des emails

Les templates incluent maintenant :
- **Encadré avec le code** : couleur orange (PRO) ou verte (FREE)
- **Lien direct** : `https://yarnflow.fr/register?beta={{BETA_CODE}}`
- Le code est affiché en grand, en gras, en `monospace`

## Réinitialiser un code (en cas d'erreur)

```sql
UPDATE waitlist_emails
SET beta_activated = 0,
    activated_user_id = NULL,
    activated_at = NULL,
    beta_email_sent = 0
WHERE beta_code = 'BETA-XXXX-XXXX';
```

Puis réenvoyer l'email avec le script.

## Fichiers concernés

### Backend
- `database/add_beta_codes.sql` - Migration DB
- `backend/services/BetaCodeService.php` - Service de gestion
- `backend/controllers/AuthController.php` - Validation lors de l'inscription
- `backend/scripts/generate-beta-codes.php` - Génération des codes
- `backend/scripts/send-beta-emails.php` - Envoi des emails
- `backend/email-templates/beta-pro.html` - Template PRO
- `backend/email-templates/beta-free.html` - Template FREE

### Frontend
- `frontend/src/pages/Register.jsx` - Gestion du paramètre `?beta=XXX`

---

**Date de création** : 2025-12-07
**Version** : 0.12.1
