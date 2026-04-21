/**
 * @file Tools.jsx
 * @brief Page hub des outils pour tricoteurs et crocheteurs
 */

import { useState } from 'react'
import DistributeIncrDec from '../components/tools/DistributeIncrDec'
import GaugeCalculator from '../components/tools/GaugeCalculator'
import NeedleConverter from '../components/tools/NeedleConverter'
import YarnCalculator from '../components/tools/YarnCalculator'
import Glossary from '../components/tools/Glossary'
import AiAssistant from '../components/tools/AiAssistant'
import LengthConverter from '../components/tools/LengthConverter'
import RemainingYarn from '../components/tools/RemainingYarn'
import YarnWeightConverter from '../components/tools/YarnWeightConverter'

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

const TOOLS = [
  {
    id: 'distribute',
    Icon: IconDistribute,
    title: 'Répartir augm. & dim.',
    description: 'Espacer uniformément des augmentations ou diminutions sur vos mailles ou rangs.',
    component: DistributeIncrDec,
  },
  {
    id: 'gauge',
    Icon: IconGauge,
    title: "Calculateur d'échantillon",
    description: 'Calculer le nombre de mailles et rangs selon votre échantillon, ou adapter un patron.',
    component: GaugeCalculator,
  },
  {
    id: 'needles',
    Icon: IconNeedles,
    title: 'Convertisseur aiguilles',
    description: 'Correspondance des tailles EU / US / UK pour aiguilles à tricoter et crochets.',
    component: NeedleConverter,
  },
  {
    id: 'yarn',
    Icon: IconYarn,
    title: 'Calculateur de pelotes',
    description: 'Combien de pelotes acheter selon le métrage de votre projet.',
    component: YarnCalculator,
  },
  {
    id: 'glossary',
    Icon: IconBook,
    title: 'Glossaire',
    description: '66 termes tricot & crochet expliqués en français, avec équivalents anglais.',
    component: Glossary,
  },
  {
    id: 'length',
    Icon: IconLength,
    title: 'Convertisseur longueur',
    description: 'Convertir cm, pouces, yards et mètres. Indispensable pour les patrons US/UK.',
    component: LengthConverter,
  },
  {
    id: 'remaining',
    Icon: IconScale,
    title: 'Laine restante',
    description: 'Pesez votre pelote entamée pour savoir combien de mètres il vous reste.',
    component: RemainingYarn,
  },
  {
    id: 'weight',
    Icon: IconLayers,
    title: 'Épaisseur de laine',
    description: 'Correspondance Lace / Fingering / DK / Worsted / Bulky en FR, US et UK avec aiguilles recommandées.',
    component: YarnWeightConverter,
  },
  {
    id: 'ai',
    Icon: IconMessage,
    title: 'Assistant IA',
    description: 'Posez toutes vos questions sur les techniques, patrons et points. 3/mois en FREE, 30/mois en PRO.',
    component: AiAssistant,
    badge: 'PRO',
  },
]

export default function Tools() {
  const [activeTool, setActiveTool] = useState(null)

  const tool = TOOLS.find(t => t.id === activeTool)

  if (tool) {
    const ToolComponent = tool.component
    const { Icon } = tool
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <button
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          ← Retour aux outils
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="w-9 h-9 text-primary-600 flex-shrink-0">
            <Icon />
          </span>
          <h1 className="text-xl font-bold text-gray-900">{tool.title}</h1>
        </div>
        <ToolComponent />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Outils</h1>
      <p className="text-gray-500 text-sm mb-6">Calculateurs et assistants pour vos projets</p>

      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map(t => {
          const { Icon } = t
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-md transition flex flex-col gap-3"
            >
              <span className="w-10 h-10 text-primary-600">
                <Icon />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 text-sm leading-tight">{t.title}</div>
                  {t.badge && (
                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">{t.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
