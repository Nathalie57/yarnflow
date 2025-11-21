# 📖 Guide d'utilisation - Interface Admin Options

## 🎯 Vue d'ensemble

L'interface d'administration des options de personnalisation permet de gérer les **30+ options** qui permettent aux utilisateurs de personnaliser leurs patrons de crochet.

**Accès** : `/admin/options` (accessible depuis le Dashboard Admin)

---

## ✅ Fonctionnalités disponibles

### 1. Visualisation des options

Les options sont organisées par **7 groupes** :
- 📐 **Dimensions & Ajustement** (fit_type, length_preference, elasticity)
- 🎨 **Style & Esthétique** (color_count, pattern_style, general_style, season)
- 🧶 **Fil & Matériel** (yarn_type, yarn_weight, hook_size)
- 🎯 **Usage & Praticité** (intended_use, care_level, durability)
- 📋 **Format du patron** (detail_level, include_diagrams, include_photos, abbreviations_list)
- ⭐ **Options spéciales** (neckline, sleeves, closure pour vêtements, etc.)
- 💡 **Personnalisation créative** (theme, custom_message, inspiration_reference)

Chaque option affiche :
- ✅ Son label et description
- ✅ Le type de champ (liste déroulante, radio, texte, nombre, etc.)
- ✅ Les valeurs disponibles
- ✅ Le template de prompt IA
- ✅ Les badges : Premium, Inactif
- ✅ Les catégories applicables
- ✅ Le modificateur de prix

---

### 2. Créer une nouvelle option

Cliquez sur **"➕ Nouvelle option"** en haut à droite.

#### Formulaire de création

**📋 Informations de base :**
- **Clé de l'option** (obligatoire) : Identifiant unique en snake_case (ex: `color_preference`, `sleeve_length`)
- **Groupe** : À quel groupe appartient l'option (dimensions, style, material, etc.)
- **Label** : Texte affiché à l'utilisateur (ex: "Nombre de couleurs")
- **Type de champ** :
  - Liste déroulante (select)
  - Boutons radio (radio)
  - Case à cocher (checkbox)
  - Texte court (text)
  - Nombre (number)
  - Curseur (range)
  - Texte long (textarea)
- **Description** : Texte d'explication
- **Icône** : Emoji pour décorer l'option (ex: 🎨, 📏)
- **Ordre d'affichage** : Position dans le groupe (0 = premier)

**🎯 Valeurs disponibles** (pour select/radio/checkbox) :
Format : `value|label|description` (une par ligne)

Exemple :
```
fitted|Ajusté|Près du corps
regular|Normal|Ajustement standard
loose|Ample|Large et décontracté
oversized|Très ample|Style oversize
```

**⚙️ Valeurs et limites :**
- **Valeur par défaut** : Valeur pré-sélectionnée
- **Placeholder** : Texte d'aide dans le champ
- **Min/Max/Step** : Pour les champs numériques

**🎯 Applicabilité :**
- **Catégories applicables** : Liste séparée par virgules (ex: `hat, scarf, garment`)
  - Vide = toutes les catégories
- **Niveaux applicables** : Liste séparée par virgules (ex: `beginner, intermediate`)
  - Vide = tous les niveaux
- **Obligatoire pour catégories** : Catégories où l'option est requise

**🤖 Template de prompt IA :**
Template utilisé pour générer le prompt envoyé à l'IA.

Variables disponibles :
- `{value}` : La valeur brute (ex: `fitted`)
- `{label}` : Le label de la valeur (ex: `Ajusté`)
- `{description}` : La description (ex: `Près du corps`)

Exemple :
```
L'ajustement doit être {label} : {description}
```

Résultat avec `fitted` sélectionné :
```
L'ajustement doit être Ajusté : Près du corps
```

