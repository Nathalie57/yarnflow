# Système Preview IA Gratuite - v0.13.0

## 🎯 Objectif

Permettre aux utilisateurs de **tester 1 style IA gratuitement par photo** avant de consommer leurs crédits, tout en maintenant une viabilité économique.

---

## ✨ Principe

### Pour l'utilisateur

```
Photo 1:
├─ Preview style 1 → ✅ GRATUIT (0 crédit)
├─ Preview style 2 → 💳 1 CRÉDIT
└─ Preview style 3 → 💳 1 CRÉDIT
   (Max 3 styles par photo)

Photo 2:
├─ Preview style 1 → ✅ GRATUIT
└─ ...
```

### Avantages utilisateur

- ✅ **Teste GRATUITEMENT** 1 style IA par photo
- ✅ Voit le **vrai résultat IA** avant de payer
- ✅ Peut changer de style (2 fois payant max)

---

## 💰 Coûts & Viabilité

### Plan FREE (5 crédits/mois)

**Scénario MAX** :
- 5 photos × 1 preview gratuite = 5 générations
- 5 crédits utilisés = 5 générations payantes
- **Total : 10 générations max**

**Coût Gemini pour toi** :
- 10 générations × $0.039 = **$0.39/mois**
- Sur 1000 utilisateurs FREE = **$390/mois**

**Revenus** : 0€ (gratuit)

### Plan PRO (30 crédits/mois à 4.99€)

**Scénario MAX** :
- 30 photos × 1 preview gratuite = 30 générations
- 30 crédits utilisés = 30 générations payantes
- **Total : 60 générations max**

**Coût Gemini** :
- 60 générations × $0.039 = **$2.34**

**Revenus** : $4.99

**Marge brute** : $4.99 - $2.34 = **$2.65** (53% de marge)

### Plan PRO Annuel (39.99€/an)

**Coût Gemini annuel** :
- 12 mois × $2.34 = **$28.08**

**Revenus** : $39.99

**Marge brute** : $39.99 - $28.08 = **$11.91/an** (30% de marge)

---

## 📊 Scénarios réels (plus optimistes)

En réalité, les utilisateurs ne consommeront pas 100% :

### Scénario réaliste (50% d'utilisation)

**Plan PRO** :
- 15 photos avec preview gratuite = 15 générations
- 15 crédits utilisés = 15 générations
- **Total : 30 générations**
- **Coût : $1.17**
- **Marge : $4.99 - $1.17 = $3.82** (76% de marge) ✅

### Scénario conservateur (30% d'utilisation)

**Plan PRO** :
- 9 photos avec preview gratuite = 9 générations
- 9 crédits utilisés = 9 générations
- **Total : 18 générations**
- **Coût : $0.70**
- **Marge : $4.99 - $0.70 = $4.29** (86% de marge) ✅✅

---

## 🔧 Implémentation technique

### Logique dans PhotoController.php

```php
// Vérifier si c'est la première preview
$currentRegenerations = (int)($photo['regeneration_count'] ?? 0);
$isFirstPreview = ($currentRegenerations === 0);

// Première preview = GRATUIT, suivantes = 1 crédit
$creditsToConsume = $isFirstPreview ? 0 : 1;

// Consommer crédit seulement si > 0
if ($creditsToConsume > 0) {
    $creditResult = $this->creditManager->deductCredit($userId, $creditsToConsume);
}
```

### Réponse API

**Première preview (gratuite)** :
```json
{
  "success": true,
  "preview_image": "base64...",
  "final_temp_path": "final_123_lifestyle.jpg",
  "regeneration_count": 1,
  "regenerations_remaining": 2,
  "credits_used": 0,
  "is_free_preview": true
}
```

**Deuxième preview (payante)** :
```json
{
  "success": true,
  "preview_image": "base64...",
  "regeneration_count": 2,
  "regenerations_remaining": 1,
  "credits_used": 1,
  "is_free_preview": false,
  "credit_type": "monthly",
  "credits_remaining": 29
}
```

---

## 🎨 UX Recommandée

### Message avant première preview

```
🎁 Première preview GRATUITE !
Testez un style sans consommer de crédit.
```

### Message avant deuxième preview

```
⚠️ Cette preview consommera 1 crédit
Crédits restants : 29
Continuer ?
```

### Message limite atteinte

```
❌ Limite de 3 styles atteinte
Créez une nouvelle photo pour tester d'autres styles.
```

---

## 📈 Comparaison systèmes

| Système | Preview | Validation | Total/style | Coût toi |
|---------|---------|------------|-------------|----------|
| **v0.12.0** | 1 appel | 1 appel | 2 crédits | $0.078 |
| **v0.13.0 (Option 1)** | 1 appel | gratuit | 1 crédit | $0.039 |
| **v0.13.0 (FINAL)** | 1ère gratuite | gratuit | 0-1 crédit | $0.039 |

**Économie v0.13.0 vs v0.12.0** : **50%** 🚀

---

## ⚠️ Limites anti-abus

### Par photo
- Max 3 styles testés
- 1ère preview gratuite
- 2 previews suivantes payantes (1 crédit chacune)

### Globales (déjà existantes)
- Rate limit : 3 générations par 30 secondes
- Crédits mensuels FREE : 5
- Crédits mensuels PRO : 30

---

## 🚀 Migration

### 1. Base de données

✅ Déjà créée : colonne `regeneration_count` dans `user_photos`

### 2. Backend

✅ Modifié :
- `backend/services/AIPhotoService.php` → Nouvelle méthode `generateImageWithPreview()`
- `backend/controllers/PhotoController.php` → Logique première preview gratuite

### 3. Frontend

📝 À mettre à jour (recommandé) :
- Afficher badge "🎁 GRATUIT" sur première preview
- Confirmation avant preview payante
- Afficher crédits restants

---

## 💡 Optimisations futures possibles

### Si coûts trop élevés

1. **Réduire à 2 styles max par photo** (au lieu de 3)
   - 1 gratuit + 1 payant max
   - Économie : 33% de réduction

2. **Preview gratuite uniquement pour utilisateurs PRO**
   - FREE : toutes les previews payantes
   - PRO : 1ère preview gratuite
   - Incite à l'upgrade

3. **Crédits bonus pour partage**
   - +1 crédit si l'utilisateur partage sur réseaux sociaux
   - Acquisition virale

---

## 📅 Déploiement

**Version** : 0.13.0
**Date** : 2025-12-11
**Impact** :
- ✅ Division par 2 des coûts API (vs v0.12.0)
- ✅ Meilleure UX (test gratuit)
- ✅ Viabilité économique maintenue (marge 53-86%)

---

**Auteur** : Nathalie + AI Assistants (Claude Sonnet 4.5)
