# Guide de configuration OAuth (Google & Facebook)

Ce guide vous explique comment configurer l'authentification OAuth pour Google et Facebook sur YarnFlow.

## 📋 Table des matières

1. [Configuration Google OAuth](#google-oauth)
2. [Configuration Facebook OAuth](#facebook-oauth)
3. [Variables d'environnement](#variables-denvironnement)
4. [Migration de la base de données](#migration-de-la-base-de-données)

---

## 🔑 Google OAuth

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'**API Google+ API** ou **Google Identity Services**

### Étape 2 : Configurer l'écran de consentement OAuth

1. Dans le menu latéral, allez dans **APIs & Services > OAuth consent screen**
2. Choisissez **External** pour que n'importe qui puisse s'inscrire
3. Remplissez les informations requises :
   - **App name** : YarnFlow
   - **User support email** : votre email
   - **Developer contact** : votre email
4. **Scopes** : Ajoutez les scopes suivants :
   - `email`
   - `profile`
   - `openid`
5. Sauvegardez

### Étape 3 : Créer les identifiants OAuth

1. Allez dans **APIs & Services > Credentials**
2. Cliquez sur **Create Credentials > OAuth Client ID**
3. Type d'application : **Web application**
4. Nom : **YarnFlow Web Client**
5. **Authorized JavaScript origins** :
   ```
   http://localhost:5173
   http://localhost:8000
   https://yarnflow.fr
   ```
6. **Authorized redirect URIs** :
   ```
   http://localhost:5173/auth/google/callback
   https://yarnflow.fr/auth/google/callback
   https://yarnflow.fr/api/auth/google/callback
   ```
7. Cliquez sur **Create**
8. **Copiez le Client ID et le Client Secret** - vous en aurez besoin pour le `.env`

---

## 📘 Facebook OAuth

### Étape 1 : Créer une application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquez sur **My Apps > Create App**
3. Sélectionnez **Consumer** comme type d'app
4. Remplissez les informations :
   - **App Display Name** : YarnFlow
   - **App Contact Email** : votre email
5. Créez l'application

### Étape 2 : Ajouter Facebook Login

1. Dans le tableau de bord de l'app, cliquez sur **Add Product**
2. Sélectionnez **Facebook Login** et cliquez sur **Set Up**
3. Choisissez **Web**
4. **Site URL** : `https://yarnflow.fr`

### Étape 3 : Configurer les paramètres OAuth

1. Dans le menu latéral, allez dans **Facebook Login > Settings**
2. **Valid OAuth Redirect URIs** :
   ```
   http://localhost:5173/auth/facebook/callback
   https://yarnflow.fr/auth/facebook/callback
   https://yarnflow.fr/api/auth/facebook/callback
   ```
3. **Deauthorize Callback URL** : `https://yarnflow.fr/api/auth/facebook/deauthorize`
4. **Data Deletion Request URL** : `https://yarnflow.fr/api/auth/facebook/delete`
5. Sauvegardez

### Étape 4 : Récupérer les identifiants

1. Allez dans **Settings > Basic**
2. **Copiez l'App ID et l'App Secret** - vous en aurez besoin pour le `.env`
3. **Important** : Passez l'application en **Live** mode (pas Development) en haut de la page

---

## ⚙️ Variables d'environnement

Ajoutez ces variables à votre fichier `.env` backend :

```ini
# OAuth Google
GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=https://yarnflow.fr/api/auth/google/callback

# OAuth Facebook
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
FACEBOOK_REDIRECT_URI=https://yarnflow.fr/api/auth/facebook/callback
```

### Pour le développement local :

```ini
# OAuth Google (local)
GOOGLE_CLIENT_ID=votre_client_id_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret_google
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

# OAuth Facebook (local)
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
FACEBOOK_REDIRECT_URI=http://localhost:5173/auth/facebook/callback
```

---

## 🗄️ Migration de la base de données

Exécutez la migration SQL pour ajouter les colonnes OAuth à la table `users` :

```bash
mysql -u root -p patron_maker < database/add_oauth_support.sql
```

Ou via phpMyAdmin :
1. Ouvrez phpMyAdmin
2. Sélectionnez la base de données `patron_maker`
3. Allez dans l'onglet **SQL**
4. Copiez-collez le contenu de `database/add_oauth_support.sql`
5. Exécutez

---

## ✅ Vérification

### Backend

Test de l'API :

```bash
# Obtenir l'URL d'autorisation Google
curl http://localhost:8000/api/auth/google/url

# Obtenir l'URL d'autorisation Facebook
curl http://localhost:8000/api/auth/facebook/url
```

### Frontend

1. Les boutons "Se connecter avec Google" et "Se connecter avec Facebook" doivent apparaître sur la page de connexion
2. Cliquer dessus doit rediriger vers la page d'autorisation du provider
3. Après autorisation, l'utilisateur doit être connecté et redirigé vers le dashboard

---

## 🔒 Sécurité

- **Ne committez JAMAIS** vos credentials OAuth dans Git
- Ajoutez `.env` à votre `.gitignore`
- En production, utilisez HTTPS pour toutes les redirect URIs
- Limitez les domaines autorisés dans les consoles Google et Facebook

---

## 🐛 Dépannage

### "redirect_uri_mismatch" (Google)
- Vérifiez que l'URI de redirection dans `.env` correspond exactement à celle configurée dans Google Cloud Console
- Assurez-vous d'inclure le protocole (`https://`) et le path complet

### "Can't Load URL" (Facebook)
- Vérifiez que l'application Facebook est en mode **Live** (pas Development)
- Vérifiez que les redirect URIs sont correctement configurés dans Facebook Login > Settings

### "Error lors de l'authentification"
- Vérifiez les logs PHP : `backend/logs/error.log` ou Apache error logs
- Vérifiez que la migration SQL a bien été exécutée
- Vérifiez que les variables d'environnement sont chargées correctement

---

## 📚 Ressources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Explained](https://oauth.net/2/)
