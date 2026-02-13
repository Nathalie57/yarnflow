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
  // [AI:Claude] FIX: Variable séparée pour l'intention vs l'état réel
  // Quand l'écran s'éteint, isActive devient false mais shouldBeActive reste true
  const shouldBeActiveRef = useRef(false)

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

    // [AI:Claude] Marquer qu'on veut le wake lock actif
    shouldBeActiveRef.current = true

    try {
      // Libérer le wake lock existant si présent
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
      }

      // Demander un nouveau wake lock
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      setIsActive(true)
      console.log('[WakeLock] Acquis avec succès - écran restera allumé')

      // Gérer la libération automatique (ex: changement d'onglet, écran éteint)
      wakeLockRef.current.addEventListener('release', () => {
        console.log('[WakeLock] Libéré automatiquement (app en arrière-plan ou écran éteint)')
        setIsActive(false)
        wakeLockRef.current = null
        // [AI:Claude] NE PAS réinitialiser shouldBeActiveRef ici !
        // On veut réacquérir le wake lock quand la page redevient visible
      })

      return true
    } catch (err) {
      console.error('[WakeLock] Erreur:', err.message)
      setIsActive(false)
      return false
    }
  }

  // Libérer le wake lock
  const release = async () => {
    // [AI:Claude] Marquer qu'on ne veut plus le wake lock
    shouldBeActiveRef.current = false

    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        setIsActive(false)
        console.log('[WakeLock] Libéré manuellement')
      } catch (err) {
        console.error('[WakeLock] Erreur lors de la libération:', err.message)
      }
    }
  }

  // [AI:Claude] FIX: Réacquérir le wake lock si la page redevient visible
  // et qu'on VOULAIT que le wake lock soit actif
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldBeActiveRef.current && !wakeLockRef.current) {
        console.log('[WakeLock] Page visible, réacquisition...')
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
          setIsActive(true)
          console.log('[WakeLock] Réacquis avec succès')

          wakeLockRef.current.addEventListener('release', () => {
            console.log('[WakeLock] Libéré automatiquement')
            setIsActive(false)
            wakeLockRef.current = null
          })
        } catch (err) {
          console.error('[WakeLock] Erreur lors de la réacquisition:', err.message)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isSupported])

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      shouldBeActiveRef.current = false
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
