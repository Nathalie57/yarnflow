/**
 * @file Tools.jsx
 * @brief Page hub des outils pour tricoteurs et crocheteurs
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import DistributeIncrDec from '../components/tools/DistributeIncrDec'
import GaugeCalculator from '../components/tools/GaugeCalculator'
import NeedleConverter from '../components/tools/NeedleConverter'
import YarnCalculator from '../components/tools/YarnCalculator'
import Glossary from '../components/tools/Glossary'
import AiAssistant from '../components/tools/AiAssistant'
import LengthConverter from '../components/tools/LengthConverter'
import RemainingYarn from '../components/tools/RemainingYarn'
import YarnWeightConverter from '../components/tools/YarnWeightConverter'
import ChartDesigner from '../components/tools/ChartDesigner'
import { useTranslation } from 'react-i18next'

const IconDistribute = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
    <line x1="8" y1="3" x2="8" y2="9"/>
    <line x1="16" y1="9" x2="16" y2="15"/>
    <line x1="12" y1="15" x2="12" y2="21"/>
  </svg>
)

const IconGauge = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="2" y="7" width="20" height="10" rx="2"/>
    <line x1="6" y1="12" x2="6" y2="17"/>
    <line x1="9" y1="12" x2="9" y2="15"/>
    <line x1="12" y1="12" x2="12" y2="17"/>
    <line x1="15" y1="12" x2="15" y2="15"/>
    <line x1="18" y1="12" x2="18" y2="17"/>
  </svg>
)

const IconNeedles = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="5" y1="20" x2="17" y2="4"/>
    <line x1="11" y1="20" x2="23" y2="4"/>
    <circle cx="5" cy="20" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="11" cy="20" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
)

const IconYarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)

const IconLength = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M8 3L4 7l4 4"/>
    <path d="M4 7h16"/>
    <path d="M16 21l4-4-4-4"/>
    <path d="M20 17H4"/>
  </svg>
)

const IconScale = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <path d="M17 7l3 6H14l3-6z"/>
    <path d="M7 7l3 6H4l3-6z"/>
    <line x1="7" y1="7" x2="17" y2="7"/>
  </svg>
)

const IconLayers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
)

const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
  </svg>
)

// [AI:Claude] Les libelles vivent dans les traductions (cle toolsList.<id>.title/.description) :
// une constante figee au chargement du module resterait dans la langue initiale.
const TOOLS = [
  { id: 'distribute', Icon: IconDistribute, component: DistributeIncrDec },
  { id: 'gauge', Icon: IconGauge, component: GaugeCalculator },
  { id: 'needles', Icon: IconNeedles, component: NeedleConverter },
  { id: 'yarn', Icon: IconYarn, component: YarnCalculator },
  // Glossaire : explique les termes FR avec leurs equivalents anglais.
  // Sans objet pour une anglophone, donc masque hors francais.
  { id: 'glossary', Icon: IconBook, component: Glossary, frenchOnly: true },
  { id: 'length', Icon: IconLength, component: LengthConverter },
  { id: 'remaining', Icon: IconScale, component: RemainingYarn },
  { id: 'weight', Icon: IconLayers, component: YarnWeightConverter },
  { id: 'ai', Icon: IconMessage, component: AiAssistant },
  {
    id: 'chart-designer',
    Icon: IconGrid,
    component: ChartDesigner,
    betaOnly: true,
    badge: 'PLUS/PRO',
    wide: true,
  },
]

export default function Tools() {
  const { t, i18n } = useTranslation('tools')
  const [activeTool, setActiveTool] = useState(null)
  const { user, isAdmin, hasActiveSubscription } = useAuth()
  // [AI:Claude] Grille jacquard réservée aux abonnés (PLUS/PRO) + admins.
  // Accès user 30 (bêta-testeuse) désactivé temporairement — Nathalie teste
  // d'abord elle-même avant d'ouvrir l'accès.
  const canAccessJacquard = isAdmin() || /* user?.id === 30 || */ hasActiveSubscription()
  const isFrench = i18n.resolvedLanguage === 'fr'
  const visibleTools = TOOLS.filter(x => (!x.betaOnly || canAccessJacquard) && (!x.frenchOnly || isFrench))

  const tool = visibleTools.find(t => t.id === activeTool)

  if (tool) {
    const ToolComponent = tool.component
    const { Icon } = tool
    return (
      <div className={`${tool.wide ? 'max-w-4xl' : 'max-w-lg'} mx-auto px-4 py-6 pb-24`}>
        <button
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          {t('ui.backToTools')}
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-9 h-9 text-primary-600 flex-shrink-0">
            <Icon />
          </span>
          <h1 className="text-xl font-bold text-gray-900">{t(`toolsList.${tool.id}.title`)}</h1>
        </div>
        <ToolComponent />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('ui.toolsNav')}</h1>
      <p className="text-gray-500 text-sm mb-6">{t('ui.toolsTagline')}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Traducteur de patron — page dédiée */}
        <Link
          to="/pattern-translator"
          className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-md transition flex flex-col gap-3"
        >
          <span className="w-10 h-10 text-primary-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M5 8l6 6"/>
              <path d="M4 14l6-6 2-3"/>
              <path d="M2 5h12"/>
              <path d="M7 2h1"/>
              <path d="M22 22l-5-10-5 10"/>
              <path d="M14 18h6"/>
            </svg>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-gray-900 text-sm leading-tight">{t('ui.translatePattern')}</div>
              <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">IA</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">{t('ui.translatorDesc')}</div>
          </div>
        </Link>

        {/* parametre nomme `item` et non `t` : sinon il masquerait la fonction de traduction */}
        {visibleTools.map(item => {
          const { Icon } = item
          return (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-md transition flex flex-col gap-3"
            >
              <span className="w-10 h-10 text-primary-600">
                <Icon />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 text-sm leading-tight">{t(`toolsList.${item.id}.title`)}</div>
                  {item.badge && (
                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">{t(`toolsList.${item.id}.description`)}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
