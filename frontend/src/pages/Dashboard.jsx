import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { userAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await userAPI.getDashboard()
      setDashboard(response.data.data)
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
      // Continuer même en cas d'erreur
      setDashboard({
        stats: {
          total_patterns: 0,
          patterns_remaining: 3,
          has_active_subscription: false
        },
        recent_patterns: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bonjour {user?.first_name} 👋</h1>

      {/* Statistiques - v0.11.0 AI PHOTO STUDIO */}
      <div className={`grid grid-cols-1 ${isAdmin() ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 mb-8`}>
        <div className="card border-2 border-primary-200 bg-primary-50">
          <h3 className="text-primary-700 mb-2 font-semibold">📊 Projets trackés</h3>
          <p className="text-3xl font-bold text-primary-600">
            {dashboard?.stats?.total_projects || 0}
          </p>
          <p className="text-sm text-primary-600 mt-2">
            Compteur de rangs interactif
          </p>
        </div>

        <div className="card border-2 border-primary-200 bg-warm-100">
          <h3 className="text-primary-700 mb-2 font-semibold">📸 Images IA</h3>
          <p className="text-3xl font-bold text-primary-600">
            {dashboard?.stats?.ai_photos_generated || 0}
          </p>
          <p className="text-sm text-primary-600 mt-2">
            AI Photo Studio
          </p>
        </div>

        {/* Patrons IA - ADMIN ONLY */}
        {isAdmin() && (
          <div className="card border-2 border-orange-200 bg-orange-50">
            <h3 className="text-orange-700 mb-2 font-semibold">🤖 Patrons IA (ADMIN)</h3>
            <p className="text-3xl font-bold text-orange-600">
              {dashboard?.stats?.total_patterns || 0}
            </p>
            <p className="text-sm text-orange-600 mt-2">
              {dashboard?.stats?.patterns_remaining === -1
                ? 'Quota illimité'
                : `${dashboard?.stats?.patterns_remaining || 0} restant(s)`
              }
            </p>
          </div>
        )}
      </div>

      {/* Actions rapides - v0.11.0 AI PHOTO STUDIO */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Accès rapide</h2>
        <div className={`grid grid-cols-1 ${isAdmin() ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          {/* TRACKER EN PREMIER */}
          <Link
            to="/my-projects"
            className="bg-primary-600 hover:bg-primary-700 text-white py-4 px-6 rounded-lg font-semibold text-center transition shadow-lg"
          >
            📊 Mes projets
            <div className="text-sm font-normal mt-1">Tracker de rangs interactif</div>
          </Link>

          {/* AI PHOTO STUDIO en DEUXIÈME */}
          <Link
            to="/gallery"
            className="bg-primary-600 hover:bg-primary-700 text-white py-4 px-6 rounded-lg font-semibold text-center transition shadow-lg flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2">
              📸 AI Photo Studio
              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
            </div>
            <div className="text-sm font-normal">Photos professionnelles IA</div>
          </Link>

          {/* Générateur - ADMIN ONLY */}
          {isAdmin() && (
            <Link
              to="/generator"
              className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-orange-300 py-4 px-6 rounded-lg font-semibold text-center transition flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                🤖 Générer un patron
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">ADMIN</span>
              </div>
              <div className="text-sm font-normal">Tests générateur IA</div>
            </Link>
          )}
        </div>
      </div>

      {/* Message de bienvenue */}
      <div className="card bg-gradient-to-r from-primary-50 to-warm-100 border-2 border-primary-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">✨</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-900 mb-2">
              Bienvenue sur YarnFlow !
            </h3>
            <p className="text-primary-800 mb-3">
              YarnFlow vous accompagne de la première maille jusqu'au partage sur vos réseaux :
              <strong> tracker de projets</strong>, <strong>statistiques motivantes</strong>,
              <strong> AI Photo Studio</strong>, et bien plus !
              Suivez votre progression comme une pro ! 🚀
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/stats"
                className="px-4 py-2 bg-white hover:bg-primary-50 text-primary-700 rounded-lg font-medium transition border border-primary-300"
              >
                📊 Voir mes statistiques
              </Link>
              <Link
                to="/gallery"
                className="px-4 py-2 bg-white hover:bg-primary-50 text-primary-700 rounded-lg font-medium transition border border-primary-300"
              >
                📸 Essayer l'AI Photo Studio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Derniers patrons - ADMIN ONLY */}
      {isAdmin() && dashboard?.recent_patterns && dashboard.recent_patterns.length > 0 && (
        <div className="card border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Derniers patrons</h2>
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">ADMIN</span>
          </div>
          <div className="space-y-3">
            {dashboard.recent_patterns.map((pattern) => (
              <Link
                key={pattern.id}
                to={`/patterns/${pattern.id}`}
                className="block p-4 border rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
              >
                <h3 className="font-medium">{pattern.title}</h3>
                <p className="text-sm text-gray-600">
                  {pattern.type} - {pattern.level} - {pattern.size}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
