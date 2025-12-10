# Amélioration des Prompts IA - Préservation de l'ouvrage

**Date** : 2025-12-07
**Problème** : L'IA modifie parfois l'ouvrage (couleurs, forme, détails) au lieu de juste changer le décor
**Solution** : Prompt optimisé + paramètres Gemini ajustés

---

## 🔍 Problème identifié

### Ancien prompt (AIPhotoService.php:186-189)

```php
$prompt = "Recreate this handmade {$type} in a new professional photo. ";
$prompt .= "Keep the item's appearance (colors, texture, details) similar. ";
$prompt .= "\n\nSETTING: {$contextPrompt}";
```

### ❌ Mots problématiques

1. **"Recreate"** (recréer) → Gemini pense qu'il doit CRÉER un NOUVEL ouvrage
2. **"similar"** (similaire) → Ça veut dire "ressemblant" pas "identique"

**Résultat** : Gemini modifie les couleurs, la forme, les détails de l'ouvrage

---

## ✅ Nouveau prompt optimisé

```php
$prompt = "Generate a new professional photo of THIS EXACT handmade {$type}. ";
$prompt .= "\n\nCRITICAL REQUIREMENTS:";
$prompt .= "\n- Keep the item EXACTLY as shown: same shape, size, colors, stitches, pattern, texture";
$prompt .= "\n- Do NOT modify, recreate or change ANY detail of the item itself";
$prompt .= "\n- Do NOT add or remove elements from the item";
$prompt .= "\n- ONLY change the background, lighting, and setting";
$prompt .= "\n\nNEW SETTING: {$contextPrompt}";
$prompt .= "\n\nThe handmade item must remain identical - only place it in the new setting.";
```

### ✅ Mots clés importants

1. **"THIS EXACT"** → Précise qu'on parle de CET ouvrage précis
2. **"EXACTLY as shown"** → Identique, pas similaire
3. **"Do NOT modify"** → Interdiction explicite de modifier
4. **"ONLY change the background"** → Limite les modifications au décor
5. **"must remain identical"** → Répétition pour insister

---

## ⚙️ Paramètres Gemini optimisés

### Ancien

```php
'temperature' => 1.0,  // Créativité maximale
// Pas de negativePrompt
```

### Nouveau

```php
'temperature' => 0.7,  // Moins de créativité = plus de fidélité
'negativePrompt' => 'different item, modified item, changed colors, different pattern, altered design'
```

### Explication

**Temperature** :
- `1.0` = Créativité maximale → Gemini prend des libertés
- `0.7` = Plus conservateur → Gemini respecte mieux les consignes
- `0.0` = Déterministe (mais trop rigide pour notre cas)

**NegativePrompt** :
- Dit explicitement à Gemini ce qu'on **NE veut PAS**
- "different item" → Pas un ouvrage différent
- "modified item" → Pas d'ouvrage modifié
- "changed colors" → Pas de changement de couleurs
- "different pattern" → Pas de motif différent
- "altered design" → Pas de design altéré

---

## 📊 Impact attendu

### Avant (problèmes observés)
- ❌ Couleurs modifiées (rouge → rose, bleu → violet)
- ❌ Forme légèrement différente (bonnet plus large, écharpe plus courte)
- ❌ Détails simplifiés (points perdus, textures lissées)
- ❌ Ajout/suppression d'éléments (pompons, bordures)

### Après (résultat attendu)
- ✅ Couleurs identiques à l'original
- ✅ Forme et proportions préservées
- ✅ Détails et texture conservés
- ✅ Seul le décor/contexte change

---

## 🧪 Tests à faire

### 1. Test avec un ouvrage simple (bonnet uni)

**Photo originale** : Bonnet rouge uni sur fond blanc
**Contexte testé** : `cozy_indoor`

**Résultat attendu** :
- ✅ Bonnet toujours rouge (même nuance)
- ✅ Même taille et forme
- ✅ Texture identique
- ✅ Maintenant dans un intérieur cosy

---

### 2. Test avec un ouvrage complexe (pull rayé)

**Photo originale** : Pull rayé bleu/blanc
**Contexte testé** : `worn_model`

**Résultat attendu** :
- ✅ Rayures identiques (mêmes couleurs, même largeur)
- ✅ Même patron de rayures
- ✅ Pull maintenant porté par un modèle

---

### 3. Test avec un amigurumi (couleurs multiples)

**Photo originale** : Amigurumi lapin rose avec oreilles blanches
**Contexte testé** : `nature_garden`

