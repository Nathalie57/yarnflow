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
import { useTranslation, Trans } from 'react-i18next'

// Algorithme de répartition de Bresenham adapté au tricot
// `remainder` intervalles de (base+1), `(count - remainder)` intervalles de base
function distribute(total, count) {
  const base = Math.floor(total / count)
  const remainder = total % count

  const longInterval = base + 1
  const shortInterval = base
  const longCount = remainder
  const shortCount = count - remainder

  return { longInterval, shortInterval, longCount, shortCount, base, remainder }
}

// Valide la saisie : renvoie { result } ou { error: { key, params } }.
// Saisie incomplète → {} (ni résultat ni erreur).
function computeDistribution(totalRaw, countRaw, type, axis) {
  if (totalRaw === '' || countRaw === '') return {}
  const total = Number(totalRaw)
  const count = Number(countRaw)
  if (!Number.isFinite(total) || !Number.isFinite(count)) return {}

  if (total <= 0 || count <= 0) return { error: { key: 'ui.distMustBePositive' } }
  if (!Number.isInteger(total) || !Number.isInteger(count)) return { error: { key: 'ui.distMustBeWhole' } }

  if (type === 'dim' && axis === 'mailles') {
    // [AI:Claude] 2026-09-26 — une diminution consomme 2 mailles (2 ensemble) :
    // pas plus de floor(total / 2) diminutions sur un rang. Sur l'axe rangs,
    // la limite reste 1 diminution par rang (count <= total).
    const max = Math.floor(total / 2)
    if (count > max) return { error: { key: 'ui.distTooManyDecreasesStitches', params: { count: max, total } } }
  } else if (count > total) {
    return { error: { key: type === 'aug' ? 'ui.tooManyIncreases' : 'ui.tooManyDecreases' } }
  }

  return { result: distribute(total, count) }
}

// Génère la phrase d'explication (traduite : elle est aussi enregistrée dans les notes)
function buildExplanation(result, type, axis, t) {
  if (!result) return null
  const { longInterval, shortInterval, longCount, shortCount } = result

  // Groupes non vides, du plus long au plus court
  const groups = [
    { n: longInterval, times: longCount },
    { n: shortInterval, times: shortCount }
  ].filter(g => g.times > 0)

  const times = g => t('ui.distTimes', { count: g.times })

  // [AI:Claude] 2026-09-26 — diminutions sur un rang : on donne les mailles à
  // tricoter avant chaque "2 m. ensemble", sinon "toutes les 8 mailles" laisse
  // un doute (les 2 mailles diminuées sont-elles comprises ?).
  if (type === 'dim' && axis === 'mailles') {
    const segment = g => (g.n > 2
      ? t('ui.distDecSegment', { count: g.n - 2 })
      : t('ui.distDecSegmentOnly'))
    // [AI:Claude] 2026-09-26 — un groupe fait une seule fois se lit "Tricote …", pas
    // "Répète 1 fois : …" ; le 2e groupe est en minuscule après "puis".
    const part = (g, lead) => t(
      g.times === 1 ? (lead ? 'ui.distDecStsLeadOnce' : 'ui.distDecStsNextOnce') : (lead ? 'ui.distDecStsLead' : 'ui.distDecStsNext'),
      { times: times(g), segment: segment(g) }
    )
    if (groups.length === 1) return t('ui.distDecStsSingle', { part: part(groups[0], true) })
    return t('ui.distDecStsPair', { first: part(groups[0], true), second: part(groups[1], false) })
  }

  const interval = g => t(axis === 'rangs' ? 'ui.distEveryRows' : 'ui.distEveryStitches', { count: g.n })
  const prefix = type === 'aug' ? 'ui.distInc' : 'ui.distDec'
  if (groups.length === 1) {
    return t(`${prefix}Once`, { interval: interval(groups[0]), times: times(groups[0]) })
  }
  return t(`${prefix}Two`, {
    interval1: interval(groups[0]), times1: times(groups[0]),
    interval2: interval(groups[1]), times2: times(groups[1])
  })
}

