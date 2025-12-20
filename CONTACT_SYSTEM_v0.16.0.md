# Système de Contact YarnFlow v0.16.0

**Date** : 2025-12-20
**Version** : 0.16.0
**Statut** : ✅ Prêt pour production

---

## 🎯 Objectif

Permettre aux utilisateurs (connectés ou non) de contacter facilement l'équipe YarnFlow en cas de bug, question, suggestion ou toute autre demande.

---

## 📋 Fonctionnalités

### Pour les utilisateurs

- **Formulaire de contact accessible** depuis n'importe quelle page
- **4 catégories de messages** :
  - 🐛 Bug : Signaler un problème technique
  - ❓ Question : Poser une question
  - 💡 Suggestion : Proposer une amélioration
  - 📧 Autre : Toute autre demande
- **Pré-remplissage automatique** si connecté (nom + email)
- **Validation en temps réel** des champs
- **Email de confirmation** automatique après envoi
- **Protection anti-spam** : 3 messages max par heure par IP

### Pour l'administrateur

- **Notification par email** à chaque nouveau message
- **Dashboard admin** pour consulter tous les messages
- **Traçabilité complète** : IP, user agent, statut lu/non-lu
- **Gestion des messages** : marquer comme lu, archiver

---

## 🗂️ Structure

### Backend (PHP)

**Fichiers créés** :
- `backend/controllers/ContactController.php` - Contrôleur principal
- `database/add_contact_messages.sql` - Schéma BDD
- `database/MIGRATION_PRODUCTION_v0.16.0.sql` - Migration pour prod

**Routes API** :
```
POST   /api/contact                              # Envoyer un message (public)
GET    /api/admin/contact-messages               # Lister les messages (admin)
PUT    /api/admin/contact-messages/{id}/read     # Marquer comme lu (admin)
```

**Tables BDD** :
- `contact_messages` : Stockage des messages
- `contact_rate_limit` : Protection anti-spam

### Frontend (React)

**Fichiers créés** :
- `frontend/src/pages/Contact.jsx` - Page du formulaire

**Accès au formulaire** :
- **URL directe** : `/contact`
- **Landing** : Header en haut à droite + Footer
- **Login/Register** : Lien "Contactez-nous" en bas
- **App PWA** : Menu profil (Desktop + Mobile)
- **Pages légales** : CGU, Privacy, Mentions

---

## 🔧 Configuration

### Variables d'environnement (.env)

Ajouter dans `backend/.env` :

```ini
# Contact System
# CONTACT_EMAIL : adresse qui REÇOIT les messages ET expédie les emails de confirmation
CONTACT_EMAIL=contact@yarnflow.fr
```

**Important** : `CONTACT_EMAIL` sert à la fois pour :
- **Recevoir** les messages de contact des utilisateurs
- **Expédier** les emails de confirmation et notifications

### Installation en production

```bash
# 1. Appliquer la migration BDD
mysql -u root -p patron_maker < database/MIGRATION_PRODUCTION_v0.16.0.sql

# 2. Configurer l'email de contact dans .env
# CONTACT_EMAIL=contact@yarnflow.fr (reçoit les messages ET expédie les emails)

# 3. Redémarrer le serveur PHP
# service php8.1-fpm restart  # ou équivalent
```

---

## 📧 Emails envoyés

### Email à l'utilisateur (confirmation)

```
Objet : ✅ Message reçu - YarnFlow

Bonjour [Nom],

Nous avons bien reçu votre message et vous en remercions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOTRE MESSAGE (#123)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sujet : [Sujet]
Catégorie : [Catégorie]

[Message]

━━━━━━━━━━━━━━━━━━━━━━━━━━━

Notre équipe vous répondra dans les plus brefs délais.

L'équipe YarnFlow
contact@yarnflow.fr
```

### Email à l'admin (notification)

```
Objet : 📧 [YarnFlow] Nouveau message de contact (#123)

Nouveau message de contact reçu :

━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE #123
━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 De : [Nom] <email@exemple.com>
📁 Catégorie : Bug
📌 Sujet : [Sujet]

━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Message complet]

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Détails techniques :
• ID message : 123
• Date : 20/12/2025 à 18:00:00
• IP : 192.168.1.1
• User Agent : Mozilla/5.0...

━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🛡️ Sécurité

### Rate Limiting

- **Limite** : 3 messages par heure par IP
- **Fenêtre glissante** : 1 heure
- **Nettoyage auto** : Entrées > 1h supprimées automatiquement
- **Message d'erreur** : "Trop de messages envoyés. Veuillez réessayer dans 1 heure."

### Validation

- **Nom** : 1-100 caractères (si non connecté)
- **Email** : Format email valide (si non connecté)
- **Sujet** : 1-200 caractères
- **Message** : 1-5000 caractères
- **Catégorie** : Enum strict (bug, question, suggestion, other)

### Protection

- **Sanitization** : PDO prepared statements
- **CSRF** : JWT optionnel pour utilisateurs connectés
- **Traçabilité** : IP + User Agent stockés
- **Anonymisation** : Pas de stockage de données sensibles

---

## 📊 Statistiques

### Colonnes stockées

```sql
- id                 # ID unique du message
- user_id            # ID utilisateur (NULL si non connecté)
- name               # Nom de l'expéditeur
- email              # Email de l'expéditeur
- category           # bug/question/suggestion/other
- subject            # Sujet (max 200 car)
- message            # Message complet (max 5000 car)
- ip_address         # IP de l'expéditeur
- user_agent         # Navigateur utilisé
- status             # unread/read/replied/archived
- created_at         # Date d'envoi
- read_at            # Date de lecture (NULL si non lu)
```

### Requêtes utiles

```sql
-- Messages non lus
SELECT * FROM contact_messages WHERE status = 'unread' ORDER BY created_at DESC;

-- Messages par catégorie (derniers 30 jours)
SELECT category, COUNT(*) as count
FROM contact_messages
WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY category;

-- Top IPs qui envoient le plus de messages
SELECT ip_address, COUNT(*) as count
FROM contact_messages
GROUP BY ip_address
ORDER BY count DESC
LIMIT 10;
```

---

## 🚀 Prochaines étapes (optionnel)

1. **Panel admin web** : Interface pour gérer les messages directement dans YarnFlow
2. **Réponse depuis l'app** : Pouvoir répondre aux messages sans quitter l'app
3. **Templates de réponse** : Réponses pré-écrites pour questions fréquentes
4. **FAQ automatique** : Suggérer des réponses avant envoi du formulaire
5. **Webhooks** : Notifications Discord/Slack pour les nouveaux messages

---

## ✅ Checklist lancement prod

- [ ] Tables BDD créées (`MIGRATION_PRODUCTION_v0.16.0.sql`)
- [ ] Variables .env configurées (`CONTACT_EMAIL`, `ADMIN_EMAIL`)
- [ ] Email SMTP configuré et testé
- [ ] Formulaire testé (utilisateur connecté + non connecté)
- [ ] Rate limiting testé (3 messages/heure)
- [ ] Emails de confirmation reçus
- [ ] Emails de notification admin reçus
- [ ] Liens "Contact" visibles partout dans l'app
- [ ] Pages légales mises à jour avec contact@yarnflow.fr

---

**Créé par** : Claude Code + Nathalie
**Date** : 2025-12-20
**Version** : 0.16.0
