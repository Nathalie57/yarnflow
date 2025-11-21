import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const AdminPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    loadPayments()
  }, [filter, dateRange])

  const loadPayments = async () => {
    try {
      const response = await adminAPI.getPayments({ status: filter, period: dateRange })
      setPayments(response.data.data)
    } catch (error) {
      console.error('Erreur chargement paiements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Complété', class: 'bg-green-100 text-green-800' },
      failed: { label: 'Échoué', class: 'bg-red-100 text-red-800' },
      refunded: { label: 'Remboursé', class: 'bg-gray-100 text-gray-800' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.class}`}>
        {badge.label}
      </span>
    )
  }

  const getPaymentTypeLabel = (type) => {
    const types = {
      pattern: 'Patron',
      subscription_monthly: 'Abonnement mensuel',
      subscription_yearly: 'Abonnement annuel'
    }
    return types[type] || type
  }

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const filteredPayments = payments.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    return true
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
      <h1 className="text-3xl font-bold mb-6">💰 Gestion des Paiements</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card bg-green-50 border-l-4 border-green-500">
          <h3 className="text-gray-600 mb-2">Revenus totaux</h3>
          <p className="text-3xl font-bold text-green-600">
            {totalRevenue.toFixed(2)} €
          </p>
        </div>

        <div className="card">
          <h3 className="text-gray-600 mb-2">Paiements complétés</h3>
          <p className="text-3xl font-bold text-primary-600">
            {payments.filter(p => p.status === 'completed').length}
          </p>
        </div>

        <div className="card">
          <h3 className="text-gray-600 mb-2">En attente</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </div>

        <div className="card">
          <h3 className="text-gray-600 mb-2">Remboursements</h3>
          <p className="text-3xl font-bold text-gray-600">
            {payments.filter(p => p.status === 'refunded').length}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded ${
                filter === 'completed' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Complétés
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded ${
                filter === 'failed' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Échoués
            </button>
            <button
              onClick={() => setFilter('refunded')}
              className={`px-4 py-2 rounded ${
                filter === 'refunded' ? 'bg-primary-500 text-white' : 'bg-gray-100'
              }`}
            >
              Remboursés
            </button>
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">ID Transaction</th>
                <th className="text-left p-3">Utilisateur</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Montant</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">
                    {payment.stripe_payment_intent_id?.slice(0, 20) || payment.id}...
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{payment.user_name || 'Utilisateur'}</div>
                    <div className="text-xs text-gray-600">{payment.user_email}</div>
                  </td>
                  <td className="p-3">{getPaymentTypeLabel(payment.payment_type)}</td>
                  <td className="p-3 text-right font-bold">
                    {parseFloat(payment.amount).toFixed(2)} €
                  </td>
                  <td className="p-3">{getStatusBadge(payment.status)}</td>
                  <td className="p-3">
                    {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                    <div className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleTimeString('fr-FR')}
                    </div>
                  </td>
                  <td className="p-3">
                    {payment.status === 'completed' && (
                      <button
                        onClick={() => alert('Fonctionnalité de remboursement à venir')}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Rembourser
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <p className="text-center text-gray-500 py-8">Aucun paiement trouvé</p>
        )}
      </div>

      {/* Boutons d'export */}
      <div className="card mt-6">
        <h2 className="text-xl font-bold mb-4">Export comptable</h2>
        <div className="flex gap-4">
          <button
            onClick={() => alert('Export CSV à venir')}
            className="btn-secondary"
          >
            📥 Exporter en CSV
          </button>
          <button
            onClick={() => alert('Export PDF à venir')}
            className="btn-secondary"
          >
            📥 Exporter en PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPayments
