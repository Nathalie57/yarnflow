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
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import ProjectFilters from '../components/ProjectFilters'
import TagInput from '../components/TagInput'
import TagBadge from '../components/TagBadge'
import UpgradePrompt from '../components/UpgradePrompt'
import Onboarding from '../components/Onboarding'

const MyProjects = () => {
  const { user } = useAuth()
  const location = useLocation()
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

  // [AI:Claude] Formulaire de création de projet
  const [formData, setFormData] = useState({
    name: '',
    technique: 'crochet', // crochet ou tricot
    type: '',
    description: ''
  })
  const [creating, setCreating] = useState(false)
  const [creatingStep, setCreatingStep] = useState('') // [AI:Claude] Étape en cours

  // [AI:Claude] Détails techniques du projet
  const [technicalForm, setTechnicalForm] = useState({
    yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
    needles: [{ type: '', size: '', length: '' }],
    gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' }
  })
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

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

  // [AI:Claude] Sections/parties du projet (face, dos, manches, etc.)
  const [sections, setSections] = useState([])
  const [showSections, setShowSections] = useState(false)

  // [AI:Claude] Modal système pour remplacer alert/confirm
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' })

  // [AI:Claude] Onboarding pour nouveaux utilisateurs
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: null })

  // [AI:Claude] Upload photo de projet
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false)
  const [selectedProjectForPhoto, setSelectedProjectForPhoto] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // [AI:Claude] Tags et filtres (v0.15.0)
  const [projectTags, setProjectTags] = useState([]) // Tags du projet en cours de création
  const [availableTags, setAvailableTags] = useState([]) // Tous les tags de l'utilisateur
  const [popularTags, setPopularTags] = useState([]) // Suggestions de tags
  const [canUseTags, setCanUseTags] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [filters, setFilters] = useState({
    status: null,
    favorite: null,
    tags: [],
    sort: 'updated_desc'
  })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

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

  // [AI:Claude] Charger les tags populaires et permissions (v0.15.0)
  useEffect(() => {
    checkUserPermissions()
    fetchPopularTags()
  }, [user])

  // [AI:Claude] Recharger les projets quand les filtres changent (v0.15.0)
  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.favorite, filters.sort, JSON.stringify(filters.tags)])

  // [AI:Claude] Vérifier si c'est la première visite pour afficher l'onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('yarnflow_onboarding_seen')

    // Afficher l'onboarding si l'utilisateur ne l'a jamais vu ET que les données sont chargées
    if (!hasSeenOnboarding && !loading && hasLoadedOnce) {
      // Petit délai pour que la page se charge complètement
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [loading, hasLoadedOnce])

  // [AI:Claude] Vérifier si on doit ouvrir le modal de création depuis l'onboarding
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('openCreateModal') === 'true') {
      // Ouvrir le modal après un court délai
      setTimeout(() => {
        setShowCreateModal(true)
      }, 300)
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/my-projects')
    }
  }, [location.search])

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

  // [AI:Claude] Vérifier les permissions utilisateur (v0.15.0)
  const checkUserPermissions = () => {
    if (user) {
      // Les plans PLUS, PRO et Early Bird ont accès aux tags
      const tier = user.subscription_type || 'free'
      const hasTags = ['plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird'].includes(tier)
      setCanUseTags(hasTags)
    }
  }

  // [AI:Claude] Normaliser le plan utilisateur pour les composants (free, plus, pro)
  const getUserPlan = () => {
    if (!user) return 'free'
    const tier = user.subscription_type || 'free'

    if (tier.startsWith('plus') || tier === 'plus_annual') return 'plus'
    if (tier.startsWith('pro') || tier === 'pro_annual') return 'pro'
    if (tier === 'early_bird') return 'pro' // Early Bird = fonctionnalités PRO

    return 'free'
  }

  // [AI:Claude] Ajouter un tag au projet en création (v0.15.0)
  const handleAddTag = (tag) => {
    if (!canUseTags) {
      setShowUpgradePrompt(true)
      return
    }

    if (!projectTags.includes(tag)) {
      setProjectTags([...projectTags, tag])
    }
  }

  // [AI:Claude] Supprimer un tag du projet en création (v0.15.0)
  const handleRemoveTag = (tag) => {
    setProjectTags(projectTags.filter(t => t !== tag))
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

  // [AI:Claude] Créer un nouveau projet avec patron optionnel
  const handleCreateProject = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreatingStep('Création du projet...')

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
        status: 'in_progress'
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

      // [AI:Claude] ÉTAPE 2 : Créer les sections si définies
      if (sections.length > 0) {
        currentStep = 'création des sections'
        setCreatingStep(`Création de ${sections.length} section(s)...`)

        for (let i = 0; i < sections.length; i++) {
          await api.post(`/projects/${newProject.id}/sections`, {
            name: sections[i].name,
            description: sections[i].description || null,
            total_rows: sections[i].total_rows || null,
            display_order: i
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

      // [AI:Claude] ÉTAPE 4 : Sauvegarder les tags (v0.15.0)
      if (projectTags.length > 0) {
        currentStep = 'sauvegarde des tags'
        setCreatingStep('Ajout des tags...')
        await saveProjectTags(newProject.id, projectTags)
      }

      // [AI:Claude] ÉTAPE 5 : Marquer comme favori (v0.15.0)
      if (isFavorite) {
        currentStep = 'marquage favori'
        setCreatingStep('Marquage comme favori...')
        await api.put(`/projects/${newProject.id}/favorite`)
      }

      // [AI:Claude] Ajouter à la liste
      setProjects([newProject, ...projects])

      // [AI:Claude] Reset et fermer
      setFormData({
        name: '',
        technique: 'crochet',
        type: '',
        description: ''
      })
      setTechnicalForm({
        yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
        needles: [{ type: '', size: '', length: '' }],
        gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' }
      })
      setShowTechnicalDetails(false)
      setPatternFile(null)
      setPatternText('')
      setPatternUrl('')
      setPatternType('')
      setSelectedLibraryPattern(null)
      setPatternSearchQuery('')
      setSections([])
      setShowSections(false)
      setProjectTags([])
      setIsFavorite(false)
      setShowCreateModal(false)

      // [AI:Claude] Rediriger vers le compteur
      showConfirm(
        '🎉 Projet créé !',
        'Votre projet a été créé avec succès. Voulez-vous ouvrir le compteur maintenant ?',
        () => {
          window.location.href = `/projects/${newProject.id}/counter`
        }
      )
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

  // [AI:Claude] Quota utilisateur (v0.14.0 - FREE/PLUS/PRO)
  const getProjectQuota = () => {
    if (!user) return { current: 0, max: 3, total: 0 }

    const max = user.subscription_type === 'free' ? 3
      : (user.subscription_type === 'plus' || user.subscription_type === 'plus_annual') ? 7
      : user.subscription_type === 'pro' ? 999
      : user.subscription_type === 'pro_annual' ? 999
      : user.subscription_type === 'early_bird' ? 999
      : 999

    // [AI:Claude] Compter uniquement les projets ACTIFS (non terminés)
    const activeProjectsCount = projects.filter(p => p.status !== 'completed').length

    return {
      current: activeProjectsCount,
      max,
      total: projects.length
    }
  }

  const quota = getProjectQuota()
  const canCreateProject = quota.current < quota.max

  // [AI:Claude] Fonction pour reset le formulaire de création
  const handleCancelModal = () => {
    setFormData({
      name: '',
      technique: 'crochet',
      type: '',
      description: ''
    })
    setTechnicalForm({
      yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
      needles: [{ type: '', size: '', length: '' }],
      gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' }
    })
    setShowTechnicalDetails(false)
    setPatternFile(null)
    setPatternUrl('')
    setPatternText('')
    setPatternType('')
    setSelectedLibraryPattern(null)
    setPatternSearchQuery('')
    setSections([])
    setShowSections(false)
    setShowCreateModal(false)
    setShowPatternUrlModal(false)
    setShowPatternTextModal(false)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header - Responsive mobile */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📸 Mes Projets</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Tous vos projets tricot & crochet avec photos et suivi de progression
            </p>
          </div>

          {canCreateProject ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition touch-manipulation bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800"
            >
              ➕ Nouveau Projet
            </button>
          ) : (
            <Link
              to="/subscription"
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold transition touch-manipulation bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 text-center flex items-center gap-2 justify-center focus:outline-none focus:ring-4 focus:ring-primary-300"
            >
              <span>✨ Débloquer plus de projets</span>
            </Link>
          )}
        </div>

        {/* Stats inline compacte */}
        {!loadingStats && dashboardStats && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
              {/* Projets */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">📋</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-600">
                      {quota.max === 999 ? quota.total : quota.current}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {quota.max === 999 ? '∞' : quota.max} projet{quota.max > 1 ? 's' : ''} {quota.max < 999 ? 'actifs' : ''}
                    </span>
                  </div>
                  {quota.max < 999 && quota.total > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {quota.total} projet{quota.total > 1 ? 's' : ''} au total
                    </p>
                  )}
                </div>
              </div>

              {/* Séparateur vertical */}
              <div className="hidden sm:block w-px h-12 bg-gray-200"></div>

              {/* Photos IA */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">📸</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-primary-600">{credits?.total_available || 0}</span>
                    <span className="text-sm text-gray-500">crédit{(credits?.total_available || 0) > 1 ? 's' : ''} photos</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-500">
                      {credits?.monthly_credits || 0} mensuels + {credits?.purchased_credits || 0} achetés
                      {' • '}
                      <Link to="/gallery" className="underline font-medium text-primary-600 hover:text-primary-700">
                        Galerie
                      </Link>
                    </p>
                    <Link
                      to="/subscription#credits"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-bold rounded-lg hover:from-primary-700 hover:to-primary-800 transition focus:outline-none focus:ring-2 focus:ring-primary-300"
                      title="Acheter des crédits"
                    >
                      <span>+</span>
                      <span className="hidden sm:inline">Acheter</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
              className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
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

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement de vos projets...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filtres (v0.15.0) - Reste visible pendant le filtrage pour éviter les "sauts" */}
      {hasLoadedOnce && !error && (
        <div className="mb-6">
          <ProjectFilters
            onFilterChange={setFilters}
            availableTags={availableTags}
            canUseTags={canUseTags}
            onUpgradeClick={() => setShowUpgradePrompt(true)}
            userPlan={getUserPlan()}
          />
        </div>
      )}

      {/* Indicateur de chargement pendant filtrage */}
      {loading && hasLoadedOnce && (
        <div className="flex items-center justify-center py-4 text-primary-600">
          <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Filtrage en cours...</span>
        </div>
      )}

      {/* Liste des projets */}
      {!loading && !error && (
        <>
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-200">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucun projet
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez votre premier projet et immortalisez-le en photos !
              </p>
              {canCreateProject && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
                >
                  ➕ Créer un projet
                </button>
              )}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                Aucun projet ne correspond à votre recherche "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition focus:outline-none focus:ring-4 focus:ring-gray-400"
              >
                ✕ Effacer la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border-2 border-gray-200 hover:shadow-lg transition overflow-hidden"
                >
                  {/* Photo principale */}
                  {project.main_photo ? (
                    <div className="h-48 bg-gray-200 relative group">
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${project.main_photo}`}
                        alt={`Photo du projet ${project.name}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => openPhotoUploadModal(project)}
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <span className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium">
                          📷 Changer la photo
                        </span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openPhotoUploadModal(project)}
                      className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-300 transition-all flex flex-col items-center justify-center gap-3"
                    >
                      <span className="text-5xl">{project.technique === 'tricot' ? '🧶' : '🪡'}</span>
                      <span className="px-4 py-2 bg-white text-primary-700 rounded-lg font-medium shadow-md hover:shadow-lg transition">
                        📷 Ajouter une photo
                      </span>
                    </button>
                  )}

                  {/* Contenu */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">
                        {project.name}
                      </h3>

                      <button
                        onClick={() => handleToggleFavorite(project.id, project.is_favorite)}
                        className="text-2xl transition hover:scale-110"
                      >
                        {project.is_favorite ? '⭐' : '☆'}
                      </button>
                    </div>

                    {/* Statut + Type + Technique */}
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      {getStatusBadge(project.status)}
                      {project.type && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                          {project.type}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold">
                        {project.technique === 'tricot' ? 'Tricot' : 'Crochet'}
                      </span>
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

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Stats */}
                    {project.status === 'completed' ? (
                      // Projet terminé : afficher seulement le temps
                      <div className="mb-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-600">Temps total</p>
                          <p className="font-bold text-gray-900">
                            {project.time_formatted || '0h 0min'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      // Projet en cours : afficher rang/section + temps
                      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                          {/* Afficher section si présente, sinon rang global */}
                          {project.sections_count > 0 && project.current_section_name ? (
                            <>
                              <p className="text-gray-600">Section en cours</p>
                              <p className="font-bold text-gray-900 text-xs">
                                {project.current_section_name}
                              </p>
                              <p className="text-gray-700 text-xs mt-0.5">
                                {project.current_section_row || 0}
                                {project.current_section_total_rows ? ` / ${project.current_section_total_rows}` : ''}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-600">Rang actuel</p>
                              <p className="font-bold text-gray-900">
                                {project.current_row || 0}
                                {project.total_rows ? ` / ${project.total_rows}` : ''}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-600">Temps</p>
                          <p className="font-bold text-gray-900">
                            {project.time_formatted || '0h 0min'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Barre de progression ou nombre de rangs */}
                    {project.sections_count > 0 ? (
                      // Projet avec sections : afficher le total de rangs tricotés
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total rangs tricotés</span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.current_row || 0} rang{(project.current_row || 0) > 1 ? 's' : ''}
                            {project.total_rows ? ` / ${project.total_rows}` : ''}
                          </span>
                        </div>
                      </div>
                    ) : (project.status === 'completed' || project.completion_percentage !== null) ? (
                      // Projet sans sections avec total_rows : afficher barre de progression
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Progression</span>
                          {project.status === 'completed' ? (
                            <span className="text-xs font-bold text-green-600">
                              100%
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-primary-600">
                              {project.completion_percentage}%
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              project.status === 'completed' ? 'bg-green-600' : 'bg-primary-600'
                            }`}
                            style={{
                              width: project.status === 'completed'
                                ? '100%'
                                : `${project.completion_percentage}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      // Projet sans sections et sans total_rows : afficher nombre de rangs
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Rangs tricotés</span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.current_row || 0} rang{(project.current_row || 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                        {project.current_row === 0 && (
                          <p className="text-xs text-gray-400 mt-1 text-center">
                            Commencez à compter vos rangs
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-center font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-2 focus:ring-primary-300"
                      >
                        📖 Voir le projet
                      </Link>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition focus:outline-none focus:ring-2 focus:ring-red-300"
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

      {/* Modal de création de projet */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content-mobile">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900">🧶 Nouveau projet</h2>
              <p className="text-sm text-gray-600 mt-1">
                Créez un projet pour suivre vos rangs et votre progression
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="p-6">
              {/* Nom du projet (obligatoire) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Bonnet slouchy rouge"
                />
              </div>

              {/* Technique (Tricot ou Crochet) - [AI:Claude] YarnFlow v0.9.0 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technique <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="crochet">🪡 Crochet</option>
                  <option value="tricot">🧶 Tricot</option>
                </select>
              </div>

              {/* Catégorie de projet */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie de projet <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">-- Sélectionner une catégorie --</option>
                  <option value="Vêtements">🧥 Vêtements</option>
                  <option value="Accessoires">👜 Accessoires</option>
                  <option value="Maison/Déco">🏠 Maison/Déco</option>
                  <option value="Jouets/Peluches">🧸 Jouets/Peluches</option>
                  <option value="Accessoires bébé">👶 Accessoires bébé</option>
                </select>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ex: Bonnet décontracté pour l'hiver"
                />
              </div>

              {/* Détails techniques (optionnel) */}
              <div className="mb-6 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      🔧 Détails techniques (optionnel)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Laine, aiguilles/crochets, échantillon
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="px-3 py-1.5 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
                  >
                    {showTechnicalDetails ? '✕ Masquer' : '➕ Ajouter détails'}
                  </button>
                </div>

                {showTechnicalDetails && (
                  <div className="space-y-4">
                    {/* LAINE / YARN */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          🧶 {formData.technique === 'tricot' ? 'Laine' : 'Fil'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setTechnicalForm({
                            ...technicalForm,
                            yarn: [...technicalForm.yarn, { brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }]
                          })}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          + Ajouter
                        </button>
                      </div>
                      {technicalForm.yarn.map((y, yIdx) => (
                        <div key={yIdx} className="mb-3 p-3 bg-white rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">
                              {formData.technique === 'tricot' ? 'Laine' : 'Fil'} #{yIdx + 1}
                            </span>
                            {technicalForm.yarn.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTechnicalForm({
                                  ...technicalForm,
                                  yarn: technicalForm.yarn.filter((_, i) => i !== yIdx)
                                })}
                                className="text-red-600 hover:text-red-700 text-xs"
                              >
                                ✕ Supprimer
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <input
                              type="text"
                              value={y.brand}
                              onChange={(e) => {
                                const newYarn = [...technicalForm.yarn]
                                newYarn[yIdx].brand = e.target.value
                                setTechnicalForm({ ...technicalForm, yarn: newYarn })
                              }}
                              className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                              placeholder="Marque (ex: DROPS)"
                            />
                            <input
                              type="text"
                              value={y.name}
                              onChange={(e) => {
                                const newYarn = [...technicalForm.yarn]
                                newYarn[yIdx].name = e.target.value
                                setTechnicalForm({ ...technicalForm, yarn: newYarn })
                              }}
                              className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                              placeholder="Nom (ex: ALPACA)"
                            />
                          </div>
                          <div className="space-y-2">
                            {y.quantities.map((q, qIdx) => (
                              <div key={qIdx} className="p-2 bg-gray-50 rounded border border-gray-200">
                                {/* Ligne 1: Quantité + Unité */}
                                <div className="grid grid-cols-[1fr,auto] gap-2 mb-2">
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
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                      placeholder="Ex: 3, 150-200"
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
                                        className={`px-2 py-1.5 text-[10px] font-medium transition ${
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
                                        className={`px-2 py-1.5 text-[10px] font-medium transition border-l border-gray-300 ${
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
                                <div className="flex gap-1 items-end">
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
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                      placeholder="Ex: Rouge, Bleu"
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
                                      className="text-red-500 hover:text-red-700 text-xs px-1 py-1.5"
                                      title="Supprimer ce coloris"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newYarn = [...technicalForm.yarn]
                                newYarn[yIdx].quantities.push({ amount: '', unit: 'pelotes', color: '' })
                                setTechnicalForm({ ...technicalForm, yarn: newYarn })
                              }}
                              className="text-purple-600 hover:text-purple-700 text-xs"
                            >
                              + Ajouter coloris
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AIGUILLES / CROCHETS */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {formData.technique === 'tricot' ? '🪡 Aiguilles' : '🪝 Crochets'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setTechnicalForm({
                            ...technicalForm,
                            needles: [...technicalForm.needles, { type: '', size: '', length: '' }]
                          })}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          + Ajouter
                        </button>
                      </div>
                      {technicalForm.needles.map((n, nIdx) => (
                        <div key={nIdx} className="mb-2 p-3 bg-white rounded-lg shadow-sm">
                          {(technicalForm.needles.length > 1 || formData.technique === 'tricot') && (
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700">
                                {formData.technique === 'tricot' ? `Aiguille #${nIdx + 1}` : `Crochet #${nIdx + 1}`}
                              </span>
                              {technicalForm.needles.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setTechnicalForm({
                                    ...technicalForm,
                                    needles: technicalForm.needles.filter((_, i) => i !== nIdx)
                                  })}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  ✕ Supprimer
                                </button>
                              )}
                            </div>
                          )}
                          <div className={`grid gap-2 ${formData.technique === 'tricot' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                            {formData.technique === 'tricot' && (
                              <input
                                type="text"
                                value={n.type}
                                onChange={(e) => {
                                  const newNeedles = [...technicalForm.needles]
                                  newNeedles[nIdx].type = e.target.value
                                  setTechnicalForm({ ...technicalForm, needles: newNeedles })
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                placeholder="Type (Circulaires)"
                              />
                            )}
                            <input
                              type="text"
                              value={n.size}
                              onChange={(e) => {
                                const newNeedles = [...technicalForm.needles]
                                newNeedles[nIdx].size = e.target.value
                                setTechnicalForm({ ...technicalForm, needles: newNeedles })
                              }}
                              className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                              placeholder="Taille mm (ex: 4, 5)"
                            />
                            {formData.technique === 'tricot' && (
                              <input
                                type="text"
                                value={n.length}
                                onChange={(e) => {
                                  const newNeedles = [...technicalForm.needles]
                                  newNeedles[nIdx].length = e.target.value
                                  setTechnicalForm({ ...technicalForm, needles: newNeedles })
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                placeholder="Longueur (40cm)"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ÉCHANTILLON */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">📏 Échantillon</h4>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input
                          type="text"
                          value={technicalForm.gauge.stitches}
                          onChange={(e) => setTechnicalForm({
                            ...technicalForm,
                            gauge: { ...technicalForm.gauge, stitches: e.target.value }
                          })}
                          className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                          placeholder="Largeur (17 mailles)"
                        />
                        <input
                          type="text"
                          value={technicalForm.gauge.rows}
                          onChange={(e) => setTechnicalForm({
                            ...technicalForm,
                            gauge: { ...technicalForm.gauge, rows: e.target.value }
                          })}
                          className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                          placeholder="Hauteur (22 rangs)"
                        />
                        <input
                          type="text"
                          value={technicalForm.gauge.dimensions}
                          onChange={(e) => setTechnicalForm({
                            ...technicalForm,
                            gauge: { ...technicalForm.gauge, dimensions: e.target.value }
                          })}
                          className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                          placeholder="10 x 10 cm"
                        />
                      </div>
                      <textarea
                        value={technicalForm.gauge.notes}
                        onChange={(e) => setTechnicalForm({
                          ...technicalForm,
                          gauge: { ...technicalForm.gauge, notes: e.target.value }
                        })}
                        rows={2}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="Notes sur l'échantillon..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tags et Favoris (v0.15.0) */}
              <div className="mb-6 border-t pt-4 space-y-4">
                {/* Favori (tous plans) */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition">
                    ⭐ Marquer comme favori
                  </span>
                </label>

                {/* Tags (PLUS/PRO uniquement) */}
                {canUseTags ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏷️ Tags
                    </label>
                    <TagInput
                      tags={projectTags}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      suggestions={popularTags.map(t => t.tag_name)}
                      placeholder="Ex: cadeau, bébé, urgent..."
                    />
                  </div>
                ) : (
                  <div className="bg-sage/10 rounded-lg p-4 border border-sage/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏷️</span>
                      <span className="font-medium text-gray-800">Tags - Disponible en PLUS</span>
                      <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Premium
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Organisez vos projets avec des étiquettes personnalisées pour les retrouver facilement
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowUpgradePrompt(true)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      En savoir plus →
                    </button>
                  </div>
                )}
              </div>

              {/* Sections/Parties du projet (optionnel) */}
              <div className="mb-6 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sections du projet (optionnel)
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Pour les projets complexes : face, dos, manches, etc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSections(!showSections)}
                    className="px-3 py-1.5 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
                  >
                    {showSections ? '✕ Masquer' : '➕ Ajouter sections'}
                  </button>
                </div>

                {showSections && (
                  <div className="space-y-3">
                    {/* Boutons exemples rapides */}
                    {sections.length === 0 && (
                      <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-primary-800 font-bold mb-2">Exemples rapides :</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSections([
                              { name: 'Face', description: '', total_rows: null },
                              { name: 'Dos', description: '', total_rows: null },
                              { name: 'Manche gauche', description: '', total_rows: null },
                              { name: 'Manche droite', description: '', total_rows: null }
                            ])}
                            className="px-3 py-1 text-xs bg-white border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition focus:outline-none focus:ring-2 focus:ring-primary-300 font-bold"
                          >
                            🧥 Pull/Gilet
                          </button>
                          <button
                            type="button"
                            onClick={() => setSections([
                              { name: 'Corps', description: '', total_rows: null },
                              { name: 'Tête', description: '', total_rows: null },
                              { name: 'Bras (x2)', description: '', total_rows: null },
                              { name: 'Jambes (x2)', description: '', total_rows: null }
                            ])}
                            className="px-3 py-1 text-xs bg-white border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition focus:outline-none focus:ring-2 focus:ring-primary-300 font-bold"
                          >
                            🧸 Amigurumi
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Liste des sections */}
                    {sections.map((section, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Nom (ex: Face)"
                              value={section.name}
                              onChange={(e) => {
                                const newSections = [...sections]
                                newSections[index].name = e.target.value
                                setSections(newSections)
                              }}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                            <input
                              type="text"
                              placeholder="Description (optionnel)"
                              value={section.description}
                              onChange={(e) => {
                                const newSections = [...sections]
                                newSections[index].description = e.target.value
                                setSections(newSections)
                              }}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                            <input
                              type="number"
                              placeholder="Nb rangs (optionnel)"
                              value={section.total_rows || ''}
                              onChange={(e) => {
                                const newSections = [...sections]
                                newSections[index].total_rows = e.target.value ? parseInt(e.target.value) : null
                                setSections(newSections)
                              }}
                              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSections = sections.filter((_, i) => i !== index)
                              setSections(newSections)
                            }}
                            className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded transition"
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Bouton ajouter section */}
                    <button
                      type="button"
                      onClick={() => setSections([...sections, { name: '', description: '', total_rows: null }])}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition text-sm"
                    >
                      ➕ Ajouter une section
                    </button>
                  </div>
                )}
              </div>

              {/* Import de patron (optionnel) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Patron (optionnel)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Option 1: Bibliothèque */}
                  <div className="relative h-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowPatternLibraryModal(true)
                        fetchLibraryPatterns()
                      }}
                      className={`w-full h-full min-h-[140px] border-2 border-dashed border-primary-300 rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 transition flex flex-col justify-center ${patternType === 'library' ? 'ring-2 ring-primary-600 bg-primary-50' : 'border-gray-300'}`}
                    >
                      <div className="text-3xl mb-2 text-center">📚</div>
                      <p className="text-sm font-medium text-center mb-1">
                        Depuis ma bibliothèque
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        {selectedLibraryPattern ? `✓ ${selectedLibraryPattern.name}` : 'Patrons sauvegardés'}
                      </p>
                    </button>
                    {selectedLibraryPattern && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLibraryPattern(null)
                          setPatternType('')
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center text-sm font-bold"
                        title="Annuler la sélection"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Option 2: Upload fichier */}
                  <div className={`relative h-full ${patternType === 'file' ? 'ring-2 ring-primary-600 rounded-lg' : ''}`}>
                    <label className="cursor-pointer block h-full">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition h-full min-h-[140px] flex flex-col justify-center">
                        <div className="text-3xl mb-2 text-center">📎</div>
                        <p className="text-sm font-medium text-center mb-1">
                          Importer un fichier
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          {patternFile ? `✓ ${patternFile.name}` : 'PDF, JPG, PNG, WEBP'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            setPatternFile(file)
                            setPatternType('file')
                            setPatternUrl('')
                            setPatternText('')
                            setSelectedLibraryPattern(null)
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    {patternFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPatternFile(null)
                          setPatternType('')
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center text-sm font-bold"
                        title="Supprimer le fichier"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Option 3: URL */}
                  <div className="relative h-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowPatternUrlModal(true)
                      }}
                      className={`w-full h-full min-h-[140px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition flex flex-col justify-center ${patternType === 'url' ? 'ring-2 ring-primary-600 bg-primary-50' : ''}`}
                    >
                      <div className="text-3xl mb-2 text-center">🔗</div>
                      <p className="text-sm font-medium text-center mb-1">
                        Lien web
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        {patternUrl ? `✓ ${patternUrl.substring(0, 30)}...` : 'YouTube, Pinterest, blog...'}
                      </p>
                    </button>
                    {patternUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPatternUrl('')
                          setPatternType('')
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center text-sm font-bold"
                        title="Effacer l'URL"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Option 4: Texte */}
                  <div className="relative h-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowPatternTextModal(true)
                      }}
                      className={`w-full h-full min-h-[140px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition flex flex-col justify-center ${patternType === 'text' ? 'ring-2 ring-primary-600 bg-primary-50' : ''}`}
                    >
                      <div className="text-3xl mb-2 text-center">📝</div>
                      <p className="text-sm font-medium text-center mb-1">
                        Texte
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        {patternText ? `✓ ${patternText.substring(0, 30)}...` : 'Copier-coller le patron'}
                      </p>
                    </button>
                    {patternText && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPatternText('')
                          setPatternType('')
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition flex items-center justify-center text-sm font-bold"
                        title="Effacer le texte"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 modal-actions-mobile">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-primary-300"
                >
                  {creating ? (creatingStep || 'Création...') : '✨ Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'alerte personnalisée */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {alertData.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {alertData.message}
            </p>
            <div className="flex justify-end">
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
                💡 <strong>Workflow rapide :</strong>
              </p>
              <ol className="text-xs text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                <li>Cherchez votre patron avec les boutons Google ou Ravelry ci-dessous</li>
                <li>Copiez l'URL du patron trouvé</li>
                <li>Revenez ici et collez dans le champ (appui long ou Ctrl+V)</li>
              </ol>
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
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="hidden"
                />
                <input
                  ref={(el) => (window.galleryInputProjects = el)}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
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

      {/* Onboarding pour nouveaux utilisateurs */}
      <Onboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCreateProject={() => setShowCreateModal(true)}
      />
    </div>
  )
}

export default MyProjects
