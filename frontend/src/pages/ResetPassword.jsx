/**
 * @file ResetPassword.jsx
 * @brief Page de réinitialisation de mot de passe avec token
 * @author Claude AI Assistant
 * @created 2025-12-07
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      setError('Token manquant')
      setVerifying(false)
      return
    }

    console.log('[RESET PASSWORD] Token extrait de l\'URL:', token)
    console.log('[RESET PASSWORD] Longueur du token:', token.length)

    const verifyToken = async () => {
      try {
        console.log('[RESET PASSWORD] Envoi requête verify-reset-token...')
        const response = await api.post('/auth/verify-reset-token', { token })
        console.log('[RESET PASSWORD] Réponse reçue:', response.data)

        if (response.data.valid) {
          setTokenValid(true)
          setEmail(response.data.email)
          console.log('[RESET PASSWORD] Token valide pour:', response.data.email)
        } else {
          console.error('[RESET PASSWORD] Token invalide:', response.data.error)
          setError(response.data.error || 'Lien invalide ou expiré')
        }
      } catch (err) {
        console.error('[RESET PASSWORD] Erreur vérification token:', err)
        console.error('[RESET PASSWORD] Réponse erreur:', err.response?.data)
        setError('Lien invalide ou expiré')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password
      })

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(response.data.error || 'Erreur lors de la réinitialisation')
      }
    } catch (err) {
      console.error('Erreur reset password:', err)
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation')
    } finally {
      setLoading(false)
    }
  }

  // État de vérification
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    )
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ Mot de passe réinitialisé !
          </h1>

          <p className="text-gray-600 mb-6">
            Votre mot de passe a été modifié avec succès.<br />
            Redirection vers la page de connexion...
          </p>

          <Link
            to="/login"
            className="block w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition"
          >
            Se connecter maintenant
          </Link>
        </div>
      </div>
    )
  }

  // Token invalide
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ⚠️ Lien invalide
          </h1>

          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="block w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition"
            >
              Demander un nouveau lien
            </Link>

            <Link
              to="/login"
              className="block w-full text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Formulaire de nouveau mot de passe
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-600">
            Pour <strong>{email}</strong>
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
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Au moins 8 caractères"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 8 caractères
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Retapez le mot de passe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Réinitialisation...' : '🔐 Réinitialiser le mot de passe'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