**Résultat attendu** :
- ✅ Corps toujours rose (même nuance)
- ✅ Oreilles toujours blanches
- ✅ Yeux brodés identiques
- ✅ Maintenant dans un jardin

---

## 🔧 Si le problème persiste

Si Gemini continue à modifier l'ouvrage malgré ces changements :

### Solution A : Ajouter un "reference strength"

Certains modèles IA ont un paramètre "strength" ou "adherence" pour contrôler à quel point l'image de référence doit être respectée.

**Vérifier dans la doc Gemini** : https://ai.google.dev/gemini-api/docs/image-generation

```php
'imageConfig' => [
    'aspectRatio' => '1:1',
    'referenceStrength' => 0.9,  // Si ce paramètre existe (0.0-1.0)
    'negativePrompt' => '...'
]
```

---

### Solution B : Prompt encore plus explicite avec exemples

Ajouter au prompt :

```php
$prompt .= "\n\nEXAMPLE OF WHAT TO DO:";
$prompt .= "\n- If the item is red, keep it red (same shade)";
$prompt .= "\n- If the item has stripes, keep the exact same stripes";
$prompt .= "\n- If the item has buttons, keep the same buttons in same positions";
$prompt .= "\n\nEXAMPLE OF WHAT NOT TO DO:";
$prompt .= "\n- DO NOT change red to pink or orange";
$prompt .= "\n- DO NOT simplify patterns or remove details";
$prompt .= "\n- DO NOT add decorative elements that weren't there";
```

---

### Solution C : Utiliser un autre modèle IA

Si Gemini ne respecte vraiment pas les consignes, envisager :

1. **DALL-E 3** (OpenAI) avec "img2img" + prompt
   - Meilleur pour préserver les détails
   - API : https://platform.openai.com/docs/guides/images

2. **Stable Diffusion** avec ControlNet
   - Contrôle précis de la structure
   - Peut "verrouiller" certaines zones

3. **Midjourney** avec `--iw` (image weight)
   - Paramètre pour contrôler l'adhérence à l'image source
   - `--iw 2` = forte adhérence

---

### Solution D : Approche hybride (dernière option)

Si aucune solution IA ne fonctionne bien :

1. **Détourer l'ouvrage** de la photo originale (avec Remove.bg API ou local)
2. **Générer JUSTE le background** avec Gemini (sans l'ouvrage)
3. **Composer l'image finale** : ouvrage original + nouveau background

**Avantage** : Ouvrage 100% identique garanti
**Inconvénient** : Plus complexe techniquement (besoin de composition)

---

## 📝 Notes importantes

### Temperature : Ne pas descendre trop bas

- ❌ `temperature: 0.0` → Images trop rigides, pas naturelles
- ✅ `temperature: 0.7` → Bon équilibre fidélité/naturel
- ❌ `temperature: 1.0` → Trop créatif, modifications indésirables

### Tester sur plusieurs types d'ouvrages

- Ouvrages unis (1 couleur)
- Ouvrages rayés/motifs géométriques
- Ouvrages multicolores complexes
- Amigurumi avec détails brodés
- Accessoires avec fermetures/boutons

### Feedback utilisateur

Après déploiement, demander aux utilisateurs :
- "L'ouvrage est-il fidèle à votre photo originale ?"
- Si non : "Qu'est-ce qui a changé ?"

Ça permettra d'affiner encore le prompt si nécessaire.

---

## 🚀 Déploiement

```bash
# Backend (PHP)
# Les changements sont dans backend/services/AIPhotoService.php
# Pas de build nécessaire, juste déployer le fichier PHP sur le serveur

# Si O2Switch :
scp backend/services/AIPhotoService.php user@yarnflow.fr:/home/yarnflow/public_html/api/services/

# Tester immédiatement après déploiement
# Générer une photo avec un ouvrage simple (bonnet uni rouge par exemple)
# Vérifier que le bonnet reste rouge dans le nouveau contexte
```

---

## ✅ Checklist de vérification post-déploiement

- [ ] Générer une photo avec ouvrage uni → Couleur identique ?
- [ ] Générer une photo avec ouvrage rayé → Rayures identiques ?
- [ ] Générer une photo avec amigurumi → Détails préservés ?
- [ ] Tester plusieurs contextes (lifestyle, studio, nature) → Cohérent ?
- [ ] Vérifier les logs `[GEMINI API] Prompt:` → Nouveau prompt utilisé ?

---

**Date de création** : 2025-12-07
**Auteur** : Claude (AI Assistant)
**Fichiers modifiés** : `backend/services/AIPhotoService.php`
