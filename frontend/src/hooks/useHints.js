/**
 * @file useHints.js
 * @brief Hook pour déclencher facilement les hints contextuels
 * @created 2026-02-26 by [AI:Claude]
 *
 * @example
 * const { triggerOnce } = useHints()
 *
 * // Déclencher au démarrage du timer
 * const handleStartTimer = () => {
 *   setIsTimerRunning(true)
 *   triggerOnce('timer_wake_lock')
 * }
 */

import { useCallback, useRef } from 'react'
import { useHintsContext } from '../contexts/HintsContext'

export const useHints = () => {
  const { triggerHint, canShowHint, dismissHint, currentHint } = useHintsContext()

  // Tracker les hints déclenchés cette session (évite les re-triggers)
  const triggeredThisSessionRef = useRef(new Set())

  /**
   * Déclencher un hint une seule fois par session
   * @param {string} hintId - L'identifiant du hint
   * @returns {boolean} true si le hint a été déclenché
   */
  const triggerOnce = useCallback((hintId) => {
    // Déjà déclenché cette session ?
    if (triggeredThisSessionRef.current.has(hintId)) {
      return false
    }

    const result = triggerHint(hintId)
    if (result) {
      triggeredThisSessionRef.current.add(hintId)
    }
    return result
  }, [triggerHint])

  /**
   * Déclencher un hint si une condition est vraie
   * @param {string} hintId - L'identifiant du hint
   * @param {boolean} condition - La condition à vérifier
   * @returns {boolean} true si le hint a été déclenché
   */
  const triggerIf = useCallback((hintId, condition) => {
    if (!condition) return false
    return triggerOnce(hintId)
  }, [triggerOnce])

  return {
    triggerHint,
    triggerOnce,
    triggerIf,
    canShowHint,
    dismissHint,
    currentHint
  }
}
