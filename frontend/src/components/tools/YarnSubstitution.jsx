/**
 * @file YarnSubstitution.jsx
 * @brief Outil de substitution de laine — calculateur FREE + recherche IA PLUS/PRO
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { yarnSubstitutionAPI, yarnStashAPI } from '../../services/api'

const WEIGHT_LABELS = {
  lace:        { label: 'Lace / Dentelle',    needle: '1,5 – 2,25 mm', yardage: '800 – 1 200 m/100g' },
  fingering:   { label: 'Fingering / Sock',   needle: '2,25 – 3,25 mm', yardage: '350 – 500 m/100g' },
  sport:       { label: 'Sport / Baby',        needle: '3,25 – 3,75 mm', yardage: '250 – 350 m/100g' },
  dk:          { label: 'DK / Double Knit',   needle: '3,75 – 4,5 mm',  yardage: '200 – 280 m/100g' },
  worsted:     { label: 'Worsted',             needle: '4,5 – 5,5 mm',   yardage: '150 – 220 m/100g' },
  aran:        { label: 'Aran / Heavy Worsted',needle: '5 – 6 mm',       yardage: '130 – 170 m/100g' },
  bulky:       { label: 'Bulky / Grosse laine',needle: '6 – 9 mm',       yardage: '80 – 130 m/100g' },
  super_bulky: { label: 'Super Bulky',         needle: '9 mm et +',      yardage: '< 100 m/100g' },
}

const PAID_PLANS = ['plus', 'plus_annual', 'pro', 'pro_annual', 'early_bird']

export default function YarnSubstitution() {
  const { user } = useAuth()
  const plan = user?.subscription_type ?? 'free'
  const isPaid = PAID_PLANS.includes(plan)

  const [mode, setMode] = useState(isPaid ? 'ai' : 'calc')

  // AI state
  const [yarnInput, setYarnInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [stashMatches, setStashMatches] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!yarnInput.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    setStashMatches(null)

    try {
      const res = await yarnSubstitutionAPI.suggest(yarnInput.trim())
      setResult(res.data)

      if (res.data.original?.weight_category) {
        try {
          const stash = await yarnStashAPI.getAll({ yarn_weight_category: res.data.original.weight_category })
          if (stash.data.entries?.length > 0) {
            setStashMatches(stash.data.entries)
          }
        } catch {
          // stash check non bloquant
        }
      }
    } catch (err) {
      if (err.response?.data?.upgrade_required) {
        setError('upgrade')
      } else {
        setError(err.response?.data?.error ?? 'Une erreur est survenue, réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {isPaid && (
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setMode('ai')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${mode === 'ai' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Recherche par nom
          </button>
          <button
            onClick={() => setMode('calc')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${mode === 'calc' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Par caractéristiques
          </button>
        </div>
      )}

      {mode === 'ai' && (
        <div className="space-y-5">
          {!isPaid && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-sm text-primary-800">
              La recherche par nom de laine est disponible en{' '}
              <Link to="/subscription" className="font-semibold underline">plan PLUS ou PRO</Link>.
              <span className="block mt-1 text-primary-600">Utilisez le calculateur par caractéristiques ci-dessous.</span>
            </div>
          )}

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={yarnInput}
              onChange={e => setYarnInput(e.target.value)}
              placeholder="Ex : Drops Merino Extra Fine, Phildar Phil Coton 4..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-50"
              disabled={!isPaid || loading}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!isPaid || loading || !yarnInput.trim()}
              className="bg-primary-500 hover:bg-primary-600 disabled:opacity-40 text-white font-semibold px-5 py-3 rounded-xl text-sm transition"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Recherche...
                </span>
              ) : 'Trouver'}
            </button>
          </form>

          {error && error !== 'upgrade' && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}

          {result && (
            <div className="space-y-4">
              {result.original && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm">
                  <span className="text-gray-500">Fil original détecté :</span>{' '}
                  <span className="font-semibold text-gray-800">{result.original.brand} {result.original.name}</span>
                  {result.original.weight_category && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {WEIGHT_LABELS[result.original.weight_category]?.label ?? result.original.weight_category}
                    </span>
                  )}
                  {result.original.yardage_per_100g && (
                    <span className="ml-2 text-xs text-gray-500">~{result.original.yardage_per_100g} m/100g</span>
                  )}
                </div>
              )}

              {result.original === null && (
                <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  Ce fil n'a pas été reconnu. Vérifiez l'orthographe ou utilisez le calculateur par caractéristiques.
                </p>
              )}

              {result.substitutes?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">{result.substitutes.length} substitut{result.substitutes.length > 1 ? 's' : ''} suggéré{result.substitutes.length > 1 ? 's' : ''}</p>
                  {result.substitutes.map((sub, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-1.5 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{sub.brand} <span className="text-primary-600">{sub.name}</span></p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {sub.composition && <span>{sub.composition} · </span>}
                            {sub.yardage_per_100g && <span>~{sub.yardage_per_100g} m/100g</span>}
                          </p>
                        </div>
                        {sub.weight_category && (
                          <span className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                            {WEIGHT_LABELS[sub.weight_category]?.label ?? sub.weight_category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{sub.why}</p>
                      {sub.tips && (
                        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 leading-relaxed">
                          Conseil : {sub.tips}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {stashMatches && stashMatches.length > 0 && (
                <div className="border border-primary-200 bg-primary-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-primary-800">
                    Dans votre stock — {stashMatches.length} pelote{stashMatches.length > 1 ? 's' : ''} compatible{stashMatches.length > 1 ? 's' : ''}
                  </p>
                  {stashMatches.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-primary-100">
                      <div>
                        <span className="font-medium text-gray-800">{entry.brand} {entry.yarn_name}</span>
                        {entry.color_name && <span className="text-gray-500 ml-1">· {entry.color_name}</span>}
                      </div>
                      <span className="text-primary-700 font-semibold text-xs">{entry.quantity_available} disponible{entry.quantity_available > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'calc' && (
        <div className="space-y-5">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Exemple de résultat en PLUS</p>
            </div>
            <div className="p-4 space-y-3 opacity-60 pointer-events-none select-none">
              <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm">
                <span className="text-gray-500">Fil original détecté :</span>{' '}
                <span className="font-semibold text-gray-800">Phildar Phil Caresse</span>
                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">DK / Double Knit</span>
                <span className="ml-2 text-xs text-gray-500">~292 m/100g</span>
              </div>
              {[
                { brand: 'Drops', name: 'Safran', why: 'Même épaisseur DK, ~160m/50g, très bonne tenue.' },
                { brand: 'Rico', name: 'Essentials Cotton DK', why: 'Composition proche, même comportement aux aiguilles.' },
              ].map((sub, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-white space-y-1">
                  <p className="font-semibold text-gray-800 text-sm">{sub.brand} <span className="text-primary-600">{sub.name}</span></p>
                  <p className="text-xs text-gray-600">{sub.why}</p>
                </div>
              ))}
              <div className="border border-primary-200 bg-primary-50 rounded-xl p-3 text-xs text-primary-800">
                Dans votre stock — 2 pelotes de Rico Essentials Cotton DK compatibles
              </div>
            </div>
          </div>

          <Link
            to="/subscription"
            className="block w-full text-center bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl text-sm transition"
          >
            Passer en PLUS pour débloquer la recherche
          </Link>
          <p className="text-xs text-center text-gray-400">2,49€/mois · résiliable à tout moment</p>
        </div>
      )}
    </div>
  )
}
