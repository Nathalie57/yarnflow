/**
 * @file UpgradePrompt.jsx
 * @brief Modal upgrade pour fonctionnalités PRO
 */

import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

const FEATURES = {
  tags: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
    title: 'Tags personnalisés',
    description: 'Organisez vos projets avec des étiquettes personnalisées et retrouvez-les en un clin d\'œil.',
    items: ['Tags illimités (cadeau, bébé, Noël...)', 'Filtrage multi-tags', 'Retrouvez vos projets en 1 clic'],
  },
  secondary_counter: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
      </svg>
    ),
    title: '2e compteur par projet',
    description: 'Comptez vos augmentations, diminutions et répétitions en parallèle de votre compteur principal.',
    items: ['Indépendant du compteur principal', 'Label personnalisable (ex: "Dim.")', 'Idéal pour pulls, châles, chaussettes'],
  },
  section_notes: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Notes par section',
    description: 'Ajoutez des notes spécifiques à chaque section de votre projet — pas juste une note globale.',
    items: ['Notes indépendantes par section', 'Sauvegarde automatique', 'Retrouvez vos instructions section par section'],
  },
  photo_credits: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Plus de crédits photo IA',
    description: 'Vous avez utilisé vos 2 crédits photo gratuits ce mois-ci. Passez à PRO pour 20 crédits par mois.',
    items: ['20 crédits photo IA / mois', 'Tous les styles disponibles', 'Crédits supplémentaires à la carte'],
  },
  pattern_library: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: 'Bibliothèque illimitée',
    description: 'Vous avez atteint la limite de 5 patrons en FREE. Passez à PRO pour une bibliothèque sans limite.',
    items: ['Patrons illimités (PDF, URL, texte)', 'Tous vos patrons Ravelry, Etsy...', 'Accessible hors-ligne'],
  },
}

const UpgradePrompt = ({ isOpen, onClose, feature = 'tags' }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const content = FEATURES[feature] || FEATURES.tags

  const handleUpgrade = () => {
    navigate('/subscription')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pt-1">
          <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {content.svg}
          </div>
          <div>
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-0.5">Fonctionnalité PRO</p>
            <h3 className="text-lg font-bold text-gray-900">{content.title}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">{content.description}</p>

        <ul className="space-y-2">
          {content.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        {/* Prix */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 text-sm">Plan PRO</p>
            <p className="text-xs text-gray-500 mt-0.5">Pour les projets sérieux</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary-600">3,99€</span>
            <span className="text-xs text-gray-500">/mois</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            Plus tard
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition text-sm font-semibold shadow-sm"
          >
            Passer à PRO
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center -mt-2">Sans engagement · Résiliable à tout moment</p>
      </div>
    </div>
  )
}

UpgradePrompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  feature: PropTypes.string
}

export default UpgradePrompt
