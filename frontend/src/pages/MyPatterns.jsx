import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { patternsAPI } from '../services/api'

const MyPatterns = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [patterns, setPatterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [generatingId, setGeneratingId] = useState(null)
  const [generatingStatus, setGeneratingStatus] = useState(null)

  // [AI:Claude] Charger l'ID du patron en cours de génération depuis l'URL
  useEffect(() => {
    const generating = searchParams.get('generating')
    if (generating) {
      setGeneratingId(parseInt(generating))
      setSearchParams({}) // Nettoyer l'URL
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const loadPatterns = async () => {
      try {
        const response = await patternsAPI.getAll()
        // L'API retourne { success: true, data: { patterns: [...], pagination: {...} } }
        setPatterns(response.data.data.patterns || [])
      } catch (error) {
        console.error('Erreur chargement patrons:', error)
        setPatterns([])
      } finally {
        setLoading(false)
      }
    }
    loadPatterns()
  }, [])

  // [AI:Claude] Polling du status de génération
  useEffect(() => {
    if (!generatingId) return

    const pollStatus = async () => {
      try {
        const response = await patternsAPI.checkStatus(generatingId)
        const status = response.data.data.status

        setGeneratingStatus(status)

        // [AI:Claude] Si terminé ou en erreur, arrêter le polling et recharger la liste
        if (status === 'completed' || status === 'error') {
          setGeneratingId(null)
          setGeneratingStatus(null)
          // Recharger la liste des patrons
          const patternsResponse = await patternsAPI.getAll()
          setPatterns(patternsResponse.data.data.patterns || [])
        }
      } catch (error) {
        console.error('Erreur check status:', error)
      }
    }

    // [AI:Claude] Poll toutes les 2 secondes
    pollStatus()
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [generatingId])

  const deletePattern = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patron ?')) {
      return
    }

    try {
      await patternsAPI.delete(id)
      setPatterns(patterns.filter(p => p.id !== id))
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-800' },
      generating: { label: 'En cours...', class: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', class: 'bg-green-100 text-green-800' },
      error: { label: 'Erreur', class: 'bg-red-100 text-red-800' }
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.class}`}>
        {badge.label}
      </span>
    )
  }

  const getTypeIcon = (type) => {
    const icons = {
      hat: '🧢',
      scarf: '🧣',
      amigurumi: '🧸',
      bag: '👜',
      garment: '👕'
    }
    return icons[type] || '🧶'
  }

  const filteredPatterns = patterns.filter(p => {
    if (filter === 'all') return true
    return p.status === filter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Mes Patrons</h1>
        <Link to="/generator" className="btn-primary">
          + Nouveau patron
        </Link>
      </div>

      {/* [AI:Claude] Notification de génération en cours */}
      {generatingId && generatingStatus === 'generating' && (
        <div className="card bg-blue-50 border-2 border-blue-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="font-bold text-blue-900">Génération en cours...</h3>
              <p className="text-sm text-blue-700">
                Votre patron est en cours de création. Cela peut prendre quelques secondes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({patterns.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded ${
              filter === 'completed'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Terminés ({patterns.filter(p => p.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('generating')}
            className={`px-4 py-2 rounded ${
              filter === 'generating'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En cours ({patterns.filter(p => p.status === 'generating').length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded ${
              filter === 'error'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Erreurs ({patterns.filter(p => p.status === 'error').length})
          </button>
        </div>
      </div>

      {/* Liste des patrons */}
      {filteredPatterns.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">
            {filter === 'all'
              ? 'Vous n\'avez pas encore de patrons'
              : `Aucun patron ${filter === 'completed' ? 'terminé' : filter === 'generating' ? 'en cours' : 'en erreur'}`}
          </p>
          <Link to="/generator" className="btn-primary">
            Créer mon premier patron
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map((pattern) => (
            <div key={pattern.id} className="card hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <div className="text-4xl">{getTypeIcon(pattern.type)}</div>
                {getStatusBadge(pattern.status)}
              </div>

              <h3 className="font-bold text-lg mb-2">
                {pattern.title || `Patron ${pattern.type}`}
              </h3>

              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Niveau:</span>
                  <span className="capitalize">{pattern.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Taille:</span>
                  <span className="uppercase">{pattern.size}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Créé le:</span>
                  <span>{new Date(pattern.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {pattern.price_paid > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Prix:</span>
                    <span>{pattern.price_paid.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {pattern.status === 'completed' && (
                  <Link
                    to={`/patterns/${pattern.id}`}
                    className="flex-1 btn-primary text-center text-sm"
                  >
                    Voir le patron
                  </Link>
                )}
                {pattern.status === 'generating' && (
                  <button disabled className="flex-1 btn-secondary text-sm">
                    Génération...
                  </button>
                )}
                {pattern.status === 'error' && (
                  <button
                    onClick={() => alert('Fonctionnalité à venir')}
                    className="flex-1 btn-primary text-sm"
                  >
                    Réessayer
                  </button>
                )}
                <button
                  onClick={() => deletePattern(pattern.id)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  title="Supprimer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyPatterns
