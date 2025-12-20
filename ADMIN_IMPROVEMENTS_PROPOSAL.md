# Proposition d'améliorations Admin Panel - YarnFlow

**Date** : 2025-12-19
**Version** : 0.15.0

---

## 📊 État actuel

### ✅ Ce qui existe déjà

**Backend** (`AdminController.php`) :
- ✅ Stats globales (utilisateurs, projets, photos IA, crédits, revenus)
- ✅ Liste des utilisateurs avec pagination
- ✅ Détails d'un utilisateur
- ✅ Modification abonnement (OBSOLÈTE : free/monthly/yearly au lieu de free/plus/pro)
- ✅ Gestion des templates de patrons
- ✅ Liste des paiements récents
- ✅ Gestion Early Bird (génération codes, stats)

**Frontend** (`AdminUsers.jsx`) :
- ✅ Liste des utilisateurs avec filtres et recherche
- ✅ Modal détails utilisateur
- ✅ Modification abonnement (OBSOLÈTE)

### ❌ Ce qui manque

**Fonctionnalités critiques** :
- ❌ Gestion des crédits photos (ajout/retrait manuel)
- ❌ Vue des projets d'un utilisateur
- ❌ Mise à jour abonnement avec les nouveaux plans (FREE/PLUS/PRO)
- ❌ Gestion des rôles utilisateur (passer admin)
- ❌ Bannissement/désactivation utilisateur
- ❌ Recherche avancée utilisateurs (par date, plan, crédits)
- ❌ Export données utilisateur (RGPD)

**Dashboard amélioré** :
- ❌ Graphiques évolution utilisateurs/revenus
- ❌ MRR (Monthly Recurring Revenue) et ARR
- ❌ Taux de conversion FREE → PLUS → PRO
- ❌ Taux de rétention/churn
- ❌ Top utilisateurs (crédits, projets)

**Gestion des paiements** :
- ❌ Remboursements depuis l'admin
- ❌ Filtres paiements (status, type, date)
- ❌ Export paiements CSV

**Projets** :
- ❌ Liste tous les projets avec filtres
- ❌ Statistiques détaillées par projet
- ❌ Modération (supprimer projets inappropriés)

---

## 🎯 Propositions prioritaires

### PRIORITÉ 1 - Gestion utilisateurs avancée

#### 1.1 Modifier abonnement (MISE À JOUR)

**Backend** : Mettre à jour `updateUserSubscription()`

```php
// Supporter les nouveaux plans
$validator->in($data['subscription_type'], [
    SUBSCRIPTION_FREE,
    SUBSCRIPTION_PLUS,
    SUBSCRIPTION_PLUS_ANNUAL,
    SUBSCRIPTION_PRO,
    SUBSCRIPTION_PRO_ANNUAL,
    SUBSCRIPTION_EARLY_BIRD
], 'subscription_type');
```

**Frontend** : Nouvelle UI avec tous les plans

```jsx
<select>
  <option value="free">FREE</option>
  <option value="plus">PLUS Mensuel (2.99€)</option>
  <option value="plus_annual">PLUS Annuel (29.99€)</option>
  <option value="pro">PRO Mensuel (4.99€)</option>
  <option value="pro_annual">PRO Annuel (49.99€)</option>
  <option value="early_bird">Early Bird (2.99€)</option>
</select>
```

#### 1.2 Gestion des crédits photos

**Backend** : Nouvelle méthode dans `AdminController.php`

```php
/**
 * Ajouter/retirer des crédits photos à un utilisateur
 * POST /api/admin/users/{id}/credits
 * Body: { "credits": 50, "action": "add" } ou { "credits": 10, "action": "remove" }
 */
public function manageUserCredits(int $userId): void
{
    // Validation
    // Utiliser CreditManager pour ajouter/retirer
    // Logger l'action (qui, quand, combien)
}

/**
 * Obtenir l'historique des crédits d'un utilisateur
 * GET /api/admin/users/{id}/credits/history
 */
public function getUserCreditsHistory(int $userId): void
{
    // Retourner historique complet
    // Avec source (achat, abonnement, admin, bonus)
}
```

**Frontend** : Interface dans modal utilisateur

```jsx
<div className="credits-manager">
  <h3>Crédits photos: {user.credits_available}</h3>
  <input type="number" placeholder="Nombre de crédits" />
  <div className="flex gap-2">
    <button onClick={() => addCredits(amount)}>
      ➕ Ajouter
    </button>
    <button onClick={() => removeCredits(amount)}>
      ➖ Retirer
    </button>
  </div>
  <div className="history mt-4">
    {/* Historique des modifications */}
  </div>
</div>
```

