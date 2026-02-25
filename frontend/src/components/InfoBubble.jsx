/**
 * @file InfoBubble.jsx
 * @brief Composant bulle d'info réutilisable (tooltip)
 * @created 2026-02-25 by [AI:Claude]
 */

import { useState } from 'react'

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

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
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
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        className={`${sizeClasses[size]} rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors font-semibold`}
        aria-label="Plus d'informations"
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer au clic */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          />

          {/* Bulle */}
          <div
            className={`absolute z-50 ${positionClasses[position]} w-64 max-w-xs`}
          >
            <div className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg">
              {text}
              {/* Flèche */}
              <div
                className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InfoBubble
