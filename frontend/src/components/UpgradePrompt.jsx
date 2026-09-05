/**
 * @file UpgradePrompt.jsx
 * @brief Modal upgrade pour fonctionnalités PRO
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useAuth } from '../contexts/AuthContext'
import { PLAN_PRICES, upgradeTarget, planLabel } from '../data/upgradePlans'
import { useTranslation, Trans } from 'react-i18next'
import api from '../services/api'

const FEATURES = {
  ai_creations: {
    plan: 'plus',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  tags: {
    plan: 'plus',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  secondary_counter: {
    plan: 'plus',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
      </svg>
    ),
  },
  photo_credits: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  pattern_library: {
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
}

const UpgradePrompt = ({ isOpen, onClose, feature = 'tags' }) => {
  const { t } = useTranslation('tools')
  const navigate = useNavigate()
  const { isTWA, getSubscriptionPlan } = useAuth()

  // [AI:Claude] Un seul point de log pour toutes les impressions de mur payant de l'app
  // (tags, compteurs secondaires, crédits photo, création intelligente, bibliothèque...) —
  // évite de répéter cet appel à chaque endroit qui monte ce composant. Best-effort,
  // ne doit jamais bloquer l'affichage de la modale.
  useEffect(() => {
    if (!isOpen) return
    api.post('/analytics/track-event', { event_name: 'upgrade_prompt_shown', feature }).catch(() => {})
  }, [isOpen, feature])

  if (!isOpen) return null

  if (isTWA) return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-900 pr-6">{t('ui.unlockFeature')}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          <Trans t={t} i18nKey="ui.twaLongExplain"><span className="font-semibold text-primary-700">yarnflow.fr</span></Trans>
        </p>
        <button onClick={onClose} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
          {t('ui.close')}
        </button>
      </div>
    </div>
  )

  const content = FEATURES[feature] || FEATURES.tags
  // [AI:Claude] Meme repli pour les traductions : sans ca, un feature inconnu
  // ferait renvoyer la cle brute a t(), et le .map() sur les items planterait.
  const featureKey = FEATURES[feature] ? feature : 'tags'

  // [AI:Claude] On propose le plan le moins cher qui debloque la fonctionnalite,
  // pas systematiquement PRO : annoncer PRO quand PLUS suffisait est un probleme
  // de confiance autant qu'une vente ratee.
  const targetPlan = upgradeTarget(feature, getSubscriptionPlan()) || 'plus'
  const price = PLAN_PRICES[targetPlan]

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
          aria-label={t('ui.close')}
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
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-0.5">
              {t('ui.featureBadge', { plan: content.plan === 'plus' ? 'PLUS' : 'PRO' })}
            </p>
            <h3 className="text-lg font-bold text-gray-900">{t(`upgrade.${featureKey}.title`)}</h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">{t(`upgrade.${featureKey}.description`)}</p>

        <ul className="space-y-2">
          {t(`upgrade.${featureKey}.items`, { returnObjects: true }).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        {/* Prix (équivalent mensuel de l'offre annuelle, comme sur /subscription) */}
        {content.plan === 'plus' ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-3 flex flex-col">
              <p className="font-bold text-gray-900 text-sm">PLUS</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('ui.forActive')}</p>
              <div className="mt-2">
                <span className="text-xl font-bold text-primary-600">2,49€</span>
                <span className="text-xs text-gray-500">{t('ui.perMonth')}</span>
              </div>
              <p className="text-[11px] text-green-600 font-medium mt-0.5">{t('ui.billedYearlyPlus')}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col">
              <p className="font-bold text-gray-900 text-sm">PRO</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('ui.allFeatures')}</p>
              <div className="mt-2">
                <span className="text-xl font-bold text-gray-700">4,99€</span>
                <span className="text-xs text-gray-500">{t('ui.perMonth')}</span>
              </div>
              <p className="text-[11px] text-green-600 font-medium mt-0.5">{t('ui.billedYearlyPro')}</p>
            </div>
          </div>
        ) : (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">{t('ui.proPlan')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('ui.forSeriousProjects')}</p>
              <p className="text-[11px] text-green-600 font-medium mt-1">{t('ui.billedYearlyPro')}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary-600">4,99€</span>
              <span className="text-xs text-gray-500">{t('ui.perMonth')}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            {t('ui.later')}
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition text-sm font-semibold shadow-sm"
          >
            {t('ui.goToPlan', { plan: planLabel(targetPlan), price: price.monthlyEquiv })}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center -mt-2">
          {t('ui.billedAnnually', { annual: price.annual })}
        </p>
        <button
          onClick={handleUpgrade}
          className="block mx-auto text-xs text-gray-400 hover:text-primary-600 underline transition"
        >
          {t('ui.seeAllPlans')}
        </button>
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