#### 1.3 Voir les projets d'un utilisateur

**Backend** : Mise à jour `getUserDetails()`

```php
// Ajouter récupération des projets
$projects = $this->projectModel->findBy(['user_id' => $userId], 50, 0);

// Retourner avec stats détaillées
Response::success([
    'user' => $user,
    'projects' => $projects,
    'project_stats' => [
        'total' => count($projects),
        'in_progress' => ...,
        'completed' => ...,
        'total_rows' => ...
    ]
]);
```

**Frontend** : Onglets dans modal utilisateur

```jsx
<Tabs>
  <Tab label="Infos">...</Tab>
  <Tab label="Abonnement">...</Tab>
  <Tab label="Crédits">...</Tab>
  <Tab label="Projets">
    {/* Liste des projets avec stats */}
  </Tab>
  <Tab label="Paiements">
    {/* Historique paiements */}
  </Tab>
</Tabs>
```

#### 1.4 Actions rapides utilisateur

**Backend** : Nouvelles méthodes

```php
/**
 * Bannir/débannir un utilisateur
 * PUT /api/admin/users/{id}/ban
 */
public function toggleBan(int $userId): void

/**
 * Passer admin/retirer admin
 * PUT /api/admin/users/{id}/role
 * Body: { "role": "admin" } ou { "role": "user" }
 */
public function updateUserRole(int $userId): void

/**
 * Réinitialiser le mot de passe (envoyer email)
 * POST /api/admin/users/{id}/reset-password
 */
public function sendPasswordReset(int $userId): void
```

**Frontend** : Boutons actions rapides

```jsx
<div className="quick-actions">
  <button onClick={() => toggleAdmin(user.id)}>
    {user.role === 'admin' ? '👤 Retirer Admin' : '⭐ Passer Admin'}
  </button>
  <button onClick={() => toggleBan(user.id)}>
    {user.is_banned ? '✅ Débannir' : '🚫 Bannir'}
  </button>
  <button onClick={() => sendPasswordReset(user.id)}>
    🔑 Reset Password
  </button>
  <button onClick={() => exportUserData(user.id)}>
    📥 Export données (RGPD)
  </button>
</div>
```

---

### PRIORITÉ 2 - Dashboard amélioré

#### 2.1 Graphiques et KPIs

**Backend** : Nouvelles routes analytics

```php
/**
 * GET /api/admin/analytics/users-growth
 * Retourne croissance utilisateurs sur 12 mois
 */
public function getUsersGrowth(): void

/**
 * GET /api/admin/analytics/revenue
 * Retourne MRR, ARR, revenus par mois
 */
public function getRevenueAnalytics(): void

/**
 * GET /api/admin/analytics/conversion
 * Retourne taux FREE → PLUS → PRO
 */
public function getConversionFunnel(): void
```

**Frontend** : Charts avec Chart.js ou Recharts

```jsx
import { LineChart, BarChart, PieChart } from 'recharts'

<div className="dashboard-grid">
  {/* KPIs */}
  <KPICard title="MRR" value={mrr} trend="+12%" />
  <KPICard title="Utilisateurs actifs" value={activeUsers} />
  <KPICard title="Taux conversion" value="18%" />

  {/* Graphiques */}
  <LineChart data={usersGrowth} />
  <BarChart data={revenueByMonth} />
  <PieChart data={subscriptionDistribution} />
</div>
```

---

### PRIORITÉ 3 - Gestion paiements avancée

#### 3.1 Filtres et recherche paiements

**Backend** : Mise à jour `listPayments()`

```php
public function listPayments(): void
{
    $filters = [
        'status' => $_GET['status'] ?? null,        // pending, completed, failed
        'type' => $_GET['type'] ?? null,            // subscription_plus, credits_pack_50...
        'user_email' => $_GET['user_email'] ?? null,
        'date_from' => $_GET['date_from'] ?? null,
        'date_to' => $_GET['date_to'] ?? null
    ];

    $payments = $this->paymentModel->findWithFilters($filters, $limit, $offset);
}
```

**Frontend** : Interface de filtrage

```jsx
<div className="payment-filters">
  <select onChange={e => setStatusFilter(e.target.value)}>
    <option value="">Tous les statuts</option>
    <option value="completed">Complétés</option>
    <option value="pending">En attente</option>
    <option value="failed">Échoués</option>
  </select>

  <input type="date" onChange={e => setDateFrom(e.target.value)} />
  <input type="date" onChange={e => setDateTo(e.target.value)} />

  <button onClick={exportCSV}>📥 Export CSV</button>
</div>
```

