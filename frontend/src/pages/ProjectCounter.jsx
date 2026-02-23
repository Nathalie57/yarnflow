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
import { useAuth } from '../contexts/AuthContext'
import { useImagePreview } from '../hooks/useImagePreview'
import { useWakeLock } from '../hooks/useWakeLock'
import api, { networkUtils } from '../services/api'
import PDFViewer from '../components/PDFViewer'
import ImageLightbox from '../components/ImageLightbox'
import ProxyViewer from '../components/ProxyViewer'
import TagBadge from '../components/TagBadge'
import TagInput from '../components/TagInput'
import SatisfactionModal from '../components/SatisfactionModal'
import FirstRowCelebration from '../components/FirstRowCelebration' // [AI:Claude] v0.17.0 - Célébration premier rang

const ProjectCounter = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    previewImage,
    isGeneratingPreview,
    previewError,
    previewContext,
    generatePreview,
    clearPreview
  } = useImagePreview()
  const { isSupported: isWakeLockSupported, isActive: isWakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // [AI:Claude] Sections du projet
  const [sections, setSections] = useState([])
  const [currentSectionId, setCurrentSectionId] = useState(null)
  const [expandedSections, setExpandedSections] = useState(new Set()) // [AI:Claude] Sections dépliées
  const [sectionsCollapsed, setSectionsCollapsed] = useState(true) // [AI:Claude] Tout le bloc sections replié/déplié par défaut
  const [sectionsSortBy, setSectionsSortBy] = useState('created') // [AI:Claude] Tri des sections (v0.14.0 - défaut: ordre de création)
  const [expandedNotesSection, setExpandedNotesSection] = useState(null) // [AI:Claude] Section avec notes dépliées
  const [sectionNotesText, setSectionNotesText] = useState('') // [AI:Claude] Texte des notes en cours d'édition
  const [isSavingSectionNotes, setIsSavingSectionNotes] = useState(false) // [AI:Claude] Sauvegarde en cours

  // [AI:Claude] État du compteur
  const [currentRow, setCurrentRow] = useState(0)
  const [stitchCount, setStitchCount] = useState(0)
  const [counterUnit, setCounterUnit] = useState('rows') // [AI:Claude] v0.16.2 - Unité du compteur (rows/cm)
  const [counterIncrement, setCounterIncrement] = useState(1.0) // [AI:Claude] v0.16.2 - Incrément par défaut
  const [isEditingCounter, setIsEditingCounter] = useState(false) // [AI:Claude] v0.16.2 - Mode édition du compteur
  const [counterInputValue, setCounterInputValue] = useState('') // [AI:Claude] v0.16.2 - Valeur temporaire de l'input
  const [isSavingRow, setIsSavingRow] = useState(false) // [AI:Claude] Anti double-clic sur compteur
  const [isOnline, setIsOnline] = useState(networkUtils.isOnline()) // [AI:Claude] Détection hors-ligne

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
  const [openMenuId, setOpenMenuId] = useState(null) // [AI:Claude] Menu dropdown pour actions photo
  const menuRef = useRef(null) // [AI:Claude] Ref pour fermer le menu au clic extérieur

  // [AI:Claude] Patron (PDF, Image ou URL)
  const [patternFile, setPatternFile] = useState(null)
  const [uploadingPattern, setUploadingPattern] = useState(false)
  const [showPatternUrlModal, setShowPatternUrlModal] = useState(false)
  const [patternUrl, setPatternUrl] = useState('')
  const [proxyError, setProxyError] = useState(false) // [AI:Claude] Erreur de chargement du proxy
  const [searchQuery, setSearchQuery] = useState('')

  // [AI:Claude] Choisir patron depuis bibliothèque
  const [showPatternLibraryModal, setShowPatternLibraryModal] = useState(false)
  const [libraryPatterns, setLibraryPatterns] = useState([])
  const [loadingLibraryPatterns, setLoadingLibraryPatterns] = useState(false)

  // [AI:Claude] Édition patron texte
  const [showPatternTextModal, setShowPatternTextModal] = useState(false)
  const [patternTextEdit, setPatternTextEdit] = useState('')
  const [savingPatternText, setSavingPatternText] = useState(false)

  // [AI:Claude] Modale de choix de modification du patron
  const [showPatternEditChoiceModal, setShowPatternEditChoiceModal] = useState(false)

  // [AI:Claude] Upload photo projet
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // [AI:Claude] Embellir photo avec IA - v0.12.1 SIMPLIFIÉ (1 photo, preset auto)
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [showStyleExamplesModal, setShowStyleExamplesModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [selectedContext, setSelectedContext] = useState(null) // [AI:Claude] Contexte auto-sélectionné
  const [modelGender, setModelGender] = useState('female') // [AI:Claude] Genre du modèle : male (homme), female (femme)
  const [selectedSeason, setSelectedSeason] = useState(null) // [AI:Claude] v0.17.1 - Saison optionnelle
  const [enhancing, setEnhancing] = useState(false)
  const [credits, setCredits] = useState(null)
  const [hideAIWarning, setHideAIWarning] = useState(false) // [AI:Claude] Cacher l'avertissement IA si l'utilisateur a coché "Ne plus afficher"
  const [showInstagramModal, setShowInstagramModal] = useState(false) // [AI:Claude] Modale Instagram pour partage

  // [AI:Claude] Modales de confirmation et alertes
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: null })
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' })
  const [showProjectCompletionModal, setShowProjectCompletionModal] = useState(false)

  // [AI:Claude] v0.15.0 - Modal de satisfaction post-génération
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false)
  const [generatedPhoto, setGeneratedPhoto] = useState(null)

  // [AI:Claude] v0.17.0 - Célébration premier rang
  const [showFirstRowCelebration, setShowFirstRowCelebration] = useState(false)
  const [showFirstProjectTip, setShowFirstProjectTip] = useState(false) // [AI:Claude] v0.17.1 - Tip premier projet

  // [AI:Claude] Modal d'édition du projet
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    description: '',
    hook_size: '',
    yarn_brand: '',
    type: ''
  })
  const [savingProject, setSavingProject] = useState(false)

  // [AI:Claude] Modal des détails techniques
  const [showTechnicalDetailsModal, setShowTechnicalDetailsModal] = useState(false)
  const [technicalForm, setTechnicalForm] = useState({
    yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
    needles: [{ type: '', size: '', length: '' }],
    gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' },
    description: ''
  })
  const [savingTechnical, setSavingTechnical] = useState(false)

  // [AI:Claude] Menu changement de catégorie
  const [showTechniqueMenu, setShowTechniqueMenu] = useState(false)
  const [showTypeMenu, setShowTypeMenu] = useState(false)
  const [customType, setCustomType] = useState('')
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false)

  // [AI:Claude] Tabs pour Patron/Photos/Description
  const [activeTab, setActiveTab] = useState('patron')

  // [AI:Claude] v0.15.0 - Gestion des tags
  const [localTags, setLocalTags] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [canUseTags, setCanUseTags] = useState(false)
  const [showTagSection, setShowTagSection] = useState(false)

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
    total_rows: '',
    notes: ''
  })
  // [AI:Claude] v0.16.2: Modale de confirmation pour attribuer les rangs existants
  const [showRowsConfirmModal, setShowRowsConfirmModal] = useState(false)
  const [rowsConfirmResolve, setRowsConfirmResolve] = useState(null)
  const [savingSection, setSavingSection] = useState(false)
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set()) // [AI:Claude] IDs des descriptions dépliées

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

  // [AI:Claude] Détection connexion réseau
  useEffect(() => {
    return networkUtils.onConnectionChange((online) => {
      setIsOnline(online)
    })
  }, [])

  // [AI:Claude] Charger le projet au montage
  useEffect(() => {
    const loadData = async () => {
      const projectData = await fetchProject()
      fetchProjectPhotos()
      fetchCredits()
      // Passer le current_section_id du projet fraîchement chargé
      fetchSections(projectData?.current_section_id)

      // [AI:Claude] v0.17.1 - Vérifier si c'est le premier projet (tip onboarding)
      if (sessionStorage.getItem('showFirstProjectTip') === 'true') {
        sessionStorage.removeItem('showFirstProjectTip')
        setShowFirstProjectTip(true)
      }

      // [AI:Claude] Restaurer l'état du timer s'il était en pause
      const savedState = localStorage.getItem(`timerState_${projectId}`)
      if (savedState) {
        try {
          const state = JSON.parse(savedState)

          // Vérifier que la session est récente (moins de 24h)
          const hoursSinceSave = (Date.now() - state.timestamp) / (1000 * 60 * 60)
          if (hoursSinceSave < 24 && state.isPaused && state.sessionId) {
            console.log('[TIMER] Restauration état sauvegardé:', state.pausedTime, 's')

            setSessionId(state.sessionId)
            setSessionStartRow(state.sessionStartRow)
            setPausedTime(state.pausedTime)
            setElapsedTime(state.pausedTime)
            setIsTimerRunning(true)
            setIsTimerPaused(true)
            setCurrentRow(state.currentRow)

            // Restauration silencieuse - pas besoin d'alerte
          } else if (hoursSinceSave >= 24) {
            // Session trop ancienne, la supprimer
            localStorage.removeItem(`timerState_${projectId}`)
            console.log('[TIMER] Session sauvegardée trop ancienne, supprimée')
          }
        } catch (e) {
          console.error('[TIMER] Erreur restauration:', e)
          localStorage.removeItem(`timerState_${projectId}`)
        }
      }
    }
    loadData()
  }, [projectId])

  // [AI:Claude] Charger le tri des sections depuis localStorage
  useEffect(() => {
    const savedSort = localStorage.getItem('sectionsSortBy')
    if (savedSort) {
      setSectionsSortBy(savedSort)
    }
  }, [])

  // [AI:Claude] Charger la préférence "Ne plus afficher l'avertissement IA"
  useEffect(() => {
    const hideWarning = localStorage.getItem('hideAIWarning')
    if (hideWarning === 'true') {
      setHideAIWarning(true)
    }
  }, [])

  // [AI:Claude] v0.15.0 - Charger les permissions et tags
  useEffect(() => {
    if (user) {
      const tier = user.subscription_type || 'free'
      setCanUseTags(['plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird'].includes(tier))
    }
  }, [user])

  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const response = await api.get('/user/tags/popular')
        if (response.data.success) {
          setPopularTags(response.data.popular_tags || [])
        }
      } catch (err) {
        console.error('Erreur chargement tags populaires:', err)
      }
    }
    if (canUseTags) {
      fetchPopularTags()
    }
  }, [canUseTags])

  useEffect(() => {
    if (project && project.tags) {
      setLocalTags(project.tags)
    }
  }, [project])

  // [AI:Claude] Sauvegarder le tri des sections dans localStorage
  useEffect(() => {
    localStorage.setItem('sectionsSortBy', sectionsSortBy)
  }, [sectionsSortBy])

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

  // [AI:Claude] Fermer le menu photo dropdown au clic extérieur
  useEffect(() => {
    if (!openMenuId) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }

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

  // [AI:Claude] Mettre à jour currentRow UNIQUEMENT quand on change de section
  // [AI:Claude] FIX BUG: Ajouter 'sections' dans les dépendances pour éviter la propagation
  // [AI:Claude] FIX COHERENCE: Ne mettre à jour que si la valeur est différente pour éviter les écrasements
  useEffect(() => {
    if (currentSectionId && sections.length > 0) {
      const activeSection = sections.find(s => s.id === currentSectionId)
      if (activeSection) {
        const sectionCurrentRow = activeSection.current_row || 0
        // Ne mettre à jour que si c'est vraiment différent
        if (sectionCurrentRow !== currentRow) {
          setCurrentRow(sectionCurrentRow)
        }
      }
    } else if (project && !currentSectionId) {
      // Aucune section active, utiliser le compteur global du projet
      const projectCurrentRow = project.current_row || 0
      if (projectCurrentRow !== currentRow) {
        setCurrentRow(projectCurrentRow)
      }
    }
  }, [currentSectionId, sections, project, currentRow])

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

  // [AI:Claude] Sauvegarder le timer quand l'app passe en arrière-plan (PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionId && isTimerRunning) {
        // L'app passe en arrière-plan, sauvegarder l'état
        const exactDuration = isTimerPaused
          ? pausedTime
          : pausedTime + Math.floor((Date.now() - sessionStartTime) / 1000)

        localStorage.setItem(`timerState_${projectId}`, JSON.stringify({
          sessionId,
          sessionStartRow,
          pausedTime: exactDuration,
          currentRow,
          currentSectionId,
          isPaused: isTimerPaused,
          timestamp: Date.now()
        }))
        console.log('[TIMER] Sauvegarde automatique (visibilitychange):', exactDuration, 's')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionId, isTimerRunning, isTimerPaused, pausedTime, sessionStartTime, currentRow, sessionStartRow, projectId, currentSectionId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(`/projects/${projectId}`)
      const projectData = response.data.project

      setProject(projectData)
      setCurrentRow(parseFloat(projectData.current_row) || 0) // [AI:Claude] v0.16.2 - Convertir en nombre
      setNotes(projectData.notes || '')
      setCounterUnit(projectData.counter_unit || 'rows') // [AI:Claude] v0.16.2 - Charger unité compteur
      setCounterIncrement(parseFloat(projectData.counter_unit_increment) || 1.0) // [AI:Claude] v0.16.2 - Charger incrément

      // [AI:Claude] Sélectionner la section en cours si elle existe
      if (projectData.current_section_id) {
        setCurrentSectionId(projectData.current_section_id)
      }

      // [AI:Claude] Retourner les données pour utilisation immédiate
      return projectData
    } catch (err) {
      console.error('Erreur chargement projet:', err)
      setError('Impossible de charger le projet')
      return null
    } finally {
      setLoading(false)
    }
  }

  // [AI:Claude] v0.15.0 - Gestion des tags
  const handleAddTag = async (tag) => {
    if (!canUseTags) {
      showAlert('Tags réservés aux abonnés PLUS/PRO', 'Passez à PLUS ou PRO pour utiliser les tags', 'warning')
      return
    }

    if (!tag || localTags.includes(tag)) return

    const newTags = [...localTags, tag]
    setLocalTags(newTags)

    try {
      await api.post(`/projects/${projectId}/tags`, { tags: [tag] })
      setProject({ ...project, tags: newTags })
    } catch (err) {
      console.error('Erreur ajout tag:', err)
      setLocalTags(localTags) // Rollback
      showAlert('Erreur', 'Impossible d\'ajouter le tag', 'error')
    }
  }

  const handleRemoveTag = async (tagToRemove) => {
    const newTags = localTags.filter(t => t !== tagToRemove)
    setLocalTags(newTags)

    try {
      await api.delete(`/projects/${projectId}/tags/${encodeURIComponent(tagToRemove)}`)
      setProject({ ...project, tags: newTags })
    } catch (err) {
      console.error('Erreur suppression tag:', err)
      setLocalTags(localTags) // Rollback
      showAlert('Erreur', 'Impossible de supprimer le tag', 'error')
    }
  }

  // [AI:Claude] Charger les sections du projet
  const fetchSections = async (projectCurrentSectionId = null) => {
    try {
      const response = await api.get(`/projects/${projectId}/sections`)
      const loadedSections = response.data.sections || []
      setSections(loadedSections)

      // [AI:Claude] Vérifier si la section actuelle est toujours valide et non terminée
      let needsNewSection = false

      if (currentSectionId) {
        const currentSection = loadedSections.find(s => s.id === currentSectionId)
        // Si la section actuelle est terminée, chercher une section en cours
        if (currentSection && currentSection.is_completed === 1) {
          needsNewSection = true
        }
      }

      // [AI:Claude] Si aucune section n'est active, si la section actuelle est terminée, ou s'il y a des sections
      if ((!currentSectionId || needsNewSection) && loadedSections.length > 0) {
        // Priorité 0 : Section définie dans le projet (passée en paramètre ou depuis state) - la plus importante !
        const targetSectionId = projectCurrentSectionId || project?.current_section_id
        if (targetSectionId) {
          const projectSection = loadedSections.find(s => s.id === targetSectionId)
          if (projectSection && !needsNewSection) {
            setCurrentSectionId(projectSection.id)
            return
          }
        }

        // Priorité 1 : Section sauvegardée dans localStorage (dernière utilisée)
        if (!needsNewSection) {
          const savedSectionId = localStorage.getItem(`currentSection_${projectId}`)
          if (savedSectionId) {
            const savedSection = loadedSections.find(s => s.id === parseInt(savedSectionId))
            if (savedSection && !savedSection.is_completed) {
              setCurrentSectionId(savedSection.id)
              return
            }
          }
        }

        // Priorité 2 : Première section non terminée
        const firstIncomplete = loadedSections.find(s => !s.is_completed)
        if (firstIncomplete) {
          setCurrentSectionId(firstIncomplete.id)
          return
        }

        // Priorité 3 : Première section de la liste (si toutes sont terminées)
        setCurrentSectionId(loadedSections[0].id)
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

  // [AI:Claude] Ouvrir modal détails techniques
  const openTechnicalDetailsModal = () => {
    try {
      const details = project.technical_details ? JSON.parse(project.technical_details) : null

      // Ajouter l'unité par défaut aux anciennes données qui n'en ont pas
      const yarn = details?.yarn || [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }]
      const normalizedYarn = yarn.map(y => ({
        ...y,
        quantities: y.quantities.map(q => ({
          ...q,
          unit: q.unit || 'pelotes' // Ajouter 'pelotes' par défaut si absent
        }))
      }))

      setTechnicalForm({
        yarn: normalizedYarn,
        needles: details?.needles || [{ type: '', size: '', length: '' }],
        gauge: details?.gauge || { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' },
        description: details?.description || project.description || ''
      })
    } catch (err) {
      console.error('Erreur parsing technical_details:', err)
      setTechnicalForm({
        yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
        needles: [{ type: '', size: '', length: '' }],
        gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' },
        description: project.description || ''
      })
    }
    setShowTechnicalDetailsModal(true)
  }

  // [AI:Claude] Sauvegarder les détails techniques
  const handleSaveTechnicalDetails = async () => {
    setSavingTechnical(true)
    try {
      const technicalDetailsJson = JSON.stringify(technicalForm)
      await api.put(`/projects/${projectId}`, { technical_details: technicalDetailsJson })
      await fetchProject()
      setShowTechnicalDetailsModal(false)
      showAlert('Détails techniques mis à jour avec succès !', 'success')
    } catch (err) {
      console.error('Erreur mise à jour détails techniques:', err)
      showAlert('Erreur lors de la mise à jour des détails techniques', 'error')
    } finally {
      setSavingTechnical(false)
    }
  }

  // [AI:Claude] Changer la technique (tricot/crochet)
  const handleChangeTechnique = async (newTechnique) => {
    try {
      await api.put(`/projects/${projectId}`, { technique: newTechnique })
      await fetchProject()
      setShowTechniqueMenu(false)
      showAlert('Technique modifiée avec succès !', 'success')
    } catch (err) {
      console.error('Erreur changement technique:', err)
      showAlert('Erreur lors du changement de technique', 'error')
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
      showAlert('Catégorie modifiée avec succès !', 'success')
    } catch (err) {
      console.error('Erreur changement type:', err)
      showAlert('Erreur lors du changement de catégorie', 'error')
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
    return ['Vêtements', 'Accessoires', 'Jouets/Peluches', 'Vêtements bébé', 'Accessoires bébé', 'Vêtements enfant', 'Maison/Déco', 'Autre']
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

  // [AI:Claude] Ouvrir la modale d'édition du patron texte
  const handleOpenPatternTextModal = () => {
    setPatternTextEdit(project.pattern_text || '')
    setShowPatternTextModal(true)
  }

  // [AI:Claude] Sauvegarder le patron texte
  const handleSavePatternText = async () => {
    if (!patternTextEdit.trim()) {
      showAlert('Le texte du patron ne peut pas être vide', 'error')
      return
    }

    setSavingPatternText(true)
    try {
      // [AI:Claude] Ne garder que pattern_text, permettre coexistence avec pattern_url
      const updateData = { pattern_text: patternTextEdit }

      // [AI:Claude] Si on a un fichier, on l'efface (fichier et texte s'excluent)
      if (project.pattern_path) {
        updateData.pattern_path = null
      }

      await api.put(`/projects/${projectId}`, updateData)

      await fetchProject()
      setShowPatternTextModal(false)
      showAlert('✅ Patron texte enregistré avec succès !', 'success')
    } catch (err) {
      console.error('Erreur sauvegarde patron texte:', err)
      showAlert('Erreur lors de la sauvegarde du patron', 'error')
    } finally {
      setSavingPatternText(false)
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

  // [AI:Claude] Gérer le checkbox "Ne plus afficher l'avertissement IA"
  const handleHideAIWarning = (e) => {
    const isChecked = e.target.checked
    setHideAIWarning(isChecked)
    localStorage.setItem('hideAIWarning', isChecked.toString())
    console.log('[AI Warning] Préférence sauvegardée:', isChecked ? 'masqué' : 'affiché')
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
      // [AI:Claude] Utiliser le context sélectionné (preview désactivée)
      const contextToUse = selectedContext.key

      // [AI:Claude] Appel API pour génération HD
      const response = await api.post(`/photos/${selectedPhoto.id}/enhance-multiple`, {
        contexts: [contextToUse],
        project_category: detectProjectCategory(project?.type || ''),
        model_gender: modelGender, // person (neutre), male (homme), female (femme)
        season: selectedSeason // spring, summer, autumn, winter (optionnel)
      })

      // [AI:Claude] v0.15.0 - Récupérer la photo générée pour la modal de satisfaction
      const generatedPhotoData = response.data.generated_photos?.[0]

      await fetchProjectPhotos()
      await fetchCredits()
      setShowEnhanceModal(false)
      setSelectedPhoto(null)
      // clearPreview() // Désactivé car preview désactivée

      // [AI:Claude] v0.15.0 - Afficher la modal de satisfaction au lieu d'une simple alerte
      if (generatedPhotoData && generatedPhotoData.success) {
        // Récupérer la photo générée depuis l'API pour avoir les détails complets
        const photoResponse = await api.get(`/photos?project_id=${projectId}`)
        const photos = photoResponse.data.photos || []
        const fullPhoto = photos.find(p => p.id === generatedPhotoData.photo_id)

        if (fullPhoto) {
          setGeneratedPhoto(fullPhoto)
          setShowSatisfactionModal(true)
        } else {
          showAlert(`✨ Photo générée avec succès !`, 'success')
        }
      } else {
        showAlert(`✨ Photo générée avec succès !`, 'success')
      }
    } catch (err) {
      console.error('Erreur embellissement photo:', err)
      const errorMsg = err.response?.data?.error || 'Erreur lors de l\'embellissement'
      showAlert(errorMsg, 'error')
    } finally {
      setEnhancing(false)
    }
  }

  // [AI:Claude] Générer preview gratuite (0 crédit) - v0.12.1
  // [AI:Claude] DÉSACTIVÉ pour économiser les coûts API
  /*
  const handleGeneratePreview = async () => {
    if (!selectedPhoto || !selectedContext) return

    const result = await generatePreview(selectedPhoto.id, selectedContext.key)

    if (!result.success) {
      showAlert(result.error || 'Erreur lors de la génération de l\'aperçu', 'error')
    }
  }
  */

  // [AI:Claude] v0.15.0 - Gérer le feedback de satisfaction (système étoiles)
  const handleFeedbackSubmitted = (feedbackData) => {
    const rating = feedbackData.rating || 0
    if (rating >= 4) {
      showAlert('Merci pour votre retour positif ! 😊', 'success')
    } else if (rating === 3) {
      showAlert('Merci pour votre retour ! Nous travaillons à améliorer le service.', 'success')
    } else if (rating <= 2) {
      showAlert('Merci pour votre retour. Nous prenons en compte vos remarques pour améliorer le service.', 'success')
    } else {
      showAlert('Merci pour votre retour !', 'success')
    }
  }

  // [AI:Claude] Ouvrir modal d'embellissement avec sélection du premier style par défaut
  const openEnhanceModal = (photo) => {
    setSelectedPhoto(photo)
    setSelectedSeason(null) // [AI:Claude] v0.17.1 - Réinitialiser la saison
    // clearPreview() // [AI:Claude] Désactivé car preview désactivée
    const category = detectProjectCategory(project?.type || '')
    const styles = getAvailableStyles(category)
    setSelectedContext(styles[0]) // Premier style par défaut
    setShowEnhanceModal(true)
  }

  // [AI:Claude] Détection intelligente de la catégorie
  const detectProjectCategory = (itemType) => {
    const lower = itemType.toLowerCase()

    console.log('[ProjectCounter] detectProjectCategory:', itemType, '→ lowercase:', lower)

    // [AI:Claude] Nouvelles catégories depuis la base de données
    if (lower === 'vêtements' || lower === 'vetements')
      return 'wearable'

    if (lower === 'vêtements bébé' || lower === 'vetements bebe' || lower === 'baby_garment') {
      console.log('[ProjectCounter] Détecté comme baby_garment')
      return 'baby_garment'
    }

    if (lower === 'vêtements enfant' || lower === 'vetements enfant' || lower === 'child_garment') {
      console.log('[ProjectCounter] Détecté comme child_garment')
      return 'child_garment'
    }

    if (lower === 'accessoires bébé' || lower === 'accessoires bebe')
      return 'other'

    if (lower === 'jouets/peluches')
      return 'toy'

    if (lower === 'accessoires')
      return 'accessory'

    if (lower === 'maison/déco' || lower === 'maison/deco')
      return 'home_decor'

    // [AI:Claude] Détection par mots-clés (fallback)
    if (lower.match(/bonnet|écharpe|pull|chaussette|gilet|châle|snood|mitaine/))
      return 'wearable'

    if (lower.match(/amigurumi|peluche|doudou|poupée|ours|animal/))
      return 'toy'

    if (lower.match(/sac|pochette|trousse|panier|cabas/))
      return 'accessory'

    if (lower.match(/couverture|plaid|coussin|tapis|déco|nappe/))
      return 'home_decor'

    console.log('[ProjectCounter] Aucune catégorie trouvée, retourne "accessory"')
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
      { key: 'wearable_c1', label: 'Porté classique', icon: '👤', desc: 'Porté en portrait extérieur, lumière douce', tier: 'free' },
      { key: 'flatlay_c1', label: 'Produit à plat', icon: '📸', desc: 'Posé à plat sur fond blanc studio', tier: 'free' },
      { key: 'detail_c1', label: 'Détails texture', icon: '🔍', desc: 'Gros plan macro sur la texture et les points', tier: 'free' },
      // PLUS (+3)
      { key: 'wearable_c2', label: 'Porté studio', icon: '✨', desc: 'Porté en studio fond blanc neutre', tier: 'plus' },
      { key: 'wearable_c3', label: 'Porté urbain', icon: '🌆', desc: 'Porté en ambiance urbaine lifestyle', tier: 'plus' },
      { key: 'flatlay_c2', label: 'Flat lay lifestyle', icon: '🏡', desc: 'Posé à plat avec props décoratifs', tier: 'plus' },
      // PRO (+3)
      { key: 'wearable_c4', label: 'Bohème chic', icon: '🌼', desc: 'Porté ambiance vintage décor rétro', tier: 'pro' },
      { key: 'wearable_c7', label: 'Haute couture', icon: '👗', desc: 'Porté studio fond texturé sombre', tier: 'pro' },
      { key: 'wearable_c9', label: 'Urbain industriel', icon: '🏙️', desc: 'Porté ambiance industrielle', tier: 'pro' }
    ],
    accessory: [
      // FREE (3)
      { key: 'accessory_c1', label: 'Studio fond blanc', icon: '📸', desc: 'Flat lay sur fond blanc pur, éclairage studio', tier: 'free' },
      { key: 'accessory_c2', label: 'Porté naturel', icon: '🌿', desc: 'Porté en extérieur avec lumière naturelle', tier: 'free' },
      { key: 'accessory_c3', label: 'Porté studio', icon: '👤', desc: 'Porté sur modèle avec fond neutre', tier: 'free' },
      // PLUS (+3)
      { key: 'accessory_c4', label: 'Flat lay lifestyle', icon: '✨', desc: 'Posé à plat avec accessoires lifestyle', tier: 'plus' },
      { key: 'accessory_c5', label: 'Porté urbain', icon: '🏙️', desc: 'Porté en ville avec architecture moderne', tier: 'plus' },
      { key: 'accessory_c6', label: 'Cosy intérieur', icon: '🏠', desc: 'Posé sur table avec textures douces', tier: 'plus' },
      // PRO (+3)
      { key: 'accessory_c7', label: 'Porté mode', icon: '💃', desc: 'Shooting mode professionnel avec mise en scène stylée', tier: 'pro' },
      { key: 'accessory_c8', label: 'Luxe produit', icon: '💎', desc: 'Mise en scène luxe avec fond sombre élégant', tier: 'pro' },
      { key: 'accessory_c9', label: 'Porté bohème', icon: '🌸', desc: 'Porté dans intérieur bohème avec plantes', tier: 'pro' }
    ],
    home_decor: [
      // FREE (3)
      { key: 'home_c1', label: 'Contemporain graphique', icon: '🏠', desc: 'Design moderne avec touches de couleur', tier: 'free' },
      { key: 'home_c2', label: 'Rustique naturel', icon: '🌿', desc: 'Bois, plantes, lumière naturelle', tier: 'free' },
      { key: 'home_c3', label: 'Scandinave', icon: '✨', desc: 'Décor épuré blanc/gris', tier: 'free' },
      // PLUS (+3)
      { key: 'home_c4', label: 'Industriel', icon: '🏭', desc: 'Ambiance loft, métal, briques', tier: 'plus' },
      { key: 'home_c5', label: 'Coloré vintage', icon: '🎨', desc: 'Couleurs chaudes, vintage', tier: 'plus' },
      { key: 'home_c6', label: 'Bohème cozy', icon: '🛋️', desc: 'Ambiance chaleureuse, tissus doux', tier: 'plus' },
      // PRO (+3)
      { key: 'home_c7', label: 'Luxe contemporain', icon: '💎', desc: 'Décor moderne avec matériaux nobles', tier: 'pro' },
      { key: 'home_c8', label: 'Minimaliste zen', icon: '🧘', desc: 'Ambiance zen, couleurs neutres', tier: 'pro' },
      { key: 'home_c9', label: 'Atelier créatif', icon: '🎨', desc: 'Table d\'artiste avec fournitures créatives', tier: 'pro' }
    ],
    toy: [
      // FREE (3)
      { key: 'toy_c1', label: 'Classique doux', icon: '🧸', desc: 'Chambre enfantine avec lumière douce', tier: 'free' },
      { key: 'toy_c2', label: 'Livre de contes', icon: '📖', desc: 'Décor de conte illustré, aquarelle pastel', tier: 'free' },
      { key: 'toy_c3', label: 'Studio fond blanc', icon: '📸', desc: 'Fond blanc épuré, éclairage lumineux', tier: 'free' },
      // PLUS (+3)
      { key: 'toy_c4', label: 'Vintage peluche', icon: '🧸', desc: 'Ambiance rétro, lumière tamisée', tier: 'plus' },
      { key: 'toy_c5', label: 'Artisanat naturel', icon: '🌿', desc: 'Bois, tissus naturels', tier: 'plus' },
      { key: 'toy_c6', label: 'Cartoon coloré', icon: '🎈', desc: 'Couleurs vives, style dessin animé', tier: 'plus' },
      // PRO (+3)
      { key: 'toy_c7', label: 'Boutique premium', icon: '🏪', desc: 'Boutique artisanale avec étagères et fond pastel', tier: 'pro' },
      { key: 'toy_c8', label: 'Aventure jungle', icon: '🦁', desc: 'Jungle tropicale avec plantes exotiques', tier: 'pro' },
      { key: 'toy_c9', label: 'Cirque vintage', icon: '🎪', desc: 'Chapiteau rétro avec rayures et paillettes', tier: 'pro' }
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

  // [AI:Claude] v0.14.0 - Convertir le code de style en label lisible
  const getStyleLabel = (styleCode) => {
    if (!styleCode) return 'IA'

    // Chercher dans toutes les catégories
    for (const category in stylesByCategory) {
      const style = stylesByCategory[category].find(s => s.key === styleCode)
      if (style) {
        return `${style.icon} ${style.label}`
      }
    }

    // Fallback si le style n'est pas trouvé
    return styleCode
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

      // [AI:Claude] Activer le wake lock pour garder l'écran allumé
      await requestWakeLock()
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

    // [AI:Claude] Sauvegarder l'état du timer en pause dans localStorage
    localStorage.setItem(`timerState_${projectId}`, JSON.stringify({
      sessionId,
      sessionStartRow,
      pausedTime: currentElapsed,
      currentRow,
      currentSectionId,
      isPaused: true,
      timestamp: Date.now()
    }))
    console.log('[TIMER] État sauvegardé en pause:', currentElapsed, 's')

    // [AI:Claude] Libérer le wake lock pendant la pause
    releaseWakeLock()
  }

  // [AI:Claude] Reprendre la session après pause
  const handleResumeSession = async () => {
    if (!isTimerRunning || !isTimerPaused) return

    // [AI:Claude] Redémarrer le chrono depuis maintenant
    setSessionStartTime(Date.now())
    setIsTimerPaused(false)

    // [AI:Claude] Mettre à jour le localStorage pour indiquer qu'on n'est plus en pause
    localStorage.setItem(`timerState_${projectId}`, JSON.stringify({
      sessionId,
      sessionStartRow,
      pausedTime,
      currentRow,
      currentSectionId,
      isPaused: false,
      timestamp: Date.now()
    }))
    console.log('[TIMER] Reprise - État localStorage mis à jour')

    // [AI:Claude] Réactiver le wake lock à la reprise
    await requestWakeLock()
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

      // [AI:Claude] Nettoyer le localStorage
      localStorage.removeItem(`timerState_${projectId}`)
      console.log('[TIMER] État localStorage nettoyé')

      // [AI:Claude] Libérer le wake lock quand on arrête le timer
      await releaseWakeLock()

      // [AI:Claude] Réinitialiser le flag après avoir tout nettoyé
      isEndingSessionRef.current = false
    } catch (err) {
      console.error('Erreur fin session:', err)
      showAlert('Erreur lors de la fin de session', 'error')
      isEndingSessionRef.current = false // Réinitialiser même en cas d'erreur
    }
  }

  // [AI:Claude] v0.16.2 - Handler pour changer l'unité du compteur
  const handleToggleUnit = async () => {
    const newUnit = counterUnit === 'rows' ? 'cm' : 'rows'

    try {
      await api.put(`/projects/${projectId}/counter-unit`, {
        counter_unit: newUnit
      })

      // Recharger le projet pour obtenir les nouvelles valeurs
      await fetchProject()
    } catch (err) {
      console.error('Erreur changement unité:', err)
      showAlert('Erreur lors du changement d\'unité', 'error')
    }
  }

  // [AI:Claude] v0.16.2 - Handlers pour input éditable du compteur
  const handleCounterClick = () => {
    setIsEditingCounter(true)
    const numValue = Number(currentRow) || 0
    setCounterInputValue(counterUnit === 'cm' ? numValue.toFixed(1) : Math.floor(numValue).toString())
  }

  const handleCounterInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCounterInputSubmit()
    } else if (e.key === 'Escape') {
      setIsEditingCounter(false)
      setCounterInputValue('')
    }
  }

  const handleCounterInputSubmit = async () => {
    const parsedValue = parseFloat(counterInputValue)

    // Validation
    if (isNaN(parsedValue) || parsedValue < 0) {
      showAlert('Valeur invalide', 'error')
      setIsEditingCounter(false)
      return
    }

    // Arrondir selon l'unité
    let validValue = counterUnit === 'rows'
      ? Math.floor(parsedValue)
      : Math.round(parsedValue * 2) / 2 // Arrondir au 0.5 le plus proche

    const oldRow = currentRow

    try {
      // Mettre à jour l'état local immédiatement
      setCurrentRow(validValue)

      // Sauvegarder dans la base de données
      if (currentSectionId) {
        await api.put(`/projects/${projectId}/sections/${currentSectionId}`, {
          current_row: validValue
        })
        setSections(prevSections =>
          prevSections.map(s =>
            s.id === currentSectionId
              ? { ...s, current_row: validValue }
              : s
          )
        )
      } else {
        await api.put(`/projects/${projectId}`, {
          current_row: validValue
        })
        setProject(prevProject => ({
          ...prevProject,
          current_row: validValue
        }))
      }

      setIsEditingCounter(false)
      setCounterInputValue('')
    } catch (err) {
      console.error('Erreur sauvegarde compteur:', err)
      showAlert('Erreur lors de la sauvegarde', 'error')
      // Rollback
      setCurrentRow(oldRow)
      if (currentSectionId) {
        setSections(prevSections =>
          prevSections.map(s =>
            s.id === currentSectionId
              ? { ...s, current_row: oldRow }
              : s
          )
        )
      } else {
        setProject(prevProject => ({
          ...prevProject,
          current_row: oldRow
        }))
      }
      setIsEditingCounter(false)
    }
  }

  // [AI:Claude] Incrémenter le rang (sauvegarde directe sans modal)
  const handleIncrementRow = async () => {
    // [AI:Claude] Anti double-clic
    if (isSavingRow) return
    setIsSavingRow(true)

    // [AI:Claude] Vérifier si on a atteint le maximum
    let maxRows = null
    if (currentSectionId && sections.length > 0) {
      const activeSection = sections.find(s => s.id === currentSectionId)
      if (activeSection && activeSection.total_rows) {
        maxRows = parseFloat(activeSection.total_rows)
      }
    } else if (project && project.total_rows) {
      maxRows = parseFloat(project.total_rows)
    }

    // Bloquer si on a atteint le maximum
    if (maxRows !== null && parseFloat(currentRow) >= maxRows) {
      const numMax = Number(maxRows)
      const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
      const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'
      showAlert(`🎉 Vous avez terminé (${displayMax}/${displayMax} ${unitLabel}) !`, 'success')
      return
    }

    // [AI:Claude] v0.16.2 - Calculer newRow selon l'unité
    const increment = parseFloat(counterIncrement) || (counterUnit === 'cm' ? 0.5 : 1.0)
    const newRow = counterUnit === 'rows'
      ? parseFloat(currentRow) + 1
      : parseFloat(currentRow) + increment
    const oldRow = currentRow

    // [AI:Claude] v0.16.2 - Mode CM : update direct sans historique
    if (counterUnit === 'cm') {
      try {
        if (currentSectionId) {
          await api.put(`/projects/${projectId}/sections/${currentSectionId}`, {
            current_row: newRow
          })
          setSections(prevSections =>
            prevSections.map(s =>
              s.id === currentSectionId
                ? { ...s, current_row: newRow }
                : s
            )
          )
        } else {
          await api.put(`/projects/${projectId}`, {
            current_row: newRow
          })
          setProject(prevProject => ({
            ...prevProject,
            current_row: newRow
          }))
        }
        setCurrentRow(newRow)

        // Check completion
        if (maxRows !== null && newRow >= maxRows) {
          if (currentSectionId) {
            await api.post(`/projects/${projectId}/sections/${currentSectionId}/complete`)
            setSections(prevSections =>
              prevSections.map(s =>
                s.id === currentSectionId
                  ? { ...s, is_completed: 1 }
                  : s
              )
            )
            const numMax = Number(maxRows)
            const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
            const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'
            showAlert(`🎉 Section terminée ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
          } else {
            await api.put(`/projects/${projectId}`, { status: 'completed' })
            if (isTimerRunning) {
              await handleEndSession()
            }
            const numMax = Number(maxRows)
            const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
            const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'
            showAlert(`🎉 Projet terminé ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
          }
        }
      } catch (err) {
        console.error('Erreur sauvegarde:', err)
        showAlert('Erreur lors de la sauvegarde', 'error')
        setCurrentRow(oldRow)
        if (currentSectionId) {
          setSections(prevSections =>
            prevSections.map(s =>
              s.id === currentSectionId
                ? { ...s, current_row: oldRow }
                : s
            )
          )
        } else {
          setProject(prevProject => ({
            ...prevProject,
            current_row: oldRow
          }))
        }
      } finally {
        setIsSavingRow(false)
      }
      return
    }

    // [AI:Claude] Mode rangs : sauvegarder avec historique
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

      // [AI:Claude] FIX v0.16.2: Mettre à jour sections/project AVANT setCurrentRow
      // pour éviter que le useEffect n'écrase avec l'ancienne valeur
      if (currentSectionId) {
        setSections(prevSections =>
          prevSections.map(s =>
            s.id === currentSectionId
              ? { ...s, current_row: newRow }
              : s
          )
        )
      } else {
        // [AI:Claude] FIX: Mettre à jour le projet global si pas de sections
        setProject(prevProject => ({
          ...prevProject,
          current_row: newRow
        }))
      }

      // [AI:Claude] Mettre à jour currentRow APRÈS sections pour que useEffect lise la bonne valeur
      setCurrentRow(newRow)

      // [AI:Claude] Si on vient de terminer, marquer comme terminé automatiquement
      if (maxRows !== null && newRow === maxRows) {
        if (currentSectionId) {
          // Marquer la section comme terminée
          try {
            await api.post(`/projects/${projectId}/sections/${currentSectionId}/complete`)

            // [AI:Claude] Mettre à jour is_completed localement IMMÉDIATEMENT pour l'UI
            setSections(prevSections =>
              prevSections.map(s =>
                s.id === currentSectionId
                  ? { ...s, is_completed: 1 }
                  : s
              )
            )

            await fetchSections()

            // Vérifier si toutes les sections sont terminées
            const updatedSections = await api.get(`/projects/${projectId}/sections`)
            const allCompleted = updatedSections.data.sections?.every(s => s.is_completed === 1)

            const numMax = Number(maxRows)
            const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
            const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'

            if (allCompleted && sections.length > 0) {
              // Afficher la modale de confirmation au lieu de terminer automatiquement
              showAlert(`🎉 Section terminée ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
              await handleAllSectionsCompleted()
            } else {
              showAlert(`🎉 Section terminée ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
            }

            await fetchProject()
          } catch (err) {
            console.error('Erreur marquage section terminée:', err)
            const numMax = Number(maxRows)
            const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
            const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'
            showAlert(`🎉 Section terminée ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
          }
        } else {
          // Pas de sections, marquer le projet global comme terminé
          try {
            await api.put(`/projects/${projectId}`, { status: 'completed' })
            // Arrêter le timer automatiquement quand le projet est terminé
            if (isTimerRunning) {
              await handleEndSession()
            }
            await fetchProject()
            const numMax = Number(maxRows)
            const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
            const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'
            showAlert(`🎉 Projet terminé ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
          } catch (err) {
            console.error('Erreur marquage projet terminé:', err)
            const numMax = Number(maxRows)
            const displayMax = counterUnit === 'cm' ? numMax.toFixed(1) : Math.floor(numMax)
            const unitLabel = counterUnit === 'cm' ? 'cm' : 'rangs'
            showAlert(`🎉 Projet terminé ! (${displayMax}/${displayMax} ${unitLabel})`, 'success')
          }
        }
      }

      // [AI:Claude] v0.17.0 - Célébration du premier rang compté
      if (oldRow === 0 || parseFloat(oldRow) === 0) {
        setShowFirstRowCelebration(true)

        // Tracker l'événement first_row_counted
        try {
          await api.post('/analytics/track-event', {
            event_name: 'first_row_counted',
            project_id: projectId,
            counter_unit: counterUnit
          })
        } catch (err) {
          console.error('Erreur tracking first_row_counted:', err)
        }
      } else if (oldRow > 0 || parseFloat(oldRow) > 0) {
        // Tracker project_worked_again à chaque incrémentation après le premier rang
        try {
          await api.post('/analytics/track-event', {
            event_name: 'project_worked_again',
            project_id: projectId,
            current_row: newRow
          })
        } catch (err) {
          console.error('Erreur tracking project_worked_again:', err)
        }
      }
    } catch (err) {
      console.error('Erreur sauvegarde rang:', err)
      console.error('Détails erreur:', err.response?.data)
      const errorMsg = err.response?.data?.message || err.message || 'Erreur inconnue'
      showAlert(`Erreur lors de la sauvegarde du rang: ${errorMsg}`, 'error')
      // [AI:Claude] Rollback en cas d'erreur (compteur ET sections)
      setCurrentRow(oldRow)
      if (currentSectionId) {
        setSections(prevSections =>
          prevSections.map(s =>
            s.id === currentSectionId
              ? { ...s, current_row: oldRow }
              : s
          )
        )
      } else {
        // [AI:Claude] FIX: Rollback du projet global si pas de sections
        setProject(prevProject => ({
          ...prevProject,
          current_row: oldRow
        }))
      }
    } finally {
      setIsSavingRow(false)
    }
  }

  // [AI:Claude] Décrémenter le rang (supprime le dernier rang au lieu de créer un nouveau)
  const handleDecrementRow = async () => {
    // [AI:Claude] Anti double-clic
    if (isSavingRow) return

    if (currentRow > 0) {
      setIsSavingRow(true)
      // [AI:Claude] v0.16.2 - Calculer newRow selon l'unité
      const increment = parseFloat(counterIncrement) || (counterUnit === 'cm' ? 0.5 : 1.0)
      const newRow = counterUnit === 'rows'
        ? parseFloat(currentRow) - 1
        : Math.max(0, parseFloat(currentRow) - increment)
      const oldRow = currentRow

      // [AI:Claude] Mettre à jour le compteur immédiatement pour un feedback instantané
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
      } else {
        // [AI:Claude] FIX: Mettre à jour le projet global si pas de sections
        setProject(prevProject => ({
          ...prevProject,
          current_row: newRow
        }))
      }

      try {
        // [AI:Claude] v0.16.2 - Mode CM : update direct sans historique
        if (counterUnit === 'cm') {
          if (currentSectionId) {
            await api.put(`/projects/${projectId}/sections/${currentSectionId}`, {
              current_row: newRow
            })
          } else {
            await api.put(`/projects/${projectId}`, {
              current_row: newRow
            })
          }
          return
        }

        // [AI:Claude] Mode rangs : supprimer le dernier rang de l'historique
        // Récupérer tous les rangs de cette section
        const response = await api.get(`/projects/${projectId}/rows`, {
          params: { section_id: currentSectionId }
        })

        const rows = response.data.rows || []

        // [AI:Claude] FIX: Trouver le rang avec row_number = currentRow (le dernier)
        // Comparaison qui gère null correctement
        const lastRow = rows.find(r => {
          const sectionMatch = currentSectionId
            ? r.section_id === currentSectionId
            : (r.section_id === null || r.section_id === undefined)
          return r.row_num === oldRow && sectionMatch
        })

        if (lastRow) {
          // [AI:Claude] Supprimer ce rang
          await api.delete(`/projects/${projectId}/rows/${lastRow.id}`)
        } else {
          console.warn('Aucun rang trouvé à supprimer:', { oldRow, currentSectionId, rows })
        }

        // [AI:Claude] Mettre à jour le current_row dans la base de données
        if (currentSectionId) {
          // Si on est dans une section, mettre à jour la section
          await api.put(`/projects/${projectId}/sections/${currentSectionId}`, {
            current_row: newRow
          })
        } else {
          // Sinon mettre à jour le projet
          await api.put(`/projects/${projectId}`, {
            current_row: newRow
          })
        }
      } catch (err) {
        console.error('Erreur sauvegarde rang:', err)
        showAlert('Erreur lors de la sauvegarde du rang', 'error')
        // [AI:Claude] Rollback en cas d'erreur (compteur ET sections)
        setCurrentRow(oldRow)
        if (currentSectionId) {
          setSections(prevSections =>
            prevSections.map(s =>
              s.id === currentSectionId
                ? { ...s, current_row: oldRow }
                : s
            )
          )
        } else {
          // [AI:Claude] FIX: Rollback du projet global si pas de sections
          setProject(prevProject => ({
            ...prevProject,
            current_row: oldRow
          }))
        }
      } finally {
        setIsSavingRow(false)
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

      // [AI:Claude] Maintenant on peut changer la section en cours
      setCurrentSectionId(sectionId)

      // [AI:Claude] Sauvegarder la section active dans localStorage pour la retrouver au retour
      localStorage.setItem(`currentSection_${projectId}`, sectionId.toString())

      // [AI:Claude] Rafraîchir les sections et le projet avec la nouvelle section
      await fetchSections(sectionId)
      await fetchProject()
    } catch (err) {
      console.error('Erreur changement section:', err)
      showAlert('Erreur lors du changement de section', 'error')
    }
  }

  // [AI:Claude] Fonction de tri des sections
  const getSortedSections = () => {
    if (!sections || sections.length === 0) return []

    const sorted = [...sections]

    // Fonction de tri alphanumérique naturel
    const naturalSort = (a, b) => {
      const nameA = a.name
      const nameB = b.name

      // Extraire les nombres du début ou du milieu du nom
      const getNumberFromName = (name) => {
        const match = name.match(/\d+/)
        return match ? parseInt(match[0]) : null
      }

      const numA = getNumberFromName(nameA)
      const numB = getNumberFromName(nameB)

      // Si les deux ont des nombres, comparer les nombres
      if (numA !== null && numB !== null) {
        if (numA !== numB) return numA - numB
      }

      // Si seulement A a un nombre, A vient en premier
      if (numA !== null && numB === null) return -1
      // Si seulement B a un nombre, B vient en premier
      if (numA === null && numB !== null) return 1

      // Sinon tri alphabétique standard
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' })
    }

    switch (sectionsSortBy) {
      case 'name-az':
        return sorted.sort((a, b) => naturalSort(a, b))

      case 'progress':
        return sorted.sort((a, b) => {
          // Vérifier si la section est terminée
          const isCompletedA = (a.is_completed === 1 || a.is_completed === true || a.is_completed === '1') ||
                              (a.is_completed !== 0 && a.is_completed !== '0' && a.is_completed !== false &&
                               ((a.total_rows && parseFloat(a.current_row) >= parseFloat(a.total_rows)) ||
                                (a.completion_percentage && parseFloat(a.completion_percentage) >= 100)))
          const isCompletedB = (b.is_completed === 1 || b.is_completed === true || b.is_completed === '1') ||
                              (b.is_completed !== 0 && b.is_completed !== '0' && b.is_completed !== false &&
                               ((b.total_rows && parseFloat(b.current_row) >= parseFloat(b.total_rows)) ||
                                (b.completion_percentage && parseFloat(b.completion_percentage) >= 100)))

          const progressA = a.total_rows ? (parseFloat(a.current_row) / parseFloat(a.total_rows)) * 100 : 0
          const progressB = b.total_rows ? (parseFloat(b.current_row) / parseFloat(b.total_rows)) * 100 : 0

          // Les sections terminées à la fin, même sans total_rows
          if (isCompletedA && !isCompletedB) return 1
          if (!isCompletedA && isCompletedB) return -1

          // Tri par progression croissante, puis alphabétique si égalité
          if (progressA === progressB) return naturalSort(a, b)
          return progressA - progressB
        })

      case 'progress-desc':
        // [AI:Claude] v0.14.0 - Tri par progression décroissante (PLUS/PRO uniquement)
        return sorted.sort((a, b) => {
          const isCompletedA = (a.is_completed === 1 || a.is_completed === true || a.is_completed === '1') ||
                              (a.is_completed !== 0 && a.is_completed !== '0' && a.is_completed !== false &&
                               ((a.total_rows && parseFloat(a.current_row) >= parseFloat(a.total_rows)) ||
                                (a.completion_percentage && parseFloat(a.completion_percentage) >= 100)))
          const isCompletedB = (b.is_completed === 1 || b.is_completed === true || b.is_completed === '1') ||
                              (b.is_completed !== 0 && b.is_completed !== '0' && b.is_completed !== false &&
                               ((b.total_rows && parseFloat(b.current_row) >= parseFloat(b.total_rows)) ||
                                (b.completion_percentage && parseFloat(b.completion_percentage) >= 100)))

          const progressA = a.total_rows ? (parseFloat(a.current_row) / parseFloat(a.total_rows)) * 100 : 0
          const progressB = b.total_rows ? (parseFloat(b.current_row) / parseFloat(b.total_rows)) * 100 : 0

          // Les sections terminées à la fin
          if (isCompletedA && !isCompletedB) return 1
          if (!isCompletedA && isCompletedB) return -1

          // Tri par progression décroissante, puis alphabétique si égalité
          if (progressA === progressB) return naturalSort(a, b)
          return progressB - progressA
        })

      case 'status':
        // Ordre : En cours (active) → En attente → Terminées, puis alphabétique dans chaque groupe
        return sorted.sort((a, b) => {
          const isActiveA = a.id === currentSectionId
          const isActiveB = b.id === currentSectionId
          // Une section est terminée si is_completed = 1 OU (is_completed !== 0 ET progression à 100%)
          const isCompletedA = (a.is_completed === 1 || a.is_completed === true || a.is_completed === '1') ||
                              (a.is_completed !== 0 && a.is_completed !== '0' && a.is_completed !== false &&
                               ((a.total_rows && parseFloat(a.current_row) >= parseFloat(a.total_rows)) ||
                                (a.completion_percentage && parseFloat(a.completion_percentage) >= 100)))
          const isCompletedB = (b.is_completed === 1 || b.is_completed === true || b.is_completed === '1') ||
                              (b.is_completed !== 0 && b.is_completed !== '0' && b.is_completed !== false &&
                               ((b.total_rows && parseFloat(b.current_row) >= parseFloat(b.total_rows)) ||
                                (b.completion_percentage && parseFloat(b.completion_percentage) >= 100)))

          // En cours d'abord
          if (isActiveA && !isActiveB) return -1
          if (!isActiveA && isActiveB) return 1

          // Puis terminées à la fin
          if (isCompletedA && !isCompletedB) return 1
          if (!isCompletedA && isCompletedB) return -1

          // Tri alphabétique secondaire dans le même groupe
          return naturalSort(a, b)
        })

      case 'created':
      default:
        // [AI:Claude] v0.14.0 - Tri par date de création (défaut)
        return sorted.sort((a, b) => {
          // Tri par date de création, puis alphabétique si égalité
          const dateA = new Date(a.created_at)
          const dateB = new Date(b.created_at)
          if (dateA.getTime() === dateB.getTime()) return naturalSort(a, b)
          return dateA - dateB
        })
    }
  }

  // [AI:Claude] Ouvrir modal d'ajout de section
  const openAddSectionModal = () => {
    setSectionForm({ name: '', description: '', total_rows: '', notes: '' })
    setEditingSection(null)
    setShowAddSectionModal(true)
  }

  // [AI:Claude] Ouvrir modal d'édition de section
  const openEditSectionModal = (section) => {
    setSectionForm({
      name: section.name,
      description: section.description || '',
      total_rows: section.total_rows || '',
      notes: section.notes || ''
    })
    setEditingSection(section)
    setShowAddSectionModal(true)
  }

  // [AI:Claude] Tronquer description avec limite de caractères
  const truncateDescription = (description, limit = 150) => {
    if (!description || description.length <= limit) return description
    return description.substring(0, limit) + '...'
  }

  // [AI:Claude] Toggle expansion description de section
  const toggleDescriptionExpansion = (sectionId) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // [AI:Claude] Sauvegarder une section (création ou modification)
  const handleSaveSection = async (e) => {
    e.preventDefault()

    if (!sectionForm.name.trim()) {
      showAlert('Le nom de la section est obligatoire', 'error')
      return
    }

    // [AI:Claude] v0.16.2: Variable locale pour stocker le current_row à utiliser
    let initialCurrentRow = 0

    // [AI:Claude] v0.16.2: Si c'est la première section ET qu'il y a déjà des rangs au compteur global
    // Demander à l'utilisateur quoi faire avec les rangs existants
    if (!editingSection && sections.length === 0 && project.current_row > 0) {
      const choice = await new Promise((resolve) => {
        setRowsConfirmResolve(() => resolve)
        setShowRowsConfirmModal(true)
      })

      if (choice === 'assign') {
        // L'utilisateur veut attribuer les rangs à la section
        initialCurrentRow = project.current_row
      }
      // Sinon (reset), on laisse la section démarrer à 0 normalement
    }

    setSavingSection(true)

    try {
      const sectionData = {
        name: sectionForm.name.trim(),
        description: sectionForm.description.trim() || null,
        total_rows: sectionForm.total_rows ? parseInt(sectionForm.total_rows) : null,
        display_order: editingSection ? editingSection.display_order : sections.length,
        notes: sectionForm.notes.trim() || null
      }

      // [AI:Claude] N'envoyer current_row QUE lors de la création, pas lors de la modification
      if (!editingSection) {
        sectionData.current_row = initialCurrentRow // Attribuer les rangs si demandé
      }

      if (editingSection) {
        // Modification
        await api.put(`/projects/${projectId}/sections/${editingSection.id}`, sectionData)
        showAlert('Section modifiée avec succès', 'success')
      } else {
        // Création
        const response = await api.post(`/projects/${projectId}/sections`, sectionData)

        // Si le projet était terminé, le remettre en cours
        if (project.status === 'completed') {
          await api.put(`/projects/${projectId}`, { status: 'in_progress' })
        }
      }

      // [AI:Claude] FIX v0.16.2: fetchProject AVANT fetchSections pour que current_section_id soit défini
      const projectData = await fetchProject() // Rafraîchir le projet pour récupérer le current_section_id mis à jour
      await fetchSections(projectData?.current_section_id) // Passer directement le current_section_id récupéré

      // [AI:Claude] v0.16.2: Mettre à jour currentRow avec la valeur de la section nouvellement créée
      if (!editingSection) {
        setCurrentRow(initialCurrentRow)
      }

      setShowAddSectionModal(false)
      setSectionForm({ name: '', description: '', total_rows: '', notes: '' })
      setEditingSection(null)
    } catch (err) {
      console.error('Erreur sauvegarde section:', err)
      showAlert('Erreur lors de la sauvegarde de la section', 'error')
    } finally {
      setSavingSection(false)
    }
  }

  // [AI:Claude] Toggle notes de section (dépliable)
  const toggleSectionNotes = (section) => {
    if (expandedNotesSection === section.id) {
      // Fermer
      setExpandedNotesSection(null)
      setSectionNotesText('')
    } else {
      // Ouvrir
      setExpandedNotesSection(section.id)
      setSectionNotesText(section.notes || '')
    }
  }

  // [AI:Claude] Sauvegarder les notes de section
  const saveSectionNotes = async (sectionId) => {
    setIsSavingSectionNotes(true)
    try {
      await api.put(`/projects/${projectId}/sections/${sectionId}`, {
        notes: sectionNotesText
      })

      // Mettre à jour localement
      setSections(prevSections =>
        prevSections.map(s =>
          s.id === sectionId
            ? { ...s, notes: sectionNotesText }
            : s
        )
      )

      showAlert('Notes sauvegardées', 'success')
    } catch (err) {
      console.error('Erreur sauvegarde notes section:', err)
      showAlert('Erreur lors de la sauvegarde des notes', 'error')
    } finally {
      setIsSavingSectionNotes(false)
    }
  }

  // [AI:Claude] Supprimer une section
  const handleDeleteSection = (section) => {
    showConfirm(
      `Êtes-vous sûr de vouloir supprimer la section "${section.name}" ? Tous les rangs associés seront dissociés de cette section.`,
      async () => {
        try {
          // [AI:Claude] Supprimer la section - le backend retourne le projet mis à jour
          const response = await api.delete(`/projects/${projectId}/sections/${section.id}`)
          const updatedProject = response.data.project

          // [AI:Claude] Mettre à jour currentSectionId depuis le projet retourné
          if (updatedProject && updatedProject.current_section_id) {
            setCurrentSectionId(updatedProject.current_section_id)
            localStorage.setItem(`currentSection_${projectId}`, updatedProject.current_section_id.toString())
          } else {
            setCurrentSectionId(null)
            localStorage.removeItem(`currentSection_${projectId}`)
          }

          // [AI:Claude] Rafraîchir les données
          await fetchSections()
          await fetchProject()
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
      const newState = section.is_completed === 1 ? 0 : 1

      await api.post(`/projects/${projectId}/sections/${section.id}/complete`)

      // [AI:Claude] Mettre à jour is_completed localement IMMÉDIATEMENT pour l'UI
      setSections(prevSections =>
        prevSections.map(s =>
          s.id === section.id
            ? { ...s, is_completed: newState }
            : s
        )
      )

      await fetchSections()
      await fetchProject()
      let alertMessage = newState ? '✅ Section marquée comme terminée' : 'Section réouverte'

      // [AI:Claude] Recharger les sections pour avoir les données à jour
      const response = await api.get(`/projects/${projectId}/sections`)
      const updatedSections = response.data.sections || []

      // [AI:Claude] Si la section vient d'être marquée comme terminée
      if (newState && sections.length > 0) {
        // Vérifier si toutes les sections sont terminées
        const allSectionsCompleted = updatedSections.every(s => s.is_completed === 1)

        if (allSectionsCompleted && project.status !== 'completed') {
          // Afficher la modale de confirmation au lieu de terminer automatiquement
          showAlert(alertMessage, 'success')
          await handleAllSectionsCompleted()
          return
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

  // [AI:Claude] Gérer la fin de toutes les sections - afficher modale de confirmation
  const handleAllSectionsCompleted = async () => {
    // Arrêter le timer si en cours
    if (isTimerRunning) {
      await handleEndSession()
    }
    // Afficher la modale de confirmation
    setShowProjectCompletionModal(true)
  }

  // [AI:Claude] Terminer le projet définitivement
  const handleCompleteProject = async () => {
    try {
      await api.put(`/projects/${projectId}`, { status: 'completed' })
      await fetchProject()
      setShowProjectCompletionModal(false)
      showAlert('🎉 Projet marqué comme terminé !', 'success')
    } catch (err) {
      console.error('Erreur terminer projet:', err)
      showAlert('Erreur lors de la finalisation du projet', 'error')
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

        // [AI:Claude] Mettre à jour toutes les sections localement IMMÉDIATEMENT
        setSections(prevSections =>
          prevSections.map(s => ({
            ...s,
            is_completed: 1,
            current_row: s.total_rows || s.current_row
          }))
        )

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
        // [AI:Claude] Section sans total_rows : retourner null pour ne pas afficher de total
        return { current: activeSection.current_row || 0, total: null, percentage: null }
      }
    }
    // Fallback: projet global (seulement si pas de sections)
    if (project && sections.length === 0) {
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
      {/* [AI:Claude] v0.17.0 - Célébration premier rang compté */}
      {showFirstRowCelebration && (
        <FirstRowCelebration
          onClose={() => setShowFirstRowCelebration(false)}
          counterUnit={counterUnit}
        />
      )}

      {/* [AI:Claude] Indicateur hors-ligne */}
      {!isOnline && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-3">
          <span className="text-xl">📡</span>
          <div className="flex-1">
            <p className="font-medium text-amber-800">Mode hors-ligne</p>
            <p className="text-amber-700 text-sm">Vos modifications seront synchronisées au retour de la connexion.</p>
          </div>
        </div>
      )}

      {/* [AI:Claude] v0.17.1 - Tip premier projet */}
      {showFirstProjectTip && (
        <div className="mb-4 bg-primary-50 border border-primary-200 rounded-xl p-4 relative">
          <button
            onClick={() => setShowFirstProjectTip(false)}
            className="absolute top-2 right-2 text-primary-400 hover:text-primary-600 text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-primary-800 mb-1">Astuce</p>
              <p className="text-primary-700 text-sm leading-relaxed">
                YarnFlow est surtout utile quand vous êtes interrompue.
                <br />
                Laissez-le ouvert pendant que vous tricotez — même si vous faites des pauses.
              </p>
            </div>
          </div>
        </div>
      )}

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
                  {project.type || 'Catégorie'}
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

              {/* [AI:Claude] v0.16.2 - Switch toggle unité */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleToggleUnit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-xs text-gray-600">Unité :</span>
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <span className={counterUnit === 'rows' ? 'text-primary-600' : 'text-gray-400'}>
                      📏 Rangs
                    </span>
                    <div className="relative inline-flex items-center h-5 w-9 rounded-full transition-colors"
                         style={{ backgroundColor: counterUnit === 'cm' ? '#8b5cf6' : '#d1d5db' }}>
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                        style={{ transform: counterUnit === 'cm' ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </div>
                    <span className={counterUnit === 'cm' ? 'text-primary-600' : 'text-gray-400'}>
                      📐 CM
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tags (v0.15.0) - Éditable */}
            <div className="w-full mt-2">
              {canUseTags ? (
                <>
                  {!showTagSection && localTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {localTags.slice(0, 5).map((tag, idx) => (
                        <TagBadge key={idx} tag={tag} className="text-xs" />
                      ))}
                      {localTags.length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-1">+{localTags.length - 5}</span>
                      )}
                      <button
                        onClick={() => setShowTagSection(true)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2"
                      >
                        ✏️ Modifier
                      </button>
                    </div>
                  )}
                  {!showTagSection && localTags.length === 0 && (
                    <button
                      onClick={() => setShowTagSection(true)}
                      className="text-xs text-gray-500 hover:text-primary-600 font-medium"
                    >
                      🏷️ Ajouter des tags...
                    </button>
                  )}
                  {showTagSection && (
                    <div className="bg-sage/5 rounded-lg p-3 border border-sage/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">🏷️ Tags du projet</span>
                        <button
                          onClick={() => setShowTagSection(false)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <TagInput
                        tags={localTags}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                        suggestions={popularTags.map(t => t.tag_name)}
                        placeholder="Ex: cadeau, bébé, urgent..."
                      />
                    </div>
                  )}
                </>
              ) : (
                localTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {localTags.slice(0, 5).map((tag, idx) => (
                      <TagBadge key={idx} tag={tag} className="text-xs" />
                    ))}
                    {localTags.length > 5 && (
                      <span className="text-xs text-gray-500 px-2 py-1">+{localTags.length - 5}</span>
                    )}
                  </div>
                )
              )}
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
        {/* Mobile: 2 lignes | Desktop: 1 ligne avec tout bien réparti */}
        <div className="space-y-2 sm:space-y-0">
          {/* Ligne 1 mobile: Section + Compteur | Desktop: cachée car tout sur une seule ligne */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            {/* Section active mobile */}
            <div className="text-left flex-shrink min-w-0">
              <div className="text-xs text-gray-500">Section active</div>
              <div className="font-semibold text-gray-900 text-sm truncate">
                {currentSectionId ? (
                  sections.find(s => s.id === currentSectionId)?.name || 'Projet global'
                ) : (
                  'Projet global'
                )}
              </div>
            </div>

            {/* Compteur mobile */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDecrementRow}
                disabled={currentRow === 0}
                className="w-9 h-9 bg-red-100 text-red-600 rounded-full text-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
              >
                −
              </button>
              <div className="text-center min-w-[80px]">
                {isEditingCounter ? (
                  <input
                    type="number"
                    step={counterUnit === 'cm' ? '0.5' : '1'}
                    min="0"
                    value={counterInputValue}
                    onChange={(e) => setCounterInputValue(e.target.value)}
                    onKeyDown={handleCounterInputKeyDown}
                    onBlur={handleCounterInputSubmit}
                    autoFocus
                    className="text-3xl font-bold text-gray-900 w-full text-center border-2 border-primary-500 rounded px-1"
                  />
                ) : (
                  <div
                    onClick={handleCounterClick}
                    className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-100 rounded px-2 transition"
                    title="Cliquer pour modifier"
                  >
                    {counterUnit === 'cm' ? Number(currentRow).toFixed(1) : Math.floor(Number(currentRow) || 0)}
                  </div>
                )}
                {progressData.total && (
                  <div className="text-xs text-gray-600">
                    / {counterUnit === 'cm' ? Number(progressData.total).toFixed(1) : Math.floor(Number(progressData.total))}
                  </div>
                )}
              </div>
              <button
                onClick={handleIncrementRow}
                className="w-9 h-9 bg-primary-600 text-white rounded-full text-xl font-bold hover:bg-primary-700 transition shadow-md"
              >
                +
              </button>
            </div>
          </div>

          {/* Desktop: Tout sur une ligne | Mobile: Ligne 2 (Timers + Bouton) */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Section active - visible uniquement desktop */}
            <div className="hidden sm:block text-left flex-shrink-0">
              <div className="text-xs text-gray-500">Section active</div>
              <div className="font-semibold text-gray-900 text-base">
                {currentSectionId ? (
                  sections.find(s => s.id === currentSectionId)?.name || 'Projet global'
                ) : (
                  'Projet global'
                )}
              </div>
            </div>

            {/* Compteur - visible uniquement desktop */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDecrementRow}
                disabled={currentRow === 0}
                className="w-9 h-9 bg-red-100 text-red-600 rounded-full text-lg font-bold hover:bg-red-200 transition disabled:opacity-50"
              >
                −
              </button>
              <div className="text-center min-w-[80px]">
                {isEditingCounter ? (
                  <input
                    type="number"
                    step={counterUnit === 'cm' ? '0.5' : '1'}
                    min="0"
                    value={counterInputValue}
                    onChange={(e) => setCounterInputValue(e.target.value)}
                    onKeyDown={handleCounterInputKeyDown}
                    onBlur={handleCounterInputSubmit}
                    autoFocus
                    className="text-3xl font-bold text-gray-900 w-full text-center border-2 border-primary-500 rounded px-1"
                  />
                ) : (
                  <div
                    onClick={handleCounterClick}
                    className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-gray-100 rounded px-2 transition"
                    title="Cliquer pour modifier"
                  >
                    {counterUnit === 'cm' ? Number(currentRow).toFixed(1) : Math.floor(Number(currentRow) || 0)}
                  </div>
                )}
                {progressData.total && (
                  <div className="text-xs text-gray-600">
                    / {counterUnit === 'cm' ? Number(progressData.total).toFixed(1) : Math.floor(Number(progressData.total))}
                  </div>
                )}
              </div>
              <button
                onClick={handleIncrementRow}
                className="w-10 h-10 bg-primary-600 text-white rounded-full text-2xl font-bold hover:bg-primary-700 transition shadow-md"
              >
                +
              </button>
            </div>

            {/* Timers (gauche mobile, centre desktop) */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink">
              <div className="text-center">
                <div className="text-base sm:text-xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
                <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                  Session
                  {isWakeLockActive && (
                    <span className="text-green-600" title="Écran maintenu allumé">🔋</span>
                  )}
                </div>
              </div>

              {/* Temps total de la section */}
              {(() => {
                const currentSection = currentSectionId ? sections.find(s => s.id === currentSectionId) : null
                if (!currentSection) return null

                return (
                  <div className="text-center border-l border-gray-300 pl-2 sm:pl-3">
                    <div className="text-sm sm:text-lg font-semibold text-primary-700">
                      {currentSection.time_formatted || '0h 0min 0s'}
                    </div>
                    <div className="text-[10px] text-gray-500">Total</div>
                  </div>
                )
              })()}
            </div>

            {/* Boutons (droite mobile, droite desktop) */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {project.status !== 'completed' && (
                <>
                  {!isTimerRunning ? (
                    <button
                      onClick={handleStartSession}
                      className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
                    >
                      ▶️ Démarrer
                    </button>
                  ) : (
                    <>
                      {/* Bouton Pause/Reprendre */}
                      {!isTimerPaused ? (
                        <button
                          onClick={handlePauseSession}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 bg-orange-500 text-white rounded text-xs sm:text-sm font-medium hover:bg-orange-600 transition whitespace-nowrap"
                          title="Mettre en pause"
                        >
                          ⏸️ Pause
                        </button>
                      ) : (
                        <button
                          onClick={handleResumeSession}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
                          title="Reprendre"
                        >
                          ▶️ Reprendre
                        </button>
                      )}

                      {/* Bouton Arrêter */}
                      <button
                        onClick={handleEndSession}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm font-medium hover:bg-red-700 transition whitespace-nowrap"
                        title="Terminer la session"
                      >
                        ⏹️ Arrêter
                      </button>
                    </>
                  )}
                </>
              )}
              {project.status === 'completed' && (
                <div className="px-3 py-2 bg-green-100 text-green-700 rounded text-xs sm:text-sm font-medium">
                  ✅ Terminé
                </div>
              )}
            </div>
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
                {/* Menu de tri */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Trier par :</span>
                      <select
                        value={sectionsSortBy}
                        onChange={(e) => setSectionsSortBy(e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                      >
                        <option value="created">Ordre de création</option>
                        <option value="name-az">Nom (A-Z)</option>
                        {(user?.subscription_type === 'plus' || user?.subscription_type === 'plus_annual' ||
                          user?.subscription_type === 'pro' || user?.subscription_type === 'pro_annual' ||
                          user?.subscription_type === 'early_bird') && (
                          <>
                            <option value="progress">Progression croissante</option>
                            <option value="progress-desc">Progression décroissante</option>
                            <option value="status">Statut (en cours d'abord)</option>
                          </>
                        )}
                      </select>
                    </div>
                    {user?.subscription_type === 'free' && (
                      <Link
                        to="/subscription"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        🔒 Plus de tris avec PLUS/PRO
                      </Link>
                    )}
                  </div>
                </div>
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
                {getSortedSections().map((section) => {
                  const isActive = currentSectionId === section.id
                  // Une section est terminée si :
                  // - is_completed = 1 explicitement
                  // - OU (is_completed n'est pas explicitement 0 ET progression à 100%)
                  const isCompleted = (section.is_completed === 1 || section.is_completed === true || section.is_completed === '1') ||
                                     (section.is_completed !== 0 && section.is_completed !== '0' && section.is_completed !== false &&
                                      ((section.total_rows && section.current_row >= section.total_rows) ||
                                       (section.completion_percentage && parseFloat(section.completion_percentage) >= 100)))

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
                        isCompleted
                          ? isActive
                            ? 'bg-green-50 border-l-4 border-l-green-600'
                            : 'bg-green-50 hover:bg-green-100 cursor-pointer'
                          : isActive
                            ? 'bg-primary-50 border-l-4 border-l-primary-600'
                            : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {/* Nom */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isActive && !isCompleted && <span className="text-primary-600 font-bold">●</span>}
                          {isActive && isCompleted && <span className="text-green-600 font-bold">●</span>}
                          {!isActive && isCompleted && <span className="text-green-600 font-bold">✓</span>}
                          <span className={`text-sm font-medium ${
                            isCompleted ? 'text-green-900' : isActive ? 'text-primary-900' : 'text-gray-900'
                          }`}>
                            {section.name}
                          </span>
                        </div>
                        {section.description && (
                          <div className="mt-0.5">
                            <p className="text-xs text-gray-500 whitespace-pre-line">
                              {expandedDescriptions.has(section.id)
                                ? section.description
                                : truncateDescription(section.description, 100)}
                            </p>
                            {section.description.length > 100 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDescriptionExpansion(section.id)
                                }}
                                className="text-xs text-primary-600 hover:text-primary-800 font-medium mt-1"
                              >
                                {expandedDescriptions.has(section.id) ? 'Réduire' : 'Lire'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Zone notes dépliable */}
                        {expandedNotesSection === section.id && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={sectionNotesText}
                              onChange={(e) => setSectionNotesText(e.target.value)}
                              placeholder="Notes pour cette section..."
                              className="w-full h-24 p-2 text-sm border border-amber-300 rounded resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                            />
                            <div className="flex items-center justify-end mt-2">
                              <button
                                onClick={() => saveSectionNotes(section.id)}
                                disabled={isSavingSectionNotes}
                                className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50 transition"
                              >
                                {isSavingSectionNotes ? '...' : 'Sauvegarder'}
                              </button>
                            </div>
                          </div>
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
                            <span className="text-xs text-gray-500 ml-2">⏱️ {section.time_formatted || '0h 0min 0s'}</span>
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
                          {/* Séparateur + Bouton Notes */}
                          <div className="ml-3 pl-3 border-l border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSectionNotes(section)
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition shadow-sm ${
                                expandedNotesSection === section.id
                                  ? 'bg-amber-500 text-white shadow-amber-200'
                                  : section.notes
                                    ? 'bg-amber-500 text-white shadow-amber-200'
                                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                              }`}
                              title={expandedNotesSection === section.id ? 'Fermer les notes' : section.notes ? 'Voir/modifier les notes' : 'Ajouter des notes'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs font-semibold">Notes</span>
                            </button>
                          </div>
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
              {getSortedSections().map((section) => {
                const isActive = currentSectionId === section.id
                // Une section est terminée si :
                // - is_completed = 1 explicitement
                // - OU (is_completed n'est pas explicitement 0 ET progression à 100%)
                const isCompleted = (section.is_completed === 1 || section.is_completed === true || section.is_completed === '1') ||
                                   (section.is_completed !== 0 && section.is_completed !== '0' && section.is_completed !== false &&
                                    ((section.total_rows && section.current_row >= section.total_rows) ||
                                     (section.completion_percentage && parseFloat(section.completion_percentage) >= 100)))
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
                      isCompleted
                        ? isActive
                          ? 'bg-green-50 border-l-4 border-l-green-600'
                          : 'bg-green-50'
                        : isActive
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
                        {isActive && !isCompleted && <span className="text-primary-600 font-bold text-xs">●</span>}
                        {isActive && isCompleted && <span className="text-green-600 font-bold text-xs">●</span>}
                        <h3 className={`text-sm font-semibold ${
                          isCompleted ? 'text-green-900' : isActive ? 'text-primary-900' : 'text-gray-900'
                        }`}>
                          {section.name}
                        </h3>
                        {!isActive && isCompleted && <span className="text-green-600 text-xs">✓</span>}
                      </div>
                      {/* Bouton notes dans le header - style bulle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSectionNotes(section)
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition shadow-sm ${
                          expandedNotesSection === section.id
                            ? 'bg-amber-500 text-white shadow-amber-200'
                            : section.notes
                              ? 'bg-amber-500 text-white shadow-amber-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-semibold">Notes</span>
                      </button>
                      <span className="text-gray-400 p-1">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </div>

                    {/* Détails visibles uniquement si section dépliée */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {/* Description */}
                        {section.description && (
                          <div>
                            <p className="text-sm text-gray-600 whitespace-pre-line">
                              {expandedDescriptions.has(section.id)
                                ? section.description
                                : truncateDescription(section.description, 150)}
                            </p>
                            {section.description.length > 150 && (
                              <button
                                onClick={() => toggleDescriptionExpansion(section.id)}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium mt-1"
                              >
                                {expandedDescriptions.has(section.id) ? 'Réduire' : 'Lire'}
                              </button>
                            )}
                          </div>
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
                        <div className="text-sm text-gray-600">
                          ⏱️ {section.time_formatted || '0h 0min 0s'}
                        </div>

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

                    {/* Zone notes dépliable (mobile) - toujours accessible */}
                    {expandedNotesSection === section.id && (
                      <div className="mt-2 mx-4 mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <textarea
                          value={sectionNotesText}
                          onChange={(e) => setSectionNotesText(e.target.value)}
                          placeholder="Notes pour cette section..."
                          className="w-full h-28 p-2 text-sm border border-amber-300 rounded resize-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                        />
                        <div className="flex items-center justify-end mt-2">
                          <button
                            onClick={() => saveSectionNotes(section.id)}
                            disabled={isSavingSectionNotes}
                            className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
                          >
                            {isSavingSectionNotes ? '...' : 'Sauvegarder'}
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
              🔧 Détails techniques
              {(project.technical_details || project.description) && (
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
                      <div key={originalPhoto.id} className="border-2 border-gray-200 rounded-lg">
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
                                <div key={variation.id} className="relative rounded-lg group aspect-square bg-gray-100 shadow-md hover:shadow-xl transition-shadow">
                                  {/* Photo IA générée */}
                                  <img
                                    src={`${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`}
                                    alt={`Variation ${variation.ai_style || 'IA'}`}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                      console.error('Erreur chargement image:', variation.enhanced_path)
                                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage manquante%3C/text%3E%3C/svg%3E'
                                    }}
                                  />

                                  {/* Badge style IA en haut */}
                                  <div className="absolute top-3 left-3 bg-primary-600 text-white text-xs px-3 py-1 rounded-lg font-semibold shadow-lg">
                                    {getStyleLabel(variation.ai_style)}
                                  </div>

                                  {/* Overlay minimaliste au hover */}
                                  <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 rounded-lg ${openMenuId === variation.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {/* Actions principales (3 boutons circulaires) */}
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3">
                                      {/* Voir en grand */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`)
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
                                          link.href = `${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`
                                          link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${variation.ai_style || 'photo'}.jpg`
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
                                      <div className="relative" ref={openMenuId === variation.id ? menuRef : null}>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setOpenMenuId(openMenuId === variation.id ? null : variation.id)
                                          }}
                                          className="w-12 h-12 bg-white/90 hover:bg-white text-gray-900 rounded-full flex items-center justify-center transition shadow-lg backdrop-blur-sm"
                                          title="Plus d'actions"
                                        >
                                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                          </svg>
                                        </button>

                                        {/* Dropdown menu */}
                                        {openMenuId === variation.id && (
                                          <div className="absolute bottom-full mb-2 right-0 w-64 bg-gradient-to-br from-primary-50 via-warm-50 to-sage-50 rounded-lg shadow-2xl border-2 border-primary-400 py-2 z-50">
                                            {/* Photo de couverture */}
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                try {
                                                  await api.put(`/projects/${project.id}/set-cover-photo`, { photo_id: variation.id })
                                                  alert('✅ Photo de couverture mise à jour !')
                                                  fetchProject()
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

                                            {/* Divider */}
                                            <div className="border-t border-primary-200 my-1"></div>

                                            {/* Mobile : un seul bouton "Partager" */}
                                            {isMobile ? (
                                              <button
                                                onClick={async (e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  const url = `${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`

                                                  if (navigator.share) {
                                                    try {
                                                      const response = await fetch(url)
                                                      const blob = await response.blob()
                                                      const file = new File([blob], `${variation.item_name || 'photo'}.jpg`, { type: 'image/jpeg' })
                                                      await navigator.share({
                                                        files: [file],
                                                        title: variation.item_name || 'Ma photo tricot/crochet',
                                                        text: `Découvrez mon ${variation.item_name || 'ouvrage'} ! 🧶✨`
                                                      })
                                                      setOpenMenuId(null)
                                                    } catch (err) {
                                                      if (err.name !== 'AbortError') {
                                                        console.error('Erreur partage:', err)
                                                      }
                                                    }
                                                  }
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-sm text-warm-900 hover:bg-warm-100 flex items-center gap-3 transition-colors font-medium"
                                              >
                                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                                <span>Partager</span>
                                              </button>
                                            ) : (
                                              // Desktop : toutes les options individuelles
                                              <>
                                                {/* Instagram */}
                                                <button
                                                  onClick={async (e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    const url = `${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`

                                                    try {
                                                      const response = await fetch(url)
                                                      const blob = await response.blob()
                                                      const blobUrl = window.URL.createObjectURL(blob)

                                                      const link = document.createElement('a')
                                                      link.href = blobUrl
                                                      link.download = `${variation.item_name || 'photo'}-instagram.jpg`
                                                      document.body.appendChild(link)
                                                      link.click()
                                                      document.body.removeChild(link)

                                                      window.URL.revokeObjectURL(blobUrl)
                                                      setShowInstagramModal(true)
                                                    } catch (err) {
                                                      console.error('Erreur téléchargement Instagram:', err)
                                                      alert('❌ Erreur lors du téléchargement de l\'image')
                                                    }
                                                    setOpenMenuId(null)
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
                                                    const url = `${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`
                                                    const description = variation.item_name || 'Photo tricot/crochet'
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
                                                    const text = `Découvrez mon ${variation.item_name || 'ouvrage'} ! 🧶✨`
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
                                                    const url = `${import.meta.env.VITE_BACKEND_URL}${variation.enhanced_path}`
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
                                              </>
                                            )}

                                            {/* Divider */}
                                            <div className="border-t border-primary-200 my-1"></div>

                                            {/* Supprimer */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeletePhoto(variation.id)
                                                setOpenMenuId(null)
                                              }}
                                              className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
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
                          </div>
                        )}

                        {/* [AI:Claude] Photo originale EN BAS - juste pour référence */}
                        <div className="bg-gray-50 p-4 border-t-2 border-gray-200">
                          {/* [AI:Claude] v0.14.0 - Gérer le cas où la photo originale est manquante */}
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0 group">
                              <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${originalPhoto.original_path}`}
                                alt={originalPhoto.item_name || 'Photo originale'}
                                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:border-primary-500 transition"
                                onClick={() => setLightboxImage(`${import.meta.env.VITE_BACKEND_URL}${originalPhoto.original_path}`)}
                                onError={(e) => {
                                  console.error('Erreur chargement image:', originalPhoto.original_path)
                                  // [AI:Claude] Remplacer par un placeholder SVG si l'image n'existe pas
                                  e.target.onerror = null // Éviter boucle infinie
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23e5e7eb" width="128" height="128" rx="8"/%3E%3Ctext x="50%25" y="40%25" text-anchor="middle" font-size="40" dy=".3em"%3E📷%3C/text%3E%3Ctext x="50%25" y="70%25" text-anchor="middle" font-size="12" fill="%239ca3af" dy=".3em"%3EPhoto%3C/text%3E%3Ctext x="50%25" y="80%25" text-anchor="middle" font-size="12" fill="%239ca3af" dy=".3em"%3Emanquante%3C/text%3E%3C/svg%3E'
                                  e.target.style.cursor = 'default'
                                  e.target.onclick = null
                                }}
                              />
                              <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-90 text-white text-xs px-2 py-1 rounded font-medium">
                                📷 Originale
                              </div>
                              {/* Overlay "Voir en grand" au survol */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                <span className="text-white font-bold text-xs">
                                  🔍 Voir
                                </span>
                              </div>
                              {/* Boutons actions */}
                              <div className="absolute bottom-2 left-2 right-2 flex gap-1 z-10">
                                {/* Bouton télécharger */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      const token = localStorage.getItem('token')
                                      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/photos/${originalPhoto.id}/download`, {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      })

                                      if (!response.ok) throw new Error('Erreur téléchargement')

                                      const blob = await response.blob()
                                      const url = window.URL.createObjectURL(blob)
                                      const link = document.createElement('a')
                                      link.href = url
                                      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_original.jpg`
                                      document.body.appendChild(link)
                                      link.click()
                                      document.body.removeChild(link)
                                      window.URL.revokeObjectURL(url)
                                    } catch (err) {
                                      console.error('Erreur:', err)
                                      alert('❌ Erreur lors du téléchargement')
                                    }
                                  }}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition shadow-lg text-center"
                                  title="Télécharger cette photo"
                                >
                                  📥
                                </button>
                                {/* Bouton supprimer */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePhoto(originalPhoto.id)
                                  }}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition shadow-lg"
                                  title="Supprimer cette photo"
                                >
                                  🗑️
                                </button>
                              </div>
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
            {project.pattern_text || project.pattern_path || project.pattern_url ? (
              <div>
                {/* Affichage du patron selon le type */}
                <div className="mb-4">
                  {project.pattern_url ? (
                    // URL externe - Affichage via ProxyViewer
                    <>
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-4">
                        <ProxyViewer
                          url={project.pattern_url}
                          onError={() => setProxyError(true)}
                          onLoad={() => setProxyError(false)}
                        />
                      </div>

                      {/* Section texte (coexiste avec URL) - Afficher uniquement si texte existe OU si erreur proxy */}
                      {project.pattern_text ? (
                        // Texte existant
                        <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">📝 Texte du patron</h3>
                            <button
                              onClick={handleOpenPatternTextModal}
                              className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition text-sm"
                            >
                              ✏️ Modifier le texte
                            </button>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                              {project.pattern_text}
                            </pre>
                          </div>
                        </div>
                      ) : proxyError ? (
                        // Pas de texte ET erreur proxy - proposer d'en ajouter
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
                          <div className="text-4xl mb-3">📝</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Ajouter le texte du patron
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            Le site ne s'affiche pas ? Copiez-collez le texte du patron ici pour l'avoir toujours sous les yeux.
                          </p>
                          <button
                            onClick={handleOpenPatternTextModal}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                          >
                            📝 Ajouter le texte
                          </button>
                        </div>
                      ) : null}
                    </>
                  ) : project.pattern_text ? (
                    // Patron texte seul (sans URL ni fichier)
                    <div className="border-2 border-gray-200 rounded-lg p-6 bg-white">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Patron</h3>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed">
                          {project.pattern_text}
                        </pre>
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
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowPatternEditChoiceModal(true)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
                  >
                    ✏️ Modifier
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

                {/* Option 2: Créer un patron texte */}
                <button
                  onClick={handleOpenPatternTextModal}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition"
                  disabled={uploadingPattern}
                >
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-700 font-medium mb-1">
                    Modifier le texte du patron
                  </p>
                  <p className="text-xs text-gray-500">
                    Coller ou saisir le texte du patron
                  </p>
                </button>

                {/* Option 3: Upload fichier */}
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

              {/* TAB DÉTAILS TECHNIQUES */}
              {activeTab === 'description' && (() => {
                let technicalDetails = null
                try {
                  technicalDetails = project.technical_details ? JSON.parse(project.technical_details) : null
                } catch (err) {
                  console.error('Erreur parsing technical_details:', err)
                }

                const hasDetails = technicalDetails && (
                  (technicalDetails.yarn && technicalDetails.yarn.length > 0 && technicalDetails.yarn[0].brand) ||
                  (technicalDetails.needles && technicalDetails.needles.length > 0 && technicalDetails.needles[0].type) ||
                  (technicalDetails.gauge && (technicalDetails.gauge.stitches || technicalDetails.gauge.rows)) ||
                  technicalDetails.description
                )

                return (
                  <div>
                    {hasDetails ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-gray-900">Détails techniques</h2>
                          <button
                            onClick={openTechnicalDetailsModal}
                            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
                          >
                            ✏️ Modifier
                          </button>
                        </div>

                        {/* Format fiche technique améliorée */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          {/* Description */}
                          {technicalDetails.description && (
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                              <div className="flex gap-2">
                                <span className="text-gray-400 text-sm">💬</span>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line flex-1">
                                  {technicalDetails.description}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="p-4">
                            {/* Grid 3 colonnes en desktop : Laine | Aiguilles | Échantillon */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* LAINE / YARN */}
                              {technicalDetails.yarn && technicalDetails.yarn.length > 0 && technicalDetails.yarn[0].brand && (
                                <div className="bg-gradient-to-br from-primary-50 to-warm-100 rounded-lg p-3 border-l-4 border-primary-400">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🧶</span>
                                    <span className="font-semibold text-primary-700 text-sm">
                                      {project.technique === 'tricot' ? 'Laine' : 'Fil'}
                                    </span>
                                  </div>
                                  <div className="grid gap-2">
                                    {technicalDetails.yarn.map((y, idx) => (
                                      <div key={idx} className="grid grid-cols-[1fr,auto] gap-3 items-start bg-white/70 rounded px-3 py-2">
                                        <div className="text-sm">
                                          <div className="font-medium text-gray-900">{y.brand}</div>
                                          {y.name && <div className="text-xs text-gray-600">{y.name}</div>}
                                        </div>
                                        {y.quantities && y.quantities.length > 0 && (
                                          <div className="text-right">
                                            {y.quantities.map((q, qIdx) => (
                                              q.amount && (
                                                <div key={qIdx} className="text-xs text-gray-700 whitespace-nowrap">
                                                  <span className="font-medium">{q.amount} {q.unit || 'pelotes'}</span>
                                                  {q.color && <span className="text-gray-500 ml-1">· {q.color}</span>}
                                                </div>
                                              )
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* AIGUILLES / CROCHETS */}
                              {technicalDetails.needles && technicalDetails.needles.length > 0 && (technicalDetails.needles[0].type || technicalDetails.needles[0].size) && (
                                <div className="bg-gradient-to-br from-sage-50 to-sage-100 rounded-lg p-3 border-l-4 border-sage-400">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{project.technique === 'tricot' ? '🪡' : '🪝'}</span>
                                    <span className="font-semibold text-sage-700 text-sm">
                                      {project.technique === 'tricot' ? 'Aiguilles' : 'Crochets'}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {technicalDetails.needles.map((n, idx) => (
                                      <div key={idx} className="bg-white/70 rounded px-3 py-2">
                                        <div className="text-sm text-gray-900">
                                          {project.technique === 'tricot' && n.type && (
                                            <span className="font-medium">{n.type}</span>
                                          )}
                                          {n.size && (
                                            <span className={project.technique === 'crochet' ? 'font-medium' : ''}>
                                              {project.technique === 'tricot' && n.type ? ' · ' : ''}{n.size}mm
                                            </span>
                                          )}
                                          {project.technique === 'tricot' && n.length && (
                                            <span className="text-xs text-gray-600 ml-1">({n.length})</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ÉCHANTILLON / GAUGE */}
                              {technicalDetails.gauge && (technicalDetails.gauge.stitches || technicalDetails.gauge.rows) && (
                                <div className="bg-gradient-to-br from-warm-50 to-warm-200 rounded-lg p-3 border-l-4 border-warm-400">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">📏</span>
                                    <span className="font-semibold text-warm-700 text-sm">Échantillon</span>
                                  </div>
                                  <div className="bg-white/70 rounded px-3 py-2">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {technicalDetails.gauge.stitches && <span>{technicalDetails.gauge.stitches} mailles</span>}
                                      {technicalDetails.gauge.stitches && technicalDetails.gauge.rows && <span> × </span>}
                                      {technicalDetails.gauge.rows && <span>{technicalDetails.gauge.rows} rangs</span>}
                                    </div>
                                    {technicalDetails.gauge.dimensions && (
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {technicalDetails.gauge.dimensions}
                                      </div>
                                    )}
                                    {technicalDetails.gauge.notes && (
                                      <div className="text-xs text-gray-600 italic mt-2 pt-2 border-t border-gray-300">
                                        {technicalDetails.gauge.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="text-6xl mb-4">🔧</div>
                        <p className="text-gray-600 mb-4">Aucun détail technique pour ce projet</p>
                        <button
                          onClick={openTechnicalDetailsModal}
                          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                        >
                          ➕ Ajouter les détails techniques
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>

      {/* [AI:Claude] Modal d'ajout d'URL de patron */}
      {/* [AI:Claude] Modal sélection patron depuis bibliothèque */}
      {showPatternLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
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

            <div className="p-6 border-t border-gray-200 flex-shrink-0">
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

      {/* [AI:Claude] Modal de choix de modification du patron */}
      {showPatternEditChoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              ✏️ Modifier le patron
            </h2>
            <p className="text-gray-600 mb-6">
              Choisissez comment vous souhaitez modifier votre patron
            </p>

            <div className="space-y-4">
              {/* Option 1: Bibliothèque */}
              <button
                onClick={() => {
                  setShowPatternEditChoiceModal(false)
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

              {/* Option 2: Créer un patron texte */}
              <button
                onClick={() => {
                  setShowPatternEditChoiceModal(false)
                  handleOpenPatternTextModal()
                }}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition"
                disabled={uploadingPattern}
              >
                <div className="text-4xl mb-2">📝</div>
                <p className="text-gray-700 font-medium mb-1">
                  Modifier le texte du patron
                </p>
                <p className="text-xs text-gray-500">
                  Coller ou saisir le texte du patron
                </p>
              </button>

              {/* Option 3: Upload fichier */}
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
                  onChange={(e) => {
                    setShowPatternEditChoiceModal(false)
                    handlePatternUpload(e)
                  }}
                  className="hidden"
                  disabled={uploadingPattern}
                />
              </label>

              {/* Option 4: URL */}
              <button
                onClick={() => {
                  setShowPatternEditChoiceModal(false)
                  setShowPatternUrlModal(true)
                }}
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
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowPatternEditChoiceModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal d'édition du patron texte */}
      {showPatternTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] shadow-xl flex flex-col">
            <div className="p-6 flex-shrink-0">
              <h2 className="text-2xl font-bold">
                📝 {project.pattern_text ? 'Modifier le patron texte' : 'Créer un patron texte'}
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Astuce :</strong> Vous pouvez copier-coller le texte de votre patron ici
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <textarea
                value={patternTextEdit}
                onChange={(e) => setPatternTextEdit(e.target.value)}
                rows={20}
                placeholder="Collez ici le texte de votre patron...

Exemple :
Rang 1 : 6 mailles serrées dans un cercle magique
Rang 2 : 2ms dans chaque maille (12)
Rang 3 : *1ms, aug* x6 (18)
..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                autoFocus
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowPatternTextModal(false)
                    setPatternTextEdit('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={savingPatternText}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePatternText}
                  disabled={savingPatternText || !patternTextEdit.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {savingPatternText ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] shadow-xl flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl font-bold text-gray-900">✨ Générer une photo IA</h2>
                <button
                  type="button"
                  onClick={() => setShowStyleExamplesModal(true)}
                  className="bg-primary-600 text-white text-sm px-3 py-1.5 rounded-lg font-semibold shadow-lg hover:bg-primary-700 transition flex items-center gap-1"
                >
                  <span>🎨</span>
                  <span>Exemples de styles</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleEnhancePhoto} className="flex-1 overflow-y-auto p-6 flex flex-col">
              {/* Avertissement important */}
              {!hideAIWarning && (
                <div className="mb-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <div className="text-sm w-full">
                      <h4 className="font-bold text-orange-900 mb-2">Ce qui va être préservé et ce qui va changer :</h4>
                      <div className="space-y-1.5 text-orange-800">
                        <p className="flex items-start gap-2">
                          <span className="text-green-600 font-bold flex-shrink-0">✓</span>
                          <span><strong>Préservé :</strong> Les couleurs, motifs et texture de votre ouvrage restent identiques</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-orange-600 font-bold flex-shrink-0">↻</span>
                          <span><strong>Modifié :</strong> Le fond, l'éclairage et la position sont adaptés au style choisi</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold flex-shrink-0">✂</span>
                          <span><strong>Retiré :</strong> Les mains, éléments de fond indésirables sont supprimés</span>
                        </p>
                      </div>
                      <p className="mt-2.5 text-xs text-orange-700 font-medium">
                        💡 Conseil : Consultez les exemples de styles pour visualiser le résultat attendu
                      </p>
                      {/* Checkbox "Ne plus afficher" */}
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-orange-800 hover:text-orange-900">
                          <input
                            type="checkbox"
                            checked={hideAIWarning}
                            onChange={handleHideAIWarning}
                            className="rounded border-orange-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="font-medium">J'ai compris, ne plus afficher cet avertissement</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  {getAvailableStyles(detectProjectCategory(project?.type || '')).map(style => (
                    <div key={style.key}>
                      <label
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

                      {/* Sélecteur de genre intégré pour styles "Porté" ou enfant porté */}
                      {selectedContext?.key === style.key && style.label && (style.label.includes('Porté') || style.key.startsWith('child_garment_c') && ['child_garment_c1', 'child_garment_c4', 'child_garment_c6', 'child_garment_c7', 'child_garment_c9'].includes(style.key)) && (
                        <div className="mt-2 ml-11 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            {style.key.startsWith('child_garment_') ? '👧 Genre de l\'enfant :' : '👤 Genre du modèle :'}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <label
                              className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition ${
                                modelGender === 'male'
                                  ? 'border-primary-600 bg-white ring-2 ring-primary-300'
                                  : 'border-gray-300 bg-white hover:border-primary-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name="modelGender"
                                value="male"
                                checked={modelGender === 'male'}
                                onChange={(e) => setModelGender(e.target.value)}
                                className="sr-only"
                              />
                              <span className="text-2xl">{style.key.startsWith('child_garment_') ? '👦' : '👨'}</span>
                              <span className="text-xs font-semibold text-gray-900">{style.key.startsWith('child_garment_') ? 'Garçon' : 'Homme'}</span>
                            </label>
                            <label
                              className={`flex items-center justify-center gap-2 p-2 border-2 rounded-lg cursor-pointer transition ${
                                modelGender === 'female'
                                  ? 'border-primary-600 bg-white ring-2 ring-primary-300'
                                  : 'border-gray-300 bg-white hover:border-primary-400'
                              }`}
                            >
                              <input
                                type="radio"
                                name="modelGender"
                                value="female"
                                checked={modelGender === 'female'}
                                onChange={(e) => setModelGender(e.target.value)}
                                className="sr-only"
                              />
                              <span className="text-2xl">{style.key.startsWith('child_garment_') ? '👧' : '👩'}</span>
                              <span className="text-xs font-semibold text-gray-900">{style.key.startsWith('child_garment_') ? 'Fille' : 'Femme'}</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

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
                <div className="grid grid-cols-5 gap-2">
                  {/* Option "Aucune" */}
                  <button
                    type="button"
                    onClick={() => setSelectedSeason(null)}
                    className={`flex flex-col items-center gap-1 p-2 border-2 rounded-lg transition ${
                      selectedSeason === null
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">🎨</span>
                    <span className="text-xs font-medium text-gray-700">Aucune</span>
                  </button>

                  {/* Options de saisons */}
                  {seasons.map(season => (
                    <button
                      key={season.key}
                      type="button"
                      onClick={() => setSelectedSeason(season.key)}
                      className={`flex flex-col items-center gap-1 p-2 border-2 rounded-lg transition ${
                        selectedSeason === season.key
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={season.desc}
                    >
                      <span className="text-xl">{season.icon}</span>
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

              {/* Aperçu gratuit - DÉSACTIVÉ pour économiser les coûts API */}
              {/*
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
              {/*
              {previewError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">❌ {previewError}</p>
                </div>
              )}
              */}

              {/* Progression génération preview */}
              {/*
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
              */}

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

              {/* Résumé des crédits (si génération HD) - DÉSACTIVÉ car preview désactivée */}
              {/*
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
              */}

              {/* Boutons - SIMPLIFIÉ : génération HD directe sans preview */}
              <div className="flex items-center gap-3 flex-shrink-0 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEnhanceModal(false)
                    setSelectedPhoto(null)
                  }}
                  disabled={enhancing}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 font-medium"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={enhancing || !credits || credits.total_available < 1}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {enhancing ? '✨ Génération...' : '✨ Générer en HD (1 crédit)'}
                </button>
              </div>

              {/* Message d'information */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-700 text-center leading-relaxed">
                  <span className="font-bold text-blue-700">💬 Votre avis compte</span> :
                  Après génération, vous pourrez noter le résultat et nous aider à améliorer le service.
                </p>
              </div>

              {/* DÉSACTIVÉ - Boutons de preview pour économiser les coûts API */}
              {/*
              <div className="flex items-center gap-3 flex-shrink-0 pt-4 border-t border-gray-200 mt-6">
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
              */}
            </form>
          </div>
        </div>
      )}

      {/* [AI:Claude] Modal des exemples de styles IA */}
      {showStyleExamplesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] shadow-xl flex flex-col">
            <div className="bg-gradient-to-r from-primary-600 to-sage-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-lg">
              <h2 className="text-2xl font-bold">🎨 Exemples de styles IA</h2>
              <button
                onClick={() => setShowStyleExamplesModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Photo originale unique en haut */}
              <div className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border-2 border-gray-300">
                <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">📷 Photo originale</h3>
                <div className="max-w-xs mx-auto">
                  <img
                    src={`/style-examples/${detectProjectCategory(project?.type || '')}_before.jpg`}
                    alt="Photo originale"
                    className="w-full rounded-lg shadow"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3EPhoto à venir%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
              </div>

              {/* Résultats des 9 styles */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 text-center">✨ Résultats par style</h3>
                <p className="text-sm text-gray-600 text-center mt-1">Les 9 styles disponibles appliqués à la même photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableStyles(detectProjectCategory(project?.type || '')).map((style) => (
                  <div
                    key={style.key}
                    className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary-400 transition"
                  >
                    {/* Image générée */}
                    <div className="relative bg-gray-100">
                      <img
                        src={`/style-examples/${style.key}_after.jpg`}
                        alt={style.label}
                        className="w-full h-64 object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3EExemple à venir%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      {style.tier === 'plus' && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full shadow">
                          PLUS
                        </span>
                      )}
                      {style.tier === 'pro' && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-primary-600 text-white text-xs font-bold rounded-full shadow">
                          PRO
                        </span>
                      )}
                      {style.tier === 'free' && (
                        <span className="absolute top-2 right-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full shadow">
                          GRATUIT
                        </span>
                      )}
                    </div>

                    {/* Nom et description du style */}
                    <div className="p-3 bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{style.icon}</span>
                        <h3 className="font-bold text-gray-900">{style.label}</h3>
                      </div>
                      <p className="text-xs text-gray-600">{style.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex-shrink-0 rounded-b-lg">
              <button
                onClick={() => setShowStyleExamplesModal(false)}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition"
              >
                Fermer
              </button>
            </div>
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
                autoFocus
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
                <option value="Jouets/Peluches">🧸 Jouets/Peluches</option>
                <option value="Vêtements bébé">👶 Vêtements bébé</option>
                <option value="Accessoires bébé">🍼 Accessoires bébé</option>
                <option value="Vêtements enfant">👧 Vêtements enfant</option>
                <option value="Maison/Déco">🏠 Maison/Déco</option>
                <option value="Autre">✨ Autre</option>
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

      {/* [AI:Claude] Modal des détails techniques */}
      {showTechnicalDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
              <h3 className="text-2xl font-bold text-gray-900">
                🔧 Détails techniques
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ajoutez les informations sur la laine, les aiguilles/crochets et l'échantillon
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Description générale */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Description / Notes
                </label>
                <textarea
                  value={technicalForm.description}
                  onChange={(e) => setTechnicalForm({ ...technicalForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Description générale du projet, notes personnelles..."
                  autoFocus
                />
              </div>

              {/* LAINE / YARN */}
              <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-warm-100 rounded-lg border border-primary-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    🧶 {project.technique === 'tricot' ? 'Laine' : 'Fil'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setTechnicalForm({
                      ...technicalForm,
                      yarn: [...technicalForm.yarn, { brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }]
                    })}
                    className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                  >
                    + Ajouter
                  </button>
                </div>
                {technicalForm.yarn.map((y, yIdx) => (
                  <div key={yIdx} className="mb-4 p-4 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {project.technique === 'tricot' ? 'Laine' : 'Fil'} #{yIdx + 1}
                      </span>
                      {technicalForm.yarn.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setTechnicalForm({
                            ...technicalForm,
                            yarn: technicalForm.yarn.filter((_, i) => i !== yIdx)
                          })}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          ✕ Supprimer
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Marque</label>
                        <input
                          type="text"
                          value={y.brand}
                          onChange={(e) => {
                            const newYarn = [...technicalForm.yarn]
                            newYarn[yIdx].brand = e.target.value
                            setTechnicalForm({ ...technicalForm, yarn: newYarn })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="Ex: DROPS ALPACA"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Nom</label>
                        <input
                          type="text"
                          value={y.name}
                          onChange={(e) => {
                            const newYarn = [...technicalForm.yarn]
                            newYarn[yIdx].name = e.target.value
                            setTechnicalForm({ ...technicalForm, yarn: newYarn })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="Ex: Garnstudio (groupe A)"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs text-gray-600">Quantités et coloris</label>
                        <button
                          type="button"
                          onClick={() => {
                            const newYarn = [...technicalForm.yarn]
                            newYarn[yIdx].quantities.push({ amount: '', unit: 'pelotes', color: '' })
                            setTechnicalForm({ ...technicalForm, yarn: newYarn })
                          }}
                          className="text-primary-600 hover:text-primary-700 text-xs"
                        >
                          + Ajouter coloris
                        </button>
                      </div>
                      {y.quantities.map((q, qIdx) => (
                        <div key={qIdx} className="p-3 bg-gray-50 rounded border border-gray-200">
                          {/* Ligne 1: Quantité + Unité */}
                          <div className="grid grid-cols-[1fr,auto] gap-3 mb-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Quantité</label>
                              <input
                                type="text"
                                value={q.amount}
                                onChange={(e) => {
                                  const newYarn = [...technicalForm.yarn]
                                  newYarn[yIdx].quantities[qIdx].amount = e.target.value
                                  setTechnicalForm({ ...technicalForm, yarn: newYarn })
                                }}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                placeholder="Ex: 3, 2-3, 150-200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Unité</label>
                              <div className="flex border border-gray-300 rounded overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newYarn = [...technicalForm.yarn]
                                    newYarn[yIdx].quantities[qIdx].unit = 'pelotes'
                                    setTechnicalForm({ ...technicalForm, yarn: newYarn })
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium transition ${
                                    (q.unit || 'pelotes') === 'pelotes'
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  Pelotes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newYarn = [...technicalForm.yarn]
                                    newYarn[yIdx].quantities[qIdx].unit = 'grammes'
                                    setTechnicalForm({ ...technicalForm, yarn: newYarn })
                                  }}
                                  className={`px-3 py-1.5 text-xs font-medium transition border-l border-gray-300 ${
                                    (q.unit || 'pelotes') === 'grammes'
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  Grammes
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Ligne 2: Coloris + Supprimer */}
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Coloris</label>
                              <input
                                type="text"
                                value={q.color}
                                onChange={(e) => {
                                  const newYarn = [...technicalForm.yarn]
                                  newYarn[yIdx].quantities[qIdx].color = e.target.value
                                  setTechnicalForm({ ...technicalForm, yarn: newYarn })
                                }}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                placeholder="Ex: Rouge, Bleu marine"
                              />
                            </div>
                            {y.quantities.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newYarn = [...technicalForm.yarn]
                                  newYarn[yIdx].quantities = newYarn[yIdx].quantities.filter((_, i) => i !== qIdx)
                                  setTechnicalForm({ ...technicalForm, yarn: newYarn })
                                }}
                                className="text-red-500 hover:text-red-700 text-sm px-2 py-1.5"
                                title="Supprimer ce coloris"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AIGUILLES / CROCHETS */}
              <div className="mb-6 p-4 bg-sage-50 rounded-lg border border-sage-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {project.technique === 'tricot' ? '🪡 Aiguilles' : '🪝 Crochets'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setTechnicalForm({
                      ...technicalForm,
                      needles: [...technicalForm.needles, { type: '', size: '', length: '' }]
                    })}
                    className="px-3 py-1 bg-sage-600 text-white rounded text-sm hover:bg-sage-700"
                  >
                    + Ajouter
                  </button>
                </div>
                {technicalForm.needles.map((n, nIdx) => (
                  <div key={nIdx} className="mb-3 p-3 bg-white rounded-lg shadow-sm">
                    {(technicalForm.needles.length > 1 || project.technique === 'tricot') && (
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          {project.technique === 'tricot' ? `Aiguille #${nIdx + 1}` : `Crochet #${nIdx + 1}`}
                        </span>
                        {technicalForm.needles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTechnicalForm({
                              ...technicalForm,
                              needles: technicalForm.needles.filter((_, i) => i !== nIdx)
                            })}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            ✕ Supprimer
                          </button>
                        )}
                      </div>
                    )}
                    <div className={`grid grid-cols-1 ${project.technique === 'tricot' ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-2`}>
                      {project.technique === 'tricot' && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Type</label>
                          <input
                            type="text"
                            value={n.type}
                            onChange={(e) => {
                              const newNeedles = [...technicalForm.needles]
                              newNeedles[nIdx].type = e.target.value
                              setTechnicalForm({ ...technicalForm, needles: newNeedles })
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Ex: Circulaires, Doubles pointes"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Taille (mm)</label>
                        <input
                          type="text"
                          value={n.size}
                          onChange={(e) => {
                            const newNeedles = [...technicalForm.needles]
                            newNeedles[nIdx].size = e.target.value
                            setTechnicalForm({ ...technicalForm, needles: newNeedles })
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                          placeholder="Ex: 4, 5, 3.5"
                        />
                      </div>
                      {project.technique === 'tricot' && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Longueur</label>
                          <input
                            type="text"
                            value={n.length}
                            onChange={(e) => {
                              const newNeedles = [...technicalForm.needles]
                              newNeedles[nIdx].length = e.target.value
                              setTechnicalForm({ ...technicalForm, needles: newNeedles })
                            }}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Ex: 40cm et 80cm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ÉCHANTILLON / GAUGE */}
              <div className="mb-6 p-4 bg-warm-50 rounded-lg border border-warm-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📏 Échantillon
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Largeur (mailles)</label>
                    <input
                      type="text"
                      value={technicalForm.gauge.stitches}
                      onChange={(e) => setTechnicalForm({
                        ...technicalForm,
                        gauge: { ...technicalForm.gauge, stitches: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Ex: 17 mailles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Hauteur (rangs)</label>
                    <input
                      type="text"
                      value={technicalForm.gauge.rows}
                      onChange={(e) => setTechnicalForm({
                        ...technicalForm,
                        gauge: { ...technicalForm.gauge, rows: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="Ex: 22 rangs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Dimensions</label>
                    <input
                      type="text"
                      value={technicalForm.gauge.dimensions}
                      onChange={(e) => setTechnicalForm({
                        ...technicalForm,
                        gauge: { ...technicalForm.gauge, dimensions: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      placeholder="10 x 10 cm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={technicalForm.gauge.notes}
                    onChange={(e) => setTechnicalForm({
                      ...technicalForm,
                      gauge: { ...technicalForm.gauge, notes: e.target.value }
                    })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Ex: en jersey, avec 1 fil de chaque qualité et les aiguilles 5"
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowTechnicalDetailsModal(false)}
                  disabled={savingTechnical}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTechnicalDetails}
                  disabled={savingTechnical}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {savingTechnical ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
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

      {/* [AI:Claude] Modal de fin de projet - toutes sections terminées */}
      {showProjectCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 text-center">
              🎉 Toutes les sections sont terminées !
            </h3>
            <p className="text-gray-700 mb-6 text-center">
              Félicitations ! Vous avez terminé toutes les sections de votre projet.
              <br />
              Que souhaitez-vous faire ?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowProjectCompletionModal(false)
                  setShowAddSectionModal(true)
                  setSectionForm({ name: '', description: '', total_rows: '', notes: '' })
                  setEditingSection(null)
                }}
                className="flex-1 px-6 py-4 border-2 border-primary-600 text-primary-600 rounded-lg font-bold hover:bg-primary-50 transition text-center"
              >
                ➕ Ajouter une section
              </button>
              <button
                onClick={handleCompleteProject}
                className="flex-1 px-6 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition text-center"
              >
                ✅ Terminer le projet
              </button>
            </div>
            <button
              onClick={() => setShowProjectCompletionModal(false)}
              className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 transition text-sm"
            >
              Annuler (rester en cours)
            </button>
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
              <div className="mb-4">
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

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  📝 Notes (optionnel)
                </label>
                <textarea
                  value={sectionForm.notes}
                  onChange={(e) => setSectionForm({ ...sectionForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-amber-50"
                  placeholder="Instructions particulières, rappels, modifications..."
                />
              </div>

              {/* Boutons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSectionModal(false)
                    setSectionForm({ name: '', description: '', total_rows: '', notes: '' })
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

      {/* [AI:Claude] Bouton flottant pour les notes - masqué quand popup ouverte */}
      {!showNotes && (
      <button
        onClick={handleOpenNotes}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 shadow-2xl transition-all transform hover:scale-105 active:scale-95 bg-primary-600 hover:bg-primary-700 rounded-2xl px-4 py-3 flex items-center gap-3"
        title="Notes du projet"
      >
        {/* Icône SVG */}
        <svg
          className="w-7 h-7 text-white flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <div className="flex flex-col items-start">
          <span className="text-white font-bold text-sm leading-tight">Notes</span>
        </div>
        {/* Badge animé avec stylo */}
        <span className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-primary-600 flex items-center justify-center animate-bounce">
          <svg className="w-3.5 h-3.5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </span>
      </button>
      )}

      {/* [AI:Claude] v0.15.0 - Modal de satisfaction post-génération */}
      <SatisfactionModal
        isOpen={showSatisfactionModal}
        photo={generatedPhoto}
        onClose={() => {
          setShowSatisfactionModal(false)
          setGeneratedPhoto(null)
        }}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />

      {/* [AI:Claude] v0.16.2: Modale de confirmation pour attribuer les rangs existants */}
      {showRowsConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🤔</div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">
                Que faire avec les rangs existants ?
              </h2>
              <p className="text-gray-600">
                Vous avez déjà <span className="font-bold text-primary-600">{project.current_row} rang{project.current_row > 1 ? 's' : ''}</span> au compteur.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowRowsConfirmModal(false)
                  rowsConfirmResolve('assign')
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition shadow-lg font-semibold text-left flex items-center gap-3"
              >
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-bold">Attribuer à la section</div>
                  <div className="text-sm text-primary-100">
                    La section "{sectionForm.name}" démarrera à {project.current_row} rangs
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowRowsConfirmModal(false)
                  rowsConfirmResolve('reset')
                }}
                className="w-full px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-left flex items-center gap-3"
              >
                <span className="text-2xl">🔄</span>
                <div>
                  <div className="font-bold">Remettre à zéro</div>
                  <div className="text-sm text-gray-500">
                    La section commencera à 0 (les rangs précédents étaient du test)
                  </div>
                </div>
              </button>
            </div>
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

export default ProjectCounter
