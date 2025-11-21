import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userAPI } from '../services/api'

const Profile = () => {
  const { user, updateUser, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [activeTab, setActiveTab] = useState('info')

  // States pour édition profil
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })

  // States pour changement mot de passe
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // States pour suppression compte
  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Messages
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await userAPI.getProfile()
      const data = response.data.data

      setProfileData(data)
      setFormData({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        email: data.user.email || ''
      })
    } catch (error) {
      console.error('Erreur chargement profil:', error)
      setErrorMessage('Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    try {
      const response = await userAPI.updateProfile(formData)
      const updatedUser = response.data.data.user

      setProfileData(prev => ({ ...prev, user: updatedUser }))
      updateUser(updatedUser)
      setEditMode(false)
      setSuccessMessage('Profil mis à jour avec succès')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMessage('Les mots de passe ne correspondent pas')
      return
    }

    try {
      await userAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
      setSuccessMessage('Mot de passe modifié avec succès')
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors du changement de mot de passe')
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await userAPI.deleteAccount({ password: deletePassword })
      logout()
      window.location.href = '/'
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la suppression du compte')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="card">
        <p className="text-red-600">Erreur lors du chargement du profil</p>
      </div>
    )
  }

  const { user: userData, stats } = profileData
  const subscriptionLabels = {
    free: 'Gratuit',
    starter: 'Starter',
    premium: 'Premium',
    monthly: 'Mensuel',
    yearly: 'Annuel'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'info', label: 'Informations', icon: '👤' },
            { id: 'password', label: 'Mot de passe', icon: '🔒' },
            { id: 'subscription', label: 'Abonnement', icon: '💳' },
            { id: 'delete', label: 'Supprimer', icon: '⚠️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSuccessMessage('')
                setErrorMessage('')
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Informations personnelles */}
      {activeTab === 'info' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Informations personnelles</h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="btn-secondary"
              >
                Modifier
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Prénom</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Nom</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false)
                    setFormData({
                      first_name: userData.first_name || '',
                      last_name: userData.last_name || '',
                      email: userData.email || ''
                    })
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Prénom</label>
                  <p className="text-lg font-medium">{userData.first_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Nom</label>
                  <p className="text-lg font-medium">{userData.last_name || '-'}</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <p className="text-lg font-medium">{userData.email}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-1">Membre depuis</label>
                <p className="text-lg font-medium">
                  {new Date(userData.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Statistiques */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">Mes statistiques YarnFlow</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">🧶 Projets totaux</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.total_projects || 0}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">⏱️ Projets actifs</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.active_projects || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">✅ Projets terminés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed_projects || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">📏 Rangs tricotés</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.total_rows || 0}</p>
                  </div>
                </div>

                {/* Stats photos IA */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">📸 Photos IA générées</p>
                    <p className="text-2xl font-bold text-pink-600">{stats.ai_photos_generated || 0}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">🎨 Crédits restants</p>
                    <p className="text-2xl font-bold text-indigo-600">{stats.photo_credits_remaining || 0}</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">💳 Total dépensé</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.total_spent || 0}€</p>
                  </div>
                </div>

                {/* Temps total si disponible */}
                {stats.total_time > 0 && (
                  <div className="mt-4 bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">⏰ Temps total de tricot</p>
                    <p className="text-3xl font-bold text-primary-600">
                      {Math.floor(stats.total_time / 60)}h {stats.total_time % 60}min
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Changement de mot de passe */}
      {activeTab === 'password' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Changer le mot de passe</h2>

          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Mot de passe actuel</label>
              <input
                type="password"
                className="input-field"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                className="input-field"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                minLength={6}
              />
              <p className="text-sm text-gray-500 mt-1">Minimum 6 caractères</p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="input-field"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-primary">
              Changer le mot de passe
            </button>
          </form>
        </div>
      )}

      {/* Tab: Abonnement */}
      {activeTab === 'subscription' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Abonnement & Crédits</h2>

          <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-6 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary-900">
                  Plan {subscriptionLabels[userData.subscription_type] || userData.subscription_type}
                </h3>
                <p className="text-primary-700">
                  {stats.has_active_subscription ? (
                    <>
                      Actif jusqu'au {new Date(userData.subscription_expires_at).toLocaleDateString('fr-FR')}
                    </>
                  ) : (
                    'Aucun abonnement actif'
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-600">Crédits photos restants</p>
                <p className="text-3xl font-bold text-primary-900">
                  {stats.photo_credits_remaining || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Stats projets */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l-4 border-purple-600 pl-4 py-2">
                <p className="font-medium text-gray-700">Projets créés</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_projects || 0}</p>
              </div>
              <div className="border-l-4 border-green-600 pl-4 py-2">
                <p className="font-medium text-gray-700">Projets terminés</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed_projects || 0}</p>
              </div>
            </div>

            {/* Stats photos IA */}
            <div className="border-l-4 border-pink-600 pl-4 py-2">
              <p className="font-medium text-gray-700">Photos IA générées</p>
              <p className="text-2xl font-bold text-pink-600">{stats.ai_photos_generated || 0}</p>
            </div>

            {/* Upgrade CTA pour FREE */}
            {userData.subscription_type === 'free' && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 p-4 rounded-lg">
                <p className="text-yellow-900 font-medium mb-2">
                  🎁 Plan Gratuit : 3 crédits photos IA par mois
                </p>
                <p className="text-yellow-800 text-sm mb-3">
                  Passez à un plan payant pour plus de crédits et fonctionnalités :
                </p>
                <ul className="text-sm text-yellow-800 mb-3 list-disc list-inside">
                  <li>Standard (4.99€/mois) : Projets illimités + 30 crédits photos</li>
                  <li>Premium (9.99€/mois) : Tout illimité + 120 crédits photos HD</li>
                </ul>
                <a href="/subscription" className="btn-primary inline-block">
                  Voir les offres Premium
                </a>
              </div>
            )}

            {/* Infos plan payant */}
            {userData.subscription_type !== 'free' && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 font-medium mb-1">
                  ✨ Merci d'être un membre {subscriptionLabels[userData.subscription_type]} !
                </p>
                <p className="text-green-700 text-sm">
                  Vous bénéficiez de projets illimités et de {
                    userData.subscription_type === 'monthly' ? '30' :
                    userData.subscription_type === 'yearly' ? '120' : 'nombreux'
                  } crédits photos IA par mois.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Supprimer le compte */}
      {activeTab === 'delete' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 text-red-600">Supprimer mon compte</h2>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <p className="text-red-800 font-medium mb-2">⚠️ Attention : Cette action est irréversible</p>
            <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
              <li>Tous vos projets de tricot/crochet seront supprimés</li>
              <li>Toutes vos photos et générations IA seront perdues</li>
              <li>Votre historique de paiements sera perdu</li>
              <li>Votre abonnement sera annulé (sans remboursement)</li>
              <li>Vous ne pourrez pas récupérer votre compte</li>
            </ul>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Je veux supprimer mon compte
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              <p className="text-gray-700 mb-4 font-medium">
                Pour confirmer la suppression, veuillez entrer votre mot de passe :
              </p>

              <div className="mb-6">
                <input
                  type="password"
                  className="input-field"
                  placeholder="Mot de passe"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Confirmer la suppression
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword('')
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile
