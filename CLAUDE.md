# CLAUDE.md - YarnFlow

**Stack** : PHP 8.1+ / React 18 / MySQL 8.0
**Version** : 0.13.0 (2025-12-16)
**Baseline** : Tracker tricot/crochet avec stats Strava + AI Photo Studio

---

## 🎯 Concept
Différenciation vs concurrents : stats avancées (vitesse, graphiques), embellissement IA photos, sync cloud multi-devices.

**Pricing** : FREE (3 projets actifs, 5 crédits photos/mois) | PRO (3.99€/mois, projets illimités, 30 crédits photos/mois) | PRO Annuel (34.99€/an, -27%) | Early Bird (2.99€/mois pour waitlist)

---

## 💰 Plans et tarification

### Plan GRATUIT — YarnFlow Basic
- ✅ 3 projets actifs max
- ✅ Patrons illimités
- ✅ Sections illimitées
- ✅ Compteur de rangs
- ✅ Notes et organisation basique
- ✅ **5 crédits photos gratuits par mois** (pour tester la génération d'images)
- ✅ Accès à toutes les fonctionnalités existantes sauf IA avancée

### Plan PRO — 3,99 €/mois
- ✅ Projets illimités
- ✅ Patrons illimités
- ✅ Sections illimitées
- ✅ Compteur de rangs + augmentations/diminutions
- ✅ Notes et organisation avancée
- ✅ **30 crédits photos par mois** (génération d'images pro)
- ✅ Support prioritaire (réponses plus rapides et personnalisées)
- ✅ Accès prioritaire aux nouvelles fonctionnalités

### Plan PRO Annuel — 34,99 €/an (-27%)
- ✅ Tous les avantages du plan PRO mensuel
- ✅ **Économie de 12.89€/an** par rapport au mensuel (47.88€ → 34.99€)
- ✅ Engagement 12 mois

### Plan Early Bird — 2,99 €/mois (Waitlist uniquement)
- ✅ **Réservé aux inscrits sur la waitlist** (200 places)
- ✅ Tous les avantages du plan PRO
- ✅ **Prix bloqué à 2.99€/mois pendant 12 mois**
- ✅ 30 crédits photos/mois
- ✅ Support prioritaire

---

## 🗂️ Architecture

```
backend/         # PHP 8.1
├── controllers/ # Auth, Project, Photo, Payment, Admin
├── models/      # User, Pattern, Project, Payment
└── services/    # JWT, Pricing, AIPattern, Stripe, CreditManager

frontend/src/    # React 18
├── pages/       # Dashboard, MyProjects, Stats, Gallery, ProjectCounter
└── components/  # Layout, PrivateRoute, BottomNav
```

**Tables clés** : users, projects, project_rows, project_stats, user_photos, user_photo_credits, payments, sections

---

## 🎮 Routes API principales

**Auth** : `POST /api/auth/register|login`, `GET /api/auth/me`
**Projets** : `GET|POST /api/projects`, `POST /api/projects/{id}/rows`, `GET /api/projects/stats`
**Sections** : `GET|POST /api/projects/{id}/sections`, `PUT /api/projects/{id}/sections/{section_id}`
**Photos IA** : `POST /api/photos`, `POST /api/photos/{id}/enhance-multiple` (1-5 photos, presets intelligents)
**Patrons** : `POST /api/patterns/generate` (BETA)
**Bibliothèque** : `GET|POST /api/pattern-library`, `DELETE /api/pattern-library/{id}`

---

## 📸 AI Photo Studio

**Crédits** : FREE 5/mois, PRO 30/mois, Early Bird 30/mois
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
SUBSCRIPTION_MONTHLY_PRICE=3.99
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

## 📝 État (v0.13.0)

**✅ Prêt** : Backend 100%, Frontend 98%, Database optimisée, Système d'abonnements sécurisé
**⚠️ Manque prod** : Gemini API réelle, Stripe prod keys, Email SMTP, CGU/RGPD, Hébergement SSL
**Lancement** : Phase 1 BETA fermée (20-50 testeurs) → Phase 2 Public (Stripe, SEO) → Phase 3 Croissance

**Derniers ajouts (v0.13.0)** :
- ✅ Bouton flottant pour les notes de projet (toujours accessible)
- ✅ Détails techniques avec couleurs YarnFlow (primary/sage/warm)
- ✅ Unités pour fil/laine (pelotes/grammes) avec toggle buttons
- ✅ Affichage amélioré des détails techniques (grid 3 colonnes)
- ✅ Système de sections avec progression individuelle
- ✅ Compteur flottant avec timer et wake lock
- ✅ Proxy pour affichage des patrons externes
- ✅ Bibliothèque de patrons avec catégories

**✅ Pricing cohérent dans toute l'application** :
- ✅ Plan FREE : 5 crédits photos/mois, 3 projets actifs max (les projets terminés ne comptent pas)
- ✅ Plan PRO : 3.99€/mois, 30 crédits photos/mois, projets illimités
- ✅ Plan PRO Annuel : 34.99€/an (-27%, économie de 12.89€)
- ✅ Plan Early Bird : 2.99€/mois (waitlist uniquement)
- ✅ Packs crédits photos : 50@4.99€, 150@9.99€

---

**Docs** : `docs/guides/` | **MAJ** : 2025-12-16
