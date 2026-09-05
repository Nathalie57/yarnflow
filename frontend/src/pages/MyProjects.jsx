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
import { useTranslation, Trans } from 'react-i18next'
import { useAlert } from '../hooks/useAlert'
import { useAuth } from '../contexts/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import api, { authAPI } from '../services/api'
import ProjectFilters from '../components/ProjectFilters'
import InfoBubble from '../components/InfoBubble'
import TagBadge from '../components/TagBadge'
import UpgradePrompt from '../components/UpgradePrompt'
import CreateProjectWizard from '../components/CreateProjectWizard'
import PushNotificationModal, { PUSH_MODAL_STORAGE_KEY } from '../components/PushNotificationModal'

import { apiErrorMessage } from '../utils/apiError'
const MyProjects = () => {
  const { t } = useTranslation('projects')
  const { user, updateUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { trackProjectCreated, trackTutorialStep } = useAnalytics()

  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [pendingPlan, setPendingPlan] = useState(null)
  const [showPushModal, setShowPushModal] = useState(false)
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null)

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

  // [AI:Claude] Onboarding premier accès — déclenché par ?welcome=1 depuis Register.
  // Pas de modale ici : l'écran "0 projet" plus bas (Bienvenue + Création Intelligente
  // + Créer manuellement + Explorer avec un exemple) s'affiche déjà naturellement pour
  // un nouveau compte. Une modale dupliquait ce même écran mais SANS l'option démo,
  // ce qui la cachait aux nouveaux utilisateurs tant qu'ils ne la fermaient pas.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('welcome') === '1') {
      navigate('/my-projects', { replace: true })
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
  // [AI:Claude] Quand on ouvre la modale depuis un bouton qui a déjà précisé
  // l'intention ("Créer un projet manuellement"), on saute l'écran de choix
  // interne du wizard (Création Intelligente vs manuel) — l'utilisateur vient
  // justement de faire ce choix, le lui reposer était source de confusion.
  const [createModalInitialMode, setCreateModalInitialMode] = useState(null)

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

  // [AI:Claude] Alertes/confirmations : hook partagé avec ProjectCounter (voir hooks/useAlert)
  const { showAlert, showConfirm, AlertModals } = useAlert()

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

      // [AI:Claude] Sert a n'afficher la demande de notifications qu'apres le premier
      // PROJET REEL. Pose ici et pas a la creation : couvre aussi les comptes existants.
      //
      // Le projet de demo compte pour rien : sans ce filtre, le creer suffisait a
      // armer le bandeau de notifications, qui pouvait alors s'empiler sur la
      // checklist du tutoriel — exactement ce qu'on voulait eviter en le
      // repoussant apres un premier projet (retour Gemini, 2026-08-05).
      const aUnProjetReel = (response.data.projects || [])
        .some(p => !localStorage.getItem('yf_demo_project_' + p.id))
      if (aUnProjetReel) localStorage.setItem('yf_has_projects', '1')

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
      setError(t('myProjects.loadError'))
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


  // [AI:Claude] Supprimer un projet
  const handleDeleteProject = async (projectId) => {
    showConfirm({
      title: t('confirmDelete.title'),
      message: t('confirmDelete.message'),
      onConfirm: async () => {
        try {
          await api.delete(`/projects/${projectId}`)
          setProjects(projects.filter(p => p.id !== projectId))
          showAlert({ title: t('success.deletedTitle'), message: t('success.deleted'), type: 'success' })
        } catch (err) {
          console.error('Erreur suppression:', err)
          showAlert({ message: t('errors.deleteFailed'), type: 'error' })
        }
      }
    })
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
      showAlert({ message: t('errors.favoriteFailed'), type: 'error' })
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
      showAlert({ message: t('errors.selectPhoto'), type: 'error' })
      return
    }

    try {
      setUploadingPhoto(true)

      const formData = new FormData()
      formData.append('photo', photoFile)

      await api.post(`/projects/${selectedProjectForPhoto.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showAlert({ title: t('success.photoAddedTitle'), message: t('success.photoAdded'), type: 'success' })
      setShowPhotoUploadModal(false)
      setPhotoFile(null)
      fetchProjects() // Recharger les projets
    } catch (err) {
      console.error('Erreur upload photo:', err)
      showAlert({ message: err.response?.data?.message || t('errors.photoUploadFailed'), type: 'error' })
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
      showAlert({ message: t('errors.libraryLoadFailed'), type: 'error' })
    } finally {
      setLoadingLibraryPatterns(false)
    }
  }

  /**
   * [AI:Claude] Projet de demonstration : le Lemon Zest Cardigan (DROPS 268-1),
   * taille M, tricote de haut en bas.
   *
   * Il a remplace un bonnet a trois sections, qui ne montrait pas grand-chose.
   * Un gilet en a neuf, dont deux manches identiques et trois bordures : c'est
   * exactement le genre de projet ou suivre ses rangs section par section a un
   * interet, donc exactement ce que la demo doit donner a voir.
   *
   * Il arrive DEJA COMMENCE — dos, devants et empiecement termines, corps a
   * mi-parcours, manches intactes. Un projet vide se ressemble d'une app a
   * l'autre ; un projet en cours montre a quoi ressemble le sien dans trois
   * semaines.
   *
   * La progression est posee via `current_row` sur chaque section, JAMAIS en
   * creant des lignes dans project_rows : les statistiques comptent les rangs
   * avec COUNT(*) sur cette table (Project::getUserStatsByPeriod), et des rangs
   * offerts fausseraient les compteurs, les series et les badges. Seuls les
   * rangs reellement tricotes comptent.
   *
   * Droits : DROPS autorise le partage du nom, du numero et des fournitures de
   * ses modeles, mais interdit la reproduction des explications. On se limite
   * donc aux metadonnees et au lien vers la page d'origine.
   */
  const handleCreateDemoProject = async () => {
    setIsCreatingDemo(true)
    let demoProjectId = null
    try {
      const response = await api.post('/projects', {
        is_demo: true,
        name: t('demoProject.name'),
        technique: 'tricot',
        // [AI:Claude] Valeur capitalisee : c'est celle stockee en base
        // (cf. data/projectTypes.js). L'ancienne demo ecrivait 'accessoires',
        // absent de la liste, donc le type ne s'affichait pas.
        type: 'Vêtements',
        description: t('demoProject.description'),
        status: 'in_progress',
        counter_unit: 'rows',
        counter_unit_increment: 1.0,
        technical_details: JSON.stringify({
          description: t('demoProject.description'),
          yarn: [
            { brand: 'DROPS', name: 'Baby Merino', url: '', quantities: [{ amount: '8', unit: 'pelotes', color: t('demoProject.yarnColorMerino') }] },
            { brand: 'DROPS', name: 'Kid-Silk', url: '', quantities: [{ amount: '7', unit: 'pelotes', color: t('demoProject.yarnColorSilk') }] },
          ],
          needles: [
            { type: t('demoProject.needleType'), size: '4', length: '80 cm' },
            { type: t('demoProject.needleType'), size: '2,5', length: '80 cm' },
          ],
          gauge: { stitches: '19', rows: '25', dimensions: '10 x 10 cm', notes: t('demoProject.gaugeNote') }
        })
      })
      demoProjectId = response.data.project?.id

      // [AI:Claude] Nombre de rangs en taille M, deduit du patron : soit compte
      // directement (dos, empiecement), soit calcule depuis les centimetres a
      // l'echantillon (25 rangs = 10 cm, donc 2,5 rangs/cm).
      const demoSections = [
        { key: 'sectionBack',        total_rows: 21,  current_row: 21 },
        { key: 'sectionRightFront',  total_rows: 33,  current_row: 33 },
        { key: 'sectionLeftFront',   total_rows: 33,  current_row: 33 },
        { key: 'sectionYoke',        total_rows: 38,  current_row: 38 },
        { key: 'sectionBody',        total_rows: 64,  current_row: 41, note: 'noteBody' },
        { key: 'sectionHem',         total_rows: 10,  current_row: 0 },
        { key: 'sectionRightSleeve', total_rows: 108, current_row: 0, note: 'noteSleeve' },
        { key: 'sectionLeftSleeve',  total_rows: 108, current_row: 0 },
        { key: 'sectionBands',       total_rows: 24,  current_row: 0 },
      ]
      let sectionEnCoursId = null
      const terminees = []
      for (let i = 0; i < demoSections.length; i++) {
        const s = demoSections[i]
        const res = await api.post(`/projects/${demoProjectId}/sections`, {
          name: t(`demoProject.${s.key}`),
          total_rows: s.total_rows,
          current_row: s.current_row,
          display_order: i,
          notes: s.note ? t(`demoProject.${s.note}`) : null
        })
        const id = res.data.section?.id
        if (s.key === 'sectionBody') sectionEnCoursId = id
        else if (id && s.current_row >= s.total_rows) terminees.push(id)
      }

      // [AI:Claude] `is_completed` n'est pas deduit de current_row : c'est une
      // colonne a part, et createSection ne l'accepte pas. Sans ce passage, les
      // quatre parties finies s'afficheraient comme en cours malgre leur
      // compteur au maximum.
      // Quatre UPDATE independants sur des lignes distinctes : en parallele.
      await Promise.all(terminees.map(id =>
        api.put(`/projects/${demoProjectId}/sections/${id}`, { is_completed: 1 })
      ))

      // [AI:Claude] En dernier, une fois les sections terminees marquees : sinon
      // le compteur s'ouvrirait sur la premiere section creee (createSection
      // renseigne current_section_id au premier appel), c'est-a-dire sur le dos,
      // deja fini. La personne arriverait devant un compteur a 21/21, ou le seul
      // geste qui compte — appuyer sur +1 — n'aurait aucun sens.
      if (sectionEnCoursId) {
        await api.post(`/projects/${demoProjectId}/current-section`, { section_id: sectionEnCoursId })
      }

      await api.post(`/projects/${demoProjectId}/pattern-url`, { pattern_url: 'https://www.garnstudio.com/pattern.php?id=12575&cid=8' })

      // [AI:Claude] La page compteur additionne les sections, mais la carte de
      // la liste lit projects.current_row : sans cette mise a jour, la carte
      // afficherait 0 rang alors que le projet est a mi-parcours.
      const totalRows = demoSections.reduce((n, s) => n + s.total_rows, 0)
      const doneRows = demoSections.reduce((n, s) => n + s.current_row, 0)
      await api.put(`/projects/${demoProjectId}`, {
        current_row: doneRows,
        total_rows: totalRows,
        notes: t('demoProject.projectNote'),
      })

      // [AI:Claude] Pas de colonne is_demo en base — on marque ce projet comme
      // "démo" via localStorage (même convention que l'onboarding yf_onboarded_*)
      // pour que la checklist du tutoriel réapparaisse après un rechargement,
      // même une fois le paramètre ?demo=1 nettoyé de l'URL.
      localStorage.setItem('yf_demo_project_' + demoProjectId, '1')

      // [AI:Claude] Premier jalon du parcours de decouverte. Les suivants
      // (ouverture, premier rang, changement de section, photo) sont emis
      // depuis ProjectCounter.
      trackTutorialStep('created', { project_id: demoProjectId })
    } catch (err) {
      console.error('Erreur création projet démo:', err)
    } finally {
      setIsCreatingDemo(false)
      if (demoProjectId) {
        navigate(`/projects/${demoProjectId}?new=1&demo=1`)
      }
    }
  }

  const handleCreateProject = async (wizardData) => {
    setCreating(true)
    setCreatingStep(t('creating.project'))

    const { formData, sections, technicalForm, isFavorite, projectTags } = wizardData
    let currentStep = ''
    let newProject = null

    try {
      // [AI:Claude] ÉTAPE 1 : Création du projet
      currentStep = 'project'

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

      // [AI:Claude] Pas de log analytics_events ici — ProjectController::create() le fait
      // déjà côté serveur (project_created, source=manual/demo). Ce doublon frontend
      // comptait chaque création manuelle deux fois en base.
      trackProjectCreated('manual', newProject.technique)

      // [AI:Claude] ÉTAPE 2 : Créer les sections si définies
      if (sections.length > 0) {
        currentStep = 'sections'
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
        currentStep = 'patternFile'
        setCreatingStep(t('creating.uploadPattern'))

        const formDataPattern = new FormData()
        formDataPattern.append('pattern', patternFile)
        formDataPattern.append('pattern_type', patternFile.type.startsWith('image/') ? 'image' : 'pdf')

        await api.post(`/projects/${newProject.id}/pattern`, formDataPattern, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else if (patternType === 'url' && patternUrl.trim()) {
        currentStep = 'patternLink'
        setCreatingStep(t('creating.savingPatternUrl'))

        await api.post(`/projects/${newProject.id}/pattern-url`, {
          pattern_url: patternUrl
        })
      } else if (patternType === 'text' && patternText.trim()) {
        currentStep = 'patternText'
        setCreatingStep(t('creating.savingPatternText'))

        await api.post(`/projects/${newProject.id}/pattern-text`, {
          pattern_text: patternText
        })
      } else if (patternType === 'library' && selectedLibraryPattern) {
        currentStep = 'patternLibrary'
        setCreatingStep(t('creating.linkingPattern'))

        await api.post(`/projects/${newProject.id}/pattern-from-library`, {
          pattern_library_id: selectedLibraryPattern.id
        })
      }

      // [AI:Claude] ÉTAPE 4 : Sauvegarder les tags
      if (projectTags.length > 0) {
        currentStep = 'tags'
        setCreatingStep(t('creating.addingTags'))
        await saveProjectTags(newProject.id, projectTags)
      }

      // [AI:Claude] ÉTAPE 5 : Marquer comme favori
      if (isFavorite) {
        currentStep = 'favorite'
        setCreatingStep(t('creating.markingFavorite'))
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

      const redirectUrl = `/projects/${newProject.id}?new=1`

      // Proposer les notifications push après le premier projet, si pas encore demandé
      const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      const pushAlreadyPrompted = localStorage.getItem(PUSH_MODAL_STORAGE_KEY)
      const pushPermission = 'Notification' in window ? Notification.permission : 'denied'

      if (projects.length === 0 && pushSupported && !pushAlreadyPrompted && pushPermission === 'default') {
        setPendingRedirectUrl(redirectUrl)
        setShowPushModal(true)
      } else {
        window.location.href = redirectUrl
      }
    } catch (err) {
      // [AI:Claude] Message d'erreur détaillé basé sur l'étape qui a échoué
      let errorMessage = ''
      const apiError = apiErrorMessage(err)

      if (currentStep === 'project') {
        errorMessage = apiError || t('errors.createFailed')
      } else if (currentStep === 'sections') {
        errorMessage = t('errors.createdButStepFailed', { step: t(`errors.steps.${currentStep}`), detail: apiError || t('errors.addSectionsManually') })
      } else if (currentStep.startsWith('pattern')) {
        errorMessage = t('errors.createdButStepFailedAlt', { step: t(`errors.steps.${currentStep}`), detail: apiError || t('errors.addPatternManually') })
      } else {
        errorMessage = apiError || t('errors.createGeneric')
      }

      showAlert({ message: errorMessage, type: 'error' })

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
      in_progress: { label: t('status.in_progress'), color: 'bg-primary-100 text-primary-800' },
      completed: { label: t('status.completed'), color: 'bg-green-100 text-green-800' },
      paused: { label: t('status.paused'), color: 'bg-red-100 text-red-800' },
      abandoned: { label: t('status.abandoned'), color: 'bg-gray-100 text-gray-800' }
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
    setCreateModalInitialMode(null)
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
            <p className="font-semibold text-green-800">{t('myProjects.paymentSuccessTitle')}</p>
            <p className="text-sm text-green-700 mt-0.5">{t('myProjects.paymentSuccessDesc', { plan: pendingPlan === 'plus' ? 'PLUS' : 'PRO' })}</p>
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('myProjects.title')}</h1>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors touch-manipulation bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('myProjects.newProject')}
              </button>
            </div>

            {/* Stats inline */}
            {!loadingStats && dashboardStats && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {/* Projets */}
                <span>{t('ui.projectCount', { count: projects.length })}</span>

                <span className="text-gray-300">·</span>

                {/* Crédits photos */}
                <span>
                  {t('ui.photoCredits', { count: credits?.total_available || 0 })}
                </span>
                <Link to="/subscription#credits" className="text-primary-600 hover:underline text-xs">
                  {t('ui.buyCreditsShort')}
                </Link>

              </div>
            )}
          </>
        ) : (
          /* Header minimaliste pour empty state */
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('myProjects.titleAlt')}</h1>
          </div>
        )}
      </div>


      {/* Barre de recherche */}
      {!loading && projects.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder={t('myProjects.searchPlaceholder')}
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
            {t('myProjects.filterSort')}
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
                  {user?.first_name ? t('myProjects.welcomeNamed', { name: user.first_name }) : t('myProjects.welcome')}
                </h2>
                <p className="text-gray-500 text-sm">{t('myProjects.whereToStart')}</p>
              </div>

              {/* Importer un patron (Smart Creation) — CTA principal : point d'entrée du copilote */}
              <button
                onClick={() => navigate('/smart-project-creator')}
                className="w-full mb-3 p-5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-left transition shadow-md hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-base mb-1">{t('myProjects.startSmart')}</p>
                    <p className="text-primary-100 text-sm leading-relaxed">{t('myProjects.startSmartDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Créer manuellement — plus qu'un lien discret, pour ne pas concurrencer
                  l'import qui est la vraie promesse de l'écran */}
              <p className="text-center text-sm text-gray-500 mb-2">
                {t('myProjects.createManuallyPrefix')}{' '}
                <button
                  onClick={() => { if (canCreateProject) { setCreateModalInitialMode('manual'); setShowCreateModal(true) } }}
                  className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2"
                >
                  {t('myProjects.createManually')}
                </button>
              </p>

              {/* Démo — lien discret, friction zéro, ne concurrence plus les vrais CTA */}
              <p className="text-center text-sm text-gray-500">
                {t('myProjects.exploreDemoLinkPrefix')}{' '}
                <button
                  onClick={handleCreateDemoProject}
                  disabled={isCreatingDemo}
                  className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2 disabled:opacity-60"
                >
                  {isCreatingDemo ? t('myProjects.exploreDemoCreating') : t('myProjects.exploreDemo')}
                </button>
              </p>

            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="max-w-xl mx-auto text-center py-12 px-6 bg-white rounded-xl border-2 border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('myProjects.noResultsTitle')}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                <Trans i18nKey="myProjects.noResultsDesc" ns="projects" values={{ query: searchQuery }} components={[<strong key="0" />]} />
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  {t('myProjects.clearSearch')}
                </button>
                {canCreateProject && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
                  >
                    {t('ui.createProjectPlus')}
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
                          {t('myProjects.changePhoto')}
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
                            title={t('myProjects.addPhoto')}
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
                        title={project.is_favorite ? t('myProjects.removeFromFavorites') : t('myProjects.addToFavorites')}
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
                        {project.technique === 'tricot' ? t('myProjects.knitting') : t('myProjects.crochet')}
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
                        <span>{project.time_formatted || t('ui.zeroTimeShort')}</span>
                      ) : (
                        <>
                          <span>
                            {project.sections_count > 0 && project.current_section_name
                              ? project.current_section_name
                              : project.counter_unit === 'cm'
                                ? t('ui.cmValue', { n: Number(project.current_row || 0).toFixed(1) })
                                : t('ui.rowsValue', { count: Math.floor(Number(project.current_row || 0)) })
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
                          <span className="text-xs text-gray-500">{t('myProjects.progress')}</span>
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
                              'bg-gradient-to-r from-primary-400 to-primary-600'
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
                            {project.counter_unit === 'cm' ? t('myProjects.totalProgressCm') : t('myProjects.totalRows')}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.counter_unit === 'cm'
                              ? t('ui.cmValue', { n: Number(project.current_row || 0).toFixed(1) })
                              : t('ui.rowsValue', { count: Math.floor(Number(project.current_row || 0)) })
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Projet sans sections et sans total_rows : afficher nombre de rangs/cm
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            {project.counter_unit === 'cm' ? t('myProjects.progressCm') : t('myProjects.rowsKnitted')}
                          </span>
                          <span className="text-xs font-bold text-gray-700">
                            {project.counter_unit === 'cm'
                              ? t('ui.cmValue', { n: Number(project.current_row || 0).toFixed(1) })
                              : t('ui.rowsValue', { count: Math.floor(Number(project.current_row || 0)) })
                            }
                          </span>
                        </div>
                        {project.current_row === 0 && (
                          <p className="text-xs text-gray-400 mt-1 text-center">
                            {project.counter_unit === 'cm' ? t('myProjects.startCountingCm') : t('myProjects.startCounting')}
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
                        {t('myProjects.open')}
                      </Link>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2.5 border border-gray-200 text-gray-400 rounded-xl hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                        title={t('myProjects.delete')}
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
        initialMode={createModalInitialMode}
        onClose={handleCancelModal}
        onSubmit={handleCreateProject}
        isSubmitting={creating}
        submitLabel={creatingStep || t('myProjects.createProject')}
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

      {/* Modales d'alerte et de confirmation (hook partagé) */}
      <AlertModals />

      {/* Modal sélection patron depuis bibliothèque */}
      {showPatternLibraryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('patternLibraryModal.title')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{t('patternLibraryModal.subtitle')}</p>
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
                  <p className="text-gray-600 mb-1 font-medium">{t('patternLibraryModal.emptyTitle')}</p>
                  <p className="text-sm text-gray-500">{t('patternLibraryModal.emptyDesc')}</p>
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
                {t('actions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout URL patron */}
      {showPatternUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t('patternUrlModal.label')}</h2>
            <p className="text-sm text-gray-500 mb-5">{t('patternUrlModal.hint')}</p>

            {/* Champ URL */}
            <input
              type="url"
              value={patternUrl}
              onChange={(e) => setPatternUrl(e.target.value)}
              placeholder={t('patternUrlModal.placeholder')}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-5">{t('patternUrlModal.pdfHint')}</p>

            {/* Séparateur */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">{t('patternUrlModal.searchLabel')}</span>
              </div>
            </div>

            {/* Recherche rapide */}
            <div className="mb-5">
              <input
                type="text"
                value={patternSearchQuery}
                onChange={(e) => setPatternSearchQuery(e.target.value)}
                placeholder={t('patternUrlModal.searchPlaceholder')}
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
                  {t('patternUrlModal.google')}
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
                  {t('patternUrlModal.ravelry')}
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
                {t('actions.cancel')}
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
                {t('actions.save')}
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
                <h2 className="text-lg font-bold text-gray-900">{t('patternTextModal.label')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{t('patternTextModal.subtitle')}</p>
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
                placeholder={t('patternTextModal.placeholder')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">{t('patternTextModal.hint')}</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPatternTextModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                >
                  {t('actions.cancel')}
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
                  {t('actions.validate')}
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
                {t('ui.addPhotoCamera')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProjectForPhoto?.name}
              </p>
            </div>

            <form onSubmit={handleUploadProjectPhoto} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('photoModal.choosePhoto')}
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
                      <span className="font-medium">{t('photoModal.takePhoto')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.galleryInputProjects?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    <span className="text-xl">🖼️</span>
                    <span className="font-medium">{t('photoModal.choosePhoto')}</span>
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  {t('photoModal.formats')}
                </p>
              </div>

              {photoFile && (
                <div className="mb-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-700">
                    {t('photoModal.selectedFile', { name: photoFile.name })}
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
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? t('photoModal.uploading') : t('photoModal.add')}
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

      {showPushModal && (
        <PushNotificationModal
          onClose={() => {
            setShowPushModal(false)
            if (pendingRedirectUrl) {
              window.location.href = pendingRedirectUrl
            }
          }}
        />
      )}
    </div>
  )
}

export default MyProjects
