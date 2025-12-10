# Guide Early Bird - YarnFlow

## 🎯 Concept

Offre limitée à **200 places** pour attirer les premiers utilisateurs :
- **Prix** : 2.99€/mois pendant 12 mois (au lieu de 4.99€/mois)
- **Avantages** : Accès PRO complet (projets illimités + 30 photos IA/mois)
- **Durée** : 12 mois garantis au même prix
- **Limite** : 200 souscriptions maximum

## 📦 Installation

### 1. Appliquer les migrations SQL

```bash
# 1. Mettre à jour le schema subscription_type
mysql -u root -p patron_maker < database/fix_subscription_enum.sql

# 2. Créer les tables Early Bird
mysql -u root -p patron_maker < database/add_early_bird_tracking.sql
```

### 2. Vérifier l'installation

```sql
-- Vérifier la config Early Bird
SELECT * FROM early_bird_config;

-- Devrait afficher :
-- | id | max_slots | current_slots | is_active | started_at          |
-- | 1  | 200       | 0             | 1         | 2025-11-29 xx:xx:xx |
```

## 🚀 Utilisation

### Pour les utilisateurs (Frontend)

```javascript
// Créer un abonnement Early Bird
const response = await fetch('/api/payments/checkout/subscription', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'early_bird' // au lieu de 'monthly' ou 'yearly'
  })
});

const { checkout_url } = await response.json();
window.location.href = checkout_url; // Rediriger vers Stripe
```

### Vérifier les places restantes

```javascript
// Obtenir les stats Early Bird
const response = await fetch('/api/early-bird/stats');
const stats = await response.json();

console.log(stats);
// {
//   max_slots: 200,
//   current_slots: 45,
//   remaining_slots: 155,
//   is_active: true
// }
```

### Afficher un badge "Places limitées"

```jsx
{earlyBirdStats.remaining_slots <= 50 && (
  <div className="early-bird-warning">
    ⚠️ Plus que {earlyBirdStats.remaining_slots} places Early Bird !
  </div>
)}
```

## 🔧 Administration

### Endpoints admin à créer

```php
// backend/controllers/AdminController.php

/**
 * GET /api/admin/early-bird/stats
 * Statistiques détaillées Early Bird
 */
public function getEarlyBirdStats(): void
{
    $this->requireAdmin();
    $stats = $this->earlyBirdService->getStats();
    $users = $this->earlyBirdService->getActiveSubscriptions();

    Response::success([
        'stats' => $stats,
        'users' => $users
    ]);
}

/**
 * POST /api/admin/early-bird/close
 * Fermer l'offre Early Bird manuellement
 */
public function closeEarlyBird(): void
{
    $this->requireAdmin();
    $this->earlyBirdService->closeOffer();

    Response::success(['message' => 'Early Bird fermé']);
}
```

### Requêtes SQL utiles

```sql
-- Voir les stats en temps réel
SELECT * FROM v_early_bird_stats;

-- Liste des Early Birds actifs
SELECT * FROM v_early_bird_active_users;

-- Combien de places restantes ?
SELECT (max_slots - current_slots) as places_restantes
FROM early_bird_config WHERE id = 1;

-- Fermer manuellement l'Early Bird
UPDATE early_bird_config
SET is_active = FALSE, closed_at = NOW()
WHERE id = 1;

-- Annuler manuellement une place
UPDATE early_bird_subscriptions
SET is_active = FALSE, cancelled_at = NOW()
WHERE user_id = 123;
```

## 📊 Monitoring

### Alertes recommandées

1. **50 places restantes** : Envoyer email marketing "Dernières places !"
2. **20 places restantes** : Intensifier communication
3. **5 places restantes** : Alerte rouge + urgence landing page
4. **0 places** : Désactiver bouton Early Bird + message "COMPLET"

### Logs à surveiller

```bash
# Vérifier les réservations Early Bird
grep "EARLY BIRD" /path/to/logs/app.log

# Exemples de logs :
# [EARLY BIRD] Place #45 réservée pour user 123
# [EARLY BIRD] Place annulée pour user 67
# [EARLY BIRD] Offre fermée définitivement
```

## 🎨 Interface Frontend

