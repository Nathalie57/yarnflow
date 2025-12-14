# Optimisation Coûts Gemini v0.13.0

## 🎯 Objectif

**Diviser par 2 les coûts API Gemini** en passant de 2 appels à 1 seul appel par génération d'image.

---

## 📊 Ancien système (v0.12.0) - COÛTEUX

```
1. Preview → Appel Gemini (1,290 tokens) = $0.039
2. Image finale → Appel Gemini (1,290 tokens) = $0.039
TOTAL = 2,580 tokens = $0.078 par photo
```

**Problème** : L'utilisateur payait 2 générations pour voir 1 résultat.

---

## ✨ Nouveau système (v0.13.0) - OPTIMISÉ

```
1. Upload photo → Appel Gemini pour image finale 1024px (1,290 tokens) = $0.039
2. Redimensionnement local → Preview 256px (GRATUIT - PHP GD)
3. Utilisateur valide → Utilise l'image finale déjà générée
TOTAL = 1,290 tokens = $0.039 par photo (50% d'économie!)
```

**Avantage** : 1 seul appel Gemini, preview locale gratuite.

---

## 🔧 Modifications apportées

### 1. Migration Base de Données

**Fichier** : `database/add_regeneration_tracking.sql`

Ajoute une colonne `regeneration_count` pour tracker les abus :

```sql
ALTER TABLE user_photos
ADD COLUMN regeneration_count INT DEFAULT 0
COMMENT 'Nombre de fois que cette photo a été régénérée'
AFTER ai_generated_at;
```

**Limite anti-abus** : Max 5 régénérations par photo.

### 2. Service AIPhotoService.php

**Nouvelle méthode** : `generateImageWithPreview()`

```php
public function generateImageWithPreview(string $imagePath, array $options): array
{
    // 1. Générer image finale via Gemini (1024px) - 1 appel
    $result = $this->enhanceImage($imagePath, $options);

    // 2. Créer preview par redimensionnement local (256px) - GRATUIT
    $image = imagecreatefromstring(base64_decode($result['image_base64']));
    $thumbnail = imagecreatetruecolor(256, 256);
    imagecopyresampled(...); // Redimensionnement
    $this->addWatermark($thumbnail); // Filigrane "PREVIEW"

    return [
        'final_image_base64' => $result['image_base64'], // 1024px
        'preview_image_base64' => base64_encode($previewData) // 256px
    ];
}
```

**Ancienne méthode** : `generatePreview()` → Marquée `@deprecated`

### 3. Controller PhotoController.php

**Endpoint modifié** : `POST /api/photos/{id}/preview`

**Nouveautés** :
- Génère image finale + preview en 1 appel
- Sauvegarde l'image finale en temp : `/tmp/final_{photoId}_{context}.jpg`
- Retourne la preview + chemin temp de l'image finale
- Incrémente `regeneration_count`
- Limite : 5 régénérations par photo

**Réponse API** :
```json
{
  "success": true,
  "preview_image": "base64...", // Preview 256px
  "final_temp_path": "final_123_lifestyle.jpg", // Fichier temp pour validation
  "prompt_used": "...",
  "regeneration_count": 1,
  "regenerations_remaining": 4
}
```

---

## 🚀 Déploiement

### Étape 1 : Migration SQL

Via phpMyAdmin ou ligne de commande :

```bash
mysql -u root -p patron_maker < database/add_regeneration_tracking.sql
```

Ou manuellement :

```sql
ALTER TABLE user_photos
ADD COLUMN regeneration_count INT DEFAULT 0
COMMENT 'Nombre de fois que cette photo a été régénérée'
AFTER ai_generated_at;
```

### Étape 2 : Déployer les fichiers

**Backend** :
- `backend/services/AIPhotoService.php` ✅
- `backend/controllers/PhotoController.php` ✅

**Frontend** : Aucune modification nécessaire ! L'API retourne les mêmes données.

### Étape 3 : Test

1. Upload une photo
2. Cliquer sur "Prévisualiser" un style
3. **Vérifier** :
   - 1 seul appel Gemini dans les logs
   - Preview s'affiche avec watermark
   - Message "Régénérations restantes : 4/5"

---

## 📈 Impact attendu

### Économies

| Scénario | Ancien coût | Nouveau coût | Économie |
|----------|-------------|--------------|----------|
| 1 photo, 1 génération | $0.078 | $0.039 | **50%** |
| 1 photo, 3 régénérations | $0.234 | $0.117 | **50%** |
| 100 photos/mois | $7.80 | $3.90 | **$3.90/mois** |
| 1000 photos/mois | $78.00 | $39.00 | **$39/mois** |

### Limites anti-abus

- **Rate limiting** : Max 3 générations par 30 secondes (inchangé)
- **NOUVEAU** : Max 5 régénérations par photo
- Si limite atteinte → Message : *"Créez une nouvelle photo pour continuer"*

---

## 🎨 Workflow utilisateur

### Avant (v0.12.0)

```
1. Upload photo
2. Clic "Preview" → Appel Gemini preview → Affiche preview 256px
3. Clic "Valider" → Appel Gemini finale → Affiche finale 1024px
= 2 appels Gemini
```

### Après (v0.13.0)

```
1. Upload photo
2. Clic "Preview" → Appel Gemini finale 1024px → Redimensionnement local → Affiche preview 256px
3. Clic "Valider" → Récupère image finale déjà générée (fichier temp)
= 1 seul appel Gemini!
```

---

## 🔍 Détails techniques

### Stockage temporaire

Les images finales sont stockées temporairement dans `/tmp/` :
- Nom : `final_{photoId}_{context}.jpg`
- Nettoyage automatique par le système (dossier /tmp)
- Supprimées après validation par l'utilisateur

### Watermark "PREVIEW"

La preview 256px contient un watermark pour :
- Indiquer qu'il s'agit d'une preview basse résolution
- Encourager la validation pour obtenir la qualité finale

### Compteur de régénérations

Stocké dans `user_photos.regeneration_count` :
- Incrémenté à chaque clic "Preview"
- Limite : 5 régénérations
- Message d'erreur si dépassée

---

## ⚠️ Notes importantes

1. **Pas de changement frontend** : L'API est rétrocompatible
2. **Les crédits sont toujours consommés** : 1 crédit par génération
3. **La preview montre le VRAI résultat IA** (redimensionnement de l'image finale)
4. **Si l'utilisateur rejette** → Nouvelle génération = nouveau crédit consommé

---

## 📅 Date de déploiement

**Version** : 0.13.0
**Date** : 2025-12-11
**Impact** : Économie de 50% sur les coûts Gemini 🚀

---

**Auteur** : Nathalie + AI Assistants (Claude Sonnet 4.5)
