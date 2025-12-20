# Checklist Pré-Lancement YarnFlow v0.16.0

**Date:** 2025-12-20
**Objectif:** Valider tous les aspects de YarnFlow avant le lancement officiel
**Environnement:** Staging → Production

---

## 🎯 Déploiement Infrastructure

### Base de données
- [ ] Base de données créée sur le serveur staging
- [ ] Toutes les migrations appliquées dans l'ordre (15 fichiers SQL)
- [ ] Tables vérifiées : `users`, `projects`, `project_rows`, `project_sections`, `user_photos`, `payments`, `contact_messages`, `contact_rate_limit`, etc.
- [ ] Indexes créés correctement
- [ ] Foreign keys fonctionnelles
- [ ] Utilisateur admin de test créé

### Fichiers et permissions
- [ ] Frontend déployé (fichiers `dist/`)
- [ ] Backend déployé (dossier `api/`)
- [ ] Fichier `.env` configuré avec credentials staging
- [ ] Dossier `uploads/` créé avec permissions 755
- [ ] Dossier `uploads/photos/` créé avec permissions 755
- [ ] Dossier `uploads/patterns/` créé avec permissions 755
- [ ] `.htaccess` racine configuré (HTTPS + routing SPA)
- [ ] `.htaccess` API configuré (CORS + routing)

### SSL et domaine
- [ ] SSL (HTTPS) actif sur le sous-domaine staging
- [ ] Certificat Let's Encrypt valide
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] Sous-domaine accessible : `https://staging.yarnflow.fr`

### Variables d'environnement (.env)
- [ ] `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` configurés
- [ ] `JWT_SECRET` unique et sécurisé (différent de local)
- [ ] `APP_ENV=staging`
- [ ] `STRIPE_SECRET_KEY` (mode TEST)
- [ ] `STRIPE_PUBLISHABLE_KEY` (mode TEST)
- [ ] `STRIPE_WEBHOOK_SECRET` (mode TEST)
- [ ] Price IDs Stripe configurés (PLUS, PRO, packs crédits)
- [ ] `GEMINI_API_KEY` ou `ANTHROPIC_API_KEY`
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- [ ] `SMTP_FROM_EMAIL=noreply@yarnflow.fr`
- [ ] `CONTACT_EMAIL=contact@yarnflow.fr`

---

## ✅ Tests Fonctionnels Critiques

### Authentification
- [ ] Inscription nouveau compte fonctionne
- [ ] Email de vérification reçu (si activé)
- [ ] Connexion avec email/mot de passe fonctionne
- [ ] Déconnexion fonctionne
- [ ] Token JWT valide et expire correctement
- [ ] Réinitialisation mot de passe fonctionne
- [ ] OAuth Google fonctionne (si activé)
- [ ] OAuth Facebook fonctionne (si activé)

### Gestion des projets
- [ ] Créer un nouveau projet (tricot/crochet)
- [ ] Liste des projets s'affiche correctement
- [ ] Filtrer par statut (En cours / Terminés)
- [ ] Filtrer par favoris (⭐)
- [ ] Marquer/démarquer un projet en favori
- [ ] Trier par date création / dernière activité / nom
- [ ] Modifier un projet existant
- [ ] Supprimer un projet
- [ ] Marquer projet comme terminé
- [ ] Démarquer projet terminé (repasse en cours)

### Tags (PLUS/PRO uniquement)
- [ ] Utilisateur FREE ne peut pas ajouter de tags
- [ ] Utilisateur FREE voit le prompt "Upgrade to PLUS"
- [ ] Utilisateur PLUS peut ajouter des tags
- [ ] Utilisateur PRO peut ajouter des tags
- [ ] Tags enregistrés en minuscules
- [ ] Validation 2-50 caractères fonctionne
- [ ] Suggestions de tags populaires affichées
- [ ] Filtrage multi-tags fonctionne (mode OR)
- [ ] Suppression d'un tag fonctionne
- [ ] Pas de doublons de tags sur un même projet

