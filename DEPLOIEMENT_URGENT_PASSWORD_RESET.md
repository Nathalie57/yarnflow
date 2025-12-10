# 🚨 DÉPLOIEMENT URGENT - Réinitialisation de mot de passe

**Date** : 2025-12-07
**Priorité** : CRITIQUE - Des utilisatrices ne peuvent plus se connecter
**Temps estimé** : 15-20 minutes

---

## 📦 Fichiers à déployer

### Backend (6 fichiers + 1 SQL)

```
1. database/add_password_reset.sql                    # Table BDD
2. backend/services/PasswordResetService.php          # Service reset
3. backend/services/EmailService.php                  # Email template ajouté
4. backend/controllers/PasswordResetController.php    # Controller
5. backend/routes/api.php                             # Routes API
6. backend/.env                                       # Ajouter FRONTEND_URL
```

### Frontend (4 fichiers)

```
1. frontend/src/pages/ForgotPassword.jsx             # Page demande reset
2. frontend/src/pages/ResetPassword.jsx              # Page nouveau MDP
3. frontend/src/pages/Login.jsx                      # Lien "Mot de passe oublié"
4. frontend/src/App.jsx                              # Routes
```

---

## ⚡ Déploiement rapide (15 min)

### Étape 1 : Base de données (2 min)

```bash
# Exécuter le SQL sur votre BDD
mysql -u root -p patron_maker < database/add_password_reset.sql

# OU via phpMyAdmin :
# 1. Ouvrir phpMyAdmin
# 2. Sélectionner base "patron_maker"
# 3. Onglet "SQL"
# 4. Copier-coller le contenu de database/add_password_reset.sql
# 5. Exécuter
```

**Vérification** :
```sql
SHOW TABLES LIKE 'password_resets';
-- Doit retourner 1 ligne
```

---

### Étape 2 : Backend PHP (5 min)

#### A. Uploader les fichiers via FTP/SFTP

```
backend/services/PasswordResetService.php    → /api/services/
backend/services/EmailService.php            → /api/services/ (ÉCRASER)
backend/controllers/PasswordResetController.php → /api/controllers/
backend/routes/api.php                       → /api/routes/ (ÉCRASER)
```

#### B. Ajouter FRONTEND_URL dans .env

Éditer `/api/.env` et ajouter :

```ini
# URL du frontend pour les liens de reset
FRONTEND_URL=https://yarnflow.fr
```

**Vérification** :
```bash
# SSH sur le serveur
php -l /path/to/api/services/PasswordResetService.php
# Doit afficher : "No syntax errors detected"
```

---

### Étape 3 : Frontend React (8 min)

#### A. Build

```bash
cd frontend
npm run build
```

#### B. Deploy

**Si Vercel** :
```bash
vercel --prod
```

**Si Railway** :
```bash
git add .
git commit -m "feat: système de réinitialisation de mot de passe"
git push origin main
```

**Si hébergement manuel** (O2Switch frontend) :
```bash
# Uploader tout le contenu de frontend/dist/
# vers /home/yarnflow/public_html/
```

---

## ✅ Vérification rapide

### 1. Tester la demande de reset

1. Aller sur https://yarnflow.fr/login
2. Cliquer sur "Mot de passe oublié ?"
3. Entrer votre email
4. ✅ Doit afficher "Email envoyé !"

### 2. Vérifier l'email

1. Checker votre boîte email
2. ✅ Email "🔑 Réinitialisation de votre mot de passe YarnFlow" reçu
3. ✅ Cliquer sur le bouton fonctionne

### 3. Tester le reset

1. Cliquer sur le lien dans l'email
2. ✅ Page "Nouveau mot de passe" s'affiche
3. Entrer un nouveau mot de passe
4. ✅ "Mot de passe réinitialisé !"
5. ✅ Redirection vers /login
6. ✅ Connexion avec nouveau MDP fonctionne

---

## 🆘 Solution d'urgence - Reset manuel

**Si SMTP pas configuré ou email ne fonctionne pas**, vous pouvez réinitialiser manuellement :

