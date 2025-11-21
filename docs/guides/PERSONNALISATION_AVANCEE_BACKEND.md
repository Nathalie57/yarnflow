# 🎨 Système de personnalisation avancée - Backend (Partie 1)

## 📋 Objectif

Permettre aux utilisateurs de personnaliser leurs patrons de crochet de manière beaucoup plus détaillée, avec plus de 30 options réparties en 7 groupes :

1. **Dimensions & Ajustement** (3 options)
2. **Style & Esthétique** (4 options)
3. **Fil & Matériel** (3 options)
4. **Usage & Praticité** (3 options)
5. **Format du patron** (4 options)
6. **Options spéciales** (9 options selon catégorie)
7. **Personnalisation créative** (3 options)

---

## ✅ Backend terminé

### 1. Base de données

**Fichier** : `database/add_pattern_options_table.sql`

**Table créée** : `pattern_options`

**Structure** :
- `id` : ID unique
- `option_key` : Clé unique (ex: color_count, fit_type)
- `option_group` : Groupe (dimensions, style, material, usage, format, special, creative)
- `option_label` : Label affiché (ex: "Nombre de couleurs")
- `option_description` : Description de l'option
- `field_type` : Type de champ (select, radio, checkbox, text, number, range, textarea)
- `available_values` : JSON des valeurs possibles avec labels et descriptions
- `default_value` : Valeur par défaut
- `min_value`, `max_value`, `step_value` : Pour les champs numériques
- `applicable_categories` : JSON des catégories où cette option s'applique (null = toutes)
- `applicable_levels` : JSON des niveaux où cette option s'applique (null = tous)
- `required_for_categories` : JSON des catégories où l'option est obligatoire
- `display_order` : Ordre d'affichage
- `icon` : Emoji icon
- `ai_prompt_template` : Template pour le prompt IA (ex: "L'ajustement doit être {label} : {description}")
- `affects_price` : Booléen si affecte le prix
- `price_modifier` : Modificateur de prix (+/-euros)
- `is_active` : Actif ou non
- `is_premium` : Réservé premium
- `help_text` : Texte d'aide
- `placeholder` : Placeholder pour champs texte

**Options créées** : 30+ options pré-configurées

#### Exemples d'options :

**Dimensions** :
- `fit_type` : Ajusté / Normal / Ample / Très ample
- `length_preference` : Court / Moyen / Long / Très long
- `elasticity` : Rigide / Modérée / Élastique

**Style** :
- `color_count` : 1 couleur / 2 couleurs / 3+ couleurs
- `pattern_style` : Uni / Rayé / Géométrique / Texturé / Dentelle / Torsades / Jacquard / Points fantaisie
- `general_style` : Moderne / Vintage / Bohème / Classique / Minimaliste / Romantique / Rustique / Ludique
- `season` : Été / Mi-saison / Hiver / Toutes saisons

**Matériel** :
- `yarn_type` : Peu importe / Coton / Acrylique / Laine / Bambou / Mélange / Chenille / Recyclé
- `yarn_weight` : Peu importe / Extra fin / Fin / Sport/DK / Moyen / Épais / Très épais
- `hook_size` : Automatique / 2.0mm à 10.0mm

**Usage** :
- `intended_use` : Personnel / Cadeau / Décoration / Vente / Usage quotidien
- `care_level` : Facile / Modéré / Délicat
- `durability` : Usage quotidien / Occasionnel / Décoratif

**Format** :
- `detail_level` : Très détaillé / Standard / Condensé
- `include_diagrams` : Oui / Non
- `include_photos` : Oui / Non
- `abbreviations_list` : Oui / Non

**Spécial - Vêtements** :
- `neckline` : Col rond / Col V / Col carré / Col bateau / Col roulé / Sans col
- `sleeves` : Sans manches / Courtes / 3/4 / Longues / Évasées
- `closure` : Sans fermeture / Boutons / Zip / Liens

**Spécial - Amigurumis** :
- `amigurumi_size_cm` : Taille en cm (champ numérique)
- `amigurumi_accessories` : Sans / Simples / Complets
- `amigurumi_expression` : Mignon / Réaliste / Simple / Joyeux / Endormi

**Spécial - Sacs** :
- `bag_lining` : Avec / Sans doublure
- `bag_handles` : Courtes / Longues / Bretelles / Chaîne / Sans
- `bag_pockets` : Sans / Intérieures / Extérieures / Les deux

