/**
 * @file YarnWeightConverter.jsx
 * @brief Correspondance des épaisseurs de laine EU / US / UK + aiguilles recommandées
 */

import { useTranslation } from 'react-i18next'

// [AI:Claude] 2026-09-26 — valeurs alignées sur le standard Craft Yarn Council (catégories 0 à 7).
// Colonne UK : noms britanniques uniquement (les "8/10/12 ply" sont des noms australiens).
// Plages : [min, max] ; max = null signifie "et plus".
const WEIGHTS = [
  {
    euKey: 'wcLace',
    us: 'Lace',
    uk: '1 ply / 2 ply',
    needlesMm: [1.5, 2.25],
    needlesUs: ['000', '1'],
    crochetMm: [1.4, 2.25],
  },
  {
    euKey: 'wcSuperFine',
    us: 'Sock / Fingering / Baby',
    uk: '3 ply / 4 ply',
    needlesMm: [2.25, 3.25],
    needlesUs: ['1', '3'],
    crochetMm: [2.25, 3.5],
  },
  {
    euKey: 'wcFine',
    us: 'Sport / Baby',
    uk: '5 ply / Baby',
    needlesMm: [3.25, 3.75],
    needlesUs: ['3', '5'],
    crochetMm: [3.5, 4.5],
  },
  {
    euKey: 'wcLight',
    us: 'DK / Light Worsted',
    uk: 'DK',
    needlesMm: [3.75, 4.5],
    needlesUs: ['5', '7'],
    crochetMm: [4.5, 5.5],
  },
  {
    euKey: 'wcMedium',
    us: 'Worsted / Afghan / Aran',
    uk: 'Aran',
    needlesMm: [4.5, 5.5],
    needlesUs: ['7', '9'],
    crochetMm: [5.5, 6.5],
  },
  {
    euKey: 'wcBulky',
    us: 'Chunky / Craft / Rug',
    uk: 'Chunky',
    needlesMm: [5.5, 8],
    needlesUs: ['9', '11'],
    crochetMm: [6.5, 9],
  },
  {
    euKey: 'wcSuperBulky',
    us: 'Super Bulky / Roving',
    uk: 'Super Chunky',
    needlesMm: [8, 12.75],
    needlesUs: ['11', '17'],
    crochetMm: [9, 15],
  },
  {
    euKey: 'wcJumbo',
    us: 'Jumbo / Roving',
    uk: 'Jumbo',
    needlesMm: [12.75, null],
    needlesUs: ['17', null],
    crochetMm: [15, null],
  },
]

export default function YarnWeightConverter() {
  const { t, i18n } = useTranslation('tools')

  // Séparateur décimal selon la langue (1,5 en FR, 1.5 en EN)
  const fmtValue = v => (typeof v === 'number'
    ? v.toLocaleString(i18n.language, { maximumFractionDigits: 2 })
    : v)
  const fmtRange = ([min, max]) => (max === null
    ? t('ui.sizeAndUp', { value: fmtValue(min) })
    : `${fmtValue(min)} – ${fmtValue(max)}`)

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {t('ui.namesVaryByBrand')}
      </p>

      {WEIGHTS.map((w, i) => (
        <div key={i} className="border border-gray-200 rounded-card p-4 bg-gray-50">
          {/* Noms */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">FR · {t(`ui.${w.euKey}`)}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">US · {w.us}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">UK · {w.uk}</span>
          </div>

          {/* Aiguilles */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-gray-500">{t('ui.needlesMm')}</p>
              <p className="text-sm font-semibold text-gray-800">{fmtRange(w.needlesMm)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">{t('ui.needlesUs')}</p>
              <p className="text-sm font-semibold text-gray-800">{fmtRange(w.needlesUs)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">{t('ui.hookMm')}</p>
              <p className="text-sm font-semibold text-gray-800">{fmtRange(w.crochetMm)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
