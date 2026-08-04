import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useAuth } from '../contexts/AuthContext'
import { useAnalytics } from '../hooks/useAnalytics'
import api from '../services/api'
import PasswordInput from '../components/PasswordInput'

const Register = () => {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const betaCode = searchParams.get('beta')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    beta_code: betaCode || ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const { register, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { trackSignup } = useAnalytics()

  // [AI:Claude] Une soumission depuis ce formulaire gère déjà sa propre
  // redirection (pendingImport, ?welcome=1) — l'effet ci-dessous ne doit se
  // déclencher que pour une session déjà valide au chargement de la page
  const submittedRef = useRef(false)

  // [AI:Claude] Déjà connecté (session valide restaurée au chargement) → ne pas
  // laisser l'utilisateur bloqué devant le formulaire, le rediriger direct
  useEffect(() => {
    if (!authLoading && user && !submittedRef.current) {
      navigate('/my-projects', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Reset loading quand l'app revient au premier plan (TWA/PWA)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') setLoading(false)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Charger les infos du code beta si présent
  useEffect(() => {
    if (betaCode) {
      setFormData(prev => ({ ...prev, beta_code: betaCode }))
    }
  }, [betaCode])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // [AI:Claude] Empêcher double-submit
    if (loading) {
      console.log('[Register] Double-submit bloqué')
      return
    }

    setError('')
    setLoading(true)
    submittedRef.current = true

    console.log('[Register] Envoi inscription...', formData.email)

    try {
      const result = await register(formData)
      console.log('[Register] Résultat:', result)

      if (result.success) {
        trackSignup('email')
        const pendingImport = localStorage.getItem('yf_pending_import')
        navigate(pendingImport ? `/import/${pendingImport}` : '/my-projects?welcome=1')
      } else {
        setError(result.error)
        setLoading(false)
      }
    } catch (err) {
      console.error('[Register] Exception:', err)
      setError(t('register.unexpectedError'))
      setLoading(false)
    }
  }

  // [AI:Claude] Gestion OAuth Google
  const handleGoogleRegister = async () => {
    try {
      setOauthLoading(true)
      setError('')

      // [AI:Claude] Obtenir l'URL d'autorisation Google
      const response = await api.get('/auth/google/url')
      const authUrl = response.data.data.auth_url

      // [AI:Claude] Rediriger vers la page d'autorisation Google
      window.location.href = authUrl

    } catch (err) {
      console.error('Erreur Google Register:', err)
      setError(t('register.googleError'))
      setOauthLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      {/* [AI:Claude] Selecteur de langue : ces pages n utilisent pas Layout, donc pas de Navbar */}
      <LanguageSwitcher className="fixed top-4 right-4 z-50 shadow-sm" />

      <div className="card max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">🧶 YarnFlow</h1>
        <p className="text-gray-600 text-center mb-6">{t('register.subtitle')}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('register.firstName')} <span className="text-gray-500 text-sm">{t('register.optional')}</span></label>
            <input
              type="text"
              name="first_name"
              className="input-field"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('shared.email')}</label>
            <input
              type="email"
              name="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">{t('shared.password')}</label>
            <PasswordInput
              name="password"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <p className="text-sm text-gray-500 mt-1">{t('register.passwordHint')}</p>
          </div>

          {/* Code Beta */}
          {betaCode && (
            <div className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-orange-50 border-2 border-primary-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎉</span>
                <span className="font-bold text-primary-800">{t('register.betaTitle')}</span>
              </div>
              <p className="text-sm text-primary-700 mb-2">
                {t('register.betaDesc')}
              </p>
              <div className="bg-white rounded px-3 py-2 font-mono text-sm font-bold text-primary-600 border border-primary-200">
                {betaCode}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || oauthLoading}
          >
            {loading ? t('register.submitting') : t('register.submit')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">{t('shared.orSignUpWith')}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleRegister}
          disabled={loading || oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {oauthLoading ? t('register.submitting') : t('shared.continueWithGoogle')}
        </button>

        <p className="text-center mt-6 text-gray-600">
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('register.login')}
          </Link>
        </p>

        <p className="text-center mt-4 text-sm text-gray-500">
          {t('shared.needHelp')}{' '}
          <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
            {t('shared.contactUs')}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
