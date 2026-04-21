/**
 * @file YarnCalculator.jsx
 * @brief Outil : Calculateur de pelotes
 *
 * Calcule le nombre de pelotes nécessaires selon le métrage total du projet
 * et le métrage par pelote.
 */

import { useState, useMemo } from 'react'

// Projets types avec métrage estimé en mètres
const PROJECT_PRESETS = [
  { label: 'Écharpe simple',         min: 200,  max: 400  },
  { label: 'Bonnet adulte',          min: 100,  max: 200  },
  { label: 'Chaussettes (paire)',    min: 350,  max: 450  },
  { label: 'Pull adulte (laine DK)', min: 900,  max: 1200 },
  { label: 'Pull adulte (grosse laine)', min: 400, max: 700 },
  { label: 'Gilet adulte',          min: 700,  max: 1000 },
  { label: 'Plaid / couverture',    min: 1500, max: 3000 },
  { label: 'Doudou / amigurumi',    min: 100,  max: 250  },
  { label: 'Sac au crochet',        min: 300,  max: 600  },
]

export default function YarnCalculator() {
  const [preset, setPreset] = useState('')
  const [totalMeters, setTotalMeters] = useState('')
  const [metersPerBall, setMetersPerBall] = useState('')

  const handlePreset = (p) => {
    setPreset(p.label)
    // Prendre la moyenne comme point de départ
    setTotalMeters(String(Math.round((p.min + p.max) / 2)))
  }

  const result = useMemo(() => {
    const total = parseFloat(totalMeters)
    const perBall = parseFloat(metersPerBall)
    if (!total || !perBall || total <= 0 || perBall <= 0) return null

    const exact = total / perBall
    const base = Math.ceil(exact)
    const withMargin = Math.ceil(exact * 1.15) // +15% marge de sécurité

    return { exact: exact.toFixed(1), base, withMargin }
  }, [totalMeters, metersPerBall])

  return (
    <div className="space-y-5">
      {/* Projet type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Projet type <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROJECT_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={`text-left px-3 py-2 rounded-lg text-xs border transition ${
                preset === p.label
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              {p.label}
              <span className="block text-gray-400 mt-0.5">{p.min}–{p.max} m</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Métrage total (m)
          </label>
          <input
            type="number"
            min="1"
            value={totalMeters}
            onChange={e => { setTotalMeters(e.target.value); setPreset('') }}
            placeholder="ex: 800"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mètres / pelote
          </label>
          <input
            type="number"
            min="1"
            value={metersPerBall}
            onChange={e => setMetersPerBall(e.target.value)}
            placeholder="ex: 200"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Résultat */}
      {result && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-700">{result.base}</div>
              <div className="text-sm text-primary-600 mt-1">pelotes minimum</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-600">{result.withMargin}</div>
              <div className="text-sm text-emerald-600 mt-1">avec +15% de marge</div>
            </div>
          </div>
          <p className="text-xs text-primary-600 text-center">
            Calcul exact : {result.exact} pelotes — toujours prévoir une pelote de plus pour les finitions.
          </p>
        </div>
      )}
    </div>
  )
}
