/**
 * @file FirstRowCelebration.jsx
 * @brief Modal de célébration après le premier rang compté
 * @author Nathalie + AI Assistants
 * @created 2026-01-13
 * @version 0.17.0
 *
 * @description
 * Affiché UNE SEULE FOIS après le tout premier rang compté (current_row === 1)
 */

import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const FirstRowCelebration = ({ onClose, counterUnit = 'rows' }) => {
  const { t } = useTranslation('tools')
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setShow(true), 100)

    // Auto-fermeture après 4 secondes
    const timer = setTimeout(() => {
      handleClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300) // Attendre la fin de l'animation
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black transition-opacity duration-300 ${show ? 'bg-opacity-50' : 'bg-opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confettis emoji */}
        <div className="text-7xl mb-4 animate-bounce">
          🎉
        </div>

        {/* Titre */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {t('ui.wellDone')}
        </h2>

        {/* Message */}
        <p className="text-lg text-gray-700 leading-relaxed mb-2">
          {t('ui.yarnflowFollowsYou')}
        </p>
        <p className="text-lg text-gray-700 leading-relaxed">
          {counterUnit === 'cm' ? t('ui.cmByCm') : t('ui.rowByRow')} 💜
        </p>

        {/* Bouton de fermeture (optionnel, l'auto-fermeture suffit) */}
        <button
          onClick={handleClose}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {t('ui.continueBtn')}
        </button>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default FirstRowCelebration
