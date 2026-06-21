import { useState, useEffect } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'

const STORAGE_KEY = 'push_prompt_dismissed_at'
const COOLDOWN_DAYS = 21

const shouldShowBanner = () => {
  if (!('Notification' in window)) return false
  if (Notification.permission !== 'default') return false

  const dismissedAt = localStorage.getItem(STORAGE_KEY)
  if (!dismissedAt) return true

  const daysSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
  return daysSince >= COOLDOWN_DAYS
}

const PushNotificationBanner = () => {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isSupported && !isSubscribed) {
      setVisible(shouldShowBanner())
    }
  }, [isSupported, isSubscribed])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setVisible(false)
  }

  const handleSubscribe = async () => {
    setLoading(true)
    const result = await subscribe()
    setLoading(false)
    if (result.success || result.error === 'Permission refusée') {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
      setVisible(false)
    }
  }

  if (!visible) return null

  return (
    <div className="bg-primary-50 border-b border-primary-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm text-primary-800 truncate">
            Recevez des rappels pour reprendre vos projets en cours
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-60"
          >
            {loading ? 'Activation...' : 'Activer'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-primary-600 text-sm hover:text-primary-800 transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

export default PushNotificationBanner
