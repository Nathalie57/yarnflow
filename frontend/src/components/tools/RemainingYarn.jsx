/**
 * @file RemainingYarn.jsx
 * @brief Calculateur de laine restante — estime ce qu'on peut encore tricoter
 */

import { useState } from 'react'

export default function RemainingYarn() {
  const [totalWeight, setTotalWeight] = useState('')   // poids pelote neuve (g)
  const [totalMeters, setTotalMeters] = useState('')   // métrage pelote neuve (m)
  const [remainingWeight, setRemainingWeight] = useState('') // poids restant (g)

  const total = parseFloat(totalWeight)
  const meters = parseFloat(totalMeters)
  const remaining = parseFloat(remainingWeight)

  const valid = total > 0 && meters > 0 && remaining >= 0 && remaining <= total

  const metersPerGram = valid ? meters / total : null
  const remainingMeters = valid ? remaining * metersPerGram : null
  const usedPercent = valid ? ((total - remaining) / total * 100) : null

  return (
    <div className="space-y-6">

      {/* Infos pelote */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Pelote d'origine</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Poids total (g)</label>
            <input
              type="number" min="0" value={totalWeight}
              onChange={e => setTotalWeight(e.target.value)}
              placeholder="ex: 100"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Métrage total (m)</label>
            <input
              type="number" min="0" value={totalMeters}
              onChange={e => setTotalMeters(e.target.value)}
              placeholder="ex: 200"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
        </div>
      </div>

      {/* Poids restant */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Poids de la pelote entamée (g)
        </label>
        <input
          type="number" min="0" value={remainingWeight}
          onChange={e => setRemainingWeight(e.target.value)}
          placeholder="ex: 43"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <p className="text-xs text-gray-400 mt-1">Pesez votre pelote entamée sur une balance</p>
      </div>

      {/* Résultats */}
      {valid && (
        <div className="space-y-3">
          {/* Barre de progression */}
          <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full bg-primary-500 transition-all"
              style={{ width: `${usedPercent.toFixed(1)}%` }}
            />
          </div>
          <p className="text-xs text-center text-gray-500">{usedPercent.toFixed(1)}% utilisée</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Mètres restants</p>
              <p className="text-xl font-bold text-green-700">{Math.round(remainingMeters)} m</p>
            </div>
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Déjà utilisé</p>
              <p className="text-xl font-bold text-gray-700">{Math.round(meters - remainingMeters)} m</p>
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl px-4 py-3 text-xs text-primary-700">
            Densité : {metersPerGram.toFixed(2)} m/g · Il reste {remaining}g sur {total}g
          </div>
        </div>
      )}

      {!valid && totalWeight && totalMeters && remainingWeight && (
        <p className="text-sm text-red-500 text-center">
          Le poids restant ne peut pas dépasser le poids total.
        </p>
      )}
    </div>
  )
}
