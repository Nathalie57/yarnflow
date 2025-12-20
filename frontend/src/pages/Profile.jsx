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
    free: 'FREE Beta',
    pro: 'PRO Beta',
    pro_annual: 'PRO Annuel',
    early_bird: 'Early Bird'
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
        <nav className="flex gap-4 md:gap-8">
          {[
            { id: 'info', label: 'Informations', icon: '👤' },
            { id: 'password', label: 'Mot de passe', icon: '🔒' },
            { id: 'subscription', label: 'Abonnement', icon: '💳' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSuccessMessage('')
                setErrorMessage('')
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors whitespace-nowrap ${
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
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">🧶 Projets totaux</p>
                    <p className="text-2xl font-bold text-primary-600">{stats.total_projects || 0}</p>
                  </div>
                  <div className="bg-warm-100 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">⏱️ Projets actifs</p>
                    <p className="text-2xl font-bold text-primary-600">{stats.active_projects || 0}</p>
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
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">🎨 Crédits restants</p>
                    <p className="text-2xl font-bold text-primary-600">{stats.photo_credits_remaining || 0}</p>
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
                      {(() => {
                        const hours = Math.floor(stats.total_time / 3600)
                        const minutes = Math.floor((stats.total_time % 3600) / 60)
                        const seconds = stats.total_time % 60

                        if (hours > 0) {
                          return `${hours}h ${minutes}min`
                        } else if (minutes > 0) {
                          return `${minutes}min ${seconds}s`
                        } else {
                          return `${seconds}s`
                        }
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
                  {stats.has_active_subscription && userData.subscription_expires_at ? (
                    <>
                      Actif jusqu'au {new Date(userData.subscription_expires_at).toLocaleDateString('fr-FR')}
                    </>
                  ) : (
                    'Aucune limite de temps'
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
              <div className="border-l-4 border-primary-600 pl-4 py-2">
                <p className="font-medium text-gray-700">Projets créés</p>
                <p className="text-2xl font-bold text-primary-600">{stats.total_projects || 0}</p>
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

            {/* Message Beta FREE */}
            {userData.subscription_type === 'free' && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 p-4 rounded-lg">
                <p className="text-blue-900 font-medium mb-2">
                  🧶 Plan FREE Beta
                </p>
                <ul className="text-sm text-blue-800 mb-3 list-disc list-inside space-y-1">
                  <li>3 projets actifs maximum</li>
                  <li>5 crédits photos par mois</li>
                  <li>Accès à toutes les fonctionnalités de base</li>
                </ul>
                <p className="text-xs text-blue-700 mt-3">
                  💡 Merci de tester YarnFlow ! Vos retours sont précieux pour améliorer l'app.
                </p>
              </div>
            )}

            {/* Message Beta PLUS */}
            {(userData.subscription_type === 'plus' || userData.subscription_type === 'plus_annual') && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300 p-4 rounded-lg">
                <p className="text-purple-900 font-medium mb-2">
                  ✨ Plan PLUS Beta - Merci d'être testeur PLUS !
                </p>
                <ul className="text-sm text-purple-800 mb-3 list-disc list-inside space-y-1">
                  <li>7 projets actifs</li>
                  <li>15 crédits photos par mois</li>
                  <li>Organisation premium</li>
                  <li>Support prioritaire</li>
                </ul>
                <p className="text-sm text-purple-700 mt-3">
                  {stats.has_active_subscription && userData.subscription_expires_at && (
                    <>
                      🎁 Votre accès PLUS est offert jusqu'au{' '}
                      <strong>{new Date(userData.subscription_expires_at).toLocaleDateString('fr-FR')}</strong>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Message Beta PRO */}
            {(userData.subscription_type === 'pro' || userData.subscription_type === 'pro_annual' || userData.subscription_type === 'early_bird') && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-300 p-4 rounded-lg">
                <p className="text-orange-900 font-medium mb-2">
                  ✨ Plan PRO Beta - Merci d'être testeur PRO !
                </p>
                <ul className="text-sm text-orange-800 mb-3 list-disc list-inside space-y-1">
                  <li>Projets illimités</li>
                  <li>30 crédits photos par mois</li>
                  <li>Bibliothèque de patrons illimitée</li>
                  <li>Accès premium aux nouveautés</li>
                </ul>
                <p className="text-sm text-orange-700 mt-3">
                  {stats.has_active_subscription && userData.subscription_expires_at && (
                    <>
                      🎁 Votre accès PRO est offert jusqu'au{' '}
                      <strong>{new Date(userData.subscription_expires_at).toLocaleDateString('fr-FR')}</strong>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
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

      {/* Zone dangereuse - Suppression de compte */}
      <div className="card border-2 border-red-200 mt-8">
        <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Zone dangereuse</h2>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
          <p className="text-red-800 font-medium mb-2">Supprimer mon compte</p>
          <p className="text-sm text-red-700 mb-3">
            Cette action est irréversible. Tous vos projets, photos IA et données seront définitivement supprimés.
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Pour des raisons de sécurité, la suppression de compte nécessite une vérification par email.
          </p>
          <a
            href={`mailto:support@yarnflow.fr?subject=Demande de suppression de compte&body=Bonjour,%0D%0A%0D%0AJe souhaite supprimer mon compte YarnFlow associé à l'email : ${userData.email}%0D%0A%0D%0AJe comprends que cette action est irréversible et que toutes mes données seront définitivement supprimées.%0D%0A%0D%0AMerci.`}
            className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            📧 Demander la suppression par email
          </a>
        </div>

        <p className="text-xs text-gray-500">
          💡 Vous recevrez une confirmation par email avant la suppression définitive.
        </p>
      </div>
    </div>
  )
}

export default Profile
