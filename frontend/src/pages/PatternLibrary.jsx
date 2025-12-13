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
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    fetchPatterns()
  }, [filterCategory, filterTechnique, filterFavorite, searchQuery])

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
      if (searchQuery) params.search = searchQuery

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

  const handleAddPattern = async (e) => {
    e.preventDefault()
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
  }

  const resetFilters = () => {
    setFilterCategory('')
    setFilterTechnique('')
    setFilterFavorite(false)
    setSearchQuery('')
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

        {/* Stats */}
        {!loading && stats && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-primary-600">{stats.total_patterns || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Fichiers</p>
              <p className="text-2xl font-bold text-primary-600">{stats.file_patterns || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Liens</p>
              <p className="text-2xl font-bold text-green-600">{stats.url_patterns || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Textes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.text_patterns || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Favoris</p>
              <p className="text-2xl font-bold text-amber-600">{stats.favorite_patterns || 0}</p>
            </div>
          </div>
        )}

        {/* Indicateur de limite FREE */}
        {!loading && user && (!user.subscription_type || user.subscription_type === 'free') && stats && (
          <div className="mt-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-300 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-semibold text-orange-900">
                    {stats.total_patterns || 0} / 10 patrons utilisés
                  </p>
                  <p className="text-sm text-orange-700">
                    Plan gratuit - {10 - (stats.total_patterns || 0)} patrons restants
                  </p>
                </div>
              </div>
              {(stats.total_patterns || 0) >= 10 ? (
                <Link
                  to="/profile"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition text-sm"
                >
                  🚀 Passer à PRO (illimité)
                </Link>
              ) : (stats.total_patterns || 0) >= 7 ? (
                <Link
                  to="/profile"
                  className="px-4 py-2 bg-orange-100 text-orange-800 border border-orange-300 rounded-lg font-medium hover:bg-orange-200 transition text-sm"
                >
                  Passer à PRO
                </Link>
              ) : null}
            </div>
            {/* Barre de progression */}
            <div className="mt-3 bg-orange-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (stats.total_patterns || 0) >= 10
                    ? 'bg-red-600'
                    : (stats.total_patterns || 0) >= 7
                    ? 'bg-orange-500'
                    : 'bg-orange-400'
                }`}
                style={{ width: `${Math.min(((stats.total_patterns || 0) / 10) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filtres et recherche */}
      <div className="mb-6 space-y-4">
        {/* Barre de recherche */}
        <div>
          <input
            type="text"
            placeholder="🔍 Rechercher un patron..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
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
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  filterCategory === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}

            {/* Reset */}
            {(filterCategory || filterTechnique || filterFavorite || searchQuery) && (
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
                {filterCategory || filterTechnique || filterFavorite || searchQuery
                  ? 'Aucun patron trouvé'
                  : 'Aucun patron dans votre bibliothèque'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterCategory || filterTechnique || filterFavorite || searchQuery
                  ? 'Aucun patron ne correspond aux filtres sélectionnés'
                  : 'Commencez par ajouter votre premier patron !'}
              </p>
              {!(filterCategory || filterTechnique || filterFavorite || searchQuery) && (
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
                          {pattern.category}
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {pattern.source_type === 'file' && pattern.file_path && (
                        <button
                          onClick={() => handleOpenFile(pattern)}
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-center font-medium hover:bg-primary-700 transition text-sm"
                        >
                          📥 Ouvrir
                        </button>
                      )}

                      {pattern.source_type === 'url' && pattern.url && (
                        <a
                          href={pattern.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-center font-medium hover:bg-primary-700 transition text-sm"
                        >
                          🔗 Voir le lien
                        </a>
                      )}

                      {pattern.source_type === 'text' && pattern.pattern_text && (
                        <button
                          onClick={() => {
                            setViewerData({
                              url: '',
                              fileName: pattern.name,
                              type: 'text',
                              text: pattern.pattern_text
                            })
                            setShowViewerModal(true)
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center font-medium hover:bg-blue-700 transition text-sm"
                        >
                          📝 Lire
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(pattern.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
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
                    onClick={() => setAddType('file')}
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
                    onClick={() => setAddType('url')}
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
                    onClick={() => setAddType('text')}
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
                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, WEBP (max 10MB)</p>
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
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
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
                    onChange={(e) => setFormData({ ...formData, pattern_text: e.target.value })}
                    required
                    rows={15}
                    placeholder="Collez ici le texte de votre patron...&#10;&#10;Exemple :&#10;Rang 1 : 6 mailles serrées dans un cercle magique&#10;Rang 2 : 2ms dans chaque maille (12)&#10;Rang 3 : *1ms, aug* x6 (18)&#10;..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Vous pouvez copier-coller le texte depuis n'importe quelle source
                  </p>
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Pull irlandais"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
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
                    <option value="Accessoires bébé">👶 Accessoires bébé</option>
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
