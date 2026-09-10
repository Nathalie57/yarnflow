/**
 * @file Tools.jsx
 * @brief Page hub des outils pour tricoteurs et crocheteurs
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
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
// [AI:Claude] Ordre basé sur l'usage réel observé (tool_opened, cohorte du 07/09) plutôt
// qu'alphabétique/arbitraire : yarn et distribute sont de loin les plus ouverts, length n'a
// jamais été ouvert sur la période — les remonter/descendre évite de faire lire onze
// descriptions à quelqu'un qui ne sait pas encore ce qu'il cherche.
const TOOLS = [
  { id: 'yarn', Icon: IconYarn, component: YarnCalculator },
  { id: 'distribute', Icon: IconDistribute, component: DistributeIncrDec },
  { id: 'weight', Icon: IconLayers, component: YarnWeightConverter },
  { id: 'gauge', Icon: IconGauge, component: GaugeCalculator },
  { id: 'needles', Icon: IconNeedles, component: NeedleConverter },
  // Glossaire : explique les termes FR avec leurs equivalents anglais.
  // Sans objet pour une anglophone, donc masque hors francais.
  { id: 'glossary', Icon: IconBook, component: Glossary, frenchOnly: true },
  { id: 'remaining', Icon: IconScale, component: RemainingYarn },
  { id: 'ai', Icon: IconMessage, component: AiAssistant },
  { id: 'length', Icon: IconLength, component: LengthConverter },
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

  // [AI:Claude] Angle mort connu : rien ne trackait la bibliothèque, le stock ni les
  // outils avant qu'une utilisatrice crée un projet — impossible de savoir si les gens
  // qui ne reviennent jamais ont au moins exploré autre chose avant de partir.
  // Une fois par session (pas à chaque re-render) pour la page hub ; à chaque ouverture
  // d'outil précis, ça reste un vrai clic délibéré, pas du bruit.
  useEffect(() => {
    if (sessionStorage.getItem('yf_evt_tools_viewed')) return
    try { sessionStorage.setItem('yf_evt_tools_viewed', '1') } catch { /* ignore */ }
    api.post('/analytics/track-event', { event_name: 'tools_viewed' }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeTool) return
    api.post('/analytics/track-event', { event_name: 'tool_opened', tool: activeTool }).catch(() => {})
  }, [activeTool])

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
      <div className="flex items-center gap-3 mb-2">
        <span className="w-9 h-9 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center p-2 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a2 2 0 1 0 2.8 2.8l6-6a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.8-2.8 2.1-2.1z"/>
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-gray-900">{t('ui.toolsNav')}</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">{t('ui.toolsTagline')}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* [AI:Claude] Icônes alternées primary/warm (deux familles de couleur de la marque,
            "warm" jusqu'ici jamais utilisée ailleurs dans l'app) — onze tuiles strictement
            identiques rendaient la page terne, sans qu'aucune couleur n'ait à sortir de la
            charte pour autant. Le -translate-y au survol ajoute un peu de vie sans surcharger. */}
        {/* [AI:Claude] Création Intelligente — page dédiée, comme le traducteur ci-dessous.
            C'est ici que les gens sans projet atterrissent le plus souvent (cf. bandeau
            au-dessus) : autant leur donner un chemin permanent, pas juste conditionné à
            l'absence de projet. Même icône et libellés que MyProjects/SmartProjectCreator
            pour rester cohérent visuellement avec le reste de l'app. */}
        <Link
          to="/smart-project-creator"
          className="bg-primary-50 border-2 border-primary-300 rounded-2xl p-5 text-left hover:border-primary-400 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-3"
        >
          <span className="w-11 h-11 bg-white text-primary-600 rounded-xl flex items-center justify-center p-2.5 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-primary-900 text-sm leading-tight">{t('ui.smartCreation')}</div>
            </div>
            <div className="text-xs text-primary-700 mt-1 leading-snug">{t('ui.smartCreationDesc')}</div>
          </div>
        </Link>

        {/* [AI:Claude] Traducteur — en warm (pas primary) pour continuer l'alternance amorcée
            par la tuile Création Intelligente juste au-dessus, plutôt que de figer deux
            tuiles vertes d'affilée en tête et déséquilibrer le compte final vert/terracotta. */}
        <Link
          to="/pattern-translator"
          className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-3"
        >
          <span className="w-11 h-11 bg-warm-100 text-warm-600 rounded-xl flex items-center justify-center p-2.5 shrink-0">
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
            </div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">{t('ui.translatorDesc')}</div>
          </div>
        </Link>

        {/* parametre nomme `item` et non `t` : sinon il masquerait la fonction de traduction */}
        {visibleTools.map((item, index) => {
          const { Icon } = item
          // Création Intelligente (primary) puis Traducteur (warm) ci-dessus ouvrent la
          // séquence : la suite continue simplement à alterner à partir de là
          const isWarm = index % 2 === 1
          return (
            <button
              key={item.id}
              onClick={() => setActiveTool(item.id)}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 transition flex flex-col gap-3"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center p-2.5 shrink-0 ${isWarm ? 'bg-warm-100 text-warm-600' : 'bg-primary-50 text-primary-600'}`}>
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
