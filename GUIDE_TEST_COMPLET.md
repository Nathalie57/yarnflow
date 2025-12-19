# 🧪 Guide de Test Complet - YarnFlow

**Version** : 0.14.0 - PRICING V2 (FREE/PLUS/PRO)
**Date** : 2025-12-17
**Auteur** : Nathalie + Claude Code

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Tests Backend](#tests-backend)
4. [Tests Frontend](#tests-frontend)
5. [Tests AI Photo Studio v0.11.0](#tests-ai-photo-studio)
6. [Tests Responsive Mobile](#tests-responsive-mobile)
7. [Tests End-to-End](#tests-end-to-end)
8. [Checklist de Validation](#checklist-de-validation)

---

## 🔧 Prérequis

### Logiciels requis

- ✅ WAMP/XAMPP démarré (Apache + MySQL)
- ✅ PHP 8.1+ installé
- ✅ Composer installé
- ✅ Node.js 18+ et npm installés
- ✅ Navigateur moderne (Chrome, Firefox, Safari, Edge)

### Variables d'environnement

Vérifier que `backend/config/.env` existe et contient :

```ini
DB_HOST=localhost
DB_NAME=patron_maker
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=votre_cle_secrete_super_longue

FRONTEND_URL=http://localhost:5173
```

---

## 📦 Installation

### Étape 1 : Base de données

**Via phpMyAdmin** (`http://localhost/phpmyadmin`) :

1. Créer la base `patron_maker` (utf8mb4_unicode_ci)
2. Importer dans l'ordre :
   - ✅ `database/schema.sql` (tables principales)
   - ✅ `database/add_categories_table.sql` (catégories dynamiques)
   - ✅ `database/add_projects_system.sql` ⭐ (système de projets)
   - ✅ `database/seed_pattern_templates.sql` (patrons de référence)

**Vérification** :
```sql
-- Vérifier que toutes les tables existent
SHOW TABLES;

-- Résultat attendu (11 tables) :
-- users, patterns, pattern_templates, pattern_categories
-- payments, api_logs, password_resets
-- projects, project_rows, project_stats, project_sessions
```

### Étape 2 : Backend

```bash
cd /mnt/d/wamp64/www/pattern-maker/backend
composer install  # Si pas déjà fait
```

**Vérification** :
- Fichier `vendor/` existe
- Point d'entrée : `http://localhost/pattern-maker/backend/public/index.php`

### Étape 3 : Frontend

```bash
cd /mnt/d/wamp64/www/pattern-maker/frontend
npm install   # Si pas déjà fait
npm run dev   # Démarre le serveur de développement
```

**Vérification** :
- Terminal affiche : `Local: http://localhost:5173/`
- Ouvrir `http://localhost:5173` dans le navigateur

---

## 🧪 Tests Backend

### Test 1 : Connexion à la base de données

**Méthode** : Via phpMyAdmin

1. Aller sur `http://localhost/phpmyadmin`
2. Sélectionner la base `patron_maker`
3. Vérifier que toutes les tables sont présentes

**Résultat attendu** : ✅ 11 tables + 2 vues + 2 triggers

---

### Test 2 : API REST - Santé

**URL** : `http://localhost/pattern-maker/backend/public/api/health`

**Résultat attendu** :
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### Test 3 : Inscription d'un utilisateur

**Via le frontend** :

1. Aller sur `http://localhost:5173/register`
2. Remplir le formulaire :
   - Email : `test@example.com`
   - Mot de passe : `Test1234!`
   - Prénom : `Marie`
   - Nom : `Dupont`
3. Cliquer sur "S'inscrire"

**Résultat attendu** :
- ✅ Redirection vers `/dashboard`
- ✅ Message de bienvenue affiché
- ✅ Dans phpMyAdmin, vérifier qu'un utilisateur a été créé :

```sql
SELECT id, email, first_name, last_name, subscription_type
FROM users
WHERE email = 'test@example.com';
```

---

### Test 4 : Connexion

**Via le frontend** :

1. Se déconnecter (bouton "Déconnexion")
2. Aller sur `/login`
3. Se connecter avec :
   - Email : `test@example.com`
   - Mot de passe : `Test1234!`

**Résultat attendu** :
- ✅ Redirection vers `/dashboard`
- ✅ Token JWT stocké dans localStorage
- ✅ Profil utilisateur chargé

---

## 🎨 Tests Frontend

### Test 5 : Dashboard

**URL** : `http://localhost:5173/dashboard`

**Actions** :
1. Vérifier l'affichage :
   - ✅ Nom de l'utilisateur affiché
   - ✅ Type d'abonnement (FREE par défaut)
   - ✅ Quota : "0 / 3 patrons ce mois"
   - ✅ Quota : "0 / 2 projets"

---

### Test 6 : Générateur de patron (ADMIN SEULEMENT)

**⚠️ IMPORTANT** : Cette fonctionnalité est désormais **admin-only** pour le lancement v1.0.

**URL** : `http://localhost:5173/generator`

**Vérification de l'accès** :
1. Se connecter avec un compte **non-admin** → ✅ Lien "Générateur" invisible dans la navbar
2. Se connecter avec un compte **admin** → ✅ Lien "🤖 Générer" visible avec badge "ADMIN"

**Actions (si admin)** :

1. Remplir le formulaire :
   - Type : Bonnet
   - Sous-type : Slouchy
   - Niveau : Débutant
   - Taille : Adulte
   - Style : Décontracté
   - Couleur : Rouge
   - Laine : Acrylique
2. Cliquer sur "Générer le patron"

**Résultat attendu** :
- ✅ Loader affiché pendant 10-15 secondes
- ✅ Patron généré avec :
  - Titre
  - Description
  - Matériel nécessaire
  - Abréviations
  - Instructions complètes
  - Conseils
- ✅ Prix calculé affiché (ex: 2.99€)
- ✅ Boutons "Télécharger PDF" et "Commencer à crocheter/tricoter"

**Vérifier en BDD** :
```sql
SELECT id, title, level, type, status, ai_provider
FROM patterns
ORDER BY created_at DESC
LIMIT 1;
```

**Note stratégique** : Le générateur de patrons est masqué pour se concentrer sur le **tracker de projets** et l'**AI Photo Studio** au lancement.

---

### Test 7 : Créer un projet depuis un patron

**Actions** :

1. Sur la page du patron généré, cliquer sur **"🧶 Commencer à crocheter"**

**Résultat attendu** :
- ✅ Projet créé automatiquement avec :
  - Nom = titre du patron
  - Type = type du patron
  - `pattern_id` renseigné (lien vers le patron)
- ✅ Redirection automatique vers le compteur (`/projects/{id}/counter`)

**Vérifier en BDD** :
```sql
SELECT id, name, type, pattern_id, status
FROM projects
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 8 : Créer un projet SANS patron (YouTube, livre, etc.)

**URL** : `http://localhost:5173/my-projects`

**Actions** :

1. Cliquer sur "➕ Nouveau Projet"
2. Remplir le formulaire :
   - Nom : `Bonnet YouTube Marie Crochet`
   - Type : Bonnet
   - Description : `Tuto trouvé sur YouTube @MarieCrochet`
   - Nombre de rangs : `30`
   - Crochet : `5mm`
   - Fil : `Phildar Phil Douce`
   - Couleur : `Rouge bordeaux`
3. Cliquer sur "✨ Créer le projet"
4. Confirmer "Oui" pour ouvrir le compteur

**Résultat attendu** :
- ✅ Projet créé avec `pattern_id = NULL` ⭐ (tracker universel)
- ✅ Redirection vers le compteur

**Vérifier en BDD** :
```sql
SELECT id, name, pattern_id, total_rows, hook_size, yarn_brand
FROM projects
ORDER BY created_at DESC
LIMIT 1;

-- pattern_id doit être NULL
```

---

### Test 9 : Compteur de rangs

**URL** : `http://localhost:5173/projects/{id}/counter`

**Actions** :

1. **Vérifier l'affichage** :
   - ✅ Nom du projet en titre
   - ✅ Rang actuel : **0**
   - ✅ Barre de progression : 0% (si total_rows défini)
   - ✅ Timer : 00:00:00
   - ✅ Boutons +/- visibles

2. **Démarrer le timer** :
   - Cliquer sur "▶️ Démarrer"
   - ✅ Timer commence à compter

3. **Compter un rang** :
   - Cliquer sur le bouton **"+"**
   - ✅ Modal s'ouvre : "Rang 1 terminé !"
   - Remplir :
     - Mailles : `6`
     - Difficulté : ⭐⭐ (2 étoiles)
     - Notes : `Cercle magique`
   - Cliquer sur "Sauvegarder"

**Résultat attendu** :
- ✅ Modal se ferme
- ✅ Compteur passe à **1**
- ✅ Barre de progression : 3.33% (1/30)
- ✅ Historique à droite affiche "Rang 1"

**Vérifier en BDD** :
```sql
SELECT row_number, stitch_count, notes, difficulty_rating
FROM project_rows
WHERE project_id = ?
ORDER BY row_number DESC;
```

4. **Continuer à compter** :
   - Faire 5 rangs de plus (cliquer sur + et sauvegarder)
   - ✅ Compteur passe à **6**
   - ✅ Historique affiche les 6 rangs

5. **Terminer la session** :
   - Cliquer sur "⏹️ Terminer"
   - ✅ Timer s'arrête
   - ✅ Session sauvegardée en BDD

**Vérifier en BDD** :
```sql
SELECT started_at, ended_at, duration, rows_completed
FROM project_sessions
WHERE project_id = ?
ORDER BY started_at DESC
LIMIT 1;
```

---

### Test 10 : Liste des projets

**URL** : `http://localhost:5173/my-projects`

**Actions** :

1. **Vérifier l'affichage** :
   - ✅ Tous les projets créés s'affichent
   - ✅ Cartes avec photo (ou icône 🧶)
   - ✅ Badges de statut ("En cours", "Terminé", etc.)
   - ✅ Rang actuel / Total
   - ✅ Temps total
   - ✅ Barre de progression

2. **Tester les filtres** :
   - Cliquer sur "En cours"
   - ✅ Seuls les projets en cours s'affichent
   - Cliquer sur "Terminés"
   - ✅ Aucun projet (si aucun terminé)

3. **Marquer comme favori** :
   - Cliquer sur l'étoile vide ☆
   - ✅ L'étoile devient pleine ⭐

4. **Supprimer un projet** :
   - Cliquer sur 🗑️
   - Confirmer
   - ✅ Projet supprimé de la liste

---

## 📸 Tests AI Photo Studio v0.11.0

### Test 14 : Navigation vers la Galerie IA

**URL** : `http://localhost:5173/gallery`

**Vérification de l'accès** :
1. Dans la navbar, cliquer sur "📸 Galerie IA"
2. ✅ Badge "NEW" en violet visible à côté du lien
3. ✅ Page se charge correctement

---

### Test 15 : Génération d'une photo unique (HERO)

**Actions** :

1. **Sélectionner un projet existant** :
   - Dans la liste déroulante "Projet", choisir un projet de type "Bonnet"
   - ✅ Nom du projet s'affiche correctement

2. **Choisir la quantité** :
   - Cliquer sur "1 📸" dans la section "1️⃣ Combien de photos ?"
   - ✅ Bouton passe en surbrillance violette

3. **Choisir un preset** :
   - Cliquer sur "⭐ Photo hero" (1 photo)
   - ✅ Le preset se met en surbrillance violette
   - ✅ Les contextes se remplissent automatiquement en bas
   - ✅ Re-cliquer désélectionne le preset (toggleable)

4. **Vérifier les contextes** :
   - Section "3️⃣ Contextes" affiche : "Sur mannequin" (ou autre selon le type de projet)
   - ✅ Les contextes correspondent bien au type de projet (bonnet = wearable)

5. **Générer** :
   - Cliquer sur "📸 Générer les photos (1 crédit)"
   - ✅ Loading apparaît : "Génération en cours..."
   - ✅ Après 10-15 secondes, 1 photo s'affiche dans la galerie

6. **Vérifier la galerie** :
   - Scroller vers le bas jusqu'à "📸 Ma Galerie IA"
   - ✅ La photo générée apparaît avec :
     - Nom du projet
     - Contexte (ex: "Sur mannequin")
     - Date de génération
     - Bouton "Télécharger"
   - ✅ Cliquer sur la photo l'agrandit (modal ou nouvelle fenêtre)

---

### Test 16 : Génération de 5 photos (Collection complète)

**Actions** :

1. **Choisir la quantité 5** :
   - Cliquer sur "5 📸"
   - ✅ Prix indique : "4 crédits (-20% 🎉)"

2. **Choisir le preset "🌟 Collection complète"** :
   - Cliquer sur le preset "🌟 Collection complète (5 photos)"
   - ✅ Le preset se met en surbrillance
   - ✅ La quantité passe automatiquement à 5
   - ✅ Les 5 contextes se remplissent automatiquement

3. **Vérifier les 5 contextes** :
   - Section "3️⃣ Contextes" affiche 5 contextes différents
   - Pour un bonnet (wearable) : "Sur mannequin", "Flat lay", "Lifestyle", "Détail texture", "En situation"
   - ✅ Aucun contexte en double
   - ✅ Tous les contextes sont cohérents avec le type de projet

4. **Générer les 5 photos** :
   - Cliquer sur "📸 Générer les photos (4 crédits)"
   - ✅ Loading s'affiche : "Génération en cours... (5 photos)"
   - ✅ Après 30-60 secondes, 5 photos s'affichent dans la galerie

5. **Vérifier la galerie** :
   - ✅ 5 nouvelles cartes apparaissent
   - ✅ Chaque carte a un contexte différent
   - ✅ Chaque photo est unique (pas de doublons visuels)
   - ✅ Tous les boutons "Télécharger" fonctionnent

---

### Test 17 : Test des différents types de projets

**Objectif** : Vérifier que les contextes s'adaptent selon le type de projet

**Actions** :

1. **Projet type WEARABLE (Bonnet, Écharpe)** :
   - Sélectionner un projet "Bonnet"
   - Choisir preset "⭐ Photo hero"
   - ✅ Contexte suggéré : "Sur mannequin", "Flat lay", "Lifestyle"

2. **Projet type AMIGURUMI (Peluche, Doudou)** :
   - Créer un projet "Ours en peluche" (si pas existant)
   - Sélectionner ce projet dans la galerie
   - Choisir preset "⭐ Photo hero"
   - ✅ Contexte suggéré : "Mise en scène", "Flat lay", "Avec enfant", "Chambre enfant"

3. **Projet type ACCESSORY (Sac, Pochette)** :
   - Créer un projet "Sac cabas"
   - Sélectionner ce projet
   - Choisir preset "⭐ Photo hero"
   - ✅ Contexte suggéré : "Porté", "Flat lay", "Lifestyle"

4. **Projet type HOME DECOR (Couverture, Coussin)** :
   - Créer un projet "Plaid"
   - Sélectionner ce projet
   - Choisir preset "⭐ Photo hero"
   - ✅ Contexte suggéré : "Sur canapé", "Flat lay", "Lifestyle"

**Résultat attendu** :
- ✅ Les contextes changent automatiquement selon le type de projet
- ✅ Les presets s'adaptent intelligemment
- ✅ Les photos générées correspondent bien au contexte demandé

---

### Test 18 : Test des presets (tous les 15)

**Objectif** : Vérifier que tous les presets fonctionnent correctement

**Actions** :

1. **Vérifier l'affichage** :
   - Sur la page Galerie, section "2️⃣ Choisissez un preset rapide"
   - ✅ 15 presets affichés en grille :
     - 3 presets pour 1 photo
     - 3 presets pour 2 photos
     - 3 presets pour 3 photos
     - 3 presets pour 4 photos
     - 3 presets pour 5 photos

2. **Tester chaque preset** :

**Presets 1 photo** :
- ⭐ Photo hero → ✅ 1 contexte suggéré
- 📦 Produit → ✅ 1 contexte "Flat lay"
- 🎨 Créatif → ✅ 1 contexte original

**Presets 2 photos** :
- 📱 Réseaux sociaux → ✅ 2 contextes variés
- 🛍️ E-commerce → ✅ 2 contextes (hero + produit)
- 🎬 Avant/Après → ✅ 2 contextes (process + final)

**Presets 3 photos** :
- 🎯 Essentiel → ✅ 3 contextes clés
- 📖 Portfolio → ✅ 3 contextes variés
- 🌈 Variété → ✅ 3 contextes différents

**Presets 4 photos** :
- 💼 Pro → ✅ 4 contextes professionnels
- 🎨 Artistique → ✅ 4 contextes créatifs
- 📊 Complet → ✅ 4 contextes équilibrés

**Presets 5 photos** :
- 🌟 Collection complète → ✅ 5 contextes complets
- 🎁 Pack boutique → ✅ 5 contextes e-commerce
- 🏆 Premium → ✅ 5 contextes haut de gamme

3. **Vérifier la sélection/désélection** :
   - Cliquer sur un preset → ✅ Se met en surbrillance
   - Re-cliquer sur le même preset → ✅ Se désélectionne
   - Cliquer sur un autre preset → ✅ Le précédent se désélectionne, le nouveau se sélectionne

4. **Vérifier l'auto-ajustement de quantité** :
   - Choisir quantité 1
   - Cliquer sur preset "🌟 Collection complète (5 photos)"
   - ✅ La quantité passe automatiquement à 5
   - ✅ Le prix passe à "4 crédits (-20% 🎉)"

---

### Test 19 : Test de la tarification

**Actions** :

1. **1 photo** : ✅ "1 crédit"
2. **2 photos** : ✅ "2 crédits"
3. **3 photos** : ✅ "3 crédits"
4. **4 photos** : ✅ "4 crédits"
5. **5 photos** : ✅ "4 crédits (-20% 🎉)" → **Promotion visible**

**Résultat attendu** :
- ✅ Message de promotion bien visible pour 5 photos
- ✅ Encourage l'utilisateur à prendre le pack de 5

---

### Test 20 : Gestion des erreurs

**Actions** :

1. **Aucun projet sélectionné** :
   - Ne pas sélectionner de projet
   - Cliquer sur "Générer"
   - ✅ Message d'erreur : "Veuillez sélectionner un projet"

2. **Aucun contexte sélectionné** :
   - Sélectionner un projet
   - Ne pas choisir de preset ni de contexte manuel
   - Cliquer sur "Générer"
   - ✅ Message d'erreur : "Veuillez choisir au moins un contexte"

3. **Quota dépassé** (si applicable) :
   - Générer plus de crédits que disponibles
   - ✅ Message : "Quota dépassé, veuillez upgrader"

---

## 📱 Tests Responsive Mobile

### Test 21 : Mode mobile (DevTools)

**Actions** :

1. Ouvrir Chrome DevTools (F12)
2. Activer le mode Device Toolbar (Ctrl+Shift+M)
3. Sélectionner "iPhone 12 Pro" (390x844)

**Pages à tester** :

#### ✅ Dashboard
- Header responsive
- Boutons pleine largeur sur mobile
- Cartes empilées verticalement

#### ✅ Générateur
- Formulaire responsive
- Boutons adaptés
- Pas de débordement horizontal

#### ✅ Mes Projets
- Header empilé verticalement sur mobile
- Bouton "Nouveau Projet" pleine largeur
- Filtres affichent seulement les icônes sur mobile
- Cartes en 1 colonne

#### ✅ Compteur de rangs ⭐
- **Compteur** : Taille de police adaptée (text-6xl sur mobile vs text-9xl desktop)
- **Boutons +/-** : Plus petits sur mobile (w-16 h-16 vs w-32 h-32)
- **Timer** : Boutons pleine largeur sur mobile
- **Modal** : Scrollable si trop haute
- **Boutons de difficulté** : Responsive avec flex-wrap

#### ✅ Navbar
- Menu hamburger sur mobile (si implémenté)
- Liens empilés verticalement

---

#### ✅ Galerie IA (AI Photo Studio) ⭐ NOUVEAU
- Header responsive
- Sélecteur de projet adapté (pleine largeur sur mobile)
- Grille de quantité : 5 boutons en ligne (flex-wrap si nécessaire)
- Grille de presets : 2 colonnes sur mobile (grid-cols-2), 3 sur tablette (md:grid-cols-3), 5 sur desktop (lg:grid-cols-5)
- Section contextes : Checkboxes empilés verticalement
- Bouton "Générer" pleine largeur sur mobile
- Galerie de photos : 1 colonne sur mobile, 2 sur tablette, 3-4 sur desktop

### Test 22 : Mode tablette

**Actions** :

1. Sélectionner "iPad Mini" (768x1024)
2. Tester toutes les pages

**Résultat attendu** :
- ✅ Layout intermédiaire (entre mobile et desktop)
- ✅ Grid : 2 colonnes pour les projets (md:grid-cols-2)
- ✅ Compteur : Taille intermédiaire (text-8xl)

---

### Test 23 : Touch events

**Actions** (sur appareil mobile réel ou simulateur) :

1. Ouvrir l'app sur smartphone réel
2. Tester le compteur :
   - ✅ Cliquer sur + fonctionne au doigt (touch-manipulation)
   - ✅ Pas de délai de 300ms
   - ✅ Zones de clic assez grandes (44x44px minimum)
   - ✅ États active: fonctionnent au toucher

---

## 🔄 Tests End-to-End

### Scénario 1 : Utilisatrice débutante (Tracker universel)

**Persona** : Marie, 25 ans, débutante en tricot/crochet

1. **Inscription** :
   - ✅ Créer un compte via `/register`
   - ✅ Recevoir le JWT token
   - ✅ Arrivée sur le dashboard

2. **Découvrir le tracker** :
   - ✅ Voir le dashboard avec statistiques vides
   - ✅ Cliquer sur "📊 Mes Projets"
   - ✅ Voir le message "Aucun projet"

3. **Créer premier projet (tuto YouTube)** :
   - ✅ Cliquer sur "➕ Nouveau Projet"
   - ✅ Remplir : "Bonnet débutant YouTube"
   - ✅ Type : Bonnet, 30 rangs, crochet 5mm
   - ✅ Ouvrir le compteur
   - ✅ Faire 5 rangs avec le timer

4. **Pause et retour** :
   - ✅ Fermer l'onglet
   - ✅ Revenir plus tard (le lendemain)
   - ✅ Retrouver le projet avec "Rang 5/30"
   - ✅ Continuer le comptage

5. **Terminer le projet** :
   - ✅ Arriver au rang 30/30
   - ✅ Marquer comme "Terminé"
   - ✅ Consulter les statistiques (temps total, vitesse)

6. **Découvrir l'AI Photo Studio** ⭐ :
   - ✅ Cliquer sur "📸 Galerie IA"
   - ✅ Sélectionner le projet "Bonnet débutant"
   - ✅ Choisir preset "⭐ Photo hero"
   - ✅ Générer 1 photo professionnelle
   - ✅ Télécharger la photo pour Instagram

7. **Atteindre le quota** :
   - ✅ Créer un 2e projet (écharpe)
   - ✅ Créer un 3e projet → ✅ Message : "Quota FREE atteint (3 projets max)"
   - ✅ Lien vers `/subscription`

---

### Scénario 2 : Utilisatrice régulière (Power user tracker)

**Persona** : Sophie, 35 ans, tricote/crochète régulièrement depuis 2 ans

1. **Inscription** :
   - ✅ Créer compte FREE
   - ✅ Voir le dashboard

2. **Tracker actif quotidien** :
   - ✅ Créer 3 projets simultanés :
     - Bonnet (tuto YouTube)
     - Pull (livre Drops)
     - Chaussettes (patron Pinterest)
   - ✅ Utiliser le compteur quotidiennement pendant 7 jours
   - ✅ Accumuler 100+ rangs sur une semaine

3. **Découvrir les statistiques** ⭐ :
   - ✅ Aller sur "📈 Stats"
   - ✅ Voir le temps total de tricot/crochet (ex: 12h30)
   - ✅ Voir les rangs complétés (ex: 125 rangs)
   - ✅ Voir la vitesse moyenne (ex: 10 rangs/heure)
   - ✅ Voir le streak (ex: 7 jours consécutifs) 🔥

4. **Utiliser l'AI Photo Studio pour partager** :
   - ✅ Terminer le bonnet
   - ✅ Générer 5 photos avec preset "🌟 Collection complète"
   - ✅ Télécharger les 5 photos
   - ✅ Partager sur Instagram/Ravelry

5. **Conversion à PLUS ou PRO** :
   - ✅ Vouloir créer un 4e projet simultané
   - ✅ Message : "Quota FREE atteint (3 projets max)"
   - ✅ Voir la valeur apportée par le tracker quotidien
   - ✅ Upgrade vers PLUS (2.99€/mois → 7 projets, 15 crédits photos) ou PRO (4.99€/mois → projets illimités, 30 crédits photos)

---

### Scénario 3 : Créatrice de contenus (PRO user)

**Persona** : Nathalie, créatrice de contenus tricot/crochet sur Instagram/YouTube

1. **Inscription PRO** :
   - ✅ Créer compte
   - ✅ Upgrade immédiat vers PRO (4.99€/mois → projets illimités, 30 crédits photos/mois)

2. **Usage intensif du tracker** :
   - ✅ Créer 20+ projets simultanés (échantillons, tests, commandes)
   - ✅ Tracker actif quotidien avec timer pour chaque session
   - ✅ Accumuler 500+ rangs/mois

3. **AI Photo Studio pour contenus professionnels** ⭐ :
   - ✅ Pour chaque projet terminé :
     - Générer 5 photos (preset "🌟 Collection complète")
     - Télécharger toutes les photos
     - Utiliser pour :
       - Posts Instagram (carrousel de 5 photos)
       - Miniatures YouTube
       - Portfolio Etsy/boutique
   - ✅ Générer 50+ photos/mois (10 projets × 5 photos)

4. **Statistiques pro** :
   - ✅ Consulter les stats hebdomadaires/mensuelles
   - ✅ Mesurer la productivité (rangs/heure, temps/projet)
   - ✅ Partager les streaks avec la communauté

5. **Partage communautaire** (futur v1.1) :
   - ✅ Marquer projets en "public"
   - ✅ Apparaître dans la galerie communautaire
   - ✅ Inspirer d'autres utilisatrices

---

## ✅ Checklist de Validation

### Backend

- [ ] Base de données créée avec toutes les tables
- [ ] API de santé répond correctement
- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] JWT tokens générés correctement
- [ ] Génération de patrons via IA fonctionne
- [ ] CRUD projets fonctionne
- [ ] CRUD rangs fonctionne
- [ ] Sessions de travail fonctionnent
- [ ] Quotas utilisateurs appliqués
- [ ] Triggers MySQL fonctionnent

### Frontend

#### Pages principales
- [ ] Page Login fonctionne
- [ ] Page Register fonctionne
- [ ] Dashboard affiche les bonnes données
- [ ] Navbar avec état actif dynamique
- [ ] Générateur de patrons (admin-only) fonctionne
- [ ] Mes Patrons affiche la liste
- [ ] Détail d'un patron affiche le contenu
- [ ] Bouton "Commencer à crocheter/tricoter" fonctionne

#### Tracker de projets ⭐
- [ ] Mes Projets affiche la liste
- [ ] Création de projet (sans patron) fonctionne
- [ ] Création de projet (depuis patron) fonctionne
- [ ] Compteur de rangs fonctionne
- [ ] Boutons +/- fonctionnent
- [ ] Timer démarre/s'arrête correctement
- [ ] Modal d'ajout de rang fonctionne
- [ ] Historique des rangs s'affiche
- [ ] Filtres de statut fonctionnent
- [ ] Favoris fonctionnent
- [ ] Suppression fonctionne
- [ ] Page Stats affiche les métriques

#### AI Photo Studio v0.11.0 ⭐ NOUVEAU
- [ ] Page Galerie IA accessible
- [ ] Badge "NEW" visible dans la navbar
- [ ] Sélecteur de projet fonctionne
- [ ] Sélecteur de quantité (1-5 photos) fonctionne
- [ ] 15 presets s'affichent correctement
- [ ] Clic sur preset sélectionne/désélectionne
- [ ] Clic sur preset ajuste automatiquement la quantité
- [ ] Contextes s'adaptent selon le type de projet
- [ ] Aucun contexte en double dans les presets
- [ ] Tarification affiche "4 crédits (-20%)" pour 5 photos
- [ ] Bouton "Générer" fonctionne
- [ ] Loading s'affiche pendant la génération
- [ ] Photos générées s'affichent dans la galerie
- [ ] Bouton "Télécharger" fonctionne
- [ ] Gestion des erreurs (projet manquant, contextes manquants)

### Responsive Mobile

- [ ] Toutes les pages sont responsive (iPhone 12 Pro, iPad Mini)
- [ ] Boutons assez grands pour le toucher (44x44px min)
- [ ] Pas de débordement horizontal
- [ ] Touch events fonctionnent (active:)
- [ ] Modals scrollables sur petits écrans
- [ ] Filtres adaptés (icônes sur mobile)
- [ ] Grilles adaptatives (1/2/3 colonnes selon device)
- [ ] Galerie IA : Presets en 2 colonnes mobile, 3 tablette, 5 desktop
- [ ] Galerie IA : Bouton "Générer" pleine largeur mobile
- [ ] Compteur : Taille police adaptée (text-6xl mobile vs text-9xl desktop)

### Intégration

- [ ] Workflow v1.0 prioritaire : Register → Projet (YouTube/Pinterest) → Compteur → Stats → AI Photo Studio ⭐
- [ ] Workflow générateur (admin) : Register → Générateur → Projet → Compteur
- [ ] Workflow complet : Tracker → Terminer projet → AI Photo Studio → Télécharger photos
- [ ] Quotas respectés (FREE : 3 projets max)
- [ ] Données persistées en BDD (projets, rangs, sessions, photos)
- [ ] Rafraîchissement de page ne perd pas les données
- [ ] Déconnexion/reconnexion conserve tout (projets, stats, photos)
- [ ] Navigation : Onglet actif suit la page actuelle
- [ ] Générateur visible uniquement pour les admins

---

## 🐛 Débogage

### Problème : MySQL ne démarre pas

**Solution** :
1. Vérifier que WAMP est démarré (icône verte)
2. Vérifier que le port 3306 n'est pas utilisé
3. Redémarrer WAMP

### Problème : 404 sur l'API

**Solution** :
1. Vérifier que le backend tourne sur `http://localhost/pattern-maker/backend/public`
2. Vérifier `.htaccess` dans `backend/public/`
3. Vérifier les logs Apache

### Problème : "Class not found"

**Solution** :
```bash
cd backend
composer dump-autoload
```

### Problème : CORS error

**Solution** :
1. Vérifier que `FRONTEND_URL=http://localhost:5173` dans `.env`
2. Vérifier le middleware CORS dans `backend/middleware/CorsMiddleware.php`

### Problème : Frontend ne charge pas

**Solution** :
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Métriques de succès

**L'application YarnFlow v0.11.0 est considérée comme prête au lancement si** :

✅ **Taux de réussite des tests : ≥ 95%**

- Inscription/Connexion : 100%
- Tracker de projets ⭐ : 100%
- Compteur de rangs ⭐ : 100%
- Statistiques Strava-style ⭐ : 100%
- AI Photo Studio v0.11.0 ⭐ : 100%
- Générateur de patrons (admin-only) : 90%
- Responsive mobile : ≥ 90%

✅ **Performance** :

- Temps de chargement page < 2s
- Génération patron < 20s (admin)
- Génération photos IA < 60s (5 photos)
- Réponse API < 500ms

✅ **UX Mobile** :

- Boutons cliquables facilement au doigt (44x44px min)
- Pas de zoom nécessaire
- Texte lisible (min 14px)
- Grilles adaptatives fonctionnent
- Presets AI Photo Studio utilisables sur mobile

✅ **Différenciation vs concurrents** :

- Tracker universel (YouTube, Pinterest, livres) ✅
- Statistiques motivantes (Strava-style) ✅
- AI Photo Studio (unique !) ✅
- Support tricot + crochet ✅

---

## 🎯 Prochains tests à implémenter

- [ ] Tests unitaires PHP (PHPUnit)
- [ ] Tests frontend (Vitest)
- [ ] Tests E2E automatisés (Playwright)
- [ ] Tests de charge (100+ utilisateurs simultanés)
- [ ] Tests de sécurité (injections SQL, XSS)
- [ ] Tests d'accessibilité (WCAG 2.1)

---

## 🎉 Résumé des nouveautés v0.14.0

**Features principales à tester en priorité** :

1. ✨ **AI Photo Studio** - Génération de 1 à 5 photos contextuelles
2. 🎯 **15 presets rapides** - Tous affichés, auto-ajustement de quantité
3. 🧠 **Contextes intelligents** - Adaptation selon type de projet (bonnet vs amigurumi)
4. 💰 **Tarification -20%** - 5 photos = 4 crédits
5. 💳 **Système PLUS/PRO** - FREE (5 crédits), PLUS (15 crédits), PRO (30 crédits)
6. 📦 **Système de sections** - Organisation avancée des projets
7. 🔒 **Générateur admin-only** - Masqué pour utilisateurs normaux
8. 🎨 **Navigation active dynamique** - Onglet actif suit la page

**Différenciation stratégique** :
- YarnFlow = Seule app avec tracker universel + AI Photo Studio professionnel + 3 tiers de pricing
- Concurrent "Compte Rangs" = Compteur basique sans cloud ni photos IA

---

**Créé le** : 2025-11-14
**Dernière mise à jour** : 2025-12-17 (v0.14.0 - PRICING V2 FREE/PLUS/PRO)
**Testé par** : Nathalie

🧶 **Bon test et bon lancement v1.0 !**