**💰 Prix et statut :**
- **Affecte le prix** : Cochez si cette option change le prix
- **Modificateur de prix** : Montant en euros (positif ou négatif, ex: `1.50` ou `-0.50`)
- **Option premium** : Réservée aux abonnés premium
- **Option active** : Visible ou masquée

---

### 3. Modifier une option

Cliquez sur le bouton **"✏️"** à droite de l'option.

Le formulaire s'ouvre avec les valeurs actuelles pré-remplies.

**Note** : La clé de l'option (`option_key`) ne peut pas être modifiée après création.

---

### 4. Supprimer une option

Cliquez sur le bouton **"🗑️"** à droite de l'option.

**Important** : C'est une suppression douce (soft delete), l'option est marquée comme inactive mais reste en base de données.

---

## 🎓 Exemples d'options pré-configurées

### Exemple 1 : Option simple (radio)

**Clé** : `fit_type`
**Groupe** : dimensions
**Label** : Ajustement
**Type** : radio
**Valeurs** :
```
fitted|Ajusté|Près du corps
regular|Normal|Ajustement standard
loose|Ample|Large et décontracté
oversized|Très ample|Style oversize
```
**Prompt IA** :
```
L'ajustement doit être {label} : {description}
```
**Prix** : Non
**Catégories** : Toutes

---

### Exemple 2 : Option spécifique (select)

**Clé** : `neckline`
**Groupe** : special
**Label** : Type de col
**Type** : select
**Valeurs** :
```
round|Col rond|Encolure ronde classique
v_neck|Col V|Décolleté en V
square|Col carré|Encolure carrée moderne
boat|Col bateau|Large et élégant
turtleneck|Col roulé|Montant et chaud
no_collar|Sans col|Style débardeur
```
**Prompt IA** :
```
Le vêtement doit avoir un {label} : {description}
```
**Prix** : Non
**Catégories** : `garment` uniquement
**Obligatoire pour** : `garment`

---

### Exemple 3 : Option créative (textarea)

**Clé** : `custom_message`
**Groupe** : creative
**Label** : Message personnalisé
**Type** : textarea
**Valeurs** : Aucune (champ libre)
**Prompt IA** :
```
DEMANDE SPÉCIFIQUE : {value}
```
**Placeholder** : "Ex: Je voudrais un bonnet avec des rayures bleues et blanches"
**Prix** : Non
**Catégories** : Toutes

---

### Exemple 4 : Option premium payante (select)

**Clé** : `custom_fit`
**Groupe** : dimensions
**Label** : Ajustement sur mesure
**Type** : select
**Valeurs** :
```
standard|Standard|Taille standard
custom|Sur mesure|Dimensions personnalisées
```
**Prompt IA** :
```
Utiliser des mesures {label}
```
**Prix** : Oui
**Modificateur** : `+2.00€`
**Premium** : Oui
**Catégories** : `garment`

---

## 🔄 Workflow complet

### Utilisateur génère un patron avec options

1. L'utilisateur sélectionne `bonnet` > `slouchy` > `intermediate` > `adult`
2. **Étape 5 - Personnalisation** (nouveau)
3. L'utilisateur choisit :
   - Ajustement : Ample
   - Couleurs : 2 couleurs
   - Style : Rayé
   - Fil : Coton
   - Saison : Été
   - Détails : Très détaillé
4. Prix calculé automatiquement si options payantes
5. L'utilisateur clique sur "Générer"

### Backend construit le prompt IA

```php
$optionsPrompt = $this->patternOptionModel->buildPromptFragment($params['custom_options']);
```

**Prompt généré** :
```
Tu es un expert en crochet...

TÂCHE : Génère un patron pour un bonnet slouchy, niveau intermédiaire, taille adulte.

EXEMPLES DE PATRONS : ...

OPTIONS DE PERSONNALISATION :
L'ajustement doit être Ample : Large et décontracté
Utiliser Bicolore (2 couleurs) dans le patron
Le motif doit être de style Rayé : Rayures horizontales ou verticales
Utiliser du fil en Coton : Naturel, respirant, lavable
Conçu pour Été : Léger et aéré
Niveau de détail : Très détaillé - Instructions pas à pas, idéal débutants

FORMAT DE SORTIE : JSON...
```

