import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paymentsAPI } from '../services/api'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      setStatus('error')
      return
    }

    // Vérifier le statut du paiement
    const checkPayment = async () => {
      try {
        const response = await paymentsAPI.checkStatus(sessionId)
        const data = response.data.data

        if (data.status === 'completed' || data.status === 'paid') {
          setStatus('success')
          setPaymentInfo(data)
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Erreur vérification paiement:', error)
        setStatus('error')
      }
    }

    checkPayment()
  }, [searchParams])

  // Compte à rebours et redirection automatique
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }

    if (status === 'success' && countdown === 0) {
      // Rediriger selon le type de paiement
      if (paymentInfo?.type === 'credits') {
        navigate('/my-projects')
      } else if (paymentInfo?.type === 'subscription') {
        navigate('/my-projects')
      } else {
        navigate('/my-projects')
      }
    }
  }, [status, countdown, navigate, paymentInfo])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Vérification du paiement...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur de paiement</h1>
          <p className="text-gray-600 mb-6">
            Une erreur est survenue lors de la vérification de votre paiement.
          </p>
          <button
            onClick={() => navigate('/subscription')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Retour à l'abonnement
          </button>
        </div>
      </div>
    )
  }

  // Status = success
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icône de succès */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>

        {paymentInfo?.type === 'credits' && (
          <p className="text-gray-600 mb-6">
            Vos <strong>{paymentInfo.credits_amount || '?'} crédits photos</strong> ont été ajoutés à votre compte.
          </p>
        )}

        {paymentInfo?.type === 'subscription' && (
          <p className="text-gray-600 mb-6">
            Votre abonnement <strong>{paymentInfo.plan || '?'}</strong> est maintenant actif !
          </p>
        )}

        {!paymentInfo?.type && (
          <p className="text-gray-600 mb-6">
            Votre paiement a été traité avec succès.
          </p>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-purple-800">
            Un email de confirmation vous a été envoyé.
          </p>
        </div>

        {/* Compte à rebours */}
        <p className="text-gray-500 text-sm mb-4">
          Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}...
        </p>

        {/* Bouton de navigation */}
        <button
          onClick={() => navigate('/my-projects')}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          Aller à mes projets
        </button>
      </div>
    </div>
  )
}
