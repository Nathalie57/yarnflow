# 🚀 Guide rapide : Google OAuth pour YarnFlow

**Temps estimé : 10-15 minutes**

---

## ✅ Étape 1 : Migration SQL (2 min)

Dans phpMyAdmin sur O2Switch :

1. Sélectionnez votre base de données
2. Allez dans l'onglet **SQL**
3. Copiez-collez ce code :

```sql
ALTER TABLE `users`
ADD COLUMN `oauth_provider` ENUM('google', 'facebook') NULL AFTER `password`,
ADD COLUMN `oauth_provider_id` VARCHAR(255) NULL AFTER `oauth_provider`,
ADD COLUMN `oauth_avatar` VARCHAR(500) NULL AFTER `oauth_provider_id`,
MODIFY COLUMN `password` VARCHAR(255) NULL;

ALTER TABLE `users`
ADD UNIQUE INDEX `idx_oauth_provider` (`oauth_provider`, `oauth_provider_id`);

SELECT 'Migration OAuth terminée avec succès !' AS message;
```

4. Cliquez sur **Exécuter**

✅ **Résultat** : Vous devez voir "Migration OAuth terminée avec succès !"

---

## 🔑 Étape 2 : Créer le projet Google (5 min)

### A. Créer le projet

1. Allez sur : https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google
3. Cliquez sur le **sélecteur de projet** (en haut)
4. Cliquez sur **"NOUVEAU PROJET"**
5. Nom : `YarnFlow`
6. Cliquez sur **"CRÉER"**
7. Sélectionnez le projet créé

### B. Configurer l'écran de consentement

1. Menu latéral : **APIs & Services** > **OAuth consent screen**
2. Type : **External**
3. Cliquez **"CREATE"**

**Page 1 - Informations :**
- **App name** : `YarnFlow`
- **User support email** : Votre email
- **Application home page** : `https://yarnflow.fr`
- **Application privacy policy** : `https://yarnflow.fr/privacy`
- **Application terms** : `https://yarnflow.fr/cgu`
- **Authorized domains** : `yarnflow.fr`
- **Developer contact** : Votre email
- Cliquez **"SAVE AND CONTINUE"**

**Page 2 - Scopes :**
- Cliquez **"ADD OR REMOVE SCOPES"**
- Cochez ces 3 scopes :
  - ✅ `.../auth/userinfo.email`
  - ✅ `.../auth/userinfo.profile`
  - ✅ `openid`
- Cliquez **"UPDATE"**
- Cliquez **"SAVE AND CONTINUE"**

**Page 3 - Test users :**
- Ignorez (ou ajoutez votre email si vous voulez)
- Cliquez **"SAVE AND CONTINUE"**

**Page 4 - Summary :**
- Vérifiez
- Cliquez **"BACK TO DASHBOARD"**

### C. Créer les credentials

1. Menu latéral : **APIs & Services** > **Credentials**
2. Cliquez **"CREATE CREDENTIALS"** > **"OAuth client ID"**

**Configuration :**
- **Application type** : `Web application`
- **Name** : `YarnFlow Web Client`

**Authorized JavaScript origins :**
- Cliquez **"ADD URI"** : `https://yarnflow.fr`
- Cliquez **"ADD URI"** : `http://localhost:5173`

**Authorized redirect URIs :**
- Cliquez **"ADD URI"** : `https://yarnflow.fr/auth/google/callback`
- Cliquez **"ADD URI"** : `http://localhost:5173/auth/google/callback`

3. Cliquez **"CREATE"**

### D. Copier les credentials

📋 **IMPORTANT** : Une popup affiche :
- **Client ID** : `123456789-xxxxxx.apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-xxxxxxxxxxxx`

**Copiez ces deux valeurs !**

---

## ⚙️ Étape 3 : Configuration backend (1 min)

Éditez votre fichier `backend/.env` sur le serveur :

```ini
# OAuth Google
GOOGLE_CLIENT_ID=votre_client_id_ici.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_REDIRECT_URI=https://yarnflow.fr/auth/google/callback
```

**Important** : Remplacez par vos vraies valeurs !

---

## 📦 Étape 4 : Builder et uploader (5 min)

### A. Builder le frontend

Sur votre PC :
```bash
cd /mnt/d/wamp64/www/pattern-maker/frontend
npm run build
```

### B. Uploader via FileZilla

**Frontend :**
- Local : `frontend/dist/*` (tout le contenu)
- Serveur : `/www/yarnflow.fr/`
- ⚠️ Remplacez tout

**Backend :**
- `backend/services/OAuthService.php` → `/www/yarnflow.fr/api/services/`
- `backend/controllers/AuthController.php` → `/www/yarnflow.fr/api/controllers/`
- `backend/models/User.php` → `/www/yarnflow.fr/api/models/`
- `backend/routes/api.php` → `/www/yarnflow.fr/api/routes/`

---

## ✅ Étape 5 : Test (1 min)

1. Allez sur : https://yarnflow.fr/login
2. Cliquez sur **"Continuer avec Google"**
3. Autorisez l'application
4. 🎉 Vous devriez être connecté et redirigé vers le dashboard !

---

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"
➡️ Vérifiez que dans `.env` :
```ini
GOOGLE_REDIRECT_URI=https://yarnflow.fr/auth/google/callback
```
Correspond EXACTEMENT à l'URI dans Google Cloud Console.

### Erreur "Connexion en cours..." sans fin
➡️ Ouvrez la console du navigateur (F12) et regardez les erreurs.

### Erreur 404 sur /auth/google/callback
➡️ Le frontend n'est pas buildé ou pas uploadé correctement.

### Page blanche
➡️ Vérifiez que tous les fichiers backend ont été uploadés.

---

## 📝 Checklist finale

- [ ] Migration SQL exécutée
- [ ] Projet Google créé
- [ ] Écran de consentement configuré
- [ ] Credentials OAuth créés
- [ ] Client ID et Secret copiés
- [ ] `.env` mis à jour avec les bonnes valeurs
- [ ] Frontend buildé et uploadé
- [ ] Fichiers backend uploadés
- [ ] Test réussi sur https://yarnflow.fr/login

---

**🎉 Une fois tout validé, l'authentification Google est prête pour votre beta !**

Plus tard, si vous voulez ajouter Facebook, le code backend est déjà prêt, il suffira juste de :
1. Configurer Facebook OAuth
2. Rajouter les boutons Facebook dans Login.jsx et Register.jsx
3. Rebuild + upload
