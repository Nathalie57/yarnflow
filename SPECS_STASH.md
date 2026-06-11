# YarnFlow — Module Stock de Laine (Le Stash)

> Statut : En cours de planification  
> Dernière mise à jour : juin 2026

---

## Contexte

Les tricoteuses accumulent des pelotes sans savoir précisément ce qu'elles ont. Ce module leur donne un inventaire numérique avec calcul automatique des métrages/poids, et s'intègre ensuite aux projets pour un suivi complet.

---

## Pricing

| Accès | Limite |
|-------|--------|
| FREE | 10 références maximum |
| PRO (6,99 €) | Illimité + scanner + liaison projets |

**Stratégie :** freemium par volume. 10 références = assez pour tester et s'attacher à la fonctionnalité, pas assez pour une vraie passionnée → conversion naturelle.

Message de dépassement de limite :
> « Votre placard déborde de pépites ! Passez à la version Pro pour débloquer le stock illimité, le futur scanner de code-barres et la liaison automatique avec vos projets. »

---

## Roadmap

| Phase | Contenu | Accès |
|-------|---------|-------|
| **Phase 1** | Stock simple — saisie manuelle, calculs automatiques | Free (10) / Pro (illimité) |
| **Phase 2** | Scanner code-barres + base partagée crowdsourcée | Pro uniquement |
| **Phase 3** | Liaison stock ↔ projets, réservations, gestion des restes | Pro uniquement |

> Note : Phase 3 est le **vrai levier de conversion** — "il te reste 340 m après cette veste" est plus fort que la limite de volume seule.

---

## Phase 1 — Specs Fonctionnelles

### Accès
Nouvel onglet **"Mon Stock"** dans la section Bibliothèque. Disponible FREE (limité) et PRO (illimité).

### Fiche pelote

| Champ | Obligatoire | Exemple |
|-------|-------------|---------|
| Marque | ✅ | Drops, Fonty, Phildar |
| Nom de la gamme | ✅ | Merino Extra Fine |
| Nom du coloris | Non | Turquoise |
| Numéro de bain | Non | 2024-A |
| Composition | Non | 100% Mérinos |
| Poids par pelote (g) | ✅ | 50 g |
| Métrage par pelote (m) | ✅ | 190 m |
| Quantité | ✅ | 6 |
| Épaisseur | Non | Lace / Fingering / DK / Worsted / Bulky |
| Aiguille recommandée (mm) | Non | 3,5 mm |
| Couleur (hex) | Non | Sélecteur visuel |
| Photo de l'étiquette | Non | Upload depuis le téléphone |
| Notes libres | Non | Texte libre |

**Règle :** chaque coloris d'une même gamme = une entrée séparée.

### Calcul automatique (frontend)
- `total_weight_g` = `poids_unitaire × quantité`
- `total_yardage_m` = `métrage_unitaire × quantité`
- Affiché en temps réel dans le formulaire ET sur chaque carte

Exemple : *6 pelotes × 50 g × 190 m = **300 g** et **1 140 m** au total*

### Page liste
- Bandeau récap global : `X références · Y pelotes · Z mètres au total`
- Filtres : par marque, par épaisseur
- Tri : par marque, par quantité, par date d'ajout
- Carte pelote : pastille couleur, marque, gamme, coloris, composition, quantité + totaux

### Actions disponibles
- ➕ Ajouter une entrée
- ✏️ Modifier une entrée
- 🗑️ Supprimer une entrée (avec confirmation)

### Hors scope Phase 1
- Scanner code-barres
- Liaison projets
- Partage entre utilisatrices
- Alertes de stock bas

---

## Phase 1 — Specs Techniques

### Base de données

```sql
CREATE TABLE yarn_stash (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id               INT UNSIGNED NOT NULL,
  brand                 VARCHAR(100) NOT NULL,
  yarn_name             VARCHAR(150) NOT NULL,
  color_name            VARCHAR(100) DEFAULT NULL,
  dye_lot               VARCHAR(50)  DEFAULT NULL,
  composition           VARCHAR(200) DEFAULT NULL,
  weight_per_skein_g    DECIMAL(7,1) NOT NULL,
  yardage_per_skein_m   DECIMAL(8,1) NOT NULL,
  quantity              INT UNSIGNED NOT NULL DEFAULT 1,
  needle_size_mm        DECIMAL(4,1) DEFAULT NULL,
  yarn_weight_category  VARCHAR(50)  DEFAULT NULL,
  color_hex             VARCHAR(7)   DEFAULT NULL,
  photo_url             VARCHAR(255) DEFAULT NULL,
  notes                 TEXT         DEFAULT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

> `total_weight_g` et `total_yardage_m` sont calculés à la volée (pas stockés).

### API Endpoints

| Méthode | Route | Action |
|---------|-------|--------|
| GET | `/api/stash` | Liste le stock de l'utilisateur connecté |
| POST | `/api/stash` | Créer une entrée |
| GET | `/api/stash/{id}` | Détail d'une entrée |
| PUT | `/api/stash/{id}` | Modifier une entrée |
| DELETE | `/api/stash/{id}` | Supprimer une entrée |

### Fichiers à créer (backend)
- `backend/controllers/YarnStashController.php`
- `backend/database/migrations/XXX_create_yarn_stash.sql`
- Routes à ajouter dans `backend/routes/api.php`

### Fichiers à créer (frontend)
- `frontend/src/pages/YarnStash.jsx` — page principale
- `frontend/src/components/stash/YarnStashCard.jsx` — carte pelote
- `frontend/src/components/stash/YarnStashForm.jsx` — formulaire ajout/modif
- `frontend/src/components/stash/YarnStashStats.jsx` — bandeau récap global
- Ajout de `yarnStashAPI` dans `frontend/src/services/api.js`

### Limite FREE (à implémenter dans le controller)
```php
// Vérifier la limite FREE avant INSERT
if (!$this->hasActiveSubscription($user)) {
    $count = $this->getStashCount($userId);
    if ($count >= 10) {
        Response::error('Limite de 10 références atteinte. Passez à Pro pour un stock illimité.', HTTP_FORBIDDEN);
        return;
    }
}
```

---

## Phase 2 — Scanner code-barres (Pro)

- Bouton "Scanner" → accès caméra via navigateur (API `BarcodeDetector` ou lib `quagga2`/`ZXing`)
- Si code-barres connu dans la base YarnFlow → pré-remplit le formulaire
- Si inconnu → formulaire vide, après validation la fiche enrichit la base globale
- **Alternative à considérer :** API Ravelry (base de fils déjà très riche) plutôt que base crowdsourcée from scratch
- Risque crowdsourcing : données incorrectes saisies par une utilisatrice = pollution pour toutes → prévoir un mécanisme de signalement

---

## Phase 3 — Liaison Stock ↔ Projets (Pro)

- Lors de la création/édition d'un projet : option "Piocher dans mon stock"
- Association pelote ↔ projet avec quantité réservée
- Affichage dans le stock : `8 pelotes (dont 5 réservées — Veste Turquoise)`
- À la clôture du projet :
  - Option A : consommation comme prévu → N pelotes retirées du stock
  - Option B : reste → saisie des pelotes non utilisées → remises en stock (tag `#Reste`)
- **v1 Phase 3 :** gestion en pelotes entières uniquement (pas de demi-pelotes)
- **v2 Phase 3 :** gestion des restes partiels
