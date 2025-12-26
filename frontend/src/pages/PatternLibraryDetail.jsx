/**
 * @file PatternLibraryDetail.jsx
 * @brief Page de détails d'un patron de la bibliothèque
 * @author Nathalie + AI Assistants
 * @created 2025-12-25
 * @modified 2025-12-25 by [AI:Claude] - Création page détails patron bibliothèque
 *
 * @history
 *   2025-12-25 [AI:Claude] Création page détails avec affichage complet
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import PDFViewer from '../components/PDFViewer'
import ImageLightbox from '../components/ImageLightbox'
import ProxyViewer from '../components/ProxyViewer'

const PatternLibraryDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [pattern, setPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)

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

  // États pour la modale d'édition
  const [showEditModal, setShowEditModal] = useState(false)
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
  const [editType, setEditType] = useState('file')

  // États pour l'affichage plein écran
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [showTextFullscreen, setShowTextFullscreen] = useState(false)

  useEffect(() => {
    fetchPattern()
  }, [id])

  const fetchPattern = async (forceReloadFile = false) => {
    try {
      setLoading(true)
      const response = await api.get(`/pattern-library/${id}`)
      setPattern(response.data.pattern)

      // Si c'est un fichier, charger le blob
      if (response.data.pattern.source_type === 'file' && response.data.pattern.file_path) {
        // Nettoyer l'ancien blob URL si on force le rechargement
        if (forceReloadFile && fileUrl) {
          window.URL.revokeObjectURL(fileUrl)
          setFileUrl(null)
        }
        loadFile(id)
      }
    } catch (err) {
      console.error('Erreur chargement patron:', err)
      setError('Impossible de charger le patron')
    } finally {
      setLoading(false)
    }
  }

  const loadFile = async (patternId) => {
    try {
      setLoadingFile(true)
      // Ajouter un timestamp pour éviter le cache du navigateur
      const cacheBuster = `?t=${Date.now()}`
      const response = await api.get(`/pattern-library/${patternId}/file${cacheBuster}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      setFileUrl(url)
    } catch (err) {
      console.error('Erreur chargement fichier:', err)
    } finally {
      setLoadingFile(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      await api.put(`/pattern-library/${id}`, {
        is_favorite: !pattern.is_favorite
      })
      setPattern({ ...pattern, is_favorite: !pattern.is_favorite })
    } catch (err) {
      console.error('Erreur favori:', err)
      alert('Erreur lors de la modification')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patron ?')) return

    try {
      await api.delete(`/pattern-library/${id}`)
      navigate('/pattern-library')
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleEdit = () => {
    setEditType(pattern.source_type)
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
    setFile(null)
    setValidationErrors({})
    setShowEditModal(true)
  }

  const validateForm = () => {
    const errors = {}

    if (editType === 'file' && file) {
      // Valider le nouveau fichier si fourni
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        errors.file = `⚠️ Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)}MB). Taille maximum: 10MB`
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        errors.file = `⚠️ Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, WEBP`
      }
    } else if (editType === 'url') {
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
    } else if (editType === 'text') {
      if (!formData.pattern_text || !formData.pattern_text.trim()) {
        errors.pattern_text = '⚠️ Veuillez entrer le texte du patron'
      } else if (formData.pattern_text.trim().length < 10) {
        errors.pattern_text = '⚠️ Le texte du patron doit contenir au moins 10 caractères'
      }
    }

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

  const handleUpdatePattern = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setUploading(true)

    try {
      // Si un fichier a été sélectionné pour remplacement
      if (editType === 'file' && file) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('name', formData.name)
        if (formData.description) formDataUpload.append('description', formData.description)
        if (formData.category) formDataUpload.append('category', formData.category)
        if (formData.technique) formDataUpload.append('technique', formData.technique)
        if (formData.difficulty) formDataUpload.append('difficulty', formData.difficulty)
        if (formData.notes) formDataUpload.append('notes', formData.notes)
        formDataUpload.append('_method', 'PUT') // Method override pour le backend

        // Utiliser POST avec override car PHP ne parse pas $_FILES pour PUT
        // IMPORTANT: Supprimer le Content-Type pour laisser axios gérer le multipart/form-data
        await api.post(`/pattern-library/${id}`, formDataUpload, {
          headers: {
            'Content-Type': undefined
          }
        })
      } else {
        // Mise à jour sans fichier
        const updateData = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          technique: formData.technique,
          difficulty: formData.difficulty,
          notes: formData.notes
        }

        if (editType === 'url') {
          updateData.url = formData.url
        } else if (editType === 'text') {
          updateData.pattern_text = formData.pattern_text
        }

        await api.put(`/pattern-library/${id}`, updateData)
      }

      // Recharger le patron et le fichier (forcer le rechargement du blob si fichier modifié)
      await fetchPattern(editType === 'file' && file)
      setShowEditModal(false)
      setFile(null) // Réinitialiser le fichier sélectionné
    } catch (err) {
      console.error('Erreur modification patron:', err)
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la modification du patron'
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement du patron...</p>
        </div>
      </div>
    )
  }

  if (error || !pattern) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patron introuvable</h2>
          <p className="text-gray-600 mb-6">{error || 'Ce patron n\'existe pas ou a été supprimé'}</p>
          <Link
            to="/pattern-library"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition inline-block"
          >
            ← Retour à la bibliothèque
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-32 sm:pb-24">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/pattern-library"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium mb-4"
        >
          ← Retour à la bibliothèque
        </Link>

        <div className="space-y-4">
          <div>
            <div className="flex items-start gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words flex-1 min-w-0">{pattern.name}</h1>
              <button
                onClick={handleToggleFavorite}
                className="text-2xl sm:text-3xl transition hover:scale-110 flex-shrink-0"
                title={pattern.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {pattern.is_favorite ? '⭐' : '☆'}
              </button>
            </div>

            {pattern.description && (
              <p className="text-gray-600 mt-2 break-words overflow-wrap-anywhere">{pattern.description}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleEdit}
              className="flex-1 sm:flex-none px-4 py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition font-medium"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 sm:flex-none px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      {(pattern.category || pattern.technique || pattern.difficulty) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {pattern.technique && (
            <span className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
              {pattern.technique === 'tricot' ? '🧶 Tricot' : '🪡 Crochet'}
            </span>
          )}
          {pattern.category && (
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
              📁 {getCategoryLabel(pattern.category)}
            </span>
          )}
          {pattern.difficulty && (
            <span className="px-3 py-1.5 bg-warm-100 text-primary-700 rounded-lg text-sm font-medium">
              📊 {pattern.difficulty}
            </span>
          )}
        </div>
      )}

      {/* Notes personnelles */}
      {pattern.notes && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            <span>📝</span> Notes personnelles
          </h2>
          <p className="text-amber-800 whitespace-pre-wrap">{pattern.notes}</p>
        </div>
      )}

      {/* Contenu du patron */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Fichier PDF */}
        {pattern.source_type === 'file' && pattern.file_type === 'pdf' && (
          <div className="min-h-[600px]">
            {/* Bouton ouvrir en grand */}
            {fileUrl && !loadingFile && (
              <div className="p-4 border-b bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center gap-2"
                >
                  🔍 Ouvrir en grand
                </button>
              </div>
            )}

            {loadingFile ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : fileUrl ? (
              <PDFViewer url={fileUrl} fileName={pattern.name} />
            ) : (
              <div className="text-center py-12 text-gray-600">
                Impossible de charger le PDF
              </div>
            )}
          </div>
        )}

        {/* Fichier Image */}
        {pattern.source_type === 'file' && pattern.file_type === 'image' && (
          <div>
            {/* Bouton ouvrir en grand */}
            {fileUrl && !loadingFile && (
              <div className="p-4 border-b bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowImageLightbox(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center gap-2"
                >
                  🔍 Ouvrir en grand
                </button>
              </div>
            )}

            <div className="p-8">
              {loadingFile ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : fileUrl ? (
                <div
                  className="flex items-center justify-center cursor-pointer"
                  onClick={() => setShowImageLightbox(true)}
                  title="Cliquez pour agrandir"
                >
                  <img
                    src={fileUrl}
                    alt={pattern.name}
                    className="max-w-full max-h-[800px] object-contain shadow-lg rounded-lg hover:opacity-90 transition"
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  Impossible de charger l'image
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lien URL */}
        {pattern.source_type === 'url' && pattern.url && (
          <div>
            <ProxyViewer url={pattern.url} />
          </div>
        )}

        {/* Texte */}
        {pattern.source_type === 'text' && pattern.pattern_text && (
          <div>
            {/* Bouton ouvrir en grand */}
            <div className="p-4 border-b bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowTextFullscreen(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center gap-2"
              >
                🔍 Ouvrir en grand
              </button>
            </div>

            <div className="p-8">
              <div className="max-w-3xl mx-auto bg-gray-50 rounded-lg p-6">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {pattern.pattern_text}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Type de source</p>
          <p className="text-lg font-semibold text-gray-900">
            {pattern.source_type === 'file' && '📎 Fichier'}
            {pattern.source_type === 'url' && '🔗 Lien web'}
            {pattern.source_type === 'text' && '📝 Texte'}
          </p>
        </div>

        {pattern.times_used > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Utilisations</p>
            <p className="text-lg font-semibold text-gray-900">
              📊 {pattern.times_used} projet{pattern.times_used > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Ajouté le</p>
          <p className="text-lg font-semibold text-gray-900">
            {new Date(pattern.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        {pattern.updated_at && pattern.updated_at !== pattern.created_at && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Modifié le</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(pattern.updated_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Modale plein écran pour PDF */}
      {showFullscreen && pattern && fileUrl && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{pattern.name}</h2>
            <button
              onClick={() => setShowFullscreen(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
            >
              ✕ Fermer
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <PDFViewer url={fileUrl} fileName={pattern.name} />
          </div>
        </div>
      )}

      {/* Lightbox pour images */}
      {showImageLightbox && pattern && fileUrl && (
        <ImageLightbox
          src={fileUrl}
          alt={pattern.name}
          onClose={() => setShowImageLightbox(false)}
        />
      )}

      {/* Modale plein écran pour texte */}
      {showTextFullscreen && pattern && pattern.pattern_text && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{pattern.name}</h2>
            <button
              onClick={() => setShowTextFullscreen(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
            >
              ✕ Fermer
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-lg">
                {pattern.pattern_text}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition */}
      {showEditModal && pattern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900">✏️ Modifier le patron</h2>
            </div>

            <form onSubmit={handleUpdatePattern} className="p-6">
              {/* Remplacement du fichier si type = file */}
              {pattern.source_type === 'file' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remplacer le fichier (optionnel)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Fichier actuel : <strong>{pattern.file_name || 'Non disponible'}</strong>
                  </p>
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
                    <div className="text-center w-full">
                      {file ? (
                        <>
                          <div className="text-4xl mb-2">✅</div>
                          <p className="font-medium text-gray-900 break-words px-2 max-w-full">{file.name}</p>
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

              {/* URL si type = url */}
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

              {/* Texte si type = text */}
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
                    <option value="tricot">🧶 Tricot</option>
                    <option value="crochet">🪡 Crochet</option>
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

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
    </div>
  )
}

export default PatternLibraryDetail
