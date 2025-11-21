# 🧶 YarnFlow

**De la première maille à tous vos réseaux** - Créez, trackez, photographiez et partagez vos ouvrages tricot & crochet.

[![Version](https://img.shields.io/badge/version-0.10.0-purple.svg)](https://github.com/username/yarnflow)
[![PHP](https://img.shields.io/badge/PHP-8.1+-777BB4.svg)](https://www.php.net/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg)](https://www.mysql.com/)

---

## ✨ Fonctionnalités principales

### 📊 Tracker de projets universel ⭐ CŒUR DE L'APP
**Le problème :** "J'étais à quel rang déjà ?" - dit tous les passionnés de tricot & crochet, tous les jours.

**La solution :**
- ✅ **Support tricot ET crochet** (v0.10.0)
- ✅ Compteur de rangs interactif géant (jamais vu ailleurs !)
- ✅ Suivre **TOUS** vos projets (YouTube, Pinterest, livres, magazines)
- ✅ Timer de session automatique (savoir combien de temps vous tricotez/crochetez)
- ✅ Historique détaillé avec notes et photos par rang
- ✅ Statistiques motivantes (rangs/heure, mailles totales, temps investi)
- ✅ Galerie de vos créations

### 📸 AI Photo Studio ⭐ UNIQUE
**La killer feature qui vous différencie** - Générez des photos professionnelles de vos créations

- ✅ **1 à 5 photos contextuelles** par projet terminé
- ✅ **15 presets rapides** : Photo hero, Collection complète, E-commerce, Portfolio...
- ✅ **Contextes intelligents** adaptés au type d'ouvrage (bonnet vs amigurumi)
- ✅ **Styles premium** : Etsy, flatlay, cottagecore, bohème, minimaliste...
- ✅ **Édition IA** : Changement couleur, suppression fond, HD (Premium)
- 🎯 **Parfait pour Instagram, Etsy, Ravelry, vos portfolios !**

### 💳 Tarifs transparents

| Plan | Prix | Projets | Images IA/mois | Stats |
|------|------|---------|----------------|-------|
| **FREE** | Gratuit | 3 projets | 3 images IA | Basiques |
| **Standard** | 4.99€/mois | ∞ illimité | 30 images IA | Complètes |
| **Premium** | 9.99€/mois | ∞ illimité | 120 images IA + HD | Complètes + Édition IA |

**Abonnements annuels** (économies importantes) :
- **Standard** : 39.99€/an (économise 33% - 2 mois offerts)
- **Premium** : 79.99€/an (économise 33% - 4 mois offerts)

**Packs IA ponctuels** (pour heavy users) :
- 🎁 Pack 20 images : 2.99€
- 🎁 Pack 50 images : 6.99€
- 🎁 Pack 200 images : 14.99€

- Paiements sécurisés via Stripe
- Résiliable à tout moment
- Pas de surprise, pas de frais cachés

---

## 🚀 Installation rapide

### Prérequis
- PHP 8.1+ / MySQL 8.0+ / Composer
- Node.js 18+ / npm
- Serveur web (Apache/Nginx) ou PHP built-in

### 1. Base de données

```bash
mysql -u root -p
CREATE DATABASE patron_maker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

mysql -u root -p patron_maker < database/schema.sql
mysql -u root -p patron_maker < database/add_categories_table.sql
mysql -u root -p patron_maker < database/add_projects_system.sql
mysql -u root -p patron_maker < database/add_knitting_types.sql
```

### 2. Backend PHP

```bash
cd backend
composer install
cp config/.env.example config/.env
# Éditer config/.env avec vos paramètres

cd public
php -S localhost:8000
```

### 3. Frontend React

```bash
cd frontend
npm install
npm run dev
# Accessible sur http://localhost:5173
```

---

## ⚙️ Configuration

Créer `backend/config/.env` :

```ini
# Base de données
DB_HOST=localhost
DB_NAME=patron_maker
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_change_this

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# IA (Claude OU OpenAI)
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=claude

# Tarification
MAX_PATTERNS_FREE=3
PATTERN_BASE_PRICE=2.99
```

---

## 📖 Documentation

**Documentation principale** :
- [`CLAUDE.md`](CLAUDE.md) - Documentation complète du projet

**Guides spécialisés** (dossier `docs/guides/`) :
- [`CROCHET_HUB_SETUP.md`](docs/guides/CROCHET_HUB_SETUP.md) - Installation système projets
- [`ADMIN_OPTIONS_GUIDE.md`](docs/guides/ADMIN_OPTIONS_GUIDE.md) - Gestion options
- [`RESPONSIVE_MOBILE.md`](docs/guides/RESPONSIVE_MOBILE.md) - Optimisation mobile

**Tests** :
- [`GUIDE_TEST_COMPLET.md`](GUIDE_TEST_COMPLET.md) - Guide de test exhaustif

---

## 📊 Stack technique

**Backend** :
- PHP 8.1+ (POO, PSR-12)
- MySQL 8.0
- JWT (authentification)
- Stripe PHP SDK
- Claude API / OpenAI
- TCPDF (génération PDF)

**Frontend** :
- React 18 + Vite
- TailwindCSS
- React Router
- Axios

---

## 🗄️ Structure de la base

- **users** - Utilisateurs et abonnements
- **patterns** - Patrons générés par l'IA
- **pattern_templates** - Bibliothèque de référence
- **pattern_categories** - Catégories dynamiques
- **payments** - Historique Stripe
- **projects** ⭐ - Projets de tricot/crochet trackés
- **project_rows** ⭐ - Historique des rangs
- **project_stats** ⭐ - Statistiques pré-calculées
- **project_sessions** ⭐ - Sessions de travail

---

## 🎯 Roadmap

**Version actuelle : 0.10.0** ✅ YARNFLOW
- [x] **Support tricot ET crochet** (v0.10.0)
- [x] **AI Photo Studio** (v0.10.0)
- [x] Tracker de projets universel (CŒUR DE L'APP)
- [x] Compteur de rangs interactif géant
- [x] Timer de session automatique
- [x] Statistiques de progression motivantes
- [x] Générateur de patrons IA (BETA)
- [x] Responsive mobile

**Priorités Q1 2025 :**
- [ ] Amélioration qualité générateur IA (retours beta)
- [ ] Galerie communautaire publique
- [ ] Notifications push (rappels de sessions)
- [ ] Export/backup de projets
- [ ] Mode hors-ligne (PWA)

**Vision long terme :**
- [ ] Marketplace de patrons (créateurs vendent leurs patrons)
- [ ] Affiliation Amazon (laines recommandées)
- [ ] Internationalisation (i18n)
- [ ] App mobile native (iOS/Android)

---

## 🧪 Tests

```bash
# Backend (PHPUnit)
cd backend
composer test

# Frontend (Vitest)
cd frontend
npm test
```

---

## 🔒 Sécurité

- ✅ Requêtes préparées (SQL injection)
- ✅ Hash bcrypt (mots de passe)
- ✅ JWT tokens (authentification)
- ✅ CORS configuré
- ✅ Validation des entrées
- ✅ Rate limiting

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

## 👥 Auteurs

Créé par **Nathalie** avec l'assistance de **Claude Code** (Anthropic)

---

## 🙏 Remerciements

- [Anthropic Claude](https://www.anthropic.com/) - Génération de patrons
- [Stripe](https://stripe.com/) - Paiements
- [TailwindCSS](https://tailwindcss.com/) - Design system
- Communauté crochet française 🧶

---

**Version** : 0.10.0 - YARNFLOW (AI PHOTO STUDIO)
**Dernière mise à jour** : 2025-11-16

---

## ✨ Ce qui rend YarnFlow unique

YarnFlow va au-delà du simple compteur de rangs :

- **📊 Statistiques motivantes** : Suivez votre progression comme une pro (rangs/heure, temps total, streaks)
- **📸 AI Photo Studio** : Transformez vos photos en shots professionnels pour Instagram/Etsy
- **☁️ Cloud synchronisé** : Accédez à vos projets depuis n'importe quel appareil
- **🔥 Streaks & badges** : Restez motivée avec des objectifs quotidiens
- **📈 Graphiques de progression** : Visualisez votre évolution (Premium)
- **🌐 Multi-plateforme** : Web accessible sur PC, tablette et mobile

**YarnFlow = Le workflow complet du créateur moderne** 🧶
