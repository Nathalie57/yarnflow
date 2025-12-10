# Déploiement des correctifs - 2025-12-07

## 📋 Fichiers modifiés

### Backend (PHP) - 1 fichier

```
backend/services/AIPhotoService.php
```

**Modifications** :
- ✅ Prompt IA optimisé pour préserver l'ouvrage (couleurs, forme, texture)
- ✅ Temperature réduite de 1.0 à 0.7 (moins de variations)
- ✅ Retrait du paramètre non supporté `negativePrompt`

---

### Frontend (React) - 2 fichiers

```
frontend/src/pages/MyProjects.jsx
frontend/src/pages/ProjectCounter.jsx
```

**MyProjects.jsx** :
- ✅ Gestion d'erreurs détaillée pour création de projet (identifie l'étape qui échoue)
- ✅ Indicateurs de progression visuels (Création du projet... / Upload du patron...)
- ✅ Logging complet `[PROJECT CREATE]` pour debug
- ✅ Récupération intelligente si une étape échoue

**ProjectCounter.jsx** :
- ✅ Fix du lightbox (compatibilité string et objet)

---

## 🚀 Comment déployer

### Option A : Déploiement O2Switch (Production - yarnflow.fr)

#### 1. Backend PHP (via FTP/SFTP)

```bash
# Via FileZilla, WinSCP ou ligne de commande
scp backend/services/AIPhotoService.php user@yarnflow.fr:/home/yarnflow/public_html/api/services/
```

OU via FTP :
- Connectez-vous à yarnflow.fr
- Naviguez vers `/home/yarnflow/public_html/api/services/`
- Uploadez `AIPhotoService.php`

#### 2. Frontend React (build + deploy)

```bash
# Depuis /frontend
cd frontend

# Build de production
npm run build

# Le dossier dist/ contient les fichiers compilés
# Déployez-le sur votre hébergement frontend (Vercel/Railway)
```

**Si Vercel** :
```bash
# Depuis /frontend
vercel --prod
```

**Si Railway** :
```bash
# Railway détecte automatiquement les changements sur git push
git add .
git commit -m "fix: amélioration prompt IA + fix lightbox + debug création projet"
git push origin main
# Railway redéploie automatiquement
```

---

### Option B : Déploiement local (Test WAMP)

#### 1. Backend PHP
Rien à faire ! Les fichiers PHP sont déjà à jour dans :
```
D:\wamp64\www\pattern-maker\backend\services\AIPhotoService.php
```

#### 2. Frontend React
```bash
# Depuis /frontend
npm run dev
# Ou si déjà lancé, Hot Module Replacement détectera les changements
```

---

## ✅ Vérification post-déploiement

### Backend (API)
```bash
# Vérifier que le fichier PHP n'a pas d'erreur de syntaxe
php -l backend/services/AIPhotoService.php
# Devrait afficher : "No syntax errors detected"
```

### Frontend

#### Test 1 : Création de projet avec debug
1. Ouvrir la console du navigateur (F12)
2. Créer un projet avec section et patron PDF
3. **Vérifier les logs** `[PROJECT CREATE]` dans la console
4. Si erreur, noter l'étape exacte qui échoue

#### Test 2 : Génération photo IA
1. Uploader une photo d'ouvrage (ex: bonnet rouge)
2. Générer une variante (ex: contexte "cozy_indoor")
3. **Vérifier** que l'ouvrage garde ses couleurs/forme
4. **Vérifier** que l'image s'affiche dans la galerie

#### Test 3 : Lightbox "Voir en grand"
1. Aller sur une photo IA générée
2. Cliquer sur "🔍 Voir en grand"
3. **Vérifier** que l'image s'affiche en plein écran (pas juste overlay sombre)
4. **Tester** zoom +/−, rotation, téléchargement

---

## 📊 Checklist de vérification

**Backend** :
- [ ] Fichier `AIPhotoService.php` uploadé sur le serveur
- [ ] Pas d'erreur PHP dans les logs
- [ ] Génération IA fonctionne

**Frontend** :
- [ ] Build réussi (`npm run build`)
- [ ] Déployé sur production (Vercel/Railway)
- [ ] Pas d'erreur dans la console navigateur
- [ ] Création de projet affiche les étapes de progression
- [ ] Lightbox affiche les images correctement
- [ ] Photos IA générées préservent mieux l'ouvrage

---

## 🔧 En cas de problème

### "Les images IA ne s'affichent toujours pas"

**Vérifier** :
1. Logs backend : `tail -f ~/logs/error_log` (O2Switch)
2. Console frontend : Erreurs JavaScript ?
3. Chemin des images : `uploads/photos/enhanced/` existe et a les bonnes permissions ?

```bash
# SSH sur O2Switch
ls -la /home/yarnflow/public_html/api/public/uploads/photos/enhanced/
# Doit afficher les fichiers .jpg récents

# Si problème de permissions :
chmod 755 /home/yarnflow/public_html/api/public/uploads/photos/enhanced/
```

---

### "L'IA modifie encore trop l'ouvrage"

**Solution** : Réduire encore la temperature

Éditer `backend/services/AIPhotoService.php` ligne 241 :
```php
'temperature' => 0.5, // Au lieu de 0.7
```

Ou ajouter plus de contraintes au prompt (ligne 187-194).

---

### "Le lightbox ne fonctionne toujours pas"

**Vérifier** :
1. Le frontend a bien été rebuilé (`npm run build`)
2. Le nouveau code est déployé (vider le cache navigateur : Ctrl+F5)
3. Console : erreurs JavaScript ?

---

## 📝 Notes importantes

### Différences Production vs Local

**VITE_API_URL** :
- Local : `http://localhost:8000/api`
- Production : `https://yarnflow.fr/api`

**Vérifier** `.env.production` avant le build :
```bash
cat frontend/.env.production
# Doit contenir :
# VITE_API_URL=https://yarnflow.fr/api
# VITE_BACKEND_URL=https://yarnflow.fr/api
```

### Cache navigateur

Après déploiement frontend, les utilisateurs peuvent avoir l'ancienne version en cache.

**Solutions** :
1. Vercel/Railway gère automatiquement le cache-busting (hash dans les noms de fichiers)
2. Si problème : Demander aux utilisateurs de vider le cache (Ctrl+F5)

---

## 📦 Commandes complètes de déploiement

### Scénario complet : Local → Production

```bash
# 1. Vérifier que les modifications sont OK localement
cd /mnt/d/wamp64/www/pattern-maker

# 2. Build frontend
cd frontend
npm run build
# ✅ Dossier dist/ créé avec les fichiers compilés

# 3. Déployer frontend (Vercel exemple)
vercel --prod
# ✅ Frontend déployé

# 4. Déployer backend PHP (FTP exemple)
cd ../backend
scp services/AIPhotoService.php user@yarnflow.fr:/home/yarnflow/public_html/api/services/
# ✅ Backend déployé

# 5. Tester en production
# Ouvrir https://yarnflow.fr
# Tester création projet + génération IA + lightbox
```

---

**Date** : 2025-12-07
**Auteur** : Claude (AI Assistant)
**Version** : Correctifs post-retours utilisateurs