### Badge "Early Bird"

```jsx
<div className="pricing-card early-bird">
  <div className="badge">
    🔥 EARLY BIRD
    <span className="slots-remaining">
      {200 - currentSlots} / 200 places
    </span>
  </div>

  <h3>2.99€/mois</h3>
  <p className="original-price">
    <s>4.99€/mois</s> - Économisez 40%
  </p>

  <ul>
    <li>✅ Prix garanti 12 mois</li>
    <li>✅ Projets illimités</li>
    <li>✅ 30 photos IA/mois</li>
    <li>✅ Bibliothèque de patrons</li>
  </ul>

  <button
    onClick={() => subscribe('early_bird')}
    disabled={!isAvailable}
  >
    {isAvailable ? 'Réserver ma place' : 'COMPLET'}
  </button>
</div>
```

### Message après souscription

```jsx
<div className="success-message">
  🎉 Félicitations ! Vous avez la place #{slotNumber}/200

  <p>
    Vous bénéficiez de l'accès PRO complet à 2.99€/mois
    pendant 12 mois.
  </p>

  <p className="expiry">
    Votre offre Early Bird expire le : {expiryDate}
  </p>
</div>
```

## 🚨 Gestion des erreurs

### Scénarios à gérer

1. **User clique mais places épuisées** :
   ```
   Erreur 403 : "Offre Early Bird épuisée (200/200 places)"
   → Rediriger vers plan PRO classique
   ```

2. **User a déjà un Early Bird** :
   ```
   Erreur 403 : "Vous avez déjà une place Early Bird"
   → Afficher info de sa place actuelle
   ```

3. **Paiement validé mais slot non réservé** :
   ```
   Log : "[EARLY BIRD] ERREUR - Paiement validé mais slot non réservé"
   → CRITIQUE : Intervention manuelle requise
   → Contacter user et attribuer place manuellement
   ```

## 🔐 Sécurité

### Race conditions

Le système utilise `FOR UPDATE` dans la transaction SQL pour éviter les conflits :

```sql
SELECT current_slots + 1 as next_slot
FROM early_bird_config
WHERE id = 1 FOR UPDATE;
```

Cela garantit qu'un seul utilisateur obtient chaque numéro de slot.

### Triggers automatiques

- ✅ Auto-incrémentation du compteur à l'insertion
- ✅ Auto-décrémentation à l'annulation
- ✅ Désactivation auto si limite atteinte

## 📈 Après l'Early Bird

### Que se passe-t-il après 12 mois ?

**Option 1 : Renouvellement automatique au prix PRO**
```php
// À implémenter : webhook Stripe après 12 mois
// Modifier le prix de l'abonnement de 2.99€ → 4.99€
// Email de prévenance 1 mois avant
```

**Option 2 : Annulation automatique**
```php
// À implémenter : cron qui vérifie les expirations
// Annuler les abonnements après 12 mois
// Proposer upgrade vers PRO classique
```

**Recommandation** : Option 1 avec email de prévenance 30 jours avant.

## ✅ Checklist de lancement

- [ ] Migrations SQL appliquées
- [ ] Tests paiement Early Bird (Stripe test mode)
- [ ] Badge "Early Bird" visible sur landing page
- [ ] Compteur de places en temps réel fonctionnel
- [ ] Email de confirmation personnalisé (place #XX/200)
- [ ] Dashboard admin pour monitoring
- [ ] Alertes configurées (50, 20, 5 places)
- [ ] Documentation pour support client
- [ ] Plan de communication marketing
- [ ] Tests de charge (simulations 200 paiements simultanés)

## 📞 Support

### Questions fréquentes

**Q: Puis-je annuler mon Early Bird ?**
R: Oui, à tout moment via Stripe. Votre place sera libérée et pourra être réattribuée.

**Q: Que se passe-t-il après 12 mois ?**
R: Votre abonnement continue au tarif PRO classique (4.99€/mois) sauf si vous annulez.

**Q: Puis-je upgrader vers annuel ?**
R: Non, l'Early Bird est un engagement mensuel de 12 mois.

---

**Version** : 1.0.0 (2025-11-29)
**Auteur** : YarnFlow Team + AI Assistant
