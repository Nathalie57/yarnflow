/**
 * @file InfoBubble.jsx
 * @brief Composant bulle d'info réutilisable (tooltip)
 * @created 2026-02-25 by [AI:Claude]
 */

import { useState, useEffect, useId, useRef } from 'react'

/**
 * Bulle d'info contextuelle
 * Affiche une icône "?" qui ouvre une bulle explicative au clic
 *
 * @param {string} text - Le texte à afficher dans la bulle
 * @param {string} position - Position de la bulle: 'top' | 'bottom' | 'left' | 'right' (défaut: 'top')
 * @param {string} size - Taille de l'icône: 'sm' | 'md' | 'lg' (défaut: 'sm')
 */
const InfoBubble = ({ text, position = 'top', size = 'sm' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const bubbleId = useId()

  // Écouter les autres bulles qui s'ouvrent pour se fermer
  useEffect(() => {
    const handleOtherBubbleOpen = (e) => {
      if (e.detail !== bubbleId && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('infobubble-open', handleOtherBubbleOpen)
    return () => window.removeEventListener('infobubble-open', handleOtherBubbleOpen)
  }, [bubbleId, isOpen])

  // Fermer si on clique n'importe où dans l'app
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = () => {
      setIsOpen(false)
    }
    // Petit délai pour éviter de fermer immédiatement à l'ouverture
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Calculer la position de la bulle quand elle s'ouvre
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const bubbleWidth = 256 // w-64 = 16rem = 256px

    let top, left

    switch (position) {
      case 'top':
        top = rect.top - 8 // mb-2
        left = rect.left + rect.width / 2 - bubbleWidth / 2
        break
      case 'bottom':
        top = rect.bottom + 8 // mt-2
        left = rect.left + rect.width / 2 - bubbleWidth / 2
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - bubbleWidth - 8 // mr-2
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + 8 // ml-2
        break
      default:
        top = rect.bottom + 8
        left = rect.left + rect.width / 2 - bubbleWidth / 2
    }

    // S'assurer que la bulle reste dans le viewport
    left = Math.max(8, Math.min(left, window.innerWidth - bubbleWidth - 8))

    setBubblePosition({ top, left })
  }, [isOpen, position])

  const sizeClasses = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
    lg: 'w-7 h-7 text-base'
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800'
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          if (!isOpen) {
            // Notifier les autres bulles de se fermer
            window.dispatchEvent(new CustomEvent('infobubble-open', { detail: bubbleId }))
          }
          setIsOpen(!isOpen)
        }}
        className={`${sizeClasses[size]} relative rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors font-semibold info-bubble-ping`}
        aria-label="Plus d'informations"
      >
        ?
      </button>

      {isOpen && (
        <div
          className="fixed z-[100] w-64"
          style={{
            top: position === 'top' ? 'auto' : bubblePosition.top,
            bottom: position === 'top' ? `calc(100vh - ${bubblePosition.top}px)` : 'auto',
            left: bubblePosition.left,
            transform: position === 'left' || position === 'right' ? 'translateY(-50%)' : 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
            {text}
          </div>
        </div>
      )}
    </div>
  )
}

export default InfoBubble
