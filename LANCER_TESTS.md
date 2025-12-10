# 🚀 Lancer les tests YarnFlow - Guide rapide

**Créé le** : 2025-12-04
**Durée** : 5 minutes de setup

---

## ⚡ Démarrage ultra-rapide

### 1️⃣ Préparation (une seule fois)

Ouvre un terminal dans `/mnt/d/wamp64/www/pattern-maker/` et lance :

```bash
./setup-test.sh
```

Ce script va :
- ✅ Créer les dossiers uploads
- ✅ Configurer le frontend (.env)
- ✅ Vérifier MySQL
- ✅ Créer/importer la base de données (si MySQL accessible)

**Note :** Si MySQL n'est pas accessible via terminal, le script te donnera les instructions pour phpMyAdmin.

---

### 2️⃣ Démarrer l'application

**Important : Assure-toi que WAMP est démarré (icône verte) !**

#### Terminal 1 - Backend
```bash
./start-backend.sh
```
→ Backend disponible sur http://localhost:8000

#### Terminal 2 - Frontend
```bash
./start-frontend.sh
```
→ Frontend disponible sur http://localhost:5173

---

### 3️⃣ Tester l'application

Ouvre ton navigateur : **http://localhost:5173/**

Suis le guide complet : **GUIDE_TEST_LOCAL.md**

---

## 🛠️ Commandes alternatives (sans scripts)

Si les scripts ne marchent pas, utilise ces commandes :

### Backend
```bash
cd /mnt/d/wamp64/www/pattern-maker/backend
php -S localhost:8000 -t public
```

### Frontend
```bash
cd /mnt/d/wamp64/www/pattern-maker/frontend
npm run dev
```

---

## ✅ Checklist rapide avant de tester

| Élément | Comment vérifier |
|---------|------------------|
| ✅ WAMP démarré | Icône verte dans la barre des tâches |
| ✅ Base de données | http://localhost/phpmyadmin/ → `patron_maker` existe |
| ✅ Dossiers uploads | `backend/public/uploads/` existe |
| ✅ Config frontend | `frontend/.env` existe |
| ✅ Backend lancé | Terminal 1 affiche "PHP Development Server started" |
| ✅ Frontend lancé | Terminal 2 affiche "Local: http://localhost:5173/" |

---

## 🐛 Problèmes courants

### "Cannot connect to database"
→ Vérifie que WAMP tourne (icône verte)
→ Vérifie dans phpMyAdmin que `patron_maker` existe

### "CORS error" dans la console
→ Redémarre le backend (Ctrl+C puis relance)

### Page blanche sur localhost:5173
→ Ouvre la console (F12) et regarde les erreurs
→ Vérifie que le backend est bien démarré

### API timeout avec Gemini
→ C'est normal, l'API peut prendre 10-30 secondes
→ Vérifie ta connexion internet

---

## 📝 Reporter les bugs

Tous les bugs que tu trouves → **BUGS_TROUVES.md**

Format :
```markdown
### Bug #1 : Titre
- **Page** : Dashboard / Projets / Photos / etc.
- **Étapes** : 1. ... 2. ... 3. ...
- **Erreur** : (copie depuis F12 Console)
```

---

## 🎯 Objectifs des tests

1. ✅ Inscription / Connexion
2. ✅ Création de projet
3. ✅ Compteur de rangs
4. ✅ Upload et génération photo IA
5. ✅ Crédits IA (3 pour FREE)
6. ✅ Stats et graphiques
7. ✅ Bibliothèque de patrons
8. ✅ Navigation générale
9. ✅ Responsive mobile (F12 → mode mobile)

---

**Prêt ? Lance `./setup-test.sh` et c'est parti ! 🧶✨**
