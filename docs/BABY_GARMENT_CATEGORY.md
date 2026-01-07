# Nouvelle catégorie "Vêtements bébé" - v0.16.1

**Date** : 2026-01-07
**Auteur** : Nathalie + Claude

---

## 📋 Résumé

Ajout d'une nouvelle catégorie **"Vêtements bébé"** (`baby_garment`) pour les projets, distincte des "Accessoires bébé" existants. Cette catégorie dispose de ses propres **prompts d'images IA** optimisés pour les vêtements bébé posés à plat dans des mises en scène douces et adaptées.

---

## 🎯 Objectif

Permettre aux utilisateurs de créer des projets spécifiques pour les vêtements bébé (body, gilets, chaussons, etc.) et de générer des photos IA avec des contextes dédiés (lit bébé, nursery, emballage cadeau naissance, etc.).

---

## ✅ Modifications effectuées

### 1. Base de données (SQL)

**Fichier** : `/database/add_baby_garment_category.sql`

- ✅ Modification de la colonne `type` dans la table `projects` pour accepter `baby_garment`
- ✅ Ajout de la catégorie `baby_garment` dans la table `pattern_categories` avec :
  - Tailles : 0-3m, 3-6m, 6-12m, 12-18m, 18-24m
  - Sous-catégories : Body, Barboteuse, Gilet bébé, Chaussons, Bavoir, Couverture, Bonnet bébé

**À exécuter sur o2switch** :
```bash
mysql -u votre_user -p patron_maker < ~/www/database/add_baby_garment_category.sql
```

---

### 2. Backend - Prompts IA (AIPhotoService.php)

**Fichier** : `/backend/services/AIPhotoService.php`

**Nouveaux contextes ajoutés** (9 presets : 3 FREE, 3 PLUS, 3 PRO) :

#### FREE
- `baby_garment_c1` : **👶 PORTÉ** - Bébé allongé sur lit avec draps pastel
- `baby_garment_c2` : **À PLAT** - Fond pastel uni studio
- `baby_garment_c3` : **À PLAT** - Sur table à langer dans nursery scandinave épurée

#### PLUS
- `baby_garment_c4` : **👶 PORTÉ** - Bébé assis/allongé avec jouets en bois
- `baby_garment_c5` : **À PLAT** - Flat lay lifestyle avec accessoires
- `baby_garment_c6` : **À PLAT** - Panier osier vintage

#### PRO
- `baby_garment_c7` : **👶 PORTÉ** - Bébé dans les bras d'un parent
- `baby_garment_c8` : **À PLAT** - Mise en scène lifestyle premium avec fleurs séchées
- `baby_garment_c9` : **👶 PORTÉ** - Bébé sur tapis de jeu moelleux dans nursery bohème

**Comportement** :
- **Photos portées (4/9)** : Le vêtement est porté par un VRAI BÉBÉ dans une mise en scène naturelle et attendrissante
- **Photos à plat (5/9)** : Le vêtement est posé à plat horizontalement dans une mise en scène douce
- **Mix équilibré** : Chaque tier (FREE/PLUS/PRO) a 1-2 photos portées et 1-2 photos à plat
- Conservation exacte des couleurs, textures et motifs dans tous les cas

---

### 3. Frontend - Gallery.jsx

**Fichier** : `/frontend/src/pages/Gallery.jsx`

**Modifications** :
1. ✅ Nouvelle entrée dans `stylesByCategory` → `baby_garment`
2. ✅ 9 styles ajoutés avec icônes et descriptions
3. ✅ Détection dans `detectProjectCategory()` :
   - `'vêtements bébé'` → `'baby_garment'`
   - `'vetements bebe'` → `'baby_garment'`
   - `'baby_garment'` → `'baby_garment'`

---

### 4. Frontend - ProjectCounter.jsx

**Fichier** : `/frontend/src/pages/ProjectCounter.jsx`

**Modifications** :
1. ✅ Ajout de `'Vêtements bébé'` dans la fonction `getProjectTypes()`
2. ✅ Nouvelle option dans le select HTML :
   ```html
   <option value="Vêtements bébé">👶 Vêtements bébé</option>
   ```

---

## 🚀 Utilisation

### 1. Créer un projet "Vêtements bébé"

Dans **ProjectCounter** (création/modification de projet) :
1. Sélectionner **"👶 Vêtements bébé"** dans la catégorie
2. Remplir les détails du projet
3. Sauvegarder

### 2. Uploader une photo

Dans **ProjectCounter** > **Onglet Photos** :
1. Uploader une photo du vêtement bébé
2. Sélectionner **"👶 Vêtements bébé"** comme type d'article

### 3. Générer une photo IA

Dans **Gallery** :
1. La photo détecte automatiquement qu'elle est de type "Vêtements bébé"
2. Affiche les 9 presets dédiés (selon le plan : FREE/PLUS/PRO)
3. Cliquer sur un preset pour voir la preview
4. Valider pour générer la photo HD

---

## 📊 Différences avec "Accessoires bébé"

| Caractéristique | Accessoires bébé | Vêtements bébé |
|-----------------|------------------|----------------|
| **Contextes** | `baby_c1` à `baby_c9` | `baby_garment_c1` à `baby_garment_c9` |
| **Exemples** | Bonnets, bavoirs, doudous | Body, gilets, chaussons, couvertures |
| **Mise en scène** | Accessoires seuls ou avec jouets | Vêtements posés à plat dans nursery |
| **Tailles** | N/A ou génériques | 0-3m, 3-6m, 6-12m, 12-18m, 18-24m |

---

## 🔧 Personnalisation des prompts

Si vous souhaitez modifier les descriptions des contextes `baby_garment_*` :

**Fichier** : `/backend/services/AIPhotoService.php`
**Lignes** : 98-109

Exemple pour modifier le contexte FREE #1 :
```php
'baby_garment_c1' => 'posé à plat sur un lit bébé blanc avec draps doux en tons pastel et lumière naturelle douce filtrée',
```

Devient :
```php
'baby_garment_c1' => 'votre nouvelle description ici',
```

---

## 📝 À faire après déploiement

1. ✅ Exécuter le script SQL sur o2switch
2. ✅ Vérifier que la table `projects` accepte le type `baby_garment`
3. ✅ Tester la création d'un projet "Vêtements bébé"
4. ✅ Tester l'upload d'une photo et la génération IA
5. ✅ Vérifier que les 9 presets s'affichent correctement selon le plan

---

## 🐛 Troubleshooting

### Erreur "Type non reconnu"
- Vérifier que le script SQL a bien été exécuté
- Vérifier la colonne `type` de la table `projects` :
  ```sql
  DESCRIBE projects;
  ```

### Les presets ne s'affichent pas
- Vider le cache du navigateur (Ctrl+Shift+R)
- Vérifier la console JavaScript pour erreurs
- Vérifier que `detectProjectCategory()` retourne bien `'baby_garment'`

### Les photos générées ne correspondent pas
- Vérifier les logs backend : `/backend/logs/error.log`
- Chercher `[PROMPT] vêtement bébé` dans les logs
- Vérifier que le contexte passé à l'API commence bien par `baby_garment_`

---

## 📚 Documentation associée

- `/CLAUDE.md` : Documentation générale du projet
- `/database/add_baby_garment_category.sql` : Script de migration
- `/backend/services/AIPhotoService.php` : Service de génération d'images IA
- `/frontend/src/pages/Gallery.jsx` : Interface de sélection des presets
- `/frontend/src/pages/ProjectCounter.jsx` : Création/modification de projets

---

**Version** : 0.16.1
**Dernière mise à jour** : 2026-01-07
