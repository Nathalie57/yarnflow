/**
 * @file OnboardingModal.jsx
 * @brief Modal d'onboarding — présentation de l'app en 5 slides
 */

import { useState } from 'react'

const SLIDES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-primary-500">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
        <path d="M8 12l2.5 2.5L16 9"/>
      </svg>
    ),
    title: 'Bienvenue sur YarnFlow',
    description: 'Votre compagnon de tricot et crochet. Suivez vos projets, organisez vos patrons et sublimez vos créations avec l\'IA.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-primary-500">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M9 21V9"/>
        <path d="M12 14l2 2 4-4"/>
      </svg>
    ),
    title: 'Compteur de rangs',
    description: 'Créez un projet, découpez-le en sections et comptez vos rangs en un tap. Votre progression est sauvegardée automatiquement, même entre appareils.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-primary-500">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Bibliothèque de patrons',
    description: 'Centralisez tous vos patrons PDF, images ou URLs en un seul endroit. Plus besoin de chercher dans vos téléchargements.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-primary-500">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
        <path d="M17.5 7.5l1.5 1.5"/>
      </svg>
    ),
    title: 'Photos sublimées par l\'IA',
    description: 'Prenez une photo de votre ouvrage et laissez l\'IA la transformer en photo de studio. Partagez vos créations sous leur meilleur jour.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-primary-500">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
        <line x1="8" y1="3" x2="8" y2="9"/>
        <line x1="16" y1="9" x2="16" y2="15"/>
        <line x1="12" y1="15" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Des outils pour tricoter mieux',
    description: 'Calculateur d\'échantillon, répartition d\'augmentations, convertisseur d\'aiguilles, glossaire… Tout ce qu\'il vous faut, sans quitter l\'app.',
  },
]

export default function OnboardingModal({ onClose }) {
  const [current, setCurrent] = useState(0)
  const isLast = current === SLIDES.length - 1
  const slide = SLIDES[current]

  const handleClose = () => {
    localStorage.setItem('yf_onboarding_done', '1')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-sm p-8 pb-10 sm:pb-8">

        {/* Icône */}
        <div className="flex justify-center mb-6">
          {slide.icon}
        </div>

        {/* Texte */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
          {slide.title}
        </h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          {slide.description}
        </p>

        {/* Indicateurs */}
        <div className="flex justify-center gap-2 mt-6">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? 'w-5 h-2 bg-primary-600'
                  : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Boutons */}
        <div className="flex gap-3 mt-6">
          {!isLast ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition"
              >
                Ignorer
              </button>
              <button
                onClick={() => setCurrent(c => c + 1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
              >
                Suivant
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              C'est parti !
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
