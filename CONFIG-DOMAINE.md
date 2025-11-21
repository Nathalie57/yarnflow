# 🌐 Configuration Domaine Custom - YarnFlow

**Prérequis** : Avoir acheté un domaine (ex: `yarnflow.com`)

**Durée** : 15-30 min

---

## 🎯 Architecture avec Domaine

```
Frontend → https://yarnflow.com (Vercel)
       ou → https://www.yarnflow.com (Vercel)

Backend  → https://api.yarnflow.com (InfinityFree)
       ou → https://yarnflow.infinityfreeapp.com (sous-domaine gratuit)
```

**Recommandation** :
- Frontend : `yarnflow.com` + `www.yarnflow.com` (les 2)
- Backend : Garder `yarnflow.infinityfreeapp.com` (évite config DNS InfinityFree)

---

## 📝 ÉTAPE 1 : Configurer Frontend sur Vercel (10 min)

### 1.1 Ajouter le domaine
1. Aller sur https://vercel.com/dashboard
2. Cliquer sur ton projet `yarnflow`
3. **Settings** → **Domains**
4. Cliquer **Add**
5. Entrer : `yarnflow.com`
6. Cliquer **Add**

### 1.2 Ajouter www
1. Cliquer **Add** à nouveau
2. Entrer : `www.yarnflow.com`
3. Cliquer **Add**

### 1.3 Configurer redirection (optionnel mais recommandé)
**Choisir une version principale** :

**Option A - Rediriger www → non-www** (recommandé) :
- `yarnflow.com` = principal ✅
- `www.yarnflow.com` → redirige vers `yarnflow.com`

**Option B - Rediriger non-www → www** :
- `www.yarnflow.com` = principal ✅
- `yarnflow.com` → redirige vers `www.yarnflow.com`

**Configuration dans Vercel** :
1. **Domains** → Cliquer sur le domaine secondaire
2. **Redirect to** → Sélectionner domaine principal
3. **Save**

---

## 🌍 ÉTAPE 2 : Configurer DNS chez ton Registrar (15 min)

**Où acheter ton domaine ?**
- OVH : https://ovh.com/manager
- Namecheap : https://namecheap.com/myaccount
- Google Domains → Squarespace : https://domains.squarespace.com
- Porkbun : https://porkbun.com/account/domains

### 2.1 Récupérer les DNS Vercel
Dans Vercel > Domains, tu verras des instructions comme :

**Pour `yarnflow.com` (racine)** :
```
Type : A
Name : @
Value : 76.76.21.21
```

**Pour `www.yarnflow.com`** :
```
Type : CNAME
Name : www
Value : cname.vercel-dns.com
```

### 2.2 Ajouter dans ton Registrar

#### Exemple OVH
1. Aller sur https://ovh.com/manager/web/#/domain/yarnflow.com/zone
2. **Zone DNS** → **Ajouter une entrée**
3. Ajouter record **A** :
   - Sous-domaine : (vide ou `@`)
   - Cible : `76.76.21.21`
4. Ajouter record **CNAME** :
   - Sous-domaine : `www`
   - Cible : `cname.vercel-dns.com.`
5. **Valider**

#### Exemple Namecheap
1. Aller sur https://namecheap.com/myaccount/
2. **Domain List** → Cliquer sur ton domaine
3. **Advanced DNS**
4. Ajouter **A Record** :
   - Host : `@`
   - Value : `76.76.21.21`
   - TTL : Automatic
5. Ajouter **CNAME Record** :
   - Host : `www`
   - Value : `cname.vercel-dns.com`
   - TTL : Automatic
6. **Save**

#### Exemple Porkbun
1. Aller sur https://porkbun.com/account/domains
2. Cliquer sur ton domaine
3. **DNS**
4. Ajouter **A Record** :
   - Host : (vide)
   - Answer : `76.76.21.21`
5. Ajouter **CNAME** :
   - Host : `www`
   - Answer : `cname.vercel-dns.com`
6. **Submit**

### 2.3 Attendre la propagation
- **Délai** : 5 min à 48h (généralement 10-30 min)
- **Vérifier** : https://dnschecker.org

---

## ✅ ÉTAPE 3 : Vérifier que ça marche (5 min)

### 3.1 Test DNS
Ouvrir https://dnschecker.org et vérifier :
```
yarnflow.com
→ A record : 76.76.21.21 ✅
```

