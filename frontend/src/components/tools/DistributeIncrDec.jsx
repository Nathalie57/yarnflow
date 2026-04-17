/**
 * @file DistributeIncrDec.jsx
 * @brief Outil : Répartir les augmentations et diminutions
 *
 * Calcule comment espacer uniformément des augmentations/diminutions
 * sur un nombre de mailles ou de rangs donné.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import SaveDistributeToProjectModal from './SaveDistributeToProjectModal'
import SaveSequenceToSectionModal from './SaveSequenceToSectionModal'

// Algorithme de répartition de Bresenham adapté au tricot
// Retourne un tableau de N intervalles distribués aussi uniformément que possible
function distribute(total, count) {
  if (!total || !count || count <= 0 || total <= 0) return null
  if (count > total) return null

  const base = Math.floor(total / count)
  const remainder = total % count

  // `remainder` intervalles de (base+1), `(count - remainder)` intervalles de base
  const longInterval = base + 1
  const shortInterval = base
  const longCount = remainder
  const shortCount = count - remainder

  return { longInterval, shortInterval, longCount, shortCount, base, remainder }
}

// Génère la phrase d'explication en langage naturel
function buildExplanation(result, type, axis) {
  if (!result) return null
  const { longInterval, shortInterval, longCount, shortCount } = result
  const verb = type === 'aug' ? 'augmentez' : 'diminuez'
  const unit = axis === 'rangs' ? 'rang' : 'maille'
  const units = axis === 'rangs' ? 'rangs' : 'mailles'

  if (longCount === 0) {
    return `${verb.charAt(0).toUpperCase() + verb.slice(1)} 1 ${unit} tous les ${shortInterval} ${units}.`
  }

  if (shortCount === 0) {
    return `${verb.charAt(0).toUpperCase() + verb.slice(1)} 1 ${unit} tous les ${longInterval} ${units}.`
  }

  return (
    `${verb.charAt(0).toUpperCase() + verb.slice(1)} 1 ${unit} tous les ${longInterval} ${units} (${longCount} fois), ` +
    `puis tous les ${shortInterval} ${units} (${shortCount} fois).`
  )
}

export default function DistributeIncrDec() {
  const { hasActiveSubscription } = useAuth()
  const navigate = useNavigate()
  const isPaidPlan = hasActiveSubscription()

  const [total, setTotal] = useState('')
  const [count, setCount] = useState('')
  const [type, setType] = useState('aug') // aug | dim
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSequenceModal, setShowSequenceModal] = useState(false)
  const [axis, setAxis] = useState('mailles') // mailles | rangs

  const result = useMemo(() => distribute(Number(total), Number(count)), [total, count])
  const explanation = useMemo(() => buildExplanation(result, type, axis), [result, type, axis])
  const resultRef = useRef(null)

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result])

  const hasError = total && count && !result

  return (
    <div className="space-y-5">
      {/* Type */}
      <div className="flex gap-2">
        <button
          onClick={() => setType('aug')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            type === 'aug' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Augmentations
        </button>
        <button
          onClick={() => setType('dim')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            type === 'dim' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Diminutions
        </button>
      </div>

      {/* Axe */}
      <div className="flex gap-2">
        <button
          onClick={() => setAxis('mailles')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            axis === 'mailles' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sur une rangée
        </button>
        <button
          onClick={() => setAxis('rangs')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            axis === 'rangs' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Sur des rangs
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {axis === 'mailles' ? 'Nombre de mailles' : 'Nombre de rangs'}
          </label>
          <input
            type="number"
            min="1"
            value={total}
            onChange={e => setTotal(e.target.value)}
            placeholder="ex: 80"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre d'{type === 'aug' ? 'augmentations' : 'diminutions'}
          </label>
          <input
            type="number"
            min="1"
            value={count}
            onChange={e => setCount(e.target.value)}
            placeholder="ex: 12"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Résultat */}
      {hasError && (
        <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">
          Le nombre de {type === 'aug' ? "d'augmentations" : 'de diminutions'} ne peut pas dépasser le total.
        </div>
      )}

      {result && explanation && (
        <div ref={resultRef} className="bg-primary-50 border border-primary-200 rounded-xl p-5 space-y-3">
          <p className="text-base font-semibold text-primary-900">{explanation}</p>

          <div className="flex gap-4 pt-1 text-sm text-primary-700">
            {result.longCount > 0 && (
              <span className="bg-white rounded-lg px-3 py-1 border border-primary-200">
                Tous les <strong>{result.longInterval}</strong> → {result.longCount}×
              </span>
            )}
            {result.shortCount > 0 && (
              <span className="bg-white rounded-lg px-3 py-1 border border-primary-200">
                Tous les <strong>{result.shortInterval}</strong> → {result.shortCount}×
              </span>
            )}
          </div>

          <p className="text-xs text-primary-600">
            Vérification : {result.longCount > 0 ? `${result.longInterval} × ${result.longCount}` : ''}{result.longCount > 0 && result.shortCount > 0 ? ' + ' : ''}{result.shortCount > 0 ? `${result.shortInterval} × ${result.shortCount}` : ''} = {Number(total)}
          </p>
          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
          >
            Enregistrer dans un projet →
          </button>
          {axis === 'rangs' && (
            isPaidPlan ? (
              <button
                onClick={() => setShowSequenceModal(true)}
                className="w-full py-2 rounded-lg text-sm font-medium bg-white border border-primary-600 text-primary-700 hover:bg-primary-50 transition"
              >
                Créer un compteur de section
              </button>
            ) : (
              <button
                onClick={() => navigate('/subscription')}
                className="w-full py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-400 transition flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Créer un compteur de section — PRO
              </button>
            )
          )}
        </div>
      )}

      {showSaveModal && explanation && (
        <SaveDistributeToProjectModal
          text={explanation}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {showSequenceModal && result && (
        <SaveSequenceToSectionModal
          sequence={{
            label: type === 'aug' ? 'Augmentations' : 'Diminutions',
            steps: [
              { target: result.longInterval, repeat: result.longCount },
              { target: result.shortInterval, repeat: result.shortCount }
            ].filter(s => s.repeat > 0)
          }}
          onClose={() => setShowSequenceModal(false)}
        />
      )}
    </div>
  )
}