### Compteur de rangs
- [ ] Incrémenter un rang (+1)
- [ ] Décrémenter un rang (-1)
- [ ] Incrémenter plusieurs rangs (+10)
- [ ] Ajouter/modifier des notes au rang
- [ ] Historique des rangs visible
- [ ] Timer manuel fonctionne (démarrer/pause/arrêter)
- [ ] Wake Lock empêche la mise en veille (mobile)

### Sections
- [ ] Créer une nouvelle section
- [ ] Modifier le nom d'une section
- [ ] Réorganiser les sections (drag & drop)
- [ ] Marquer section comme complétée
- [ ] Démarquer section complétée
- [ ] Supprimer une section
- [ ] Progression section calculée correctement
- [ ] Progression globale projet mise à jour

### AI Photo Studio
- [ ] Upload d'une photo fonctionne
- [ ] Photo visible dans la galerie
- [ ] Générer 1 variation IA fonctionne
- [ ] Générer 5 variations IA en batch fonctionne
- [ ] Sélection de preset fonctionne (Hero, Produit, Etsy, etc.)
- [ ] Sélection de style fonctionne (lifestyle, studio, etc.)
- [ ] Crédits photos déduits correctement
- [ ] Variations liées à la photo parent (`parent_photo_id`)
- [ ] Téléchargement photo fonctionne (PLUS/PRO)
- [ ] Suppression photo fonctionne
- [ ] Suppression photo parent ne supprime pas les variations
- [ ] Message erreur si crédits insuffisants

### Crédits photos
- [ ] Crédits FREE : 5 crédits/mois
- [ ] Crédits PLUS : 15 crédits/mois
- [ ] Crédits PRO : 30 crédits/mois
- [ ] Affichage du compteur de crédits correct
- [ ] Renouvellement mensuel automatique (à tester sur le long terme)
- [ ] Achat pack 50 crédits fonctionne
- [ ] Achat pack 150 crédits fonctionne

### Abonnements Stripe
- [ ] Page `/subscription` accessible
- [ ] Toggle Mensuel/Annuel fonctionne
- [ ] Prix affichés corrects (PLUS 2.99€, PRO 4.99€)
- [ ] Économies affichées correctement (annuel -15% / -17%)
- [ ] Bouton "S'abonner PLUS mensuel" → Checkout Stripe
- [ ] Bouton "S'abonner PLUS annuel" → Checkout Stripe
- [ ] Bouton "S'abonner PRO mensuel" → Checkout Stripe
- [ ] Bouton "S'abonner PRO annuel" → Checkout Stripe
- [ ] Paiement réussi → Redirection vers `/payment/success`
- [ ] Paiement annulé → Redirection vers `/subscription`
- [ ] Statut abonnement mis à jour dans BDD
- [ ] Limites projets mises à jour (3 → 7 → illimité)
- [ ] Crédits photos mis à jour (5 → 15 → 30)
- [ ] Webhook Stripe reçu et traité
- [ ] Renouvellement automatique (à tester sur le long terme)
- [ ] Annulation abonnement fonctionne
- [ ] Downgrade PLUS → FREE fonctionne
- [ ] Upgrade FREE → PLUS fonctionne
- [ ] Upgrade PLUS → PRO fonctionne

### Système de contact (v0.16.0)
- [ ] Page `/contact` accessible
- [ ] Formulaire visible pour utilisateur non connecté
- [ ] Champs nom et email requis si non connecté
- [ ] Formulaire visible pour utilisateur connecté
- [ ] Nom et email pré-remplis si connecté
- [ ] Validation front-end fonctionne (sujet max 200, message max 5000)
- [ ] Sélection catégorie fonctionne (bug, question, suggestion, autre)
- [ ] Envoi message réussit (code 201)
- [ ] Email confirmation reçu par l'utilisateur
- [ ] Email notification reçu à `CONTACT_EMAIL`
- [ ] Rate limiting : 3 messages/heure maximum
- [ ] 4e message bloqué avec erreur 429
- [ ] Message erreur affiché : "Trop de messages envoyés..."
- [ ] Redirection après succès : `/my-projects` si connecté, `/` sinon
- [ ] Lien "Contact" visible dans header (Landing)
- [ ] Lien "Contact" visible dans footer (Landing)
- [ ] Lien "Contact" visible dans menu profil (App)
- [ ] Lien "Contact" visible sur Login/Register
- [ ] Lien "Contact" visible sur CGU/Privacy/Mentions