export default function DistributeIncrDec() {
  const { t } = useTranslation('tools')
  const { hasActiveSubscription } = useAuth()
  const navigate = useNavigate()
  const isPaidPlan = hasActiveSubscription()

  const [total, setTotal] = useState('')
  const [count, setCount] = useState('')
  const [type, setType] = useState('aug') // aug | dim
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSequenceModal, setShowSequenceModal] = useState(false)
  const [axis, setAxis] = useState('mailles') // mailles | rangs

  const { result, error } = useMemo(
    () => computeDistribution(total, count, type, axis),
    [total, count, type, axis]
  )
  const explanation = useMemo(() => buildExplanation(result, type, axis, t), [result, type, axis, t])
  const resultRef = useRef(null)

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [result])

  return (
    <div className="space-y-5">
      {/* Type */}
      <div className="flex gap-2">
        <button
          onClick={() => setType('aug')}
          className={`flex-1 py-2 rounded-control text-sm font-medium transition ${
            type === 'aug' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('ui.increases')}
        </button>
        <button
          onClick={() => setType('dim')}
          className={`flex-1 py-2 rounded-control text-sm font-medium transition ${
            type === 'dim' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('ui.decreases')}
        </button>
      </div>

      {/* Axe */}
      <div className="flex gap-2">
        <button
          onClick={() => setAxis('mailles')}
          className={`flex-1 py-2 rounded-control text-sm font-medium transition ${
            axis === 'mailles' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('ui.overOneRow')}
        </button>
        <button
          onClick={() => setAxis('rangs')}
          className={`flex-1 py-2 rounded-control text-sm font-medium transition ${
            axis === 'rangs' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('ui.overRows')}
        </button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {axis === 'mailles' ? t('ui.stitchCount') : t('ui.rowCount')}
          </label>
          <input
            type="number"
            min="1"
            value={total}
            onChange={e => setTotal(e.target.value)}
            placeholder={t('ui.phEx80')}
            className="w-full border border-gray-300 rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'aug' ? t('ui.numberOfIncreases') : t('ui.numberOfDecreases')}
          </label>
          <input
            type="number"
            min="1"
            value={count}
            onChange={e => setCount(e.target.value)}
            placeholder={t('ui.phEx12')}
            className="w-full border border-gray-300 rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Résultat */}
      {error && (
        <div className="bg-red-50 text-red-700 rounded-control p-4 text-sm">
          {t(error.key, error.params)}
        </div>
      )}

      {result && explanation && (
        <div ref={resultRef} className="bg-primary-50 border border-primary-200 rounded-card p-5 space-y-3">
          <p className="text-base font-semibold text-primary-900">{explanation}</p>

          <div className="flex gap-4 pt-1 text-sm text-primary-700">
            {[
              { n: result.longInterval, times: result.longCount },
              { n: result.shortInterval, times: result.shortCount }
            ].filter(g => g.times > 0).map(g => (
              <span key={g.n} className="bg-white rounded-control px-3 py-1 border border-primary-200">
                {type === 'dim' && axis === 'mailles' ? (
                  g.n > 2
                    ? <Trans t={t} i18nKey="ui.decGroupPill" values={{ knit: g.n - 2, count: g.times }}><strong /></Trans>
                    : <Trans t={t} i18nKey="ui.decGroupPillOnly" values={{ count: g.times }}><strong /></Trans>
                ) : (
                  <Trans t={t} i18nKey={axis === 'rangs' ? 'ui.everyNthRows' : 'ui.everyNthStitches'} values={{ n: g.n, count: g.times }}><strong /></Trans>
                )}
              </span>
            ))}
          </div>

          {axis === 'mailles' && (
            <p className="text-sm text-primary-800">
              {t('ui.stitchesAtRowEnd', { count: type === 'aug' ? Number(total) + Number(count) : Number(total) - Number(count) })}
            </p>
          )}
          <p className="text-xs text-primary-600">
            {t('ui.checkResult', { detail: `${result.longCount > 0 ? `${result.longInterval} × ${result.longCount}` : ''}${result.longCount > 0 && result.shortCount > 0 ? ' + ' : ''}${result.shortCount > 0 ? `${result.shortInterval} × ${result.shortCount}` : ''}`, total: Number(total) })}
          </p>
          <div>
            <button
              onClick={() => setShowSaveModal(true)}
              className="w-full py-2 rounded-control text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              {t('ui.saveToProjectArrow')}
            </button>
            <p className="text-xs text-primary-600 text-center mt-1">{t('ui.saveDistribution')}</p>
          </div>
          {axis === 'rangs' && (
            isPaidPlan ? (
              <div>
                <button
                  onClick={() => setShowSequenceModal(true)}
                  className="w-full py-2 rounded-control text-sm font-medium bg-white border border-primary-600 text-primary-700 hover:bg-primary-50 transition"
                >
                  {t('ui.createSectionCounter')}
                </button>
                <p className="text-xs text-gray-500 text-center mt-1">{t('ui.createInteractiveCounter')}</p>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => navigate('/subscription')}
                  className="w-full py-2 rounded-control text-sm font-medium bg-white border border-gray-300 text-gray-400 transition flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  {t('ui.createSectionCounterPro')}
                </button>
                <p className="text-xs text-gray-500 text-center mt-1">{t('ui.createInteractiveCounter')}</p>
              </div>
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
            label: type === 'aug' ? t('ui.increases') : t('ui.decreases'),
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
