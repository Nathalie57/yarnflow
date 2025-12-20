# 🐛 Debug Cache PWA - YarnFlow Staging

## 1️⃣ Vérifier que les fichiers sont bien uploadés

Ouvrez https://staging.yarnflow.fr/assets/index-BCRMjuPA.js dans le navigateur.

**Ce que vous devriez voir** :
- Le fichier charge correctement (pas de 404)
- Cherchez "staging.yarnflow.fr" dans le code (Ctrl+F)

**Si vous voyez encore "yarnflow.fr/api"** → Les fichiers ne sont pas à jour sur le serveur

---

## 2️⃣ Désinstaller le Service Worker (PWA)

### Option A : Via DevTools (Recommandé)
1. Ouvrez https://staging.yarnflow.fr
2. Appuyez sur **F12** (DevTools)
3. Allez dans l'onglet **Application** (ou **Stockage**)
4. Cliquez sur **Service Workers** (menu gauche)
5. Cliquez sur **Unregister** pour tous les SW
6. Cliquez sur **Clear site data** (bouton en haut)
7. Fermez et rouvrez le navigateur

### Option B : Vider le cache complet
1. **Chrome/Edge** : Ctrl+Shift+Delete → Tout cocher → Supprimer
2. **Firefox** : Ctrl+Shift+Delete → Tout cocher → Effacer maintenant
3. **Safari** : Préférences → Avancé → Vider les caches
4. Fermer et rouvrir le navigateur
5. Ouvrir staging.yarnflow.fr en **navigation privée** pour tester

---

## 3️⃣ Vérifier le Service Worker actif

1. F12 → **Application** → **Service Workers**
2. Regardez l'URL du script : doit être `/sw.js?...`
3. Regardez le statut : doit être "activated and running"
4. Notez l'heure de mise à jour

**Si SW date d'avant votre upload** → Pas mis à jour, forcer l'unregister

---

## 4️⃣ Forcer le rechargement sans cache

1. Ouvrez https://staging.yarnflow.fr
2. Appuyez sur **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac)
3. OU **Ctrl+F5**
4. Vérifiez l'onglet **Network** (F12) pour voir si les fichiers sont rechargés

---

## 5️⃣ Test en navigation privée

1. **Ctrl+Shift+N** (Chrome/Edge) ou **Ctrl+Shift+P** (Firefox)
2. Allez sur https://staging.yarnflow.fr
3. Essayez de créer un compte

**Si ça marche en navigation privée** → C'est bien un problème de cache
**Si ça marche pas en navigation privée** → Problème côté serveur

---

## 6️⃣ Vérifier la requête API dans Network

1. F12 → Onglet **Network**
2. Essayez de créer un compte
3. Cherchez la requête vers `/api/auth/register`
4. Regardez l'URL complète dans les Headers

**URL attendue** : `https://staging.yarnflow.fr/api/auth/register`
**URL incorrecte** : `https://yarnflow.fr/api/auth/register`

---

## 🚨 Si rien ne marche

### Solution radicale : Nouveau nom de fichier

Le problème peut venir du fait que le nom du bundle JavaScript est identique (index-BCRMjuPA.js). 
Le navigateur/SW peut croire que c'est le même fichier.

**Solution** : Forcer un nouveau build avec un nouveau hash :

```bash
cd frontend
rm -rf dist node_modules/.vite
npm run build -- --mode staging
```

Puis re-uploader TOUT le dossier dist/

---

**Si vous me dites quelle étape ne fonctionne pas, je peux vous aider davantage !**
