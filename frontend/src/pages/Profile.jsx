import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { userAPI } from '../services/api'
import PasswordInput from '../components/PasswordInput'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTranslation, Trans } from 'react-i18next'

const Profile = () => {
  const { t, i18n } = useTranslation('tools')
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [activeTab, setActiveTab] = useState('info')

  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '' })

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [inactivityReminder, setInactivityReminder] = useState(true)
  const { isSupported: pushSupported, isSubscribed, isLoading: pushLoading, permission, subscribe, unsubscribe } = usePushNotifications()

  useEffect(() => { loadProfile() }, [])

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
      setInactivityReminder(Number(data.user.inactivity_reminder_enabled) !== 0)
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
      setSuccessMessage(t('ui.profileUpdated'))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || t('ui.profileUpdateFailed'))
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
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setSuccessMessage(t('ui.passwordChanged'))
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erreur lors du changement de mot de passe')
    }
  }

  const handleToggleInactivityReminder = async (value) => {
    setInactivityReminder(value)
    try {
      await userAPI.updateProfile({ inactivity_reminder_enabled: value ? 1 : 0 })
    } catch {
      setInactivityReminder(!value)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">{t('ui.loading')}</div>
      </div>
    )
  }

  if (!profileData) {
    return <div className="card"><p className="text-red-600">{t('ui.profileLoadError')}</p></div>
  }

  const { user: userData, stats } = profileData
  const isPro = userData.subscription_type && userData.subscription_type !== 'free'

  const planLabel = isPro ? 'PRO' : 'FREE'

  const tabs = [
    {
      id: 'info', labelKey: 'tabMyAccount',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    },
    {
      id: 'password', labelKey: 'tabPassword',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    }
  ]

  return (
    <>
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{t('ui.myProfile')}</h1>

      {successMessage && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSuccessMessage(''); setErrorMessage('') }}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.labelKey ? t(`ui.${tab.labelKey}`) : tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Mon compte */}
      {activeTab === 'info' && (
        <div className="space-y-6">

          {/* Informations personnelles */}
          <div className="card">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{t('ui.personalInfo')}</h2>
              {!editMode && (
                <button onClick={() => setEditMode(true)} className="btn-secondary text-sm">
                  {t('ui.edit')}
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">{t('ui.firstName')}</label>
                    <input type="text" className="input-field" value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">{t('ui.nameLabel')}</label>
                    <input type="text" className="input-field" value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm text-gray-700 mb-1.5">{t('ui.email')}</label>
                  <input type="email" className="input-field" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">{t('ui.save')}</button>
                  <button type="button" onClick={() => {
                    setEditMode(false)
                    setFormData({ first_name: userData.first_name || '', last_name: userData.last_name || '', email: userData.email || '' })
                  }} className="btn-secondary">{t('ui.cancel')}</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('ui.firstName')}</p>
                    <p className="font-medium text-gray-900">{userData.first_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{t('ui.nameLabel')}</p>
                    <p className="font-medium text-gray-900">{userData.last_name || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{t('ui.email')}</p>
                  <p className="font-medium text-gray-900">{userData.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{t('ui.memberSince')}</p>
                  <p className="font-medium text-gray-900">
                    {new Date(userData.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Abonnement */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{t('ui.subscription')}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPro ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                {planLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.total_projects || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{t('ui.projectsNav')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.completed_projects || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{t('ui.doneP')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-primary-600">{stats.photo_credits_remaining || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{t('ui.photoCredits')}</p>
              </div>
            </div>

            {stats.total_time > 0 && (
              <div className="p-3 bg-primary-50 rounded-lg mb-5">
                <p className="text-xs text-gray-500 mb-0.5">{t('ui.totalKnitTime')}</p>
                <p className="text-xl font-bold text-primary-600">
                  {(() => {
                    const hours = Math.floor(stats.total_time / 3600)
                    const minutes = Math.floor((stats.total_time % 3600) / 60)
                    if (hours > 0) return `${hours}h ${minutes}min`
                    if (minutes > 0) return `${minutes}min`
                    return `${stats.total_time % 60}s`
                  })()}
                </p>
              </div>
            )}

            {!isPro && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-3">
                  <Trans t={t} i18nKey="ui.goProForUnlimited"><strong /></Trans>
                </p>
                <Link to="/subscription" className="inline-block px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition">
                  {t('ui.discoverPro')}
                </Link>
              </div>
            )}

            {isPro && stats.has_active_subscription && userData.subscription_expires_at && (
              <p className="text-sm text-gray-600">
                
                <Trans t={t} i18nKey="ui.accessActiveUntil" values={{ date: new Date(userData.subscription_expires_at).toLocaleDateString(i18n.language) }}><strong /></Trans>
              </p>
            )}
          </div>

          {/* Aide */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('ui.helpAndContact2')}</h2>

            <Link
              to="/contact"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-200 rounded-lg transition group"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-primary-700 text-sm">{t('ui.contactUsAlt')}</p>
                <p className="text-xs text-gray-500">{t('ui.questionOrProblem')}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <a
              href="https://www.facebook.com/groups/844543658285999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 mt-3 bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-200 rounded-lg transition group"
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium text-gray-900 group-hover:text-primary-700 text-sm">{t('ui.joinCommunity')}</p>
                <p className="text-xs text-gray-500">{t('ui.joinCommunityDesc')}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          {/* Notifications */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('ui.notifications')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('ui.inactivityReminder')}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t('ui.inactivityEmail')}</p>
                </div>
                <button
                  onClick={() => handleToggleInactivityReminder(!inactivityReminder)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${inactivityReminder ? 'bg-primary-600' : 'bg-gray-200'}`}
                  role="switch"
                  aria-checked={inactivityReminder}
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${inactivityReminder ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {pushSupported && (
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('ui.pushNotifications')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {permission === 'denied'
                        ? t('ui.pushBlocked')
                        : t('ui.pushReminders')}
                    </p>
                  </div>
                  {permission === 'denied' ? (
                    <span className="text-xs text-gray-500 flex-shrink-0">{t('ui.reserved')}</span>
                  ) : (
                    <button
                      onClick={isSubscribed ? unsubscribe : subscribe}
                      disabled={pushLoading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${isSubscribed ? 'bg-primary-600' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={isSubscribed}
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Zone dangereuse */}
          <div className="card border border-red-200">
            <h2 className="text-base font-semibold text-red-600 mb-3">{t('ui.dangerZone')}</h2>
            <p className="text-sm text-gray-600 mb-3">
              {t('ui.deleteAccountWarning')}
            </p>
            <a
              href={`mailto:support@yarnflow.fr?subject=Demande de suppression de compte&body=Bonjour,%0D%0A%0D%0AJe souhaite supprimer mon compte YarnFlow associé à l'email : ${userData.email}%0D%0A%0D%0AJe comprends que cette action est irréversible et que toutes mes données seront définitivement supprimées.%0D%0A%0D%0AMerci.`}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              {t('ui.requestDeletionByEmail')}
            </a>
          </div>
        </div>
      )}

      {/* Tab: Mot de passe */}
      {activeTab === 'password' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">{t('ui.changePassword')}</h2>
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1.5">{t('ui.currentPassword')}</label>
              <PasswordInput className="input-field" value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1.5">{t('ui.newPassword')}</label>
              <PasswordInput className="input-field" value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })} required minLength={6} />
              <p className="text-xs text-gray-500 mt-1">{t('ui.minSixChars')}</p>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-1.5">{t('ui.confirmNewPassword')}</label>
              <PasswordInput className="input-field" value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })} required minLength={6} />
            </div>
            <button type="submit" className="btn-primary">{t('ui.changePassword')}</button>
          </form>
        </div>
      )}
    </div>

    </>
  )
}

export default Profile
