# CLAUDE.md - YarnFlow

**Stack** : PHP 8.1+ / React 18 / MySQL 8.0
**Version** : 0.16.0 (2025-12-20)
**Baseline** : Tracker tricot/crochet avec stats Strava + AI Photo Studio + Tags & Filtres + Contact

---

## 🎯 Concept
Différenciation vs concurrents : stats avancées (vitesse, graphiques), embellissement IA photos, sync cloud multi-devices.

**Pricing** : FREE (3 projets actifs, 5 crédits photos/mois) | PLUS (2.99€/mois, 7 projets, 15 crédits photos/mois) | PRO (4.99€/mois, projets illimités, 30 crédits photos/mois) | Annuels avec -15% et -17% | Early Bird (2.99€/mois pour waitlist)

---

## 💰 Plans et tarification

### Plan GRATUIT — YarnFlow Basic
- ✅ 3 projets actifs max
- ✅ Patrons illimités
- ✅ Sections illimitées
- ✅ Compteur de rangs
- ✅ Notes et organisation simplifiée
- ✅ **5 crédits photos gratuits par mois** (pour tester la génération d'images)
- ✅ **Filtres de base** (Tous/En cours/Terminés/Favoris)
- ✅ **Favoris** (marquer projets en ⭐)
- ❌ Pas de tags personnalisés
- ✅ Accès à toutes les fonctionnalités de base

### Plan PLUS — 2,99 €/mois
- ✅ 7 projets actifs
- ✅ Patrons illimités
- ✅ Sections illimitées
- ✅ Compteur de rangs
- ✅ Organisation premium
- ✅ **15 crédits photos par mois**
- ✅ **Tags personnalisés illimités** (cadeau, bébé, urgent...)
- ✅ **Filtrage multi-tags**
- ✅ **Suggestions de tags intelligentes**
- ✅ Support prioritaire

### Plan PLUS Annuel — 29,99 €/an (-15%)
- ✅ Tous les avantages du plan PLUS mensuel
- ✅ **Économie de 5.89€/an** par rapport au mensuel (35.88€ → 29.99€)
- ✅ Engagement 12 mois

### Plan PRO — 4,99 €/mois
- ✅ Projets illimités
- ✅ Patrons illimités
- ✅ Sections illimitées
- ✅ Compteur de rangs
- ✅ Organisation premium complète
- ✅ **30 crédits photos par mois** (génération d'images pro)
- ✅ Support prioritaire + réponses accélérées
- ✅ Accès premium aux nouveautés

### Plan PRO Annuel — 49,99 €/an (-17%)
- ✅ Tous les avantages du plan PRO mensuel
- ✅ **Économie de 9.89€/an** par rapport au mensuel (59.88€ → 49.99€)
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

**Tables clés** : users, projects, project_rows, project_stats, user_photos, user_photo_credits, payments, sections, project_tags, contact_messages, contact_rate_limit

---

## 🎮 Routes API principales

**Auth** : `POST /api/auth/register|login`, `GET /api/auth/me`
**Projets** : `GET|POST /api/projects`, `POST /api/projects/{id}/rows`, `GET /api/projects/stats`
**Sections** : `GET|POST /api/projects/{id}/sections`, `PUT /api/projects/{id}/sections/{section_id}`
**Tags & Filtres** : `POST /api/projects/{id}/tags`, `GET /api/user/tags/popular`, `PUT /api/projects/{id}/favorite`, `GET /api/projects?tags=cadeau,bébé&favorite=true&sort=date_desc`
**Photos IA** : `POST /api/photos`, `POST /api/photos/{id}/enhance-multiple` (1-5 photos, presets intelligents)
**Patrons** : `POST /api/patterns/generate` (BETA)
**Bibliothèque** : `GET|POST /api/pattern-library`, `DELETE /api/pattern-library/{id}`
**Contact** : `POST /api/contact` (public), `GET /api/admin/contact-messages` (admin), `PUT /api/admin/contact-messages/{id}/read` (admin)

---

## 🏷️ Tags & Filtres (v0.15.0)

**Feature premium** : Tags réservés aux plans PLUS/PRO, Favoris pour tous

### FREE - Organisation de base
- **Filtres** : Tous / En cours / Terminés / Favoris
- **Tri** : Date création / Dernière activité / Nom (A-Z, Z-A)
- **Favoris** : ⭐ Marquer/démarquer les projets importants
- **Pas de tags personnalisés**

### PLUS/PRO - Organisation premium
- **Tout FREE** +
- **Tags illimités** : Créer tags personnalisés (2-50 caractères)
- **Filtrage multi-tags** : Filtrer par plusieurs tags à la fois (mode OR)
- **Suggestions intelligentes** : Top 20 tags les plus utilisés
- **Tri avancé** : Par date modif / création / nom

### Routes API Tags
```
POST   /api/projects/{id}/tags              # Ajouter tags (body: {tags: ["cadeau", "bébé"]})
GET    /api/projects/{id}/tags              # Lister tags du projet
DELETE /api/projects/{id}/tags/{tag_name}   # Supprimer un tag
GET    /api/user/tags/popular               # Top 20 tags utilisateur (PLUS/PRO)
PUT    /api/projects/{id}/favorite          # Toggle favori (tous plans)
GET    /api/projects?tags=a,b&favorite=true # Filtrer projets
```

### Validation tags
- 2-50 caractères
- Lettres, chiffres, espaces, tirets uniquement
- Stockés en minuscules
- Pas de doublons par projet (UNIQUE KEY)

---

## 📸 AI Photo Studio

**Crédits** : FREE 5/mois, PLUS 15/mois, PRO 30/mois, Early Bird 30/mois
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
GEMINI_API_KEY=...
SUBSCRIPTION_PLUS_MONTHLY_PRICE=2.99
SUBSCRIPTION_PLUS_ANNUAL_PRICE=29.99
SUBSCRIPTION_PRO_MONTHLY_PRICE=4.99
SUBSCRIPTION_PRO_ANNUAL_PRICE=49.99
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

## 📝 État (v0.16.0)

**✅ Prêt** : Backend 100%, Frontend 100%, Database optimisée, Système d'abonnements sécurisé, Tags & Filtres, Système de contact complet
**⚠️ Manque prod** : Gemini API réelle, Stripe prod keys, Email SMTP, CGU/RGPD, Hébergement SSL
**Lancement** : Phase 1 BETA fermée (20-50 testeurs) → Phase 2 Public (Stripe, SEO) → Phase 3 Croissance

**Derniers ajouts (v0.16.0)** :
- ✅ **Système de contact complet** : Formulaire avec 4 catégories (Bug, Question, Suggestion, Autre)
- ✅ **Rate limiting anti-spam** : 3 messages/heure par IP
- ✅ **Emails automatiques** : Confirmation utilisateur + notification admin
- ✅ **Traçabilité complète** : IP, user agent, statut lu/non-lu
- ✅ **Accessible partout** : Lien dans header Landing, footer, menu profil, pages légales
- ✅ **Pré-remplissage auto** : Nom et email si utilisateur connecté
- ✅ **Dashboard admin** : Routes API pour gérer les messages (listMessages, markAsRead)

**Ajouts v0.15.0** :
- ✅ **Système de tags personnalisés** (PLUS/PRO uniquement)
- ✅ **Filtres avancés** : Statut, Favoris, Tags, Tri
- ✅ **Favoris** pour tous les plans (marquer projets ⭐)
- ✅ **Suggestions de tags intelligentes** (Top 20 tags utilisateur)
- ✅ **Composants React** : TagInput, TagBadge, ProjectFilters, UpgradePrompt
- ✅ **Backend complet** : 5 nouvelles routes API, permissions par plan
- ✅ **Upgrade prompt** pour FREE qui tente d'utiliser les tags

**Ajouts v0.14.0** :
- ✅ Nouveau plan PLUS intermédiaire (2.99€/mois, 7 projets, 15 crédits photos)
- ✅ Toggle Mensuel/Annuel sur Landing et Subscription
- ✅ Prix ajustés : PLUS 2.99€, PRO 4.99€ (mensuel et annuel)
- ✅ Intégration complète backend/frontend pour PLUS
- ✅ "Accès premium aux nouveautés" pour plan PRO

**Ajouts v0.13.0** :
- ✅ Bouton flottant pour les notes de projet (toujours accessible)
- ✅ Détails techniques avec couleurs YarnFlow (primary/sage/warm)
- ✅ Système de sections avec progression individuelle
- ✅ Compteur flottant avec timer et wake lock
- ✅ Bibliothèque de patrons avec catégories

**✅ Pricing cohérent dans toute l'application** :
- ✅ Plan FREE : 5 crédits photos/mois, 3 projets actifs max (les projets terminés ne comptent pas)
- ✅ Plan PLUS : 2.99€/mois (29.99€/an, -15%), 7 projets actifs, 15 crédits photos/mois
- ✅ Plan PRO : 4.99€/mois (49.99€/an, -17%), projets illimités, 30 crédits photos/mois
- ✅ Plan Early Bird : 2.99€/mois (waitlist uniquement)
- ✅ Packs crédits photos : 50@4.99€, 150@9.99€

---

**Docs** : `docs/guides/` | **MAJ** : 2025-12-20
