import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

// [AI:Claude] Helper de stockage robuste (localStorage avec fallback sessionStorage)
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (e) {
      console.warn('[Storage] Erreur lecture:', e)
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn('[Storage] localStorage plein, utilisation sessionStorage')
      try {
        sessionStorage.setItem(key, value)
      } catch (e2) {
        console.error('[Storage] Impossible de sauvegarder:', e2)
      }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (e) {
      console.warn('[Storage] Erreur suppression:', e)
    }
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const lastVisibilityCheck = useRef(0)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const token = storage.getItem('token')
      if (!token) { setLoading(false); return }

      // Afficher le user stocké immédiatement pour éviter le flash de chargement
      const storedUser = storage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          // JSON corrompu — on continue quand même avec le token
        }
      }

      // Valider le token côté serveur sans risquer de déconnecter en cas d'erreur réseau
      try {
        const response = await authAPI.me({ _noAutoLogout: true })
        const freshUser = response?.data?.data?.user
        if (freshUser) {
          setUser(freshUser)
          storage.setItem('user', JSON.stringify(freshUser))
        }
      } catch (err) {
        // Erreur réseau ou serveur temporaire → on garde la session locale
        // Seul un 401 confirmé (token révoqué) doit déconnecter
        if (err.response?.status === 401 && err._refreshFailed) {
          storage.removeItem('token')
          storage.removeItem('user')
          setUser(null)
        }
      }

      setLoading(false)
    }

    loadUser()
  }, [])

  // Refresh proactif quand l'app repasse au premier plan (fix déconnexion Android)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) return
      const token = storage.getItem('token')
      if (!token) return

      // Throttle : max une vérification toutes les 60 secondes
      const now = Date.now()
      if (now - lastVisibilityCheck.current < 60000) return
      lastVisibilityCheck.current = now

      try {
        const response = await authAPI.me()
        const freshUser = response?.data?.data?.user
        if (freshUser) setUser(freshUser)
      } catch {
        // L'intercepteur gère le refresh automatique si 401
        // Si le refresh échoue aussi, l'intercepteur redirige vers /login
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login({ email, password })
      const { user, token } = response.data.data

      storage.setItem('token', token)
      storage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (data) => {
    try {
      setError(null)
      console.log('[AuthContext] Appel API register...')
      const response = await authAPI.register(data)
      console.log('[AuthContext] Réponse API:', response.status, response.data)
      console.log('[AuthContext] response.data.data:', response.data.data)

      const { user, token } = response.data.data
      console.log('[AuthContext] user:', user)
      console.log('[AuthContext] token:', token ? 'présent' : 'MANQUANT')

      // [AI:Claude] Utiliser le helper storage robuste
      storage.setItem('token', token)
      storage.setItem('user', JSON.stringify(user))
      setUser(user)

      console.log('[AuthContext] Inscription réussie, user:', user?.email)
      return { success: true }
    } catch (err) {
      console.error('[AuthContext] Erreur inscription:', err.response?.status, err.response?.data)
      console.error('[AuthContext] Exception complète:', err.message, err)
      const message = err.response?.data?.message || 'Erreur d\'inscription'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    storage.removeItem('token')
    storage.removeItem('user')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    storage.setItem('user', JSON.stringify(userData))
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const hasActiveSubscription = () => {
    if (!user) return false
    if (user.subscription_type === 'free') return false

    const expiresAt = new Date(user.subscription_expires_at)
    return expiresAt > new Date()
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    hasActiveSubscription
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
