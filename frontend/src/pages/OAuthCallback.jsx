import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

/**
 * [AI:Claude] Page de callback OAuth pour Google et Facebook
 * Cette page gère le retour après l'autorisation OAuth
 */
const OAuthCallback = () => {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(true)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    // [AI:Claude] Empêcher le double appel
    if (hasRun) return
    setHasRun(true)

    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const provider = window.location.pathname.includes('google') ? 'google' : 'facebook'

        console.log('🔍 OAuth Callback - Code:', code)
        console.log('🔍 OAuth Callback - Provider:', provider)

        if (!code) {
          setError(t('oauthCallback.missingCode'))
          setProcessing(false)
          return
        }

        // [AI:Claude] Appeler l'API backend pour échanger le code contre un token
        const endpoint = provider === 'google' ? '/auth/google/callback' : '/auth/facebook/callback'
        console.log('🔍 OAuth Callback - Calling:', endpoint)

        const response = await api.get(`${endpoint}?code=${code}`, {
          timeout: 10000 // 10 secondes de timeout
        })
        console.log('🔍 OAuth Callback - Response:', response.data)

        if (response.data && response.data.data && response.data.data.user && response.data.data.token) {
          // [AI:Claude] Sauvegarder le token et l'utilisateur
          const { user, token } = response.data.data
          console.log('✅ OAuth Callback - User:', user)
          console.log('✅ OAuth Callback - Token:', token.substring(0, 20) + '...')

          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          console.log('✅ OAuth Callback - Saved to localStorage')

          // [AI:Claude] Mettre à jour le contexte d'authentification
          updateUser(user)
          console.log('✅ OAuth Callback - Updated context')

          // [AI:Claude] Rediriger vers le dashboard
          console.log('✅ OAuth Callback - Redirecting to /dashboard')
          navigate('/dashboard', { replace: true })
        } else {
          console.error('❌ OAuth Callback - Invalid response structure:', response.data)
          setError(t('oauthCallback.genericError'))
          setProcessing(false)
        }

      } catch (err) {
        console.error('❌ OAuth callback error:', err)
        console.error('❌ Error response:', err.response?.data)
        setError(err.response?.data?.error || err.response?.data?.message || t('oauthCallback.authError'))
        setProcessing(false)
      }
    }

    handleOAuthCallback()
  }, [searchParams, navigate, updateUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="card max-w-md w-full text-center">
        {processing ? (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('oauthCallback.processing')}</h2>
            <p className="text-gray-600">{t('oauthCallback.processingDesc')}</p>
          </>
        ) : error ? (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-700 mb-2">{t('oauthCallback.errorTitle')}</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              {t('oauthCallback.backToLogin')}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default OAuthCallback
