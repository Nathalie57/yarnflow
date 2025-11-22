# 🚀 Guide Déploiement Vercel - YarnFlow Frontend

## 📋 Configuration Vercel

### 1️⃣ Variables d'environnement à configurer

Dans **Project Settings** → **Environment Variables** sur Vercel, ajouter:

```env
VITE_API_URL=https://yarnflow.infinityfreeapp.com/api
```

⚠️ **IMPORTANT:** Cette variable doit pointer vers votre backend InfinityFree

### 2️⃣ Build Settings (déjà configuré via vercel.json)

Le fichier `vercel.json` à la racine configure automatiquement:
- **Build Command:** `cd frontend && npm install && npm run build`
- **Output Directory:** `frontend/dist`
- **Install Command:** `cd frontend && npm install`

### 3️⃣ Déploiement

Chaque push sur la branche `main` déclenche automatiquement:
1. Installation des dépendances frontend
2. Build de l'application React
3. Déploiement sur Vercel

### 4️⃣ Vérification

Après déploiement, vérifier:

✅ **Frontend accessible:** `https://VOTRE_APP.vercel.app`
✅ **API connectée:** Tester login/register
✅ **Console browser:** Pas d'erreurs CORS

### 5️⃣ Problèmes courants

#### ❌ Erreur "Failed to fetch" dans la console
**Cause:** Variable `VITE_API_URL` non définie ou incorrecte
**Solution:** Vérifier les variables d'environnement Vercel

#### ❌ Erreurs CORS
**Cause:** Backend InfinityFree ne permet pas l'origine Vercel
**Solution:** Vérifier `public/.htaccess` sur InfinityFree:
```apache
Header set Access-Control-Allow-Origin "https://VOTRE_APP.vercel.app"
```

#### ❌ Build fail "Cannot find module"
**Cause:** Dépendances manquantes
**Solution:** Vérifier `frontend/package.json` et réinstaller localement

### 6️⃣ URLs finales

- **Frontend:** `https://yarnflow.vercel.app` (ou votre domaine custom)
- **Backend API:** `https://yarnflow.infinityfreeapp.com/api`

---

**Créé le 2025-11-21 pour déploiement YarnFlow v0.13.0**
