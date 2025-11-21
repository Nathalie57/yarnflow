# 🚀 Migration des catégories vers la base de données

## ✅ Changements effectués

Le générateur de patrons charge maintenant les catégories depuis la base de données au lieu d'utiliser un objet JavaScript hardcodé.

## 📋 Étapes pour finaliser la migration

### 1. Importer la table des catégories

Ouvrez un terminal et exécutez :

```bash
mysql -u root -p patron_maker < database/add_categories_table.sql
```

**Ou via phpMyAdmin** :
1. Ouvrez phpMyAdmin
2. Sélectionnez la base de données `patron_maker`
3. Cliquez sur "Importer"
4. Choisissez le fichier `database/add_categories_table.sql`
5. Cliquez sur "Exécuter"

### 2. Vérifier que les données ont été importées

Dans phpMyAdmin ou en ligne de commande :

```sql
SELECT COUNT(*) FROM pattern_categories;
-- Devrait retourner 42 lignes (5 catégories + 31 sous-catégories + 6 lignes principales avec sizes)
```

```sql
SELECT category_key, category_label, COUNT(*) as subtypes_count
FROM pattern_categories
WHERE subtype_key IS NOT NULL
GROUP BY category_key, category_label;
-- Affiche le nombre de sous-catégories par catégorie
```

### 3. Tester l'interface utilisateur

1. **Frontend** : Ouvrez `http://patron-maker.local/generator`
   - Vous devriez voir les 5 catégories s'afficher
   - Cliquez sur une catégorie pour voir ses sous-catégories
   - Tout doit fonctionner comme avant, mais maintenant les données viennent de la BDD

2. **Interface admin** : Ouvrez `http://patron-maker.local/admin/categories`
   - Vous devriez voir toutes les catégories avec leurs sous-catégories
   - Testez la création d'une nouvelle sous-catégorie
   - Testez la modification d'un label

## 🎯 Avantages de cette migration

### Avant (objet JavaScript hardcodé)
```javascript
const categories = {
  hat: {
    label: 'Bonnets',
    icon: '🧢',
    subtypes: { ... }
  }
}
```

**Inconvénients** :
- ❌ Il faut modifier le code pour ajouter une catégorie
- ❌ Nécessite un redéploiement
- ❌ Pas de gestion centralisée
- ❌ Difficile de désactiver temporairement une catégorie

### Après (base de données)
```javascript
const response = await categoriesAPI.getAll()
setCategories(response.data.data)
```

**Avantages** :
- ✅ Ajout de catégories via l'interface admin
- ✅ Pas besoin de redéployer
- ✅ Données centralisées
- ✅ Possibilité de désactiver/activer des catégories
- ✅ Historique des modifications
- ✅ Plus facile d'ajouter de nouvelles fonctionnalités (traductions, etc.)

## 🔧 Prochaines étapes possibles

### 1. Ajouter plus de catégories

Via l'interface admin ou en SQL :

```sql
-- Exemple : Ajouter une catégorie "Accessoires"
INSERT INTO pattern_categories (category_key, category_label, category_icon, subtype_key, available_sizes, display_order, is_active)
VALUES ('accessories', 'Accessoires', '🎀', NULL, '["baby", "child", "adult"]', 6, 1);

-- Ajouter des sous-catégories
INSERT INTO pattern_categories (category_key, category_label, category_icon, subtype_key, subtype_label, subtype_description, display_order, is_active)
VALUES
('accessories', 'Accessoires', '🎀', 'hairband', 'Bandeau', 'Bandeau pour cheveux', 1, 1),
('accessories', 'Accessoires', '🎀', 'bracelet', 'Bracelet', 'Bracelet au crochet', 2, 1);
```

### 2. Internationalisation (i18n)

Si vous voulez supporter plusieurs langues, vous pourrez ajouter des colonnes :
- `category_label_en`
- `category_label_fr`
- `subtype_description_en`
- `subtype_description_fr`

### 3. Images de catégories

Ajouter une colonne `category_image_url` pour afficher des images au lieu d'emojis.

### 4. Popularité des catégories

Ajouter un compteur d'utilisation :

```sql
ALTER TABLE pattern_categories ADD COLUMN usage_count INT DEFAULT 0;
```

Puis incrémenter à chaque génération pour afficher les catégories les plus populaires en premier.

## 🐛 Dépannage

### Problème : "Impossible de charger les catégories"

**Causes possibles** :
1. La table n'a pas été importée → Relancez le script SQL
2. Aucune catégorie active dans la BDD → Vérifiez avec `SELECT * FROM pattern_categories WHERE is_active = 1`
3. Problème de connexion API → Vérifiez les logs du navigateur (F12 → Console)

### Problème : Page blanche sur /generator

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs
3. Vérifiez que l'API `/api/categories` retourne des données :
   ```bash
   curl http://patron-maker.local/api/categories
   ```

### Problème : Les sous-catégories ne s'affichent pas

**Vérification** :
```sql
SELECT * FROM pattern_categories
WHERE category_key = 'hat' AND subtype_key IS NOT NULL;
```

Si vide, réimportez le fichier SQL.

## 📊 Structure de la table

```
pattern_categories
├── id (PK)
├── category_key (hat, scarf, etc.)
├── category_label (Bonnets, Écharpes, etc.)
├── category_icon (🧢, 🧣, etc.)
├── subtype_key (beanie, slouchy, etc.) [NULL pour catégorie principale]
├── subtype_label (Beanie, Slouchy, etc.)
├── subtype_description (description)
├── available_sizes (JSON: ["baby", "child", "adult"])
├── display_order (ordre d'affichage)
├── is_active (1 = actif, 0 = désactivé)
├── created_at
└── updated_at
```

## ✅ Checklist de migration

- [ ] Table `pattern_categories` créée
- [ ] Données importées (42 lignes)
- [ ] Interface `/generator` fonctionne
- [ ] Interface `/admin/categories` fonctionne
- [ ] Test : Créer une nouvelle sous-catégorie
- [ ] Test : Modifier une catégorie
- [ ] Test : Générer un patron avec une nouvelle sous-catégorie

---

**Félicitations !** 🎉 Vous avez réussi la migration vers un système de catégories dynamique !
