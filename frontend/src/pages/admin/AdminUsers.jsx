import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import UserModal from '../../components/admin/UserModal'

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
      // L'API retourne { users: [...], pagination: {...} }
      setUsers(response.data.data.users || [])
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      setUsers([]) // S'assurer que users est toujours un tableau
    } finally {
      setLoading(false)
    }
  }

  const openUserModal = async (userId) => {
    try {
      const response = await adminAPI.getUserDetails(userId)
      setSelectedUser(response.data.data.user)
      // Ajouter les données complètes dans selectedUser
      const fullData = response.data.data
      setSelectedUser({
        ...fullData.user,
        projects: fullData.projects,
        payments: fullData.payments,
        credits: fullData.credits,
        stats: fullData.stats
      })
      setShowModal(true)
    } catch (error) {
      console.error('Erreur chargement détails:', error)
      alert('Erreur lors du chargement des détails')
    }
  }

  const handleUserUpdate = () => {
    setShowModal(false)
    loadUsers()
    // Recharger les détails si modal encore ouverte
    if (selectedUser) {
      openUserModal(selectedUser.id)
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
                      user.subscription_type.startsWith('pro') || user.subscription_type === 'early_bird'
                        ? 'bg-primary-100 text-primary-800'
                        : user.subscription_type.startsWith('plus')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscription_type === 'free' ? 'FREE' :
                       user.subscription_type === 'plus' ? 'PLUS' :
                       user.subscription_type === 'plus_annual' ? 'PLUS Annual' :
                       user.subscription_type === 'pro' ? 'PRO' :
                       user.subscription_type === 'pro_annual' ? 'PRO Annual' :
                       user.subscription_type === 'early_bird' ? 'Early Bird' :
                       user.subscription_type}
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
        <UserModal
          user={selectedUser}
          onClose={() => setShowModal(false)}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  )
}

export default AdminUsers
