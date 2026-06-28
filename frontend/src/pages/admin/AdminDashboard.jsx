import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'

const StatCard = ({ label, value, sub, accent = 'primary' }) => {
  const colors = {
    primary: 'text-primary-700',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[accent] || colors.primary}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const PlanBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round(count / total * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const planLabel = (type) => {
  const map = {
    free: 'FREE', plus: 'PLUS', plus_annual: 'PLUS Annuel',
    pro: 'PRO', pro_annual: 'PRO Annuel', early_bird: 'Early Bird'
  }
  return map[type] || type
}

const planColor = (type) => {
  if (type === 'free') return 'bg-gray-100 text-gray-500'
  if (type?.includes('pro')) return 'bg-purple-100 text-purple-700'
  if (type === 'early_bird') return 'bg-amber-100 text-amber-700'
  return 'bg-primary-100 text-primary-700'
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const formatRelative = (d) => {
  if (!d) return null
  const diff = Math.floor((Date.now() - new Date(d)) / 60000)
  if (diff < 60) return `il y a ${diff}min`
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`
  if (diff < 10080) return `il y a ${Math.floor(diff / 1440)}j`
  return null
}

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { loadStats() }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getStats()
      setStats(response.data.data)
    } catch (err) {
      setError('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto mt-10">
        <p className="text-red-700 font-medium">{error}</p>
        <button onClick={loadStats} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition">
          Réessayer
        </button>
      </div>
    )
  }

  const u = stats?.users || {}
  const p = stats?.projects || {}
  const s = stats?.subscriptions || {}
  const r = stats?.revenue || {}
  const ph = stats?.photos || {}

  const totalUsers = u.total || 0
  const totalPaid = s.active || 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">YarnFlow — vue d'ensemble</p>
        </div>
        <button onClick={loadStats} className="text-xs text-gray-400 hover:text-gray-600 transition px-3 py-1.5 border border-gray-200 rounded-lg">
          Actualiser
        </button>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Inscriptions aujourd'hui" value={u.new_today ?? 0} sub={`+${u.new_this_month ?? 0} ce mois`} accent="primary" />
        <StatCard label="Utilisateurs total" value={totalUsers} sub={`${u.active_last_7_days ?? 0} actifs / 7j`} accent="blue" />
        <StatCard label="Abonnés payants" value={totalPaid} sub={`${s.conversion_rate ?? 0}% de conversion`} accent="purple" />
        <StatCard label="Revenu du mois" value={`${(r.this_month ?? 0).toFixed(2)} €`} sub={`Total : ${(r.total ?? 0).toFixed(2)} €`} accent="amber" />
      </div>

      {/* Engagement + Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Engagement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Engagement</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-primary-700">{u.engagement_rate ?? 0}%</p>
              <p className="text-xs text-gray-400 mt-1">ont créé un projet</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{p.total ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">projets au total</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Projets ce mois</span>
              <span className="font-medium text-gray-800">{p.this_month ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">En cours</span>
              <span className="font-medium text-gray-800">{p.in_progress ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Terminés</span>
              <span className="font-medium text-gray-800">{p.completed ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Studio photo</span>
              <span className="font-medium text-gray-800">{ph.total_ai ?? 0} générations</span>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Répartition des plans</h2>
          <div className="space-y-3">
            <PlanBar label="FREE" count={u.free ?? 0} total={totalUsers} color="bg-gray-300" />
            <PlanBar label="PLUS mensuel" count={u.plus ?? 0} total={totalUsers} color="bg-primary-400" />
            <PlanBar label="PLUS annuel" count={u.plus_annual ?? 0} total={totalUsers} color="bg-primary-600" />
            <PlanBar label="PRO mensuel" count={u.pro ?? 0} total={totalUsers} color="bg-purple-400" />
            <PlanBar label="PRO annuel" count={u.pro_annual ?? 0} total={totalUsers} color="bg-purple-600" />
            <PlanBar label="Early Bird" count={u.early_bird ?? 0} total={totalUsers} color="bg-amber-400" />
          </div>
        </div>
      </div>

      {/* Dernières inscriptions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dernières inscriptions</h2>
          <Link to="/admin/users" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Voir tout
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {(stats?.recent_users || []).map((user) => {
            const rel = formatRelative(user.last_seen_at)
            return (
              <div key={user.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  {parseInt(user.project_count) > 0 ? (
                    <span className="text-xs text-green-600 font-medium">{user.project_count} projet{user.project_count > 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-xs text-gray-300">sans projet</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planColor(user.subscription_type)}`}>
                    {planLabel(user.subscription_type)}
                  </span>
                  <span className="text-xs text-gray-300 w-16 text-right">{rel || formatDate(user.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Derniers projets créés */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Derniers projets créés</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(stats?.recent_projects || []).map((project) => (
            <div key={project.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{project.name}</p>
                <p className="text-xs text-gray-400">{project.first_name} {project.last_name}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  project.technique === 'crochet' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {project.technique === 'crochet' ? 'Crochet' : 'Tricot'}
                </span>
                <span className="text-xs text-gray-300 w-16 text-right">{formatDate(project.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { to: '/admin/users', label: 'Utilisateurs' },
          { to: '/admin/payments', label: 'Paiements' },
          { to: '/admin/categories', label: 'Catégories' },
          { to: '/admin/templates', label: 'Templates IA' },
        ].map(({ to, label }) => (
          <Link key={to} to={to} className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:border-primary-200 hover:text-primary-700 hover:shadow-sm transition text-center">
            {label}
          </Link>
        ))}
      </div>

    </div>
  )
}

export default AdminDashboard
