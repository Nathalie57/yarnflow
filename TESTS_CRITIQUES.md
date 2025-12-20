# Tests Critiques YarnFlow - Avant Lancement

**Version:** 0.16.0
**Durée estimée:** 30-45 minutes
**Objectif:** Valider les fonctionnalités essentielles avant lancement officiel

---

## 🔥 Top 10 Tests Absolument Critiques

### 1. ✅ Inscription + Connexion
```
1. Créer un nouveau compte (email + mot de passe)
2. Se connecter avec ce compte
3. Vérifier que le JWT est valide
4. Se déconnecter
5. Se reconnecter → doit fonctionner
```
**Attendu:** Connexion fluide, token valide, redirection vers `/my-projects`

---

### 2. 📝 Créer et gérer un projet
```
1. Créer un projet "Test Pull" (tricot)
2. Ajouter des rangs (+1, +10)
3. Ajouter une note "Test note"
4. Marquer comme terminé
5. Démarquer (repasse en cours)
6. Supprimer le projet
```
**Attendu:** Toutes les actions fonctionnent sans erreur

---

### 3. 🔢 Compteur et sections
```
1. Créer un projet avec 3 sections
2. Incrémenter compteur dans section 1
3. Marquer section 1 comme complétée
4. Vérifier que progression globale = 33%
5. Supprimer une section
6. Vérifier que progression recalculée
```
**Attendu:** Compteurs précis, progression correcte

---

### 4. 📸 AI Photo Studio
```
1. Upload une photo (< 10MB, JPG/PNG)
2. Générer 1 variation IA (preset Hero)
3. Vérifier que crédit déduit (-1)
4. Générer 5 variations (preset Produit)
5. Vérifier que crédits déduits (-4, batch -20%)
6. Télécharger une photo (PLUS/PRO uniquement)
```
**Attendu:**
- FREE: 5 crédits, pas de téléchargement
- PLUS: 15 crédits, téléchargement OK
- PRO: 30 crédits, téléchargement OK

---

### 5. 💳 Abonnements Stripe (MODE TEST)
```
1. Aller sur /subscription
2. Cliquer "S'abonner PLUS mensuel" (2.99€)
3. Payer avec carte test: 4242 4242 4242 4242
4. Vérifier redirection /payment/success
5. Vérifier que plan = PLUS dans profil
6. Vérifier limite projets = 7
7. Vérifier crédits photos = 15
```
**Attendu:** Paiement réussi, webhook reçu, BDD mise à jour

**Carte test Stripe:**
- Succès: `4242 4242 4242 4242`
- Échec: `4000 0000 0000 0002`
- Date: N'importe quelle date future
- CVC: N'importe quel 3 chiffres

---

### 6. 🏷️ Tags et filtres (PLUS/PRO)
```
Avec compte FREE:
1. Essayer d'ajouter un tag → Doit afficher "Upgrade to PLUS"

Avec compte PLUS/PRO:
1. Ajouter tags "cadeau", "bébé" à un projet
2. Filtrer par tag "cadeau" → Doit montrer le projet
3. Supprimer le tag "bébé"
4. Vérifier suggestions de tags (top 20 utilisateur)
```
**Attendu:** FREE bloqué, PLUS/PRO peut ajouter tags illimités

---

### 7. ⭐ Favoris (tous plans)
```
1. Marquer un projet en favori (⭐)
2. Filtrer par "Favoris uniquement"
3. Démarquer le projet
4. Vérifier qu'il disparaît du filtre favoris
```
**Attendu:** Fonctionne pour FREE, PLUS et PRO

---

### 8. 📧 Système de contact
```
Non connecté:
1. Aller sur /contact
2. Remplir: nom, email, catégorie=bug, sujet, message
3. Envoyer
4. Vérifier email confirmation reçu
5. Vérifier email notification à contact@yarnflow.fr

Connecté:
1. Se connecter
2. Aller sur /contact (via menu profil)
3. Vérifier nom/email pré-remplis
4. Envoyer un message
5. Vérifier redirection vers /my-projects (pas /)

Rate limiting:
1. Envoyer 3 messages rapidement
2. 4e message → Erreur 429 "Trop de messages..."
```
**Attendu:** Emails reçus, rate limit actif, pas de déconnexion

---

### 9. 🔒 Sécurité et permissions
```
1. Tester route /api/admin sans être admin → 403 Forbidden
2. Tester route /api/projects sans token → 401 Unauthorized
3. Essayer d'accéder au projet d'un autre user → 403 ou 404
4. Tester injection SQL dans formulaire → Doit être bloqué
5. Vérifier que .env n'est pas accessible via URL
```
**Attendu:** Toutes les protections actives, pas de fuite de données

---

### 10. 📱 Responsive et navigation
```
Desktop:
1. Tester sur Chrome, Firefox, Safari
2. Vérifier menu desktop fonctionne
3. Tester toutes les pages principales

Mobile:
1. Ouvrir sur smartphone (ou DevTools mobile)
2. Vérifier bottom navigation visible
3. Tester hamburger menu
4. Vérifier compteur flottant accessible
5. Tester installation PWA (Add to Home Screen)
```
**Attendu:** UI adaptée, navigation fluide, pas de débordement

---

## 🚨 Tests de non-régression v0.16.0

Suite à l'ajout du système de contact, vérifier que :

- [ ] Routes existantes toujours fonctionnelles
- [ ] Migration BDD n'a pas cassé les tables existantes
- [ ] Foreign keys `user_id` compatibles (INT UNSIGNED)
- [ ] Pas de conflit de routes `/contact` vs autres routes
- [ ] Navbar et Footer affichent bien le lien "Contact"
- [ ] Pas d'erreurs 500 sur les routes API existantes

