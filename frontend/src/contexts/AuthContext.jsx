import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI, refreshTokenSilently } from '../services/api'

const AuthContext = createContext(null)

// Décode le payload JWT côté client (sans vérification de signature) pour lire l'exp
const getTokenExpiry = (token) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload?.exp ?? null
  } catch {
    return null
  }
}

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
  const isLoadingUser = useRef(false)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      isLoadingUser.current = true
      const token = storage.getItem('token')
      if (!token) { setLoading(false); isLoadingUser.current = false; return }

      // Afficher le user stocké immédiatement pour éviter le flash de chargement
      const storedUser = storage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch {
          // JSON corrompu — on continue quand même avec le token
        }
      }

      // Refresh proactif : si le token expire dans moins de 7 jours, on rafraîchit avant même
      // d'appeler /auth/me pour éviter le cycle 401 → refresh → retry au réveil.
      // On utilise une instance axios sans intercepteurs pour éviter toute boucle.
      const exp = getTokenExpiry(token)
      if (exp !== null) {
        const sevenDays = 7 * 24 * 60 * 60
        const secondsLeft = exp - Math.floor(Date.now() / 1000)
        if (secondsLeft < sevenDays) {
          try {
            const newToken = await refreshTokenSilently(token)
            if (newToken) storage.setItem('token', newToken)
          } catch {
            // Refresh proactif échoué (serveur down, token trop vieux) — on continue
          }
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
      isLoadingUser.current = false
    }

    loadUser()
  }, [])

  // Refresh des données user quand l'app repasse au premier plan (fix déconnexion Android)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) return
      if (isLoadingUser.current) return  // loadUser() tourne encore au cold start, on attend

      const token = storage.getItem('token')
      if (!token) return

      // Throttle : max une vérification toutes les 60 secondes
      const now = Date.now()
      if (now - lastVisibilityCheck.current < 60000) return
      lastVisibilityCheck.current = now

      try {
        // _noAutoLogout : la validation au démarrage (loadUser) est déjà le gardien de session.
        // Le handler de visibilité sert à rafraîchir les données user, pas à valider l'auth.
        // On ne déconnecte pas depuis ici pour éviter les faux positifs (réseau lent au réveil).
        const response = await authAPI.me({ _noAutoLogout: true })
        const freshUser = response?.data?.data?.user
        if (freshUser) {
          setUser(freshUser)
          storage.setItem('user', JSON.stringify(freshUser))
        }
      } catch {
        // Silencieux — erreur réseau, serveur temporaire, etc.
        // Si le token est vraiment révoqué, le prochain loadUser() au redémarrage le détectera.
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

  // Retourne le tier exact : 'free' | 'plus' | 'pro'
  const getSubscriptionPlan = () => {
    if (!user) return 'free'
    const type = user.subscription_type
    if (type === 'plus' || type === 'plus_annual') return 'plus'
    if (type === 'free' || !hasActiveSubscription()) return 'free'
    return 'pro' // pro, pro_annual, early_bird
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
    hasActiveSubscription,
    getSubscriptionPlan,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
