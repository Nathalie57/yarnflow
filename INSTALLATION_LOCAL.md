# 🚀 Installation locale - Crochet Hub

**Date** : 2025-11-14
**Pour** : Installation sur WAMP avec VirtualHost

---

## ✅ Prérequis

- ✅ WAMP64 installé et démarré (icône verte)
- ✅ PHP 8.1+ (vérifier : `php -v`)
- ✅ MySQL 8.0+ (vérifier : `mysql --version`)
- ✅ Composer installé
- ✅ Node.js 18+ et npm installés

---

## 📋 Étape 1 : Configuration du VirtualHost Apache

### 1.1 Créer le fichier VirtualHost

**Chemin** : `D:\wamp64\bin\apache\apache2.4.XX\conf\extra\httpd-vhosts.conf`

Ajouter à la fin du fichier :

```apache
# Crochet Hub - VirtualHost
<VirtualHost *:80>
    ServerName crochet-hub.local
    ServerAlias www.crochet-hub.local
    DocumentRoot "D:/wamp64/www/pattern-maker/backend/public"

    <Directory "D:/wamp64/www/pattern-maker/backend/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/crochet-hub-error.log"
    CustomLog "logs/crochet-hub-access.log" common
</VirtualHost>
```

### 1.2 Modifier le fichier hosts

**Chemin** : `C:\Windows\System32\drivers\etc\hosts`

Ouvrir avec **Bloc-notes en mode Administrateur**, ajouter :

```
127.0.0.1    crochet-hub.local
127.0.0.1    www.crochet-hub.local
```

### 1.3 Redémarrer Apache

Dans WAMP :
1. Clic gauche sur l'icône WAMP
2. Apache → Service → Restart Service

### 1.4 Vérifier

Ouvrir dans le navigateur : **http://crochet-hub.local**

Si vous voyez une erreur 404 ou "Forbidden", c'est normal, on continue !

---

## 📦 Étape 2 : Base de données

### 2.1 Créer la base de données

**Via phpMyAdmin** (`http://localhost/phpmyadmin`) :

1. Cliquer sur "Nouvelle base de données"
2. Nom : `patron_maker`
3. Interclassement : `utf8mb4_unicode_ci`
4. Créer

### 2.2 Importer les tables SQL

**IMPORTANT** : Importer dans cet ordre ⭐

```bash
# Via phpMyAdmin (onglet "Importer") :
1. database/schema.sql                    # Tables principales
2. database/add_categories_table.sql      # Catégories dynamiques
3. database/add_projects_system.sql       # Système de projets
```

**OU via ligne de commande** :

```bash
cd D:\wamp64\www\pattern-maker

mysql -u root -p patron_maker < database/schema.sql
mysql -u root -p patron_maker < database/add_categories_table.sql
mysql -u root -p patron_maker < database/add_projects_system.sql
```

### 2.3 Vérifier l'import

Dans phpMyAdmin, vérifier que vous avez **10 tables** :
- users
- patterns
- pattern_templates
- pattern_categories
- payments
- api_logs
- password_resets
- projects ⭐
- project_rows ⭐
- project_stats ⭐
- project_sessions ⭐

---

## ⚙️ Étape 3 : Configuration backend

### 3.1 Installer les dépendances PHP

```bash
cd D:\wamp64\www\pattern-maker\backend
composer install
```

Si erreur "composer command not found" :
```bash
php composer.phar install
```

### 3.2 Vérifier le fichier .env

Le fichier `backend/config/.env` existe déjà.

**À MODIFIER** :

```ini
# Base de données (normalement OK)
DB_HOST=localhost
DB_NAME=patron_maker
DB_USER=root
DB_PASSWORD=              # ← Vide si pas de mot de passe WAMP

# URL de l'app
APP_URL=http://crochet-hub.local    # ← Changer si besoin

# JWT Secret (IMPORTANT : générer une vraie clé)
JWT_SECRET=changez_cette_cle_par_une_cle_aleatoire_tres_longue
# Générer avec : php -r "echo base64_encode(random_bytes(32));"

# API Claude (OBLIGATOIRE pour générer des patrons)
ANTHROPIC_API_KEY=sk-ant-votre_cle_api    # ← Mettre ta vraie clé Claude
AI_PROVIDER=claude

# Stripe (optionnel pour l'instant, peut rester en test)
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
```

### 3.3 Générer une clé JWT sécurisée

```bash
php -r "echo base64_encode(random_bytes(32));"
```

Copier le résultat et le mettre dans `JWT_SECRET` du fichier `.env`

---

## 🧪 Étape 4 : Tester le backend

### 4.1 Test de connexion base de données

Créer un fichier test :

```bash
cd D:\wamp64\www\pattern-maker\backend\public
```

Créer `test-db.php` :

