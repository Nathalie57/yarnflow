import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats()
      setStats(response.data.data)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
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
      <h1 className="text-3xl font-bold mb-6">⚙️ Dashboard Admin</h1>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <h3 className="text-gray-600 mb-2">Utilisateurs totaux</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats?.users?.total || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            +{stats?.users?.new_this_month || 0} ce mois
          </p>
        </div>

        <div className="card bg-green-50 border-l-4 border-green-500">
          <h3 className="text-gray-600 mb-2">Patrons générés</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats?.patterns?.total || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.patterns?.this_month || 0} ce mois
          </p>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <h3 className="text-gray-600 mb-2">Abonnements actifs</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats?.subscriptions?.active || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {stats?.subscriptions?.monthly || 0} mensuels, {stats?.subscriptions?.yearly || 0} annuels
          </p>
        </div>

        <div className="card bg-yellow-50 border-l-4 border-yellow-500">
          <h3 className="text-gray-600 mb-2">Revenus du mois</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats?.revenue?.this_month?.toFixed(2) || '0.00'} €
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Total : {stats?.revenue?.total?.toFixed(2) || '0.00'} €
          </p>
        </div>
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/users" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">👥 Utilisateurs</h3>
              <p className="text-gray-600">Gérer les comptes utilisateurs</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>

        <Link to="/admin/templates" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">📋 Templates</h3>
              <p className="text-gray-600">Gérer les patrons de référence</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>

        <Link to="/admin/payments" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">💰 Paiements</h3>
              <p className="text-gray-600">Historique et remboursements</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>

        <Link to="/admin/categories" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">📂 Catégories</h3>
              <p className="text-gray-600">Gérer les catégories de patrons</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>

        <Link to="/admin/options" className="card hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">⚙️ Options</h3>
              <p className="text-gray-600">Gérer les options de personnalisation</p>
            </div>
            <span className="text-4xl">→</span>
          </div>
        </Link>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Derniers utilisateurs */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Derniers utilisateurs inscrits</h2>
          {stats?.recent_users && stats.recent_users.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun utilisateur récent</p>
          )}
        </div>

        {/* Derniers patrons */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Derniers patrons générés</h2>
          {stats?.recent_patterns && stats.recent_patterns.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_patterns.map((pattern) => (
                <div key={pattern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{pattern.title || `Patron ${pattern.type}`}</div>
                    <div className="text-sm text-gray-600">
                      Par {pattern.user_name || 'Utilisateur'} - {pattern.level}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    pattern.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : pattern.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {pattern.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun patron récent</p>
          )}
        </div>
      </div>

      {/* Templates populaires */}
      {stats?.popular_templates && stats.popular_templates.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-xl font-bold mb-4">📊 Templates les plus utilisés</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Template</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Niveau</th>
                  <th className="text-right p-3">Utilisations</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.popular_templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{template.name}</td>
                    <td className="p-3 capitalize">{template.type}</td>
                    <td className="p-3 capitalize">{template.level}</td>
                    <td className="p-3 text-right font-bold text-primary-600">
                      {template.usage_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