### IA génère le patron personnalisé

L'IA reçoit le prompt enrichi et génère un patron **sur-mesure** qui respecte toutes les options choisies.

---

## 💡 Bonnes pratiques

### Pour créer de bonnes options

✅ **Labels clairs** : Utilisez des termes compréhensibles par tous
✅ **Descriptions précises** : Expliquez bien chaque valeur
✅ **Prompts IA détaillés** : Soyez spécifique dans les templates
✅ **Valeurs cohérentes** : Limitez à 5-8 choix maximum par option
✅ **Groupement logique** : Mettez les options similaires dans le même groupe
✅ **Ordre d'affichage** : Les options les plus importantes en premier

❌ **À éviter** :
- Trop d'options obligatoires (frustrant pour l'utilisateur)
- Options trop techniques (jargon)
- Trop de choix (paradoxe du choix)
- Options redondantes

---

### Pour les prompts IA

**Bon prompt** ✅ :
```
L'ajustement doit être {label} : {description}
```
→ Résultat : "L'ajustement doit être Ample : Large et décontracté"

**Mauvais prompt** ❌ :
```
{value}
```
→ Résultat : "loose" (pas assez d'information pour l'IA)

---

## 🧪 Tester les options

### Méthode 1 : API directement

```bash
# Récupérer toutes les options
curl http://patron-maker.local/api/pattern-options

# Filtrer par catégorie
curl http://patron-maker.local/api/pattern-options?category=hat

# Récupérer les options requises
curl http://patron-maker.local/api/pattern-options/required/garment

# Récupérer par groupe
curl http://patron-maker.local/api/pattern-options/group/dimensions
```

### Méthode 2 : Via le générateur

1. Allez sur `/generator`
2. Sélectionnez type/niveau/taille
3. L'étape 5 "Personnalisation" devrait afficher vos options
4. Testez en générant un patron

---

## 📊 Statistiques d'utilisation

**Options créées par défaut** : 30+
**Groupes disponibles** : 7
**Types de champs supportés** : 7

**Répartition par groupe** :
- Dimensions : 3 options
- Style : 4 options
- Matériel : 3 options
- Usage : 3 options
- Format : 4 options
- Spéciales : 9+ options (selon catégories)
- Créatives : 3 options

---

## 🚀 Prochaines étapes

Pour finaliser le système de personnalisation :

1. ✅ **Backend complet** (terminé)
2. ✅ **Interface admin** (terminé)
3. ⏳ **Étape 5 dans Generator.jsx** (à faire)
   - Charger les options depuis l'API
   - Afficher 7 accordéons (un par groupe)
   - Render dynamique selon field_type
   - Filtrer par catégorie sélectionnée
4. ⏳ **Tests** (à faire)
   - Importer le SQL
   - Tester l'API
   - Générer un patron avec options
   - Vérifier la qualité

---

## 📞 Support technique

**Fichiers créés** :
- `backend/models/PatternOption.php`
- `backend/controllers/PatternOptionController.php`
- `backend/routes/api.php` (routes ajoutées)
- `backend/services/AIPatternService.php` (modifié)
- `frontend/src/pages/admin/AdminOptions.jsx`
- `frontend/src/services/api.js` (API ajoutée)
- `frontend/src/App.jsx` (route ajoutée)
- `database/add_pattern_options_table.sql`

**Documentation** :
- `PERSONNALISATION_AVANCEE_BACKEND.md`
- `ADMIN_OPTIONS_GUIDE.md` (ce fichier)

---

**Dernière mise à jour** : 2025-11-13
**Auteur** : Nathalie + AI Assistants (Claude)
