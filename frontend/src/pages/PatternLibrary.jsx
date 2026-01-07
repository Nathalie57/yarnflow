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

const PatternLibrary = () => {
  const { user } = useAuth()
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

        await api.post('/pattern-library', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
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

      // [AI:Claude] Afficher le message détaillé en priorité (ex: limite atteinte)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l\'ajout du patron'
      alert(errorMessage)
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📚 Bibliothèque de patrons</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              {stats ? (
                <span>{stats.total_patterns || 0} patron{(stats.total_patterns || 0) > 1 ? 's' : ''} • </span>
              ) : null}
              Centralisez tous vos patrons et liez-les à vos projets
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition bg-primary-600 text-white hover:bg-primary-700"
          >
            ➕ Ajouter un patron
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        {/* Barre de recherche et tri */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="🔍 Rechercher un patron..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            <option value="date_desc">📅 Plus récents</option>
            <option value="date_asc">📅 Plus anciens</option>
            <option value="name_asc">🔤 A → Z</option>
            <option value="name_desc">🔤 Z → A</option>
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
              ⭐ Favoris
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
              🪡 Crochet
            </button>

            <button
              onClick={() => setFilterTechnique(filterTechnique === 'tricot' ? '' : 'tricot')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filterTechnique === 'tricot'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🧶 Tricot
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
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filterCategory || filterTechnique || filterFavorite || filterSourceType || searchQuery
                  ? 'Aucun patron trouvé'
                  : 'Aucun patron dans votre bibliothèque'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterCategory || filterTechnique || filterFavorite || filterSourceType || searchQuery
                  ? 'Aucun patron ne correspond aux filtres sélectionnés'
                  : 'Commencez par ajouter votre premier patron !'}
              </p>
              {!(filterCategory || filterTechnique || filterFavorite || filterSourceType || searchQuery) && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  ➕ Ajouter un patron
                </button>
              )}
            </div>
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
                            <span className="text-5xl">🖼️</span>
                            <p className="text-xs text-gray-500 mt-2">Image non disponible</p>
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
                          <span className="text-6xl">📄</span>
                          <p className="text-xs text-red-700 mt-2 font-medium">PDF</p>
                        </div>
                      </div>
                    ) : pattern.source_type === 'text' ? (
                      // [AI:Claude] TEXTE : aperçu du texte
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center p-4 overflow-hidden">
                        <span className="text-5xl mb-2">📝</span>
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
                            // Fallback si l'image ne charge pas
                            e.target.style.display = 'none'
                            e.target.parentElement.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-warm-100 to-primary-100 flex items-center justify-center">
                                <div class="text-center">
                                  <span class="text-6xl">🔗</span>
                                  <p class="text-xs text-primary-700 mt-2 font-medium">Lien web</p>
                                </div>
                              </div>
                            `
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-warm-100 to-primary-100 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-6xl">🔗</span>
                            <p className="text-xs text-primary-700 mt-2 font-medium">Lien web</p>
                          </div>
                        </div>
                      )
                    )}

                    {/* Badge favori (overlay) */}
                    <button
                      onClick={() => handleToggleFavorite(pattern.id, pattern.is_favorite)}
                      className="absolute top-2 right-2 text-2xl transition hover:scale-110 bg-white bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                    >
                      {pattern.is_favorite ? '⭐' : '☆'}
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
                          {pattern.technique === 'tricot' ? '🧶 Tricot' : '🪡 Crochet'}
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
                        📊 Utilisé {pattern.times_used} fois
                      </p>
                    )}

                    {/* Action */}
                    <Link
                      to={`/pattern-library/${pattern.id}`}
                      className="block w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-center font-medium hover:bg-primary-700 transition text-sm"
                    >
                      👁️ Voir les détails
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
              <h2 className="text-2xl font-bold text-gray-900">➕ Ajouter un patron</h2>
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
                    <div className="text-3xl mb-2">📎</div>
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
                    <div className="text-3xl mb-2">🔗</div>
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
                    <div className="text-3xl mb-2">📝</div>
                    <p className="font-medium">Texte</p>
                    <p className="text-xs text-gray-600">Copier-coller</p>
                  </button>
                </div>
              </div>

              {/* Upload fichier */}
              {addType === 'file' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fichier <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="file"
                    id="pattern-file-input"
                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      setFile(e.target.files[0])
                      setValidationErrors({ ...validationErrors, file: '' })
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="pattern-file-input"
                    className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-lg hover:border-primary-400 hover:bg-primary-50 transition cursor-pointer ${
                      validationErrors.file ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      {file ? (
                        <>
                          <div className="text-4xl mb-2">✅</div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600 mt-1">Cliquer pour changer le fichier</p>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-2">📎</div>
                          <p className="font-medium text-gray-900">Choisir un fichier</p>
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
                      💡 Vous pouvez copier-coller le texte depuis n'importe quelle source
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
                    <option value="Vêtements">🧥 Vêtements</option>
                    <option value="Accessoires">👜 Accessoires</option>
                    <option value="Maison/Déco">🏠 Maison/Déco</option>
                    <option value="Jouets/Peluches">🧸 Jouets/Peluches</option>
                    <option value="Vêtements bébé">👶 Vêtements bébé</option>
                    <option value="Accessoires bébé">🍼 Accessoires bébé</option>
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
                    <option value="crochet">🪡 Crochet</option>
                    <option value="tricot">🧶 Tricot</option>
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
                    <option value="facile">🟢 Facile</option>
                    <option value="moyen">🟡 Moyen</option>
                    <option value="difficile">🔴 Difficile</option>
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
                    💡 <strong>Astuce :</strong> Remplir la catégorie, la technique et le niveau facilite la recherche et le filtrage de vos patrons.
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
                  {uploading ? 'Ajout en cours...' : '✨ Ajouter'}
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
              <h2 className="text-2xl font-bold text-gray-900">✏️ Modifier le patron</h2>
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
                    <div className="text-3xl mb-2">📎</div>
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
                    <div className="text-3xl mb-2">🔗</div>
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
                    <div className="text-3xl mb-2">📝</div>
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
                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
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
                          <div className="text-4xl mb-2">✅</div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600 mt-1">Nouveau fichier sélectionné</p>
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-2">📎</div>
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
                    <option value="Vêtements">🧥 Vêtements</option>
                    <option value="Accessoires">👜 Accessoires</option>
                    <option value="Maison/Déco">🏠 Maison/Déco</option>
                    <option value="Jouets/Peluches">🧸 Jouets/Peluches</option>
                    <option value="Vêtements bébé">👶 Vêtements bébé</option>
                    <option value="Accessoires bébé">🍼 Accessoires bébé</option>
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
                    <option value="tricot">🧶 Tricot</option>
                    <option value="crochet">🪡 Crochet</option>
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
                    <option value="Débutant">⭐ Débutant</option>
                    <option value="Intermédiaire">⭐⭐ Intermédiaire</option>
                    <option value="Avancé">⭐⭐⭐ Avancé</option>
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
                    💡 <strong>Astuce :</strong> Remplir la catégorie, la technique et le niveau facilite la recherche et le filtrage de vos patrons.
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
                  {uploading ? 'Enregistrement...' : '✅ Enregistrer'}
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
                📥 Télécharger
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
                      📥 Télécharger le fichier
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatternLibrary
