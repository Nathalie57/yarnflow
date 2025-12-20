/**
 * @file ForgotPassword.jsx
 * @brief Page de demande de réinitialisation de mot de passe
 * @author Claude AI Assistant
 * @created 2025-12-07
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/forgot-password', { email })

      console.log('[FORGOT PASSWORD] Réponse:', response.data)

      if (response.data.success) {
        console.log('[FORGOT PASSWORD] Succès, affichage message')
        setSuccess(true)
      } else {
        setError(response.data.error || 'Erreur inconnue')
      }
    } catch (err) {
      console.error('[FORGOT PASSWORD] Erreur:', err)
      console.error('[FORGOT PASSWORD] Response:', err.response?.data)
      setError(err.response?.data?.error || err.response?.data?.message || 'Erreur lors de la demande. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            📧 Email envoyé !
          </h1>

          <p className="text-gray-600 mb-6">
            Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec un lien de réinitialisation.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800">
              ⏱️ Le lien est valide pendant <strong>1 heure</strong>.<br />
              Vérifiez aussi vos spams si vous ne le voyez pas.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            Pas de souci ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </>
            ) : (
              '📧 Envoyer le lien'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-2">
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm block"
          >
            ← Retour à la connexion
          </Link>
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
