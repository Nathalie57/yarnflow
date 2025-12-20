/**
 * @file UserModal.jsx
 * @brief Modal détails utilisateur pour admin avec onglets
 * @author Claude + Nathalie
 * @version 0.15.0
 * @date 2025-12-19
 */

import { useState } from 'react'
import PropTypes from 'prop-types'
import api from '../../services/api'

const UserModal = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(false)
  const [creditsAmount, setCreditsAmount] = useState(50)

  const tabs = [
    { id: 'info', label: 'Informations', icon: 'ℹ️' },
    { id: 'subscription', label: 'Abonnement', icon: '💳' },
    { id: 'credits', label: 'Crédits', icon: '🎟️' },
    { id: 'projects', label: 'Projets', icon: '📦' },
    { id: 'payments', label: 'Paiements', icon: '💰' },
    { id: 'actions', label: 'Actions', icon: '⚡' }
  ]

  const handleUpdateSubscription = async (subscriptionType) => {
    if (!confirm(`Passer l'utilisateur en ${subscriptionType} ?`)) return

    setLoading(true)
    try {
      await api.put(`/admin/users/${user.id}/subscription`, {
        subscription_type: subscriptionType
      })
      alert('Abonnement mis à jour avec succès')
      onUpdate()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      alert(error.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setLoading(false)
    }
  }

  const handleManageCredits = async (action) => {
    if (!creditsAmount || creditsAmount <= 0) {
      alert('Veuillez entrer un nombre de crédits valide')
      return
    }

    const actionText = action === 'add' ? 'ajouter' : 'retirer'
    if (!confirm(`${actionText.charAt(0).toUpperCase()}${actionText.slice(1)} ${creditsAmount} crédits ?`)) return

    setLoading(true)
    try {
      await api.post(`/admin/users/${user.id}/credits`, {
        credits: parseInt(creditsAmount),
        action
      })
      alert(`${creditsAmount} crédits ${action === 'add' ? 'ajoutés' : 'retirés'} avec succès`)
      setCreditsAmount(50)
      onUpdate()
    } catch (error) {
      console.error('Erreur gestion crédits:', error)
      alert(error.response?.data?.error || 'Erreur lors de la gestion des crédits')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async () => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? 'passer en admin' : 'retirer les droits admin'

    if (!confirm(`Voulez-vous ${action} cet utilisateur ?`)) return

    setLoading(true)
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole })
      alert(`Rôle modifié en ${newRole}`)
      onUpdate()
    } catch (error) {
      console.error('Erreur changement rôle:', error)
      alert(error.response?.data?.error || 'Erreur lors du changement de rôle')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleBan = async () => {
    const newBanStatus = !user.is_banned
    const action = newBanStatus ? 'bannir' : 'débannir'

    if (!confirm(`Voulez-vous ${action} cet utilisateur ?`)) return

    setLoading(true)
    try {
      await api.put(`/admin/users/${user.id}/ban`, { is_banned: newBanStatus })
      alert(`Utilisateur ${action === 'bannir' ? 'banni' : 'débanni'}`)
      onUpdate()
    } catch (error) {
      console.error('Erreur ban/unban:', error)
      alert(error.response?.data?.error || 'Erreur lors du changement de statut')
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionLabel = (type) => {
    const labels = {
      free: 'FREE',
      plus: 'PLUS Mensuel',
      plus_annual: 'PLUS Annuel',
      pro: 'PRO Mensuel',
      pro_annual: 'PRO Annuel',
      early_bird: 'Early Bird'
    }
    return labels[type] || type
  }

  const getSubscriptionColor = (type) => {
    if (type === 'free') return 'bg-gray-100 text-gray-800'
    if (type.startsWith('plus')) return 'bg-blue-100 text-blue-800'
    if (type.startsWith('pro') || type === 'early_bird') return 'bg-primary-100 text-primary-800'
    return 'bg-gray-100 text-gray-800'
  }

  const totalCredits = (user.credits?.monthly_credits || 0) + (user.credits?.purchased_credits || 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getSubscriptionColor(user.subscription_type)}`}>
                  {getSubscriptionLabel(user.subscription_type)}
                </span>
                {user.is_banned && (
                  <span className="px-2 py-1 rounded text-xs font-bold bg-red-500 text-white">
                    BANNI
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Informations */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID</label>
                  <p className="text-gray-900">{user.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Prénom</label>
                  <p className="text-gray-900">{user.first_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom</label>
                  <p className="text-gray-900">{user.last_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Inscrit le</label>
                  <p className="text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dernière connexion</label>
                  <p className="text-gray-900">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{user.stats?.total_projects || 0}</div>
                  <div className="text-sm text-gray-600">Projets</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{totalCredits}</div>
                  <div className="text-sm text-gray-600">Crédits photos</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{user.stats?.total_spent || 0}€</div>
                  <div className="text-sm text-gray-600">Dépensé</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Abonnement */}
          {activeTab === 'subscription' && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold mb-4">Changer l'abonnement</h3>
              {['free', 'plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleUpdateSubscription(type)}
                  disabled={loading || user.subscription_type === type}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    user.subscription_type === type
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{getSubscriptionLabel(type)}</div>
                      <div className="text-sm text-gray-600">
                        {type === 'free' && '3 projets actifs, 5 crédits/mois'}
                        {type === 'plus' && '2.99€/mois - 7 projets, 15 crédits/mois'}
                        {type === 'plus_annual' && '29.99€/an - 7 projets, 15 crédits/mois'}
                        {type === 'pro' && '4.99€/mois - Projets illimités, 30 crédits/mois'}
                        {type === 'pro_annual' && '49.99€/an - Projets illimités, 30 crédits/mois'}
                        {type === 'early_bird' && '2.99€/mois x12 - Accès PRO complet'}
                      </div>
                    </div>
                    {user.subscription_type === type && (
                      <span className="text-primary-600 font-bold">✓ Actuel</span>
                    )}
                  </div>
                </button>
              ))}
              {user.subscription_expires_at && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Expire le:</strong> {new Date(user.subscription_expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Crédits */}
          {activeTab === 'credits' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-primary-600">{totalCredits}</div>
                  <div className="text-sm text-gray-600">Crédits disponibles</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600">{user.credits?.total_credits_used || 0}</div>
                  <div className="text-sm text-gray-600">Crédits utilisés (total)</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{user.credits?.monthly_credits || 0}</div>
                  <div className="text-sm text-gray-600">Crédits mensuels</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{user.credits?.purchased_credits || 0}</div>
                  <div className="text-sm text-gray-600">Crédits achetés</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-bold mb-4">Gérer les crédits</h3>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de crédits
                    </label>
                    <input
                      type="number"
                      value={creditsAmount}
                      onChange={(e) => setCreditsAmount(e.target.value)}
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="50"
                    />
                  </div>
                  <button
                    onClick={() => handleManageCredits('add')}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    ➕ Ajouter
                  </button>
                  <button
                    onClick={() => handleManageCredits('remove')}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    ➖ Retirer
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Les crédits ajoutés seront marqués comme "crédits achetés"
                </p>
              </div>
            </div>
          )}

          {/* Tab: Projets */}
          {activeTab === 'projects' && (
            <div>
              <h3 className="text-lg font-bold mb-4">Projets de l'utilisateur ({user.projects?.length || 0})</h3>
              {user.projects && user.projects.length > 0 ? (
                <div className="space-y-2">
                  {user.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{project.name}</span>
                          {project.is_favorite == 1 && <span>⭐</span>}
                        </div>
                        <div className="text-sm text-gray-600">
                          {project.technique} • {project.type || 'Type non défini'} • {project.total_rows || 0} rangs
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'completed' ? 'Terminé' :
                         project.status === 'in_progress' ? 'En cours' : project.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun projet</p>
              )}
            </div>
          )}

          {/* Tab: Paiements */}
          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-bold mb-4">Historique des paiements</h3>
              {user.payments && user.payments.length > 0 ? (
                <div className="space-y-2">
                  {user.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{payment.amount}€</div>
                        <div className="text-sm text-gray-600">
                          {payment.payment_type} • {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucun paiement</p>
              )}
            </div>
          )}

          {/* Tab: Actions */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-4">Actions rapides</h3>

              <button
                onClick={handleToggleAdmin}
                disabled={loading}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  user.role === 'admin'
                    ? 'border-red-300 bg-red-50 hover:bg-red-100'
                    : 'border-primary-300 bg-primary-50 hover:bg-primary-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{user.role === 'admin' ? '👤' : '⭐'}</span>
                  <div>
                    <div className="font-bold">{user.role === 'admin' ? 'Retirer Admin' : 'Passer Admin'}</div>
                    <div className="text-sm text-gray-600">
                      {user.role === 'admin' ? 'Rétrograder en utilisateur normal' : 'Promouvoir en administrateur'}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={handleToggleBan}
                disabled={loading}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                  user.is_banned
                    ? 'border-green-300 bg-green-50 hover:bg-green-100'
                    : 'border-red-300 bg-red-50 hover:bg-red-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{user.is_banned ? '✅' : '🚫'}</span>
                  <div>
                    <div className="font-bold">{user.is_banned ? 'Débannir' : 'Bannir'}</div>
                    <div className="text-sm text-gray-600">
                      {user.is_banned ? 'Réactiver le compte utilisateur' : 'Bloquer l\'accès au compte'}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => alert('Fonctionnalité à venir')}
                className="w-full p-4 text-left border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔑</span>
                  <div>
                    <div className="font-bold">Réinitialiser mot de passe</div>
                    <div className="text-sm text-gray-600">Envoyer un email de réinitialisation</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => alert('Fonctionnalité à venir - Export RGPD')}
                className="w-full p-4 text-left border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div>
                    <div className="font-bold">Export données (RGPD)</div>
                    <div className="text-sm text-gray-600">Télécharger toutes les données utilisateur</div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

UserModal.propTypes = {
  user: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired
}

export default UserModal
