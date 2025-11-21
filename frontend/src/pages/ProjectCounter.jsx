/**
 * @file ProjectCounter.jsx
 * @brief Compteur de rangs interactif pour projets de crochet (v0.11.0 - Refonte UI)
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-16 by [AI:Claude] - Import patron multi-format (PDF, image, URL)
 *
 * @history
 *   2025-11-16 [AI:Claude] Import patron multi-format: PDF + images + liens web
 *   2025-11-16 [AI:Claude] Refonte UI: compteur compact + import patron + galerie photos
 *   2025-11-13 [AI:Claude] Création initiale avec compteur + timer + historique
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const ProjectCounter = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // [AI:Claude] Sections du projet
  const [sections, setSections] = useState([])
  const [currentSectionId, setCurrentSectionId] = useState(null)

  // [AI:Claude] État du compteur
  const [currentRow, setCurrentRow] = useState(0)
  const [stitchCount, setStitchCount] = useState(0)

  // [AI:Claude] Timer de session
  const [sessionId, setSessionId] = useState(null)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // [AI:Claude] Photos du projet
  const [projectPhotos, setProjectPhotos] = useState([])

  // [AI:Claude] Patron (PDF, Image ou URL)
  const [patternFile, setPatternFile] = useState(null)
  const [uploadingPattern, setUploadingPattern] = useState(false)
  const [showPatternUrlModal, setShowPatternUrlModal] = useState(false)
  const [patternUrl, setPatternUrl] = useState('')

  // [AI:Claude] Upload photo projet
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // [AI:Claude] Embellir photo avec IA - v0.11.0 workflow quantité → contextes
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [enhanceData, setEnhanceData] = useState({
    quantity: 1,
    contexts: [],
    project_category: '',
    custom_instructions: '' // [AI:Claude] Instructions personnalisées
  })
  const [enhancing, setEnhancing] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    status: []
  })
  const [credits, setCredits] = useState(null)

  // [AI:Claude] Modales de confirmation et alertes
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: null })
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' })

  // [AI:Claude] Modal d'édition du projet
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    description: '',
    hook_size: '',
    yarn_brand: ''
  })
  const [savingProject, setSavingProject] = useState(false)

  // [AI:Claude] Tabs pour Photos/Patron/Description
  const [activeTab, setActiveTab] = useState('photos')

  // [AI:Claude] Gestion des sections
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    total_rows: ''
  })
  const [savingSection, setSavingSection] = useState(false)

  // [AI:Claude] Charger le projet au montage
  useEffect(() => {
    fetchProject()
    fetchProjectPhotos()
    fetchCredits()
    fetchSections()
  }, [projectId])

  // [AI:Claude] Timer tick
  useEffect(() => {
    let interval
    if (isTimerRunning && sessionStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, sessionStartTime])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/projects/${projectId}`)
      const projectData = response.data.project

      setProject(projectData)
      setCurrentRow(projectData.current_row || 0)

      // [AI:Claude] Sélectionner la section en cours si elle existe
      if (projectData.current_section_id) {
        setCurrentSectionId(projectData.current_section_id)
      }
    } catch (err) {
      console.error('Erreur chargement projet:', err)
      setError('Impossible de charger le projet')
    } finally {
      setLoading(false)
    }
  }

  // [AI:Claude] Charger les sections du projet
  const fetchSections = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/sections`)
      setSections(response.data.sections || [])
    } catch (err) {
      console.error('Erreur chargement sections:', err)
      // [AI:Claude] Pas d'erreur fatale si pas de sections
    }
  }

  const fetchProjectPhotos = async () => {
    try {
      const response = await api.get('/photos', {
        params: { project_id: projectId }
      })
      setProjectPhotos(response.data.photos || [])
    } catch (err) {
      console.error('Erreur chargement photos:', err)
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

  // [AI:Claude] Helper pour afficher une alerte
  const showAlert = (message, type = 'info', title = '') => {
    setAlertData({
      title: title || (type === 'success' ? '✅ Succès' : type === 'error' ? '❌ Erreur' : 'ℹ️ Information'),
      message,
      type
    })
    setShowAlertModal(true)
  }

  // [AI:Claude] Helper pour afficher une confirmation
  const showConfirm = (message, onConfirm, title = '⚠️ Confirmation') => {
    setConfirmData({ title, message, onConfirm })
    setShowConfirmModal(true)
  }

  // [AI:Claude] Ouvrir modal d'édition
  const openEditModal = () => {
    setEditForm({
      description: project.description || '',
      hook_size: project.hook_size || '',
      yarn_brand: project.yarn_brand || ''
    })
    setShowEditModal(true)
  }

  // [AI:Claude] Sauvegarder les modifications du projet
  const handleSaveProject = async () => {
    setSavingProject(true)
    try {
      await api.put(`/projects/${projectId}`, editForm)
      await fetchProject()
      setShowEditModal(false)
      showAlert('Projet mis à jour avec succès !', 'success')
    } catch (err) {
      console.error('Erreur mise à jour projet:', err)
      showAlert('Erreur lors de la mise à jour du projet', 'error')
    } finally {
      setSavingProject(false)
    }
  }

  // [AI:Claude] Upload patron (PDF ou Image)
  const handlePatternUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // [AI:Claude] Accepter PDF et images
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      showAlert('Veuillez sélectionner un fichier PDF ou une image (JPG, PNG, WEBP)', 'error')
      return
    }

    setUploadingPattern(true)
    const formData = new FormData()
    formData.append('pattern', file)
    formData.append('pattern_type', file.type.startsWith('image/') ? 'image' : 'pdf')

    try {
      await api.post(`/projects/${projectId}/pattern`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setPatternFile(file.name)
      await fetchProject()
      showAlert('Patron importé avec succès !', 'success')
    } catch (err) {
      console.error('Erreur upload patron:', err)
      showAlert('Erreur lors de l\'import du patron', 'error')
    } finally {
      setUploadingPattern(false)
    }
  }

  // [AI:Claude] Ajouter URL de patron
  const handlePatternUrlSubmit = async () => {
    if (!patternUrl.trim()) {
      showAlert('Veuillez entrer une URL', 'error')
      return
    }

    // [AI:Claude] Valider l'URL
    try {
      new URL(patternUrl)
    } catch (e) {
      showAlert('URL invalide. Exemple : https://example.com/patron', 'error')
      return
    }

    setUploadingPattern(true)

    try {
      await api.post(`/projects/${projectId}/pattern-url`, {
        pattern_url: patternUrl
      })

      await fetchProject()
      setShowPatternUrlModal(false)
      setPatternUrl('')
      showAlert('Lien du patron enregistré avec succès !', 'success')
    } catch (err) {
      console.error('Erreur enregistrement URL:', err)
      showAlert('Erreur lors de l\'enregistrement du lien', 'error')
    } finally {
      setUploadingPattern(false)
    }
  }

  // [AI:Claude] Upload photo du projet
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // [AI:Claude] Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      showAlert('Veuillez sélectionner une image', 'error')
      return
    }

    setUploadingPhoto(true)
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('project_id', projectId)
    formData.append('item_name', project.name)

    try {
      await api.post('/photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      await fetchProjectPhotos()
      setShowPhotoUploadModal(false)
      showAlert('Photo ajoutée avec succès !', 'success')
    } catch (err) {
      console.error('Erreur upload photo:', err)
      showAlert('Erreur lors de l\'ajout de la photo', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

// [AI:Claude] Supprimer une photo
  const handleDeletePhoto = (photoId) => {
    showConfirm(
      'Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.',
      async () => {
        try {
          await api.delete(`/photos/${photoId}`)
          await fetchProjectPhotos()
          showAlert('Photo supprimée avec succès', 'success')
        } catch (err) {
          console.error('Erreur suppression photo:', err)
          showAlert('Erreur lors de la suppression de la photo', 'error')
        }
      },
      '🗑️ Supprimer la photo'
    )
  }

  // [AI:Claude] Embellir une photo avec IA - v0.11.0 génération multiple
  const handleEnhancePhoto = async (e) => {
    e.preventDefault()

    if (!selectedPhoto) return

    const quantity = enhanceData.contexts.length
    if (quantity === 0) {
      showAlert('Veuillez sélectionner vos contextes', 'error')
      return
    }

    if (quantity !== enhanceData.quantity) {
      showAlert(`Veuillez sélectionner exactement ${enhanceData.quantity} contexte${enhanceData.quantity > 1 ? 's' : ''}`, 'error')
      return
    }

    // [AI:Claude] Vérifier les crédits
    const cost = calculateCost()
    if (!credits || credits.total_available < cost) {
      showAlert(`Vous n'avez pas assez de crédits. Nécessaire: ${cost}, Disponible: ${credits?.total_available || 0}`, 'error')
      return
    }

    setEnhancing(true)
    setGenerationProgress({
      current: 0,
      total: quantity,
      status: enhanceData.contexts.map(ctx => ({ context: ctx, status: 'pending', time: 0 }))
    })

    try {
      // [AI:Claude] Appel API pour génération multiple
      const response = await api.post(`/photos/${selectedPhoto.id}/enhance-multiple`, {
        contexts: enhanceData.contexts,
        project_category: enhanceData.project_category,
        custom_instructions: enhanceData.custom_instructions || null
      })

      await fetchProjectPhotos()
      await fetchCredits() // [AI:Claude] Recharger les crédits
      setShowEnhanceModal(false)
      setSelectedPhoto(null)

      showAlert(`✨ ${quantity} photo${quantity > 1 ? 's' : ''} générée${quantity > 1 ? 's' : ''} avec succès !`, 'success')
    } catch (err) {
      console.error('Erreur embellissement photo:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'embellissement'
      showAlert(errorMsg, 'error')
    } finally {
      setEnhancing(false)
    }
  }

  // [AI:Claude] Ouvrir modal d'embellissement avec détection auto
  const openEnhanceModal = (photo) => {
    setSelectedPhoto(photo)
    const category = detectProjectCategory(project?.type || '')
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

  // [AI:Claude] Changer la quantité
  const changeQuantity = (newQuantity) => {
    setEnhanceData({
      ...enhanceData,
      quantity: newQuantity,
      contexts: []
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
        showAlert(`Maximum ${enhanceData.quantity} contexte${enhanceData.quantity > 1 ? 's' : ''}`, 'error')
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

  // [AI:Claude] Démarrer la session avec section_id
  const handleStartSession = async () => {
    try {
      const response = await api.post(`/projects/${projectId}/sessions/start`, {
        section_id: currentSectionId // [AI:Claude] Tracking par section
      })
      setSessionId(response.data.session_id)
      setSessionStartTime(Date.now())
      setIsTimerRunning(true)
    } catch (err) {
      console.error('Erreur démarrage session:', err)
      showAlert('Erreur lors du démarrage de la session', 'error')
    }
  }

  // [AI:Claude] Terminer la session
  const handleEndSession = async () => {
    if (!sessionId) return

    try {
      const rowsCompleted = currentRow - (project?.current_row || 0)

      await api.post(`/projects/${projectId}/sessions/end`, {
        session_id: sessionId,
        rows_completed: rowsCompleted,
        notes: null
      })

      await fetchProject()

      setSessionId(null)
      setSessionStartTime(null)
      setIsTimerRunning(false)
      setElapsedTime(0)
    } catch (err) {
      console.error('Erreur fin session:', err)
      showAlert('Erreur lors de la fin de session', 'error')
    }
  }

  // [AI:Claude] Incrémenter le rang (sauvegarde directe sans modal)
  const handleIncrementRow = async () => {
    const newRow = currentRow + 1
    setCurrentRow(newRow)

    // [AI:Claude] Sauvegarder directement sans ouvrir la modal
    try {
      const rowData = {
        row_number: newRow,
        section_id: currentSectionId,
        stitch_count: null,
        duration: null,
        notes: null,
        difficulty_rating: null
      }

      await api.post(`/projects/${projectId}/rows`, rowData)
      await fetchProject()
    } catch (err) {
      console.error('Erreur sauvegarde rang:', err)
      showAlert('Erreur lors de la sauvegarde du rang', 'error')
      // [AI:Claude] Rollback en cas d'erreur
      setCurrentRow(currentRow)
    }
  }

  // [AI:Claude] Décrémenter le rang (sauvegarde directe sans modal)
  const handleDecrementRow = async () => {
    if (currentRow > 0) {
      const newRow = currentRow - 1
      setCurrentRow(newRow)

      // [AI:Claude] Sauvegarder directement
      try {
        const rowData = {
          row_number: newRow,
          section_id: currentSectionId,
          stitch_count: null,
          duration: null,
          notes: null,
          difficulty_rating: null
        }

        await api.post(`/projects/${projectId}/rows`, rowData)
        await fetchProject()
      } catch (err) {
        console.error('Erreur sauvegarde rang:', err)
        showAlert('Erreur lors de la sauvegarde du rang', 'error')
        // [AI:Claude] Rollback en cas d'erreur
        setCurrentRow(currentRow)
      }
    }
  }

  // [AI:Claude] Changer la section en cours
  const handleChangeSection = async (sectionId) => {
    try {
      await api.post(`/projects/${projectId}/current-section`, {
        section_id: sectionId
      })
      setCurrentSectionId(sectionId)
      await fetchProject()
    } catch (err) {
      console.error('Erreur changement section:', err)
      showAlert('Erreur lors du changement de section', 'error')
    }
  }

  // [AI:Claude] Ouvrir modal d'ajout de section
  const openAddSectionModal = () => {
    setSectionForm({ name: '', description: '', total_rows: '' })
    setEditingSection(null)
    setShowAddSectionModal(true)
  }

  // [AI:Claude] Ouvrir modal d'édition de section
  const openEditSectionModal = (section) => {
    setSectionForm({
      name: section.name,
      description: section.description || '',
      total_rows: section.total_rows || ''
    })
    setEditingSection(section)
    setShowAddSectionModal(true)
  }

  // [AI:Claude] Sauvegarder une section (création ou modification)
  const handleSaveSection = async (e) => {
    e.preventDefault()

    if (!sectionForm.name.trim()) {
      showAlert('Le nom de la section est obligatoire', 'error')
      return
    }

    setSavingSection(true)

    try {
      const sectionData = {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim() || null,
        total_rows: sectionForm.total_rows ? parseInt(sectionForm.total_rows) : null,
        display_order: editingSection ? editingSection.display_order : sections.length
      }

      if (editingSection) {
        // Modification
        await api.put(`/projects/${projectId}/sections/${editingSection.id}`, sectionData)
        showAlert('Section modifiée avec succès', 'success')
      } else {
        // Création
        await api.post(`/projects/${projectId}/sections`, sectionData)
        showAlert('Section créée avec succès', 'success')
      }

      await fetchSections()
      setShowAddSectionModal(false)
      setSectionForm({ name: '', description: '', total_rows: '' })
      setEditingSection(null)
    } catch (err) {
      console.error('Erreur sauvegarde section:', err)
      showAlert('Erreur lors de la sauvegarde de la section', 'error')
    } finally {
      setSavingSection(false)
    }
  }

  // [AI:Claude] Supprimer une section
  const handleDeleteSection = (section) => {
    showConfirm(
      `Êtes-vous sûr de vouloir supprimer la section "${section.name}" ? Tous les rangs associés seront dissociés de cette section.`,
      async () => {
        try {
          await api.delete(`/projects/${projectId}/sections/${section.id}`)
          await fetchSections()
          if (currentSectionId === section.id) {
            setCurrentSectionId(null)
          }
          showAlert('Section supprimée avec succès', 'success')
        } catch (err) {
          console.error('Erreur suppression section:', err)
          showAlert('Erreur lors de la suppression de la section', 'error')
        }
      },
      '🗑️ Supprimer la section'
    )
  }

  // [AI:Claude] Marquer une section comme terminée/non terminée
  const handleToggleSectionComplete = async (section, e) => {
    e.stopPropagation()
    try {
      await api.post(`/projects/${projectId}/sections/${section.id}/complete`)
      await fetchSections()
      const newState = !section.is_completed
      showAlert(
        newState ? '✅ Section marquée comme terminée' : 'Section réouverte',
        'success'
      )
    } catch (err) {
      console.error('Erreur toggle section:', err)
      showAlert('Erreur lors de la mise à jour', 'error')
    }
  }

  // [AI:Claude] Formater le temps (secondes → HH:MM:SS)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Chargement du projet...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error || 'Projet introuvable'}</p>
          <Link
            to="/my-projects"
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Retour aux projets
          </Link>
        </div>
      </div>
    )
  }

  const progressPercentage = project.total_rows
    ? Math.round((currentRow / project.total_rows) * 100)
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      {/* [AI:Claude] Header ultra-compact */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/my-projects"
              className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition mb-1"
            >
              ← Retour
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <span className="text-xs text-gray-500">{project.type || 'Tricot/crochet'}</span>
        </div>
      </div>

      {/* [AI:Claude] Sections en chips horizontaux compacts */}
      {sections.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 mr-1">🧩 Sections:</span>

            {sections.map((section) => {
              const isActive = currentSectionId === section.id
              const isCompleted = section.is_completed === 1
              const sectionProgress = section.total_rows
                ? Math.round((section.current_row / section.total_rows) * 100)
                : null

              return (
                <button
                  key={section.id}
                  onClick={() => handleChangeSection(section.id)}
                  disabled={isActive}
                  className={`group relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md cursor-default'
                      : isCompleted
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 border-2 border-green-400 shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                  title={`${section.name}${sectionProgress !== null ? ` (${sectionProgress}%)` : ''}${section.time_formatted ? ` - ${section.time_formatted}` : ''}${isCompleted ? ' - TERMINÉE ✓' : ''}`}
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="flex items-center gap-1">
                      {isCompleted && <span className="text-green-600 font-bold">✓</span>}
                      {section.name}
                      {isCompleted && sectionProgress === 100 && (
                        <span className="ml-1 px-1 py-0.5 bg-green-600 text-white rounded text-[10px] font-bold">
                          100%
                        </span>
                      )}
                      {!isCompleted && sectionProgress !== null && (
                        <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {sectionProgress}%
                        </span>
                      )}
                    </span>
                    {section.time_spent > 0 && (
                      <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                        ⏱️ {section.time_formatted}
                      </span>
                    )}
                  </span>

                  {/* [AI:Claude] Actions au hover */}
                  {!isActive && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={(e) => handleToggleSectionComplete(section, e)}
                        className={`w-5 h-5 rounded-full shadow-md border flex items-center justify-center text-xs ${
                          isCompleted
                            ? 'bg-green-500 border-green-600 hover:bg-green-600 text-white'
                            : 'bg-white border-gray-300 hover:bg-green-50'
                        }`}
                        title={isCompleted ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                      >
                        {isCompleted ? '✓' : '✓'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditSectionModal(section)
                        }}
                        className="w-5 h-5 bg-white rounded-full shadow-md border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-xs"
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSection(section)
                        }}
                        className="w-5 h-5 bg-white rounded-full shadow-md border border-gray-300 hover:bg-red-50 flex items-center justify-center text-xs"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </button>
              )
            })}

            {/* Bouton ajouter section */}
            <button
              onClick={openAddSectionModal}
              className="px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-200 transition border border-primary-300"
              title="Ajouter une section"
            >
              ➕
            </button>
          </div>
        </div>
      )}

      {/* [AI:Claude] Compteur + Timer ULTRA compact */}
      <div className="bg-white rounded-lg border border-primary-200 p-2 mb-3">
        <div className="flex items-center justify-between gap-4">
          {/* Compteur compact */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrementRow}
              disabled={currentRow === 0}
              className="w-8 h-8 bg-red-100 text-red-600 rounded-full text-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
            >
              -
            </button>
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-bold text-primary-600">{currentRow}</div>
              {project.total_rows && (
                <div className="text-xs text-gray-500">/{project.total_rows}</div>
              )}
            </div>
            <button
              onClick={handleIncrementRow}
              className="w-10 h-10 bg-primary-600 text-white rounded-full text-2xl font-bold hover:bg-primary-700 transition shadow-md"
            >
              +
            </button>
          </div>

          {/* Barre progression */}
          {progressPercentage !== null && (
            <div className="flex-1 max-w-[200px]">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-primary-600 h-1 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-0.5">{progressPercentage}%</p>
            </div>
          )}

          {/* Timer compact */}
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
              <div className="text-xs text-gray-500">
                {(() => {
                  // [AI:Claude] Calculer temps total de toutes les sections
                  const totalSectionTime = sections.reduce((acc, s) => acc + (s.time_spent || 0), 0)
                  const totalHours = Math.floor(totalSectionTime / 3600)
                  const totalMins = Math.floor((totalSectionTime % 3600) / 60)

                  // [AI:Claude] Temps de la section en cours
                  const currentSection = sections.find(s => s.id === currentSectionId)
                  const currentSectionTime = currentSection?.time_spent || 0
                  const sectionHours = Math.floor(currentSectionTime / 3600)
                  const sectionMins = Math.floor((currentSectionTime % 3600) / 60)

                  if (currentSectionId && currentSectionTime > 0) {
                    return `Section: ${sectionHours}h ${sectionMins}min | Total: ${totalHours}h ${totalMins}min`
                  }
                  return `Total: ${totalHours}h ${totalMins}min`
                })()}
              </div>
            </div>
            {!isTimerRunning ? (
              <button
                onClick={handleStartSession}
                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition"
              >
                ▶️
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition"
              >
                ⏹️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* [AI:Claude] Tabs compacts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Tabs header */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'photos'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900'
              }`}
            >
              📸 Photos
              {projectPhotos.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                  {projectPhotos.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('patron')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'patron'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900'
              }`}
            >
              📄 Patron
              {(project.pattern_path || project.pattern_url) && (
                <span className="ml-1 text-green-600 text-sm">✓</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
                activeTab === 'description'
                  ? 'bg-white text-primary-600 border-b-2 border-primary-600'
                  : 'bg-gray-50 text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Description
              {project.description && (
                <span className="ml-1 text-green-600 text-sm">✓</span>
              )}
            </button>
          </div>
        </div>

            {/* Tab content */}
            <div className="p-4">
              {/* TAB PHOTOS */}
              {activeTab === 'photos' && (
                <div>
                  {projectPhotos.length > 0 && (
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Galerie photos</h2>
                      <button
                        onClick={() => setShowPhotoUploadModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
                      >
                        ➕ Ajouter photo
                      </button>
                    </div>
                  )}

{projectPhotos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-600 mb-4">Aucune photo pour ce projet</p>
                <button
                  onClick={() => setShowPhotoUploadModal(true)}
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  📸 Ajouter ma première photo
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* [AI:Claude] Grouper photos par photo originale */}
                {(() => {
                  // [AI:Claude] Séparer originales et variations
                  const originalPhotos = projectPhotos.filter(p => !p.parent_photo_id)
                  const variations = projectPhotos.filter(p => p.parent_photo_id)

                  return originalPhotos.map((originalPhoto) => {
                    // [AI:Claude] Trouver les variations de cette photo - comparer en Int
                    const photoVariations = variations.filter(
                      v => parseInt(v.parent_photo_id) === parseInt(originalPhoto.id)
                    )

                    return (
                      <div key={originalPhoto.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        {/* [AI:Claude] Variations IA EN HAUT - c'est le résultat principal ! */}
                        {photoVariations.length > 0 && (
                          <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                            <h4 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                              ✨ Photos générées par IA
                              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                {photoVariations.length}
                              </span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {photoVariations.map((variation) => (
                                <div key={variation.id} className="group relative">
                                  <img
                                    src={`http://patron-maker.local${variation.enhanced_path}`}
                                    alt={`Variation ${variation.ai_style || 'IA'}`}
                                    className="w-full h-64 object-cover rounded-lg border-2 border-purple-300 group-hover:border-purple-500 transition cursor-pointer shadow-md hover:shadow-xl"
                                    onClick={() => window.open(`http://patron-maker.local${variation.enhanced_path}`, '_blank')}
                                  />
                                  <div className="absolute top-3 left-3 bg-purple-600 text-white text-sm px-3 py-1.5 rounded-lg font-semibold shadow-lg flex items-center gap-1">
                                    ✨ {variation.ai_style || 'IA'}
                                  </div>
                                  {/* Bouton supprimer variation */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeletePhoto(variation.id)
                                    }}
                                    className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg text-sm transition shadow-lg opacity-0 group-hover:opacity-100"
                                    title="Supprimer cette variation"
                                  >
                                    🗑️
                                  </button>
                                  <button
                                    onClick={() => window.open(`http://patron-maker.local${variation.enhanced_path}`, '_blank')}
                                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  >
                                    <span className="text-white font-bold bg-black bg-opacity-75 px-4 py-2 rounded-lg text-base">
                                      🔍 Voir en grand
                                    </span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* [AI:Claude] Photo originale EN BAS - juste pour référence */}
                        <div className="bg-gray-50 p-4 border-t-2 border-gray-200">
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={`http://patron-maker.local${originalPhoto.original_path}`}
                                alt={originalPhoto.item_name || 'Photo originale'}
                                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                                onError={(e) => {
                                  console.error('Erreur chargement image:', originalPhoto.original_path)
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EErreur%3C/text%3E%3C/svg%3E'
                                }}
                              />
                              <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-90 text-white text-xs px-2 py-1 rounded font-medium">
                                📷 Originale
                              </div>
                              {/* Bouton supprimer */}
                              <button
                                onClick={() => handleDeletePhoto(originalPhoto.id)}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition shadow-lg"
                                title="Supprimer cette photo"
                              >
                                🗑️
                              </button>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 mb-1">
                                {originalPhoto.item_name || 'Sans nom'}
                              </h3>
                              {originalPhoto.description && (
                                <p className="text-sm text-gray-600 mb-2">{originalPhoto.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mb-3">
                                Ajoutée le {new Date(originalPhoto.created_at).toLocaleDateString('fr-FR')}
                              </p>

                              <button
                                onClick={() => openEnhanceModal(originalPhoto)}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition text-sm shadow-md"
                              >
                                ✨ Générer plus de variations
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
                </div>
              )}

              {/* TAB PATRON */}
              {activeTab === 'patron' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Patron du projet</h2>

            {project.pattern_path || project.pattern_url ? (
              <div>
                {/* Affichage du patron selon le type */}
                <div className="mb-4">
                  {project.pattern_url ? (
                    // URL externe
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-blue-50 p-4 border-b border-blue-200">
                        <p className="text-sm text-blue-800 mb-2">
                          🔗 Lien externe vers le patron
                        </p>
                        <a
                          href={project.pattern_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm break-all underline"
                        >
                          {project.pattern_url}
                        </a>
                      </div>
                      <div className="p-4 text-center">
                        <a
                          href={project.pattern_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                          🔗 Ouvrir dans un nouvel onglet
                        </a>
                      </div>
                    </div>
                  ) : project.pattern_path?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    // Image
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={project.pattern_path}
                        alt="Patron"
                        className="w-full h-auto cursor-pointer hover:opacity-95 transition"
                        onClick={() => window.open(project.pattern_path, '_blank')}
                      />
                      <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                        <button
                          onClick={() => window.open(project.pattern_path, '_blank')}
                          className="text-sm text-gray-600 hover:text-primary-600 transition font-medium"
                        >
                          🔍 Agrandir l'image
                        </button>
                      </div>
                    </div>
                  ) : (
                    // PDF
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        src={`http://patron-maker.local${project.pattern_path}`}
                        className="w-full h-96 border-0"
                        title="Patron PDF"
                      />
                      <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                        <a
                          href={`http://patron-maker.local${project.pattern_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-600 hover:text-primary-600 transition font-medium"
                        >
                          📄 Ouvrir le PDF en plein écran
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions de modification */}
                <div className="flex gap-2 justify-center text-xs">
                  <label className="block">
                    <span className="text-gray-500 cursor-pointer hover:text-primary-600 underline">
                      Remplacer le fichier
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePatternUpload}
                      className="hidden"
                      disabled={uploadingPattern}
                    />
                  </label>
                  <span className="text-gray-400">•</span>
                  <button
                    onClick={() => setShowPatternUrlModal(true)}
                    className="text-gray-500 hover:text-primary-600 underline"
                  >
                    Changer le lien
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Option 1: Upload fichier */}
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition">
                    <div className="text-4xl mb-2 text-center">📎</div>
                    <p className="text-gray-700 font-medium text-center mb-1">
                      Importer un fichier
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      PDF, JPG, PNG, WEBP
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePatternUpload}
                    className="hidden"
                    disabled={uploadingPattern}
                  />
                </label>

                {/* Option 2: URL */}
                <button
                  onClick={() => setShowPatternUrlModal(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition"
                  disabled={uploadingPattern}
                >
                  <div className="text-4xl mb-2">🔗</div>
                  <p className="text-gray-700 font-medium mb-1">
                    Lien vers une page web
                  </p>
                  <p className="text-xs text-gray-500">
                    YouTube, Pinterest, blog...
                  </p>
                </button>

                {uploadingPattern && (
                  <p className="text-sm text-gray-500 text-center">📤 Envoi en cours...</p>
                )}
              </div>
            )}
                </div>
              )}

              {/* TAB DESCRIPTION */}
              {activeTab === 'description' && (
                <div>
                  {project.description ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Description du projet</h2>
                        <button
                          onClick={openEditModal}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
                        >
                          ✏️ Modifier
                        </button>
                      </div>

                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {project.description}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-gray-600 mb-4">Aucune description pour ce projet</p>
                      <button
                        onClick={openEditModal}
                        className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                      >
                        ✏️ Ajouter une description
                      </button>
                    </div>
                  )}

                  {/* Infos techniques */}
                  {(project.hook_size || project.yarn_brand) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Informations techniques</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.hook_size && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">🪝</span>
                            <div>
                              <p className="text-xs text-gray-500">Taille du crochet</p>
                              <p className="font-medium text-gray-900">{project.hook_size}</p>
                            </div>
                          </div>
                        )}
                        {project.yarn_brand && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">🧶</span>
                            <div>
                              <p className="text-xs text-gray-500">Marque de fil</p>
                              <p className="font-medium text-gray-900">{project.yarn_brand}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

      {/* [AI:Claude] Modal d'ajout d'URL de patron */}
      {showPatternUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              🔗 Lien vers le patron
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Collez le lien de votre patron (YouTube, Pinterest, blog, etc.)
            </p>
            <input
              type="url"
              value={patternUrl}
              onChange={(e) => setPatternUrl(e.target.value)}
              placeholder="https://example.com/mon-patron"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPatternUrlModal(false)
                  setPatternUrl('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handlePatternUrlSubmit}
                disabled={uploadingPattern}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              >
                {uploadingPattern ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal d'upload de photo */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              📸 Ajouter une photo
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez une photo de votre projet
            </p>

            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-400 hover:bg-primary-50 transition text-center">
                <div className="text-5xl mb-3">📷</div>
                <p className="text-gray-700 font-medium mb-1">
                  Cliquez pour sélectionner
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WEBP
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>

            {uploadingPhoto && (
              <p className="text-sm text-gray-500 text-center mt-4">
                📤 Upload en cours...
              </p>
            )}

            <div className="mt-4">
              <button
                onClick={() => setShowPhotoUploadModal(false)}
                disabled={uploadingPhoto}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal d'embellissement IA - v0.11.0 WORKFLOW OPTIMISÉ */}
      {showEnhanceModal && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
              <h2 className="text-2xl font-bold text-gray-900">✨ Générer vos photos IA</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPhoto.item_name} • Projet: {project.type || 'Autre'}
              </p>
            </div>

            <form onSubmit={handleEnhancePhoto} className="p-6">
              {/* Photo actuelle */}
              <div className="mb-6 bg-gray-100 rounded-lg border-2 border-gray-200 p-4">
                <img
                  src={`http://patron-maker.local${selectedPhoto.original_path}`}
                  alt={selectedPhoto.item_name}
                  className="max-h-48 w-auto object-contain rounded-lg mx-auto"
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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

              {/* Résumé des crédits */}
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

      {/* [AI:Claude] Modal d'édition du projet */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              ✏️ Modifier le projet
            </h3>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Décrivez votre projet..."
              />
            </div>

            {/* Taille du crochet */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🪝 Taille du crochet
              </label>
              <input
                type="text"
                value={editForm.hook_size}
                onChange={(e) => setEditForm({ ...editForm, hook_size: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: 3.5mm"
              />
            </div>

            {/* Marque de fil */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🧶 Marque de fil
              </label>
              <input
                type="text"
                value={editForm.yarn_brand}
                onChange={(e) => setEditForm({ ...editForm, yarn_brand: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Phildar Phil Coton 3"
              />
            </div>

            {/* Boutons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={savingProject}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProject}
                disabled={savingProject}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
              >
                {savingProject ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal d'alerte personnalisée */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className={`text-xl font-bold mb-4 ${
              alertData.type === 'success' ? 'text-green-600' :
              alertData.type === 'error' ? 'text-red-600' :
              'text-blue-600'
            }`}>
              {alertData.title}
            </h3>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{alertData.message}</p>
            <button
              onClick={() => setShowAlertModal(false)}
              className={`w-full px-4 py-3 rounded-lg font-medium text-white transition ${
                alertData.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                alertData.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal de confirmation personnalisée */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {confirmData.title}
            </h3>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{confirmData.message}</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmData.onConfirm()
                  setShowConfirmModal(false)
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal d'ajout/édition de section */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingSection ? '✏️ Modifier la section' : '➕ Ajouter une section'}
            </h2>

            <form onSubmit={handleSaveSection}>
              {/* Nom */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la section <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Face, Dos, Manche gauche..."
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Notes sur cette section..."
                />
              </div>

              {/* Nombre de rangs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre total de rangs (optionnel)
                </label>
                <input
                  type="number"
                  value={sectionForm.total_rows}
                  onChange={(e) => setSectionForm({ ...sectionForm, total_rows: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: 50"
                  min="0"
                />
              </div>

              {/* Boutons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSectionModal(false)
                    setSectionForm({ name: '', description: '', total_rows: '' })
                    setEditingSection(null)
                  }}
                  disabled={savingSection}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingSection}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {savingSection ? 'Enregistrement...' : (editingSection ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectCounter
