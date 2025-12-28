/**
 * @file HelpButton.jsx
 * @brief Bouton d'aide flottant avec menu d'assistance
 * @author YarnFlow Team
 * @created 2025-12-28
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * [AI:Claude] Composant HelpButton - Bouton d'aide flottant en bas à droite
 *
 * Affiche un bouton "?" toujours visible qui ouvre un menu avec :
 * - Guide de démarrage (onboarding)
 * - Contact
 * - Autres ressources d'aide
 */
const HelpButton = ({ onOpenOnboarding }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Menu contextuel */}
      {isOpen && (
        <>
          {/* Overlay pour fermer au clic */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="fixed bottom-24 right-4 sm:right-6 z-50 bg-white rounded-xl shadow-2xl border-2 border-primary-200 w-72 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
              <h3 className="text-white font-bold text-lg">🆘 Besoin d'aide ?</h3>
            </div>

            <div className="p-2">
              {/* Guide de démarrage */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  if (onOpenOnboarding) {
                    onOpenOnboarding()
                  }
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
              >
                <span className="text-2xl">🎓</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                    Guide de démarrage
                  </p>
                  <p className="text-xs text-gray-600">
                    Redécouvrez les fonctionnalités
                  </p>
                </div>
              </button>

              {/* Contact */}
              <Link
                to="/contact"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
              >
                <span className="text-2xl">💬</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                    Nous contacter
                  </p>
                  <p className="text-xs text-gray-600">
                    Une question ? Un problème ?
                  </p>
                </div>
              </Link>

              {/* Pages légales */}
              <Link
                to="/cgu"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
              >
                <span className="text-2xl">📄</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                    CGU & Confidentialité
                  </p>
                  <p className="text-xs text-gray-600">
                    Conditions d'utilisation
                  </p>
                </div>
              </Link>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                YarnFlow v0.16 • 🧶 Made with ❤️
              </p>
            </div>
          </div>
        </>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          // Marquer comme vu pour retirer le badge rouge
          if (!localStorage.getItem('yarnflow_help_seen')) {
            localStorage.setItem('yarnflow_help_seen', 'true')
          }
        }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
        aria-label="Aide"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl font-bold group-hover:scale-110 transition-transform">
            ?
          </span>
        )}

        {/* Badge "Nouveau" pour les premiers jours */}
        {!localStorage.getItem('yarnflow_help_seen') && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </span>
        )}
      </button>
    </>
  )
}

export default HelpButton