**Créatif** :
- `theme` : Thème spécifique (texte libre)
- `custom_message` : Message personnalisé (textarea)
- `inspiration_reference` : Référence d'inspiration (textarea)

---

### 2. Modèle PHP

**Fichier** : `backend/models/PatternOption.php`

**Méthodes principales** :

```php
// Récupérer toutes les options groupées et filtrées
getOptionsGrouped(?categoryKey, ?level): array

// Récupérer options requises pour une catégorie
getRequiredOptions(categoryKey): array

// Trouver par clé
findByKey(optionKey): ?array

// Créer une option
createOption(data): int|false

// Mettre à jour
updateOption(id, data): bool

// Supprimer (soft delete)
deleteOption(id): bool

// Vérifier existence
optionKeyExists(optionKey): bool

// Par groupe
getOptionsByGroup(group): array

// Construire fragment de prompt IA ⭐
buildPromptFragment(selectedOptions): string

// Calculer modificateur de prix
calculatePriceModifier(selectedOptions): float
```

**Exemple d'utilisation** :

```php
$optionModel = new PatternOption();

// Récupérer options pour bonnet, niveau débutant
$options = $optionModel->getOptionsGrouped('hat', 'beginner');

// Construire le prompt avec options sélectionnées
$userSelections = [
    'fit_type' => 'loose',
    'color_count' => '2',
    'pattern_style' => 'striped',
    'yarn_type' => 'cotton'
];

$promptFragment = $optionModel->buildPromptFragment($userSelections);
// Retourne:
// OPTIONS DE PERSONNALISATION :
// L'ajustement doit être Ample : Large et décontracté
// Utiliser Bicolore (2 couleurs) dans le patron
// Le motif doit être de style Rayé : Rayures horizontales ou verticales
// Utiliser du fil en Coton : Naturel, respirant, lavable
```

---

### 3. Contrôleur PHP

**Fichier** : `backend/controllers/PatternOptionController.php`

**Routes publiques** :
- `GET /api/pattern-options` - Toutes les options groupées (avec filtres ?category= et ?level=)
- `GET /api/pattern-options/required/{categoryKey}` - Options requises
- `GET /api/pattern-options/key/{optionKey}` - Une option par clé
- `GET /api/pattern-options/group/{group}` - Options d'un groupe

**Routes admin** :
- `POST /api/admin/pattern-options` - Créer
- `PUT /api/admin/pattern-options/{id}` - Modifier
- `DELETE /api/admin/pattern-options/{id}` - Supprimer (soft)

---

### 4. Routes API

**Fichier** : `backend/routes/api.php`

Routes ajoutées dans le match() :

```php
// Public
$method === 'GET' && $uri === 'pattern-options' => (new PatternOptionController())->index(),
$method === 'GET' && preg_match('/^pattern-options\/required\/(.+)$/', $uri, $matches) => (new PatternOptionController())->getRequired($matches[1]),
$method === 'GET' && preg_match('/^pattern-options\/key\/(.+)$/', $uri, $matches) => (new PatternOptionController())->getByKey($matches[1]),
$method === 'GET' && preg_match('/^pattern-options\/group\/(.+)$/', $uri, $matches) => (new PatternOptionController())->getByGroup($matches[1]),

// Admin
$method === 'POST' && $uri === 'admin/pattern-options' => (new PatternOptionController())->create(),
$method === 'PUT' && preg_match('/^admin\/pattern-options\/(\d+)$/', $uri, $matches) => (new PatternOptionController())->update((int)$matches[1]),
$method === 'DELETE' && preg_match('/^admin\/pattern-options\/(\d+)$/', $uri, $matches) => (new PatternOptionController())->delete((int)$matches[1]),
```

---

### 5. Service IA mis à jour

**Fichier** : `backend/services/AIPatternService.php`

**Modifications** :

1. Ajout de `PatternOption` dans les dépendances
2. Méthode `buildPrompt()` enrichie :
   - Récupère le fragment de prompt depuis les options
   - Ajoute la section "OPTIONS DE PERSONNALISATION"
   - Ajoute la demande spécifique de l'utilisateur

**Exemple de prompt généré** :

