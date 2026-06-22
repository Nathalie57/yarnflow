/**
 * @file MyProjects.jsx
 * @brief Dashboard unifié YarnFlow (Projets + Photos + Stats)
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-17 by [AI:Claude] - Fusion Dashboard : ajout stats cards (projets, photos, temps)
 *
 * @history
 *   2025-11-17 [AI:Claude] Fusion Dashboard : stats cards + redirection /dashboard → /my-projects
 *   2025-11-17 [AI:Claude] Refonte UI : focus photos, bouton "Voir le projet", badges technique
 *   2025-11-17 [AI:Claude] Remplacement alert/confirm par modales React personnalisées
 *   2025-11-14 [AI:Claude] Simplification formulaire + nouvelles catégories + import patron
 *   2025-11-13 [AI:Claude] Création initiale avec liste projets + filtres
 */

import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import api, { authAPI } from '../services/api'
import ProjectFilters from '../components/ProjectFilters'
import InfoBubble from '../components/InfoBubble'
import TagBadge from '../components/TagBadge'
import UpgradePrompt from '../components/UpgradePrompt'
import CreateProjectWizard from '../components/CreateProjectWizard'

const MyProjects = () => {
  const { user, updateUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { trackProjectCreated } = useAnalytics()

  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)

  // Détection retour Stripe : ?payment=success dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('payment') === 'success') {
      const storedPlan = localStorage.getItem('yf_pending_plan')
      if (storedPlan) {
        setPendingPlan(storedPlan)
        localStorage.removeItem('yf_pending_plan')
      }
      setPaymentSuccess(true)
      navigate('/my-projects', { replace: true })

      // Polling jusqu'à ce que le webhook ait mis à jour l'abonnement (race condition)
      const MAX_RETRIES = 6
      const RETRY_DELAY = 2000
      const pollSubscription = async (attempt = 0) => {
        try {
          const response = await authAPI.me()
          const freshUser = response?.data?.data?.user
          if (freshUser) {
            updateUser(freshUser)
            if (freshUser.subscription_type === 'free' && attempt < MAX_RETRIES) {
              setTimeout(() => pollSubscription(attempt + 1), RETRY_DELAY)
            } else {
              // Webhook traité — rafraîchir crédits et quota
              fetchCredits()
              fetchSmartQuota()
            }
          }
        } catch {}
      }
      pollSubscription()
    }
  }, [])

  // Reprise automatique du dernier projet — une seule fois par session
  useEffect(() => {
    const alreadyResumed = sessionStorage.getItem('yf_resumed')
    const lastProjectId = localStorage.getItem('yf_last_project_id')
    if (!alreadyResumed && lastProjectId) {
      sessionStorage.setItem('yf_resumed', '1')
      navigate(`/projects/${lastProjectId}`, { replace: true })
    }
  }, [])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('') // Recherche par nom/description
  const [showCreateModal, setShowCreateModal] = useState(false)

  // [AI:Claude] Détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false)

  // [AI:Claude] Stats du dashboard
  const [dashboardStats, setDashboardStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [credits, setCredits] = useState(null)
  const [smartQuota, setSmartQuota] = useState(null)

  // [AI:Claude] Création de projet via wizard
  const [creating, setCreating] = useState(false)
  const [creatingStep, setCreatingStep] = useState('') // [AI:Claude] Étape en cours
  const [isCreatingDemo, setIsCreatingDemo] = useState(false)

  // [AI:Claude] Import de patron
  const [patternFile, setPatternFile] = useState(null)
  const [patternUrl, setPatternUrl] = useState('')
  const [patternText, setPatternText] = useState('')
  const [patternType, setPatternType] = useState('') // 'file', 'url', 'text' ou 'library'
  const [selectedLibraryPattern, setSelectedLibraryPattern] = useState(null)

  // [AI:Claude] Modal bibliothèque de patrons
  const [showPatternLibraryModal, setShowPatternLibraryModal] = useState(false)
  const [libraryPatterns, setLibraryPatterns] = useState([])
  const [loadingLibraryPatterns, setLoadingLibraryPatterns] = useState(false)

  // [AI:Claude] Modales URL et Texte
  const [showPatternUrlModal, setShowPatternUrlModal] = useState(false)
  const [showPatternTextModal, setShowPatternTextModal] = useState(false)
  const [patternSearchQuery, setPatternSearchQuery] = useState('') // Pour recherche Google/Ravelry

  // [AI:Claude] Modal système pour remplacer alert/confirm
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: null })

  // [AI:Claude] Upload photo de projet
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [selectedProjectForPhoto, setSelectedProjectForPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // [AI:Claude] Tags et filtres (v0.15.0)
  const [availableTags, setAvailableTags] = useState([]) // Tous les tags de l'utilisateur
  const [popularTags, setPopularTags] = useState([]) // Suggestions de tags
  const canUseTags = !!(user?.subscription_type && user.subscription_type !== 'free')
  const [filters, setFilters] = useState({
    status: null,
    favorite: null,
    tags: [],
    sort: 'updated_desc'
  })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // [AI:Claude] Restaurer le brouillon de création si la page a été rechargée (tab mobile)
  useEffect(() => {
    try {
      const wizardDraft = sessionStorage.getItem('yf_wizard')
      const patternDraft = sessionStorage.getItem('yf_wizard_pattern')
      if (wizardDraft || patternDraft) {
        setShowCreateModal(true)
        if (patternDraft) {
          const d = JSON.parse(patternDraft)
          if (d.patternUrl) setPatternUrl(d.patternUrl)
          if (d.patternText) setPatternText(d.patternText)
          if (d.patternType && ['url', 'text'].includes(d.patternType)) setPatternType(d.patternType)
        }
      }
    } catch {}
  }, [])

  // [AI:Claude] Sauvegarder l'état patron dans sessionStorage tant que le wizard est ouvert
  useEffect(() => {
    if (!showCreateModal) return
    try {
      sessionStorage.setItem('yf_wizard_pattern', JSON.stringify({ patternUrl, patternText, patternType }))
    } catch {}
  }, [showCreateModal, patternUrl, patternText, patternType])

  // [AI:Claude] Bouton retour Android : fermer le modal au lieu de quitter l'app
  useEffect(() => {
    if (showCreateModal) {
      window.history.pushState({ modal: 'createProject' }, '')
      const handlePopState = () => handleCancelModal()
      window.addEventListener('popstate', handlePopState)
      return () => window.removeEventListener('popstate', handlePopState)
    }
  }, [showCreateModal])

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

  // [AI:Claude] Rafraîchir les projets quand on revient sur /my-projects
  useEffect(() => {
    if (location.pathname === '/my-projects') {
      fetchProjects()
    }
  }, [location.pathname])

  // [AI:Claude] Rafraîchir les projets quand la page devient visible (après navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname === '/my-projects') {
        // La page est redevenue visible, rafraîchir les projets
        fetchProjects()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [location.pathname, filters])

  // [AI:Claude] Charger les stats du dashboard au montage
  useEffect(() => {
    fetchDashboardStats()
    fetchCredits()
    fetchSmartQuota()
  }, [])

  // [AI:Claude] Charger les tags populaires (v0.15.0)
  useEffect(() => {
    fetchPopularTags()
  }, [user])

  // [AI:Claude] Recharger les projets quand les filtres changent (v0.15.0)
  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.favorite, filters.sort, JSON.stringify(filters.tags)])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      // [AI:Claude] Construire les paramètres de filtrage
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.favorite !== null) params.append('favorite', filters.favorite)
      if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','))
      if (filters.sort) params.append('sort', filters.sort)

      const response = await api.get(`/projects?${params.toString()}`)

      setProjects(response.data.projects || [])

      // [AI:Claude] Extraire tous les tags disponibles pour le filtrage
      if (response.data.projects) {
        const allTags = {}
        response.data.projects.forEach(project => {
          if (project.tags) {
            project.tags.forEach(tag => {
              allTags[tag] = (allTags[tag] || 0) + 1
            })
          }
        })
        setAvailableTags(
          Object.entries(allTags).map(([tag_name, count]) => ({ tag_name, count }))
        )
      }
    } catch (err) {
      console.error('Erreur chargement projets:', err)
      setError('Impossible de charger vos projets')
    } finally {
      setLoading(false)
      setHasLoadedOnce(true)
    }
  }

  // [AI:Claude] Récupérer les tags populaires pour suggestions (v0.15.0)
  const fetchPopularTags = async () => {
    if (!canUseTags) return

    try {
      const response = await api.get('/user/tags/popular')
      if (response.data.success) {
        setPopularTags(response.data.popular_tags || [])
      }
    } catch (err) {
      console.error('Erreur chargement tags populaires:', err)
    }
  }

  const getUserPlan = () => {
    if (!user) return 'free'
    const tier = user.subscription_type || 'free'
    return tier === 'free' ? 'free' : 'pro'
  }

  // [AI:Claude] Sauvegarder les tags après création de projet (v0.15.0)
  const saveProjectTags = async (projectId, tags) => {
    if (!canUseTags || tags.length === 0) return

    try {
      await api.post(`/projects/${projectId}/tags`, { tags })
    } catch (err) {
      console.error('Erreur sauvegarde tags:', err)
    }
  }

  // [AI:Claude] Récupérer les stats du dashboard
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true)
      const response = await api.get('/user/dashboard')

      // [AI:Claude] L'API retourne { success, data: { stats, user } }
      if (response.data && response.data.data && response.data.data.stats) {
        setDashboardStats(response.data.data.stats)
      } else {
        setDashboardStats({
          total_projects: 0,
          total_photos: 0,
          total_time: 0
        })
      }
    } catch (err) {
      // [AI:Claude] Même en cas d'erreur, mettre des stats par défaut
      setDashboardStats({
        total_projects: 0,
        total_photos: 0,
        total_time: 0
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchSmartQuota = async () => {
    try {
      const response = await api.get('/projects/smart-create/quota')
      setSmartQuota(response.data.quota)
    } catch {}
  }

  // [AI:Claude] Récupérer les crédits photos IA
  const fetchCredits = async () => {
    try {
      const response = await api.get('/photos/credits')
      setCredits(response.data.credits)
    } catch (err) {
      setCredits({
        monthly_credits: 0,
        purchased_credits: 0,
        total_available: 0,
        credits_used_this_month: 0,
        total_credits_used: 0
      })
    }
  }

  // [AI:Claude] Helper pour afficher une alerte personnalisée
  const showAlert = (title, message, type = 'info') => {
    setAlertData({ title, message, type })
    setShowAlertModal(true)
  }

  // [AI:Claude] Helper pour afficher une confirmation personnalisée
  const showConfirm = (title, message, onConfirm) => {
    setConfirmData({ title, message, onConfirm })
    setShowConfirmModal(true)
  }

  // [AI:Claude] Supprimer un projet
  const handleDeleteProject = async (projectId) => {
    showConfirm(
      'Supprimer le projet',
      'Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.',
      async () => {
        try {
          await api.delete(`/projects/${projectId}`)
          setProjects(projects.filter(p => p.id !== projectId))
          showAlert('✅ Suppression réussie', 'Le projet a été supprimé avec succès.', 'success')
        } catch (err) {
          console.error('Erreur suppression:', err)
          showAlert('❌ Erreur', 'Erreur lors de la suppression du projet', 'error')
        }
      }
    )
  }

  // [AI:Claude] Marquer comme favori
  const handleToggleFavorite = async (projectId, currentValue) => {
    try {
      // [AI:Claude] v0.15.0 : Utiliser la nouvelle route dédiée
      await api.put(`/projects/${projectId}/favorite`)

      setProjects(projects.map(p =>
        p.id === projectId ? { ...p, is_favorite: !currentValue } : p
      ))
    } catch (err) {
      console.error('Erreur favori:', err)
      showAlert('Erreur', 'Impossible de modifier le favori')
    }
  }

  // [AI:Claude] Ouvrir modal d'upload photo
  const openPhotoUploadModal = (project) => {
    setSelectedProjectForPhoto(project)
    setPhotoFile(null)
    setShowPhotoUploadModal(true)
  }

  // [AI:Claude] Upload photo de projet
  const handleUploadProjectPhoto = async (e) => {
    e.preventDefault()

    if (!photoFile || !selectedProjectForPhoto) {
      showAlert('Erreur', 'Veuillez sélectionner une photo')
      return
    }

    try {
      setUploadingPhoto(true)

      const formData = new FormData()
      formData.append('photo', photoFile)

      await api.post(`/projects/${selectedProjectForPhoto.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showAlert('Succès', 'Photo ajoutée avec succès !', 'success')
      setShowPhotoUploadModal(false)
      setPhotoFile(null)
      fetchProjects() // Recharger les projets
    } catch (err) {
      console.error('Erreur upload photo:', err)
      showAlert('Erreur', err.response?.data?.message || 'Erreur lors de l\'ajout de la photo')
    } finally {
      setUploadingPhoto(false)
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
      showAlert('Erreur', 'Impossible de charger votre bibliothèque de patrons')
    } finally {
      setLoadingLibraryPatterns(false)
    }
  }

  // [AI:Claude] Créer un nouveau projet via le wizard
  const handleCreateDemoProject = async () => {
    setIsCreatingDemo(true)
    try {
      const response = await api.post('/projects', {
        name: 'Bonnet rayé — Exemple',
        technique: 'tricot',
        type: 'accessoires',
        description: 'Un projet de démonstration pour découvrir YarnFlow. Modifiez-le comme vous voulez !',
        status: 'in_progress',
        counter_unit: 'rows',
        counter_unit_increment: 1.0
      })
      const demoProject = response.data.project

      await api.post(`/projects/${demoProject.id}/sections`, {
        name: 'Corps du bonnet',
        total_rows: 80,
        display_order: 0,
        notes: null
      })

      await api.post(`/projects/${demoProject.id}/rows`, { row_number: 15 })

      navigate(`/projects/${demoProject.id}?new=1`)
    } catch (err) {
      console.error('Erreur création projet démo:', err)
    } finally {
      setIsCreatingDemo(false)
    }
  }

  const handleCreateProject = async (wizardData) => {
    setCreating(true)
    setCreatingStep('Création du projet...')

    const { formData, sections, technicalForm, isFavorite, projectTags } = wizardData
    let currentStep = ''
    let newProject = null

    try {
      // [AI:Claude] ÉTAPE 1 : Création du projet
      currentStep = 'création du projet'

      const projectData = {
        name: formData.name,
        technique: formData.technique,
        type: formData.type || null,
        description: formData.description || null,
        status: 'in_progress',
        counter_unit: formData.counter_unit || 'rows',
        counter_unit_increment: formData.counter_unit === 'cm' ? 0.5 : 1.0
      }

      // [AI:Claude] Ajouter les détails techniques si des données ont été saisies
      const hasYarnData = technicalForm.yarn.some(y => y.brand || y.name || y.quantities.some(q => q.amount || q.color))
      const hasNeedlesData = technicalForm.needles.some(n => n.type || n.size || n.length)
      const hasGaugeData = technicalForm.gauge.stitches || technicalForm.gauge.rows || technicalForm.gauge.notes

      if (hasYarnData || hasNeedlesData || hasGaugeData) {
        projectData.technical_details = JSON.stringify(technicalForm)
      }

      const response = await api.post('/projects', projectData)
      newProject = response.data.project

      trackProjectCreated('manual', newProject.technique)
      try {
        await api.post('/analytics/track-event', {
          event_name: 'project_created',
          project_id: newProject.id,
          technique: newProject.technique,
          counter_unit: newProject.counter_unit
        })
      } catch (err) {
        console.error('Erreur tracking project_created:', err)
      }

      // [AI:Claude] ÉTAPE 2 : Créer les sections si définies
      if (sections.length > 0) {
        currentStep = 'création des sections'
        setCreatingStep(`Création de ${sections.length} section(s)...`)

        for (let i = 0; i < sections.length; i++) {
          await api.post(`/projects/${newProject.id}/sections`, {
            name: sections[i].name,
            description: sections[i].description || null,
            total_rows: sections[i].total_rows || null,
            display_order: i,
            notes: sections[i].notes || null
          })
        }
      }

      // [AI:Claude] ÉTAPE 3 : Upload du patron si fourni
      if (patternType === 'file' && patternFile) {
        currentStep = 'upload du fichier patron'
        setCreatingStep('Upload du patron...')

        const formDataPattern = new FormData()
        formDataPattern.append('pattern', patternFile)
        formDataPattern.append('pattern_type', patternFile.type.startsWith('image/') ? 'image' : 'pdf')

        await api.post(`/projects/${newProject.id}/pattern`, formDataPattern, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else if (patternType === 'url' && patternUrl.trim()) {
        currentStep = 'enregistrement du lien patron'
        setCreatingStep('Enregistrement du lien patron...')

        await api.post(`/projects/${newProject.id}/pattern-url`, {
          pattern_url: patternUrl
        })
      } else if (patternType === 'text' && patternText.trim()) {
        currentStep = 'enregistrement du texte patron'
        setCreatingStep('Enregistrement du patron texte...')

        await api.post(`/projects/${newProject.id}/pattern-text`, {
          pattern_text: patternText
        })
      } else if (patternType === 'library' && selectedLibraryPattern) {
        currentStep = 'liaison du patron depuis la bibliothèque'
        setCreatingStep('Liaison du patron...')

        await api.post(`/projects/${newProject.id}/pattern-from-library`, {
          pattern_library_id: selectedLibraryPattern.id
        })
      }

      // [AI:Claude] ÉTAPE 4 : Sauvegarder les tags
      if (projectTags.length > 0) {
        currentStep = 'sauvegarde des tags'
        setCreatingStep('Ajout des tags...')
        await saveProjectTags(newProject.id, projectTags)
      }

      // [AI:Claude] ÉTAPE 5 : Marquer comme favori
      if (isFavorite) {
        currentStep = 'marquage favori'
        setCreatingStep('Marquage comme favori...')
        await api.put(`/projects/${newProject.id}/favorite`)
      }

      // [AI:Claude] Ajouter à la liste
      setProjects([newProject, ...projects])

      // [AI:Claude] Reset patron state et fermer
      setPatternFile(null)
      setPatternText('')
      setPatternUrl('')
      setPatternType('')
      setSelectedLibraryPattern(null)
      setPatternSearchQuery('')
      setShowCreateModal(false)
      try { sessionStorage.removeItem('yf_wizard_pattern') } catch {}

      // [AI:Claude] Si c'est le premier projet, stocker un flag pour afficher le tip
      if (projects.length === 0) {
        sessionStorage.setItem('showFirstProjectTip', 'true')
      }

      // [AI:Claude] Redirection automatique vers le projet pour onboarding "premier rang"
      window.location.href = `/projects/${newProject.id}?new=1`
    } catch (err) {
      // [AI:Claude] Message d'erreur détaillé basé sur l'étape qui a échoué
      let errorMessage = ''
      const apiError = err.response?.data?.error || err.response?.data?.message

      if (currentStep === 'création du projet') {
        errorMessage = apiError || 'Impossible de créer le projet. Vérifiez votre connexion internet.'
      } else if (currentStep === 'création des sections') {
        errorMessage = `Le projet a été créé mais erreur lors de la ${currentStep}. ${apiError || 'Vous pouvez ajouter les sections manuellement depuis le projet.'}`
      } else if (currentStep.includes('patron')) {
        errorMessage = `Le projet a été créé mais erreur lors de ${currentStep}. ${apiError || 'Vous pouvez ajouter le patron manuellement depuis le projet.'}`
      } else {
        errorMessage = apiError || 'Erreur lors de la création du projet'
      }

      showAlert('❌ Erreur', errorMessage, 'error')

      // [AI:Claude] Si le projet a été créé, l'ajouter quand même à la liste
      if (newProject) {
        setProjects([newProject, ...projects])
        setShowCreateModal(false)
      }
    } finally {
      setCreating(false)
      setCreatingStep('')
    }
  }

  // [AI:Claude] Badge de statut
  const getStatusBadge = (status) => {
    const badges = {
      in_progress: { label: 'En cours', color: 'bg-primary-100 text-primary-800' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      paused: { label: 'En pause', color: 'bg-red-100 text-red-800' },
      abandoned: { label: 'Abandonné', color: 'bg-gray-100 text-gray-800' }
    }

    const badge = badges[status] || badges.in_progress

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  // [AI:Claude] Quota utilisateur (v0.14.0 - FREE/PLUS/PRO) + v0.17.1 vérification expiration
  const canCreateProject = true

  // [AI:Claude] Fonction pour reset le formulaire de création (wizard)
  const handleCancelModal = () => {
    setPatternFile(null)
    setPatternUrl('')
    setPatternText('')
    setPatternType('')
    setSelectedLibraryPattern(null)
    setPatternSearchQuery('')
    setShowCreateModal(false)
    setShowPatternUrlModal(false)
    setShowPatternTextModal(false)
    try { sessionStorage.removeItem('yf_wizard_pattern') } catch {}
  }

  // [AI:Claude] Filtrer les projets par recherche
  const getFilteredProjects = () => {
    return projects.filter(project => {
      // Recherche dans le nom et la description
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = project.name?.toLowerCase().includes(query)
        const matchDescription = project.description?.toLowerCase().includes(query)
        const matchType = project.type?.toLowerCase().includes(query)

        if (!matchName && !matchDescription && !matchType)
          return false
      }

      return true
    })
  }

  const filteredProjects = getFilteredProjects()

  // [AI:Claude] v0.17.0 - Vérifier si l'utilisateur a au moins un projet avec current_row > 0
  // Pour débloquer les filtres/organisation avancée
  const hasStartedAtLeastOneProject = projects.some(p => (p.current_row || 0) > 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Toast succès paiement Stripe */}
      {paymentSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-800">Paiement réussi !</p>
            <p className="text-sm text-green-700 mt-0.5">Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités {pendingPlan === 'plus' ? 'PLUS' : 'PRO'}.</p>
          </div>
          <button onClick={() => setPaymentSuccess(false)} className="flex-shrink-0 text-green-500 hover:text-green-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header - Responsive mobile */}
      <div className="mb-6 sm:mb-8">
        {/* Afficher header complet uniquement si des projets existent */}
        {projects.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes projets</h1>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors touch-manipulation bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouveau projet
              </button>
            </div>

            {/* Stats inline */}
            {!loadingStats && dashboardStats && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {/* Projets */}
                <span>{projects.length} projet{projects.length !== 1 ? 's' : ''}</span>

                <span className="text-gray-300">·</span>

                {/* Crédits photos */}
                <span>
                  {credits?.total_available || 0} crédit{(credits?.total_available || 0) !== 1 ? 's' : ''} photo
                </span>
                <Link to="/subscription#credits" className="text-primary-600 hover:underline text-xs">
                  + Acheter
                </Link>

              </div>
            )}
          </>
        ) : (
          /* Header minimaliste pour empty state */
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes Projets</h1>
          </div>
        )}
      </div>


      {/* Barre de recherche */}
      {!loading && projects.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un projet par nom, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Skeleton loader */}
      {loading && !hasLoadedOnce && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="h-48 skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-5 skeleton rounded-lg w-3/4" />
                <div className="flex gap-2">
                  <div className="h-5 skeleton rounded-full w-20" />
                  <div className="h-5 skeleton rounded-full w-16" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="h-12 skeleton rounded-xl" />
                  <div className="h-12 skeleton rounded-xl" />
                </div>
                <div className="h-1.5 skeleton rounded-full" />
                <div className="h-10 skeleton rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filtres - Affichés si des projets existent */}
      {hasLoadedOnce && !error && projects.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-2"
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Filtrer et trier
            {(filters.status || filters.favorite !== null || filters.tags.length > 0) && (
              <span className="ml-1 w-2 h-2 rounded-full bg-primary-500 inline-block" />
            )}
          </button>

          {filtersOpen && (
            <div className="animate-fade-in-up">
              <ProjectFilters
                onFilterChange={setFilters}
                availableTags={availableTags}
                canUseTags={canUseTags}
                onUpgradeClick={() => setShowUpgradePrompt(true)}
                userPlan={getUserPlan()}
              />
            </div>
          )}
        </div>
      )}

      {/* Indicateur de chargement pendant filtrage */}
      {loading && hasLoadedOnce && (
        <div className="flex items-center justify-center py-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
        </div>
      )}

      {/* Liste des projets */}
      {!loading && !error && (
        <>
          {projects.length === 0 ? (
            <div className="max-w-lg mx-auto py-10 px-4">

              {/* Accueil */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {user?.first_name ? `Bienvenue, ${user.first_name} !` : 'Bienvenue sur YarnFlow !'}
                </h2>
                <p className="text-gray-500 text-sm">Par où voulez-vous commencer ?</p>
              </div>

              {/* Création Intelligente — CTA principal */}
              <button
                onClick={() => { navigate(smartQuota?.free_trial_used === false || smartQuota?.remaining > 0 ? '/smart-project-creator' : '/smart-project-creator') }}
                className="w-full mb-3 p-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-left transition shadow-md hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white text-base">Importer mon patron</p>
                      <span className="px-2 py-0.5 bg-white bg-opacity-20 text-white text-xs font-semibold rounded-full">Gratuit</span>
                    </div>
                    <p className="text-primary-100 text-sm leading-relaxed">
                      PDF, lien ou photo — notre IA crée votre projet en 10 secondes : sections, aiguilles, compteurs.
                    </p>
                  </div>
                </div>
              </button>

              {/* Créer manuellement */}
              <button
                onClick={() => canCreateProject && setShowCreateModal(true)}
                className="w-full mb-3 p-4 bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-left rounded-2xl transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 transition">
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-primary-600 transition" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-primary-700 transition">Créer un projet manuellement</p>
                    <p className="text-gray-400 text-xs mt-0.5">Remplissez les informations vous-même</p>
                  </div>
                </div>
              </button>

              {/* Explorer avec un exemple */}
              <button
                onClick={handleCreateDemoProject}
                disabled={isCreatingDemo}
                className="w-full mb-6 p-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-left rounded-2xl transition group disabled:opacity-60"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 text-sm group-hover:text-gray-800 transition">
                      {isCreatingDemo ? 'Création en cours...' : 'Explorer avec un exemple'}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">Un bonnet démo pré-rempli pour découvrir l'application</p>
                  </div>
                </div>
              </button>

              {/* Ce que ça fait concrètement — version condensée */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Une pause dans votre tricot ? Aucun stress</p>
                    <p className="text-gray-500 text-sm mt-0.5">Un clic pour mémoriser votre rang. Vous retrouvez exactement là où vous étiez.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4">
                  <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Votre patron toujours avec vous</p>
                    <p className="text-gray-500 text-sm mt-0.5">Attachez votre PDF ou notez le lien — plus besoin de chercher sur quel onglet il était.</p>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                Besoin d'organiser vos patrons sans créer de projet ?{' '}
                <Link to="/pattern-library" className="text-primary-600 hover:text-primary-700 underline">
                  Bibliothèque de patrons
                </Link>
              </p>

            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-12 px-6 bg-white rounded-xl border-2 border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Aucun projet ne correspond à <strong>"{searchQuery}"</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  ✕ Effacer la recherche
                </button>
                {canCreateProject && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
                  >
                    ➕ Créer un projet
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  {/* Photo — uniquement si elle existe */}
                  {project.main_photo && (
                    <div className="aspect-square bg-gray-200 relative group overflow-hidden">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${project.main_photo}`}
                        alt={`Photo du projet ${project.name}`}
                        className="w-full h-full object-cover object-top"
                      />
                      <button
                        onClick={() => openPhotoUploadModal(project)}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="flex items-center gap-2 px-4 py-2 bg-white/90 text-gray-800 rounded-xl text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                          Changer la photo
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">
                        {project.name}
                      </h3>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Bouton ajouter photo — discret, visible seulement sans photo */}
                        {!project.main_photo && (
                          <button
                            onClick={() => openPhotoUploadModal(project)}
                            className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors rounded-lg hover:bg-gray-50"
                            title="Ajouter une photo"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                          </button>
                        )}
                        <button
                        onClick={() => handleToggleFavorite(project.id, project.is_favorite)}
                        className="transition-transform hover:scale-110 active:scale-95"
                        title={project.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        {project.is_favorite ? (
                          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 hover:text-amber-300" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        )}
                      </button>
                      </div>{/* fin flex boutons droite */}
                    </div>

                    {/* Statut + Technique */}
                    <div className="flex items-center flex-wrap gap-1.5 mb-3">
                      {getStatusBadge(project.status)}
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                        {project.technique === 'tricot' ? 'Tricot' : 'Crochet'}
                      </span>
                      {project.type && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          {project.type}
                        </span>
                      )}
                    </div>

                    {/* Tags (v0.15.0) */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.tags.slice(0, 3).map((tag, idx) => (
                          <TagBadge key={idx} tag={tag} className="text-xs" />
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats inline */}
                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                      {project.status === 'completed' ? (
                        <span>{project.time_formatted || '0h 0min'}</span>
                      ) : (
                        <>
                          <span>
                            {project.sections_count > 0 && project.current_section_name
                              ? project.current_section_name
                              : project.counter_unit === 'cm'
                                ? `${Number(project.current_row || 0).toFixed(1)} cm`
                                : `${Math.floor(Number(project.current_row || 0))} rang${(project.current_row || 0) > 1 ? 's' : ''}`
                            }
                          </span>
                          {project.time_formatted && project.time_formatted !== '0h 0min' && (
                            <>
                              <span className="text-gray-200">·</span>
                              <span>{project.time_formatted}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* Barre de progression ou nombre de rangs */}
                    {(project.status === 'completed' || project.completion_percentage !== null) ? (
                      // Projet avec pourcentage calculable : afficher barre de progression
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-400">Progression</span>
                          {project.status === 'completed' ? (
                            <span className="text-xs font-semibold text-green-600">100%</span>
                          ) : (
                            <span className="text-xs font-semibold text-primary-600">
                              {project.completion_percentage}%
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              project.status === 'completed'
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-primary-400 to-primary-600'
                            }`}
                            style={{
                              width: project.status === 'completed'
                                ? '100%'
                                : `${project.completion_percentage}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : project.sections_count > 0 ? (
                      // Projet avec sections mais sans total complet : afficher texte simple
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            {project.counter_unit === 'cm' ? 'Progression totale (cm)' : 'Total rangs tricotés'}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.counter_unit === 'cm'
                              ? `${Number(project.current_row || 0).toFixed(1)} cm`
                              : `${Math.floor(Number(project.current_row || 0))} rang${(project.current_row || 0) > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Projet sans sections et sans total_rows : afficher nombre de rangs/cm
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            {project.counter_unit === 'cm' ? 'Progression (cm)' : 'Rangs tricotés'}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.counter_unit === 'cm'
                              ? `${Number(project.current_row || 0).toFixed(1)} cm`
                              : `${Math.floor(Number(project.current_row || 0))} rang${(project.current_row || 0) > 1 ? 's' : ''}`
                            }
                          </span>
                        </div>
                        {project.current_row === 0 && (
                          <p className="text-xs text-gray-400 mt-1 text-center">
                            {project.counter_unit === 'cm' ? 'Commencez à compter' : 'Commencez à compter vos rangs'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-center font-semibold text-sm hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-300"
                      >
                        Ouvrir
                      </Link>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2.5 border border-gray-200 text-gray-400 rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Wizard de création de projet */}
      <CreateProjectWizard
        isOpen={showCreateModal}
        onClose={handleCancelModal}
        onSubmit={handleCreateProject}
        isSubmitting={creating}
        submitLabel={creatingStep || 'Créer le projet'}
        canUseTags={canUseTags}
        popularTags={popularTags}
        smartQuota={smartQuota}
        onShowUpgradePrompt={() => setShowUpgradePrompt(true)}
        onOpenLibraryModal={() => {
          setShowPatternLibraryModal(true)
          fetchLibraryPatterns()
        }}
        onOpenUrlModal={() => setShowPatternUrlModal(true)}
        onOpenTextModal={() => setShowPatternTextModal(true)}
        patternType={patternType}
        setPatternType={setPatternType}
        patternFile={patternFile}
        setPatternFile={setPatternFile}
        patternUrl={patternUrl}
        patternText={patternText}
        selectedLibraryPattern={selectedLibraryPattern}
      />

      {/* Modal d'alerte personnalisée */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 sticky top-0 bg-white pb-3 border-b">
              {alertData.title}
            </h3>
            <div className="text-gray-600 mb-6">
              {alertData.message}
            </div>
            <div className="flex justify-end sticky bottom-0 bg-white pt-3 border-t">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation personnalisée */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {confirmData.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmData.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  if (confirmData.onConfirm) {
                    confirmData.onConfirm()
                  }
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sélection patron depuis bibliothèque */}
      {showPatternLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bibliothèque de patrons</h2>
                <p className="text-sm text-gray-500 mt-0.5">Sélectionnez un patron que vous avez déjà sauvegardé</p>
              </div>
              <button onClick={() => setShowPatternLibraryModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingLibraryPatterns ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : libraryPatterns.length === 0 ? (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 text-gray-300 mx-auto mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  <p className="text-gray-600 mb-1 font-medium">Bibliothèque vide</p>
                  <p className="text-sm text-gray-400">Ajoutez des patrons à votre bibliothèque depuis vos projets</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {libraryPatterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      onClick={() => {
                        setSelectedLibraryPattern(pattern)
                        setPatternType('library')
                        setPatternFile(null)
                        setPatternUrl('')
                        setPatternText('')
                        setShowPatternLibraryModal(false)
                      }}
                      className="border border-gray-200 rounded-xl p-4 hover:border-primary-400 hover:bg-primary-50 transition text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {pattern.file_type === 'pdf' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                          ) : pattern.file_type === 'image' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate text-sm">{pattern.name}</h3>
                          {pattern.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pattern.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {pattern.category && (
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">{pattern.category}</span>
                            )}
                            {pattern.difficulty && (
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">{pattern.difficulty}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowPatternLibraryModal(false)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout URL patron */}
      {showPatternUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Lien vers le patron</h2>
            <p className="text-sm text-gray-500 mb-5">Collez l'adresse d'une page web (Drops, blog, Ravelry...)</p>

            {/* Champ URL */}
            <input
              type="url"
              value={patternUrl}
              onChange={(e) => setPatternUrl(e.target.value)}
              placeholder="https://example.com/mon-patron"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
              autoFocus
            />
            <p className="text-xs text-gray-400 mb-5">Pour un PDF, utilisez plutôt le bouton Fichier.</p>

            {/* Séparateur */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400">Ou chercher un patron</span>
              </div>
            </div>

            {/* Recherche rapide */}
            <div className="mb-5">
              <input
                type="text"
                value={patternSearchQuery}
                onChange={(e) => setPatternSearchQuery(e.target.value)}
                placeholder="pull irlandais, bonnet simple..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const query = patternSearchQuery.trim()
                      ? encodeURIComponent(`tricot crochet patron ${patternSearchQuery}`)
                      : encodeURIComponent('tricot crochet patron')
                    window.open(`https://www.google.com/search?q=${query}`, '_blank')
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = patternSearchQuery.trim()
                      ? `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(patternSearchQuery)}`
                      : 'https://www.ravelry.com/patterns/search'
                    window.open(url, '_blank')
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                >
                  <svg className="w-4 h-4 text-primary-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-1 5v2H9v2h2v6h2v-6h2V9h-2V7h-2z"/></svg>
                  Ravelry
                </button>
              </div>
            </div>

            {/* Boutons de validation */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPatternUrlModal(false)
                  setPatternUrl('')
                  setPatternSearchQuery('')
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (patternUrl.trim()) {
                    setPatternType('url')
                    setPatternFile(null)
                    setSelectedLibraryPattern(null)
                    setPatternText('')
                    setShowPatternUrlModal(false)
                    setPatternSearchQuery('')
                  }
                }}
                disabled={!patternUrl.trim()}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout texte patron */}
      {showPatternTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Texte du patron</h2>
                <p className="text-sm text-gray-500 mt-0.5">Copiez-collez le texte de votre patron ici</p>
              </div>
              <button onClick={() => setShowPatternTextModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <textarea
                value={patternText}
                onChange={(e) => setPatternText(e.target.value)}
                rows={18}
                placeholder={"Collez ici le texte de votre patron...\n\nExemple :\nRang 1 : 6 mailles serrées dans un cercle magique\nRang 2 : 2ms dans chaque maille (12)\nRang 3 : *1ms, aug* x6 (18)\nRang 4 : *2ms, aug* x6 (24)\n..."}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-2">Vous pouvez copier-coller le texte depuis n'importe quelle source</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPatternTextModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (patternText.trim()) {
                      setPatternType('text')
                      setPatternFile(null)
                      setSelectedLibraryPattern(null)
                      setPatternUrl('')
                      setShowPatternTextModal(false)
                    }
                  }}
                  disabled={!patternText.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal upload photo de projet */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold">
                📷 Ajouter une photo
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProjectForPhoto?.name}
              </p>
            </div>

            <form onSubmit={handleUploadProjectPhoto} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choisir une photo
                </label>

                {/* Inputs cachés */}
                <input
                  ref={(el) => (window.cameraInputProjects = el)}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={(el) => (window.galleryInputProjects = el)}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="hidden"
                />

                {/* Boutons visibles */}
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-2`}>
                  {isMobile && (
                    <button
                      type="button"
                      onClick={() => window.cameraInputProjects?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                      <span className="text-xl">📷</span>
                      <span className="font-medium">Prendre une photo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.galleryInputProjects?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    <span className="text-xl">🖼️</span>
                    <span className="font-medium">Choisir une photo</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Formats acceptés : JPG, PNG, WEBP (max 10MB)
                </p>
              </div>

              {photoFile && (
                <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    ✓ Fichier sélectionné : {photoFile.name}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoUploadModal(false)
                    setPhotoFile(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={uploadingPhoto}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? 'Upload...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Prompt (v0.15.0) */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="tags"
      />
    </div>
  )
}

export default MyProjects