#### 3.2 Remboursements depuis admin

**Frontend** : Bouton remboursement dans liste

```jsx
{payment.status === 'completed' && (
  <button onClick={() => refundPayment(payment.id)}>
    ♻️ Rembourser
  </button>
)}
```

---

### PRIORITÉ 4 - Gestion projets

#### 4.1 Liste tous les projets

**Backend** : Nouvelle route

```php
/**
 * GET /api/admin/projects
 * Liste tous les projets avec filtres
 */
public function listProjects(): void
{
    $filters = [
        'status' => $_GET['status'] ?? null,
        'technique' => $_GET['technique'] ?? null,
        'user_id' => $_GET['user_id'] ?? null
    ];
}
```

**Frontend** : Page AdminProjects.jsx

```jsx
<div>
  <h1>📦 Tous les projets</h1>
  <table>
    <thead>
      <tr>
        <th>Nom</th>
        <th>Utilisateur</th>
        <th>Technique</th>
        <th>Statut</th>
        <th>Créé le</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {/* Liste projets */}
    </tbody>
  </table>
</div>
```

---

## 🏗️ Architecture proposée

### Structure fichiers

```
backend/controllers/
├── AdminController.php          # Stats générales, templates
├── AdminUsersController.php     # Gestion utilisateurs (NEW)
├── AdminPaymentsController.php  # Gestion paiements (NEW)
├── AdminProjectsController.php  # Gestion projets (NEW)
├── AdminAnalyticsController.php # Analytics avancées (NEW)

frontend/src/pages/admin/
├── AdminDashboard.jsx          # Dashboard avec KPIs et graphiques
├── AdminUsers.jsx              # Gestion utilisateurs (UPDATE)
├── AdminPayments.jsx           # Gestion paiements (UPDATE)
├── AdminProjects.jsx           # Gestion projets (NEW)
├── AdminAnalytics.jsx          # Analytics détaillées (NEW)
├── AdminEarlyBird.jsx          # Gestion Early Bird (NEW)
├── AdminSettings.jsx           # Paramètres app (NEW)

frontend/src/components/admin/
├── UserModal.jsx               # Modal utilisateur avec onglets (NEW)
├── KPICard.jsx                 # Carte KPI (NEW)
├── StatsChart.jsx              # Graphiques réutilisables (NEW)
├── ActionConfirm.jsx           # Confirmation actions (NEW)
```

---

## 📝 Plan d'implémentation recommandé

### Phase 1 - Urgences (1-2h)
1. ✅ Mettre à jour `updateUserSubscription()` avec nouveaux plans
2. ✅ Ajouter gestion crédits photos (`manageUserCredits()`)
3. ✅ Ajouter vue projets utilisateur dans `getUserDetails()`

### Phase 2 - Améliorations UX (2-3h)
4. ✅ Refonte `AdminUsers.jsx` avec onglets et actions rapides
5. ✅ Améliorer filtres et recherche utilisateurs
6. ✅ Ajouter export données utilisateur (RGPD)

### Phase 3 - Paiements (1-2h)
7. ✅ Filtres avancés paiements
8. ✅ Export CSV paiements
9. ✅ Interface remboursement

### Phase 4 - Analytics (2-3h)
10. ✅ Routes analytics backend
11. ✅ Dashboard avec graphiques
12. ✅ KPIs MRR/ARR/Conversion

### Phase 5 - Projets (1h)
13. ✅ Liste tous projets
14. ✅ Statistiques projets

---

## 🚀 Proposition action immédiate

Je propose de commencer par **Phase 1** qui couvre vos besoins immédiats :
- Modifier abonnement avec les vrais plans (PLUS/PRO)
- Ajouter des crédits manuellement
- Voir les projets d'un utilisateur

**Voulez-vous que je commence l'implémentation ?**

Si oui, je vais :
1. Mettre à jour `AdminController.php` avec les nouvelles méthodes
2. Ajouter les routes API nécessaires
3. Créer/mettre à jour les composants React
4. Tester le tout

**Estimation** : 1-2 heures de développement

---

## 💡 Fonctionnalités bonus (Nice to have)

- 🔍 Logs d'activité admin (qui a fait quoi, quand)
- 📧 Envoi emails en masse aux utilisateurs
- 🎁 Création codes promo/coupons
- 🔔 Notifications push admin (nouveau paiement, nouveau user)
- 📊 Rapport hebdo/mensuel automatique par email
- 🛠️ Mode maintenance (désactiver app temporairement)
- 🌍 Gestion multilingue (si expansion internationale)

---

**Qu'en pensez-vous ? Par quoi voulez-vous qu'on commence ?**
