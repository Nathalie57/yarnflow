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
import { useImagePreview } from '../hooks/useImagePreview'
import api from '../services/api'

const Gallery = () => {
  const { user } = useAuth()
  const {
    previewImage,
    isGeneratingPreview,
    previewError,
    previewContext,
    generatePreview,
    clearPreview
  } = useImagePreview()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [credits, setCredits] = useState(null)

  // [AI:Claude] Détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false)

  // [AI:Claude] Recherche
  const [searchQuery, setSearchQuery] = useState('')

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

  // [AI:Claude] Embellissement IA - v0.12.1 SIMPLIFIÉ (1 photo, preset auto)
  const [selectedContext, setSelectedContext] = useState(null) // [AI:Claude] Contexte auto-sélectionné
  const [enhancing, setEnhancing] = useState(false)

  // [AI:Claude] Détecter mobile au montage
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches ||
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // [AI:Claude] Charger les photos et crédits au montage
  useEffect(() => {
    fetchPhotos()
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

  // [AI:Claude] Filtrer les photos par recherche
  const getFilteredPhotos = () => {
    return photos.filter(photo => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = photo.item_name?.toLowerCase().includes(query)
        const matchType = photo.item_type?.toLowerCase().includes(query)
        const matchStyle = photo.ai_style?.toLowerCase().includes(query)
        const matchDescription = photo.description?.toLowerCase().includes(query)
        const matchTechnique = photo.technique?.toLowerCase().includes(query)

        if (!matchName && !matchType && !matchStyle && !matchDescription && !matchTechnique)
          return false
      }
      return true
    })
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

  // [AI:Claude] Générer une preview gratuite
  const handleGeneratePreview = async () => {
    if (!selectedPhoto || !selectedContext) return

    const result = await generatePreview(selectedPhoto.id, selectedContext.key)

    if (!result.success) {
      alert(result.error || 'Erreur lors de la génération de la preview')
    }
  }

  // [AI:Claude] Embellir avec IA - v0.12.1 SIMPLIFIÉ
  const handleEnhance = async (e) => {
    e.preventDefault()

    if (!selectedPhoto || !selectedContext) return

    // [AI:Claude] Vérifier les crédits (1 photo = 1 crédit)
    if (!credits || credits.total_available < 1) {
      alert(`Vous n'avez pas assez de crédits. Il vous faut 1 crédit.`)
      return
    }

    setEnhancing(true)

    try {
      // [AI:Claude] Utiliser le context de la preview si disponible, sinon le context sélectionné
      const contextToUse = previewContext || selectedContext.key

      // [AI:Claude] Appel API pour génération HD avec le même context que la preview
      const response = await api.post(`/photos/${selectedPhoto.id}/enhance-multiple`, {
        contexts: [contextToUse],
        project_category: detectProjectCategory(selectedPhoto.item_type || '')
      })

      await fetchPhotos()
      await fetchCredits()
      setShowEnhanceModal(false)
      setSelectedPhoto(null)
      clearPreview()

      alert(`✨ Photo générée avec succès !`)
    } catch (err) {
      console.error('Erreur génération IA:', err)
      alert(err.response?.data?.error || 'Erreur lors de la génération IA')
    } finally {
      setEnhancing(false)
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

  // [AI:Claude] Ouvrir modal d'embellissement avec sélection du premier style par défaut
  const openEnhanceModal = (photo) => {
    setSelectedPhoto(photo)
    clearPreview() // [AI:Claude] Réinitialiser la preview
    const category = detectProjectCategory(photo.item_type || '')
    const styles = stylesByCategory[category] || stylesByCategory.other
    setSelectedContext(styles[0]) // Premier style par défaut
    setShowEnhanceModal(true)
  }

  // [AI:Claude] Détection intelligente de la catégorie
  const detectProjectCategory = (itemType) => {
    const lower = itemType.toLowerCase()

    // [AI:Claude] Nouvelles catégories depuis la base de données
    if (lower === 'vêtements' || lower === 'vetements')
      return 'wearable'

    if (lower === 'accessoires bébé' || lower === 'accessoires bebe')
      return 'wearable'

    if (lower === 'jouets/peluches')
      return 'amigurumi'

    if (lower === 'accessoires')
      return 'accessory'

    if (lower === 'maison/déco' || lower === 'maison/deco')
      return 'home_decor'

    // [AI:Claude] Détection par mots-clés (fallback)
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

  // [AI:Claude] 3 styles simplifiés par catégorie - v0.12.1
  const stylesByCategory = {
    wearable: [
      { key: 'worn_model', label: 'Sur modèle', icon: '👤', desc: 'Porté par une personne' },
      { key: 'studio_white', label: 'Studio blanc', icon: '✨', desc: 'Fond blanc professionnel' },
      { key: 'flat_lay', label: 'Flat lay', icon: '📐', desc: 'À plat avec accessoires' }
    ],
    amigurumi: [
      { key: 'play_scene', label: 'Scène de jeu', icon: '🧸', desc: 'Mise en scène créative' },
      { key: 'kids_room', label: 'Chambre d\'enfant', icon: '🛏️', desc: 'Sur lit, étagère colorée' },
      { key: 'flat_lay', label: 'Flat lay', icon: '📐', desc: 'Fond neutre propre' }
    ],
    accessory: [
      { key: 'in_use', label: 'En utilisation', icon: '👜', desc: 'Porté ou tenu' },
      { key: 'product_white', label: 'Fond blanc', icon: '✨', desc: 'Style e-commerce' },
      { key: 'flat_lay_styled', label: 'Flat lay', icon: '📐', desc: 'Composition esthétique' }
    ],
    home_decor: [
      { key: 'on_sofa', label: 'Sur canapé', icon: '🛋️', desc: 'En utilisation réaliste' },
      { key: 'scandinavian', label: 'Scandinave', icon: '🏠', desc: 'Lumineux épuré' },
      { key: 'flat_lay_texture', label: 'Flat lay', icon: '📐', desc: 'Texture gros plan' }
    ],
    other: [
      { key: 'studio_white', label: 'Fond blanc', icon: '✨', desc: 'Professionnel fond blanc pur' },
      { key: 'lifestyle', label: 'Lifestyle', icon: '🌟', desc: 'Ambiance chaleureuse naturelle' },
      { key: 'nature', label: 'Nature', icon: '🌿', desc: 'Tons verts extérieur' }
    ]
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

      {/* Crédits IA disponibles */}
      {credits && (
        <div className="mb-6 bg-gradient-to-r from-primary-50 to-primary-50 border-2 border-primary-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Crédits Photos IA</h3>
                  <p className="text-sm text-gray-600">
                    {user?.subscription_type === 'free' || !user?.subscription_type
                      ? 'Plan FREE : 5 photos/mois'
                      : 'Plan PRO : 75 photos/mois'}
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 ml-11">
                <span className="text-4xl font-bold text-primary-600">{credits.total_available}</span>
                <span className="text-gray-600">crédits disponibles</span>
              </div>
              {credits.credits_used_this_month > 0 && (
                <p className="text-xs text-gray-500 mt-2 ml-11">
                  {credits.credits_used_this_month} utilisés ce mois-ci
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {credits.total_available === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ Vous n'avez plus de crédits
                  </p>
                </div>
              )}

              {(!user?.subscription_type || user?.subscription_type === 'free') ? (
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition shadow-md hover:shadow-lg"
                >
                  🚀 Passer à PRO (30 crédits/mois)
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                  title="Recharge automatique le 1er du mois"
                >
                  ✅ Abonnement PRO actif
                </button>
              )}

              <p className="text-xs text-center text-gray-500">
                Recharge auto le 1er du mois
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Barre de recherche */}
      {!loading && !error && photos.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, type, style..."
              className="w-full pl-11 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                title="Effacer la recherche"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
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
                Aucune photo ne correspond à votre recherche "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
              >
                Effacer la recherche
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
                    src={`${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`}
                    alt={photo.item_name || 'Photo IA'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => window.open(`${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`, '_blank')}
                    onError={(e) => {
                      console.error('Erreur chargement image:', photo.enhanced_path)
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage manquante%3C/text%3E%3C/svg%3E'
                    }}
                  />

                  {/* Overlay avec actions au hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Info en haut */}
                    <div className="absolute top-3 right-3 left-3">
                      <p className="text-white text-sm font-bold drop-shadow-lg line-clamp-1">
                        {photo.item_name || 'Sans nom'}
                      </p>
                    </div>

                    {/* Boutons en bas */}
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      {/* Boutons principaux */}
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`, '_blank')
                            }}
                            className="flex-1 px-4 py-2 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                          >
                            📥 Télécharger
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(photo.id)
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>

                        {/* Bouton "Définir comme photo de couverture" si photo liée à un projet */}
                        {photo.project_id && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                await api.put(`/projects/${photo.project_id}/set-cover-photo`, {
                                  photo_id: photo.id
                                })
                                alert('✅ Photo de couverture mise à jour !')
                              } catch (err) {
                                console.error('Erreur:', err)
                                alert('❌ Erreur lors de la mise à jour')
                              }
                            }}
                            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
                            title="Définir comme photo de couverture du projet"
                          >
                            📸 Définir comme couverture
                          </button>
                        )}
                      </div>

                      {/* Boutons partage réseaux sociaux */}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-white text-xs font-medium mr-1">Partager:</span>

                        {/* Instagram */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`

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
                          className="w-8 h-8 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-300"
                          title="Partager sur Instagram"
                        >
                          IG
                        </button>

                        {/* TikTok */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`

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
                            const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`
                            const description = photo.item_name || 'Photo tricot/crochet'
                            window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`, '_blank')
                          }}
                          className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs focus:outline-none focus:ring-2 focus:ring-red-300"
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
                          className="w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-300"
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
                            const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`
                            try {
                              await navigator.clipboard.writeText(url)
                              alert('Lien copié dans le presse-papier !')
                            } catch (err) {
                              console.error('Erreur copie:', err)
                              alert('Impossible de copier le lien')
                            }
                          }}
                          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition shadow-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photo <span className="text-red-600">*</span>
                </label>

                {/* Inputs cachés */}
                <input
                  ref={(el) => (window.cameraInputGallery = el)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={(e) => setUploadData({ ...uploadData, photo: e.target.files[0] })}
                  className="hidden"
                />
                <input
                  ref={(el) => (window.galleryInputGallery = el)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setUploadData({ ...uploadData, photo: e.target.files[0] })}
                  className="hidden"
                />

                {/* Boutons visibles */}
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-2`}>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => window.cameraInputGallery?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <span className="text-xl">📷</span>
                      <span className="font-medium">Prendre une photo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.galleryInputGallery?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    <span className="text-xl">🖼️</span>
                    <span className="font-medium">Choisir une photo</span>
                  </button>
                </div>

                {uploadData.photo && (
                  <p className="text-sm text-green-600 mb-2">
                    ✓ {uploadData.photo.name}
                  </p>
                )}

                <p className="text-xs text-gray-500">
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
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-primary-300"
                >
                  {uploading ? 'Upload...' : '📤 Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'embellissement IA - v0.12.1 SIMPLIFIÉ */}
      {showEnhanceModal && selectedPhoto && selectedContext && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-900">✨ Générer une photo IA</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPhoto.item_name}
              </p>
            </div>

            <form onSubmit={handleEnhance} className="p-6">
              {/* Photo actuelle (remplacée par preview pendant génération HD) */}
              <div className={`mb-6 rounded-lg border-2 p-4 relative ${enhancing && previewImage ? 'bg-green-50 border-green-400' : 'bg-gray-100 border-gray-200'}`}>
                {enhancing && previewImage && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Upscaling en cours...
                  </div>
                )}
                <img
                  src={(enhancing && previewImage) ? previewImage : `${import.meta.env.VITE_BACKEND_URL}${selectedPhoto.original_path}`}
                  alt={selectedPhoto.item_name}
                  className="max-h-48 w-auto object-contain rounded-lg mx-auto"
                  onError={(e) => {
                    if (!(enhancing && previewImage)) {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage manquante%3C/text%3E%3C/svg%3E'
                    }
                  }}
                />
              </div>

              {/* Choix du style */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choisissez un style :
                </label>
                <div className="space-y-2">
                  {(stylesByCategory[detectProjectCategory(selectedPhoto.item_type || '')] || stylesByCategory.other).map(style => (
                    <label
                      key={style.key}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                        selectedContext?.key === style.key
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="style"
                        value={style.key}
                        checked={selectedContext?.key === style.key}
                        onChange={() => setSelectedContext(style)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-2xl">{style.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{style.label}</p>
                        <p className="text-sm text-gray-600">{style.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Zone de preview */}
              {previewImage && !enhancing && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    ✨ Aperçu (preview gratuite)
                  </h3>
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Preview IA"
                      className="w-full h-auto rounded-lg border-2 border-primary-300"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      0 crédit
                    </div>
                  </div>
                  <p className="text-xs text-green-700 mt-2 font-medium">
                    ✓ L'image HD sera générée à partir de cette preview en haute résolution
                  </p>
                </div>
              )}

              {/* Erreur preview */}
              {previewError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{previewError}</p>
                </div>
              )}

              {/* Progression de génération HD */}
              {enhancing && (
                <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <div>
                      <h4 className="font-semibold text-primary-900">🎨 Génération HD en cours...</h4>
                      <p className="text-sm text-gray-600">Cela peut prendre quelques secondes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Résumé des crédits - uniquement si preview existe */}
              {!enhancing && previewImage && credits && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        💎 Génération HD = 1 crédit
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Il vous restera {credits.total_available - 1} crédit{credits.total_available - 1 > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">{credits.total_available}</div>
                      <div className="text-xs text-gray-600">disponible{credits.total_available > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="flex items-center gap-3">
                {!previewImage ? (
                  // Bouton Preview gratuite
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEnhanceModal(false)
                        setSelectedPhoto(null)
                        clearPreview()
                      }}
                      disabled={isGeneratingPreview}
                      className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      disabled={!selectedContext || isGeneratingPreview}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingPreview ? (
                        <>🔄 Génération preview...</>
                      ) : (
                        <>✨ Aperçu gratuit (0 crédit)</>
                      )}
                    </button>
                  </>
                ) : (
                  // Après preview : boutons Nouvelle preview + HD
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEnhanceModal(false)
                        setSelectedPhoto(null)
                        clearPreview()
                      }}
                      disabled={enhancing}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      disabled={enhancing || isGeneratingPreview}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isGeneratingPreview ? '🔄 Génération...' : '🔄 Nouvelle preview'}
                    </button>
                    <button
                      type="submit"
                      disabled={enhancing || !credits || credits.total_available < 1}
                      className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {enhancing ? '⏳ Génération HD...' : '🎨 Générer en HD (1 crédit)'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