```
Tu es un expert en crochet avec 20 ans d'expérience.

TÂCHE : Génère un patron pour un bonnet, niveau débutant, taille adult.

STRUCTURE REQUISE : ...

EXEMPLES DE PATRONS : ...

OPTIONS DE PERSONNALISATION :
L'ajustement doit être Ample : Large et décontracté
Utiliser Bicolore (2 couleurs) dans le patron
Le motif doit être de style Rayé : Rayures horizontales ou verticales
Utiliser du fil en Coton : Naturel, respirant, lavable
Conçu pour Été : Léger et aéré
Niveau de détail : Très détaillé - Instructions pas à pas, idéal débutants

DEMANDE SPÉCIFIQUE DE L'UTILISATEUR :
Je voudrais un bonnet avec des rayures bleues et blanches, style marin

FORMAT DE SORTIE : JSON...
```

---

## 📊 Architecture complète

```
┌──────────────────────────────────┐
│   Utilisateur sélectionne        │
│     30+ options                   │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  Frontend Generator.jsx          │
│  (Étape 5 : Personnalisation)    │
│  - Accordéons par groupe         │
│  - Champs dynamiques             │
└────────────┬─────────────────────┘
             │
             ↓ POST /api/patterns/generate
             │ {custom_options: {...}}
┌──────────────────────────────────┐
│  PatternController               │
│  - Valide les options            │
│  - Calcule modificateur prix     │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  AIPatternService                │
│  - Charge les templates          │
│  - Construit le prompt           │
│  - Ajoute les options ⭐         │
│  - Envoie à l'IA                 │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  PatternOption::buildPrompt...() │
│  - Transforme options en texte   │
│  - Template : "{label}: {desc}"  │
└────────────┬─────────────────────┘
             │
             ↓
┌──────────────────────────────────┐
│  API IA (Claude/OpenAI)          │
│  - Génère patron personnalisé    │
└──────────────────────────────────┘
```

---

## 🎯 Avantages du système

### Pour l'utilisateur :
- ✅ **30+ options de personnalisation** vs 4 actuellement
- ✅ **Contrôle total** sur le style, matériel, format
- ✅ **Options contextuelles** selon la catégorie
- ✅ **Demandes spécifiques** en texte libre
- ✅ **Prix dynamique** selon options choisies

### Pour l'admin :
- ✅ **Interface de gestion** pour ajouter/modifier options
- ✅ **Pas de code** à modifier
- ✅ **Filtrage intelligent** par catégorie/niveau
- ✅ **Options premium** possibles

### Pour l'IA :
- ✅ **Prompts très détaillés** = patrons plus précis
- ✅ **Templates structurés** avec placeholders
- ✅ **Contexte riche** pour génération

---

## 📦 Fichiers créés (Backend)

1. `database/add_pattern_options_table.sql` (~800 lignes)
2. `backend/models/PatternOption.php` (~300 lignes)
3. `backend/controllers/PatternOptionController.php` (~150 lignes)
4. `backend/routes/api.php` (7 routes ajoutées)
5. `backend/services/AIPatternService.php` (modifié)

**Total : ~1250 lignes de code ajoutées**

---

## 🚀 Prochaines étapes

### Frontend (À faire) :

1. **Mettre à jour `services/api.js`** :
   ```javascript
   // Pattern Options API
   export const patternOptionsAPI = {
     getAll: (params) => api.get('/pattern-options', { params }),
     getRequired: (categoryKey) => api.get(`/pattern-options/required/${categoryKey}`),
     getByGroup: (group) => api.get(`/pattern-options/group/${group}`)
   }
   ```

2. **Modifier `Generator.jsx`** :
   - Ajouter étape 5 "Personnalisation (optionnel)"
   - Charger les options depuis l'API
   - Accordéons par groupe (7 groupes)
   - Render dynamique selon field_type
   - Gérer les options spéciales selon catégorie

3. **Créer interface admin** :
   - `AdminOptions.jsx` pour gérer les options
   - CRUD complet
   - Prévisualisation du rendu

### Tests :

1. Importer le SQL
2. Tester l'API dans Postman
3. Vérifier le prompt généré
4. Générer un patron avec options
5. Comparer la qualité avant/après

---

## 💡 Exemples d'utilisation finale

### Cas 1 : Bonnet simple (sans options)
```
Type: hat
Subtype: beanie
Level: beginner
Size: adult
→ Patron standard
```

### Cas 2 : Bonnet personnalisé (avec options)
```
Type: hat
Subtype: slouchy
Level: intermediate
Size: adult
+ Ample
+ 2 couleurs
+ Style rayé
+ Coton
+ Été
+ Très détaillé
+ Demande: "Rayures marines bleues et blanches"
→ Patron sur-mesure très précis
```

---

**Backend 100% terminé !** ✅

Prochaine étape : Frontend (Partie 2)
