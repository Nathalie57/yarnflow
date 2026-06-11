/**
 * @file YarnCalculator.jsx
 * @brief Outil : Calculateur de pelotes
 *
 * Estime le métrage total selon le type de projet, la taille et l'épaisseur du fil.
 * Permet de vérifier si le stock actuel est suffisant.
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { yarnStashAPI } from '../../services/api'

// Matrice de métrages estimés (en mètres) par [projet][épaisseur][taille]
const MATRIX = {
  pull_femme: {
    label: 'Pull Femme',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    weights: {
      lace:      [1600, 1800, 2000, 2250, 2500, 2800],
      fingering: [1300, 1450, 1650, 1850, 2100, 2350],
      sport:     [1050, 1200, 1350, 1500, 1700, 1900],
      dk:        [850,  950,  1100, 1250, 1400, 1600],
      worsted:   [650,  750,  850,  1000, 1150, 1300],
      bulky:     [400,  450,  550,  650,  750,  850],
    },
  },
  pull_homme: {
    label: 'Pull Homme',
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    weights: {
      lace:      [1900, 2100, 2400, 2700, 3000, 3300],
      fingering: [1600, 1800, 2000, 2250, 2500, 2800],
      sport:     [1300, 1450, 1650, 1850, 2100, 2350],
      dk:        [1050, 1200, 1400, 1600, 1800, 2000],
      worsted:   [800,  950,  1100, 1250, 1450, 1650],
      bulky:     [500,  600,  700,  800,  950,  1100],
    },
  },
  gilet_femme: {
    label: 'Gilet Femme',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    weights: {
      lace:      [1300, 1450, 1650, 1850, 2100, 2350],
      fingering: [1050, 1200, 1350, 1500, 1700, 1900],
      sport:     [850,  950,  1100, 1250, 1400, 1600],
      dk:        [700,  800,  900,  1050, 1200, 1350],
      worsted:   [550,  650,  750,  850,  1000, 1150],
      bulky:     [350,  400,  450,  550,  650,  750],
    },
  },
  bonnet: {
    label: 'Bonnet',
    sizes: ['Enfant', 'Adulte S/M', 'Adulte L/XL'],
    weights: {
      lace:      [250, 350, 400],
      fingering: [200, 280, 320],
      sport:     [150, 200, 230],
      dk:        [100, 150, 175],
      worsted:   [80,  110, 130],
      bulky:     [50,  80,  100],
    },
  },
  echarpe: {
    label: 'Écharpe',
    sizes: ['Courte (~120 cm)', 'Standard (~160 cm)', 'Longue (~200 cm)'],
    weights: {
      lace:      [400, 600, 900],
      fingering: [300, 450, 650],
      sport:     [250, 380, 550],
      dk:        [200, 300, 450],
      worsted:   [150, 250, 350],
      bulky:     [100, 150, 220],
    },
  },
}

const WEIGHT_LABELS = {
  lace:      'Lace (très fin)',
  fingering: 'Fingering (fin)',
  sport:     'Sport',
  dk:        'DK (mi-fin)',
  worsted:   'Worsted / Aran (moyen)',
  bulky:     'Bulky (épais)',
}

// Catégories du stash correspondant à chaque épaisseur du calculateur
const STASH_CATEGORIES = {
  lace:      ['lace'],
  fingering: ['fingering'],
  sport:     ['sport'],
  dk:        ['dk'],
  worsted:   ['worsted', 'aran'],
  bulky:     ['bulky', 'super_bulky'],
}

export default function YarnCalculator() {
  const [projectType, setProjectType] = useState('')
  const [size, setSize] = useState('')
  const [weight, setWeight] = useState('')
  const [skeinMeters, setSkeinMeters] = useState('')

  const [stockCheck, setStockCheck] = useState(null) // null | { loading } | { entries, total, enough }
  const [stockError, setStockError] = useState(null)

  const { hasActiveSubscription } = useAuth()
  const isPro = hasActiveSubscription()

  const project = MATRIX[projectType] || null

  const handleProjectChange = (val) => {
    setProjectType(val)
    setSize('')
    setStockCheck(null)
    setStockError(null)
  }

  const handleWeightChange = (val) => {
    setWeight(val)
    setStockCheck(null)
    setStockError(null)
  }

  const estimatedMeters = useMemo(() => {
    if (!project || !size || !weight) return null
    const sizeIdx = project.sizes.indexOf(size)
    if (sizeIdx === -1) return null
    return project.weights[weight]?.[sizeIdx] ?? null
  }, [project, size, weight])

  const skeinResult = useMemo(() => {
    if (!estimatedMeters || !skeinMeters) return null
    const perSkein = parseFloat(skeinMeters)
    if (!perSkein || perSkein <= 0) return null
    const exact = estimatedMeters / perSkein
    return { min: Math.ceil(exact), safe: Math.ceil(exact * 1.15) }
  }, [estimatedMeters, skeinMeters])

  const checkStock = async () => {
    setStockCheck({ loading: true })
    setStockError(null)
    try {
      const res = await yarnStashAPI.getAll()
      const allEntries = res.data?.entries ?? []
      const cats = STASH_CATEGORIES[weight] ?? [weight]
      const matching = allEntries.filter(e => cats.includes(e.yarn_weight_category))
      const total = matching.reduce((sum, e) => sum + parseFloat(e.total_yardage_m ?? 0), 0)
      setStockCheck({ loading: false, entries: matching, total: Math.round(total), enough: total >= estimatedMeters })
    } catch {
      setStockCheck(null)
      setStockError('Impossible de récupérer le stock. Vérifiez votre connexion.')
    }
  }

  return (
    <div className="space-y-6">

      {/* Type de projet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Type de projet
        </label>
        <select
          value={projectType}
          onChange={e => handleProjectChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">— Choisir un type —</option>
          {Object.entries(MATRIX).map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Taille */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Taille
        </label>
        <select
          value={size}
          onChange={e => setSize(e.target.value)}
          disabled={!project}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">— Choisir une taille —</option>
          {project?.sizes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Épaisseur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Épaisseur du fil
        </label>
        <select
          value={weight}
          onChange={e => handleWeightChange(e.target.value)}
          disabled={!project}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">— Choisir une épaisseur —</option>
          {Object.entries(WEIGHT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Résultat */}
      {estimatedMeters && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 space-y-5">

          {/* Métrage estimé */}
          <div>
            <p className="text-sm text-primary-700 leading-relaxed">
              Pour un <strong>{project.label}</strong> taille <strong>{size}</strong> en <strong>{WEIGHT_LABELS[weight]}</strong>
            </p>
            <p className="text-4xl font-bold text-primary-700 mt-2">
              {estimatedMeters.toLocaleString('fr-FR')} m
            </p>
            <p className="text-xs text-primary-500 mt-1">
              Estimation indicative — peut varier selon la densité du point et le modèle.
            </p>
          </div>

          {/* Simulateur de pelotes */}
          <div className="border-t border-primary-200 pt-4">
            <label className="block text-sm font-medium text-primary-800 mb-1.5">
              Métrage de votre pelote (m)
            </label>
            <input
              type="number"
              min="1"
              value={skeinMeters}
              onChange={e => setSkeinMeters(e.target.value)}
              placeholder="ex : 200"
              className="w-full border border-primary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            {skeinResult && (
              <div className="grid grid-cols-2 gap-3 mt-3 text-center">
                <div className="bg-white rounded-lg p-3 border border-primary-200">
                  <div className="text-3xl font-bold text-primary-700">{skeinResult.min}</div>
                  <div className="text-xs text-primary-600 mt-1">pelotes minimum</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600">{skeinResult.safe}</div>
                  <div className="text-xs text-emerald-600 mt-1">avec +15 % de marge</div>
                </div>
              </div>
            )}
          </div>

          {/* Vérifier dans le stock */}
          <div className="border-t border-primary-200 pt-4">
            <button
              onClick={checkStock}
              disabled={stockCheck?.loading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-primary-400 text-primary-700 font-medium text-sm rounded-lg px-4 py-2.5 hover:bg-primary-50 transition disabled:opacity-60"
            >
              {stockCheck?.loading ? (
                <span>Vérification…</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                  </svg>
                  Vérifier dans mon stock
                </>
              )}
            </button>

            {stockError && (
              <p className="text-xs text-red-600 mt-2 text-center">{stockError}</p>
            )}

            {stockCheck && !stockCheck.loading && (
              <div className="mt-3 space-y-3">
                {/* Verdict */}
                <div className={`rounded-lg p-4 text-center ${stockCheck.enough ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`font-semibold text-base ${stockCheck.enough ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {stockCheck.enough
                      ? `Vous avez assez — ${stockCheck.total.toLocaleString('fr-FR')} m disponibles`
                      : `Pas encore assez — ${stockCheck.total.toLocaleString('fr-FR')} m disponibles`
                    }
                  </p>
                  {!stockCheck.enough && (
                    <p className="text-xs text-amber-600 mt-1">
                      Il manque {(estimatedMeters - stockCheck.total).toLocaleString('fr-FR')} m
                    </p>
                  )}
                </div>

                {/* Entrées du stash correspondantes */}
                {stockCheck.entries.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {stockCheck.entries.length} référence{stockCheck.entries.length > 1 ? 's' : ''} dans votre stock
                    </p>
                    {stockCheck.entries.map(e => (
                      <div key={e.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-200">
                        {e.color_hex && (
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
                            style={{ backgroundColor: e.color_hex }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{e.brand} — {e.yarn_name}</p>
                          <p className="text-xs text-gray-500">{e.quantity} pelote{e.quantity > 1 ? 's' : ''} × {e.yardage_per_skein_m} m</p>
                        </div>
                        <span className="text-sm font-semibold text-primary-700 flex-shrink-0">
                          {e.total_yardage_m.toLocaleString('fr-FR')} m
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center">
                    Aucune pelote de cette épaisseur dans votre stock.
                  </p>
                )}

                {!isPro && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    Stock limité à 10 références en FREE —{' '}
                    <Link to="/subscription" className="text-primary-600 hover:underline font-medium">
                      Passer à PRO
                    </Link>{' '}
                    pour un stock illimité.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
