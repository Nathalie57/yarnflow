/**
 * @file AdminDashboard.jsx
 * @brief Dashboard administrateur YarnFlow
 * @author Nathalie + AI Assistants
 * @created 2025-11-13
 * @modified 2025-12-12 - Mise à jour pour YarnFlow (projets + photos IA)
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats()
      setStats(response.data.data)
    } catch (err) {
      console.error('Erreur chargement stats:', err)
      setError('Impossible de charger les statistiques')
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-red-900 mb-2">Erreur</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">⚙️ Dashboard Admin - YarnFlow</h1>

      {/* Statistiques principales - 4 colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Utilisateurs */}
        <div className="bg-white rounded-lg border-l-4 border-blue-500 p-6 shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">👥 Utilisateurs</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">
            {stats?.users?.total || 0}
          </p>
          <p className="text-sm text-gray-500">
            +{stats?.users?.new_this_month || 0} ce mois
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-600">
              <span>FREE: {stats?.users?.free || 0}</span>
              <span>PRO: {stats?.subscriptions?.active || 0}</span>
            </div>
          </div>
        </div>

        {/* Projets */}
        <div className="bg-white rounded-lg border-l-4 border-primary-500 p-6 shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">🧶 Projets</h3>
          </div>
          <p className="text-3xl font-bold text-primary-600 mb-1">
            {stats?.projects?.total || 0}
          </p>
          <p className="text-sm text-gray-500">
            {stats?.projects?.this_month || 0} ce mois
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-600">
              <span>🪡 Crochet: {stats?.projects?.crochet || 0}</span>
              <span>🧶 Tricot: {stats?.projects?.tricot || 0}</span>
            </div>
          </div>
        </div>

        {/* Photos IA */}
        <div className="bg-white rounded-lg border-l-4 border-green-500 p-6 shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">📸 Photos IA</h3>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">
            {stats?.photos?.total_ai || 0}
          </p>
          <p className="text-sm text-gray-500">
            {stats?.photos?.this_month || 0} ce mois
          </p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {stats?.photos?.users_using_ai || 0} utilisateurs actifs
            </p>
          </div>
        </div>

        {/* Revenus */}
        <div className="bg-white rounded-lg border-l-4 border-yellow-500 p-6 shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">💰 Revenus</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600 mb-1">
            {stats?.revenue?.this_month?.toFixed(2) || '0.00'} €
          </p>
          <p className="text-sm text-gray-500">Ce mois</p>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Total : {stats?.revenue?.total?.toFixed(2) || '0.00'} €
            </p>
          </div>
        </div>
      </div>

      {/* Stats secondaires - Abonnements et Crédits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Abonnements */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h2 className="text-xl font-bold mb-4">📊 Répartition des abonnements</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">FREE</span>
              <span className="text-2xl font-bold text-gray-600">{stats?.users?.free || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-50 rounded">
              <span className="font-medium">PRO (mensuel)</span>
              <span className="text-2xl font-bold text-primary-600">{stats?.subscriptions?.pro || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <span className="font-medium">PRO (annuel)</span>
              <span className="text-2xl font-bold text-purple-600">{stats?.subscriptions?.pro_annual || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <span className="font-medium">Early Bird</span>
              <span className="text-2xl font-bold text-yellow-600">{stats?.subscriptions?.early_bird || 0}</span>
            </div>
          </div>
        </div>

        {/* Crédits photos IA */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h2 className="text-xl font-bold mb-4">📸 Crédits photos IA</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="font-medium">Crédits mensuels alloués</span>
              <span className="text-2xl font-bold text-blue-600">{stats?.credits?.monthly_allocated || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span className="font-medium">Crédits achetés (total)</span>
              <span className="text-2xl font-bold text-green-600">{stats?.credits?.purchased_total || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
              <span className="font-medium">Utilisés ce mois</span>
              <span className="text-2xl font-bold text-orange-600">{stats?.credits?.used_this_month || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">Total utilisés (all time)</span>
              <span className="text-2xl font-bold text-gray-600">{stats?.credits?.total_used || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liens rapides de gestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/users" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">👥 Utilisateurs</h3>
              <p className="text-gray-600">Gérer les comptes</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>

        <Link to="/admin/payments" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">💰 Paiements</h3>
              <p className="text-gray-600">Historique et stats</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>

        <Link to="/admin/categories" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">📂 Catégories</h3>
              <p className="text-gray-600">Gérer les catégories</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Derniers utilisateurs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h2 className="text-xl font-bold mb-4">👥 Derniers utilisateurs inscrits</h2>
          {stats?.recent_users && stats.recent_users.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      user.subscription_type === 'pro' || user.subscription_type === 'pro_annual'
                        ? 'bg-primary-100 text-primary-800'
                        : user.subscription_type === 'early_bird'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscription_type}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun utilisateur récent</p>
          )}
        </div>

        {/* Derniers projets */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow">
          <h2 className="text-xl font-bold mb-4">🧶 Derniers projets créés</h2>
          {stats?.recent_projects && stats.recent_projects.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-600">
                      Par {project.first_name} {project.last_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      project.technique === 'crochet'
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {project.technique === 'crochet' ? '🪡 Crochet' : '🧶 Tricot'}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun projet récent</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