### 3.2 Test HTTPS
Ouvrir dans navigateur :
```
https://yarnflow.com
→ Doit afficher ta landing page ✅
→ Cadenas 🔒 dans barre d'adresse ✅
```

### 3.3 Test www
Ouvrir :
```
https://www.yarnflow.com
→ Doit afficher ta landing (ou rediriger) ✅
```

### 3.4 Vérifier SSL
Aller sur https://www.ssllabs.com/ssltest/analyze.html?d=yarnflow.com
→ Grade A+ attendu ✅

---

## 🔧 ÉTAPE 4 : Mettre à jour les URLs dans le code (5 min)

### 4.1 Backend .env
Mettre à jour `backend/.env` (InfinityFree) :

```bash
APP_URL=https://yarnflow.infinityfreeapp.com
FRONTEND_URL=https://yarnflow.com  # ← Nouveau domaine
```

Upload via FTP.

### 4.2 Backend .htaccess
Mettre à jour `backend/public/.htaccess` :

```apache
# CORS - Remplacer par ton domaine
Header set Access-Control-Allow-Origin "https://yarnflow.com"
```

Upload via FTP.

### 4.3 Frontend Vercel
1. Aller sur https://vercel.com/dashboard
2. Cliquer sur projet `yarnflow`
3. **Settings** → **Environment Variables**
4. Modifier `VITE_API_URL` (si backend reste sur InfinityFree) :
   ```
   VITE_API_URL = https://yarnflow.infinityfreeapp.com/api
   ```
   (Pas de changement si tu gardes le sous-domaine InfinityFree)

5. **Deployments** → **Redeploy** dernier deploy

---

## 🚀 ÉTAPE 5 : Test E2E Final (5 min)

### Checklist
- [ ] Ouvrir `https://yarnflow.com`
- [ ] Landing page s'affiche ✅
- [ ] Cadenas 🔒 présent
- [ ] S'inscrire à la waitlist
- [ ] Vérifier email enregistré dans DB InfinityFree (phpMyAdmin)
- [ ] Tester sur mobile
- [ ] Partager l'URL à un ami → doit marcher ✅

---

## 🎉 TERMINÉ !

**Tes URLs finales** :
```
🌐 Landing : https://yarnflow.com
🔌 API     : https://yarnflow.infinityfreeapp.com/api
```

---

## 📧 BONUS : Emails Professionnels (Optionnel)

### Option 1 : Google Workspace (Payant - 6€/mois)
- `contact@yarnflow.com`
- `noreply@yarnflow.com`
- https://workspace.google.com

### Option 2 : Cloudflare Email Routing (GRATUIT)
- Redirection email gratuite
- `contact@yarnflow.com` → redirige vers `ton@gmail.com`
- https://cloudflare.com (gratuit)

### Option 3 : Proton Mail (Gratuit limité)
- 1 email custom gratuit
- https://proton.me/mail

### Option 4 : Forwarder du Registrar (Souvent gratuit)
- OVH/Namecheap offrent souvent forwarding gratuit
- `contact@yarnflow.com` → `ton@gmail.com`

---

## 🆘 Troubleshooting

### DNS ne se propage pas après 1h
- Vérifier TTL (Time To Live) dans DNS (doit être court, ex: 300 = 5 min)
- Flush DNS local :
  ```bash
  # Windows
  ipconfig /flushdns

  # Mac/Linux
  sudo dscacheutil -flushcache
  ```

### HTTPS ne fonctionne pas
- Attendre 5-10 min après config DNS
- Vercel génère certificat SSL auto après DNS validé
- Vérifier dans Vercel > Domains → Status doit être "Valid"

### CORS Error après changement domaine
- Vérifier `FRONTEND_URL` dans backend `.env`
- Vérifier `Access-Control-Allow-Origin` dans `.htaccess`
- Doit correspondre EXACTEMENT à `https://yarnflow.com` (pas de trailing slash)

---

## 📝 Mise à jour POSTS Réseaux Sociaux

**Ne pas oublier** de remplacer dans tes posts :
```
❌ https://yarnflow.vercel.app
✅ https://yarnflow.com
```

Voir `POSTS-RESEAUX-SOCIAUX.md` pour mettre à jour.

---

**Félicitations ! Ton app est maintenant sur ton domaine custom ! 🚀🧶**
