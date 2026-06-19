import { useState, useEffect } from 'react'
import api from '../services/api'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('[Push] Erreur vérification subscription:', err)
    }
  }

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, error: 'Push non supporté sur ce navigateur' }
    }

    setIsLoading(true)
    try {
      // Récupérer la clé publique VAPID
      const { data } = await api.get('/push/vapid-public-key')
      const vapidPublicKey = data.public_key

      if (!vapidPublicKey) {
        return { success: false, error: 'Clé VAPID manquante' }
      }

      // Demander la permission
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result !== 'granted') {
        return { success: false, error: 'Permission refusée' }
      }

      // S'abonner via le service worker
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Envoyer la subscription au backend
      await api.post('/push/subscribe', subscription.toJSON())
      setIsSubscribed(true)

      return { success: true }
    } catch (err) {
      console.error('[Push] Erreur abonnement:', err)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await api.delete('/push/subscribe', { data: { endpoint: subscription.endpoint } })
        await subscription.unsubscribe()
        setIsSubscribed(false)
      }

      return { success: true }
    } catch (err) {
      console.error('[Push] Erreur désabonnement:', err)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  return { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe }
}