```php
<?php
require_once '../config/bootstrap.php';

use App\Config\Database;

try {
    $db = Database::getInstance()->getConnection();
    echo "✅ Connexion à la base de données réussie !<br>";

    // Test : compter les utilisateurs
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Nombre d'utilisateurs : " . $result['count'] . "<br>";

    // Test : compter les catégories
    $stmt = $db->query("SELECT COUNT(*) as count FROM pattern_categories");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "Nombre de catégories : " . $result['count'] . "<br>";

} catch (Exception $e) {
    echo "❌ Erreur : " . $e->getMessage();
}
```

Ouvrir : **http://crochet-hub.local/test-db.php**

Résultat attendu :
```
✅ Connexion à la base de données réussie !
Nombre d'utilisateurs : 0
Nombre de catégories : 42
```

### 4.2 Test de l'API REST

Ouvrir : **http://crochet-hub.local/api/categories**

Résultat attendu (JSON) :
```json
{
  "success": true,
  "data": {
    "hat": {
      "key": "hat",
      "label": "Bonnets",
      "icon": "🧢",
      "subtypes": { ... }
    }
  }
}
```

Si ça fonctionne → Backend OK ✅

---

## 🎨 Étape 5 : Lancer le frontend

### 5.1 Installer les dépendances npm

```bash
cd D:\wamp64\www\pattern-maker\frontend
npm install
```

### 5.2 Vérifier la configuration API

Ouvrir `frontend/src/services/api.js`, vérifier :

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://crochet-hub.local/api';
```

Si besoin, créer `frontend/.env` :

```ini
VITE_API_URL=http://crochet-hub.local/api
```

### 5.3 Lancer le serveur de développement

```bash
npm run dev
```

Résultat attendu :
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5.4 Ouvrir l'application

**Frontend** : http://localhost:5173
**Backend API** : http://crochet-hub.local/api

---

## ✅ Étape 6 : Test complet

### 6.1 Inscription d'un utilisateur

1. Aller sur **http://localhost:5173/register**
2. Remplir :
   - Email : `test@example.com`
   - Mot de passe : `Test1234!`
   - Prénom : `Marie`
   - Nom : `Dupont`
3. Cliquer "S'inscrire"

✅ Vous devriez être redirigé vers le Dashboard

### 6.2 Vérifier en base de données

phpMyAdmin → Table `users` → Vérifier qu'un utilisateur a été créé

### 6.3 Test du générateur (si clé Claude configurée)

1. Aller sur **http://localhost:5173/generator**
2. Choisir : Bonnet → Beanie → Débutant → Adulte
3. Cliquer "Générer le patron"
4. Attendre 10-15 secondes
5. ✅ Patron généré avec instructions complètes

### 6.4 Test du tracker de projets

1. Aller sur **http://localhost:5173/my-projects**
2. Cliquer "➕ Nouveau Projet"
3. Remplir :
   - Nom : `Test bonnet`
   - Type : Bonnet
   - Nombre de rangs : 20
4. Créer le projet
5. Ouvrir le compteur
6. Cliquer sur "+" pour ajouter un rang
7. ✅ Le compteur s'incrémente

---

## 🔧 Dépannage

### Problème : "Connection refused" sur l'API

**Solution** : Vérifier que le VirtualHost pointe vers `backend/public/`

```apache
DocumentRoot "D:/wamp64/www/pattern-maker/backend/public"
```

### Problème : Erreur 500 sur l'API

**Solution** : Vérifier les logs Apache :
```
D:\wamp64\logs\apache_error.log
```

Activer le debug dans `.env` :
```ini
APP_DEBUG=true
```

### Problème : CORS Error

**Solution** : Vérifier dans `.env` :
```ini
FRONTEND_URL=http://localhost:5173
```

Et que le middleware CORS est actif dans `backend/routes/api.php`

### Problème : "Class not found"

**Solution** :
```bash
cd backend
composer dump-autoload
```

### Problème : Frontend ne charge pas

**Solution** :
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Checklist finale

- [ ] VirtualHost configuré (`crochet-hub.local`)
- [ ] Base de données créée avec 10 tables
- [ ] Fichier `.env` configuré avec clé JWT
- [ ] Backend répond sur `http://crochet-hub.local/api/categories`
- [ ] Frontend tourne sur `http://localhost:5173`
- [ ] Inscription utilisateur fonctionne
- [ ] Dashboard s'affiche
- [ ] (Optionnel) Générateur de patrons fonctionne (si clé Claude)
- [ ] Tracker de projets fonctionne

---

## 🎯 URLs à retenir

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://crochet-hub.local/api |
| **phpMyAdmin** | http://localhost/phpmyadmin |
| **WAMP** | http://localhost |

---

## 📞 Besoin d'aide ?

Consulter :
- `GUIDE_TEST_COMPLET.md` - Tests exhaustifs
- `CLAUDE.md` - Documentation technique complète
- `docs/INDEX.md` - Index de toute la documentation

---

**Installation créée le** : 2025-11-14
**Testée sur** : WAMP64 + Windows 11
