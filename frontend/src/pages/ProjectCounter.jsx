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

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useImagePreview } from '../hooks/useImagePreview'
import api from '../services/api'
import PDFViewer from '../components/PDFViewer'
import ImageLightbox from '../components/ImageLightbox'
import ProxyViewer from '../components/ProxyViewer'

const ProjectCounter = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const {
    previewImage,
    isGeneratingPreview,
    previewError,
    previewContext,
    generatePreview,
    clearPreview
  } = useImagePreview()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // [AI:Claude] Sections du projet
  const [sections, setSections] = useState([])
  const [currentSectionId, setCurrentSectionId] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set()) // [AI:Claude] Sections dépliées
  const [sectionsCollapsed, setSectionsCollapsed] = useState(true) // [AI:Claude] Tout le bloc sections replié/déplié par défaut

  // [AI:Claude] État du compteur
  const [currentRow, setCurrentRow] = useState(0)
  const [stitchCount, setStitchCount] = useState(0)

  // [AI:Claude] Timer de session
  const [sessionId, setSessionId] = useState(null)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isTimerPaused, setIsTimerPaused] = useState(false)
  const [pausedTime, setPausedTime] = useState(0) // [AI:Claude] Temps accumulé avant pause
  const [sessionStartRow, setSessionStartRow] = useState(0) // [AI:Claude] Rang au début de la session

  // [AI:Claude] FIX BUG x4: Ref pour éviter les multiples appels à endSession
  const isEndingSessionRef = useRef(false)

  // [AI:Claude] Photos du projet
  const [projectPhotos, setProjectPhotos] = useState([])

  // [AI:Claude] Patron (PDF, Image ou URL)
  const [patternFile, setPatternFile] = useState(null)
  const [uploadingPattern, setUploadingPattern] = useState(false)
  const [showPatternUrlModal, setShowPatternUrlModal] = useState(false)
  const [patternUrl, setPatternUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // [AI:Claude] Choisir patron depuis bibliothèque
  const [showPatternLibraryModal, setShowPatternLibraryModal] = useState(false)
  const [libraryPatterns, setLibraryPatterns] = useState([])
  const [loadingLibraryPatterns, setLoadingLibraryPatterns] = useState(false)

  // [AI:Claude] Upload photo projet
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // [AI:Claude] Embellir photo avec IA - v0.12.1 SIMPLIFIÉ (1 photo, preset auto)
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedContext, setSelectedContext] = useState(null) // [AI:Claude] Contexte auto-sélectionné
  const [enhancing, setEnhancing] = useState(false)
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
    yarn_brand: '',
    type: ''
  })
  const [savingProject, setSavingProject] = useState(false)

  // [AI:Claude] Menu changement de catégorie
  const [showTechniqueMenu, setShowTechniqueMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [customType, setCustomType] = useState('')
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false)

  // [AI:Claude] Tabs pour Patron/Photos/Description
  const [activeTab, setActiveTab] = useState('patron')

  // [AI:Claude] Notes du projet
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // [AI:Claude] Lightbox pour images de patron
  const [lightboxImage, setLightboxImage] = useState(null)

  // [AI:Claude] Détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false)

  // [AI:Claude] Gestion des sections
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sectionForm, setSectionForm] = useState({
    name: '',
    description: '',
    total_rows: ''
  })
  const [savingSection, setSavingSection] = useState(false)

  // [AI:Claude] Modal pour ajouter le patron à la bibliothèque
  const [showAddToLibraryModal, setShowAddToLibraryModal] = useState(false)
  const [uploadedPatternData, setUploadedPatternData] = useState(null)
  const [libraryForm, setLibraryForm] = useState({
    name: '',
    description: '',
    category: 'other',
    technique: '',
    difficulty: 'intermediate'
  })
  const [savingToLibrary, setSavingToLibrary] = useState(false)

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

  // [AI:Claude] Charger le projet au montage
  useEffect(() => {
    fetchProject()
    fetchProjectPhotos()
    fetchCredits()
    fetchSections()
  }, [projectId])

  // [AI:Claude] Fermer les menus quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showTechniqueMenu && !e.target.closest('.technique-menu')) {
        setShowTechniqueMenu(false)
      }
      if (showTypeMenu && !e.target.closest('.type-menu')) {
        setShowTypeMenu(false)
        setShowCustomTypeInput(false)
      }
    }

    if (showTechniqueMenu || showTypeMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showTechniqueMenu, showTypeMenu])

  // [AI:Claude] Mettre à jour currentRow UNIQUEMENT quand on change de section
  // [AI:Claude] FIX BUG: Ajouter 'sections' dans les dépendances pour éviter la propagation
  useEffect(() => {
    if (currentSectionId && sections.length > 0) {
      const activeSection = sections.find(s => s.id === currentSectionId)
      if (activeSection) {
        setCurrentRow(activeSection.current_row || 0)
      }
    } else if (project && !currentSectionId) {
      // Aucune section active, utiliser le compteur global du projet
      setCurrentRow(project.current_row || 0)
    }
  }, [currentSectionId, sections, project])

  // [AI:Claude] Timer tick
  useEffect(() => {
    let interval
    if (isTimerRunning && !isTimerPaused && sessionStartTime) {
      interval = setInterval(() => {
        const elapsed = pausedTime + Math.floor((Date.now() - sessionStartTime) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, isTimerPaused, sessionStartTime, pausedTime])


  // [AI:Claude] Sauvegarder automatiquement la session si l'utilisateur quitte la page
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // [AI:Claude] FIX BUG x4: Vérifier qu'on n'est pas déjà en train de terminer la session
      if (sessionId && isTimerRunning && !isEndingSessionRef.current) {
        isEndingSessionRef.current = true

        // [AI:Claude] Calculer la durée exacte au moment de la fermeture
        let exactDuration = 0
        if (isTimerPaused) {
          exactDuration = pausedTime
        } else if (sessionStartTime) {
          exactDuration = pausedTime + Math.floor((Date.now() - sessionStartTime) / 1000)
        }

        console.log('[TIMER] Beforeunload - Durée exacte:', exactDuration, 's')

        const rowsCompleted = currentRow - sessionStartRow

        const data = JSON.stringify({
          session_id: sessionId,
          rows_completed: rowsCompleted,
          duration: exactDuration,
          notes: null
        })

        const token = localStorage.getItem('token')

        // sendBeacon ne supporte pas les headers personnalisés facilement,
        // donc on utilise fetch avec keepalive
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/projects/${projectId}/sessions/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: data,
          keepalive: true // Important : garantit que la requête continue même si la page se ferme
        }).catch(err => console.error('Erreur sauvegarde session:', err))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // [AI:Claude] FIX BUG x4: Ne pas terminer la session dans le cleanup si elle est déjà en cours de fermeture
      // Le cleanup se déclenche à chaque changement de dépendance, ce qui causerait des appels multiples
      // On laisse handleEndSession et handleChangeSection gérer explicitement la fermeture
    }
  }, [sessionId, isTimerRunning, currentRow, sessionStartRow, projectId, pausedTime, sessionStartTime, isTimerPaused])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/projects/${projectId}`)
      const projectData = response.data.project

      setProject(projectData)
      setCurrentRow(projectData.current_row || 0)
      setNotes(projectData.notes || '')

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
      const loadedSections = response.data.sections || []
      setSections(loadedSections)

      // [AI:Claude] Si aucune section n'est active et qu'il y a des sections, en sélectionner une
      if (!currentSectionId && loadedSections.length > 0) {
        // Priorité 1 : Section sauvegardée dans localStorage (dernière utilisée)
        const savedSectionId = localStorage.getItem(`currentSection_${projectId}`)
        if (savedSectionId) {
          const savedSection = loadedSections.find(s => s.id === parseInt(savedSectionId))
          if (savedSection) {
            setCurrentSectionId(savedSection.id)
            return
          }
        }

        // Priorité 2 : Première section non terminée
        const firstIncomplete = loadedSections.find(s => !s.is_completed)
        if (firstIncomplete) {
          setCurrentSectionId(firstIncomplete.id)
        } else {
          // Priorité 3 : Première section de la liste (si toutes sont terminées)
          setCurrentSectionId(loadedSections[0].id)
        }
      }
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

  // [AI:Claude] Helper pour calculer la durée exacte du timer en secondes
  const getExactDuration = () => {
    if (!isTimerRunning || !sessionStartTime) return 0

    if (isTimerPaused) {
      // Si en pause, retourner le temps accumulé
      return pausedTime
    } else {
      // Si en cours, calculer le temps total
      return pausedTime + Math.floor((Date.now() - sessionStartTime) / 1000)
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
      yarn_brand: project.yarn_brand || '',
      type: project.type || ''
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

  // [AI:Claude] Changer la technique (tricot/crochet)
  const handleChangeTechnique = async (newTechnique) => {
    try {
      await api.put(`/projects/${projectId}`, { technique: newTechnique })
      await fetchProject()
      setShowTechniqueMenu(false)
      showAlert('Catégorie modifiée avec succès !', 'success')
    } catch (err) {
      console.error('Erreur changement technique:', err)
      showAlert('Erreur lors du changement de catégorie', 'error')
    }
  }

  // [AI:Claude] Changer le type de projet
  const handleChangeType = async (newType) => {
    try {
      await api.put(`/projects/${projectId}`, { type: newType })
      await fetchProject()
      setShowTypeMenu(false)
      setShowCustomTypeInput(false)
      setCustomType('')
      showAlert('Type de projet modifié avec succès !', 'success')
    } catch (err) {
      console.error('Erreur changement type:', err)
      showAlert('Erreur lors du changement de type', 'error')
    }
  }

  // [AI:Claude] Sauvegarder le type personnalisé
  const handleSaveCustomType = () => {
    if (customType.trim()) {
      handleChangeType(customType.trim())
    }
  }

  // [AI:Claude] Ouvrir la modal des notes
  const handleOpenNotes = () => {
    setNotes(project.notes || '')
    setShowNotes(true)
  }

  // [AI:Claude] Sauvegarder les notes du projet
  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await api.put(`/projects/${projectId}`, { notes })
      await fetchProject()
      setShowNotes(false)
      showAlert('Notes sauvegardées avec succès !', 'success')
    } catch (err) {
      console.error('Erreur sauvegarde notes:', err)
      showAlert('Erreur lors de la sauvegarde des notes', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  // [AI:Claude] Liste des types (identique à la création de projet)
  const getProjectTypes = () => {
    return ['Vêtements', 'Accessoires', 'Maison/Déco', 'Jouets/Peluches', 'Accessoires bébé']
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

      // [AI:Claude] Récupérer les données du projet mis à jour pour avoir pattern_path
      const updatedProject = await api.get(`/projects/${projectId}`)
      console.log('🔍 Updated project response:', updatedProject.data)

      // [AI:Claude] Gérer la structure de réponse (data.project ou data.data.project)
      const projectData = updatedProject.data.project || updatedProject.data.data?.project
      console.log('🔍 Project data:', projectData)

      if (projectData && projectData.pattern_path) {
        // [AI:Claude] Ouvrir le modal pour proposer d'ajouter à la bibliothèque
        setUploadedPatternData({
          pattern_path: projectData.pattern_path,
          pattern_url: projectData.pattern_url,
          pattern_type: file.type.startsWith('image/') ? 'image' : 'pdf'
        })

        // [AI:Claude] Pré-remplir le formulaire avec le nom du projet
        setLibraryForm({
          name: project.name || '',
          description: '',
          category: 'other',
          technique: '',
          difficulty: 'intermediate'
        })

        console.log('✅ Opening library modal')
        setShowAddToLibraryModal(true)
      } else {
        console.warn('⚠️ No pattern_path in project data')
      }

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

  // [AI:Claude] Charger les patrons de la bibliothèque
  const fetchLibraryPatterns = async () => {
    setLoadingLibraryPatterns(true)
    try {
      const response = await api.get('/pattern-library')
      setLibraryPatterns(response.data.patterns || [])
    } catch (err) {
      console.error('Erreur chargement bibliothèque:', err)
      showAlert('Erreur lors du chargement de votre bibliothèque', 'error')
    } finally {
      setLoadingLibraryPatterns(false)
    }
  }

  // [AI:Claude] Sélectionner un patron depuis la bibliothèque
  const handleSelectLibraryPattern = async (pattern) => {
    setUploadingPattern(true)
    try {
      await api.post(`/projects/${projectId}/pattern-from-library`, {
        pattern_library_id: pattern.id
      })

      await fetchProject()
      setShowPatternLibraryModal(false)
      showAlert(`✅ Patron "${pattern.name}" ajouté au projet !`, 'success')
    } catch (err) {
      console.error('Erreur ajout patron depuis bibliothèque:', err)
      showAlert('Erreur lors de l\'ajout du patron', 'error')
    } finally {
      setUploadingPattern(false)
    }
  }

  // [AI:Claude] Ajouter le patron uploadé à la bibliothèque
  const handleAddToLibrary = async () => {
    if (!libraryForm.name.trim()) {
      showAlert('Le nom du patron est obligatoire', 'error')
      return
    }

    if (!uploadedPatternData || !uploadedPatternData.pattern_path) {
      showAlert('Aucun fichier à ajouter', 'error')
      return
    }

    setSavingToLibrary(true)

    try {
      await api.post('/pattern-library', {
        name: libraryForm.name.trim(),
        description: libraryForm.description.trim() || null,
        category: libraryForm.category,
        technique: libraryForm.technique.trim() || null,
        difficulty: libraryForm.difficulty,
        existing_file_path: uploadedPatternData.pattern_path
      })

      setShowAddToLibraryModal(false)
      setUploadedPatternData(null)
      setLibraryForm({
        name: '',
        description: '',
        category: 'other',
        technique: '',
        difficulty: 'intermediate'
      })

      showAlert('✅ Patron ajouté à votre bibliothèque !', 'success')
    } catch (err) {
      console.error('Erreur ajout bibliothèque:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'ajout à la bibliothèque'
      showAlert(errorMsg, 'error')
    } finally {
      setSavingToLibrary(false)
    }
  }

  // [AI:Claude] Passer l'ajout à la bibliothèque
  const handleSkipLibrary = () => {
    setShowAddToLibraryModal(false)
    setUploadedPatternData(null)
    setLibraryForm({
      name: '',
      description: '',
      category: 'other',
      technique: '',
      difficulty: 'intermediate'
    })
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

  // [AI:Claude] Embellir une photo avec IA - v0.12.1 SIMPLIFIÉ
  const handleEnhancePhoto = async (e) => {
    e.preventDefault()

    if (!selectedPhoto || !selectedContext) return

    // [AI:Claude] Vérifier les crédits (1 photo = 1 crédit)
    if (!credits || credits.total_available < 1) {
      showAlert(`Vous n'avez pas assez de crédits. Il vous faut 1 crédit.`, 'error')
      return
    }

    setEnhancing(true)

    try {
      // [AI:Claude] Utiliser le context de la preview si disponible, sinon le context sélectionné
      const contextToUse = previewContext || selectedContext.key

      // [AI:Claude] Appel API pour génération HD avec le même context que la preview
      const response = await api.post(`/photos/${selectedPhoto.id}/enhance-multiple`, {
        contexts: [contextToUse],
        project_category: detectProjectCategory(project?.type || '')
      })

      await fetchProjectPhotos()
      await fetchCredits()
      setShowEnhanceModal(false)
      setSelectedPhoto(null)
      clearPreview()

      showAlert(`✨ Photo générée avec succès !`, 'success')
    } catch (err) {
      console.error('Erreur embellissement photo:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'embellissement'
      showAlert(errorMsg, 'error')
    } finally {
      setEnhancing(false)
    }
  }

  // [AI:Claude] Générer preview gratuite (0 crédit) - v0.12.1
  const handleGeneratePreview = async () => {
    if (!selectedPhoto || !selectedContext) return

    const result = await generatePreview(selectedPhoto.id, selectedContext.key)

    if (!result.success) {
      showAlert(result.error || 'Erreur lors de la génération de l\'aperçu', 'error')
    }
  }

  // [AI:Claude] Ouvrir modal d'embellissement avec sélection du premier style par défaut
  const openEnhanceModal = (photo) => {
    setSelectedPhoto(photo)
    clearPreview() // [AI:Claude] Réinitialiser la preview
    const category = detectProjectCategory(project?.type || '')
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
      { key: 'lifestyle', label: 'Lifestyle', icon: '🌟', desc: 'Style Instagram naturel' },
      { key: 'studio', label: 'Studio', icon: '✨', desc: 'Professionnel fond blanc' },
      { key: 'flat_lay', label: 'Flat lay', icon: '📐', desc: 'Vue du dessus' }
    ]
  }


  // [AI:Claude] Démarrer la session avec section_id
  const handleStartSession = async () => {
    try {
      // [AI:Claude] FIX BUG x4: Réinitialiser le flag au démarrage d'une nouvelle session
      isEndingSessionRef.current = false

      const response = await api.post(`/projects/${projectId}/sessions/start`, {
        section_id: currentSectionId // [AI:Claude] Tracking par section
      })
      setSessionId(response.data.session_id)
      setSessionStartTime(Date.now())
      setSessionStartRow(currentRow) // [AI:Claude] Sauvegarder le rang de départ
      setIsTimerRunning(true)
      setIsTimerPaused(false)
      setPausedTime(0)
    } catch (err) {
      console.error('Erreur démarrage session:', err)
      showAlert('Erreur lors du démarrage de la session', 'error')
    }
  }

  // [AI:Claude] Mettre en pause la session
  const handlePauseSession = () => {
    if (!isTimerRunning || isTimerPaused) return

    // [AI:Claude] Sauvegarder le temps actuel
    const currentElapsed = pausedTime + Math.floor((Date.now() - sessionStartTime) / 1000)
    setPausedTime(currentElapsed)
    setElapsedTime(currentElapsed)
    setIsTimerPaused(true)
  }

  // [AI:Claude] Reprendre la session après pause
  const handleResumeSession = () => {
    if (!isTimerRunning || !isTimerPaused) return

    // [AI:Claude] Redémarrer le chrono depuis maintenant
    setSessionStartTime(Date.now())
    setIsTimerPaused(false)
  }

  // [AI:Claude] Terminer la session
  const handleEndSession = async () => {
    if (!sessionId) return

    // [AI:Claude] FIX BUG x4: Marquer qu'on est en train de terminer
    if (isEndingSessionRef.current) {
      console.log('[TIMER] Session déjà en cours de fermeture, skip')
      return
    }
    isEndingSessionRef.current = true

    try {
      const rowsCompleted = currentRow - sessionStartRow

      // [AI:Claude] FIX BUG: Calculer la durée exacte au moment de terminer
      const exactDuration = getExactDuration()

      console.log('[TIMER] Fin session - Durée exacte:', exactDuration, 's')

      await api.post(`/projects/${projectId}/sessions/end`, {
        session_id: sessionId,
        rows_completed: rowsCompleted,
        duration: exactDuration, // [AI:Claude] Envoyer la durée calculée
        notes: null
      })

      await fetchProject()
      await fetchSections() // [AI:Claude] Rafraîchir les sections pour voir le temps mis à jour

      setSessionId(null)
      setSessionStartTime(null)
      setSessionStartRow(0)
      setIsTimerRunning(false)
      setIsTimerPaused(false)
      setPausedTime(0)
      setElapsedTime(0)

      // [AI:Claude] Réinitialiser le flag après avoir tout nettoyé
      isEndingSessionRef.current = false
    } catch (err) {
      console.error('Erreur fin session:', err)
      showAlert('Erreur lors de la fin de session', 'error')
      isEndingSessionRef.current = false // Réinitialiser même en cas d'erreur
    }
  }

  // [AI:Claude] Incrémenter le rang (sauvegarde directe sans modal)
  const handleIncrementRow = async () => {
    // [AI:Claude] Vérifier si on a atteint le maximum
    let maxRows = null
    if (currentSectionId && sections.length > 0) {
      const activeSection = sections.find(s => s.id === currentSectionId)
      if (activeSection && activeSection.total_rows) {
        maxRows = activeSection.total_rows
      }
    } else if (project && project.total_rows) {
      maxRows = project.total_rows
    }

    // Bloquer si on a atteint le maximum
    if (maxRows !== null && currentRow >= maxRows) {
      showAlert(`🎉 Vous avez terminé tous les rangs (${maxRows}/${maxRows}) !`, 'success')
      return
    }

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

      // [AI:Claude] Mettre à jour la progression de la section localement
      if (currentSectionId) {
        setSections(prevSections =>
          prevSections.map(s =>
            s.id === currentSectionId
              ? { ...s, current_row: newRow }
              : s
          )
        )
      }

      // [AI:Claude] Si on vient de terminer, marquer comme terminé automatiquement
      if (maxRows !== null && newRow === maxRows) {
        if (currentSectionId) {
          // Marquer la section comme terminée
          try {
            await api.post(`/projects/${projectId}/sections/${currentSectionId}/complete`)
            await fetchSections()

            // Vérifier si toutes les sections sont terminées pour marquer le projet comme terminé
            const updatedSections = await api.get(`/projects/${projectId}/sections`)
            const allCompleted = updatedSections.data.sections?.every(s => s.is_completed === 1)

            if (allCompleted && sections.length > 0) {
              await api.put(`/projects/${projectId}`, { status: 'completed' })
              showAlert('🎉🎉 Toutes les sections terminées ! Projet complet !', 'success')
            } else {
              showAlert(`🎉 Section terminée ! (${maxRows}/${maxRows})`, 'success')
            }

            await fetchProject()
          } catch (err) {
            console.error('Erreur marquage section terminée:', err)
            showAlert(`🎉 Section terminée ! (${maxRows}/${maxRows})`, 'success')
          }
        } else {
          // Pas de sections, marquer le projet global comme terminé
          try {
            await api.put(`/projects/${projectId}`, { status: 'completed' })
            await fetchProject()
            showAlert(`🎉 Projet terminé ! (${maxRows}/${maxRows})`, 'success')
          } catch (err) {
            console.error('Erreur marquage projet terminé:', err)
            showAlert(`🎉 Projet terminé ! (${maxRows}/${maxRows})`, 'success')
          }
        }
      }
    } catch (err) {
      console.error('Erreur sauvegarde rang:', err)
      showAlert('Erreur lors de la sauvegarde du rang', 'error')
      // [AI:Claude] Rollback en cas d'erreur
      setCurrentRow(currentRow)
    }
  }

  // [AI:Claude] Décrémenter le rang (supprime le dernier rang au lieu de créer un nouveau)
  const handleDecrementRow = async () => {
    if (currentRow > 0) {
      const newRow = currentRow - 1

      try {
        // [AI:Claude] Récupérer tous les rangs de cette section
        const response = await api.get(`/projects/${projectId}/rows`, {
          params: { section_id: currentSectionId }
        })

        const rows = response.data.rows || []

        // [AI:Claude] Trouver le rang avec row_number = currentRow (le dernier)
        const lastRow = rows.find(r => r.row_number === currentRow && r.section_id === currentSectionId)

        if (lastRow) {
          // [AI:Claude] Supprimer ce rang
          await api.delete(`/projects/${projectId}/rows/${lastRow.id}`)
        }

        // [AI:Claude] Mettre à jour le compteur
        setCurrentRow(newRow)

        // [AI:Claude] Mettre à jour la progression de la section localement
        if (currentSectionId) {
          setSections(prevSections =>
            prevSections.map(s =>
              s.id === currentSectionId
                ? { ...s, current_row: newRow }
                : s
            )
          )
        }
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
      // [AI:Claude] FIX BUG x4: Vérifier si on est déjà en train de terminer une session
      const wasTimerRunning = isTimerRunning
      const oldSessionId = sessionId

      if (oldSessionId && wasTimerRunning) {
        if (isEndingSessionRef.current) {
          console.log('[TIMER] Session déjà en cours de fermeture lors du changement, skip endSession')
        } else {
          isEndingSessionRef.current = true

          // [AI:Claude] FIX BUG: Calculer la durée exacte AVANT de tout réinitialiser
          const exactDuration = getExactDuration()

          // [AI:Claude] Capturer les valeurs nécessaires AVANT les setState
          const oldSessionStartRow = sessionStartRow
          const oldCurrentRow = currentRow

          console.log('[TIMER] Changement section - Durée exacte:', exactDuration, 's')

          // [AI:Claude] Réinitialiser IMMÉDIATEMENT l'état du timer pour stopper le useEffect
          setIsTimerRunning(false)
          setIsTimerPaused(false)
          setPausedTime(0)
          setElapsedTime(0)
          setSessionStartTime(null)

          try {
            const rowsCompleted = oldCurrentRow - oldSessionStartRow

            await api.post(`/projects/${projectId}/sessions/end`, {
              session_id: oldSessionId,
              rows_completed: rowsCompleted,
              duration: exactDuration, // [AI:Claude] Durée exacte calculée avant réinitialisation
              notes: null
            })

            // [AI:Claude] Réinitialiser l'ID de session après la sauvegarde
            setSessionId(null)
            setSessionStartRow(0)

            // [AI:Claude] Réinitialiser le flag après la sauvegarde
            isEndingSessionRef.current = false
          } catch (err) {
            console.error('Erreur sauvegarde session lors du changement:', err)
            isEndingSessionRef.current = false
            // Continuer quand même le changement de section
          }
        }
      } else {
        // [AI:Claude] Pas de session active, juste réinitialiser les states
        setIsTimerRunning(false)
        setIsTimerPaused(false)
        setPausedTime(0)
        setElapsedTime(0)
        setSessionStartTime(null)
        setSessionId(null)
        setSessionStartRow(0)
      }

      // [AI:Claude] Changer la section active
      await api.post(`/projects/${projectId}/current-section`, {
        section_id: sectionId
      })

      // [AI:Claude] Rafraîchir les sections AVANT de changer currentSectionId
      // pour s'assurer que le useEffect aura les bonnes valeurs
      await fetchSections()

      // [AI:Claude] Maintenant on peut changer la section en cours
      setCurrentSectionId(sectionId)

      // [AI:Claude] Sauvegarder la section active dans localStorage pour la retrouver au retour
      localStorage.setItem(`currentSection_${projectId}`, sectionId.toString())

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
            // [AI:Claude] Nettoyer le localStorage si on supprime la section active
            localStorage.removeItem(`currentSection_${projectId}`)
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
      await fetchProject()

      const newState = !section.is_completed
      let alertMessage = newState ? '✅ Section marquée comme terminée' : 'Section réouverte'

      // [AI:Claude] Recharger les sections pour avoir les données à jour
      const response = await api.get(`/projects/${projectId}/sections`)
      const updatedSections = response.data.sections || []

      // [AI:Claude] Si la section vient d'être marquée comme terminée
      if (newState && sections.length > 0) {
        // Vérifier si toutes les sections sont terminées
        const allSectionsCompleted = updatedSections.every(s => s.is_completed === 1)

        if (allSectionsCompleted && project.status !== 'completed') {
          // Marquer automatiquement le projet comme terminé
          await api.put(`/projects/${projectId}`, { status: 'completed' })
          await fetchProject()
          alertMessage = '🎉 Toutes les sections sont terminées ! Projet marqué comme terminé.'
        }
      } else if (!newState && project.status === 'completed') {
        // [AI:Claude] Si une section a été réouverte et que le projet était terminé, réouvrir le projet
        await api.put(`/projects/${projectId}`, { status: 'in_progress' })
        await fetchProject()
        alertMessage = 'Section réouverte. Projet marqué comme en cours.'
      }

      showAlert(alertMessage, 'success')
    } catch (err) {
      console.error('Erreur toggle section:', err)
      showAlert('Erreur lors de la mise à jour', 'error')
    }
  }

  // [AI:Claude] Marquer le projet global comme terminé/en cours
  const handleToggleProjectComplete = async () => {
    try {
      const isCompleted = project.status === 'completed'
      const newStatus = isCompleted ? 'in_progress' : 'completed'

      await api.put(`/projects/${projectId}`, { status: newStatus })

      // [AI:Claude] Si on marque le projet comme terminé et qu'il y a des sections
      if (newStatus === 'completed' && sections.length > 0) {
        // Marquer toutes les sections comme terminées et mettre les rangs à 100%
        for (const section of sections) {
          if (section.is_completed !== 1) {
            // Marquer la section comme terminée
            await api.post(`/projects/${projectId}/sections/${section.id}/complete`)
          }
          // Mettre current_row = total_rows pour chaque section
          if (section.total_rows && section.current_row !== section.total_rows) {
            await api.put(`/projects/${projectId}/sections/${section.id}`, {
              current_row: section.total_rows
            })
          }
        }
        await fetchSections()
      }

      await fetchProject()

      showAlert(
        isCompleted ? 'Projet réouvert' : '🎉 Projet marqué comme terminé !',
        'success'
      )
    } catch (err) {
      console.error('Erreur toggle project:', err)
      showAlert('Erreur lors de la mise à jour', 'error')
    }
  }

  // [AI:Claude] Déplier/replier une section (accordéon - une seule ouverte à la fois)
  const toggleSectionExpanded = (sectionId, e) => {
    if (e) e.stopPropagation()
    setExpandedSections(prev => {
      const newSet = new Set()
      // Si la section était déjà ouverte, on la ferme (newSet reste vide)
      // Sinon on ouvre uniquement celle-ci
      if (!prev.has(sectionId)) {
        newSet.add(sectionId)
      }
      return newSet
    })
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

  // [AI:Claude] Calculer la progression GLOBALE du projet (toutes sections)
  const getGlobalProgressData = () => {
    // [AI:Claude] Si le projet est marqué comme terminé, forcer 100%
    if (project && project.status === 'completed') {
      const totalRows = sections.length > 0
        ? sections.reduce((sum, s) => sum + (s.total_rows || 0), 0)
        : project.total_rows || 0
      return {
        current: totalRows,
        total: totalRows,
        percentage: 100
      }
    }

    if (sections.length > 0) {
      // Somme de tous les rangs complétés et tous les rangs totaux
      const totalCompleted = sections.reduce((sum, s) => sum + (s.current_row || 0), 0)
      const totalRows = sections.reduce((sum, s) => sum + (s.total_rows || 0), 0)

      if (totalRows > 0) {
        return {
          current: totalCompleted,
          total: totalRows,
          percentage: Math.round((totalCompleted / totalRows) * 100)
        }
      }
    }
    // Fallback: projet global sans sections
    if (project && project.total_rows) {
      return {
        current: project.current_row || 0,
        total: project.total_rows,
        percentage: Math.round(((project.current_row || 0) / project.total_rows) * 100)
      }
    }
    return { current: 0, total: null, percentage: null }
  }

  // [AI:Claude] Calculer la progression de la SECTION ACTIVE (pour la barre 2)
  const getSectionProgressData = () => {
    if (currentSectionId && sections.length > 0) {
      const activeSection = sections.find(s => s.id === currentSectionId)
      if (activeSection) {
        // [AI:Claude] Si la section est terminée, forcer 100%
        if (activeSection.is_completed === 1 && activeSection.total_rows) {
          return {
            current: activeSection.total_rows,
            total: activeSection.total_rows,
            percentage: 100
          }
        }
        if (activeSection.total_rows) {
          return {
            current: activeSection.current_row || 0,
            total: activeSection.total_rows,
            percentage: Math.round(((activeSection.current_row || 0) / activeSection.total_rows) * 100)
          }
        }
      }
    }
    // Fallback: projet global
    if (project) {
      // [AI:Claude] Si le projet est terminé, forcer 100%
      if (project.status === 'completed' && project.total_rows) {
        return {
          current: project.total_rows,
          total: project.total_rows,
          percentage: 100
        }
      }
      if (project.total_rows) {
        return {
          current: project.current_row || 0,
          total: project.total_rows,
          percentage: Math.round(((project.current_row || 0) / project.total_rows) * 100)
        }
      }
    }
    return { current: 0, total: null, percentage: null }
  }

  const globalProgressData = getGlobalProgressData()
  const globalProgressPercentage = globalProgressData.percentage

  const progressData = getSectionProgressData()
  const progressPercentage = progressData.percentage

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      {/* [AI:Claude] Header ultra-compact */}
      <div className="mb-3">
        <div>
          <Link
            to="/my-projects"
            className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition mb-1"
          >
            ← Retour
          </Link>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <div className="relative type-menu">
                <button
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold hover:bg-gray-200 transition cursor-pointer flex items-center gap-1"
                >
                  {project.type || 'Type'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showTypeMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 py-1 z-50 min-w-[150px] max-h-[300px] overflow-y-auto">
                    {getProjectTypes().map((type) => (
                      <button
                        key={type}
                        onClick={() => handleChangeType(type)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition ${
                          project.type === type ? 'bg-gray-50 font-bold text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative technique-menu">
                <button
                  onClick={() => setShowTechniqueMenu(!showTechniqueMenu)}
                  className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold hover:bg-primary-100 transition cursor-pointer flex items-center gap-1"
                >
                  {project.technique === 'tricot' ? 'Tricot' : 'Crochet'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showTechniqueMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 py-1 z-50 min-w-[120px]">
                    <button
                      onClick={() => handleChangeTechnique('tricot')}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition ${
                        project.technique === 'tricot' ? 'bg-primary-50 font-bold text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      🧶 Tricot
                    </button>
                    <button
                      onClick={() => handleChangeTechnique('crochet')}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition ${
                        project.technique === 'crochet' ? 'bg-primary-50 font-bold text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      🪡 Crochet
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleOpenNotes}
                className={`px-2 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  project?.notes
                    ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={project?.notes ? 'Notes présentes - cliquer pour éditer' : 'Ajouter des notes'}
              >
                📝 Notes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* [AI:Claude] Barre 1 : Progression globale du projet - STICKY */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300 p-4 mb-3 shadow-lg">
        {/* Version Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Progression totale</span>
              <span className="text-xs font-bold text-primary-700">{globalProgressPercentage || 0}%</span>
            </div>
            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  project.status === 'completed' ? 'bg-green-600' : 'bg-primary-600'
                }`}
                style={{ width: `${globalProgressPercentage || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-lg font-bold text-primary-700">
              {(() => {
                const totalTime = project?.total_time || 0
                const totalHours = Math.floor(totalTime / 3600)
                const totalMins = Math.floor((totalTime % 3600) / 60)
                const totalSecs = totalTime % 60
                return `${totalHours}h ${totalMins}min ${totalSecs}s`
              })()}
            </div>
            <div className="text-[10px] text-gray-600">Temps total</div>
          </div>
          <button
            onClick={handleToggleProjectComplete}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition whitespace-nowrap ${
              project.status === 'completed'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
            title={project.status === 'completed' ? 'Réouvrir le projet' : 'Marquer le projet comme terminé'}
          >
            {project.status === 'completed' ? '✅ Terminé' : '✓ Marquer terminé'}
          </button>
        </div>

        {/* Version Mobile - Design simplifié */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">Progression</span>
            <span className="font-bold text-primary-700">{globalProgressPercentage || 0}%</span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                project.status === 'completed' ? 'bg-green-600' : 'bg-primary-600'
              }`}
              style={{ width: `${globalProgressPercentage || 0}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-gray-600">
              ⏱️ {(() => {
                const totalTime = project?.total_time || 0
                const totalHours = Math.floor(totalTime / 3600)
                const totalMins = Math.floor((totalTime % 3600) / 60)
                const totalSecs = totalTime % 60
                return `${totalHours}h ${totalMins}min ${totalSecs}s`
              })()}
            </div>
            <button
              onClick={handleToggleProjectComplete}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition ${
                project.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {project.status === 'completed' ? '✅ Terminé' : '✓ Terminé'}
            </button>
          </div>
        </div>
      </div>

      {/* [AI:Claude] Barre 2 : Compteur de la section active - STICKY avec fond caramel doux */}
      <div className="sticky top-20 z-40 bg-orange-100 bg-opacity-75 backdrop-blur-sm rounded-lg border-2 border-orange-300 p-3 mb-3 shadow-lg">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Section active */}
          <div className="flex-shrink-0">
            <div className="text-xs text-gray-500">Section active</div>
            <div className="font-semibold text-gray-900">
              {currentSectionId ? (
                sections.find(s => s.id === currentSectionId)?.name || 'Projet global'
              ) : (
                'Projet global'
              )}
            </div>
          </div>

          {/* Compteur */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDecrementRow}
              disabled={currentRow === 0}
              className="w-9 h-9 bg-red-100 text-red-600 rounded-full text-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
            >
              −
            </button>
            <div className="text-center min-w-[80px]">
              <div className="text-3xl font-bold text-gray-900">{currentRow}</div>
              {progressData.total && (
                <div className="text-xs text-gray-600">/ {progressData.total}</div>
              )}
            </div>
            <button
              onClick={handleIncrementRow}
              className="w-10 h-10 bg-primary-600 text-white rounded-full text-2xl font-bold hover:bg-primary-700 transition shadow-md"
            >
              +
            </button>
          </div>

          {/* Timer de la section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
              <div className="text-[10px] text-gray-500">Temps de session</div>
            </div>
            {project.status !== 'completed' && (
              <>
                {!isTimerRunning ? (
                  <button
                    onClick={handleStartSession}
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition"
                  >
                    ▶️ Démarrer
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Bouton Pause/Reprendre */}
                    {!isTimerPaused ? (
                      <button
                        onClick={handlePauseSession}
                        className="px-3 py-2 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition"
                        title="Mettre en pause"
                      >
                        ⏸️ Pause
                      </button>
                    ) : (
                      <button
                        onClick={handleResumeSession}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
                        title="Reprendre"
                      >
                        ▶️ Reprendre
                      </button>
                    )}

                    {/* Bouton Arrêter */}
                    <button
                      onClick={handleEndSession}
                      className="px-3 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition"
                      title="Terminer la session"
                    >
                      ⏹️ Arrêter
                    </button>
                  </div>
                )}
              </>
            )}
            {project.status === 'completed' && (
              <div className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm font-medium">
                ✅ Terminé
              </div>
            )}
          </div>
        </div>
      </div>

      {/* [AI:Claude] Tableau des sections */}
      <div className="bg-white rounded-lg border border-gray-200 mb-3 overflow-hidden">
        <div
          className="p-3 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setSectionsCollapsed(!sectionsCollapsed)}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-lg">{sectionsCollapsed ? '▸' : '▾'}</span>
            <h2 className="text-sm font-semibold text-gray-900">
              🧩 Sections du projet {sections.length > 0 && `(${sections.length})`}
            </h2>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              openAddSectionModal()
            }}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition flex items-center gap-1"
          >
            <span className="hidden sm:inline">➕ Ajouter une section</span>
            <span className="sm:hidden">➕</span>
          </button>
        </div>

        {!sectionsCollapsed && (
          <>
            {sections.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">🧩</div>
                <p className="text-gray-600 font-medium mb-2">Aucune section</p>
                <p className="text-sm text-gray-500 mb-4">
                  Les sections vous permettent de diviser votre projet en parties (face, dos, manches, etc.)
                </p>
                <button
                  onClick={openAddSectionModal}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                >
                  ➕ Créer ma première section
                </button>
              </div>
            ) : (
              <>
                {/* Version Desktop : Tableau */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Progression</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sections.map((section) => {
                  const isActive = currentSectionId === section.id
                  const isCompleted = section.is_completed === 1
                  const sectionProgress = isCompleted && section.total_rows
                    ? 100
                    : section.total_rows
                      ? Math.round((section.current_row / section.total_rows) * 100)
                      : null

                  return (
                    <tr
                      key={section.id}
                      onClick={() => !isActive && handleChangeSection(section.id)}
                      className={`transition-colors ${
                        isActive
                          ? 'bg-primary-50 border-l-4 border-l-primary-600'
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {/* Nom */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isActive && <span className="text-primary-600 font-bold">●</span>}
                          <span className={`text-sm font-medium ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                            {section.name}
                          </span>
                        </div>
                        {section.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                        )}
                      </td>

                      {/* Progression */}
                      <td className="px-4 py-3">
                        {sectionProgress !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden min-w-[60px]">
                              <div
                                className={`h-full transition-all ${
                                  isCompleted ? 'bg-green-500' : 'bg-primary-600'
                                }`}
                                style={{ width: `${sectionProgress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-700 min-w-[35px]">
                              {sectionProgress}%
                            </span>
                            {section.time_spent > 0 && (
                              <span className="text-xs text-gray-500 ml-2">⏱️ {section.time_formatted}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Terminée
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            ● En cours
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            En attente
                          </span>
                        )}
                      </td>

                      {/* Actions - Toujours visibles */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleSectionComplete(section, e)
                            }}
                            className={`p-1.5 rounded transition ${
                              isCompleted
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={isCompleted ? 'Marquer comme non terminée' : 'Marquer comme terminée'}
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditSectionModal(section)
                            }}
                            className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSection(section)
                            }}
                            className="p-1.5 bg-gray-100 text-red-600 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

            {/* Version Mobile : Cards simplifiées */}
            <div className="md:hidden divide-y divide-gray-200">
              {sections.map((section) => {
                const isActive = currentSectionId === section.id
                const isCompleted = section.is_completed === 1
                const isExpanded = expandedSections.has(section.id)
                const sectionProgress = isCompleted && section.total_rows
                  ? 100
                  : section.total_rows
                    ? Math.round((section.current_row / section.total_rows) * 100)
                    : null

                return (
                  <div
                    key={section.id}
                    className={`${
                      isActive
                        ? 'bg-primary-50 border-l-4 border-l-primary-600'
                        : ''
                    } ${isExpanded ? 'p-4' : ''}`}
                  >
                    {/* Header simplifié : Nom + flèche (tout cliquable pour déplier) */}
                    <div
                      className={`flex items-center justify-between cursor-pointer ${
                        isExpanded ? '' : 'py-3 px-4'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSectionExpanded(section.id, e)
                        // Si pas active, la rendre active aussi
                        if (!isActive) {
                          handleChangeSection(section.id)
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {isActive && <span className="text-primary-600 font-bold text-xs">●</span>}
                        <h3 className={`text-sm font-semibold ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                          {section.name}
                        </h3>
                        {isCompleted && <span className="text-green-600 text-xs">✓</span>}
                      </div>
                      <span className="text-gray-400 p-1">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>

                    {/* Détails visibles uniquement si section dépliée */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {/* Description */}
                        {section.description && (
                          <p className="text-sm text-gray-600">{section.description}</p>
                        )}

                        {/* Statut */}
                        <div>
                          {isCompleted ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Terminée
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              ● En cours
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              En attente
                            </span>
                          )}
                        </div>

                        {/* Progression */}
                        {sectionProgress !== null && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Progression</span>
                              <span className="text-sm font-medium text-gray-900">{sectionProgress}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  isCompleted ? 'bg-green-500' : 'bg-primary-600'
                                }`}
                                style={{ width: `${sectionProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Temps */}
                        {section.time_spent > 0 && (
                          <div className="text-sm text-gray-600">
                            ⏱️ {section.time_formatted}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleSectionComplete(section, e)
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition ${
                              isCompleted
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isCompleted ? '✅ Terminée' : '✓ Marquer terminée'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditSectionModal(section)
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSection(section)
                            }}
                            className="p-2 bg-gray-100 text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
            )}
          </>
        )}
      </div>

      {/* [AI:Claude] Tabs compacts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Tabs header */}
        <div className="border-b border-gray-200">
          <div className="flex">
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
                          <div className="p-6 bg-gradient-to-br from-primary-50 to-pink-50">
                            <h4 className="text-lg font-bold text-primary-900 mb-4 flex items-center gap-2">
                              ✨ Photos générées par IA
                              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                                {photoVariations.length}
                              </span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {photoVariations.map((variation) => (
                                <div key={variation.id} className="group relative">
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`}
                                    alt={`Variation ${variation.ai_style || 'IA'}`}
                                    className="w-full h-64 object-cover rounded-lg border-2 border-primary-300 group-hover:border-primary-500 transition cursor-pointer shadow-md hover:shadow-xl"
                                    onClick={() => setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`)}
                                  />
                                  <div className="absolute top-3 left-3 bg-primary-600 text-white text-sm px-3 py-1.5 rounded-lg font-semibold shadow-lg flex items-center gap-1">
                                    ✨ {variation.ai_style || 'IA'}
                                  </div>

                                  {/* Overlay voir en grand (z-index 10) */}
                                  <button
                                    onClick={() => setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`)}
                                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
                                  >
                                    <span className="text-white font-bold bg-black bg-opacity-75 px-4 py-2 rounded-lg text-base">
                                      🔍 Voir en grand
                                    </span>
                                  </button>

                                  {/* Boutons actions (z-index 20 pour être au-dessus) */}
                                  <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition z-20">
                                    {/* Bouton photo de couverture */}
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        try {
                                          await api.put(`/projects/${project.id}/set-cover-photo`, {
                                            photo_id: variation.id
                                          })
                                          alert('✅ Photo de couverture mise à jour !')
                                          // Rafraîchir le projet
                                          fetchProject()
                                        } catch (err) {
                                          console.error('Erreur:', err)
                                          alert('❌ Erreur lors de la mise à jour')
                                        }
                                      }}
                                      className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg"
                                      title="Définir comme photo de couverture"
                                    >
                                      📸 Définir comme couverture
                                    </button>

                                    {/* Bouton supprimer */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeletePhoto(variation.id)
                                      }}
                                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg"
                                      title="Supprimer cette variation"
                                    >
                                      🗑️ Supprimer
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* [AI:Claude] Photo originale EN BAS - juste pour référence */}
                        <div className="bg-gray-50 p-4 border-t-2 border-gray-200">
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0 group">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${originalPhoto.original_path}`}
                                alt={originalPhoto.item_name || 'Photo originale'}
                                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:border-primary-500 transition"
                                onClick={() => setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}${originalPhoto.original_path}`)}
                                onError={(e) => {
                                  console.error('Erreur chargement image:', originalPhoto.original_path)
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EErreur%3C/text%3E%3C/svg%3E'
                                }}
                              />
                              <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-90 text-white text-xs px-2 py-1 rounded font-medium">
                                📷 Originale
                              </div>
                              {/* Overlay "Voir en grand" au survol */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-white font-bold text-xs">
                                  🔍 Voir
                                </span>
                              </div>
                              {/* Bouton supprimer */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeletePhoto(originalPhoto.id)
                                }}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded transition shadow-lg z-10"
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
                                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm shadow-md"
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
            {project.pattern_path || project.pattern_url ? (
              <div>
                {/* Affichage du patron selon le type */}
                <div className="mb-4">
                  {project.pattern_url ? (
                    // URL externe - Affichage simplifié
                    <div className="border-2 border-gray-200 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-white">
                      <div className="text-center max-w-2xl mx-auto">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          Ce site ne peut pas être affiché ici
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Pour des raisons de sécurité, ce site web ne peut pas être intégré dans l'application. Ouvrez-le dans un nouvel onglet pour consulter votre patron.
                        </p>

                        {/* Bouton ouvrir */}
                        <a
                          href={project.pattern_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-lg shadow-md"
                        >
                          🔗 Ouvrir le patron
                        </a>
                      </div>
                    </div>
                  ) : project.pattern_path?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                    // Image avec lightbox
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${project.pattern_path}`}
                        alt="Patron"
                        className="w-full h-auto cursor-zoom-in hover:opacity-95 transition"
                        onClick={() => setLightboxImage({
                          src: `${import.meta.env.VITE_BACKEND_URL}${project.pattern_path}`,
                          alt: 'Patron'
                        })}
                      />
                      <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
                        <button
                          onClick={() => setLightboxImage({
                            src: `${import.meta.env.VITE_BACKEND_URL}${project.pattern_path}`,
                            alt: 'Patron'
                          })}
                          className="text-sm text-gray-600 hover:text-primary-600 transition font-medium"
                        >
                          🔍 Ouvrir en plein écran
                        </button>
                      </div>
                    </div>
                  ) : (
                    // PDF avec viewer interactif
                    <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      <PDFViewer
                        url={`${import.meta.env.VITE_BACKEND_URL}${project.pattern_path}`}
                        fileName={project.name ? `${project.name}-patron.pdf` : 'patron.pdf'}
                      />
                    </div>
                  )}
                </div>

                {/* Actions de modification */}
                <div className="flex gap-2 justify-center text-xs mt-4">
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
                {/* Option 1: Bibliothèque */}
                <button
                  onClick={() => {
                    setShowPatternLibraryModal(true)
                    fetchLibraryPatterns()
                  }}
                  className="w-full border-2 border-dashed border-primary-300 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50 transition"
                  disabled={uploadingPattern}
                >
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-gray-700 font-medium mb-1">
                    Choisir depuis ma bibliothèque
                  </p>
                  <p className="text-xs text-gray-500">
                    Utilisez un patron déjà sauvegardé
                  </p>
                </button>

                {/* Option 2: Upload fichier */}
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition">
                    <div className="text-4xl mb-2 text-center">📎</div>
                    <p className="text-gray-700 font-medium text-center mb-1">
                      Importer un nouveau fichier
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

                {/* Option 3: URL */}
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
                  {(project.type || project.hook_size || project.yarn_brand) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">Informations techniques</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {project.type && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl">📁</span>
                            <div>
                              <p className="text-xs text-gray-500">Catégorie</p>
                              <p className="font-medium text-gray-900">{project.type}</p>
                            </div>
                          </div>
                        )}
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
      {/* [AI:Claude] Modal sélection patron depuis bibliothèque */}
      {showPatternLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold">
                📚 Choisir un patron depuis ma bibliothèque
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Sélectionnez un patron que vous avez déjà sauvegardé
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingLibraryPatterns ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : libraryPatterns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <p className="text-gray-600 mb-4">Votre bibliothèque est vide</p>
                  <button
                    onClick={() => {
                      setShowPatternLibraryModal(false)
                      navigate('/pattern-library')
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Ajouter des patrons à votre bibliothèque →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {libraryPatterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => handleSelectLibraryPattern(pattern)}
                      disabled={uploadingPattern}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition text-left disabled:opacity-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          {pattern.file_type === 'pdf' ? '📄' : pattern.file_type === 'image' ? '🖼️' : '🔗'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{pattern.name}</h3>
                          {pattern.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{pattern.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            {pattern.category && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded">{pattern.category}</span>
                            )}
                            {pattern.difficulty && (
                              <span className="px-2 py-0.5 bg-gray-100 rounded">{pattern.difficulty}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPatternLibraryModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showPatternUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              🔗 Lien vers le patron
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Workflow rapide :</strong>
              </p>
              <ol className="text-xs text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                <li>Cherchez votre patron avec les boutons Google ou Ravelry ci-dessous</li>
                <li>Copiez l'URL du patron trouvé</li>
                <li>Revenez ici et collez dans le champ (appui long ou Ctrl+V)</li>
              </ol>
            </div>
            <input
              type="url"
              value={patternUrl}
              onChange={(e) => setPatternUrl(e.target.value)}
              placeholder="https://example.com/mon-patron"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-6"
              autoFocus
            />

            {/* Séparateur */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou chercher un patron</span>
              </div>
            </div>

            {/* Recherche rapide */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: pull irlandais, bonnet simple..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-3"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const query = searchQuery.trim()
                      ? encodeURIComponent(`tricot crochet patron ${searchQuery}`)
                      : encodeURIComponent('tricot crochet patron')
                    window.open(`https://www.google.com/search?q=${query}`, '_blank')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  🌐 Google
                </button>
                <button
                  onClick={() => {
                    const url = searchQuery.trim()
                      ? `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(searchQuery)}`
                      : 'https://www.ravelry.com/patterns/search'
                    window.open(url, '_blank')
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                >
                  🧶 Ravelry
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPatternUrlModal(false)
                  setPatternUrl('')
                  setSearchQuery('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handlePatternUrlSubmit}
                disabled={uploadingPattern || !patternUrl.trim()}
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

            {/* Inputs cachés */}
            <input
              ref={(el) => (window.cameraInputCounter = el)}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />
            <input
              ref={(el) => (window.galleryInputCounter = el)}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhoto}
            />

            {/* Boutons visibles */}
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-3`}>
              {isMobile && (
                <button
                  type="button"
                  onClick={() => window.cameraInputCounter?.click()}
                  disabled={uploadingPhoto}
                  className="flex flex-col items-center justify-center gap-2 p-6 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-4xl">📷</span>
                  <span className="font-medium">Prendre une photo</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => window.galleryInputCounter?.click()}
                disabled={uploadingPhoto}
                className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-4xl">🖼️</span>
                <span className="font-medium">Choisir une photo</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              JPG, PNG, WEBP
            </p>

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

      {/* [AI:Claude] Modal d'embellissement IA - v0.12.1 SIMPLIFIÉ */}
      {showEnhanceModal && selectedPhoto && selectedContext && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <h2 className="text-2xl font-bold text-gray-900">✨ Générer une photo IA</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedPhoto.item_name}
              </p>
            </div>

            <form onSubmit={handleEnhancePhoto} className="p-6">
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
                />
              </div>

              {/* Choix du style */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choisissez un style :
                </label>
                <div className="space-y-2">
                  {(stylesByCategory[detectProjectCategory(project?.type || '')] || stylesByCategory.other).map(style => (
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

              {/* Aperçu gratuit */}
              {previewImage && !enhancing && (
                <div className="mb-6 bg-gray-100 rounded-lg border-2 border-green-400 p-4 relative">
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    0 crédit
                  </div>
                  <img
                    src={previewImage}
                    alt="Aperçu"
                    className="max-h-48 w-auto object-contain rounded-lg mx-auto"
                  />
                  <p className="text-center text-sm text-gray-600 mt-2">
                    Aperçu basse résolution
                  </p>
                  <p className="text-center text-xs text-green-700 mt-1 font-medium">
                    ✓ L'image HD sera générée à partir de cette preview en haute résolution
                  </p>
                </div>
              )}

              {/* Erreur preview */}
              {previewError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">❌ {previewError}</p>
                </div>
              )}

              {/* Progression génération preview */}
              {isGeneratingPreview && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div>
                      <h4 className="font-semibold text-blue-900">🔍 Génération de l'aperçu...</h4>
                      <p className="text-sm text-gray-600">Gratuit et rapide</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progression génération HD */}
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

              {/* Résumé des crédits (si génération HD) */}
              {!enhancing && !isGeneratingPreview && previewImage && credits && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        💎 Photo HD = 1 crédit
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
                <button
                  type="button"
                  onClick={() => {
                    setShowEnhanceModal(false)
                    setSelectedPhoto(null)
                  }}
                  disabled={enhancing || isGeneratingPreview}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 font-medium"
                >
                  Annuler
                </button>

                {!previewImage ? (
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {isGeneratingPreview ? '🔍 Génération...' : '🔍 Aperçu gratuit (0 crédit)'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      disabled={enhancing || isGeneratingPreview}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {isGeneratingPreview ? '🔄 Génération...' : '🔄 Nouvelle preview'}
                    </button>
                    <button
                      type="submit"
                      disabled={enhancing || !credits || credits.total_available < 1}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                      {enhancing ? '✨ Génération...' : '✨ Générer en HD (1 crédit)'}
                    </button>
                  </>
                )}
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

            {/* Catégorie */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📁 Catégorie <span className="text-red-600">*</span>
              </label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-- Sélectionner une catégorie --</option>
                <option value="Vêtements">🧥 Vêtements</option>
                <option value="Accessoires">👜 Accessoires</option>
                <option value="Maison/Déco">🏠 Maison/Déco</option>
                <option value="Jouets/Peluches">🧸 Jouets/Peluches</option>
                <option value="Accessoires bébé">👶 Accessoires bébé</option>
              </select>
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

      {/* [AI:Claude] Modal des notes du projet */}
      {showNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                📝 Notes du projet
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {project.name}
              </p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes personnelles
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                  placeholder="Ajoutez vos notes personnelles sur ce projet :&#10;&#10;• Modifications apportées au patron&#10;• Difficultés rencontrées&#10;• Astuces et conseils&#10;• Idées pour la suite&#10;• Points d'attention..."
                  autoFocus
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNotes(false)
                    setNotes(project.notes || '')
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={savingNotes}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-bold hover:bg-yellow-700 transition disabled:opacity-50"
                >
                  {savingNotes ? 'Sauvegarde...' : '💾 Sauvegarder'}
                </button>
              </div>
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
              'text-primary-600'
            }`}>
              {alertData.title}
            </h3>
            <p className="text-gray-700 mb-6 whitespace-pre-line">{alertData.message}</p>
            <button
              onClick={() => setShowAlertModal(false)}
              className={`w-full px-4 py-3 rounded-lg font-medium text-white transition ${
                alertData.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                alertData.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                'bg-primary-600 hover:bg-primary-700'
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

      {/* [AI:Claude] Modal pour ajouter le patron à la bibliothèque */}
      {showAddToLibraryModal && uploadedPatternData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">
              📚 Enregistrer dans la bibliothèque ?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Sauvegardez ce patron dans votre bibliothèque pour le réutiliser facilement dans d'autres projets.
            </p>

            {/* Nom du patron */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du patron <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={libraryForm.name}
                onChange={(e) => setLibraryForm({ ...libraryForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Pull irlandais torsadé"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={libraryForm.description}
                onChange={(e) => setLibraryForm({ ...libraryForm, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Notes sur ce patron..."
              />
            </div>

            {/* Catégorie et Difficulté sur la même ligne */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={libraryForm.category}
                  onChange={(e) => setLibraryForm({ ...libraryForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="clothing">Vêtements</option>
                  <option value="accessories">Accessoires</option>
                  <option value="home_decor">Déco maison</option>
                  <option value="toys">Jouets/Amigurumi</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              {/* Difficulté */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulté
                </label>
                <select
                  value={libraryForm.difficulty}
                  onChange={(e) => setLibraryForm({ ...libraryForm, difficulty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>
            </div>

            {/* Technique */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technique (optionnel)
              </label>
              <input
                type="text"
                value={libraryForm.technique}
                onChange={(e) => setLibraryForm({ ...libraryForm, technique: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ex: Jacquard, Torsades, Granny square..."
              />
            </div>

            {/* Boutons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSkipLibrary}
                disabled={savingToLibrary}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Continuer sans enregistrer
              </button>
              <button
                onClick={handleAddToLibrary}
                disabled={savingToLibrary || !libraryForm.name.trim()}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingToLibrary ? 'Enregistrement...' : '📚 Enregistrer dans la bibliothèque'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [AI:Claude] Lightbox pour images de patron */}
      {lightboxImage && (
        <ImageLightbox
          src={typeof lightboxImage === 'string' ? lightboxImage : lightboxImage.src}
          alt={typeof lightboxImage === 'string' ? 'Image' : lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}

    </div>
  )
}

export default ProjectCounter
