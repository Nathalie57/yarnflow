# Guide d'utilisation - Gestion des catégories

## Installation de la table

Pour créer la table des catégories avec les données initiales :

```bash
mysql -u root -p patron_maker < database/add_categories_table.sql
```

Cette commande va :
1. Créer la table `pattern_categories`
2. Insérer les 5 catégories principales (hat, scarf, amigurumi, bag, garment)
3. Insérer les 31 sous-catégories associées

## Structure de la table

### Champs principaux

- `category_key` : Clé unique (hat, scarf, etc.)
- `category_label` : Label affiché (Bonnets, Écharpes, etc.)
- `category_icon` : Emoji (🧢, 🧣, etc.)
- `subtype_key` : Clé du sous-type (beanie, slouchy, etc.) - NULL pour catégorie principale
- `subtype_label` : Label du sous-type
- `subtype_description` : Description du sous-type
- `available_sizes` : JSON array des tailles disponibles
- `display_order` : Ordre d'affichage
- `is_active` : Actif ou non (soft delete)

## Interface d'administration

Accédez à l'interface via : **http://patron-maker.local/admin/categories**

### Fonctionnalités disponibles :

1. **Créer une nouvelle catégorie principale**
   - Clé (en anglais, minuscules) : `hat`, `scarf`, etc.
   - Label (affiché) : `Bonnets`, `Écharpes`, etc.
   - Icône emoji : 🧢, 🧣, etc.
   - Tailles disponibles : `baby, child, adult` ou `small, medium, large`, etc.

2. **Ajouter une sous-catégorie**
   - Choisir la catégorie parente
   - Clé du sous-type : `beanie`, `slouchy`, etc.
   - Label : `Beanie`, `Slouchy`, etc.
   - Description : description courte du style

3. **Modifier une catégorie ou sous-catégorie**
   - Modifier les labels, descriptions, icônes
   - Modifier les tailles disponibles

4. **Supprimer** (soft delete)
   - Les éléments supprimés sont désactivés (`is_active = 0`)
   - Ils n'apparaissent plus dans l'interface utilisateur

## Utilisation dans le Generator

Le générateur de patrons utilise désormais les catégories de la base de données.

Pour charger les catégories dans le frontend :

```javascript
import { categoriesAPI } from '../services/api'

const categories = await categoriesAPI.getAll()
```

Structure retournée :

```json
{
  "hat": {
    "key": "hat",
    "label": "Bonnets",
    "icon": "🧢",
    "sizes": ["baby", "child", "adult"],
    "subtypes": {
      "beanie": {
        "key": "beanie",
        "label": "Beanie",
        "description": "Bonnet ajusté classique"
      },
      "slouchy": {
        "key": "slouchy",
        "label": "Slouchy",
        "description": "Bonnet ample et décontracté"
      }
    }
  }
}
```

## Migration du Generator

### Étape 1 : Importer les catégories depuis la BDD

Modifier `Generator.jsx` pour charger les catégories depuis l'API :

```javascript
const [categories, setCategories] = useState({})

useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    }
  }
  loadCategories()
}, [])
```

### Étape 2 : Supprimer l'objet categories hardcodé

Une fois que les catégories sont chargées depuis la BDD, vous pouvez supprimer l'objet `categories` hardcodé dans `Generator.jsx` (lignes 21-88).

## API Endpoints

### Public (accessible à tous)

- `GET /api/categories` - Récupérer toutes les catégories avec hiérarchie
- `GET /api/categories/{categoryKey}/subtypes` - Récupérer les sous-catégories d'une catégorie

### Admin uniquement

- `POST /api/admin/categories` - Créer une nouvelle catégorie
- `POST /api/admin/categories/{categoryKey}/subtypes` - Créer une sous-catégorie
- `PUT /api/admin/categories/{id}` - Mettre à jour une catégorie/sous-catégorie
- `DELETE /api/admin/categories/{id}` - Supprimer (soft delete)
- `POST /api/admin/categories/reorder` - Réorganiser l'ordre d'affichage

## Exemples d'utilisation

### Créer une nouvelle catégorie "Couvertures"

Via l'interface admin ou via API :

```javascript
await adminAPI.createCategory({
  category_key: 'blanket',
  category_label: 'Couvertures',
  category_icon: '🧣',
  available_sizes: ['baby', 'small', 'medium', 'large'],
  display_order: 6
})
```

### Ajouter un nouveau style de bonnet

```javascript
await adminAPI.createSubtype('hat', {
  subtype_key: 'earflap',
  subtype_label: 'À rabats',
  subtype_description: 'Bonnet avec rabats pour les oreilles',
  display_order: 6
})
```

## Notes importantes

1. **Clés uniques** : Les `category_key` doivent être uniques. Les combinaisons `(category_key, subtype_key)` doivent être uniques.

2. **Soft delete** : La suppression désactive simplement l'élément (`is_active = 0`). Pour une suppression définitive, utilisez la méthode `hardDeleteCategory()` du modèle.

3. **Ordre d'affichage** : Les éléments sont triés par `display_order` ASC. Utilisez des multiples de 10 (10, 20, 30...) pour faciliter les réorganisations.

4. **Tailles disponibles** : Stockées en JSON. Exemples courants :
   - Vêtements : `["XS", "S", "M", "L", "XL"]`
   - Accessoires : `["baby", "child", "adult"]`
   - Objets : `["small", "medium", "large"]`

5. **Synchronisation** : Si vous modifiez les catégories, pensez à vérifier que les patrons existants utilisent des clés valides.
