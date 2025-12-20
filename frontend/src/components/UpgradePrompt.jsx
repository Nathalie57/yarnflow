/**
 * @file UpgradePrompt.jsx
 * @brief Modal upgrade pour fonctionnalités premium
 * @author Nathalie + Claude
 * @version 0.15.0
 * @date 2025-12-19
 */

import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

const UpgradePrompt = ({ isOpen, onClose, feature = 'tags' }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  const featureContent = {
    tags: {
      icon: '🏷️',
      title: 'Tags personnalisés',
      subtitle: 'Disponible en PLUS 💛',
      description: 'Organisez vos projets avec des étiquettes personnalisées :',
      features: [
        'cadeau, bébé, urgent, hiver...',
        'Filtrez par plusieurs tags',
        'Retrouvez vos projets en 1 clic'
      ],
      cta: 'Parfait dès que vous avez plusieurs projets en cours ! 🧶'
    }
  }

  const content = featureContent[feature] || featureContent.tags

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
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 animate-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="text-5xl animate-bounce">{content.icon}</div>
          <h3 className="text-3xl font-bold text-gray-900">{content.title}</h3>
          <p className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
            {content.subtitle}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <p className="text-gray-600">{content.description}</p>

          <ul className="space-y-2">
            {content.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-primary mt-0.5">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm text-gray-500 italic mt-4">{content.cta}</p>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-br from-sage-50 to-sage-100 rounded-xl p-5 space-y-3 border-2 border-sage-200 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 text-lg">Plan PLUS</span>
            <div className="text-right">
              <div className="text-3xl font-black text-primary-600">2,99€</div>
              <div className="text-xs text-gray-500 font-medium">/mois</div>
            </div>
          </div>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span className="font-medium">7 projets actifs</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span className="font-medium">15 crédits photos/mois</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary-600 font-bold">✓</span>
              <span className="font-medium">Tags illimités</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium text-gray-700 hover:border-gray-400"
          >
            Plus tard
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🚀 Découvrir PLUS
          </button>
        </div>
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
