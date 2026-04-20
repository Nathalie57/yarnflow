/**
 * @file PatternLibrary.jsx
 * @brief Bibliothèque centralisée de patrons utilisateur
 * @author Nathalie + AI Assistants
 * @created 2025-11-19
 * @modified 2025-11-19 by [AI:Claude] - Création bibliothèque patrons
 *
 * @history
 *   2025-11-19 [AI:Claude] Création page bibliothèque patrons avec upload
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import PDFViewer from '../components/PDFViewer'
import ImageLightbox from '../components/ImageLightbox'
import UpgradePrompt from '../components/UpgradePrompt'

const PatternLibrary = () => {
  const { user } = useAuth()
  const isPro = user?.subscription_type && user.subscription_type !== 'free'
  const [showUpgradeLibrary, setShowUpgradeLibrary] = useState(false)
  const [patterns, setPatterns] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // [AI:Claude] Filtres
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTechnique, setFilterTechnique] = useState('')
  const [filterFavorite, setFilterFavorite] = useState(false)
  const [filterSourceType, setFilterSourceType] = useState('') // 'file', 'url', 'text' ou ''
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date_desc') // 'date_desc', 'date_asc', 'name_asc', 'name_desc'

  // [AI:Claude] Cache des aperçus (blob URLs)
  const [previewUrls, setPreviewUrls] = useState({})
  const [previewErrors, setPreviewErrors] = useState({})
  const loadedIds = useRef(new Set())

  // [AI:Claude] Modales
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPattern, setEditingPattern] = useState(null)

  // [AI:Claude] Visualisation de patron
  const [showViewerModal, setShowViewerModal] = useState(false)
  const [viewerData, setViewerData] = useState({ url: '', fileName: '', type: '' })

  // [AI:Claude] Formulaire d'ajout
  const [addType, setAddType] = useState('file') // 'file', 'url' ou 'text'
  const [editType, setEditType] = useState('file') // 'file', 'url' ou 'text' en mode édition
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    pattern_text: '',
    category: '',
    technique: '',
    difficulty: '',
    notes: ''
  })
  const [file, setFile] = useState(null)
  const [extraFiles, setExtraFiles] = useState([]) // fichiers additionnels (après le principal)
  const [addModalDragOver, setAddModalDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})

  // Traduction des catégories
  const getCategoryLabel = (category) => {
    const translations = {
      'other': 'Autre',
      'Vêtements': 'Vêtements',
      'Accessoires': 'Accessoires',
      'Maison/Déco': 'Maison/Déco',
      'Jouets/Peluches': 'Jouets/Peluches',
      'Accessoires bébé': 'Accessoires bébé'
    }
    return translations[category] || category
  }

  useEffect(() => {
    fetchPatterns()
  }, [filterCategory, filterTechnique, filterFavorite, filterSourceType, searchQuery, sortBy])

  // [AI:Claude] Charger les aperçus des images avec authentification
  useEffect(() => {
    const loadPreviews = async () => {
      const imagePatterns = patterns.filter(p =>
        p.source_type === 'file' &&
        p.file_type === 'image' &&
        !loadedIds.current.has(p.id)
      )

      for (const pattern of imagePatterns) {
        // [AI:Claude] Marquer comme en cours de chargement
        loadedIds.current.add(pattern.id)

        try {
          const response = await api.get(`/pattern-library/${pattern.id}/file`, {
            responseType: 'blob'
          })

          const blob = new Blob([response.data])
          const url = window.URL.createObjectURL(blob)

          setPreviewUrls(prev => ({
            ...prev,
            [pattern.id]: url
          }))
        } catch (err) {
          console.error(`Erreur chargement aperçu ${pattern.id}:`, err)
          setPreviewErrors(prev => ({
            ...prev,
            [pattern.id]: true
          }))
        }
      }
    }

    if (patterns.length > 0) {
      loadPreviews()
    }

    // [AI:Claude] Cleanup : révoquer les blob URLs au démontage
    return () => {
      Object.values(previewUrls).forEach(url => {
        window.URL.revokeObjectURL(url)
      })
    }
  }, [patterns])

  const fetchPatterns = async () => {
    try {
      setLoading(true)
      const params = {}

      if (filterCategory) params.category = filterCategory
      if (filterTechnique) params.technique = filterTechnique
      if (filterFavorite) params.favorite = 'true'
      if (filterSourceType) params.source_type = filterSourceType
      if (searchQuery) params.search = searchQuery
      if (sortBy) params.sort = sortBy

      const response = await api.get('/pattern-library', { params })

      setPatterns(response.data.patterns || [])
      setStats(response.data.stats || {})
      setCategories(response.data.categories || [])
    } catch (err) {
      console.error('Erreur chargement patrons:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    // Validation selon le type de patron
    if (editingPattern) {
      // Mode édition - utiliser editType pour gérer le changement de type
      const sourceType = editType

      if (sourceType === 'file') {
        // Si on change vers 'file' OU qu'on reste en 'file', un fichier est requis
        // SAUF si on reste sur le même type et qu'on ne change pas le fichier
        const isChangingToFile = editingPattern.source_type !== 'file'

        if (isChangingToFile && !file) {
          // Si on change vers 'file', un fichier est obligatoire
          errors.file = '⚠️ Veuillez sélectionner un fichier (PDF, JPG, PNG ou WEBP)'
        } else if (file) {
          // Si un fichier est fourni, le valider
          const maxSize = 10 * 1024 * 1024 // 10MB
          if (file.size > maxSize) {
            errors.file = `⚠️ Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Taille maximum: 10MB`
          }
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
          if (!allowedTypes.includes(file.type)) {
            errors.file = `⚠️ Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, WEBP`
          }
        }
      } else if (sourceType === 'url') {
        // URL obligatoire en édition
        if (!formData.url || !formData.url.trim()) {
          errors.url = '⚠️ Veuillez entrer une URL'
        } else {
          try {
            new URL(formData.url)
            if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
              errors.url = '⚠️ L\'URL doit commencer par http:// ou https://'
            }
          } catch {
            errors.url = '⚠️ L\'URL n\'est pas valide. Exemple: https://www.exemple.com'
          }
        }
      } else if (sourceType === 'text') {
        // Texte obligatoire en édition
        if (!formData.pattern_text || !formData.pattern_text.trim()) {
          errors.pattern_text = '⚠️ Veuillez entrer le texte du patron'
        } else if (formData.pattern_text.trim().length < 10) {
          errors.pattern_text = '⚠️ Le texte du patron doit contenir au moins 10 caractères'
        }
      }
    } else {
      // Mode ajout
      if (addType === 'file') {
        if (!file) {
          errors.file = '⚠️ Veuillez sélectionner un fichier (PDF, JPG, PNG ou WEBP)'
        } else {
          const maxSize = 10 * 1024 * 1024 // 10MB
          if (file.size > maxSize) {
            errors.file = `⚠️ Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Taille maximum: 10MB`
          }
          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
          if (!allowedTypes.includes(file.type)) {
            errors.file = `⚠️ Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, WEBP`
          }
        }
      } else if (addType === 'url') {
        if (!formData.url || !formData.url.trim()) {
          errors.url = '⚠️ Veuillez entrer une URL'
        } else {
          try {
            new URL(formData.url)
            if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
              errors.url = '⚠️ L\'URL doit commencer par http:// ou https://'
            }
          } catch {
            errors.url = '⚠️ L\'URL n\'est pas valide. Exemple: https://www.exemple.com'
          }
        }
      } else if (addType === 'text') {
        if (!formData.pattern_text || !formData.pattern_text.trim()) {
          errors.pattern_text = '⚠️ Veuillez entrer le texte du patron'
        } else if (formData.pattern_text.trim().length < 10) {
          errors.pattern_text = '⚠️ Le texte du patron doit contenir au moins 10 caractères'
        }
      }
    }

    // Validation du nom (obligatoire pour tous les types)
    if (!formData.name || !formData.name.trim()) {
      errors.name = '⚠️ Le nom du patron est obligatoire'
    } else if (formData.name.trim().length < 2) {
      errors.name = '⚠️ Le nom doit contenir au moins 2 caractères'
    } else if (formData.name.length > 200) {
      errors.name = '⚠️ Le nom ne peut pas dépasser 200 caractères'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddPattern = async (e) => {
    e.preventDefault()

    // Valider avant de soumettre
    if (!validateForm()) {
      // Scroller vers la première erreur
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setUploading(true)

    try {
      if (addType === 'file') {
        // [AI:Claude] Upload de fichier avec FormData
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('name', formData.name)
        if (formData.description) formDataUpload.append('description', formData.description)
        if (formData.category) formDataUpload.append('category', formData.category)
        if (formData.technique) formDataUpload.append('technique', formData.technique)
        if (formData.difficulty) formDataUpload.append('difficulty', formData.difficulty)
        if (formData.notes) formDataUpload.append('notes', formData.notes)

        const res = await api.post('/pattern-library', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        // Upload des fichiers additionnels si présents
        if (extraFiles.length > 0 && res.data?.pattern?.id) {
          const newId = res.data.pattern.id
          for (const xf of extraFiles) {
            const fd = new FormData()
            fd.append('file', xf)
            await api.post(`/pattern-library/${newId}/files`, fd, {
              headers: { 'Content-Type': undefined }
            })
          }
        }
      } else {
        // [AI:Claude] Ajout d'URL ou de texte avec JSON
        await api.post('/pattern-library', {
          ...formData,
          source_type: addType // 'url' ou 'text'
        })
      }

      // [AI:Claude] Refresh et reset
      fetchPatterns()
      resetForm()
      setShowAddModal(false)
    } catch (err) {
      console.error('Erreur ajout patron:', err)

      if (err.response?.data?.upgrade_required) {
        setShowAddModal(false)
        setShowUpgradeLibrary(true)
      } else {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || "Erreur lors de l'ajout du patron"
        alert(errorMessage)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleToggleFavorite = async (patternId, currentValue) => {
    try {
      await api.put(`/pattern-library/${patternId}`, {
        is_favorite: !currentValue
      })

      setPatterns(patterns.map(p =>
        p.id === patternId ? { ...p, is_favorite: !currentValue } : p
      ))
    } catch (err) {
      console.error('Erreur favori:', err)
    }
  }

  const handleDelete = async (patternId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patron ?'))
      return

    try {
      await api.delete(`/pattern-library/${patternId}`)
      setPatterns(patterns.filter(p => p.id !== patternId))
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression du patron')
    }
  }

  const handleEditPattern = (pattern) => {
    setEditingPattern(pattern)
    setEditType(pattern.source_type) // Initialiser avec le type actuel
    setFormData({
      name: pattern.name || '',
      description: pattern.description || '',
      url: pattern.url || '',
      pattern_text: pattern.pattern_text || '',
      category: pattern.category || '',
      technique: pattern.technique || '',
      difficulty: pattern.difficulty || '',
      notes: pattern.notes || ''
    })
    setFile(null) // Réinitialiser le fichier
    setShowEditModal(true)
  }

  const handleUpdatePattern = async (e) => {
    e.preventDefault()

    // Valider avant de soumettre
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setUploading(true)

    try {
      // Si le type est 'file' et qu'un fichier est fourni
      if (editType === 'file' && file) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('name', formData.name)
        if (formData.description) formDataUpload.append('description', formData.description)
        if (formData.category) formDataUpload.append('category', formData.category)
        if (formData.technique) formDataUpload.append('technique', formData.technique)
        if (formData.difficulty) formDataUpload.append('difficulty', formData.difficulty)
        if (formData.notes) formDataUpload.append('notes', formData.notes)

        await api.put(`/pattern-library/${editingPattern.id}`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        // Mise à jour avec source_type pour gérer le changement de type
        const updateData = {
          ...formData,
          source_type: editType
        }

        await api.put(`/pattern-library/${editingPattern.id}`, updateData)
      }

      // Refresh et reset
      fetchPatterns()
      resetForm()
      setShowEditModal(false)
      setEditingPattern(null)
    } catch (err) {
      console.error('Erreur modification patron:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la modification du patron'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      url: '',
      pattern_text: '',
      category: '',
      technique: '',
      difficulty: '',
      notes: ''
    })
    setFile(null)
    setExtraFiles([])
    setAddType('file')
    setEditType('file')
    setValidationErrors({})
  }

  const resetFilters = () => {
    setFilterCategory('')
    setFilterTechnique('')
    setFilterFavorite(false)
    setFilterSourceType('')
    setSearchQuery('')
    setSortBy('date_desc')
  }

  const handleOpenFile = async (pattern) => {
    try {
      const response = await api.get(`/pattern-library/${pattern.id}/file`, {
        responseType: 'blob'
      })

      // [AI:Claude] Récupérer le type MIME depuis la réponse
      const contentType = response.headers['content-type'] || 'application/octet-stream'

      // [AI:Claude] Créer une URL temporaire pour le blob avec le bon type MIME
      const blob = new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)

      // [AI:Claude] Déterminer le type de fichier (PDF ou image)
      const isPDF = contentType.includes('pdf')
      const isImage = contentType.includes('image')

      // [AI:Claude] Ouvrir dans la modale au lieu d'un nouvel onglet
      setViewerData({
        url,
        fileName: pattern.file_name || pattern.name || 'patron',
        type: isPDF ? 'pdf' : isImage ? 'image' : 'other',
        contentType
      })
      setShowViewerModal(true)

      // [AI:Claude] Nettoyer l'URL après fermeture (10 minutes)
      setTimeout(() => window.URL.revokeObjectURL(url), 600000)
    } catch (err) {
      console.error('Erreur ouverture fichier:', err)
      alert('Erreur lors de l\'ouverture du fichier')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bibliothèque de patrons</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Centralisez tous vos patrons et liez-les à vos projets
            </p>
          </div>

          {/* Indicateur de limite FREE */}
          {!isPro && stats !== null && (
            <div className="sm:text-right">
              {(() => {
                const count = stats.total_patterns || 0
                const max = 5
                const pct = Math.min((count / max) * 100, 100)
                const remaining = max - count
                const isNearLimit = count >= 3
                const isAtLimit = count >= max
                return (
                  <div className={`inline-flex flex-col items-end gap-1 px-4 py-2.5 rounded-xl border ${
                    isAtLimit ? 'bg-red-50 border-red-200' :
                    isNearLimit ? 'bg-amber-50 border-amber-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        isAtLimit ? 'text-red-700' : isNearLimit ? 'text-amber-700' : 'text-gray-700'
                      }`}>
                        {count}/{max} patrons
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        isAtLimit ? 'bg-red-100 text-red-700' : isNearLimit ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                      }`}>FREE</span>
                    </div>
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <button
                      onClick={() => setShowUpgradeLibrary(true)}
                      className={`text-xs font-medium hover:underline ${
                        isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-primary-600'
                      }`}
                    >
                      {isAtLimit ? 'Limite atteinte — Passer à PRO' :
                       isNearLimit ? `Plus que ${remaining} — Passer à PRO` :
                       'Passer à PRO pour plus'}
                    </button>
                  </div>
                )
              })()}
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition bg-primary-600 text-white hover:bg-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter un patron
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        {/* Barre de recherche et tri */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Rechercher un patron..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            <option value="date_desc">Plus récents</option>
            <option value="date_asc">Plus anciens</option>
            <option value="name_asc">A → Z</option>
            <option value="name_desc">Z → A</option>
          </select>
        </div>

        {/* Filtres pills */}
        {(categories.length > 0 || filterTechnique || filterFavorite) && (
          <div className="flex flex-wrap gap-2">
            {/* Favoris */}
            <button
              onClick={() => setFilterFavorite(!filterFavorite)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filterFavorite
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Favoris
            </button>

            {/* Technique */}
            <button
              onClick={() => setFilterTechnique(filterTechnique === 'crochet' ? '' : 'crochet')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filterTechnique === 'crochet'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Crochet
            </button>

            <button
              onClick={() => setFilterTechnique(filterTechnique === 'tricot' ? '' : 'tricot')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filterTechnique === 'tricot'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tricot
            </button>

            {/* Catégories */}
            {categories.filter(cat => cat && cat.trim()).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filterCategory === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}

            {/* Reset */}
            {(filterCategory || filterTechnique || filterFavorite || filterSourceType || searchQuery) && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos patrons...</p>
        </div>
      )}

      {/* Liste des patrons */}
      {!loading && (
        <>
          {patterns.length === 0 ? (
            filterCategory || filterTechnique || filterFavorite || filterSourceType || searchQuery ? (
              /* Empty state avec filtres actifs */
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun patron trouvé
                </h3>
                <p className="text-gray-600">
                  Aucun patron ne correspond aux filtres sélectionnés
                </p>
              </div>
            ) : (
              /* Empty state sans filtres - Accueil bibliothèque */
              <div className="max-w-2xl mx-auto text-center py-16 px-6 bg-gradient-to-br from-warm-50 to-white rounded-2xl border-2 border-primary-200 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-primary-300 mx-auto mb-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>

                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  Vos patrons éparpillés partout ?
                  <br />
                  <span className="text-primary-600">Rassemblez-les ici.</span>
                </h2>

                <p className="text-gray-700 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                  PDF, liens Ravelry, notes perso…
                  <br className="hidden sm:block" />
                  Tout au même endroit, accessible sur tous vos appareils.
                </p>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300 shadow-lg hover:shadow-xl text-lg mb-8"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Ajouter mon premier patron
                </button>

                {/* Mention discrète des projets */}
                <p className="text-sm text-gray-500">
                  Envie de compter vos rangs ? <Link to="/projects" className="text-primary-600 hover:text-primary-700 underline">Créer un projet</Link>
                </p>
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden"
                >
                  {/* Preview/Icon */}
                  <div className="h-48 relative overflow-hidden bg-gray-100">
                    {/* Aperçu selon le type */}
                    {pattern.source_type === 'file' && pattern.file_type === 'image' ? (
                      // [AI:Claude] Image : afficher l'aperçu depuis le cache blob
                      previewUrls[pattern.id] ? (
                        <img
                          src={previewUrls[pattern.id]}
                          alt={pattern.name}
                          className="w-full h-full object-cover"
                        />
                      ) : previewErrors[pattern.id] ? (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            <p className="text-xs text-gray-500">Image non disponible</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      )
                    ) : pattern.source_type === 'file' && pattern.file_type === 'pdf' ? (
                      // [AI:Claude] PDF : fond avec icône stylée
                      <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                        <div className="text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-14 h-14 text-red-400 mx-auto mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <p className="text-xs text-red-700 font-medium">PDF</p>
                        </div>
                      </div>
                    ) : pattern.source_type === 'text' ? (
                      // [AI:Claude] TEXTE : aperçu du texte
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-blue-400 mb-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <p className="text-xs text-blue-700 font-medium mb-2">TEXTE</p>
                        <div className="text-xs text-blue-600 font-mono text-center line-clamp-3 max-w-full">
                          {pattern.pattern_text?.substring(0, 80)}...
                        </div>
                      </div>
                    ) : (
                      // [AI:Claude] URL : afficher preview image si disponible, sinon icône
                      pattern.preview_image_url ? (
                        <img
                          src={pattern.preview_image_url}
                          alt={pattern.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-warm-100 to-primary-100 flex items-center justify-center">
                                <div class="text-center">
                                  <p class="text-xs text-primary-700 font-medium mt-2">Lien web</p>
                                </div>
                              </div>
                            `
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-warm-100 to-primary-100 flex items-center justify-center">
                          <div className="text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-14 h-14 text-primary-400 mx-auto mb-2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                            </svg>
                            <p className="text-xs text-primary-700 font-medium">Lien web</p>
                          </div>
                        </div>
                      )
                    )}

                    {/* Badge favori (overlay) */}
                    <button
                      onClick={() => handleToggleFavorite(pattern.id, pattern.is_favorite)}
                      className="absolute top-2 right-2 transition hover:scale-110 bg-white bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                    >
                      {pattern.is_favorite ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Contenu */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {pattern.name}
                    </h3>

                    {pattern.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {pattern.description}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pattern.technique && (
                        <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                          {pattern.technique === 'tricot' ? 'Tricot' : 'Crochet'}
                        </span>
                      )}
                      {pattern.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {getCategoryLabel(pattern.category)}
                        </span>
                      )}
                      {pattern.difficulty && (
                        <span className="px-2 py-1 bg-warm-100 text-primary-700 rounded text-xs">
                          {pattern.difficulty}
                        </span>
                      )}
                    </div>

                    {/* Stats usage */}
                    {pattern.times_used > 0 && (
                      <p className="text-xs text-gray-500 mb-3">
                        Utilisé {pattern.times_used} fois
                      </p>
                    )}

                    {/* Action */}
                    <Link
                      to={`/pattern-library/${pattern.id}`}
                      className="block w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-center font-medium hover:bg-primary-700 transition text-sm"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content-mobile">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Ajouter un patron</h2>
            </div>

            <form onSubmit={handleAddPattern} className="p-6">
              {/* Type de patron */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de patron
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAddType('file')
                      setValidationErrors({})
                    }}
                    className={`p-4 border-2 rounded-lg transition ${
                      addType === 'file'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="font-medium">Fichier</p>
                    <p className="text-xs text-gray-600">PDF, JPG, PNG</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddType('url')
                      setValidationErrors({})
                    }}
                    className={`p-4 border-2 rounded-lg transition ${
                      addType === 'url'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    <p className="font-medium">Lien web</p>
                    <p className="text-xs text-gray-600">YouTube, blog...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAddType('text')
                      setValidationErrors({})
                    }}
                    className={`p-4 border-2 rounded-lg transition ${
                      addType === 'text'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="font-medium">Texte</p>
                    <p className="text-xs text-gray-600">Copier-coller</p>
                  </button>
                </div>
              </div>

              {/* Upload fichier */}
              {addType === 'file' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier(s) <span className="text-red-600">*</span>
                  </label>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setAddModalDragOver(true) }}
                    onDragLeave={() => setAddModalDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setAddModalDragOver(false)
                      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
                      const dropped = Array.from(e.dataTransfer.files).filter(f => allowed.includes(f.type))
                      if (!dropped.length) return
                      setFile(dropped[0])
                      setExtraFiles(prev => {
                        const all = [...prev, ...dropped.slice(1)]
                        const seen = new Set()
                        return all.filter(f => { const k = f.name + f.size; return seen.has(k) ? false : seen.add(k) })
                      })
                      setValidationErrors({ ...validationErrors, file: '' })
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                      addModalDragOver ? 'border-primary-400 bg-primary-50' :
                      validationErrors.file ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mx-auto mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-1">Glissez vos fichiers ici</p>
                    <p className="text-xs text-gray-400 mb-3">PDF, JPG, PNG, WEBP</p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition">
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        multiple
                        onChange={(e) => {
                          const picked = Array.from(e.target.files)
                          if (!picked.length) return
                          setFile(picked[0])
                          setExtraFiles(prev => {
                            const all = [...prev, ...picked.slice(1)]
                            const seen = new Set()
                            return all.filter(f => { const k = f.name + f.size; return seen.has(k) ? false : seen.add(k) })
                          })
                          setValidationErrors({ ...validationErrors, file: '' })
                        }}
                        className="hidden"
                      />
                      Parcourir
                    </label>
                  </div>

                  {/* Liste des fichiers sélectionnés */}
                  {(file || extraFiles.length > 0) && (
                    <div className="mt-3 space-y-1.5">
                      {file && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <span className="text-sm text-gray-800 flex-1 truncate">{file.name}</span>
                          <span className="text-xs text-primary-600 font-medium">Principal</span>
                          <button type="button" onClick={() => { setFile(extraFiles[0] || null); setExtraFiles(prev => prev.slice(1)) }} className="text-gray-400 hover:text-red-500 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      )}
                      {extraFiles.map((xf, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                          <span className="text-sm text-gray-700 flex-1 truncate">{xf.name}</span>
                          <span className="text-xs text-gray-400">Additionnel</span>
                          <button type="button" onClick={() => setExtraFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {validationErrors.file && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.file}</p>
                  )}
                </div>
              )}

              {/* URL */}
              {addType === 'url' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => {
                      setFormData({ ...formData, url: e.target.value })
                      setValidationErrors({ ...validationErrors, url: '' })
                    }}
                    placeholder="https://..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.url ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.url && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.url}</p>
                  )}
                </div>
              )}

              {/* Texte du patron */}
              {addType === 'text' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texte du patron <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={formData.pattern_text}
                    onChange={(e) => {
                      setFormData({ ...formData, pattern_text: e.target.value })
                      setValidationErrors({ ...validationErrors, pattern_text: '' })
                    }}
                    rows={15}
                    placeholder="Collez ici le texte de votre patron...&#10;&#10;Exemple :&#10;Rang 1 : 6 mailles serrées dans un cercle magique&#10;Rang 2 : 2ms dans chaque maille (12)&#10;Rang 3 : *1ms, aug* x6 (18)&#10;..."
                    className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.pattern_text ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.pattern_text ? (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.pattern_text}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Astuce : vous pouvez copier-coller le texte depuis n'importe quelle source
                    </p>
                  )}
                </div>
              )}

              {/* Nom */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du patron <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setValidationErrors({ ...validationErrors, name: '' })
                  }}
                  placeholder="Ex: Pull irlandais"
                  autoFocus
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Description du patron..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Grille de métadonnées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Vêtements">Vêtements</option>
                    <option value="Accessoires">Accessoires</option>
                    <option value="Jouets/Peluches">Jouets/Peluches</option>
                    <option value="Vêtements bébé">Vêtements bébé</option>
                    <option value="Accessoires bébé">Accessoires bébé</option>
                    <option value="Vêtements enfant">Vêtements enfant</option>
                    <option value="Maison/Déco">Maison/Déco</option>
                  </select>
                </div>

                {/* Technique */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technique
                  </label>
                  <select
                    value={formData.technique}
                    onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="crochet">Crochet</option>
                    <option value="tricot">Tricot</option>
                  </select>
                </div>

                {/* Difficulté */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulté
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes personnelles
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Vos notes sur ce patron..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Message encouragement */}
              {(!formData.category || !formData.technique || !formData.difficulty) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Astuce :</strong> Remplir la catégorie, la technique et le niveau facilite la recherche et le filtrage de vos patrons.
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 modal-actions-mobile">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {uploading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingPattern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content-mobile">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Modifier le patron</h2>
              <p className="text-sm text-gray-600 mt-1">
                Vous pouvez modifier le type de patron si besoin
              </p>
            </div>

            <form onSubmit={handleUpdatePattern} className="p-6">
              {/* Sélection du type de patron */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de patron
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditType('file')
                      setValidationErrors({})
                    }}
                    className={`p-4 border-2 rounded-lg transition ${
                      editType === 'file'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="font-medium">Fichier</p>
                    <p className="text-xs text-gray-600">PDF, JPG, PNG</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditType('url')
                      setValidationErrors({})
                    }}
                    className={`p-4 border-2 rounded-lg transition ${
                      editType === 'url'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    <p className="font-medium">Lien web</p>
                    <p className="text-xs text-gray-600">YouTube, blog...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditType('text')
                      setValidationErrors({})
                    }}
                    className={`p-4 border-2 rounded-lg transition ${
                      editType === 'text'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto mb-2 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <p className="font-medium">Texte</p>
                    <p className="text-xs text-gray-600">Copier/coller</p>
                  </button>
                </div>
              </div>

              {/* Modification du fichier si editType = file */}
              {editType === 'file' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingPattern.source_type === 'file' ? 'Remplacer le fichier (optionnel)' : 'Fichier '}
                    {editingPattern.source_type !== 'file' && <span className="text-red-600">*</span>}
                  </label>
                  {editingPattern.source_type === 'file' && (
                    <p className="text-xs text-gray-600 mb-3">
                      Fichier actuel : <strong>{editingPattern.file_name || 'Non disponible'}</strong>
                    </p>
                  )}
                  {editingPattern.source_type !== 'file' && (
                    <p className="text-xs text-gray-600 mb-3">
                      Vous changez le type de patron vers "Fichier". Un fichier est requis.
                    </p>
                  )}
                  <input
                    type="file"
                    id="pattern-file-edit-input"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => {
                      setFile(e.target.files[0])
                      setValidationErrors({ ...validationErrors, file: '' })
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="pattern-file-edit-input"
                    className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-lg hover:border-primary-400 hover:bg-primary-50 transition cursor-pointer ${
                      validationErrors.file ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      {file ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-primary-600 mx-auto mb-2">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                          </svg>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600 mt-1">Nouveau fichier sélectionné</p>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400 mx-auto mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="font-medium text-gray-900">Choisir un nouveau fichier</p>
                          <p className="text-sm text-gray-600 mt-1">PDF, JPG, PNG, WEBP (max 10MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                  {validationErrors.file && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.file}</p>
                  )}
                </div>
              )}

              {/* Modification de l'URL si editType = url */}
              {editType === 'url' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => {
                      setFormData({ ...formData, url: e.target.value })
                      setValidationErrors({ ...validationErrors, url: '' })
                    }}
                    placeholder="https://..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.url ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.url && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.url}</p>
                  )}
                </div>
              )}

              {/* Modification du texte si editType = text */}
              {editType === 'text' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texte du patron <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={formData.pattern_text}
                    onChange={(e) => {
                      setFormData({ ...formData, pattern_text: e.target.value })
                      setValidationErrors({ ...validationErrors, pattern_text: '' })
                    }}
                    rows={15}
                    placeholder="Collez ici le texte de votre patron..."
                    className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.pattern_text ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.pattern_text && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.pattern_text}</p>
                  )}
                </div>
              )}

              {/* Nom */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du patron <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setValidationErrors({ ...validationErrors, name: '' })
                  }}
                  placeholder="Ex: Pull irlandais"
                  autoFocus
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Description du patron..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Grille de métadonnées */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Vêtements">Vêtements</option>
                    <option value="Accessoires">Accessoires</option>
                    <option value="Jouets/Peluches">Jouets/Peluches</option>
                    <option value="Vêtements bébé">Vêtements bébé</option>
                    <option value="Accessoires bébé">Accessoires bébé</option>
                    <option value="Vêtements enfant">Vêtements enfant</option>
                    <option value="Maison/Déco">Maison/Déco</option>
                  </select>
                </div>

                {/* Technique */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technique
                  </label>
                  <select
                    value={formData.technique}
                    onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="tricot">Tricot</option>
                    <option value="crochet">Crochet</option>
                  </select>
                </div>

                {/* Niveau */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes personnelles
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Vos notes personnelles..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Message encouragement */}
              {(!formData.category || !formData.technique || !formData.difficulty) && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Astuce :</strong> Remplir la catégorie, la technique et le niveau facilite la recherche et le filtrage de vos patrons.
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingPattern(null)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {uploading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modale de visualisation de patron (PDF/Image) avec bouton de fermeture */}
      {showViewerModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black bg-opacity-75"
            onClick={() => setShowViewerModal(false)}
          />

          {/* Contenu */}
          <div className="relative h-full flex flex-col">
            {/* Header avec bouton de fermeture bien visible */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowViewerModal(false)}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-200 transition flex items-center gap-2"
                >
                  ← Retour
                </button>
                <h2 className="text-lg font-semibold">{viewerData.fileName}</h2>
              </div>
              <a
                href={viewerData.url}
                download={viewerData.fileName}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Télécharger
              </a>
            </div>

            {/* Contenu du visualiseur */}
            <div className="flex-1 overflow-auto bg-gray-100">
              {viewerData.type === 'pdf' && (
                <PDFViewer url={viewerData.url} fileName={viewerData.fileName} />
              )}

              {viewerData.type === 'image' && (
                <div className="flex items-center justify-center p-8 h-full">
                  <img
                    src={viewerData.url}
                    alt={viewerData.fileName}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                  />
                </div>
              )}

              {viewerData.type === 'text' && (
                <div className="p-8 h-full overflow-y-auto">
                  <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                      {viewerData.text}
                    </pre>
                  </div>
                </div>
              )}

              {viewerData.type === 'other' && (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <div>
                    <p className="text-gray-700 mb-4">
                      Prévisualisation non disponible pour ce type de fichier
                    </p>
                    <a
                      href={viewerData.url}
                      download={viewerData.fileName}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition inline-block"
                    >
                      Télécharger le fichier
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <UpgradePrompt
        isOpen={showUpgradeLibrary}
        onClose={() => setShowUpgradeLibrary(false)}
        feature="pattern_library"
      />
    </div>
  )
}

export default PatternLibrary
