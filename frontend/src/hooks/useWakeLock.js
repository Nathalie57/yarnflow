/**
 * @file useWakeLock.js
 * @brief Hook pour empêcher la mise en veille de l'écran pendant l'utilisation
 * @author Nathalie + AI Assistants
 * @created 2025-12-14
 *
 * @description
 * Utilise l'API Screen Wake Lock pour garder l'écran allumé.
 * Utile pour le compteur de rangs : l'utilisateur peut tricoter/crocheter
 * sans avoir à toucher constamment le téléphone pour réveiller l'écran.
 */

import { useEffect, useRef, useState } from 'react'

/**
 * Hook pour gérer le Wake Lock (empêcher la mise en veille de l'écran)
 *
 * @returns {Object} { isSupported, isActive, request, release }
 */
export const useWakeLock = () => {
  const wakeLockRef = useRef(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Vérifier si l'API est supportée
  useEffect(() => {
    setIsSupported('wakeLock' in navigator)
  }, [])

  // Demander le wake lock
  const request = async () => {
    if (!isSupported) {
      console.log('[WakeLock] API non supportée sur ce navigateur')
      return false
    }

    try {
      // Libérer le wake lock existant si présent
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
      }

      // Demander un nouveau wake lock
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      setIsActive(true)
      console.log('[WakeLock] ✅ Écran maintenu allumé')

      // Gérer la libération automatique (ex: changement d'onglet)
      wakeLockRef.current.addEventListener('release', () => {
        console.log('[WakeLock] Wake lock libéré')
        setIsActive(false)
      })

      return true
    } catch (err) {
      console.error('[WakeLock] Erreur lors de la demande:', err)
      setIsActive(false)
      return false
    }
  }

  // Libérer le wake lock
  const release = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        setIsActive(false)
        console.log('[WakeLock] ✅ Wake lock libéré manuellement')
      } catch (err) {
        console.error('[WakeLock] Erreur lors de la libération:', err)
      }
    }
  }

  // Réacquérir le wake lock si la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        console.log('[WakeLock] Page visible, réacquisition du wake lock')
        await request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive])

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
  }, [])

  return {
    isSupported,
    isActive,
    request,
    release
  }
}
