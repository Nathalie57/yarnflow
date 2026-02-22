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

import { useState, useEffect, useRef } from 'react'
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

  // [AI:Claude] Menu dropdown pour actions secondaires
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)

  // [AI:Claude] Modale Instagram
  const [showInstagramModal, setShowInstagramModal] = useState(false)

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
  const [selectedSeason, setSelectedSeason] = useState(null) // [AI:Claude] Saison optionnelle (spring, summer, autumn, winter)
  const [modelGender, setModelGender] = useState('female') // [AI:Claude] Genre du modèle (male, female)
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

  // [AI:Claude] Fermer le menu si clic à l'extérieur
  useEffect(() => {
    if (!openMenuId) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    // Petit délai pour éviter que le clic d'ouverture ferme immédiatement le menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [openMenuId])

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

    const result = await generatePreview(selectedPhoto.id, selectedContext.key, selectedSeason)

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
        project_category: detectProjectCategory(selectedPhoto.item_type || ''),
        season: selectedSeason, // Saison optionnelle
        model_gender: modelGender // Genre du modèle (male, female)
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
    setSelectedSeason(null) // [AI:Claude] Réinitialiser la saison
    const category = detectProjectCategory(photo.item_type || '')
    const styles = getAvailableStyles(category)
    setSelectedContext(styles[0]) // Premier style par défaut
    setShowEnhanceModal(true)
  }

  // [AI:Claude] Détection intelligente de la catégorie
  const detectProjectCategory = (itemType) => {
    const lower = itemType.toLowerCase()

    // DEBUG: Afficher dans la console pour comprendre le problème
    console.log('[DETECT CATEGORY] item_type reçu:', itemType, '| lowercase:', lower)

    // [AI:Claude] Nouvelles catégories depuis la base de données
    if (lower === 'vêtements' || lower === 'vetements')
      return 'wearable'

    if (lower === 'vêtements bébé' || lower === 'vetements bebe' || lower === 'baby_garment')
      return 'baby_garment'

    if (lower === 'vêtements enfant' || lower === 'vetements enfant' || lower === 'child_garment')
      return 'child_garment'

    if (lower === 'accessoires bébé' || lower === 'accessoires bebe')
      return 'wearable'

    if (lower === 'jouets/peluches')
      return 'toy'

    if (lower === 'accessoires')
      return 'accessory'

    if (lower === 'maison/déco' || lower === 'maison/deco')
      return 'home_decor'

    // [AI:Claude] Détection par mots-clés pour vêtements bébé
    if (lower.match(/body bébé|barboteuse|gilet bébé|chaussons bébé|bonnet bébé|couverture bébé|body bebe|gilet bebe|chaussons bebe|bonnet bebe|couverture bebe/)) {
      console.log('[DETECT CATEGORY] Détecté comme baby_garment via regex')
      return 'baby_garment'
    }

    // [AI:Claude] Détection par mots-clés (fallback)
    if (lower.match(/bonnet|écharpe|pull|chaussette|gilet|châle|snood|mitaine/))
      return 'wearable'

    if (lower.match(/amigurumi|peluche|doudou|poupée|ours|animal/))
      return 'toy'

    if (lower.match(/sac|pochette|trousse|panier|cabas/))
      return 'accessory'

    if (lower.match(/couverture|plaid|coussin|tapis|déco|nappe/))
      return 'home_decor'

    return 'accessory' // Fallback vers accessoire (le plus générique)
  }

  // [AI:Claude] v0.17.1 - Saisons disponibles pour la génération d'images
  const seasons = [
    { key: 'spring', label: 'Printemps', icon: '🌸', desc: 'Fleurs, bourgeons, lumière douce' },
    { key: 'summer', label: 'Été', icon: '☀️', desc: 'Lumière dorée, végétation luxuriante' },
    { key: 'autumn', label: 'Automne', icon: '🍂', desc: 'Feuilles dorées, tons chauds' },
    { key: 'winter', label: 'Hiver', icon: '❄️', desc: 'Neige, givre, ambiance cocooning' }
  ]

  // [AI:Claude] Thèmes qui supportent les saisons (extérieur, nature, lumière naturelle)
  const seasonStyles = [
    // Wearable - extérieur/nature
    'wearable_c1', 'wearable_c3', 'wearable_c4', 'wearable_c6', 'wearable_c9',
    // Accessory - extérieur/nature
    'accessory_c2', 'accessory_c3', 'accessory_c6', 'accessory_c9',
    // Home decor - ambiance saisonnière
    'home_c4', 'home_c5', 'home_c6',
    // Toy - extérieur/nature
    'toy_c5', 'toy_c8',
    // Baby garment - extérieur/nature
    'baby_garment_c1', 'baby_garment_c4', 'baby_garment_c7', 'baby_garment_c9',
    // Child garment - extérieur/nature/urbain
    'child_garment_c1', 'child_garment_c6', 'child_garment_c9'
  ]

  // [AI:Claude] v0.14.0 - Styles par catégorie et tier (FREE 3 / PLUS 6 / PRO 9)
  const stylesByCategory = {
    wearable: [
      // FREE (3)
      { key: 'wearable_c1', label: 'Classique épuré', icon: '👤', desc: 'Portrait extérieur lumière douce', tier: 'free' },
      { key: 'wearable_c2', label: 'Casual moderne', icon: '✨', desc: 'Studio fond blanc neutre', tier: 'free' },
      { key: 'wearable_c3', label: 'Vintage sobre', icon: '🌆', desc: 'Ambiance urbaine lifestyle, rue calme', tier: 'free' },
      // PLUS (+3)
      { key: 'wearable_c4', label: 'Bohème chic', icon: '🌼', desc: 'Ambiance vintage avec décor rétro', tier: 'plus' },
      { key: 'wearable_c5', label: 'Sportif élégant', icon: '💡', desc: 'Studio lumière chaude', tier: 'plus' },
      { key: 'wearable_c6', label: 'Nature', icon: '🌿', desc: 'Portrait en pleine nature', tier: 'plus' },
      // PRO (+3)
      { key: 'wearable_c7', label: 'Haute couture sophistiquée', icon: '👗', desc: 'Studio fond texturé sombre', tier: 'pro' },
      { key: 'wearable_c8', label: 'Rétro années 70', icon: '✨', desc: 'Ambiance soirée/décontractée', tier: 'pro' },
      { key: 'wearable_c9', label: 'Urbain streetwear', icon: '🏙️', desc: 'Ambiance industrielle', tier: 'pro' }
    ],
    accessory: [
      // FREE (3)
      { key: 'accessory_c1', label: 'Classique minimaliste', icon: '📸', desc: 'Gros plan en studio', tier: 'free' },
      { key: 'accessory_c2', label: 'Vintage délicat', icon: '🏠', desc: 'Mise en scène cosy sur table', tier: 'free' },
      { key: 'accessory_c3', label: 'Moderne brillant', icon: '✨', desc: 'Ambiance luxe, fond sombre, lumière tamisée', tier: 'free' },
      // PLUS (+3)
      { key: 'accessory_c4', label: 'Bohème naturel', icon: '🌿', desc: 'Style bohème intérieur, lumière naturelle', tier: 'plus' },
      { key: 'accessory_c5', label: 'Coloré graphique', icon: '🎨', desc: 'Studio avec lumière colorée', tier: 'plus' },
      { key: 'accessory_c6', label: 'Chic urbain', icon: '🏙️', desc: 'Mise en scène urbaine dynamique', tier: 'plus' },
      // PRO (+3)
      { key: 'accessory_c7', label: 'Glamour soirée', icon: '💎', desc: 'Studio luxe avec accessoires complémentaires', tier: 'pro' },
      { key: 'accessory_c8', label: 'Artistique abstrait', icon: '🎭', desc: 'Ambiance artistique, couleurs saturées', tier: 'pro' },
      { key: 'accessory_c9', label: 'Vintage baroque', icon: '👑', desc: 'Décor baroque riche en détails', tier: 'pro' }
    ],
    home_decor: [
      // FREE (3)
      { key: 'home_c1', label: 'Moderne épuré', icon: '🏠', desc: 'Intérieur lumineux et minimaliste', tier: 'free' },
      { key: 'home_c2', label: 'Rustique naturel', icon: '🌿', desc: 'Bois, plantes, lumière naturelle', tier: 'free' },
      { key: 'home_c3', label: 'Scandinave', icon: '✨', desc: 'Décor épuré blanc/gris', tier: 'free' },
      // PLUS (+3)
      { key: 'home_c4', label: 'Industriel', icon: '🏭', desc: 'Ambiance loft, métal, briques', tier: 'plus' },
      { key: 'home_c5', label: 'Coloré vintage', icon: '🎨', desc: 'Couleurs chaudes, vintage', tier: 'plus' },
      { key: 'home_c6', label: 'Bohème cozy', icon: '🛋️', desc: 'Ambiance chaleureuse, tissus doux', tier: 'plus' },
      // PRO (+3)
      { key: 'home_c7', label: 'Luxe contemporain', icon: '💎', desc: 'Décor moderne avec matériaux nobles', tier: 'pro' },
      { key: 'home_c8', label: 'Minimaliste zen', icon: '🧘', desc: 'Ambiance zen, couleurs neutres', tier: 'pro' },
      { key: 'home_c9', label: 'Éclectique artistique', icon: '🎭', desc: 'Mélange de styles, pièces uniques', tier: 'pro' }
    ],
    toy: [
      // FREE (3)
      { key: 'toy_c1', label: 'Classique doux', icon: '🧸', desc: 'Chambre enfantine avec lumière douce', tier: 'free' },
      { key: 'toy_c2', label: 'Contes de fées', icon: '✨', desc: 'Décor fantaisie, couleurs pastel', tier: 'free' },
      { key: 'toy_c3', label: 'Moderne ludique', icon: '🎨', desc: 'Fond blanc studio uniforme', tier: 'free' },
      // PLUS (+3)
      { key: 'toy_c4', label: 'Vintage peluche', icon: '🧸', desc: 'Ambiance rétro, lumière tamisée', tier: 'plus' },
      { key: 'toy_c5', label: 'Artisanat naturel', icon: '🌿', desc: 'Bois, tissus naturels', tier: 'plus' },
      { key: 'toy_c6', label: 'Cartoon coloré', icon: '🎈', desc: 'Couleurs vives, style dessin animé', tier: 'plus' },
      // PRO (+3)
      { key: 'toy_c7', label: 'Luxe pour enfant', icon: '👑', desc: 'Studio avec décor chic', tier: 'pro' },
      { key: 'toy_c8', label: 'Fantaisie magique', icon: '✨', desc: 'Ambiance féérique, lumières tamisées', tier: 'pro' },
      { key: 'toy_c9', label: 'Personnalisé unique', icon: '🎭', desc: 'Mise en scène personnalisée', tier: 'pro' }
    ],
    baby_garment: [
      // FREE (3)
      { key: 'baby_garment_c1', label: 'Bébé sur lit 👶', icon: '🛏️', desc: 'Porté par bébé allongé sur lit pastel', tier: 'free' },
      { key: 'baby_garment_c2', label: 'Studio pastel', icon: '✨', desc: 'À plat sur fond uni doux', tier: 'free' },
      { key: 'baby_garment_c3', label: 'Nursery scandinave', icon: '🏠', desc: 'À plat sur table à langer en bois clair', tier: 'free' },
      // PLUS (+3)
      { key: 'baby_garment_c4', label: 'Bébé lifestyle 👶', icon: '🧸', desc: 'Porté par bébé avec jouets bois', tier: 'plus' },
      { key: 'baby_garment_c5', label: 'Flat lay naturel', icon: '🌿', desc: 'À plat avec accessoires lifestyle', tier: 'plus' },
      { key: 'baby_garment_c6', label: 'Panier vintage', icon: '🧺', desc: 'À plat dans osier avec lin', tier: 'plus' },
      // PRO (+3)
      { key: 'baby_garment_c7', label: 'Dans bras parent 👶', icon: '💝', desc: 'Porté par bébé tenu par parent', tier: 'pro' },
      { key: 'baby_garment_c8', label: 'Premium flat lay', icon: '💎', desc: 'À plat avec fleurs séchées', tier: 'pro' },
      { key: 'baby_garment_c9', label: 'Tapis de jeu 👶', icon: '🌸', desc: 'Porté par bébé sur tapis moelleux', tier: 'pro' }
    ],
    child_garment: [
      // FREE (3)
      { key: 'child_garment_c1', label: 'Parc/jardin 👧', icon: '🌿', desc: 'Porté par enfant dans un parc ou jardin', tier: 'free' },
      { key: 'child_garment_c2', label: 'Studio blanc', icon: '📸', desc: 'À plat sur fond blanc studio professionnel', tier: 'free' },
      { key: 'child_garment_c3', label: 'Chambre enfant', icon: '🛏️', desc: 'À plat sur lit coloré avec peluches', tier: 'free' },
      // PLUS (+3)
      { key: 'child_garment_c4', label: 'Enfant jouant 👧', icon: '🧸', desc: 'Porté par enfant avec jouets en bois', tier: 'plus' },
      { key: 'child_garment_c5', label: 'Flat lay coloré', icon: '🎨', desc: 'À plat avec crayons et accessoires enfant', tier: 'plus' },
      { key: 'child_garment_c6', label: 'Urbain/street 👧', icon: '🏙️', desc: 'Porté par enfant, décor urbain style street photo', tier: 'plus' },
      // PRO (+3)
      { key: 'child_garment_c7', label: 'Mode enfant 👧', icon: '✨', desc: 'Shooting mode avec éclairage studio créatif', tier: 'pro' },
      { key: 'child_garment_c8', label: 'Premium boutique', icon: '💎', desc: 'À plat mise en scène boutique haut de gamme', tier: 'pro' },
      { key: 'child_garment_c9', label: 'Promenade famille 👧', icon: '💝', desc: 'Enfant tenant la main d\'un parent', tier: 'pro' }
    ]
  }

  // [AI:Claude] Filtrer les styles selon le plan de l'utilisateur
  const getAvailableStyles = (category) => {
    const allStyles = stylesByCategory[category] || []
    const subscriptionType = user?.subscription_type || 'free'

    // Déterminer le tier en fonction du type d'abonnement
    let userTier = 'free'

    // Plans PLUS
    if (subscriptionType === 'plus' || subscriptionType === 'plus_annual') {
      userTier = 'plus'
    }
    // Plans PRO (tous les variants)
    else if (
      subscriptionType === 'pro' ||
      subscriptionType === 'pro_annual' ||
      subscriptionType === 'early_bird' ||
      subscriptionType.toLowerCase().includes('pro')
    ) {
      userTier = 'pro'
    }

    // Filtrer selon le tier
    if (userTier === 'free') {
      return allStyles.filter(s => s.tier === 'free')
    } else if (userTier === 'plus') {
      return allStyles.filter(s => s.tier === 'free' || s.tier === 'plus')
    } else {
      return allStyles // PRO accède à tout
    }
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
                    {(() => {
                      const subType = user?.subscription_type;
                      if (!subType || subType === 'free') return 'Plan FREE : 5 photos/mois';
                      if (subType === 'plus' || subType === 'plus_annual') return 'Plan PLUS : 15 photos/mois';
                      return 'Plan PRO : 30 photos/mois';
                    })()}
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
                  to="/subscription"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition shadow-md hover:shadow-lg"
                >
                  🚀 Passer à PLUS ou PRO
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                  title="Recharge automatique chaque mois à votre date d'abonnement"
                >
                  ✅ Abonnement {user?.subscription_type?.includes('plus') ? 'PLUS' : 'PRO'} actif
                </button>
              )}
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
                  className="relative rounded-lg group aspect-square bg-gray-100 shadow-md hover:shadow-xl transition-shadow"
                >
                  {/* Photo IA générée */}
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`}
                    alt={photo.item_name || 'Photo IA'}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Erreur chargement image:', photo.enhanced_path)
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage manquante%3C/text%3E%3C/svg%3E'
                    }}
                  />

                  {/* Overlay minimaliste au hover */}
                  <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 rounded-lg ${openMenuId === photo.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {/* Nom de la photo */}
                    <div className="absolute top-3 left-3 right-3">
                      <p className="text-white text-sm font-semibold drop-shadow-lg line-clamp-1">
                        {photo.item_name || 'Sans nom'}
                      </p>
                    </div>

                    {/* Actions principales (3 boutons) */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3">
                      {/* Voir en grand */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`, '_blank')
                        }}
                        className="w-12 h-12 bg-white/90 hover:bg-white text-gray-900 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-sm"
                        title="Voir en grand"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Télécharger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const link = document.createElement('a')
                          link.href = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`
                          link.download = `${photo.item_name || 'photo'}.jpg`
                          link.click()
                        }}
                        className="w-12 h-12 bg-white/90 hover:bg-white text-gray-900 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-sm"
                        title="Télécharger"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>

                      {/* Menu actions (dropdown) */}
                      <div className="relative" ref={openMenuId === photo.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === photo.id ? null : photo.id)
                          }}
                          className="w-12 h-12 bg-white/90 hover:bg-white text-gray-900 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-sm"
                          title="Plus d'actions"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {/* Dropdown menu */}
                        {openMenuId === photo.id && (
                          <div className="absolute bottom-full mb-2 right-0 w-64 bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50 rounded-lg shadow-2xl border-2 border-primary-400 py-2 z-50">
                            {/* Photo de couverture */}
                            {photo.project_id && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  try {
                                    await api.put(`/projects/${photo.project_id}/set-cover-photo`, {
                                      photo_id: photo.id
                                    })
                                    alert('✅ Photo de couverture mise à jour !')
                                    setOpenMenuId(null)
                                  } catch (err) {
                                    console.error('Erreur:', err)
                                    alert('❌ Erreur lors de la mise à jour')
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-primary-900 hover:bg-primary-100 flex items-center gap-3 transition-colors font-medium"
                              >
                                <span className="text-lg">📸</span>
                                <span>Définir comme couverture</span>
                              </button>
                            )}

                            {/* Divider */}
                            {photo.project_id && <div className="border-t border-primary-200 my-1"></div>}

                            {/* Section Partage */}
                            <div className="px-4 py-1.5">
                              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">Partager</p>
                            </div>

                            {/* Instagram */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`

                                if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                  // Mobile : utiliser le menu de partage natif
                                  try {
                                    const response = await fetch(url)
                                    const blob = await response.blob()
                                    const file = new File([blob], `${photo.item_name || 'photo'}.jpg`, { type: 'image/jpeg' })
                                    await navigator.share({
                                      files: [file],
                                      title: photo.item_name || 'Ma photo tricot/crochet',
                                      text: `Découvrez mon ${photo.item_name || 'ouvrage'} ! 🧶✨`
                                    })
                                    setOpenMenuId(null)
                                  } catch (err) {
                                    if (err.name !== 'AbortError') {
                                      console.error('Erreur partage:', err)
                                      const link = document.createElement('a')
                                      link.href = url
                                      link.download = `${photo.item_name || 'photo'}-instagram.jpg`
                                      link.click()
                                    }
                                  }
                                } else {
                                  // Desktop : télécharger via fetch pour forcer le download
                                  try {
                                    const response = await fetch(url)
                                    const blob = await response.blob()
                                    const blobUrl = window.URL.createObjectURL(blob)

                                    const link = document.createElement('a')
                                    link.href = blobUrl
                                    link.download = `${photo.item_name || 'photo'}-instagram.jpg`
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)

                                    // Libérer la mémoire
                                    window.URL.revokeObjectURL(blobUrl)

                                    // Afficher la modale (Instagram s'ouvrira au clic sur "Compris !")
                                    setShowInstagramModal(true)
                                  } catch (err) {
                                    console.error('Erreur téléchargement Instagram:', err)
                                    alert('❌ Erreur lors du téléchargement de l\'image')
                                  }
                                  setOpenMenuId(null)
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-warm-900 hover:bg-warm-100 flex items-center gap-3 transition-colors group"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <defs>
                                  <radialGradient id="instagram-gradient" cx="30%" cy="107%" r="150%">
                                    <stop offset="0%" stopColor="#FDF497" />
                                    <stop offset="5%" stopColor="#FDF497" />
                                    <stop offset="45%" stopColor="#FD5949" />
                                    <stop offset="60%" stopColor="#D6249F" />
                                    <stop offset="90%" stopColor="#285AEB" />
                                  </radialGradient>
                                </defs>
                                <rect width="24" height="24" rx="5.4" fill="url(#instagram-gradient)"/>
                                <path d="M12 8.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zm0 5.36a2.11 2.11 0 110-4.22 2.11 2.11 0 010 4.22zM16.5 8.58a.76.76 0 11-1.52 0 .76.76 0 011.52 0zm2.16.76c-.05-1.06-.3-2-1.1-2.8-.8-.8-1.74-1.05-2.8-1.1C13.68 5.4 10.32 5.4 9.24 5.44c-1.06.05-2 .3-2.8 1.1-.8.8-1.05 1.74-1.1 2.8C5.4 10.32 5.4 13.68 5.44 14.76c.05 1.06.3 2 1.1 2.8.8.8 1.74 1.05 2.8 1.1 1.08.04 4.44.04 5.52 0 1.06-.05 2-.3 2.8-1.1.8-.8 1.05-1.74 1.1-2.8.04-1.08.04-4.44 0-5.52zM17.23 15.9c-.24.6-.7 1.06-1.3 1.3-1.02.4-3.44.31-4.57.31-1.13 0-3.55.09-4.57-.31a2.3 2.3 0 01-1.3-1.3c-.4-1.02-.31-3.44-.31-4.57 0-1.13-.09-3.55.31-4.57.24-.6.7-1.06 1.3-1.3C7.81 5.06 10.23 5.15 11.36 5.15c1.13 0 3.55-.09 4.57.31.6.24 1.06.7 1.3 1.3.4 1.02.31 3.44.31 4.57 0 1.13.09 3.55-.31 4.57z" fill="white"/>
                              </svg>
                              <span>Instagram</span>
                            </button>

                            {/* Pinterest */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`
                                const description = photo.item_name || 'Photo tricot/crochet'
                                window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`, '_blank')
                                setOpenMenuId(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-warm-900 hover:bg-warm-100 flex items-center gap-3 transition-colors group"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="12" fill="#E60023"/>
                                <path d="M12.7 7.2c-2.5 0-3.8 1.8-3.8 3.3 0 .9.3 1.6.9 1.9.1 0 .2.1.3 0 0-.1.1-.4.1-.5 0-.1 0-.2 0-.3-.2-.3-.4-.7-.4-1.3 0-1.6 1.2-3.1 3.1-3.1 1.7 0 2.6 1 2.6 2.4 0 1.8-.8 3.3-2 3.3-.6 0-1.1-.5-1-1.1.2-.7.5-1.5.5-2 0-1.2-1.8-1-1.8.5 0 .4.1.7.1.7s-.5 2-.6 2.4c-.2.7 0 1.7.1 2.3 0 .1.1.1.2.1h.1c.1-.2 1-1.2 1.2-2 .1-.3.3-1.2.3-1.2.2.3.7.6 1.2.6 1.6 0 2.8-1.5 2.8-3.4 0-1.5-1.2-2.8-3-2.8z" fill="white"/>
                              </svg>
                              <span>Pinterest</span>
                            </button>

                            {/* Facebook */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')
                                setOpenMenuId(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-warm-900 hover:bg-warm-100 flex items-center gap-3 transition-colors group"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                                <path d="M16.671 15.469l.575-3.75h-3.602V9.406c0-1.026.503-2.027 2.116-2.027h1.636V4.203S15.924 4 14.5 4c-2.973 0-4.917 1.801-4.917 5.062v2.857H6.188v3.75h3.395v9.066c.682.107 1.379.165 2.089.165.71 0 1.407-.058 2.089-.165v-9.066h3.027z" fill="white"/>
                              </svg>
                              <span>Facebook</span>
                            </button>

                            {/* Twitter/X */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const text = `Découvrez mon ${photo.item_name || 'ouvrage'} ! 🧶✨`
                                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank')
                                setOpenMenuId(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-warm-900 hover:bg-warm-100 flex items-center gap-3 transition-colors group"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="12" fill="#000000"/>
                                <path d="M13.355 10.874L17.866 5.5h-1.069l-3.915 4.494L9.933 5.5H6.5l4.731 6.888L6.5 18.5h1.069l4.135-4.748L14.567 18.5H18l-4.645-7.626zm-1.464 1.68l-.479-.685L7.665 6.319h1.64l3.073 4.393.479.685 3.997 5.715h-1.64l-3.262-4.658z" fill="white"/>
                              </svg>
                              <span>Twitter / X</span>
                            </button>

                            {/* Copier lien */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                const url = `${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path}`
                                try {
                                  await navigator.clipboard.writeText(url)
                                  alert('✅ Lien copié !')
                                  setOpenMenuId(null)
                                } catch (err) {
                                  console.error('Erreur copie:', err)
                                  alert('❌ Impossible de copier le lien')
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-warm-900 hover:bg-warm-100 flex items-center gap-3 transition-colors group"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="12" fill="#6B7280"/>
                                <path d="M13.544 10.456a4.368 4.368 0 00-6.176 0l-1.5 1.5a4.368 4.368 0 006.176 6.176l.834-.834m2.666-10.842a4.368 4.368 0 016.176 0l1.5 1.5a4.368 4.368 0 01-6.176 6.176l-.834-.834" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>Copier le lien</span>
                            </button>

                            {/* Divider */}
                            <div className="border-t border-primary-200 my-1"></div>

                            {/* Supprimer */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(null)
                                handleDelete(photo.id)
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-100 flex items-center gap-3 font-medium transition-colors"
                            >
                              <span className="text-lg">🗑️</span>
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
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
                    <optgroup label="👶 Vêtements bébé">
                      <option value="body bébé">Body bébé</option>
                      <option value="barboteuse">Barboteuse</option>
                      <option value="gilet bébé">Gilet bébé</option>
                      <option value="chaussons bébé">Chaussons bébé</option>
                      <option value="bonnet bébé">Bonnet bébé</option>
                      <option value="couverture bébé">Couverture bébé</option>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
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
                  {getAvailableStyles(detectProjectCategory(selectedPhoto.item_type || '')).map(style => (
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{style.label}</p>
                          {style.tier === 'plus' && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-semibold">PLUS</span>
                          )}
                          {style.tier === 'pro' && (
                            <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded font-semibold">PRO</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{style.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Sélecteur de genre pour styles portés (adultes et enfants) */}
                {selectedContext && (selectedContext.label?.includes('Porté') || ['child_garment_c1', 'child_garment_c4', 'child_garment_c6', 'child_garment_c7', 'child_garment_c9'].includes(selectedContext.key)) && (
                  <div className="mt-3 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {selectedContext.key?.startsWith('child_garment_') ? '👧 Genre de l\'enfant :' : '👤 Genre du modèle :'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition ${modelGender === 'male' ? 'border-primary-600 bg-white ring-2 ring-primary-300' : 'border-gray-300 bg-white hover:border-primary-400'}`}>
                        <input type="radio" name="modelGender" value="male" checked={modelGender === 'male'} onChange={(e) => setModelGender(e.target.value)} className="sr-only" />
                        <span className="text-2xl">{selectedContext.key?.startsWith('child_garment_') ? '👦' : '👨'}</span>
                        <span className="text-xs font-semibold text-gray-900">{selectedContext.key?.startsWith('child_garment_') ? 'Garçon' : 'Homme'}</span>
                      </label>
                      <label className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition ${modelGender === 'female' ? 'border-primary-600 bg-white ring-2 ring-primary-300' : 'border-gray-300 bg-white hover:border-primary-400'}`}>
                        <input type="radio" name="modelGender" value="female" checked={modelGender === 'female'} onChange={(e) => setModelGender(e.target.value)} className="sr-only" />
                        <span className="text-2xl">{selectedContext.key?.startsWith('child_garment_') ? '👧' : '👩'}</span>
                        <span className="text-xs font-semibold text-gray-900">{selectedContext.key?.startsWith('child_garment_') ? 'Fille' : 'Femme'}</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Message upgrade pour FREE */}
                {user?.subscription_type === 'free' && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-primary-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      🎨 <span className="font-semibold">6 styles supplémentaires</span> avec PLUS et <span className="font-semibold">9 styles premium</span> avec PRO !
                      <a href="/subscription" className="ml-2 text-primary-600 hover:text-primary-700 font-semibold underline">
                        Découvrir les plans
                      </a>
                    </p>
                  </div>
                )}

                {/* Message upgrade pour PLUS */}
                {(user?.subscription_type === 'plus' || user?.subscription_type === 'plus_annual') && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-primary-50 to-sage-50 border border-primary-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      ✨ <span className="font-semibold">3 styles premium supplémentaires</span> disponibles avec PRO (Instagram, Catalogues, Saisonnier) !
                      <a href="/subscription" className="ml-2 text-primary-600 hover:text-primary-700 font-semibold underline">
                        Passer à PRO
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* [AI:Claude] v0.17.1 - Sélecteur de saison (optionnel, uniquement pour thèmes extérieur/nature) */}
              {selectedContext && seasonStyles.includes(selectedContext.key) && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Ambiance saisonnière <span className="text-gray-400 font-normal">(optionnel)</span> :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Option "Aucune" */}
                    <button
                      type="button"
                      onClick={() => setSelectedSeason(null)}
                      className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg transition ${
                        selectedSeason === null
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">🎨</span>
                      <span className="text-xs font-medium text-gray-700">Aucune</span>
                    </button>

                    {/* Options de saisons */}
                    {seasons.map(season => (
                      <button
                        key={season.key}
                        type="button"
                        onClick={() => setSelectedSeason(season.key)}
                        className={`flex flex-col items-center gap-1 p-3 border-2 rounded-lg transition ${
                          selectedSeason === season.key
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={season.desc}
                      >
                        <span className="text-2xl">{season.icon}</span>
                        <span className="text-xs font-medium text-gray-700">{season.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedSeason && (
                    <p className="text-xs text-primary-600 mt-2">
                      {seasons.find(s => s.key === selectedSeason)?.desc}
                    </p>
                  )}
                </div>
              )}

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

      {/* Modale Instagram */}
      {showInstagramModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowInstagramModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setShowInstagramModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icône Instagram avec gradient */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <radialGradient id="modal-instagram-gradient" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#FDF497" />
                      <stop offset="5%" stopColor="#FDF497" />
                      <stop offset="45%" stopColor="#FD5949" />
                      <stop offset="60%" stopColor="#D6249F" />
                      <stop offset="90%" stopColor="#285AEB" />
                    </radialGradient>
                  </defs>
                  <path d="M12 8.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zm0 5.36a2.11 2.11 0 110-4.22 2.11 2.11 0 010 4.22zM16.5 8.58a.76.76 0 11-1.52 0 .76.76 0 011.52 0zm2.16.76c-.05-1.06-.3-2-1.1-2.8-.8-.8-1.74-1.05-2.8-1.1C13.68 5.4 10.32 5.4 9.24 5.44c-1.06.05-2 .3-2.8 1.1-.8.8-1.05 1.74-1.1 2.8C5.4 10.32 5.4 13.68 5.44 14.76c.05 1.06.3 2 1.1 2.8.8.8 1.74 1.05 2.8 1.1 1.08.04 4.44.04 5.52 0 1.06-.05 2-.3 2.8-1.1.8-.8 1.05-1.74 1.1-2.8.04-1.08.04-4.44 0-5.52zM17.23 15.9c-.24.6-.7 1.06-1.3 1.3-1.02.4-3.44.31-4.57.31-1.13 0-3.55.09-4.57-.31a2.3 2.3 0 01-1.3-1.3c-.4-1.02-.31-3.44-.31-4.57 0-1.13-.09-3.55.31-4.57.24-.6.7-1.06 1.3-1.3C7.81 5.06 10.23 5.15 11.36 5.15c1.13 0 3.55-.09 4.57.31.6.24 1.06.7 1.3 1.3.4 1.02.31 3.44.31 4.57 0 1.13.09 3.55-.31 4.57z" fill="white"/>
                </svg>
              </div>
            </div>

            {/* Titre */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Image téléchargée !
            </h3>

            {/* Message */}
            <div className="text-center mb-8 space-y-3">
              <p className="text-gray-600 leading-relaxed">
                Votre image est prête à être partagée !
              </p>
              <div className="bg-gradient-to-br from-primary-50 to-warm-50 border-2 border-primary-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium">
                  💡 <span className="font-semibold">Comment faire :</span> Cliquez sur le bouton ci-dessous pour ouvrir Instagram, puis cliquez sur <span className="font-bold text-primary-600">+</span> pour créer un nouveau post et uploadez l'image téléchargée.
                </p>
              </div>
            </div>

            {/* Bouton */}
            <button
              onClick={() => {
                window.open('https://www.instagram.com/', '_blank')
                setShowInstagramModal(false)
              }}
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-warm-600 text-white rounded-xl font-bold text-lg hover:from-primary-700 hover:to-warm-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              Ouvrir Instagram
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
