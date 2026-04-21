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
import api from '../services/api'
import ProjectFilters from '../components/ProjectFilters'
import InfoBubble from '../components/InfoBubble'
import TagBadge from '../components/TagBadge'
import UpgradePrompt from '../components/UpgradePrompt'
import CreateProjectWizard from '../components/CreateProjectWizard'

const MyProjects = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

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

  // [AI:Claude] Création de projet via wizard
  const [creating, setCreating] = useState(false)
  const [creatingStep, setCreatingStep] = useState('') // [AI:Claude] Étape en cours

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

      // [AI:Claude] Tracker l'événement project_created
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
      window.location.href = `/projects/${newProject.id}`
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
      {/* Header - Responsive mobile */}
      <div className="mb-6 sm:mb-8">
        {/* Afficher header complet uniquement si des projets existent */}
        {projects.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mes projets</h1>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors touch-manipulation bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nouveau projet
                </button>
                <Link
                  to="/smart-project-creator"
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors touch-manipulation bg-gradient-to-r from-purple-600 to-primary-600 text-white hover:from-purple-700 hover:to-primary-700 active:from-purple-800 active:to-primary-800 shadow-sm"
                >
                  ✨ Création Intelligente
                </Link>
              </div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🧶 Mes Projets</h1>
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
            <div className="max-w-xl mx-auto py-12 px-6">

              {/* Question directe */}
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Vous avez un projet en cours ?
                </h2>
                <p className="text-gray-600 text-base leading-relaxed">
                  Notez votre rang actuel en 5 secondes.<br />
                  La prochaine fois que vous reprenez, vous savez exactement où vous en êtes.
                </p>
              </div>

              {/* CTA principal */}
              {canCreateProject && (
                <div className="text-center mb-10">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-semibold hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md text-base"
                  >
                    Oui — ajouter mon projet maintenant
                  </button>
                </div>
              )}

              {/* Ce que ça fait concrètement */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                <div className="flex items-start gap-4 p-4">
                  <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Vous êtes interrompue — aucun stress</p>
                    <p className="text-gray-500 text-sm mt-0.5">Un clic pour mémoriser votre rang. Vous retrouvez exactement là où vous étiez.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4">
                  <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Plusieurs projets en parallèle</p>
                    <p className="text-gray-500 text-sm mt-0.5">Tricot du soir, cadeau en cours, projet urgent — chacun a son compteur.</p>
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
                    <div className="h-48 bg-gray-200 relative group">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${project.main_photo}`}
                        alt={`Photo du projet ${project.name}`}
                        className="w-full h-full object-cover"
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
        submitLabel={creatingStep || 'Création...'}
        canUseTags={canUseTags}
        popularTags={popularTags}
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
                  <p className="text-sm text-gray-500">
                    Ajoutez des patrons à votre bibliothèque depuis vos projets
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition text-left"
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

      {/* Modal ajout URL patron */}
      {showPatternUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              🔗 Lien vers le patron
            </h2>

            {/* Workflow rapide */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Pour un patron en ligne (page web gratuite) :</strong>
              </p>
              <ol className="text-xs text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                <li>Trouvez la page du patron (ex : site Drops, blog...)</li>
                <li>Copiez l'adresse depuis la barre de votre navigateur</li>
                <li>Collez-la dans le champ ci-dessus</li>
              </ol>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-amber-800">
                📎 <strong>Patron PDF (Ravelry, téléchargement...) ?</strong> Utilisez plutôt le bouton <strong>Fichier</strong> pour l'importer directement.
              </p>
            </div>

            {/* Champ URL */}
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
                value={patternSearchQuery}
                onChange={(e) => setPatternSearchQuery(e.target.value)}
                placeholder="Ex: pull irlandais, bonnet simple..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  🌐 Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = patternSearchQuery.trim()
                      ? `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(patternSearchQuery)}`
                      : 'https://www.ravelry.com/patterns/search'
                    window.open(url, '_blank')
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
                >
                  🧶 Ravelry
                </button>
              </div>
            </div>

            {/* Boutons de validation */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPatternUrlModal(false)
                  setPatternUrl('')
                  setPatternSearchQuery('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
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
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold">
                📝 Ajouter le texte du patron
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Copiez-collez le texte de votre patron ici
              </p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texte du patron <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={patternText}
                  onChange={(e) => setPatternText(e.target.value)}
                  rows={20}
                  placeholder="Collez ici le texte de votre patron...

Exemple :
Rang 1 : 6 mailles serrées dans un cercle magique
Rang 2 : 2ms dans chaque maille (12)
Rang 3 : *1ms, aug* x6 (18)
Rang 4 : *2ms, aug* x6 (24)
..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Vous pouvez copier-coller le texte depuis n'importe quelle source
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPatternTextModal(false)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
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
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Valider
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
