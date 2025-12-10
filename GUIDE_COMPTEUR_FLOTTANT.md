# Guide - Mode Compteur Flottant

## 🎯 Objectif

Permettre aux utilisatrices de **garder le compteur visible** tout en consultant leur patron sur un site externe (Ravelry, Garnstudio, etc.) qui ne peut pas être affiché directement dans l'application.

---

## 🚫 Le problème technique

Certains sites bloquent volontairement l'affichage en iframe avec `X-Frame-Options: DENY`. C'est une protection de sécurité du navigateur qu'on **ne peut pas contourner** côté client.

**Sites concernés :**
- garnstudio.com (Drops Design)
- Certains blogs de tricot
- Sites avec protection anti-iframe

---

## ✨ La solution : Compteur Flottant

Le compteur flottant permet de :
1. Ouvrir le patron dans un nouvel onglet
2. Garder un mini-compteur **fixé en bas de l'écran** dans l'app YarnFlow
3. Basculer entre les deux onglets facilement

### Sur Web (Desktop/Tablette)
- Le compteur reste visible en bas
- L'utilisatrice peut basculer entre onglets (Ctrl+Tab ou Alt+Tab)
- Le compteur reste fonctionnel

### Sur PWA (Mobile/Tablette)
- Le compteur reste visible en bas
- L'utilisatrice peut basculer entre apps
- Le compteur garde l'état en temps réel

---

## 🎨 Composants créés

### 1. **FloatingCounter.jsx**
(`frontend/src/components/FloatingCounter.jsx`)

Compteur compact qui affiche :
- Rang actuel (gros chiffre)
- Nom du projet et section
- Boutons +/− pour incrémenter/décrémenter
- Barre de progression
- Bouton "Voir plus" pour revenir à la vue complète

**Props :**
```jsx
<FloatingCounter
  currentRow={10}
  totalRows={50}
  sectionName="Corps du pull"
  onIncrement={() => {}}
  onDecrement={() => {}}
  onExpand={() => {}}
  projectName="Pull irlandais"
/>
```

**Style :**
- Position: `fixed bottom-0`
- Z-index: 50 (au-dessus de tout)
- Fond: Gradient primary
- Hauteur: ~80px
- Shadow-2xl pour le détacher du reste

### 2. **Intégration dans ProjectCounter**

**État ajouté :**
```javascript
const [floatingMode, setFloatingMode] = useState(false)
```

**Bouton d'activation :**
Quand un projet a un `pattern_url`, affiche un gros bouton :
```
🚀 Activer le compteur flottant
```

**Comportement :**
1. Clic sur le bouton
2. `setFloatingMode(true)` → affiche le FloatingCounter
3. `window.open(pattern_url, '_blank')` → ouvre le patron
4. L'utilisatrice peut maintenant basculer entre onglets

**Bouton "Voir plus" :**
Dans le FloatingCounter, clic sur "⬆️ Voir plus" :
- `setFloatingMode(false)` → masque le compteur flottant
- Retour à la vue complète

---

## 📱 UX Flow

### Scénario 1 : Utilisatrice avec lien externe

1. L'utilisatrice a ajouté un lien Garnstudio à son projet
2. Elle ouvre l'onglet "Patron"
3. Elle voit le message :
   ```
   🧶 Patron sauvegardé
   Votre patron est accessible via un lien externe

   ✨ Mode Compteur Flottant
   Activez le compteur flottant pour garder le compteur visible
   en bas de l'écran pendant que vous consultez votre patron
   dans un autre onglet !

   [🚀 Activer le compteur flottant]
   ```
4. Elle clique sur "Activer le compteur flottant"
5. Le patron s'ouvre dans un nouvel onglet
6. Un mini-compteur apparaît en bas de l'app YarnFlow
7. Elle peut :
   - Consulter le patron dans l'autre onglet
   - Revenir à YarnFlow pour incrémenter le compteur
   - Basculer facilement entre les deux

### Scénario 2 : Retour à la vue complète

1. L'utilisatrice clique sur "⬆️ Voir plus" dans le compteur flottant
2. Le compteur flottant disparaît
3. Elle revient à la vue complète du projet
4. Elle peut réactiver le mode flottant à tout moment

---

## 🔧 Code technique

### Activation du mode flottant

```jsx
<button
  onClick={() => {
    setFloatingMode(true)
    window.open(project.pattern_url, '_blank')
  }}
  className="..."
>
  🚀 Activer le compteur flottant
</button>
```

### Affichage conditionnel

```jsx
{floatingMode && project && (
  <FloatingCounter
    currentRow={currentRow}
    totalRows={currentSectionId ? sections.find(s => s.id === currentSectionId)?.total_rows || 0 : 0}
    sectionName={sections.find(s => s.id === currentSectionId)?.name || null}
    onIncrement={handleIncrementRow}
    onDecrement={handleDecrementRow}
    onExpand={() => setFloatingMode(false)}
    projectName={project.name}
  />
)}
```

### Padding adaptatif

Quand le mode flottant est activé, ajouter du padding en bas pour éviter que le contenu soit caché :

```jsx
<div className={`max-w-7xl mx-auto px-4 py-3 ${floatingMode ? 'pb-32' : ''}`}>
```

---

## 💡 Alternatives proposées

Dans l'UI, on propose aussi :

1. **Ouvrir dans un nouvel onglet** (sans mode flottant)
   - Bouton secondaire pour celles qui préfèrent

2. **Uploader le PDF du patron**
   - Option recommandée pour la meilleure UX
   - Le PDF s'affiche directement dans l'app avec zoom
   - Pas besoin de changer d'onglet

---

## 🎯 Avantages

### Pour l'utilisatrice
✅ Compteur toujours visible et accessible
✅ Pas besoin de mémoriser le rang
✅ Workflow naturel : consulter patron → tricoter → incrémenter
✅ Fonctionne sur tous les sites (même ceux qui bloquent les iframes)
✅ Fonctionne sur Web ET PWA

### Technique
✅ Solution propre et maintenable
✅ Pas de hack ou contournement risqué
✅ Composant réutilisable
✅ Performance optimale (pas de polling, pas de synchronisation complexe)

---

## 🐛 Limitations connues

### Sur mobile
- Le basculement entre apps peut prendre quelques secondes
- Certains navigateurs peuvent recharger l'onglet en arrière-plan

**Solution :** Encourager l'upload du PDF pour une meilleure expérience mobile

### Synchronisation
- Si l'utilisatrice ouvre plusieurs onglets YarnFlow, le compteur n'est pas synchronisé
- Le localStorage pourrait être utilisé pour synchroniser l'état (future amélioration)

---

## 🚀 Améliorations futures

1. **Synchronisation localStorage**
   - Sauvegarder `floatingMode` dans localStorage
   - Persister l'état entre rechargements

2. **Picture-in-Picture API** (PWA avancée)
   - Afficher le compteur en overlay persistant
   - Visible même quand l'app est en arrière-plan

3. **Raccourcis clavier**
   - Espace : Incrémenter
   - Backspace : Décrémenter
   - Esc : Fermer le mode flottant

4. **Son/Vibration**
   - Feedback haptique lors de l'incrémentation (PWA)
   - Son optionnel pour marquer le rang

---

## 📊 Metrics à suivre

- Taux d'activation du mode flottant
- Taux de conversion "lien externe" → "upload PDF"
- Temps passé en mode flottant
- Taux de retour à la vue complète

---

**Créé le :** 2025-12-10
**Version :** 1.0.0
**Auteur :** YarnFlow Team + AI
