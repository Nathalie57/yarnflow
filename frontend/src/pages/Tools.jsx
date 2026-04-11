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

const TOOLS = [
  {
    id: 'distribute',
    icon: '🧮',
    title: 'Répartir augm. & dim.',
    description: 'Espacer uniformément des augmentations ou diminutions sur vos mailles ou rangs.',
    component: DistributeIncrDec,
  },
  {
    id: 'gauge',
    icon: '📐',
    title: "Calculateur d'échantillon",
    description: 'Calculer le nombre de mailles et rangs selon votre échantillon, ou adapter un patron.',
    component: GaugeCalculator,
  },
  {
    id: 'needles',
    icon: '🪡',
    title: 'Convertisseur aiguilles',
    description: 'Correspondance des tailles EU / US / UK pour aiguilles à tricoter et crochets.',
    component: NeedleConverter,
  },
  {
    id: 'yarn',
    icon: '🧶',
    title: 'Calculateur de pelotes',
    description: 'Combien de pelotes acheter selon le métrage de votre projet.',
    component: YarnCalculator,
  },
  {
    id: 'glossary',
    icon: '📖',
    title: 'Glossaire',
    description: '66 termes tricot & crochet expliqués en français, avec équivalents anglais.',
    component: Glossary,
  },
  {
    id: 'length',
    icon: '📏',
    title: 'Convertisseur longueur',
    description: 'Convertir cm, pouces, yards et mètres. Indispensable pour les patrons US/UK.',
    component: LengthConverter,
  },
  {
    id: 'remaining',
    icon: '⚖️',
    title: 'Laine restante',
    description: 'Pesez votre pelote entamée pour savoir combien de mètres il vous reste.',
    component: RemainingYarn,
  },
  {
    id: 'weight',
    icon: '🧵',
    title: 'Épaisseur de laine',
    description: 'Correspondance Lace / Fingering / DK / Worsted / Bulky en FR, US et UK avec aiguilles recommandées.',
    component: YarnWeightConverter,
  },
  {
    id: 'ai',
    icon: '🤖',
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
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <button
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
        >
          ← Retour aux outils
        </button>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{tool.icon}</span>
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
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-primary-300 hover:shadow-md transition flex flex-col gap-3"
          >
            <span className="text-4xl">{t.icon}</span>
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
        ))}

      </div>
    </div>
  )
}