---

## 📊 Tests de performance

**Temps de chargement cibles :**
- Landing page: < 2 secondes
- Dashboard: < 3 secondes
- API calls: < 500ms (médiane)

**Lighthouse scores cibles :**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

**Outils :**
```bash
# Tester avec Lighthouse (Chrome DevTools)
# F12 > Lighthouse > Generate report

# Ou en CLI
npm install -g lighthouse
lighthouse https://staging.yarnflow.fr --view
```

---

## 🔍 Vérifications Base de Données

```sql
-- Vérifier que toutes les tables existent
SHOW TABLES;

-- Vérifier les utilisateurs de test
SELECT id, email, subscription_type, is_admin FROM users;

-- Vérifier les limites de projets
SELECT
  u.email,
  u.subscription_type,
  COUNT(p.id) as nb_projets_actifs
FROM users u
LEFT JOIN projects p ON u.id = p.user_id AND p.is_completed = 0
GROUP BY u.id;

-- Vérifier les crédits photos
SELECT
  user_id,
  monthly_credits,
  bonus_credits,
  (monthly_credits + bonus_credits) as total
FROM user_photo_credits;

-- Vérifier les messages de contact
SELECT id, email, category, subject, status, created_at
FROM contact_messages
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier le rate limiting
SELECT ip_address, message_count, window_start
FROM contact_rate_limit;
```

---

## 📧 Vérifications Emails

En mode `APP_ENV=staging`, les emails sont envoyés pour de vrai.

**Vérifier dans les logs PHP** (si `APP_ENV=development`) :
```bash
# Sur O2switch via cPanel
cPanel > Métriques > Erreurs > error_log

# Rechercher
=== EMAIL ===
To: ...
Subject: ...
Body: ...
```

**Vérifier dans la boîte mail** :
- Email confirmation contact → Utilisateur
- Email notification contact → contact@yarnflow.fr
- Email paiement Stripe → Utilisateur

---

## 🎯 Scénario Complet Utilisateur

**Parcours idéal d'un nouvel utilisateur :**

```
1. Arrivée sur https://staging.yarnflow.fr
   → Landing page s'affiche

2. Clic "Créer un compte"
   → Inscription réussie

3. Connexion avec le nouveau compte
   → Redirection vers /my-projects (vide)

4. Clic "Créer un projet"
   → Formulaire de création
   → Projet créé avec succès

5. Incrémenter compteur (+1, +1, +1)
   → Compteur = 3

6. Ajouter une photo
   → Upload réussi
   → Générer 1 variation IA
   → Crédit déduit (4 restants)

7. Marquer projet en favori
   → Étoile jaune affichée

8. Essayer d'ajouter un tag (compte FREE)
   → Prompt "Upgrade to PLUS" affiché

9. Clic "S'abonner" → Page /subscription
   → Choix PLUS mensuel (2.99€)
   → Paiement test Stripe
   → Succès → Redirection /payment/success

10. Retour /my-projects
    → Badge "PLUS" visible
    → Peut maintenant ajouter des tags

11. Ajouter tag "cadeau"
    → Tag ajouté avec succès

12. Créer 6 autres projets (total 7)
    → Tous créés (limite PLUS = 7)

13. Essayer de créer un 8e projet
    → Bloqué avec message "Limite atteinte (7/7)"

14. Tester le système de contact
    → Clic "Contact" dans menu profil
    → Formulaire pré-rempli
    → Envoi message catégorie "question"
    → Succès + email confirmation reçu

15. Se déconnecter
    → Redirection vers /
```

**Durée estimée du parcours :** 10-15 minutes

---

## ✅ Validation Finale Avant Lancement

**TOUTES ces conditions doivent être remplies :**

- [ ] Les 10 tests critiques passent sans erreur
- [ ] Aucune erreur 500 dans les logs
- [ ] Aucune erreur console navigateur (F12)
- [ ] Base de données cohérente (pas de données orphelines)
- [ ] Emails reçus correctement
- [ ] Stripe webhook reçu et traité
- [ ] Performance acceptable (Lighthouse > 90)
- [ ] Mobile responsive vérifié
- [ ] Sécurité testée (pas de fuite de données)
- [ ] Contact system testé (rate limit OK)

---

## 🆘 Que faire si un test échoue ?

### Erreur 500 API
1. Vérifier logs PHP (`cPanel > Erreurs`)
2. Vérifier `.env` correctement configuré
3. Vérifier connexion MySQL
4. Vérifier version PHP >= 8.1

### Erreur 401 Unauthorized
1. Vérifier token JWT valide
2. Vérifier `JWT_SECRET` configuré
3. Vérifier header `Authorization: Bearer <token>`

### Stripe ne fonctionne pas
1. Vérifier clés TEST configurées (pas LIVE)
2. Vérifier webhook configuré dans Dashboard Stripe
3. Vérifier événements webhook activés
4. Tester avec carte test `4242 4242 4242 4242`

### Emails non reçus
1. Vérifier SMTP configuré correctement
2. Vérifier `SMTP_USERNAME` et `SMTP_PASSWORD`
3. Vérifier boîte spam
4. Vérifier logs PHP pour erreurs SMTP

### Contact déconnecte l'utilisateur
1. Vérifier redirection après envoi
2. Doit aller vers `/my-projects` si connecté
3. Pas vers `/` (landing page)

---

**Bon courage pour les tests ! 🧪🔥**

Si tous les tests critiques passent, YarnFlow est prêt pour le lancement ! 🚀
