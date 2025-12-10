/**
 * @file Stats.jsx
 * @brief Page de statistiques Strava-style pour YarnFlow
 * @author Nathalie + Claude Code
 * @created 2025-11-14
 * @modified 2025-12-06 by [AI:Claude] - Refonte UI avec badges et meilleure visualisation
 *
 * @history
 *   2025-12-06 [AI:Claude] Refonte UI : badges, harmonisation couleurs, sections pliables
 *   2025-11-16 [AI:Claude] Refonte messaging positif sans comparaison
 *   2025-11-14 [AI:Claude] Création stats Strava-style
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const Stats = () => {
  const { user, hasActiveSubscription } = useAuth()
  const isPro = hasActiveSubscription()

  const [stats, setStats] = useState(null)
  const [photoStats, setPhotoStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all') // all, week, month, year
  const [showPhotoStats, setShowPhotoStats] = useState(true)
  const [showAchievements, setShowAchievements] = useState(true)

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

    if (hours > 0) {
      return `${hours}h ${mins}min`
    } else if (mins > 0) {
      return `${mins}min`
    } else {
      return `${secs}s`
    }
  }

  // [AI:Claude] Système de badges
  const calculateBadges = () => {
    if (!stats) return []

    const badges = []

    // Badges de base (FREE + PRO)
    if (stats.total_projects >= 1) badges.push({ emoji: '🎉', title: 'Premier projet', desc: 'Votre aventure commence !', tier: 'free' })
    if (stats.completed_projects >= 1) badges.push({ emoji: '✅', title: 'Premier projet terminé', desc: 'Bravo pour votre persévérance !', tier: 'free' })
    if (stats.total_rows >= 100) badges.push({ emoji: '📏', title: '100 rangs', desc: 'Les doigts bien échauffés', tier: 'free' })

    // Badges PRO uniquement
    if (stats.total_projects >= 5) badges.push({ emoji: '🌟', title: '5 projets', desc: 'Vous prenez de l\'élan !', tier: 'pro' })
    if (stats.total_projects >= 10) badges.push({ emoji: '💎', title: '10 projets', desc: 'Expert confirmé', tier: 'pro' })
    if (stats.completed_projects >= 5) badges.push({ emoji: '🏆', title: '5 projets terminés', desc: 'Productivité maximale', tier: 'pro' })

    // Badges de temps (PRO)
    if (stats.total_crochet_time >= 3600) badges.push({ emoji: '⏰', title: '1 heure de crochet', desc: 'Premier jalon franchi', tier: 'pro' })
    if (stats.total_crochet_time >= 36000) badges.push({ emoji: '⌛', title: '10 heures de crochet', desc: 'Dévouement impressionnant', tier: 'pro' })
    if (stats.total_crochet_time >= 180000) badges.push({ emoji: '🕐', title: '50 heures de crochet', desc: 'Maître artisan', tier: 'pro' })

    // Badges de rangs (PRO)
    if (stats.total_rows >= 500) badges.push({ emoji: '📐', title: '500 rangs', desc: 'Champion des rangs', tier: 'pro' })
    if (stats.total_rows >= 1000) badges.push({ emoji: '🎯', title: '1000 rangs', desc: 'Légende du crochet', tier: 'pro' })

    // Badges de mailles (PRO)
    if (stats.total_stitches >= 1000) badges.push({ emoji: '✨', title: '1000 mailles', desc: 'Magicien de la maille', tier: 'pro' })
    if (stats.total_stitches >= 10000) badges.push({ emoji: '💫', title: '10k mailles', desc: 'Virtuose confirmé', tier: 'pro' })
    if (stats.total_stitches >= 100000) badges.push({ emoji: '🌌', title: '100k mailles', desc: 'Légende vivante', tier: 'pro' })

    // Badges de streak (PRO)
    if (stats.current_streak >= 3) badges.push({ emoji: '🔥', title: 'Streak 3 jours', desc: 'Motivation au top', tier: 'pro' })
    if (stats.current_streak >= 7) badges.push({ emoji: '🔥🔥', title: 'Streak 7 jours', desc: 'Une semaine complète', tier: 'pro' })
    if (stats.current_streak >= 30) badges.push({ emoji: '🔥🔥🔥', title: 'Streak 30 jours', desc: 'Engagement exemplaire', tier: 'pro' })

    return badges
  }

  // [AI:Claude] Composant de section bloquée pour FREE
  const LockedSection = ({ title, description, icon = '🔒' }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300 p-8 text-center relative overflow-hidden">
      {/* Fond avec pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)',
        backgroundSize: '10px 10px'
      }}></div>

      <div className="relative z-10">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>

        <Link
          to="/subscription"
          className="inline-block px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-105 shadow-lg"
        >
          ✨ Passez PRO pour débloquer
        </Link>

        <p className="text-sm text-gray-500 mt-4">
          À partir de 2,99€/mois
        </p>
      </div>
    </div>
  )

  // [AI:Claude] Mini calendrier streak (7 derniers jours)
  const renderStreakCalendar = () => {
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
      const isActive = i < (stats?.current_streak || 0)

      days.push(
        <div key={i} className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
            isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {dayName[0].toUpperCase()}
          </div>
        </div>
      )
    }

    return <div className="flex gap-2 justify-center">{days}</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const badges = calculateBadges()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Mes Statistiques</h1>
        <p className="text-gray-600">
          Suivez votre progression comme une pro !
        </p>
      </div>

      {/* Filtres de période - PRO uniquement */}
      {isPro && (
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
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

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
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            ➕ Créer mon premier projet
          </Link>
        </div>
      ) : (
        <>
          {/* Stats principales - Design harmonisé */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Projets totaux */}
            <div className="bg-white rounded-xl border-2 border-primary-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">🧶</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">{stats.total_projects || 0}</div>
                  <div className="text-sm text-gray-500">Projet{stats.total_projects > 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Terminés</span>
                <span className="font-bold text-green-600">{stats.completed_projects || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-600">En cours</span>
                <span className="font-bold text-orange-600">{stats.active_projects || 0}</span>
              </div>
            </div>

            {/* Temps total */}
            <div className="bg-white rounded-xl border-2 border-primary-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">⏱️</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {Math.floor((stats.total_crochet_time || 0) / 3600)}h
                  </div>
                  <div className="text-sm text-gray-500">de crochet</div>
                </div>
              </div>
              {isPro ? (
                <>
                  <div className="text-xs text-gray-600">
                    Temps total : {formatTime(stats.total_crochet_time || 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Moy. session : {stats.average_session_time || 0} min
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  🔒 Détails PRO
                </div>
              )}
            </div>

            {/* Rangs totaux */}
            <div className="bg-white rounded-xl border-2 border-primary-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">📏</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">{stats.total_rows || 0}</div>
                  <div className="text-sm text-gray-500">Rangs</div>
                </div>
              </div>
              {isPro ? (
                <>
                  <div className="text-xs text-gray-600">
                    Vitesse moyenne : {stats.avg_rows_per_hour || 0} rangs/h
                  </div>
                  {stats.avg_rows_per_hour > 0 && (
                    <div className="mt-2 bg-primary-50 rounded px-2 py-1 text-xs text-primary-700 font-medium">
                      {stats.avg_rows_per_hour >= 20 ? '🚀 Très rapide' : stats.avg_rows_per_hour >= 10 ? '⚡ Bon rythme' : '🐢 Prenez votre temps'}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  🔒 Vitesse PRO
                </div>
              )}
            </div>

            {/* Mailles totales */}
            <div className="bg-white rounded-xl border-2 border-primary-200 p-6 hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">✨</div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {stats.total_stitches >= 1000
                      ? `${(stats.total_stitches / 1000).toFixed(1)}k`
                      : stats.total_stitches || 0
                    }
                  </div>
                  <div className="text-sm text-gray-500">Mailles</div>
                </div>
              </div>
              {isPro ? (
                <>
                  <div className="text-xs text-gray-600">
                    Total exact : {(stats.total_stitches || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Vitesse : {stats.avg_stitches_per_hour || 0}/h
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  🔒 Détails PRO
                </div>
              )}
            </div>
          </div>

          {/* Streak Section - PRO uniquement */}
          {isPro ? (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  🔥 Série en cours
                </h3>
                <div className="text-right">
                  <div className="text-4xl font-bold text-orange-600">{stats.current_streak || 0}</div>
                  <div className="text-sm text-gray-600">jour{stats.current_streak > 1 ? 's' : ''}</div>
                </div>
              </div>

              {renderStreakCalendar()}

              <div className="mt-4 text-center text-xs text-gray-600">
                Record personnel : {stats.longest_streak || 0} jour{stats.longest_streak > 1 ? 's' : ''} 🏆
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <LockedSection
                title="Calendrier de série"
                description="Suivez votre streak quotidien et battez vos records personnels !"
                icon="🔥"
              />
            </div>
          )}

          {/* Progression - Version simplifiée pour FREE */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🎯 Progression globale
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Projets terminés</span>
                  <span className="font-bold text-primary-600">
                    {stats.completed_projects || 0} / {stats.total_projects || 0}
                  </span>
                </div>
                {isPro && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all"
                        style={{ width: `${stats.completion_rate || 0}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-center">
                      Taux de complétion : {stats.completion_rate || 0}%
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Graphiques Section - PRO uniquement */}
          {isPro ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Répartition des projets - Donut Chart */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Répartition des projets
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Terminés', value: stats.completed_projects || 0, color: '#10b981' },
                      { name: 'En cours', value: stats.active_projects || 0, color: '#f59e0b' },
                      {
                        name: 'Autres',
                        value: Math.max(0, (stats.total_projects || 0) - (stats.completed_projects || 0) - (stats.active_projects || 0)),
                        color: '#6b7280'
                      }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Terminés', value: stats.completed_projects || 0, color: '#10b981' },
                      { name: 'En cours', value: stats.active_projects || 0, color: '#f59e0b' },
                      {
                        name: 'Autres',
                        value: Math.max(0, (stats.total_projects || 0) - (stats.completed_projects || 0) - (stats.active_projects || 0)),
                        color: '#6b7280'
                      }
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Terminés ({stats.completed_projects || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">En cours ({stats.active_projects || 0})</span>
                </div>
              </div>
            </div>

            {/* Performance - Bar Chart */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                ⚡ Performance
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      name: 'Rangs/h',
                      value: stats.avg_rows_per_hour || 0,
                      color: '#8b5cf6'
                    },
                    {
                      name: 'Mailles/h',
                      value: Math.min(stats.avg_stitches_per_hour || 0, 500), // Cap pour lisibilité
                      realValue: stats.avg_stitches_per_hour || 0,
                      color: '#ec4899'
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white border-2 border-primary-200 rounded p-3 shadow-lg">
                            <p className="font-bold text-gray-800">{data.name}</p>
                            <p className="text-primary-600">
                              {data.realValue !== undefined ? data.realValue : data.value}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {[
                      { name: 'Rangs/h', value: stats.avg_rows_per_hour || 0, color: '#8b5cf6' },
                      {
                        name: 'Mailles/h',
                        value: Math.min(stats.avg_stitches_per_hour || 0, 500),
                        realValue: stats.avg_stitches_per_hour || 0,
                        color: '#ec4899'
                      }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center text-xs text-gray-500">
                Plus c'est haut, plus vous êtes rapide ! 🚀
              </div>
            </div>
          </div>
          ) : (
            <div className="mb-8">
              <LockedSection
                title="Analytics Avancées"
                description="Graphiques de performance, répartition par technique et types de projets. Analysez vos données comme une pro !"
                icon="📊"
              />
            </div>
          )}

          {/* Badges Section - Pliable - Filtré pour FREE */}
          {badges.filter(b => isPro || b.tier === 'free').length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-8">
              <button
                onClick={() => setShowAchievements(!showAchievements)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  🏅 Achievements débloqués
                  <span className="text-sm font-normal text-gray-500">
                    ({badges.filter(b => isPro || b.tier === 'free').length})
                    {!isPro && <span className="ml-2 text-xs">• 🔒 Plus en PRO</span>}
                  </span>
                </h3>
                <span className="text-2xl text-gray-500">{showAchievements ? '▾' : '▸'}</span>
              </button>

              {showAchievements && (
                <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.filter(b => isPro || b.tier === 'free').map((badge, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="text-3xl mb-2">{badge.emoji}</div>
                      <div className="font-bold text-gray-800 text-sm mb-1">{badge.title}</div>
                      <div className="text-xs text-gray-600">{badge.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Photos IA - PRO uniquement */}
          {isPro && photoStats && photoStats.total_ai_photos > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              <button
                onClick={() => setShowPhotoStats(!showPhotoStats)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  📸 AI Photo Studio
                </h3>
                <span className="text-2xl text-gray-500">{showPhotoStats ? '▾' : '▸'}</span>
              </button>

              {showPhotoStats && (
                <div className="p-4 pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total photos IA */}
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-lg p-4">
                      <div className="text-3xl mb-2">📸</div>
                      <div className="text-2xl font-bold text-primary-600">{photoStats.total_ai_photos || 0}</div>
                      <div className="text-sm text-gray-600">Photo{photoStats.total_ai_photos > 1 ? 's' : ''} IA</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {photoStats.variations || 0} variation{photoStats.variations > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Style préféré */}
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-lg p-4">
                      <div className="text-3xl mb-2">🎨</div>
                      <div className="text-lg font-bold text-primary-600 truncate">
                        {photoStats.top_style || 'Aucun'}
                      </div>
                      <div className="text-sm text-gray-600">Style préféré</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {photoStats.top_style_count || 0} photo{photoStats.top_style_count > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Crédits restants */}
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-lg p-4">
                      <div className="text-3xl mb-2">⭐</div>
                      <div className="text-2xl font-bold text-primary-600">{photoStats.credits_remaining || 0}</div>
                      <div className="text-sm text-gray-600">Crédits restants</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {photoStats.credits_used || 0} utilisé{photoStats.credits_used > 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Projets photographiés */}
                    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-lg p-4">
                      <div className="text-3xl mb-2">📁</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {photoStats.top_projects?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Projets photo</div>
                      {photoStats.top_projects && photoStats.top_projects[0] && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          Top: {photoStats.top_projects[0].project_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top 3 projets photographiés */}
                  {photoStats.top_projects && photoStats.top_projects.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-gray-700 mb-3 text-sm">🏆 Projets les plus photographiés</h4>
                      <div className="space-y-2">
                        {photoStats.top_projects.slice(0, 3).map((project, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{project.project_name || 'Sans projet'}</p>
                                <p className="text-xs text-gray-500">
                                  {project.photo_count} photo{project.photo_count > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section bloquée stats photos IA pour FREE */}
          {!isPro && photoStats && photoStats.total_ai_photos > 0 && (
            <div className="mb-8">
              <LockedSection
                title="Stats AI Photo Studio"
                description="Analysez vos photos IA : styles préférés, top projets photographiés, crédits utilisés et plus !"
                icon="📸"
              />
            </div>
          )}

        </>
      )}
    </div>
  )
}

export default Stats
