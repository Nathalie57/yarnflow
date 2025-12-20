# 🏷️ Système de Tags - Modifications restantes

## ✅ Déjà fait

### Backend (100%)
- ✅ Migrations SQL (project_tags + is_favorite)
- ✅ constants.php (permissions par plan)
- ✅ User.php (canUseTags, canFilterMultiTags, getSubscriptionFeatures)
- ✅ ProjectController.php (addTags, getTags, deleteTag, getPopularTags, toggleFavorite)
- ✅ routes/api.php (5 nouvelles routes)

### Frontend (80%)
- ✅ Composants créés (TagBadge, TagInput, ProjectFilters, UpgradePrompt)
- ✅ MyProjects.jsx - imports et states ajoutés
- ✅ MyProjects.jsx - fetchProjects modifié avec filtres
- ✅ MyProjects.jsx - fetchPopularTags et checkUserPermissions ajoutés

---

## ⏳ À finaliser dans MyProjects.jsx

### 1. Ajouter les useEffect

```javascript
// Après les useEffect existants (ligne ~115)

// Charger les tags populaires et permissions au montage
useEffect(() => {
  checkUserPermissions()
  fetchPopularTags()
}, [user])

// Recharger les projets quand les filtres changent
useEffect(() => {
  if (!loading) {
    fetchProjects()
  }
}, [filters])
```

### 2. Ajouter les fonctions de gestion des tags/favoris

```javascript
// Après fetchPopularTags()

// Toggle favori
const toggleFavorite = async (projectId, currentValue) => {
  try {
    await api.put(`/projects/${projectId}/favorite`)

    // Mettre à jour localement
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, is_favorite: !currentValue } : p
    ))
  } catch (err) {
    console.error('Erreur toggle favori:', err)
    showAlert('Erreur', 'Impossible de modifier le favori')
  }
}

// Ajouter un tag au projet en création
const handleAddTag = (tag) => {
  if (!canUseTags) {
    setShowUpgradePrompt(true)
    return
  }

  if (!projectTags.includes(tag)) {
    setProjectTags([...projectTags, tag])
  }
}

// Supprimer un tag du projet en création
const handleRemoveTag = (tag) => {
  setProjectTags(projectTags.filter(t => t !== tag))
}

// Sauvegarder les tags après création de projet
const saveProjectTags = async (projectId, tags) => {
  if (!canUseTags || tags.length === 0) return

  try {
    await api.post(`/projects/${projectId}/tags`, { tags })
  } catch (err) {
    console.error('Erreur sauvegarde tags:', err)
  }
}
```

### 3. Modifier handleCreateProject

```javascript
// Dans handleCreateProject(), après la création du projet :

if (response.data.success && response.data.project) {
  const newProject = response.data.project

  // Sauvegarder les tags si présents
  if (projectTags.length > 0) {
    await saveProjectTags(newProject.id, projectTags)
  }

  // Définir comme favori si coché
  if (isFavorite) {
    await api.put(`/projects/${newProject.id}/favorite`)
  }

  // Reset form
  setProjectTags([])
  setIsFavorite(false)
  // ... reste du code
}
```

### 4. Ajouter ProjectFilters dans le JSX

```jsx
{/* Après les stats cards, avant la liste des projets */}

{/* Filtres */}
<ProjectFilters
  onFilterChange={setFilters}
  availableTags={availableTags}
  canUseTags={canUseTags}
  onUpgradeClick={() => setShowUpgradePrompt(true)}
/>
```

### 5. Ajouter les tags dans la modal de création

```jsx
{/* Dans la modal de création, après les champs existants */}

{/* Favori (tous plans) */}
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={isFavorite}
    onChange={(e) => setIsFavorite(e.target.checked)}
    className="w-4 h-4 text-primary rounded"
  />
  <span>⭐ Marquer comme favori</span>
</label>

{/* Tags (PLUS/PRO uniquement) */}
{canUseTags ? (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      🏷️ Tags
    </label>
    <TagInput
      tags={projectTags}
      onAddTag={handleAddTag}
      onRemoveTag={handleRemoveTag}
      suggestions={popularTags.map(t => t.tag_name)}
      placeholder="Ex: cadeau, bébé, urgent..."
    />
  </div>
) : (
  <div className="bg-sage/10 rounded-lg p-3 border border-sage/30">
    <div className="flex items-center gap-2 text-sm">
      <span>🏷️</span>
      <span className="font-medium">Tags - Disponible en PLUS</span>
    </div>
    <p className="text-xs text-gray-600 mt-1">
      Organisez vos projets avec des étiquettes personnalisées
    </p>
    <button
      type="button"
      onClick={() => setShowUpgradePrompt(true)}
      className="text-xs text-primary hover:underline mt-2"
    >
      En savoir plus →
    </button>
  </div>
)}
```

### 6. Ajouter tags et bouton favori sur les cartes projet

```jsx
{/* Dans le rendu des cartes projet, après le titre */}

{/* Bouton favori */}
<button
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(project.id, project.is_favorite)
  }}
  className={`text-2xl ${project.is_favorite ? 'text-yellow-400' : 'text-gray-300'} hover:scale-110 transition-transform`}
  title={project.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
>
  ⭐
</button>

{/* Tags */}
{project.tags && project.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {project.tags.slice(0, 3).map((tag, idx) => (
      <TagBadge key={idx} tag={tag} />
    ))}
    {project.tags.length > 3 && (
      <span className="text-xs text-gray-500">+{project.tags.length - 3}</span>
    )}
  </div>
)}
```

### 7. Ajouter la modal d'upgrade

```jsx
{/* À la fin du component, avant la fermeture */}

{/* Upgrade Prompt */}
<UpgradePrompt
  isOpen={showUpgradePrompt}
  onClose={() => setShowUpgradePrompt(false)}
  feature="tags"
/>
```

---

## 🔥 Instructions d'intégration

**Ordre recommandé :**

1. ✅ Exécuter les migrations SQL via phpMyAdmin
2. Ajouter les useEffect dans MyProjects.jsx
3. Ajouter les fonctions de gestion (toggleFavorite, handleAddTag, etc.)
4. Modifier handleCreateProject
5. Ajouter ProjectFilters dans le JSX
6. Ajouter les champs tags/favori dans la modal
7. Modifier les cartes projet (affichage tags + bouton favori)
8. Ajouter UpgradePrompt
9. Tester en local avec un user FREE et un user PLUS/PRO

---

## 📝 Tests à effectuer

- [ ] **FREE** : Voir les filtres de base (Tous/En cours/Terminés/Favoris)
- [ ] **FREE** : Marquer/démarquer comme favori
- [ ] **FREE** : Cliquer sur "Tags" affiche l'upgrade prompt
- [ ] **PLUS** : Créer un projet avec des tags
- [ ] **PLUS** : Filtrer par tag
- [ ] **PLUS** : Suggestions de tags populaires
- [ ] **PLUS** : Tri par nom/date/activité
- [ ] **PRO** : Tout comme PLUS (pas de diff pour l'instant)

---

## 📌 Notes importantes

1. **is_favorite** existe dans la BDD ? → Vérifier que la colonne a été ajoutée
2. **project.tags** retourné par l'API ? → Vérifier que ProjectController.index() retourne bien les tags
3. **Styles** : Les couleurs primary/sage/warm sont définies dans tailwind.config.js ?