### Bibliothèque de patrons
- [ ] Créer un patron manuel
- [ ] Générer un patron avec IA (BETA)
- [ ] Sauvegarder patron dans bibliothèque
- [ ] Filtrer par catégorie (pull, bonnet, écharpe, etc.)
- [ ] Supprimer un patron
- [ ] Utiliser patron pour créer un projet

### Admin (si admin activé)
- [ ] Page admin accessible uniquement pour `is_admin=1`
- [ ] Liste des utilisateurs visible
- [ ] Filtrer utilisateurs par plan (FREE/PLUS/PRO)
- [ ] Liste des paiements visible
- [ ] Filtrer paiements par type (subscription/credits)
- [ ] Statistiques globales affichées
- [ ] Liste des messages de contact visible
- [ ] Filtrer messages par statut (unread/read)
- [ ] Filtrer messages par catégorie (bug/question/suggestion)
- [ ] Marquer message comme lu fonctionne

---

## 🎨 Tests UI/UX

### Design et responsive
- [ ] Landing page responsive (mobile/tablet/desktop)
- [ ] Dashboard responsive
- [ ] MyProjects responsive
- [ ] Navigation mobile (hamburger menu) fonctionne
- [ ] Bottom navigation mobile affichée correctement
- [ ] Thème YarnFlow cohérent (primary/sage/warm)
- [ ] Transitions smooth
- [ ] Pas de décalage de layout (CLS)
- [ ] Images optimisées et chargent rapidement

### Navigation
- [ ] Routes privées protégées (redirection si non connecté)
- [ ] Routes publiques accessibles
- [ ] Breadcrumbs fonctionnent
- [ ] Retour arrière fonctionne
- [ ] 404 pour routes inexistantes
- [ ] Deep linking fonctionne (ex: `/projects/123`)

### Performance
- [ ] Page Landing charge en < 2s
- [ ] Dashboard charge en < 3s
- [ ] API répond en < 500ms (la plupart des requêtes)
- [ ] Images lazy-load
- [ ] Pas de requêtes API inutiles
- [ ] Bundle JS < 1MB
- [ ] Lighthouse score > 90 (performance)

---

## 🔒 Tests Sécurité

### Authentication & Authorization
- [ ] Routes API protégées par JWT
- [ ] Token invalide → 401 Unauthorized
- [ ] Token expiré → 401 Unauthorized
- [ ] Accès admin vérifié pour routes admin
- [ ] Non-admin ne peut pas accéder aux routes admin → 403 Forbidden
- [ ] CORS configuré correctement (staging uniquement)
- [ ] Pas de données sensibles dans les logs
- [ ] `.env` non accessible via URL

### Validation et sanitization
- [ ] Tous les inputs validés côté serveur
- [ ] SQL injection : requêtes préparées (PDO)
- [ ] XSS : échappement des données affichées
- [ ] CSRF : pas de formulaires GET pour actions sensibles
- [ ] File upload : validation type et taille
- [ ] Rate limiting contact : 3 messages/heure

### Données sensibles
- [ ] Mots de passe hashés (bcrypt)
- [ ] Tokens JWT signés et vérifiés
- [ ] Clés API stockées dans `.env` uniquement
- [ ] Pas de credentials en dur dans le code
- [ ] Logs ne contiennent pas de mots de passe

---

## 📧 Tests Emails

