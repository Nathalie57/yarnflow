/**
 * @file LengthConverter.jsx
 * @brief Convertisseur de longueur : cm / pouces / yards / mètres
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const UNITS = [
  { id: 'cm', labelKey: 'unitCm', toMeters: 0.01 },
  { id: 'in', labelKey: 'unitInches', toMeters: 0.0254 },
  { id: 'yd', labelKey: 'unitYards', toMeters: 0.9144 },
  { id: 'm', labelKey: 'unitMeters', toMeters: 1 },
]

function convert(value, fromUnit, toUnit) {
  const meters = value * fromUnit.toMeters
  return meters / toUnit.toMeters
}

// [AI:Claude] 2026-09-26 — jamais de notation scientifique : 0 → "0", au-dessus de 1 jusqu'à
// 4 décimales, en dessous de 1 jusqu'à 4 chiffres significatifs ; séparateur décimal de la langue
function fmt(n, lang) {
  if (!Number.isFinite(n)) return '—'
  if (n === 0) return '0'
  return n >= 1
    ? n.toLocaleString(lang, { maximumFractionDigits: 4 })
    : n.toLocaleString(lang, { maximumSignificantDigits: 4 })
}

// Accepte "2,5" comme "2.5" ; renvoie NaN si la saisie n'est pas un nombre
function parseInput(str) {
  const s = str.trim().replace(',', '.')
  return /^(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(s) : NaN
}

export default function LengthConverter() {
  const { t, i18n } = useTranslation('tools')
  const [value, setValue] = useState('')
  const [fromId, setFromId] = useState('cm')

  const from = UNITS.find(u => u.id === fromId)
  const numVal = parseInput(value)
  const hasValue = !isNaN(numVal) && numVal >= 0

  return (
    <div className="space-y-6">
      {/* Saisie */}
      <div className="flex gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('ui.phValue')}
          className="flex-1 border border-gray-300 rounded-card px-4 py-3 text-flow-ink focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <select
          value={fromId}
          onChange={e => setFromId(e.target.value)}
          className="border border-gray-300 rounded-card px-3 py-3 text-flow-ink focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          {UNITS.map(u => (
            <option key={u.id} value={u.id}>{t(`ui.${u.labelKey}`)}</option>
          ))}
        </select>
      </div>

      {/* Résultats */}
      <div className="space-y-2">
        {UNITS.filter(u => u.id !== fromId).map(u => (
          <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-card px-4 py-3">
            <span className="text-sm text-gray-600">{t(`ui.${u.labelKey}`)}</span>
            <span className="font-semibold text-flow-ink">
              {hasValue ? fmt(convert(numVal, from, u), i18n.language) : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Rappel utile */}
      <div className="bg-primary-50 rounded-card px-4 py-3 text-xs text-primary-700 space-y-1">
        <p>{t('ui.inchEquals')}</p>
        <p>{t('ui.yardEquals')}</p>
        <p>{t('ui.usYardsEuMeters')}</p>
      </div>
    </div>
  )
}
