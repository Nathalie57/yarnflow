# 📚 Index de la documentation - Crochet Hub

**Version** : 0.7.0
**Dernière mise à jour** : 2025-11-14

---

## 📖 Documentation principale

### [README.md](../README.md)
**Vue d'ensemble du projet**
- Présentation rapide
- Installation en 3 étapes
- Configuration de base
- Liens vers documentation détaillée

### [CLAUDE.md](../CLAUDE.md)
**Documentation technique complète**
- Architecture complète du projet
- Base de données (10 tables)
- Classes PHP (modèles, services, contrôleurs)
- Routes API (50+ endpoints)
- Workflow de génération
- Concepts clés (prompt engineering, tracker universel)
- Statistiques et changelog

---

## 🎯 Guides spécialisés (docs/guides/)

### [CROCHET_HUB_SETUP.md](guides/CROCHET_HUB_SETUP.md)
**Installation du système de projets**
- Guide complet d'installation
- Import SQL du système de tracking
- Tests de fonctionnement
- Stratégie de monétisation détaillée
- Métriques de succès
- ~600 lignes

### [ADMIN_OPTIONS_GUIDE.md](guides/ADMIN_OPTIONS_GUIDE.md)
**Gestion des options de personnalisation**
- Interface admin pour gérer 30+ options
- 7 groupes d'options
- Exemples de configuration
- Workflow complet
- ~375 lignes

### [RESPONSIVE_MOBILE.md](guides/RESPONSIVE_MOBILE.md)
**Optimisation mobile et responsive**
- Breakpoints TailwindCSS
- Tailles de boutons touch-friendly
- Grilles adaptatives
- Tests sur différents appareils
- Best practices
- ~450 lignes

### [PERSONNALISATION_AVANCEE_BACKEND.md](guides/PERSONNALISATION_AVANCEE_BACKEND.md)
**Système de personnalisation backend**
- Table pattern_options
- Modèle PatternOption.php
- Intégration avec l'IA
- Architecture complète
- ~395 lignes

---

## 🧪 Tests

### [../GUIDE_TEST_COMPLET.md](../GUIDE_TEST_COMPLET.md)
**Guide de test exhaustif**
- Installation et prérequis
- Tests backend (API, BDD)
- Tests frontend (pages, composants)
- Tests responsive mobile
- Tests end-to-end (scénarios utilisateurs)
- Checklist de validation
- Dépannage
- ~660 lignes

---

## 📦 Archives (docs/archive/)

### [MIGRATION_CATEGORIES.md](archive/MIGRATION_CATEGORIES.md)
**Guide de migration des catégories** (complété)
- Migration objet JS → BDD
- Avantages de la migration
- Checklist de migration
- ~185 lignes

### [RESUME_SESSION_2025-11-13.md](archive/RESUME_SESSION_2025-11-13.md)
**Résumé de la session du 13/11/2025**
- Travaux réalisés
- Fichiers créés/modifiés
- Architecture finale
- Statistiques
- ~230 lignes

---

## 🗂️ Base de données (database/)

### [README_categories.md](../database/README_categories.md)
**Guide d'utilisation des catégories**
- Installation de la table
- Structure des données
- Interface d'administration
- API endpoints
- Exemples d'utilisation
- ~175 lignes

### Scripts SQL
- `schema.sql` - Schéma principal (users, patterns, payments)
- `add_categories_table.sql` - Catégories dynamiques
- `add_projects_system.sql` - Système de projets et tracking
- `add_pattern_options_table.sql` - Options de personnalisation
- `seed_pattern_templates.sql` - Patrons de référence

---

## 📊 Taille des fichiers

**Total documentation** : ~4000 lignes

**Répartition** :
- Documentation principale : ~850 lignes (CLAUDE.md 400 + README.md 220 + GUIDE_TEST 660)
- Guides spécialisés : ~2220 lignes
- Archives : ~415 lignes
- Database README : ~175 lignes

**Optimisations effectuées (2025-11-14)** :
- ✅ CLAUDE.md réduit de 1257 → 400 lignes (-68%)
- ✅ README.md réduit de 236 → 220 lignes
- ✅ TESTING.md supprimé (doublon avec GUIDE_TEST_COMPLET.md)
- ✅ Fichiers archivés : RESUME_SESSION, MIGRATION_CATEGORIES
- ✅ Structure docs/ organisée (guides/ + archive/)

---

## 🎯 Quelle documentation lire ?

### Je débute sur le projet
👉 **Commencez par** : [README.md](../README.md)
- Installation rapide
- Vue d'ensemble

### Je veux comprendre l'architecture
👉 **Lisez** : [CLAUDE.md](../CLAUDE.md)
- Architecture complète
- Tables, modèles, contrôleurs
- Concepts clés

### Je veux installer le système de projets
👉 **Suivez** : [CROCHET_HUB_SETUP.md](guides/CROCHET_HUB_SETUP.md)
- Guide pas à pas
- Import SQL
- Tests

### Je veux tester l'application
👉 **Utilisez** : [GUIDE_TEST_COMPLET.md](../GUIDE_TEST_COMPLET.md)
- Tests backend + frontend
- Scénarios utilisateurs
- Checklist complète

### Je veux gérer les options de personnalisation
👉 **Consultez** : [ADMIN_OPTIONS_GUIDE.md](guides/ADMIN_OPTIONS_GUIDE.md)
- Interface admin
- Configuration des options

### Je veux optimiser le mobile
👉 **Lisez** : [RESPONSIVE_MOBILE.md](guides/RESPONSIVE_MOBILE.md)
- Best practices responsive
- Tests sur appareils

---

## 🔍 Navigation rapide par thème

### Backend PHP
- Architecture : [CLAUDE.md](../CLAUDE.md) § Classes PHP
- Options avancées : [PERSONNALISATION_AVANCEE_BACKEND.md](guides/PERSONNALISATION_AVANCEE_BACKEND.md)

### Frontend React
- Architecture : [CLAUDE.md](../CLAUDE.md) § Frontend
- Responsive : [RESPONSIVE_MOBILE.md](guides/RESPONSIVE_MOBILE.md)

### Base de données
- Tables : [CLAUDE.md](../CLAUDE.md) § Base de données
- Catégories : [README_categories.md](../database/README_categories.md)

### Fonctionnalités
- Tracker projets : [CROCHET_HUB_SETUP.md](guides/CROCHET_HUB_SETUP.md)
- Options personnalisation : [ADMIN_OPTIONS_GUIDE.md](guides/ADMIN_OPTIONS_GUIDE.md)

### Tests
- Guide complet : [GUIDE_TEST_COMPLET.md](../GUIDE_TEST_COMPLET.md)

---

**Navigation** : [← Retour au README](../README.md) | [Documentation complète →](../CLAUDE.md)
