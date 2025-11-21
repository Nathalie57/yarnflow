/**
 * @file Gallery.jsx
 * @brief Galerie photos IA pour embellir vos ouvrages (AI Photo Studio v0.11.0)
 * @author Nathalie + AI Assistants
 * @created 2025-11-14
 * @modified 2025-11-16 by [AI:Claude] - Workflow quantité → contextes
 *
 * @history
 *   2025-11-16 [AI:Claude] Workflow: quantité PUIS contextes (UX améliorée)
 *   2025-11-16 [AI:Claude] Génération 1-5 photos + contextes par type + presets
 *   2025-11-14 [AI:Claude] Création initiale avec upload + génération IA Gemini
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Gallery = () => {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [projects, setProjects] = useState([]) // [AI:Claude] Liste des projets pour filtres
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [credits, setCredits] = useState(null)

  // [AI:Claude] Filtres
  const [filters, setFilters] = useState({
    project: '',
    type: '',
    style: ''
  })

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // [AI:Claude] Upload de photo
  const [uploadData, setUploadData] = useState({
    photo: null,
    item_name: '',
    item_type: '',
    technique: '',
    description: ''
  })
  const [uploading, setUploading] = useState(false)

  // [AI:Claude] Embellissement IA - v0.11.0 workflow quantité → contextes
  const [enhanceData, setEnhanceData] = useState({
    quantity: 1, // [AI:Claude] D'ABORD choisir la quantité
    contexts: [], // [AI:Claude] ENSUITE choisir les contextes
    project_category: '',
    custom_instructions: '' // [AI:Claude] Instructions personnalisées
  })
  const [enhancing, setEnhancing] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    status: []
  })

  // [AI:Claude] Charger les photos, projets et crédits au montage
  useEffect(() => {
    fetchPhotos()
    fetchProjects()
    fetchCredits()
  }, [])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get('/photos')
      // [AI:Claude] Filtrer UNIQUEMENT les photos IA (avec enhanced_path)
      const allPhotos = response.data.photos || []
      const aiPhotos = allPhotos.filter(p => p.enhanced_path)
      setPhotos(aiPhotos)
    } catch (err) {
      console.error('Erreur chargement photos:', err)
      if (err.response?.status === 404 || err.response?.data?.photos === null) {
        setPhotos([])
      } else {
        setError('Impossible de charger vos photos')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data.projects || [])
    } catch (err) {
      console.error('Erreur chargement projets:', err)
      setProjects([])
    }
  }

  const fetchCredits = async () => {
    try {
      const response = await api.get('/photos/credits')
      setCredits(response.data.credits)
    } catch (err) {
      console.error('Erreur chargement crédits:', err)
      setCredits({
        monthly_credits: 0,
        purchased_credits: 0,
        total_available: 0,
        credits_used_this_month: 0,
        total_credits_used: 0
      })
    }
  }

  // [AI:Claude] Filtrer les photos affichées
  const getFilteredPhotos = () => {
    return photos.filter(photo => {
      // Filtre par projet
      if (filters.project && photo.project_id !== parseInt(filters.project))
        return false

      // Filtre par type
      if (filters.type && photo.item_type !== filters.type)
        return false

      // Filtre par style/ambiance
      if (filters.style && photo.ai_style !== filters.style)
        return false

      return true
    })
  }

  // [AI:Claude] Extraire les valeurs uniques pour les filtres
  const getUniqueTypes = () => {
    const types = photos.map(p => p.item_type).filter(Boolean)
    return [...new Set(types)].sort()
  }

  const getUniqueStyles = () => {
    const styles = photos.map(p => p.ai_style).filter(Boolean)
    return [...new Set(styles)].sort()
  }

  // [AI:Claude] Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({ project: '', type: '', style: '' })
  }

  // [AI:Claude] Upload d'une photo
  const handleUpload = async (e) => {
    e.preventDefault()
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('photo', uploadData.photo)
      formData.append('item_name', uploadData.item_name)
      formData.append('item_type', uploadData.item_type)
      formData.append('technique', uploadData.technique)
      formData.append('description', uploadData.description || '')

      const response = await api.post('/photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const newPhoto = response.data.photo
      setPhotos([newPhoto, ...photos])

      setUploadData({
        photo: null,
        item_name: '',
        item_type: '',
        technique: '',
        description: ''
      })
      setShowUploadModal(false)

      console.log('Photo uploadée avec succès:', newPhoto)
    } catch (err) {
      console.error('Erreur upload:', err)
      alert(err.response?.data?.error || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  // [AI:Claude] Embellir avec IA - v0.11.0 génération multiple
  const handleEnhance = async (e) => {
    e.preventDefault()

    if (!selectedPhoto) return

    const quantity = enhanceData.contexts.length
    if (quantity === 0) {
      alert('Veuillez sélectionner vos contextes')
      return
    }

    if (quantity !== enhanceData.quantity) {
      alert(`Veuillez sélectionner exactement ${enhanceData.quantity} contexte${enhanceData.quantity > 1 ? 's' : ''}`)
      return
    }

    // [AI:Claude] Calculer le coût (5 photos = 4 crédits, sinon 1 crédit/photo)
    const cost = quantity === 5 ? 4 : quantity

    if (!credits || credits.total_available < cost) {
      alert(`Vous n'avez pas assez de crédits. Nécessaire: ${cost}, Disponible: ${credits?.total_available || 0}`)
      return
    }

    setEnhancing(true)
    setGenerationProgress({
      current: 0,
      total: quantity,
      status: enhanceData.contexts.map(ctx => ({ context: ctx, status: 'pending', time: 0 }))
    })

    try {
      // [AI:Claude] MODE SIMULATION pour démo (Gemini bloqué en France)
      await simulateMultipleGeneration(quantity)

      // [AI:Claude] Code production (décommenter en prod):
      /*
      const response = await api.post(`/photos/${selectedPhoto.id}/enhance-multiple`, {
        contexts: enhanceData.contexts,
        project_category: enhanceData.project_category,
        custom_instructions: enhanceData.custom_instructions || null
      })

      const updatedPhoto = response.data.photo
      setPhotos(photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p))
      setCredits({
        ...credits,
        total_available: response.data.credits_remaining
      })
      */

      setShowEnhanceModal(false)
      setSelectedPhoto(null)

      alert(`✨ ${quantity} photo${quantity > 1 ? 's' : ''} générée${quantity > 1 ? 's' : ''} avec succès !\n${credits.total_available - cost} crédits restants.`)
    } catch (err) {
      console.error('Erreur génération IA:', err)
      alert(err.response?.data?.error || 'Erreur lors de la génération IA')
    } finally {
      setEnhancing(false)
    }
  }

  // [AI:Claude] Simulation de génération multiple (MODE DÉMO)
  const simulateMultipleGeneration = async (quantity) => {
    for (let i = 0; i < quantity; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setGenerationProgress(prev => ({
        ...prev,
        current: i + 1,
        status: prev.status.map((s, idx) =>
          idx === i ? { ...s, status: 'completed', time: Math.floor(Math.random() * 3000 + 2000) } :
          idx === i + 1 ? { ...s, status: 'generating' } : s
        )
      }))
    }
  }

  // [AI:Claude] Supprimer une photo
  const handleDelete = async (photoId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?'))
      return

    try {
      await api.delete(`/photos/${photoId}`)
      setPhotos(photos.filter(p => p.id !== photoId))
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    }
  }

  // [AI:Claude] Ouvrir modal d'embellissement avec détection auto
  const openEnhanceModal = (photo) => {
    setSelectedPhoto(photo)

    // [AI:Claude] Détecter la catégorie depuis item_type
    const category = detectProjectCategory(photo.item_type || '')

    setEnhanceData({
      quantity: 1,
      contexts: [],
      project_category: category,
      custom_instructions: ''
    })
    setShowEnhanceModal(true)
  }

  // [AI:Claude] Détection intelligente de la catégorie
  const detectProjectCategory = (itemType) => {
    const lower = itemType.toLowerCase()

    if (lower.match(/bonnet|écharpe|pull|chaussette|gilet|châle|snood|mitaine/))
      return 'wearable'

    if (lower.match(/amigurumi|peluche|doudou|poupée|ours|animal/))
      return 'amigurumi'

    if (lower.match(/sac|pochette|trousse|panier|cabas/))
      return 'accessory'

    if (lower.match(/couverture|plaid|coussin|tapis|déco|nappe/))
      return 'home_decor'

    return 'other'
  }

  // [AI:Claude] Contextes par catégorie de projet - v0.11.0 enrichis
  const contextsByCategory = {
    wearable: [
      { key: 'worn_model', label: 'Sur modèle', icon: '👤', desc: 'Porté par une personne' },
      { key: 'mannequin', label: 'Sur mannequin', icon: '🪑', desc: 'Mise en scène élégante' },
      { key: 'outdoor_winter', label: 'Extérieur hiver', icon: '🌲', desc: 'Forêt, parc, neige' },
      { key: 'outdoor_spring', label: 'Extérieur printemps', icon: '🌸', desc: 'Jardin, fleurs, doux' },
      { key: 'cozy_indoor', label: 'Intérieur cosy', icon: '🏠', desc: 'Canapé, plaid, thé' },
      { key: 'flat_lay', label: 'Flat lay', icon: '📐', desc: 'À plat avec accessoires' },
      { key: 'mirror_selfie', label: 'Miroir selfie', icon: '🪞', desc: 'Style mode lifestyle' },
      { key: 'urban_street', label: 'Urbain', icon: '🏙️', desc: 'Rue, ville, tendance' },
      { key: 'studio_white', label: 'Studio fond blanc', icon: '✨', desc: 'Pro e-commerce' }
    ],
    amigurumi: [
      { key: 'kids_room', label: 'Chambre enfant', icon: '🛏️', desc: 'Sur lit, étagère colorée' },
      { key: 'play_scene', label: 'Scène de jeu', icon: '🧸', desc: 'Mise en scène créative' },
      { key: 'nature_garden', label: 'Nature/jardin', icon: '🌳', desc: 'Herbe, fleurs, arbres' },
      { key: 'cafe_trendy', label: 'Café trendy', icon: '☕', desc: 'Table bois, décor Instagram' },
      { key: 'flat_lay', label: 'Flat lay', icon: '📐', desc: 'Fond neutre, accessoires' },
      { key: 'held_hands', label: 'Dans les mains', icon: '🤲', desc: 'Tenu avec amour' },
      { key: 'shelf_display', label: 'Sur étagère', icon: '📚', desc: 'Décoration rangée' },
      { key: 'picnic_outdoor', label: 'Pique-nique', icon: '🧺', desc: 'Nappe, extérieur, doux' }
    ],
    accessory: [
      { key: 'in_use', label: 'En utilisation', icon: '👜', desc: 'Porté, main tenant' },
      { key: 'urban_lifestyle', label: 'Urbain lifestyle', icon: '🌆', desc: 'Rue, café, boutique' },
      { key: 'product_white', label: 'Fond blanc produit', icon: '📐', desc: 'E-commerce' },
      { key: 'scandinavian', label: 'Scandinave', icon: '🏠', desc: 'Table bois, minimaliste' },
      { key: 'nature_flowers', label: 'Nature/fleurs', icon: '🌸', desc: 'Jardin, parc, douceur' },
      { key: 'flat_lay_styled', label: 'Flat lay stylisé', icon: '✨', desc: 'Composition esthétique' },
      { key: 'beach_vacation', label: 'Plage/vacances', icon: '🏖️', desc: 'Sable, été, détente' },
      { key: 'coffee_shop', label: 'Coffee shop', icon: '☕', desc: 'Ambiance café cosy' }
    ],
    home_decor: [
      { key: 'on_sofa', label: 'Sur canapé/lit', icon: '🛋️', desc: 'En utilisation réaliste' },
      { key: 'scandinavian', label: 'Scandinave', icon: '🏠', desc: 'Lumineux, épuré' },
      { key: 'with_plants', label: 'Avec plantes', icon: '🪴', desc: 'Bohème, naturel' },
      { key: 'natural_light', label: 'Lumière naturelle', icon: '🌅', desc: 'Fenêtre, doux' },
      { key: 'flat_lay_texture', label: 'Flat lay texture', icon: '📐', desc: 'Gros plan matière' },
      { key: 'cozy_bedroom', label: 'Chambre cosy', icon: '🛏️', desc: 'Lit, coussins, douceur' },
      { key: 'modern_living', label: 'Salon moderne', icon: '🪟', desc: 'Design contemporain' },
      { key: 'rustic_cottage', label: 'Cottage rustique', icon: '🏡', desc: 'Charme campagne' }
    ],
    other: [
      { key: 'lifestyle', label: 'Lifestyle Instagram', icon: '🌟', desc: 'Lumière naturelle, tendance' },
      { key: 'studio', label: 'Studio Pro', icon: '✨', desc: 'Fond blanc, éclairage parfait' },
      { key: 'scandinavian', label: 'Scandinave', icon: '🎨', desc: 'Minimaliste, tons neutres' },
      { key: 'nature', label: 'Nature', icon: '🌲', desc: 'Extérieur, lumière jour' },
      { key: 'cafe', label: 'Café Trendy', icon: '☕', desc: 'Ambiance café Instagram' },
      { key: 'flat_lay', label: 'Flat lay', icon: '📐', desc: 'À plat, vue du dessus' },
      { key: 'bokeh_background', label: 'Fond bokeh', icon: '✨', desc: 'Flou artistique' },
      { key: 'vintage_retro', label: 'Vintage rétro', icon: '📻', desc: 'Style années passées' }
    ]
  }

  // [AI:Claude] Changer la quantité (reset les contextes)
  const changeQuantity = (newQuantity) => {
    setEnhanceData({
      ...enhanceData,
      quantity: newQuantity,
      contexts: [] // [AI:Claude] Reset les contextes quand on change la quantité
    })
  }

  // [AI:Claude] Toggle contexte
  const toggleContext = (contextKey) => {
    if (enhanceData.contexts.includes(contextKey)) {
      setEnhanceData({
        ...enhanceData,
        contexts: enhanceData.contexts.filter(c => c !== contextKey)
      })
    } else {
      if (enhanceData.contexts.length >= enhanceData.quantity) {
        alert(`Maximum ${enhanceData.quantity} contexte${enhanceData.quantity > 1 ? 's' : ''}`)
        return
      }
      setEnhanceData({
        ...enhanceData,
        contexts: [...enhanceData.contexts, contextKey]
      })
    }
  }

  // [AI:Claude] Calculer le coût
  const calculateCost = () => {
    const quantity = enhanceData.quantity
    return quantity === 5 ? 4 : quantity
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📸 Ma Galerie</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Toutes mes créations en photo
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos photos...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filtres modernes */}
      {!loading && !error && photos.length > 0 && (
        <div className="mb-6">
          {/* Bouton reset */}
          {(filters.project || filters.type || filters.style) && (
            <div className="flex justify-end mb-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium text-sm transition flex items-center gap-2"
              >
                ✕ Réinitialiser
              </button>
            </div>
          )}

          {/* Filtres par projet */}
          {projects.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📂 Projets</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ ...filters, project: '' })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    !filters.project
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-400'
                  }`}
                >
                  Tous
                </button>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setFilters({ ...filters, project: project.id.toString() })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      filters.project === project.id.toString()
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtres par type */}
          {getUniqueTypes().length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🧶 Type d'ouvrage</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ ...filters, type: '' })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    !filters.type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  Tous
                </button>
                {getUniqueTypes().map(type => (
                  <button
                    key={type}
                    onClick={() => setFilters({ ...filters, type })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      filters.type === type
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtres par style/ambiance */}
          {getUniqueStyles().length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">✨ Style & Ambiance</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters({ ...filters, style: '' })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    !filters.style
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                  }`}
                >
                  Tous
                </button>
                {getUniqueStyles().map(style => (
                  <button
                    key={style}
                    onClick={() => setFilters({ ...filters, style })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      filters.style === style
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-purple-400'
                    }`}
                  >
                    {style.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Galerie de photos IA */}
      {!loading && !error && (
        <>
          {photos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune photo IA générée
              </h3>
              <p className="text-gray-600 mb-6">
                Allez dans vos projets pour générer vos premières photos professionnelles avec l'IA
              </p>
              <Link
                to="/my-projects"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                📂 Voir mes projets
              </Link>
            </div>
          ) : getFilteredPhotos().length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun résultat
              </h3>
              <p className="text-gray-600 mb-4">
                Aucune photo ne correspond à vos critères
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredPhotos().map(photo => (
                <div
                  key={photo.id}
                  className="relative rounded-lg overflow-hidden group aspect-square bg-gray-100"
                >
                  {/* Photo IA générée */}
                  <img
                    src={`http://patron-maker.local${photo.enhanced_path}`}
                    alt={photo.item_name || 'Photo IA'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => window.open(`http://patron-maker.local${photo.enhanced_path}`, '_blank')}
                    onError={(e) => {
                      console.error('Erreur chargement image:', photo.enhanced_path)
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage manquante%3C/text%3E%3C/svg%3E'
                    }}
                  />

                  {/* Overlay avec actions au hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Info en haut */}
                    <div className="absolute top-3 right-3 left-3">
                      <p className="text-white text-sm font-semibold drop-shadow-lg line-clamp-1">
                        {photo.item_name || 'Sans nom'}
                      </p>
                    </div>

                    {/* Boutons en bas */}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      {/* Boutons principaux */}
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`http://patron-maker.local${photo.enhanced_path}`, '_blank')
                          }}
                          className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition text-sm shadow-lg"
                        >
                          📥 Télécharger
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(photo.id)
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-lg"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Boutons partage réseaux sociaux */}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-white text-xs font-medium mr-1">Partager:</span>

                        {/* Instagram */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const url = `http://patron-maker.local${photo.enhanced_path}`

                            // [AI:Claude] Sur mobile, utiliser Web Share API
                            if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                              try {
                                // Récupérer l'image en blob
                                const response = await fetch(url)
                                const blob = await response.blob()
                                const file = new File([blob], `${photo.item_name || 'photo'}.jpg`, { type: 'image/jpeg' })

                                await navigator.share({
                                  files: [file],
                                  title: photo.item_name || 'Ma photo tricot/crochet',
                                  text: `Découvrez mon ${photo.item_name || 'ouvrage'} ! 🧶✨`
                                })
                              } catch (err) {
                                if (err.name !== 'AbortError') {
                                  console.error('Erreur partage:', err)
                                  alert('Impossible de partager. Téléchargement de l\'image...')
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = `${photo.item_name || 'photo'}-instagram.jpg`
                                  link.click()
                                }
                              }
                            } else {
                              // Desktop : télécharger l'image
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `${photo.item_name || 'photo'}-instagram.jpg`
                              link.click()
                              alert('📸 Image téléchargée !')
                            }
                          }}
                          className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs font-bold"
                          title="Partager sur Instagram"
                        >
                          IG
                        </button>

                        {/* TikTok */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const url = `http://patron-maker.local${photo.enhanced_path}`

                            // [AI:Claude] Sur mobile, utiliser Web Share API
                            if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                              try {
                                // Récupérer l'image en blob
                                const response = await fetch(url)
                                const blob = await response.blob()
                                const file = new File([blob], `${photo.item_name || 'photo'}.jpg`, { type: 'image/jpeg' })

                                await navigator.share({
                                  files: [file],
                                  title: photo.item_name || 'Ma photo tricot/crochet',
                                  text: `Découvrez mon ${photo.item_name || 'ouvrage'} ! 🧶✨`
                                })
                              } catch (err) {
                                if (err.name !== 'AbortError') {
                                  console.error('Erreur partage:', err)
                                  alert('Impossible de partager. Téléchargement de l\'image...')
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = `${photo.item_name || 'photo'}-tiktok.jpg`
                                  link.click()
                                }
                              }
                            } else {
                              // Desktop : télécharger l'image
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `${photo.item_name || 'photo'}-tiktok.jpg`
                              link.click()
                              alert('📸 Image téléchargée !')
                            }
                          }}
                          className="w-8 h-8 bg-black hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs font-bold"
                          title="Partager sur TikTok"
                        >
                          TT
                        </button>

                        {/* Pinterest */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const url = `http://patron-maker.local${photo.enhanced_path}`
                            const description = photo.item_name || 'Photo tricot/crochet'
                            window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`, '_blank')
                          }}
                          className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs"
                          title="Partager sur Pinterest"
                        >
                          📌
                        </button>

                        {/* Facebook */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')
                          }}
                          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs font-bold"
                          title="Partager sur Facebook"
                        >
                          f
                        </button>

                        {/* Twitter/X */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const text = `Découvrez mon ${photo.item_name || 'ouvrage'} ! 🧶✨`
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank')
                          }}
                          className="w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs font-bold"
                          title="Partager sur X (Twitter)"
                        >
                          𝕏
                        </button>

                        {/* Copier lien */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const url = `http://patron-maker.local${photo.enhanced_path}`
                            try {
                              await navigator.clipboard.writeText(url)
                              alert('Lien copié dans le presse-papier !')
                            } catch (err) {
                              console.error('Erreur copie:', err)
                              alert('Impossible de copier le lien')
                            }
                          }}
                          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs"
                          title="Copier le lien"
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">📷 Uploader une photo</h2>
              <p className="text-sm text-gray-600 mt-1">
                Ajoutez une photo de votre ouvrage à embellir avec l'IA
              </p>
            </div>

            <form onSubmit={handleUpload} className="p-6">
              {/* Fichier photo */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setUploadData({ ...uploadData, photo: e.target.files[0] })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formats: JPG, PNG, WEBP • Max 10 MB
                </p>
              </div>

              {/* Nom de l'ouvrage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'ouvrage <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={uploadData.item_name}
                  onChange={(e) => setUploadData({ ...uploadData, item_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Mon bonnet rouge"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Type d'ouvrage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'ouvrage <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={uploadData.item_type}
                    onChange={(e) => setUploadData({ ...uploadData, item_type: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    <optgroup label="🧢 Vêtements">
                      <option value="bonnet">Bonnet</option>
                      <option value="écharpe">Écharpe</option>
                      <option value="pull">Pull</option>
                      <option value="chaussettes">Chaussettes</option>
                      <option value="snood">Snood</option>
                    </optgroup>
                    <optgroup label="🧸 Amigurumis">
                      <option value="amigurumi">Amigurumi</option>
                      <option value="peluche">Peluche</option>
                      <option value="doudou">Doudou</option>
                    </optgroup>
                    <optgroup label="👜 Accessoires">
                      <option value="sac">Sac</option>
                      <option value="pochette">Pochette</option>
                      <option value="trousse">Trousse</option>
                    </optgroup>
                    <optgroup label="🏠 Déco maison">
                      <option value="couverture">Couverture</option>
                      <option value="plaid">Plaid</option>
                      <option value="coussin">Coussin</option>
                    </optgroup>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                {/* Technique */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technique
                  </label>
                  <select
                    value={uploadData.technique}
                    onChange={(e) => setUploadData({ ...uploadData, technique: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="crochet">🪡 Crochet</option>
                    <option value="tricot">🧶 Tricot</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Bonnet slouchy en laine mérinos, fait main"
                />
              </div>

              {/* Boutons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {uploading ? 'Upload...' : '📤 Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'embellissement IA - v0.11.0 WORKFLOW OPTIMISÉ */}
      {showEnhanceModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-5xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
              <h2 className="text-2xl font-bold text-gray-900">✨ Générer vos photos IA</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPhoto.item_name} • Type: {selectedPhoto.item_type || 'Autre'}
              </p>
            </div>

            <form onSubmit={handleEnhance} className="p-6">
              {/* Photo actuelle */}
              <div className="mb-6 bg-gray-100 rounded-lg border-2 border-gray-200 p-4">
                <img
                  src={`http://patron-maker.local${selectedPhoto.original_path}`}
                  alt={selectedPhoto.item_name}
                  className="max-h-48 w-auto object-contain rounded-lg mx-auto"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage manquante%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>

              {/* ÉTAPE 1 : Choisir la quantité */}
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  1️⃣ Combien de photos voulez-vous générer ?
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map(qty => {
                    const cost = qty === 5 ? 4 : qty
                    return (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => changeQuantity(qty)}
                        className={`p-4 border-2 rounded-lg transition ${
                          enhanceData.quantity === qty
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl font-bold text-gray-900 mb-1">{qty}</div>
                        <div className="text-xs text-gray-600">
                          {cost} crédit{cost > 1 ? 's' : ''}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ÉTAPE 2 : Sélection des contextes */}
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  2️⃣ Choisissez {enhanceData.quantity} style{enhanceData.quantity > 1 ? 's' : ''} de photo
                  <span className="ml-2 text-purple-600 font-normal text-sm">
                    ({enhanceData.contexts.length}/{enhanceData.quantity} sélectionné{enhanceData.contexts.length > 1 ? 's' : ''})
                  </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(contextsByCategory[enhanceData.project_category] || contextsByCategory.other).map(ctx => (
                    <button
                      key={ctx.key}
                      type="button"
                      onClick={() => toggleContext(ctx.key)}
                      disabled={!enhanceData.contexts.includes(ctx.key) && enhanceData.contexts.length >= enhanceData.quantity}
                      className={`p-3 border-2 rounded-lg text-left transition ${
                        enhanceData.contexts.includes(ctx.key)
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-2xl">{ctx.icon}</span>
                        <span className="font-medium text-gray-900 text-sm flex-1">{ctx.label}</span>
                        {enhanceData.contexts.includes(ctx.key) && (
                          <span className="text-purple-600 text-lg">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-tight">{ctx.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ÉTAPE 3 : Instructions personnalisées */}
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  3️⃣ Instructions personnalisées (optionnel)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Précisez des détails pour affiner le résultat : couleurs, ambiance, éléments à inclure...
                </p>
                <textarea
                  value={enhanceData.custom_instructions}
                  onChange={(e) => setEnhanceData({ ...enhanceData, custom_instructions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="Ex: Ambiance chaleureuse avec lumière dorée, ajouter des fleurs séchées à côté, tons beiges et naturels..."
                />
              </div>

              {/* Progression de génération */}
              {enhancing && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-900">🎨 Génération en cours...</h4>
                    <span className="text-sm text-blue-700">
                      {generationProgress.current}/{generationProgress.total}
                    </span>
                  </div>

                  <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    ></div>
                  </div>

                  <div className="space-y-1">
                    {generationProgress.status.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {s.status === 'completed' && '✅'}
                          {s.status === 'generating' && '⏳'}
                          {s.status === 'pending' && '⏸️'}
                          {' '}Photo {idx + 1}
                        </span>
                        {s.status === 'completed' && (
                          <span className="text-xs text-gray-500">({(s.time / 1000).toFixed(1)}s)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé */}
              {!enhancing && credits && enhanceData.contexts.length > 0 && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        💎 {enhanceData.quantity} photo{enhanceData.quantity > 1 ? 's' : ''} = {calculateCost()} crédit{calculateCost() > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {enhanceData.quantity === 5 && '🎉 Promo: 5 photos = 4 crédits (-20%)'}
                        {enhanceData.quantity < 5 && credits.total_available >= calculateCost() && `Il vous restera ${credits.total_available - calculateCost()} crédits`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{credits.total_available}</div>
                      <div className="text-xs text-gray-600">disponibles</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEnhanceModal(false)
                    setSelectedPhoto(null)
                  }}
                  disabled={enhancing}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    enhancing ||
                    enhanceData.contexts.length !== enhanceData.quantity ||
                    !credits ||
                    credits.total_available < calculateCost()
                  }
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enhancing
                    ? '✨ Génération...'
                    : enhanceData.contexts.length !== enhanceData.quantity
                    ? `Sélectionnez ${enhanceData.quantity - enhanceData.contexts.length} contexte${(enhanceData.quantity - enhanceData.contexts.length) > 1 ? 's' : ''} de plus`
                    : `✨ Générer ${enhanceData.quantity} photo${enhanceData.quantity > 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
