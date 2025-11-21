# CLAUDE.md - YarnFlow

**Stack** : PHP 8.1+ / React 18 / MySQL 8.0
**Version** : 0.11.0 (2025-11-17)
**Baseline** : Tracker tricot/crochet avec stats Strava + AI Photo Studio

---

## 🎯 Concept
Différenciation vs concurrents : stats avancées (vitesse, graphiques), embellissement IA photos, sync cloud multi-devices.

**Pricing** : FREE (3 projets, 3 images IA/mois) | Standard (4.99€, ∞ projets, 30 images) | Premium (9.99€, 120 images HD)

---

## 🗂️ Architecture

```
backend/         # PHP 8.1
├── controllers/ # Auth, Project, Photo, Payment, Admin
├── models/      # User, Pattern, Project, Payment
└── services/    # JWT, Pricing, AIPattern, Stripe

frontend/src/    # React 18
├── pages/       # Dashboard, MyProjects, Stats, Gallery
└── components/  # Layout, PrivateRoute
```

**Tables clés** : users, projects, project_rows, project_stats, user_photos, user_photo_credits, payments

---

## 🎮 Routes API principales

**Auth** : `POST /api/auth/register|login`, `GET /api/auth/me`
**Projets** : `GET|POST /api/projects`, `POST /api/projects/{id}/rows`, `GET /api/projects/stats`
**Photos IA** : `POST /api/photos`, `POST /api/photos/{id}/enhance-multiple` (1-5 photos, presets intelligents)
**Patrons** : `POST /api/patterns/generate` (BETA)

---

## 📸 AI Photo Studio

**Crédits** : FREE 3/mois, Standard 30/mois, Premium 120/mois + packs (2.99€-14.99€)
**Styles** : lifestyle, studio, scandinavian, nature, cafe
**Presets** : 9 par catégorie (Hero, Produit, Etsy, Instagram, Facebook, Carrousel)
**Multi-génération** : 1-5 photos en batch, -20% si 5 photos (4 crédits), `parent_photo_id` pour variations

---

## ⚙️ Config (.env)

```ini
DB_HOST=localhost
DB_NAME=patron_maker
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
ANTHROPIC_API_KEY=sk-ant-...
AI_PROVIDER=claude
```

---

## 🚀 Installation

```bash
# Database
mysql -u root -p patron_maker < database/schema.sql
mysql -u root -p patron_maker < database/add_projects_system.sql
mysql -u root -p patron_maker < database/add_knitting_types.sql
mysql -u root -p patron_maker < database/add_parent_photo_id.sql

# Backend + Frontend
cd backend && composer install && php -S localhost:8000 -t public
cd frontend && npm install && npm run dev
```

---

## 📝 État (v0.11.0)

**✅ Prêt** : Backend 100%, Frontend 95%, Database optimisée
**⚠️ Manque prod** : Gemini API réelle, Stripe prod, Email SMTP, CGU/RGPD, Hébergement SSL
**Lancement** : Phase 1 BETA fermée (20-50 testeurs) → Phase 2 Public (Stripe, SEO) → Phase 3 Croissance

**Derniers ajouts (v0.11.0)** : UI compacte 40%, Tabs Photos/Patron, Modales React, Multi-génération IA, Galerie redesignée

---

**Docs** : `docs/guides/` | **MAJ** : 2025-11-17
