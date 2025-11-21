import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers({ search, filter })
      setUsers(response.data.data)
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const openUserModal = async (userId) => {
    try {
      const response = await adminAPI.getUserDetails(userId)
      setSelectedUser(response.data.data)
      setShowModal(true)
    } catch (error) {
      console.error('Erreur chargement détails:', error)
      alert('Erreur lors du chargement des détails')
    }
  }

  const updateSubscription = async (userId, data) => {
    try {
      await adminAPI.updateUserSubscription(userId, data)
      alert('Abonnement mis à jour avec succès')
      setShowModal(false)
      loadUsers()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchSearch = search === '' ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(search.toLowerCase())

    const matchFilter = filter === 'all' ||
      (filter === 'free' && user.subscription_type === 'free') ||
      (filter === 'subscribed' && user.subscription_type !== 'free') ||
      (filter === 'admin' && user.role === 'admin')

    return matchSearch && matchFilter
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
      <h1 className="text-3xl font-bold mb-6">👥 Gestion des Utilisateurs</h1>

      {/* Recherche et filtres */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Tous ({users.length})
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-4 py-2 rounded ${
                filter === 'free' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Gratuit
            </button>
            <button
              onClick={() => setFilter('subscribed')}
              className={`px-4 py-2 rounded ${
                filter === 'subscribed' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Abonnés
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-4 py-2 rounded ${
                filter === 'admin' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Utilisateur</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Rôle</th>
                <th className="text-left p-3">Abonnement</th>
                <th className="text-left p-3">Patrons</th>
                <th className="text-left p-3">Inscription</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                  </td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.subscription_type === 'yearly'
                        ? 'bg-purple-100 text-purple-800'
                        : user.subscription_type === 'monthly'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscription_type}
                    </span>
                  </td>
                  <td className="p-3">{user.patterns_generated_count || 0}</td>
                  <td className="p-3">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => openUserModal(user.id)}
                      className="text-primary-600 hover:underline text-xs"
                    >
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500 py-8">Aucun utilisateur trouvé</p>
        )}
      </div>

      {/* Modal détails utilisateur */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Informations */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Rôle</label>
                  <p>{selectedUser.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Inscrit le</label>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Patrons générés</label>
                  <p>{selectedUser.patterns_generated_count || 0}</p>
                </div>
              </div>

              {/* Modifier l'abonnement */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">Modifier l'abonnement</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => updateSubscription(selectedUser.id, {
                      subscription_type: 'monthly',
                      subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })}
                    className="w-full p-3 text-left border rounded hover:bg-gray-50"
                  >
                    <div className="font-medium">Abonnement Mensuel</div>
                    <div className="text-sm text-gray-600">Expire dans 30 jours</div>
                  </button>
                  <button
                    onClick={() => updateSubscription(selectedUser.id, {
                      subscription_type: 'yearly',
                      subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                    })}
                    className="w-full p-3 text-left border rounded hover:bg-gray-50"
                  >
                    <div className="font-medium">Abonnement Annuel</div>
                    <div className="text-sm text-gray-600">Expire dans 365 jours</div>
                  </button>
                  <button
                    onClick={() => updateSubscription(selectedUser.id, {
                      subscription_type: 'free',
                      subscription_expires_at: null
                    })}
                    className="w-full p-3 text-left border rounded hover:bg-gray-50"
                  >
                    <div className="font-medium">Plan Gratuit</div>
                    <div className="text-sm text-gray-600">Retirer l'abonnement</div>
                  </button>
                </div>
              </div>

              {/* Patrons de l'utilisateur */}
              {selectedUser.patterns && selectedUser.patterns.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-bold mb-4">Patrons générés ({selectedUser.patterns.length})</h3>
                  <div className="space-y-2">
                    {selectedUser.patterns.map((pattern) => (
                      <div key={pattern.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{pattern.title || `Patron ${pattern.type}`}</div>
                          <div className="text-sm text-gray-600">{pattern.level} - {pattern.size}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          pattern.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pattern.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
