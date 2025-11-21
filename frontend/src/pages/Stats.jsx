/**
 * @file Stats.jsx
 * @brief Page de statistiques Strava-style pour YarnFlow
 * @author Nathalie + Claude Code
 * @created 2025-11-14
 * @modified 2025-11-16 by [AI:Claude] - Refonte messaging positif
 *
 * @history
 *   2025-11-16 [AI:Claude] Refonte messaging positif sans comparaison
 *   2025-11-14 [AI:Claude] Création stats Strava-style
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const Stats = () => {
  const [stats, setStats] = useState(null)
  const [photoStats, setPhotoStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all') // all, week, month, year

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // [AI:Claude] Récupérer stats projets et photos en parallèle
      const [projectsResponse, photosResponse] = await Promise.all([
        api.get('/projects/stats', { params: { period } }),
        api.get('/photos/stats', { params: { period } })
      ])

      setStats(projectsResponse.data.stats || {})
      setPhotoStats(photosResponse.data.stats || {})
    } catch (err) {
      console.error('Erreur chargement stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // [AI:Claude] Formater le temps (secondes → heures/minutes/secondes)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}h ${mins}min ${secs}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Mes Statistiques</h1>
        <p className="text-gray-600">
          Suivez votre progression comme une pro !
        </p>
      </div>

      {/* Filtres de période */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {[
          { key: 'week', label: 'Cette semaine' },
          { key: 'month', label: 'Ce mois' },
          { key: 'year', label: 'Cette année' },
          { key: 'all', label: 'Tout temps' }
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              period === p.key
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Message si pas de stats */}
      {!stats || stats.total_projects === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Pas encore de statistiques
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier projet et commencez à crocheter pour voir vos stats !
          </p>
          <Link
            to="/my-projects"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            ➕ Créer mon premier projet
          </Link>
        </div>
      ) : (
        <>
          {/* Stats principales - Style Strava */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Projets totaux */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">🧶</div>
              <div className="text-3xl font-bold mb-1">{stats.total_projects || 0}</div>
              <div className="text-blue-100">Projet{stats.total_projects > 1 ? 's' : ''}</div>
              <div className="text-sm text-blue-100 mt-2">
                {stats.completed_projects || 0} terminé{stats.completed_projects > 1 ? 's' : ''}
              </div>
            </div>

            {/* Temps total */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-3xl font-bold mb-1">
                {formatTime(stats.total_crochet_time || 0)}
              </div>
              <div className="text-purple-100">Temps de crochet</div>
              <div className="text-sm text-purple-100 mt-2">
                {stats.average_session_time ? `${stats.average_session_time}min/session` : 'Pas encore de sessions'}
              </div>
            </div>

            {/* Rangs totaux */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">📏</div>
              <div className="text-3xl font-bold mb-1">{stats.total_rows || 0}</div>
              <div className="text-green-100">Rangs crochetés</div>
              <div className="text-sm text-green-100 mt-2">
                {stats.avg_rows_per_hour ? `${stats.avg_rows_per_hour} rangs/h` : 'En calcul...'}
              </div>
            </div>

            {/* Mailles totales */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-3xl font-bold mb-1">
                {stats.total_stitches ? stats.total_stitches.toLocaleString() : 0}
              </div>
              <div className="text-orange-100">Mailles</div>
              <div className="text-sm text-orange-100 mt-2">
                {stats.avg_stitches_per_hour ? `${stats.avg_stitches_per_hour}/h` : 'En calcul...'}
              </div>
            </div>
          </div>

          {/* Stats secondaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">🎯 Progression</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Taux de complétion</span>
                    <span className="font-semibold">
                      {stats.completion_rate ? `${stats.completion_rate}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${stats.completion_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">Projets actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active_projects || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">🔥 Streak</h3>
              <div className="text-center">
                <div className="text-5xl mb-2">🔥</div>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {stats.current_streak || 0}
                </div>
                <div className="text-sm text-gray-600">
                  Jour{stats.current_streak > 1 ? 's' : ''} consécutif{stats.current_streak > 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Record : {stats.longest_streak || 0} jour{stats.longest_streak > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-700 mb-4">⚡ Vitesse</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Rangs/heure</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.avg_rows_per_hour || 0}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">Mailles/heure</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.avg_stitches_per_hour || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Photos IA */}
          {photoStats && photoStats.total_ai_photos > 0 && (
            <>
              <div className="mt-8 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">📸 AI Photo Studio</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total photos IA */}
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">📸</div>
                  <div className="text-3xl font-bold mb-1">{photoStats.total_ai_photos || 0}</div>
                  <div className="text-pink-100">Photo{photoStats.total_ai_photos > 1 ? 's' : ''} IA</div>
                  <div className="text-sm text-pink-100 mt-2">
                    {photoStats.variations || 0} variation{photoStats.variations > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Style préféré */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">🎨</div>
                  <div className="text-xl font-bold mb-1">
                    {photoStats.top_style || 'Aucun'}
                  </div>
                  <div className="text-indigo-100">Style préféré</div>
                  <div className="text-sm text-indigo-100 mt-2">
                    {photoStats.top_style_count || 0} photo{photoStats.top_style_count > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Crédits restants */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">⭐</div>
                  <div className="text-3xl font-bold mb-1">{photoStats.credits_remaining || 0}</div>
                  <div className="text-amber-100">Crédits restants</div>
                  <div className="text-sm text-amber-100 mt-2">
                    {photoStats.credits_used || 0} utilisé{photoStats.credits_used > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Projets photographiés */}
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-3xl font-bold mb-1">
                    {photoStats.top_projects?.length || 0}
                  </div>
                  <div className="text-teal-100">Projets photographiés</div>
                  {photoStats.top_projects && photoStats.top_projects[0] && (
                    <div className="text-sm text-teal-100 mt-2 truncate">
                      Top: {photoStats.top_projects[0].project_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Top 3 projets photographiés */}
              {photoStats.top_projects && photoStats.top_projects.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
                  <h3 className="font-semibold text-gray-700 mb-4">🏆 Projets les plus photographiés</h3>
                  <div className="space-y-3">
                    {photoStats.top_projects.map((project, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{project.project_name || 'Sans projet'}</p>
                            <p className="text-sm text-gray-500">
                              {project.photo_count} photo{project.photo_count > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </>
      )}
    </div>
  )
}

export default Stats
