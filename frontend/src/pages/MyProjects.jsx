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
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const MyProjects = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, in_progress, completed, paused
  const [filterType, setFilterType] = useState('') // Filtre par type de projet
  const [filterTechnique, setFilterTechnique] = useState('') // Filtre par technique (tricot/crochet)
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  // [AI:Claude] Import de patron
  const [patternFile, setPatternFile] = useState(null)
  const [patternUrl, setPatternUrl] = useState('')
  const [patternType, setPatternType] = useState('') // 'file' ou 'url'

  // [AI:Claude] Sections/parties du projet (face, dos, manches, etc.)
  const [sections, setSections] = useState([])
  const [showSections, setShowSections] = useState(false)

  // [AI:Claude] Modal système pour remplacer alert/confirm
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState({ title: '', message: '', onConfirm: null })

  // [AI:Claude] Charger les projets au montage
  useEffect(() => {
    fetchProjects()
  }, [filter])

  // [AI:Claude] Charger les stats du dashboard au montage
  useEffect(() => {
    fetchDashboardStats()
    fetchCredits()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/projects', { params })

      setProjects(response.data.projects || [])
    } catch (err) {
      console.error('Erreur chargement projets:', err)
      setError('Impossible de charger vos projets')
    } finally {
      setLoading(false)
    }
  }

  // [AI:Claude] Récupérer les stats du dashboard
  const fetchDashboardStats = async () => {
    try {
      setLoadingStats(true)
      const response = await api.get('/user/dashboard')
      console.log('[DEBUG] Response complète:', response.data)
      console.log('[DEBUG] Response.data.data:', response.data.data)

      // [AI:Claude] L'API retourne { success, data: { stats, user } }
      if (response.data && response.data.data && response.data.data.stats) {
        setDashboardStats(response.data.data.stats)
      } else {
        console.warn('[DEBUG] Stats non trouvées dans la réponse')
        setDashboardStats({
          total_projects: 0,
          total_photos: 0,
          total_time: 0
        })
      }
    } catch (err) {
      console.error('[DEBUG] Erreur chargement stats:', err)
      console.error('[DEBUG] Erreur détails:', err.response?.data)
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
      console.log('[DEBUG] Crédits reçus:', response.data)
      setCredits(response.data.credits)
    } catch (err) {
      console.error('[DEBUG] Erreur chargement crédits:', err)
      console.error('[DEBUG] Détails erreur:', err.response?.data)
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
      await api.put(`/projects/${projectId}`, {
        is_favorite: !currentValue
      })

      setProjects(projects.map(p =>
        p.id === projectId ? { ...p, is_favorite: !currentValue } : p
      ))
    } catch (err) {
      console.error('Erreur favori:', err)
    }
  }

  // [AI:Claude] Créer un nouveau projet avec patron optionnel
  const handleCreateProject = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const projectData = {
        name: formData.name,
        technique: formData.technique,
        type: formData.type || null,
        description: formData.description || null,
        status: 'in_progress'
      }

      const response = await api.post('/projects', projectData)
      const newProject = response.data.project

      // [AI:Claude] Créer les sections si définies
      if (sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          await api.post(`/projects/${newProject.id}/sections`, {
            name: sections[i].name,
            description: sections[i].description || null,
            total_rows: sections[i].total_rows || null,
            display_order: i
          })
        }
      }

      // [AI:Claude] Upload du patron si fourni
      if (patternType === 'file' && patternFile) {
        const formDataPattern = new FormData()
        formDataPattern.append('pattern', patternFile)
        formDataPattern.append('pattern_type', patternFile.type.startsWith('image/') ? 'image' : 'pdf')

        await api.post(`/projects/${newProject.id}/pattern`, formDataPattern, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else if (patternType === 'url' && patternUrl.trim()) {
        await api.post(`/projects/${newProject.id}/pattern-url`, {
          pattern_url: patternUrl
        })
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
      setPatternFile(null)
      setPatternUrl('')
      setPatternType('')
      setSections([])
      setShowSections(false)
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
      console.error('Erreur création projet:', err)
      showAlert('❌ Erreur', err.response?.data?.error || 'Erreur lors de la création du projet', 'error')
    } finally {
      setCreating(false)
    }
  }

  // [AI:Claude] Filtres de statut
  const filterButtons = [
    { key: 'all', label: 'Tous', icon: '📋' },
    { key: 'in_progress', label: 'En cours', icon: '🚧' },
    { key: 'completed', label: 'Terminés', icon: '✅' },
    { key: 'paused', label: 'En pause', icon: '⏸️' }
  ]

  // [AI:Claude] Badge de statut
  const getStatusBadge = (status) => {
    const badges = {
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      paused: { label: 'En pause', color: 'bg-yellow-100 text-yellow-800' },
      abandoned: { label: 'Abandonné', color: 'bg-gray-100 text-gray-800' }
    }

    const badge = badges[status] || badges.in_progress

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  // [AI:Claude] Quota utilisateur
  const getProjectQuota = () => {
    if (!user) return { current: 0, max: 2 }

    const max = user.subscription_type === 'free' ? 2
      : user.subscription_type === 'starter' ? 10
      : 999

    return { current: projects.length, max }
  }

  const quota = getProjectQuota()
  const canCreateProject = quota.current < quota.max

  // [AI:Claude] Helper pour obtenir les types uniques
  const getUniqueTypes = () => {
    const types = projects.map(p => p.type).filter(Boolean)
    return [...new Set(types)].sort()
  }

  // [AI:Claude] Helper pour obtenir les techniques uniques
  const getUniqueTechniques = () => {
    const techniques = projects.map(p => p.technique).filter(Boolean)
    return [...new Set(techniques)]
  }

  // [AI:Claude] Filtrer les projets selon tous les filtres actifs
  const getFilteredProjects = () => {
    return projects.filter(project => {
      // Filtre par type
      if (filterType && project.type !== filterType)
        return false

      // Filtre par technique
      if (filterTechnique && project.technique !== filterTechnique)
        return false

      return true
    })
  }

  const filteredProjects = getFilteredProjects()
  const hasActiveFilters = filterType || filterTechnique

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
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition touch-manipulation bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-center flex items-center gap-2 justify-center"
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
                    <span className="text-2xl font-bold text-primary-600">{quota.current}</span>
                    <span className="text-sm text-gray-500">/ {quota.max === 999 ? '∞' : quota.max} projet{quota.max > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Séparateur vertical */}
              <div className="hidden sm:block w-px h-12 bg-gray-200"></div>

              {/* Photos IA */}
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl">📸</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-purple-600">{credits?.total_available || 0}</span>
                    <span className="text-sm text-gray-500">crédit{(credits?.total_available || 0) > 1 ? 's' : ''} IA</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-500">
                      {credits?.monthly_credits || 0} mensuels + {credits?.purchased_credits || 0} achetés
                      {' • '}
                      <Link to="/gallery" className="underline font-medium text-purple-600 hover:text-purple-700">
                        Galerie
                      </Link>
                    </p>
                    <Link
                      to="/subscription"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium rounded hover:from-purple-700 hover:to-pink-700 transition"
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

      {/* Filtres - Responsive mobile */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filterButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition touch-manipulation ${
              filter === btn.key
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <span className="hidden sm:inline">{btn.icon} {btn.label}</span>
            <span className="sm:hidden">{btn.icon}</span>
          </button>
        ))}
      </div>

      {/* Filtres avancés - Type et Technique */}
      {!loading && projects.length > 0 && (getUniqueTypes().length > 0 || getUniqueTechniques().length > 0) && (
        <div className="mb-6 space-y-4">
          {/* Filtre par type de projet */}
          {getUniqueTypes().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de projet
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    !filterType
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {getUniqueTypes().map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      filterType === type
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtre par technique */}
          {getUniqueTechniques().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technique
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterTechnique('')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    !filterTechnique
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                {getUniqueTechniques().map(technique => (
                  <button
                    key={technique}
                    onClick={() => setFilterTechnique(technique)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      filterTechnique === technique
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {technique === 'tricot' ? '🧶 Tricot' : '🪡 Crochet'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton reset si filtres actifs */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setFilterType('')
                  setFilterTechnique('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 underline transition"
              >
                ✕ Réinitialiser les filtres
              </button>
            </div>
          )}
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

      {/* Liste des projets */}
      {!loading && !error && (
        <>
          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'Aucun projet' : 'Aucun projet trouvé'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? 'Commencez votre premier projet et immortalisez-le en photos !'
                  : 'Aucun projet ne correspond à ce filtre'}
              </p>
              {filter === 'all' && canCreateProject && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                >
                  ➕ Créer un projet
                </button>
              )}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                Aucun projet ne correspond aux filtres sélectionnés
              </p>
              <button
                onClick={() => {
                  setFilterType('')
                  setFilterTechnique('')
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
              >
                ✕ Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition overflow-hidden"
                >
                  {/* Photo principale */}
                  {project.main_photo ? (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={project.main_photo}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex flex-col items-center justify-center">
                      <span className="text-5xl mb-2">{project.technique === 'tricot' ? '🧶' : '🪡'}</span>
                      <p className="text-xs text-gray-600">Aucune photo</p>
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">
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
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {project.type}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium">
                        {project.technique === 'tricot' ? '🧶 Tricot' : '🪡 Crochet'}
                      </span>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Rang actuel</p>
                        <p className="font-semibold text-gray-900">
                          {project.current_row || 0}
                          {project.total_rows ? ` / ${project.total_rows}` : ''}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Temps</p>
                        <p className="font-semibold text-gray-900">
                          {project.time_formatted || '0h 0min'}
                        </p>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progression</span>
                        {project.completion_percentage !== null ? (
                          <span className="text-xs font-semibold text-primary-600">
                            {project.completion_percentage}%
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {project.current_row || 0} rang{(project.current_row || 0) > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: project.completion_percentage !== null
                              ? `${project.completion_percentage}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                      {project.completion_percentage === null && project.current_row === 0 && (
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          Commencez à compter vos rangs
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-center font-medium hover:bg-primary-700 transition"
                      >
                        📖 Voir le projet
                      </Link>

                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
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
                  Catégorie de projet
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">-- Sélectionner --</option>
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
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-blue-800 font-medium mb-2">Exemples rapides :</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSections([
                              { name: 'Face', description: '', total_rows: null },
                              { name: 'Dos', description: '', total_rows: null },
                              { name: 'Manche gauche', description: '', total_rows: null },
                              { name: 'Manche droite', description: '', total_rows: null }
                            ])}
                            className="px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition"
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
                            className="px-3 py-1 text-xs bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1: Upload fichier */}
                  <label className={`cursor-pointer block ${patternType === 'file' ? 'ring-2 ring-primary-600' : ''}`}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition h-full flex flex-col">
                      <div className="text-3xl mb-2 text-center">📎</div>
                      <p className="text-sm font-medium text-center mb-1">
                        Importer un fichier
                      </p>
                      <p className="text-xs text-gray-500 text-center mb-2">
                        PDF, JPG, PNG, WEBP
                      </p>
                      {patternFile && (
                        <p className="text-xs text-primary-600 text-center mt-auto font-medium">
                          ✓ {patternFile.name}
                        </p>
                      )}
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
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  {/* Option 2: URL */}
                  <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition h-full flex flex-col ${patternType === 'url' ? 'ring-2 ring-primary-600' : ''}`}>
                    <div className="text-3xl mb-2 text-center">🔗</div>
                    <p className="text-sm font-medium text-center mb-1">
                      Lien web
                    </p>
                    <p className="text-xs text-gray-500 text-center mb-2">
                      YouTube, Pinterest, blog...
                    </p>
                    <input
                      type="url"
                      value={patternUrl}
                      onChange={(e) => {
                        setPatternUrl(e.target.value)
                        if (e.target.value.trim()) {
                          setPatternType('url')
                          setPatternFile(null)
                        } else {
                          setPatternType('')
                        }
                      }}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {creating ? 'Création...' : '✨ Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'alerte personnalisée */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation personnalisée */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProjects
