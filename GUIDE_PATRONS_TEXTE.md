# Guide - Patrons Texte (Copier-Coller)

## ✨ Nouvelle fonctionnalité

Vous pouvez maintenant ajouter des patrons en copiant-collant directement le texte !

**3 options pour ajouter un patron** :
1. **📎 Fichier** - PDF, JPG, PNG
2. **🔗 Lien** - URL YouTube, blog, Ravelry...
3. **📝 Texte** - **NOUVEAU** - Copier-coller directement

---

## 🚀 Installation

### 1. Exécuter la migration SQL

```bash
mysql -u root -p patron_maker < database/add_pattern_text_support.sql
```

Ou dans phpMyAdmin, exécutez :
```sql
ALTER TABLE pattern_library
MODIFY COLUMN source_type ENUM('file', 'url', 'text') NOT NULL;

ALTER TABLE pattern_library
ADD COLUMN pattern_text LONGTEXT DEFAULT NULL
AFTER url;
```

### 2. Déployer les fichiers modifiés

**Frontend** :
- `frontend/src/pages/PatternLibrary.jsx`

**Backend** :
- `backend/controllers/PatternLibraryController.php`
- `backend/models/PatternLibrary.php`

---

## 💻 Utilisation

### Ajouter un patron texte

1. Aller dans **Bibliothèque de patrons**
2. Cliquer sur **➕ Ajouter un patron**
3. Choisir l'option **📝 Texte**
4. Coller votre patron dans la grande zone de texte
5. Remplir le nom et les métadonnées
6. Valider

**Exemple de texte collé** :
```
Pull irlandais - Taille M

Rang 1 : 6 mailles serrées dans un cercle magique
Rang 2 : 2ms dans chaque maille (12)
Rang 3 : *1ms, aug* x6 (18)
Rang 4 : *2ms, aug* x6 (24)
...
```

### Visualiser un patron texte

1. Dans la bibliothèque, cliquez sur **📝 Lire**
2. Le texte s'affiche dans une modale lisible
3. Vous pouvez scroller pour lire tout le patron

---

## 🎨 Apparence

**Carte de patron texte** :
- Fond bleu clair dégradé
- Icône 📝
- Aperçu des premières lignes de texte

**Stats** :
- Nouvelle stat "Textes" en bleu

---

## 📊 Détails techniques

### Base de données

**Nouvelle colonne** : `pattern_text LONGTEXT`
- Stocke le texte complet du patron
- NULL pour les patrons fichier/URL
- Peut contenir jusqu'à 4 Go de texte

**ENUM modifié** : `source_type`
- Anciennes valeurs : `'file', 'url'`
- **Nouvelle valeur** : `'text'`

### API

**POST /api/pattern-library** avec JSON :
```json
{
  "source_type": "text",
  "name": "Pull irlandais",
  "pattern_text": "Rang 1 : 6ms dans un cercle magique\nRang 2 : 2ms dans chaque maille...",
  "description": "Pull irlandais facile",
  "category": "Vêtements",
  "technique": "crochet",
  "difficulty": "moyen"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Patron texte ajouté avec succès",
  "pattern": {
    "id": 42,
    "user_id": 1,
    "name": "Pull irlandais",
    "source_type": "text",
    "pattern_text": "Rang 1 : ...",
    ...
  }
}
```

### Stats

**GET /api/pattern-library** renvoie maintenant :
```json
{
  "stats": {
    "total_patterns": 25,
    "file_patterns": 10,
    "url_patterns": 8,
    "text_patterns": 7,    ← NOUVEAU
    "favorite_patterns": 12
  }
}
```

---

## ✅ Tests

### Test manuel

1. **Créer un patron texte** :
   - Aller dans Bibliothèque
   - Cliquer "Ajouter"
   - Choisir "Texte"
   - Coller un texte de test
   - Remplir nom + catégorie
   - Valider

2. **Vérifier l'affichage** :
   - La carte affiche bien l'icône 📝 et fond bleu
   - La stat "Textes" augmente de 1

3. **Lire le patron** :
   - Cliquer sur "📝 Lire"
   - Le texte s'affiche en entier dans la modale

4. **Vérifier en BDD** :
   ```sql
   SELECT id, name, source_type, LENGTH(pattern_text) as text_length
   FROM pattern_library
   WHERE source_type = 'text';
   ```

### Test avec cas limites

- ✅ Texte très court (1 ligne)
- ✅ Texte très long (10 000+ lignes)
- ✅ Texte avec caractères spéciaux (émojis, accents)
- ✅ Texte avec retours à la ligne multiples

---

## 🎯 Avantages pour l'utilisateur

1. **Plus rapide** : Pas besoin de créer un PDF
2. **Plus simple** : Copier-coller depuis n'importe où
3. **Modifiable** : Facile de corriger une erreur
4. **Recherchable** : Le texte est indexé (recherche possible)
5. **Léger** : Pas de fichier à uploader

---

## 🔮 Améliorations futures possibles

- [ ] Support Markdown (gras, italique, listes)
- [ ] Éditeur WYSIWYG (TinyMCE, Quill)
- [ ] Export en PDF du texte
- [ ] Recherche dans le contenu des patrons texte (FULLTEXT)
- [ ] Coloration syntaxique pour rangs/mailles

---

**Date** : 2025-12-11
**Version** : 0.13.0
