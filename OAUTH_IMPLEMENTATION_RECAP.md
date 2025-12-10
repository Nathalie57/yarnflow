# ✅ Implémentation OAuth Google & Facebook - Récapitulatif

L'authentification OAuth Google et Facebook a été complètement implémentée pour YarnFlow !

## 📋 Ce qui a été fait

### Backend (PHP)

1. **Migration SQL** : `database/add_oauth_support.sql`
   - Ajout de colonnes `oauth_provider`, `oauth_provider_id`, `oauth_avatar` à la table `users`
   - Le champ `password` devient nullable (pour les utilisateurs OAuth)
   - Index pour optimiser les recherches

2. **Service OAuth** : `backend/services/OAuthService.php`
   - Gestion complète des flows OAuth Google et Facebook
   - Échange de code d'autorisation contre access token
   - Récupération des informations utilisateur

3. **Modèle User** : Nouvelle méthode `findOrCreateOAuthUser()`
   - Crée un nouvel utilisateur ou lie un compte existant
   - Gère intelligemment la fusion de comptes (si email déjà existant)

4. **AuthController** : 4 nouvelles routes
   - `GET /api/auth/google/url` - Obtenir l'URL d'autorisation Google
   - `GET /api/auth/google/callback` - Callback après autorisation Google
   - `GET /api/auth/facebook/url` - Obtenir l'URL d'autorisation Facebook
   - `GET /api/auth/facebook/callback` - Callback après autorisation Facebook

5. **Routes API** : Routes ajoutées dans `backend/routes/api.php`

### Frontend (React)

1. **Page Login** : `frontend/src/pages/Login.jsx`
   - Boutons "Se connecter avec Google" et "Se connecter avec Facebook"
   - Design cohérent avec le reste de l'application
   - Gestion des états de chargement

2. **Page Register** : `frontend/src/pages/Register.jsx`
   - Boutons "S'inscrire avec Google" et "S'inscrire avec Facebook"
   - Même design que Login pour la cohérence

3. **Page Callback** : `frontend/src/pages/OAuthCallback.jsx`
   - Gère le retour après autorisation OAuth
   - Affiche un loader pendant le traitement
   - Redirige automatiquement vers le dashboard après succès
   - Gère les erreurs avec possibilité de retour

4. **Routes** : Routes callback ajoutées dans `frontend/src/App.jsx`
   - `/auth/google/callback`
   - `/auth/facebook/callback`

### Documentation

1. **Guide de configuration** : `OAUTH_SETUP_GUIDE.md`
   - Étapes détaillées pour configurer Google OAuth
   - Étapes détaillées pour configurer Facebook OAuth
   - Configuration des redirect URIs
   - Troubleshooting

2. **Fichier d'exemple .env** : `backend/.env.example`
   - Template complet avec toutes les variables OAuth
   - Commentaires explicatifs

---

## 🚀 Prochaines étapes

### 1. Exécuter la migration SQL

Via phpMyAdmin ou ligne de commande :

```bash
mysql -u root -p patron_maker < database/add_oauth_support.sql
```

### 2. Configurer les credentials OAuth

#### Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un
3. Activez l'API Google Identity Services
4. Configurez l'écran de consentement OAuth (External)
5. Créez des credentials OAuth 2.0 (Web application)
6. Ajoutez les redirect URIs :
   - Local: `http://localhost:5173/auth/google/callback`
   - Prod: `https://yarnflow.fr/auth/google/callback`
7. Copiez le Client ID et Client Secret

#### Facebook OAuth

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Créez une application (type: Consumer)
3. Ajoutez le produit "Facebook Login"
4. Configurez les Valid OAuth Redirect URIs :
   - Local: `http://localhost:5173/auth/facebook/callback`
   - Prod: `https://yarnflow.fr/auth/facebook/callback`
5. Passez l'application en mode "Live"
6. Copiez l'App ID et App Secret

### 3. Mettre à jour le fichier .env backend

```ini
# OAuth Google
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_REDIRECT_URI=https://yarnflow.fr/auth/google/callback

# OAuth Facebook
FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret
FACEBOOK_REDIRECT_URI=https://yarnflow.fr/auth/facebook/callback
```

### 4. Builder et uploader le frontend

```bash
cd frontend
npm run build
```

Uploader le contenu de `frontend/dist/` vers le serveur O2Switch.

### 5. Uploader les fichiers backend

Via FileZilla, uploader :
- `backend/services/OAuthService.php`
- `backend/controllers/AuthController.php`
- `backend/models/User.php`
- `backend/routes/api.php`

### 6. Tester

1. Allez sur https://yarnflow.fr/login
2. Cliquez sur "Google" ou "Facebook"
3. Autorisez l'application
4. Vous devriez être redirigé vers le dashboard, connecté !

---

## 🎨 Design des boutons

Les boutons OAuth suivent les guidelines officielles :
- ✅ Logo Google aux couleurs officielles
- ✅ Logo Facebook bleu #1877F2
- ✅ Design cohérent avec le reste de l'interface
- ✅ États hover et disabled

---

## 🔒 Sécurité

- ✅ Les mots de passe OAuth ne sont pas stockés
- ✅ Les tokens OAuth sont échangés côté serveur (jamais exposés au client)
- ✅ Gestion intelligente de la fusion de comptes
- ✅ Validation des emails par le provider OAuth

---

## 📚 Ressources

- [Guide de configuration détaillé](./OAUTH_SETUP_GUIDE.md)
- [Google OAuth Docs](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Docs](https://developers.facebook.com/docs/facebook-login)

---

## ✨ Fonctionnalités

### Inscription/Connexion rapide
- ✅ Un seul clic pour s'inscrire ou se connecter
- ✅ Pas besoin de mémoriser un mot de passe
- ✅ Email automatiquement vérifié

### Fusion de comptes
- ✅ Si un utilisateur crée un compte classique puis se connecte avec Google/Facebook (même email), les comptes sont automatiquement liés
- ✅ L'utilisateur conserve toutes ses données

### Avatar
- ✅ La photo de profil Google/Facebook est automatiquement récupérée
- ✅ Stockée dans `oauth_avatar` pour affichage futur

---

## 🐛 Dépannage

Si vous rencontrez des erreurs :

1. **"redirect_uri_mismatch"** : Vérifiez que les URIs de redirection sont exactement les mêmes dans la console OAuth et dans `.env`

2. **"Error lors de l'authentification"** : Vérifiez les logs PHP et la console navigateur

3. **"Email non fourni"** : L'utilisateur n'a pas autorisé l'accès à son email. Vérifiez les scopes dans la configuration OAuth.

4. **Page blanche après OAuth** : Vérifiez que les routes callback sont bien ajoutées dans `App.jsx` et que le build est à jour

---

**Implémenté par Claude le 2025-12-05** 🤖