### Via BDD directement

```sql
-- 1. Récupérer l'utilisatrice bloquée
SELECT id, email FROM users WHERE email = 'utilisatrice@email.com';

-- 2. Générer un hash pour "MonNouveauMotDePasse"
-- Utiliser https://phppasswordhash.com/ avec BCrypt
-- Ou via PHP :
-- php -r "echo password_hash('MonNouveauMotDePasse', PASSWORD_BCRYPT);"

-- 3. Mettre à jour le mot de passe
UPDATE users
SET password = '$2y$10$...' -- Hash généré ci-dessus
WHERE id = 123; -- ID de l'utilisatrice

-- 4. Envoyer le nouveau MDP à l'utilisatrice par un autre moyen
```

### Script PHP rapide

Créer `backend/public/reset-manual.php` :

```php
<?php
require_once '../config/Database.php';

$email = 'utilisatrice@email.com';
$newPassword = 'TempPassword123';

$db = App\Config\Database::getInstance()->getConnection();

// Hasher le mot de passe
$hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

// Mettre à jour
$query = "UPDATE users SET password = :password WHERE email = :email";
$stmt = $db->prepare($query);
$stmt->bindValue(':password', $hashedPassword);
$stmt->bindValue(':email', $email);
$stmt->execute();

echo "Mot de passe réinitialisé pour $email\n";
echo "Nouveau mot de passe temporaire : $newPassword\n";
echo "IMPORTANT : Demander à l'utilisatrice de le changer immédiatement !";
```

Exécuter :
```bash
php backend/public/reset-manual.php
```

---

## 🔧 Configuration SMTP (si pas encore fait)

Pour que les emails fonctionnent, ajouter dans `/api/.env` :

```ini
# SMTP Configuration
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=noreply@yarnflow.fr
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM_EMAIL=noreply@yarnflow.fr
SMTP_FROM_NAME=YarnFlow
```

**Providers SMTP recommandés** :
- **Brevo** (ex-Sendinblue) : 300 emails/jour gratuit
- **Mailgun** : 5000 emails/mois gratuit
- **SendGrid** : 100 emails/jour gratuit
- **O2Switch SMTP** : Inclus dans l'hébergement

**Tester SMTP** :
```bash
# Via script test
php backend/public/test-smtp.php
```

---

## 📧 Contacter les utilisatrices bloquées

Une fois déployé, envoyer ce message aux utilisatrices :

> Bonjour,
>
> Nous avons déployé un système de réinitialisation de mot de passe !
>
> **Pour réinitialiser votre mot de passe :**
> 1. Allez sur https://yarnflow.fr/login
> 2. Cliquez sur "Mot de passe oublié ?"
> 3. Entrez votre email
> 4. Suivez les instructions reçues par email
>
> Si vous ne recevez pas l'email sous 5 minutes, vérifiez vos spams ou contactez-nous.
>
> Désolé pour le désagrément ! 🧶
>
> L'équipe YarnFlow

---

## 🐛 Troubleshooting

### "Lien invalide ou expiré"

**Cause** : Le lien est valide seulement 1 heure.
**Solution** : Refaire une demande sur /forgot-password

### "Email non reçu"

**Causes possibles** :
1. SMTP mal configuré → Checker les logs
2. Email dans les spams
3. Email invalide

**Vérifier** :
```bash
# Logs backend
tail -f ~/logs/error_log | grep EMAIL
```

### "Token requis"

**Cause** : URL du lien mal formée
**Solution** : Vérifier que FRONTEND_URL est correct dans .env

---

## 📊 Checklist finale

- [ ] Table `password_resets` créée en BDD
- [ ] Fichiers backend uploadés
- [ ] FRONTEND_URL ajouté dans .env
- [ ] Frontend rebuilt et déployé
- [ ] Test complet du flux fonctionnel
- [ ] SMTP configuré (ou reset manuel disponible)
- [ ] Utilisatrices bloquées contactées

---

**URGENT : Déployez maintenant pour débloquer les utilisatrices !** 🚨