### Configuration SMTP
- [ ] SMTP configuré et testé
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` corrects
- [ ] Connexion SMTP réussie
- [ ] Emails envoyés depuis `SMTP_FROM_EMAIL`
- [ ] Reply-To configuré sur `CONTACT_EMAIL`

### Emails envoyés
- [ ] Email bienvenue après inscription (si activé)
- [ ] Email vérification compte (si activé)
- [ ] Email réinitialisation mot de passe
- [ ] Email confirmation contact (à l'utilisateur)
- [ ] Email notification contact (à l'admin)
- [ ] Email confirmation paiement (Stripe)
- [ ] Email confirmation abonnement (Stripe)

### Contenu des emails
- [ ] Liens cliquables fonctionnent
- [ ] Design email correct (pas de HTML cassé)
- [ ] Texte lisible (pas de caractères bizarres)
- [ ] Pas de spam (SPF, DKIM, DMARC si possible)

---

## 💳 Tests Stripe

### Configuration
- [ ] Clés Stripe TEST configurées
- [ ] Webhooks Stripe configurés
- [ ] URL webhook : `https://staging.yarnflow.fr/api/webhooks/stripe`
- [ ] Événements webhook écoutés : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### Paiements test
- [ ] Carte test 4242 4242 4242 4242 (succès) fonctionne
- [ ] Carte test 4000 0000 0000 0002 (décliné) fonctionne
- [ ] Montant correct dans Stripe (2.99€, 4.99€, 29.99€, 49.99€)
- [ ] Customer créé dans Stripe
- [ ] Subscription créée dans Stripe
- [ ] Payment Intent réussi
- [ ] Webhook reçu et traité
- [ ] Données synchronisées en BDD

### Gestion abonnements
- [ ] Abonnement actif visible dans Dashboard Stripe
- [ ] Date renouvellement correcte
- [ ] Annulation possible depuis YarnFlow
- [ ] Annulation possible depuis Dashboard Stripe
- [ ] Downgrade/Upgrade fonctionne
- [ ] Remboursement possible (si politique de remboursement)

---

## 🌐 Tests Compatibilité Navigateurs

### Desktop
- [ ] Chrome (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Edge (dernière version)

### Mobile
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile

### PWA
- [ ] Manifest.json valide
- [ ] Service Worker installé
- [ ] Installation PWA fonctionne (mobile)
- [ ] Icônes PWA affichées correctement
- [ ] Mode standalone fonctionne

---

## 📊 Tests Analytics et Monitoring

### Analytics
- [ ] Google Analytics installé (si activé)
- [ ] Events tracking configurés
- [ ] Conversions trackées (inscriptions, abonnements)

### Monitoring
- [ ] Logs d'erreurs activés en staging
- [ ] Sentry ou équivalent configuré (optionnel)
- [ ] Alertes emails erreurs critiques (optionnel)

---

## 📋 Tests Légal et RGPD

### Pages légales
- [ ] Page CGU accessible (`/cgu`)
- [ ] Page Politique de confidentialité accessible (`/privacy`)
- [ ] Page Mentions légales accessible (`/mentions`)
- [ ] Email de contact présent partout : `contact@yarnflow.fr`
- [ ] Informations société/SIRET visibles

### RGPD
- [ ] Consentement cookies (si tracking activé)
- [ ] Politique de confidentialité claire
- [ ] Droit d'accès aux données (email contact)
- [ ] Droit de suppression compte (email contact)
- [ ] Stockage données sécurisé

---

## 🚀 Checklist Pré-Production

Avant de passer de staging à production :

### Code
- [ ] Tous les `console.log()` retirés ou commentés
- [ ] Tous les `TODO` et `FIXME` traités ou documentés
- [ ] Code commenté (au moins les parties complexes)
- [ ] Pas de code mort (fonctions inutilisées)

### Base de données
- [ ] Backup base de données staging créé
- [ ] Script de migration production prêt
- [ ] Données de test nettoyées (ou base vide pour prod)

### Configuration
- [ ] `.env` production prêt (différent de staging !)
- [ ] Clés Stripe PRODUCTION configurées
- [ ] Domaine production configuré (`yarnflow.fr`)
- [ ] SSL production validé
- [ ] SMTP production testé

### Documentation
- [ ] README à jour
- [ ] CLAUDE.md à jour
- [ ] CHANGELOG.md créé avec v0.16.0
- [ ] Guide déploiement production rédigé

### Communication
- [ ] Email waitlist préparé (annonce lancement)
- [ ] Réseaux sociaux prêts (posts lancement)
- [ ] Support prêt à répondre (email monitored)

---

## ✅ Validation Finale

Toutes les cases cochées ? Félicitations, YarnFlow est prêt pour le lancement ! 🎉

**Rappel important :**
- Staging = Tests avec vraies données
- Production = Lancement officiel avec clés réelles
- Toujours tester sur staging AVANT de déployer en prod !

---

**Bonne chance pour le lancement ! 🚀🧶**
