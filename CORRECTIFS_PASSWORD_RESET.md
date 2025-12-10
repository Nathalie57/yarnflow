# Correctifs Password Reset - Erreur 500 et feedback visuel

**Date** : 2025-12-08
**Problèmes corrigés** :
1. ✅ Erreur 500 avec email inexistant
2. ✅ Pas de feedback visuel après soumission

---

## 📦 Fichiers à uploader (3 fichiers)

### Backend (2 fichiers)

```
1. backend/services/PasswordResetService.php     (ÉCRASER)
2. backend/controllers/PasswordResetController.php (ÉCRASER)
```

**Corrections apportées** :
- ✅ Gestion gracieuse si FRONTEND_URL manque
- ✅ Catch des erreurs d'email séparément
- ✅ Toujours retourner success=true (sécurité)
- ✅ Logs détaillés pour debug
- ✅ Pas d'erreur 500 si email inexistant

### Frontend (1 fichier)

```
3. frontend/src/pages/ForgotPassword.jsx         (ÉCRASER puis rebuild)
```

**Corrections apportées** :
- ✅ Spinner animé pendant l'envoi
- ✅ Logs console pour debug
- ✅ Meilleure gestion des erreurs
- ✅ Message de succès clair

---

## ⚡ Déploiement

### Étape 1 : Backend (2 min)

Uploader via FTP sur O2Switch :

```
services/PasswordResetService.php
→ /home/najo1022/public_html/api/services/PasswordResetService.php

controllers/PasswordResetController.php
→ /home/najo1022/public_html/api/controllers/PasswordResetController.php
```

### Étape 2 : Frontend (5 min)

```bash
cd frontend
npm run build
vercel --prod  # ou git push pour Railway
```

---

## ✅ Tests après déploiement

### Test 1 : Email inexistant (ne doit PAS faire erreur 500)

1. Aller sur `/forgot-password`
2. Entrer `test-inexistant@example.com`
3. Cliquer "Envoyer le lien"
4. ✅ Doit voir le spinner
5. ✅ Doit afficher "Email envoyé !"
6. ✅ PAS d'erreur 500

### Test 2 : Email existant

1. Aller sur `/forgot-password`
2. Entrer votre vrai email
3. Cliquer "Envoyer le lien"
4. ✅ Spinner visible
5. ✅ Message de succès
6. ✅ Email reçu (si SMTP configuré)

---

## 🔍 Debug console

Après les corrections, vous verrez dans la console :

```
[FORGOT PASSWORD] Réponse: {success: true, message: "Un email..."}
[FORGOT PASSWORD] Succès, affichage message
```

Si erreur :
```
[FORGOT PASSWORD] Erreur: AxiosError
[FORGOT PASSWORD] Response: {error: "...", message: "..."}
```

---

## ⚠️ Important : FRONTEND_URL

Assurez-vous que `.env` contient :

```ini
FRONTEND_URL=https://yarnflow.fr
```

Sinon les liens de reset ne fonctionneront pas (mais ça ne fera plus d'erreur 500).

---

## 📧 Si emails ne partent pas

**C'est normal si SMTP n'est pas configuré.**

L'application va quand même :
- ✅ Afficher "Email envoyé !"
- ✅ Créer le token en base
- ✅ Logger l'erreur d'email

**Pour configurer SMTP**, ajoutez dans `.env` :

```ini
SMTP_HOST=smtp.yarnflow.fr
SMTP_PORT=587
SMTP_USER=contact@yarnflow.fr
SMTP_PASSWORD=votre_mot_de_passe
SMTP_FROM_EMAIL=contact@yarnflow.fr
SMTP_FROM_NAME=YarnFlow
```

---

## 🆘 Si SMTP ne fonctionne pas : Reset manuel

Créez `backend/public/manual-reset.php` :

```php
<?php
require_once '../config/Database.php';

$email = 'utilisatrice@email.com';
$newPassword = 'TempPassword123!';

$db = App\Config\Database::getInstance()->getConnection();

$hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);

$query = "UPDATE users SET password = :password WHERE email = :email";
$stmt = $db->prepare($query);
$stmt->bindValue(':password', $hashedPassword);
$stmt->bindValue(':email', $email);
$stmt->execute();

echo "Mot de passe réinitialisé pour $email\n";
echo "Nouveau mot de passe : $newPassword\n";
```

Puis :
```bash
php backend/public/manual-reset.php
```

Envoyez le MDP temporaire à l'utilisatrice par message privé.

---

## ✨ Résultat final

**Avant** :
- ❌ Erreur 500 avec email inexistant
- ❌ Pas de feedback visuel
- ❌ Utilisateur perdu

**Après** :
- ✅ Aucune erreur 500
- ✅ Spinner animé pendant l'envoi
- ✅ Message de succès clair
- ✅ Logs console pour debug
- ✅ Expérience utilisateur fluide

---

**Déployez ces 3 fichiers et testez ! 🚀**
