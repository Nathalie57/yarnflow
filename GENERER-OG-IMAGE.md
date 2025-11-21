# 🖼️ Générer l'image Open Graph - YarnFlow

**L'image Open Graph est CRITIQUE pour le SEO social** (Twitter, Facebook, LinkedIn).

Sans elle, tes posts n'auront **aucune preview image** ! 😱

---

## 📐 Spécifications

**Dimensions** :
- **1200 x 630 pixels** (ratio 1.91:1)
- Format : JPG ou PNG
- Poids : <300KB (idéal <200KB)
- Nom : `og-image.jpg`

**Contenu recommandé** :
- Logo YarnFlow 🧶
- Titre : "YarnFlow - Tracker tricot & crochet"
- Tagline : "Stats avancées • AI Photo Studio • Offre Early Bird 2.99€"
- Visuel tricot/crochet (photo ou illustration)
- Couleurs : Purple/Pink (ta charte graphique)

---

## 🎨 Option 1 : Canva (Gratuit et Rapide) ⭐

### 1.1 Créer le design
1. Aller sur https://canva.com
2. **Créer un design** → Dimensions personnalisées : **1200 x 630 px**
3. Template de base :

```
┌────────────────────────────────────────────┐
│  🧶                                        │
│  YarnFlow                                   │
│                                             │
│  Tracker Tricot & Crochet                   │
│  avec IA                                    │
│                                             │
│  📊 Stats avancées                          │
│  📸 AI Photo Studio                         │
│  📚 Bibliothèque patrons                    │
│                                             │
│  💰 EARLY BIRD : 2.99€/mois                │
│                                             │
│  [Image tricot/crochet en background]      │
└────────────────────────────────────────────┘
```

### 1.2 Éléments à ajouter
- **Background** : Dégradé purple → pink (comme ta landing)
- **Emoji** : 🧶 (en grand, haut gauche)
- **Titre** : "YarnFlow" en gras, grande taille
- **Sous-titre** : "Tracker Tricot & Crochet avec IA"
- **Bullet points** : 3-4 features clés
- **CTA** : "Early Bird 2.99€/mois" en highlight
- **Image** : Photo tricot/crochet en background (opacité 20-30%)

### 1.3 Export
- **Télécharger** → JPG (qualité 100%)
- Renommer : `og-image.jpg`
- Vérifier poids : <300KB ✅

---

## 🎨 Option 2 : Figma (Gratuit, plus pro)

### 2.1 Template
1. Aller sur https://figma.com
2. Créer Frame : **1200 x 630 px**
3. Utiliser ce template Figma communautaire :
   https://www.figma.com/community/file/1070831645519275317

### 2.2 Export
- Export → JPG 2x (meilleure qualité)
- Compresser sur https://tinyjpg.com si >300KB

---

## 🎨 Option 3 : Photoshop/GIMP (Si tu as)

**Dimensions** : 1200 x 630 px, 72 DPI
**Export** : JPG qualité 80-90%

---

## 🎨 Option 4 : Generateur AI (Rapide)

### Via Canva AI
1. Canva → **Magic Design**
2. Prompt : "Landing page header for knitting tracker app called YarnFlow, purple and pink gradient, modern, minimalist, include yarn emoji, text: YarnFlow Tracker Tricot & Crochet, 1200x630 pixels"

### Via DALL-E / Midjourney
```
Prompt: "Social media header image for a knitting and crochet tracking app called YarnFlow. Modern gradient background purple to pink. Include text 'YarnFlow - Tracker Tricot & Crochet'. Show yarn, needles, and crochet hooks. Minimalist style. 1200x630 pixels. --ar 1.91:1"
```

---

## 📤 Uploader l'image

### Sur Vercel
1. Placer `og-image.jpg` dans `/frontend/public/`
2. Structure :
   ```
   frontend/
   └── public/
       ├── og-image.jpg  ← ICI
       ├── robots.txt
       └── sitemap.xml
   ```

3. Push sur GitHub :
   ```bash
   git add frontend/public/og-image.jpg
   git commit -m "Add Open Graph image"
   git push
   ```

4. Vercel redéploie auto → Image accessible sur `https://yarnflow.com/og-image.jpg`

---

## ✅ Vérifier que ça marche

### 1. Test Facebook Debugger
https://developers.facebook.com/tools/debug/

- Entrer : `https://yarnflow.com`
- Cliquer **Debug**
- Tu dois voir ton image s'afficher ✅

### 2. Test Twitter Card Validator
https://cards-dev.twitter.com/validator

- Entrer : `https://yarnflow.com`
- Preview doit afficher ton image ✅

### 3. Test LinkedIn Post Inspector
https://www.linkedin.com/post-inspector/

- Entrer : `https://yarnflow.com`
- Preview avec image ✅

---

## 🎯 Exemple d'image OG bien faite

**Inspiration** :
- Notion : https://notion.so/og-image.jpg
- Linear : https://linear.app/og-image.jpg
- Vercel : https://vercel.com/og-image.jpg

**Éléments clés** :
- Logo reconnaissable
- Titre lisible (même en petit)
- Pas trop de texte (max 10-15 mots)
- Contraste élevé
- Couleurs de marque

---

## 📝 Checklist

Avant de déployer :
- [ ] Image créée (1200x630 px)
- [ ] Poids <300KB
- [ ] Nommée `og-image.jpg`
- [ ] Placée dans `frontend/public/`
- [ ] Contient logo + titre + tagline
- [ ] Couleurs purple/pink respectées
- [ ] Pushed sur GitHub
- [ ] Testée sur Facebook Debugger
- [ ] Testée sur Twitter Card Validator

---

## ⚡ Version Rapide (5 min)

**Si tu veux juste lancer maintenant** :

1. Canva → Template "Facebook Post" (resize 1200x630)
2. Background dégradé purple-pink
3. Texte :
   ```
   🧶 YarnFlow
   Tracker Tricot & Crochet avec IA

   Early Bird 2.99€/mois
   ```
4. Export JPG
5. Upload dans `frontend/public/og-image.jpg`
6. Push GitHub

**Durée** : 5 minutes max

---

## 🆘 Pas le temps maintenant ?

**Placeholder temporaire** : Utilise une image générique tricot

1. Trouver image libre de droits sur https://unsplash.com/s/photos/knitting
2. Redimensionner à 1200x630 avec https://www.iloveimg.com/resize-image
3. Upload comme `og-image.jpg`
4. **Remplacer par une vraie plus tard** (avant gros push marketing)

---

**Important** : Même une image OG moyenne est **1000x mieux** que pas d'image du tout ! 🚀
