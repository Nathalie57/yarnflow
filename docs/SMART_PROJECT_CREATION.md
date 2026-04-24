# 🧠 Smart Project Creation - Documentation Technique

**Version** : 0.17.0
**Date** : 2026-01-07
**Auteur** : Nathalie + Claude Code

---

## 📋 Vue d'ensemble

La **Création Intelligente de Projets** permet aux utilisateurs de créer automatiquement un projet YarnFlow à partir d'un **fichier PDF** ou d'une **URL web** en utilisant l'IA Gemini 2.0 pour extraire les informations clés du patron.

**Caractéristiques principales :**
- ✅ Import PDF natif (max 10 MB)
- ✅ Scraping simple d'URLs (blogs, sites web)
- ✅ Extraction IA avec Gemini 2.0 Flash
- ✅ Écran de validation éditable (rien n'est forcé)
- ✅ Quotas mensuels par plan (FREE: 1, PLUS: 5, PRO: illimité)
- ✅ Tracking complet des imports (succès/partial/échec)

---

## 🎯 Workflow utilisateur

### Étape 1 : Choix du mode
L'utilisateur choisit entre :
- **📄 PDF** : Upload d'un fichier patron (max 10 MB)
- **🔗 URL** : Import depuis un lien web

### Étape 2 : Analyse IA
- Upload du fichier ou saisie de l'URL
- Appel API `/api/projects/smart-create/analyze`
- Temps de traitement : 5-30 secondes selon la taille
- Loader avec animation

### Étape 3 : Validation/Édition
- Affichage des données extraites (pré-remplies)
- **Tous les champs sont éditables** par l'utilisateur
- Badge si extraction partielle (certaines infos manquantes)
- Possibilité d'ajouter/supprimer/modifier les sections

### Étape 4 : Création confirmée
- Appel API `/api/projects/smart-create/confirm`
- Création du projet + sections en base de données
- Redirection vers le projet ou liste des projets

---

## 💾 Architecture Base de Données

### Nouvelles colonnes `projects`

```sql
craft_type ENUM('tricot', 'crochet', 'autre') DEFAULT NULL
gauge_stitches INT DEFAULT NULL
gauge_rows INT DEFAULT NULL
gauge_size_cm INT DEFAULT 10
source_type ENUM('pdf', 'url', 'manual') DEFAULT 'manual'
source_url VARCHAR(500) DEFAULT NULL
```

### Nouvelle table `ai_pattern_imports`

```sql
CREATE TABLE ai_pattern_imports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    project_id INT UNSIGNED DEFAULT NULL,

    source_type ENUM('pdf', 'url') NOT NULL,
    source_name VARCHAR(500) NOT NULL,
    file_size_bytes INT DEFAULT NULL,

    ai_status ENUM('success', 'partial', 'failed') DEFAULT 'success',
    ai_response_json JSON DEFAULT NULL,
    processing_time_ms INT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,

    INDEX idx_user_month (user_id, created_at)
);
```

**Utilité :** Tracking des quotas mensuels + analyse des taux de succès IA

---

## 🔌 API Endpoints

### 1. `GET /api/projects/smart-create/quota`

Récupère le quota d'imports IA de l'utilisateur.

**Authentification :** Bearer token requis

**Réponse :**
```json
{
  "success": true,
  "quota": {
    "total": 5,
    "used": 2,
    "remaining": 3,
    "unlimited": false,
    "plan": "plus"
  }
}
```

---

### 2. `POST /api/projects/smart-create/analyze`

Analyse un PDF ou URL et extrait les informations avec Gemini.

**Authentification :** Bearer token requis

**Body (multipart/form-data) :**
- **PDF** : `file` (File, max 10 MB)
- **URL** : `url` (string)

**Réponse success :**
```json
{
  "success": true,
  "data": {
    "title": "Bonnet facile au crochet",
    "craft_type": "crochet",
    "category": "bonnet",
    "description": "Un joli bonnet pour débutants",
    "yarn": {
      "brand": "Phildar Phil Coton 3",
      "color": "Bleu ciel",
      "weight": "DK",
      "composition": "100% coton"
    },
    "hook_or_needles": {
      "size": "4.5"
    },
    "gauge": {
      "stitches": 20,
      "rows": 22,
      "size_cm": 10
    },
    "sections": [
      {
        "name": "Corps",
        "unit": "rangs",
        "target": 40,
        "description": "Crocheter en rond"
      },
      {
        "name": "Finitions",
        "unit": "rangs",
        "target": null,
        "description": "Rentrer les fils"
      }
    ],
    "pattern_notes": "Attention au changement de couleur au rang 25"
  },
  "ai_status": "success",
  "processing_time_ms": 8450,
  "source_type": "pdf",
  "source_name": "patron-bonnet.pdf"
}
```

**Réponse erreur (quota dépassé) :**
```json
{
  "error": "Quota d'imports IA atteint pour ce mois",
  "upgrade_required": true
}
```

**Réponse erreur (extraction partielle) :**
```json
{
  "success": true,
  "data": { ... },
  "ai_status": "partial"
}
```

---

### 3. `POST /api/projects/smart-create/confirm`

Crée le projet après validation par l'utilisateur.

**Authentification :** Bearer token requis

**Body (JSON) :**
```json
{
  "project": {
    "title": "Mon bonnet",
    "craft_type": "crochet",
    "category": "bonnet",
    "description": "...",
    "yarn": { ... },
    "hook_or_needles": { ... },
    "gauge": { ... },
    "pattern_notes": "..."
  },
  "sections": [
    { "name": "Corps", "unit": "rangs", "target": 40, "description": "..." },
    { "name": "Finitions", "unit": "rangs", "target": null, "description": "..." }
  ],
  "source_type": "pdf",
  "source_url": "patron-bonnet.pdf"
}
```

**Réponse :**
```json
{
  "success": true,
  "project": {
    "id": 123,
    "name": "Mon bonnet",
    "craft_type": "crochet",
    ...
  },
  "message": "Projet créé avec succès"
}
```

---

## 🧩 Architecture Backend

### Services

**`AIPatternExtractorService.php`**
- `extractFromPDF(string $filePath): array`
- `extractFromURL(string $url): array`
- Appels à Gemini 2.0 Flash API
- Parsing JSON structuré

**`PricingService.php`**
- `getLimit(string $plan, string $feature): int|bool`
- Quotas : FREE 1, PLUS 5, PRO illimité

### Controllers

**`SmartProjectController.php`**
- `getQuota()` : Récupère quota restant
- `analyze()` : Analyse PDF/URL avec IA
- `confirm()` : Crée projet + sections

### Routes

```php
$method === 'GET' && $uri === 'projects/smart-create/quota'
    => (new SmartProjectController())->getQuota()

$method === 'POST' && $uri === 'projects/smart-create/analyze'
    => (new SmartProjectController())->analyze()

$method === 'POST' && $uri === 'projects/smart-create/confirm'
    => (new SmartProjectController())->confirm()
```

---

## 🎨 Architecture Frontend

### Pages

**`SmartProjectCreator.jsx`** (625 lignes)
- Gestion du workflow 4 étapes
- Upload fichier PDF
- Saisie URL
- Formulaire édition complet
- Gestion sections dynamiques

### Routes

```jsx
<Route path="/smart-project-creator" element={<SmartProjectCreator />} />
```

### Point d'entrée

**MyProjects.jsx** :
```jsx
<Link to="/smart-project-creator">
  ✨ Création Intelligente
</Link>
```

---

## 💰 Pricing & Quotas

| Plan          | Imports IA/mois | Prix     |
|---------------|-----------------|----------|
| **FREE**      | 1               | Gratuit  |
| **PLUS**      | 5               | 2.99€/mois |
| **PLUS Annual** | 5             | 29.99€/an |
| **PRO**       | Illimité        | 4.99€/mois |
| **PRO Annual** | Illimité       | 49.99€/an |
| **Early Bird** | Illimité       | 2.99€/mois |

**Contraintes :**
- Quotas reset le 1er de chaque mois
- Fichier PDF max 10 MB
- Timeout API Gemini : 30 secondes

---

## 🔍 Prompt IA Gemini

Le prompt système demande à Gemini d'extraire un JSON structuré :

```javascript
{
  "title": string,
  "craft_type": "tricot" | "crochet" | "autre",
  "category": "bonnet" | "écharpe" | ... | null,
  "description": string | null,
  "yarn": { brand, color, weight, composition },
  "hook_or_needles": { size },
  "gauge": { stitches, rows, size_cm },
  "sections": [{ name, unit, target, description }],
  "pattern_notes": string | null
}
```

**Règles strictes :**
- Si info absente → `null`
- Détection automatique tricot/crochet via vocabulaire
- Sections = parties logiques (Corps, Manches, Finitions...)
- Échantillon ramené à 10 cm
- Yarn weight standardisé (DK, Worsted, Fingering...)

---

## 📊 Statuts d'extraction IA

| Statut      | Description                                      |
|-------------|--------------------------------------------------|
| `success`   | Toutes les infos importantes extraites          |
| `partial`   | Extraction incomplète (certains champs null)    |
| `failed`    | Échec total (JSON invalide, pas d'infos)        |

**Logique de détermination :**
- `failed` : Pas de titre ET pas de sections
- `partial` : Manque craft_type, yarn ou gauge
- `success` : Toutes les infos de base présentes

---

## 🚀 Déploiement

### 1. Exécuter la migration SQL

```bash
mysql -u user -p patron_maker < database/add_smart_project_creation.sql
```

### 2. Vérifier la configuration

Fichier `.env` :
```ini
GEMINI_API_KEY=AIzaSy...
```

### 3. Build frontend

```bash
cd frontend
npm run build
```

### 4. Redémarrer le backend

```bash
# Si PHP-FPM
sudo systemctl restart php8.1-fpm

# Si Apache
sudo systemctl restart apache2
```

---

## 🧪 Tests

### Tests manuels recommandés

1. **Test quota FREE :**
   - Créer compte FREE
   - Faire 1 import → OK
   - Faire 2ème import → Erreur quota

2. **Test PDF simple :**
   - Upload PDF patron basique
   - Vérifier extraction titre, type, sections
   - Modifier un champ
   - Confirmer création

3. **Test URL blog :**
   - Importer depuis URL type blog crochet
   - Vérifier extraction
   - Confirmer

4. **Test extraction partielle :**
   - Upload PDF incomplet (sans infos laine)
   - Vérifier badge "partial"
   - Compléter manuellement
   - Confirmer

5. **Test fichier trop gros :**
   - Upload PDF > 10 MB
   - Vérifier erreur

---

## 🐛 Troubleshooting

### Erreur "Gemini API Key non configurée"
- Vérifier `.env` contient `GEMINI_API_KEY`
- Redémarrer le backend

### Erreur "Quota atteint"
- Normal pour FREE après 1 import
- Propose upgrade vers PLUS/PRO

### Timeout 30 secondes
- PDF trop lourd ou URL lente
- Réduire taille PDF
- Essayer avec URL plus simple

### JSON invalide
- Gemini n'a pas réussi à parser le patron
- Essayer avec patron mieux formatté
- Ou créer projet manuellement

---

## 📈 Métriques à suivre

**KPIs recommandés :**
- Taux d'utilisation (% utilisateurs qui testent la feature)
- Taux de succès IA (`success` vs `partial` vs `failed`)
- Taux de validation (% imports confirmés)
- Upgrade trigger (% FREE qui atteignent quota et upgradent)
- Temps moyen de traitement IA

**Requête SQL exemple :**
```sql
SELECT
    ai_status,
    COUNT(*) as count,
    AVG(processing_time_ms) as avg_time_ms
FROM ai_pattern_imports
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ai_status;
```

---

## 🔮 Évolutions futures (V2)

**Hors scope V1, à implémenter plus tard :**
- Support OCR images (JPG/PNG)
- Intégration API Ravelry officielle
- Reconnaissance diagrammes/grilles
- Tailles multiples (S/M/L) dans un seul patron
- Détection automatique abréviations complexes
- Export patron vers PDF annoté

---

## 📚 Fichiers modifiés

**Backend (986 lignes) :**
- `database/add_smart_project_creation.sql` (136 lignes)
- `backend/services/AIPatternExtractorService.php` (373 lignes)
- `backend/controllers/SmartProjectController.php` (393 lignes)
- `backend/routes/api.php` (3 lignes)
- `backend/services/PricingService.php` (81 lignes)

**Frontend (630 lignes) :**
- `frontend/src/pages/SmartProjectCreator.jsx` (625 lignes)
- `frontend/src/App.jsx` (2 lignes)
- `frontend/src/pages/MyProjects.jsx` (3 lignes)

**Documentation :**
- `docs/SMART_PROJECT_CREATION.md` (ce fichier)

---

**Auteur** : Nathalie + Claude Code
**Date** : 2026-01-07
**Version** : 0.17.0
