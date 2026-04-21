/**
 * @file ContextualHint.jsx
 * @brief Composant d'affichage des hints contextuels (astuces proactives)
 * @created 2026-02-26 by [AI:Claude]
 *
 * Style : Non-intrusif, couleurs YarnFlow, auto-fermeture, mobile-friendly
 * Inspiré de FirstRowCelebration.jsx et PWAPrompt.jsx
 */

import { useEffect, useState } from 'react'
import { useHintsContext } from '../contexts/HintsContext'

const ContextualHint = () => {
  const { currentHint, dismissHint } = useHintsContext()
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  // Animation d'entrée et auto-fermeture
  useEffect(() => {
    if (currentHint) {
      // Reset état
      setProgress(100)
      setIsExiting(false)

      // Petit délai pour animation d'entrée
      const showTimer = setTimeout(() => setIsVisible(true), 100)

      // Barre de progression
      const duration = currentHint.duration || 5000
      const intervalTime = 50
      const decrementPerInterval = (100 / duration) * intervalTime

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev - decrementPerInterval
          return next < 0 ? 0 : next
        })
      }, intervalTime)

      // Auto-fermeture
      const autoCloseTimer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(autoCloseTimer)
        clearInterval(progressInterval)
      }
    } else {
      setIsVisible(false)
      setIsExiting(false)
    }
  }, [currentHint])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      dismissHint(true)
      setIsExiting(false)
    }, 300) // Attendre fin animation
  }

  if (!currentHint) return null

  return (
    <div
      className={`
        fixed left-4 right-4 md:left-auto md:right-4 md:w-96
        bottom-20 sm:bottom-4
        z-50
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting
          ? 'translate-y-0 opacity-100'
          : 'translate-y-8 opacity-0'
        }
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-primary-100 overflow-hidden">
        {/* Barre de progression (countdown visuel) */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icône */}
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-100 to-sage-100 rounded-full flex items-center justify-center text-xl">
              {currentHint.icon || '💡'}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentHint.text}
              </p>
            </div>

            {/* Bouton fermer (X) */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Bouton action */}
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 text-sm font-medium rounded-lg transition-colors"
            >
              Compris !
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContextualHint
