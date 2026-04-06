/**
 * @file LengthConverter.jsx
 * @brief Convertisseur de longueur : cm / pouces / yards / mètres
 */

import { useState } from 'react'

const UNITS = [
  { id: 'cm', label: 'cm', toMeters: 0.01 },
  { id: 'in', label: 'pouces (in)', toMeters: 0.0254 },
  { id: 'yd', label: 'yards (yd)', toMeters: 0.9144 },
  { id: 'm', label: 'mètres (m)', toMeters: 1 },
]

function convert(value, fromUnit, toUnit) {
  const meters = value * fromUnit.toMeters
  return meters / toUnit.toMeters
}

function fmt(n) {
  if (isNaN(n)) return '—'
  return n < 0.01 ? n.toExponential(2) : parseFloat(n.toFixed(4)).toString()
}

export default function LengthConverter() {
  const [value, setValue] = useState('')
  const [fromId, setFromId] = useState('cm')

  const from = UNITS.find(u => u.id === fromId)
  const numVal = parseFloat(value)
  const hasValue = value !== '' && !isNaN(numVal) && numVal >= 0

  return (
    <div className="space-y-6">
      {/* Saisie */}
      <div className="flex gap-3">
        <input
          type="number"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Valeur"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <select
          value={fromId}
          onChange={e => setFromId(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          {UNITS.map(u => (
            <option key={u.id} value={u.id}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Résultats */}
      <div className="space-y-2">
        {UNITS.filter(u => u.id !== fromId).map(u => (
          <div key={u.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">{u.label}</span>
            <span className="font-semibold text-gray-900">
              {hasValue ? fmt(convert(numVal, from, u)) : '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Rappel utile */}
      <div className="bg-primary-50 rounded-xl px-4 py-3 text-xs text-primary-700 space-y-1">
        <p>1 pouce = 2,54 cm</p>
        <p>1 yard = 91,44 cm = 3 pieds</p>
        <p>Les pelotes US sont souvent en yards, les EU en mètres</p>
      </div>
    </div>
  )
}
