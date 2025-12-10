# Correctifs Password Reset - Version FINALE ✅

**Date** : 2025-12-08
**Problèmes corrigés** :
1. ✅ Erreur 500 avec email inexistant
2. ✅ Pas de feedback visuel après soumission
3. ✅ **SMTP debug output dans la réponse JSON** (CRITIQUE)

---

## 📦 Fichiers à uploader (3 fichiers backend)

### Backend - À uploader sur O2Switch

```
1. backend/services/PasswordResetService.php     (ÉCRASER)
2. backend/controllers/PasswordResetController.php (ÉCRASER)
3. backend/services/EmailService.php              (ÉCRASER) ⚠️ NOUVEAU
```

**Chemins FTP O2Switch** :
```
services/PasswordResetService.php
→ /home/najo1022/public_html/api/services/PasswordResetService.php

controllers/PasswordResetController.php
→ /home/najo1022/public_html/api/controllers/PasswordResetController.php

services/EmailService.php
→ /home/najo1022/public_html/api/services/EmailService.php
```

### Corrections dans EmailService.php

**Avant (BUGUÉ)** :
```php
// Debug en mode développement
if (($_ENV['APP_DEBUG'] ?? 'false') === 'true') {
    $this->mailer->SMTPDebug = SMTP::DEBUG_SERVER; // ❌ Sortie vers stdout
}
```

**Après (CORRIGÉ)** :
```php
// Désactiver debug SMTP (les erreurs vont dans error_log)
$this->mailer->SMTPDebug = 0; // ✅ Aucune sortie stdout
```

**Pourquoi c'était cassé** :
- `SMTPDebug = SMTP::DEBUG_SERVER` envoie tout le protocole SMTP vers stdout
- Le frontend recevait `"2025-12-08 12:19:23 SERVER -> CLIENT: 220..."` au lieu de JSON
- Les réponses API étaient corrompues

---

## 🎯 Frontend (déjà déployé normalement)

Si le frontend n'a pas les nouvelles pages, rebuilder :

```bash
cd frontend
npm run build
vercel --prod  # ou git push si Railway
```

**Pages frontend** :
- `frontend/src/pages/ForgotPassword.jsx` (avec spinner animé)
- `frontend/src/pages/ResetPassword.jsx`
- Routes dans `App.jsx`
- Lien "Mot de passe oublié ?" dans `Login.jsx`

---

## ⚡ Déploiement rapide

### Étape 1 : Backend (3 fichiers via FTP - 2 min)

Uploader ces 3 fichiers sur O2Switch :
1. `services/PasswordResetService.php`
2. `controllers/PasswordResetController.php`
3. `services/EmailService.php` ⚠️ **CRUCIAL - Corrige le bug SMTP**

### Étape 2 : Tester immédiatement

Aller sur `/forgot-password` et tester avec n'importe quel email.

---

## ✅ Tests après déploiement

### Test 1 : Email inexistant (ne doit PAS faire erreur)

1. Aller sur `https://yarnflow.fr/forgot-password`
2. Entrer `test-inexistant-123@example.com`
3. Cliquer "Envoyer le lien"
4. ✅ Doit voir le spinner animé
5. ✅ Doit afficher "📧 Email envoyé !"
6. ✅ **Pas de texte SMTP dans la console**
7. ✅ Réponse JSON propre : `{success: true, message: "..."}`

### Test 2 : Email existant

1. Aller sur `/forgot-password`
2. Entrer votre vrai email de test
3. Cliquer "Envoyer le lien"
4. ✅ Spinner visible
5. ✅ Message de succès
6. ✅ Email reçu dans la boîte (si SMTP configuré)

---

## 🔍 Debug console (ce que vous devez voir)

**Avant (BUGUÉ)** :
```
[FORGOT PASSWORD] Réponse:
2025-12-08 12:19:23 SERVER -> CLIENT: 220-casoar.o2switch.net ESMTP...
[FORGOT PASSWORD] Erreur: SyntaxError: Unexpected token '2'
```

**Après (CORRIGÉ)** :
```
[FORGOT PASSWORD] Réponse: {success: true, message: "Un email..."}
[FORGOT PASSWORD] Succès, affichage message
```

---

## 🆘 Si SMTP ne fonctionne toujours pas

**Option 1 : Vérifier les credentials SMTP dans .env**

```ini
SMTP_HOST=casoar.o2switch.net
SMTP_PORT=587
SMTP_USER=contact@yarnflow.fr
SMTP_PASSWORD=votre_mot_de_passe_reel
SMTP_FROM_EMAIL=contact@yarnflow.fr
SMTP_FROM_NAME=YarnFlow
```

**Option 2 : Reset manuel de mot de passe**

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

Exécuter :
```bash
php backend/public/manual-reset.php
```

---

## 📧 Configuration email recommandée

**O2Switch utilise généralement** :
- SMTP Host: `casoar.o2switch.net` (ou `mail.yarnflow.fr`)
- Port: `587` (STARTTLS)
- Auth: `true`

**Testez avec** :
```bash
php backend/public/test-email.php
```

---

## ✨ Résultat final

**Avant** :
- ❌ Erreur 500 avec email inexistant
- ❌ Pas de feedback visuel
- ❌ SMTP debug output dans l'API
- ❌ Frontend reçoit du texte au lieu de JSON

**Après** :
- ✅ Aucune erreur 500
- ✅ Spinner animé pendant l'envoi
- ✅ Message de succès clair
- ✅ Réponses JSON propres
- ✅ Logs console pour debug
- ✅ **SMTP debug désactivé en production**
- ✅ Expérience utilisateur fluide

---

## 🎯 Checklist finale

- [ ] Uploader `services/PasswordResetService.php`
- [ ] Uploader `controllers/PasswordResetController.php`
- [ ] Uploader `services/EmailService.php` ⚠️
- [ ] Tester avec email inexistant
- [ ] Tester avec email existant
- [ ] Vérifier console : pas de texte SMTP
- [ ] Vérifier réception email (si SMTP OK)

---

**Déployez ces 3 fichiers backend et testez immédiatement ! 🚀**

**Ce correctif est CRITIQUE** : sans EmailService.php mis à jour, l'API retournera du texte SMTP au lieu de JSON.
