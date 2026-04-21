/**
 * @file HintsContext.jsx
 * @brief Contexte global pour la gestion des hints contextuels
 * @created 2026-02-26 by [AI:Claude]
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { HINTS, HINT_COOLDOWN, HINT_MAX_VIEWS, HINT_MIN_INTERVAL, HINTS_STORAGE_KEY } from '../data/hintsConfig'

/**
 * Helper de stockage robuste (localStorage avec fallback sessionStorage)
 * Pattern réutilisé de api.js
 */
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (e) {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      try { sessionStorage.setItem(key, value) } catch (e2) { /* ignore */ }
    }
  }
}

const HintsContext = createContext(null)

export const useHintsContext = () => {
  const context = useContext(HintsContext)
  if (!context) {
    throw new Error('useHintsContext must be used within HintsProvider')
  }
  return context
}

export const HintsProvider = ({ children }) => {
  // Hints déjà vus (persisté dans localStorage)
  const [seenHints, setSeenHints] = useState(() => {
    const stored = storage.getItem(HINTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  })

  // Hint actuellement visible
  const [currentHint, setCurrentHint] = useState(null)

  // Queue des hints en attente (pour gestion des priorités)
  const [hintQueue, setHintQueue] = useState([])

  // Timestamp du dernier hint affiché (pour cooldown)
  const lastHintTimeRef = useRef(0)

  // Persister les hints vus
  useEffect(() => {
    storage.setItem(HINTS_STORAGE_KEY, JSON.stringify(seenHints))
  }, [seenHints])

  // Traiter la queue des hints
  useEffect(() => {
    if (currentHint || hintQueue.length === 0) return

    const now = Date.now()
    const timeSinceLastHint = now - lastHintTimeRef.current

    if (timeSinceLastHint < HINT_COOLDOWN && lastHintTimeRef.current > 0) {
      // Attendre la fin du cooldown
      const timeout = setTimeout(() => {
        processQueue()
      }, HINT_COOLDOWN - timeSinceLastHint)
      return () => clearTimeout(timeout)
    }

    processQueue()
  }, [hintQueue, currentHint])

  const processQueue = () => {
    if (hintQueue.length === 0) return

    // Trier par priorité (1 = haute priorité) et prendre le premier
    const sorted = [...hintQueue].sort((a, b) => a.priority - b.priority)
    const nextHint = sorted[0]

    setHintQueue(prev => prev.filter(h => h.id !== nextHint.id))
    setCurrentHint(nextHint)
    lastHintTimeRef.current = Date.now()
  }

  // Vérifier si un hint peut être affiché (max 2 fois, espacées de 7 jours)
  const canShowHint = useCallback((hintId) => {
    const hintData = seenHints[hintId]
    if (!hintData) return true
    // Migration: ancienne structure était un timestamp (nombre)
    if (typeof hintData === 'number') return false

    const count = hintData.count || 0
    if (count >= HINT_MAX_VIEWS) return false

    // Vérifier le délai depuis le dernier affichage
    const lastSeen = hintData.lastSeen || 0
    const timeSinceLastSeen = Date.now() - lastSeen
    return timeSinceLastSeen >= HINT_MIN_INTERVAL
  }, [seenHints])

  // Déclencher un hint
  const triggerHint = useCallback((hintId) => {
    if (!canShowHint(hintId)) return false

    // Trouver la config du hint
    const hintConfig = Object.values(HINTS).find(h => h.id === hintId)
    if (!hintConfig) return false

    // Ajouter à la queue s'il n'y est pas déjà
    setHintQueue(prev => {
      if (prev.some(h => h.id === hintId)) return prev
      return [...prev, hintConfig]
    })

    return true
  }, [canShowHint])

  // Fermer le hint actuel et incrémenter le compteur
  const dismissHint = useCallback((markAsSeen = true) => {
    if (!currentHint) return

    if (markAsSeen) {
      setSeenHints(prev => {
        const existing = prev[currentHint.id] || { count: 0 }
        return {
          ...prev,
          [currentHint.id]: {
            count: existing.count + 1,
            lastSeen: Date.now()
          }
        }
      })
    }

    setCurrentHint(null)
  }, [currentHint])

  // Reset un hint spécifique (pour tests)
  const resetHint = useCallback((hintId) => {
    setSeenHints(prev => {
      const next = { ...prev }
      delete next[hintId]
      return next
    })
  }, [])

  return (
    <HintsContext.Provider value={{
      currentHint,
      seenHints,
      canShowHint,
      triggerHint,
      dismissHint,
      resetHint
    }}>
      {children}
    </HintsContext.Provider>
  )
}
