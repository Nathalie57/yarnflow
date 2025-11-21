# 📄 Import Patron Multi-Format - v0.11.0

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs d'importer leur patron de 3 façons différentes :

1. **📎 Fichier PDF** - Patron PDF téléchargé
2. **🖼️ Image** - Photo du patron (JPG, PNG, WEBP)
3. **🔗 Lien web** - URL vers patron (YouTube, Pinterest, blog, etc.)

## Installation

### 1. Migration SQL

Exécutez le fichier SQL pour ajouter les colonnes nécessaires :

```bash
mysql -u root -p patron_maker < add_pattern_import_columns.sql
```

Ou via phpMyAdmin :
- Ouvrez `add_pattern_import_columns.sql`
- Copiez-collez le contenu dans l'onglet SQL
- Exécutez

### 2. Vérification des dossiers

Le dossier d'upload doit exister avec les bonnes permissions :

```bash
mkdir -p backend/uploads/patterns
chmod 755 backend/uploads/patterns
```

## Endpoints API

### POST /api/projects/{id}/pattern

Upload d'un fichier patron (PDF ou image).

**Content-Type**: `multipart/form-data`

**Body**:
- `pattern` (file) - Fichier PDF ou image
- `pattern_type` (string) - "pdf" ou "image"

**Validation**:
- Types autorisés : `application/pdf`, `image/jpeg`, `image/png`, `image/webp`
- Taille max : 10 MB

**Réponse 200**:
```json
{
  "success": true,
  "message": "Patron importé avec succès",
  "pattern_path": "/uploads/patterns/pattern_123_1699999999.pdf",
  "project": { ... }
}
```

### POST /api/projects/{id}/pattern-url

Enregistrer un lien vers un patron web.

**Content-Type**: `application/json`

**Body**:
```json
{
  "pattern_url": "https://youtube.com/watch?v=..."
}
```

**Validation**:
- URL valide (format URL standard)

**Réponse 200**:
```json
{
  "success": true,
  "message": "Lien du patron enregistré avec succès",
  "pattern_url": "https://youtube.com/watch?v=...",
  "project": { ... }
}
```

## Structure BDD

### Table `projects`

Nouvelles colonnes :

```sql
pattern_path VARCHAR(500) NULL     -- Chemin fichier local (/uploads/patterns/...)
pattern_url VARCHAR(1000) NULL     -- URL externe (YouTube, Pinterest, etc.)
```

**Règle métier** : Un projet peut avoir soit `pattern_path`, soit `pattern_url`, mais pas les deux en même temps.

## Frontend (React)

### Composant : ProjectCounter.jsx

**États ajoutés** :
- `showPatternUrlModal` - Afficher modal URL
- `patternUrl` - URL saisie
- `uploadingPattern` - Loading upload

**Fonctions** :
- `handlePatternUpload(e)` - Upload fichier
- `handlePatternUrlSubmit()` - Enregistrer URL

**UI** :
- 2 options d'import : fichier ou URL
- Affichage conditionnel selon type (PDF, image, URL)
- Modal pour saisir l'URL

## Cas d'usage

### 1. Patron trouvé sur YouTube

```
1. Utilisateur clique sur "🔗 Lien vers une page web"
2. Colle l'URL YouTube : https://youtube.com/watch?v=abc123
3. Clique "Enregistrer"
4. Le lien est affiché avec bouton "🔗 Ouvrir le lien"
```

### 2. Patron PDF téléchargé

```
1. Utilisateur clique sur "📎 Importer un fichier"
2. Sélectionne son PDF
3. Upload automatique
4. Le PDF est affiché avec bouton "📄 Ouvrir le PDF"
```

### 3. Photo du patron papier

```
1. Utilisateur prend en photo son patron papier
2. Clique sur "📎 Importer un fichier"
3. Sélectionne la photo JPG
4. Upload automatique
5. L'image est affichée avec bouton "🖼️ Voir l'image"
```

## Sécurité

### Upload fichier
- ✅ Validation type MIME
- ✅ Validation taille (max 10MB)
- ✅ Nom de fichier sécurisé (`pattern_{id}_{timestamp}.{ext}`)
- ✅ Dossier uploads hors webroot (accès via backend)

### URL
- ✅ Validation format URL PHP (`filter_var`)
- ✅ Stockage simple de l'URL (pas de fetch/crawl)
- ✅ Ouverture dans nouvel onglet (`target="_blank"`)

## Tests recommandés

### Upload PDF
- [ ] Upload PDF valide < 10MB
- [ ] Rejection PDF > 10MB
- [ ] Rejection fichier non-PDF (.txt, .exe)
- [ ] Affichage correct du lien "Ouvrir le PDF"

### Upload Image
- [ ] Upload JPG valide
- [ ] Upload PNG valide
- [ ] Upload WEBP valide
- [ ] Rejection image > 10MB
- [ ] Affichage correct du lien "Voir l'image"

### URL
- [ ] Enregistrement URL YouTube
- [ ] Enregistrement URL Pinterest
- [ ] Enregistrement URL blog personnel
- [ ] Rejection URL invalide
- [ ] Affichage correct du lien "Ouvrir le lien"

### Remplacement
- [ ] Remplacer PDF par image
- [ ] Remplacer image par URL
- [ ] Remplacer URL par PDF

## Améliorations futures

### v0.12.0 (optionnel)
- [ ] Prévisualisation PDF dans l'interface
- [ ] Prévisualisation image avant upload
- [ ] Détection automatique du type de lien (YouTube, Pinterest, etc.)
- [ ] Icône spécifique selon la plateforme (YouTube, Pinterest, etc.)

### v0.13.0 (optionnel)
- [ ] OCR pour extraire texte des images de patron
- [ ] Génération de grilles à partir de l'image
- [ ] Synchronisation avec Google Drive / Dropbox

---

**Créé par** : [AI:Claude]
**Date** : 2025-11-16
**Version** : v0.11.0 - AI Photo Studio
