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
import { useTranslation, Trans } from 'react-i18next'

// Matrice de métrages estimés (en mètres) par [projet][épaisseur][taille]
const MATRIX = {
  pull_femme: {
    labelKey: 'itemWomensSweater',
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
    labelKey: 'itemMensSweater',
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
    labelKey: 'itemWomensCardigan',
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
    labelKey: 'itemBeanie',
    // [AI:Claude] 2026-09-26 — ids stables (valeurs du select), libellés traduits via sizeLabelKeys
    sizes: ['Enfant', 'Adulte S/M', 'Adulte L/XL'],
    sizeLabelKeys: ['sizeChild', 'sizeAdultSM', 'sizeAdultLXL'],
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
    labelKey: 'itemScarf',
    sizes: ['Courte (~120 cm)', 'Standard (~160 cm)', 'Longue (~200 cm)'],
    sizeLabelKeys: ['sizeScarfShort', 'sizeScarfStandard', 'sizeScarfLong'],
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

const WEIGHT_LABEL_KEYS = {
  lace:      'wLace',
  fingering: 'wFingering',
  sport:     'wSport',
  dk:        'wDk',
  worsted:   'wWorsted',
  bulky:     'wBulky',
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

// Pelotes réellement disponibles : quantity_available (quantité moins la part réservée
// aux projets actifs) quand l'API la fournit, sinon quantity.
const availableSkeins = (e) => parseInt(e.quantity_available ?? e.quantity ?? 0, 10) || 0
const availableMeters = (e) => availableSkeins(e) * (parseFloat(e.yardage_per_skein_m) || 0)

export default function YarnCalculator() {
  const { t, i18n } = useTranslation('tools')
  const [projectType, setProjectType] = useState('')
  const [size, setSize] = useState('')
  const [weight, setWeight] = useState('')
  const [skeinMeters, setSkeinMeters] = useState('')

  // [AI:Claude] 2026-09-26 — on ne stocke que les entrées récupérées ; total et verdict sont
  // dérivés de l'estimation courante (sinon le verdict restait figé après un changement de taille)
  const [stockData, setStockData] = useState(null) // null | { loading } | { entries }
  const [stockError, setStockError] = useState(null)

  const { hasActiveSubscription } = useAuth()
  const isPro = hasActiveSubscription()

  const project = MATRIX[projectType] || null

  const sizeLabel = (p, s) => {
    const idx = p ? p.sizes.indexOf(s) : -1
    const key = idx >= 0 ? p.sizeLabelKeys?.[idx] : null
    return key ? t(`ui.${key}`) : s
  }

  const handleProjectChange = (val) => {
    setProjectType(val)
    setSize('')
    setStockData(null)
    setStockError(null)
  }

  const handleWeightChange = (val) => {
    setWeight(val)
    setStockData(null)
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
    setStockData({ loading: true })
    setStockError(null)
    try {
      const res = await yarnStashAPI.getAll()
      setStockData({ loading: false, entries: res.data?.entries ?? [] })
    } catch {
      setStockData(null)
      setStockError(t('ui.stashFetchFailed'))
    }
  }

  const stockCheck = useMemo(() => {
    if (!stockData || stockData.loading) return stockData
    const cats = STASH_CATEGORIES[weight] ?? [weight]
    const matching = stockData.entries.filter(e => cats.includes(e.yarn_weight_category))
    const total = Math.round(matching.reduce((sum, e) => sum + availableMeters(e), 0))
    return { loading: false, entries: matching, total, enough: estimatedMeters != null && total >= estimatedMeters }
  }, [stockData, weight, estimatedMeters])

  return (
    <div className="space-y-6">

      {/* Type de projet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('ui.projectType')}
        </label>
        <select
          value={projectType}
          onChange={e => handleProjectChange(e.target.value)}
          className="w-full border border-gray-300 rounded-control px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">{t('ui.chooseType')}</option>
          {Object.entries(MATRIX).map(([key, p]) => (
            <option key={key} value={key}>{p.labelKey ? t(`ui.${p.labelKey}`) : p.label}</option>
          ))}
        </select>
      </div>

      {/* Taille */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('ui.size')}
        </label>
        <select
          value={size}
          onChange={e => setSize(e.target.value)}
          disabled={!project}
          className="w-full border border-gray-300 rounded-control px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">{t('ui.chooseSize')}</option>
          {project?.sizes.map(s => (
            <option key={s} value={s}>{sizeLabel(project, s)}</option>
          ))}
        </select>
      </div>

      {/* Épaisseur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('ui.yarnWeight')}
        </label>
        <select
          value={weight}
          onChange={e => handleWeightChange(e.target.value)}
          disabled={!project}
          className="w-full border border-gray-300 rounded-control px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">{t('ui.chooseWeight')}</option>
          {Object.entries(WEIGHT_LABEL_KEYS).map(([key, labelKey]) => (
            <option key={key} value={key}>{t(`ui.${labelKey}`)}</option>
          ))}
        </select>
      </div>

      {/* Résultat */}
      {estimatedMeters && (
        <div className="bg-primary-50 border border-primary-200 rounded-card p-5 space-y-5">

          {/* Métrage estimé */}
          <div>
            <p className="text-sm text-primary-700 leading-relaxed">
              <Trans t={t} i18nKey="ui.forAProject" values={{ item: project.labelKey ? t(`ui.${project.labelKey}`) : project.label, size: sizeLabel(project, size), weight: t(`ui.${WEIGHT_LABEL_KEYS[weight]}`) }}><strong /><strong /><strong /></Trans>
            </p>
            <p className="text-4xl font-bold text-primary-700 mt-2">
              {estimatedMeters.toLocaleString(i18n.language)} m
            </p>
            <p className="text-xs text-primary-500 mt-1">
              {t('ui.estimateDisclaimer')}
            </p>
          </div>

          {/* Simulateur de pelotes */}
          <div className="border-t border-primary-200 pt-4">
            <label className="block text-sm font-medium text-primary-800 mb-1.5">
              {t('ui.ballLength')}
            </label>
            <input
              type="number"
              min="1"
              value={skeinMeters}
              onChange={e => setSkeinMeters(e.target.value)}
              placeholder={t('ui.phEx200b')}
              className="w-full border border-primary-300 rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            {skeinResult && (
              <div className="grid grid-cols-2 gap-3 mt-3 text-center">
                <div className="bg-white rounded-control p-3 border border-primary-200">
                  <div className="text-3xl font-bold text-primary-700">{skeinResult.min}</div>
                  <div className="text-xs text-primary-600 mt-1">{t('ui.ballsMinimum')}</div>
                </div>
                <div className="bg-white rounded-control p-3 border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600">{skeinResult.safe}</div>
                  <div className="text-xs text-emerald-600 mt-1">{t('ui.withMargin15')}</div>
                </div>
              </div>
            )}
          </div>

          {/* Vérifier dans le stock */}
          <div className="border-t border-primary-200 pt-4">
            <button
              onClick={checkStock}
              disabled={stockCheck?.loading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-primary-400 text-primary-700 font-medium text-sm rounded-control px-4 py-2.5 hover:bg-primary-50 transition disabled:opacity-60"
            >
              {stockCheck?.loading ? (
                <span>{t('ui.verifying')}</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                  </svg>
                  {t('ui.checkMyStash')}
                </>
              )}
            </button>

            {stockError && (
              <p className="text-xs text-red-600 mt-2 text-center">{stockError}</p>
            )}

            {stockCheck && !stockCheck.loading && (
              <div className="mt-3 space-y-3">
                {/* Verdict */}
                <div className={`rounded-control p-4 text-center ${stockCheck.enough ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`font-semibold text-base ${stockCheck.enough ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {stockCheck.enough
                      ? t('ui.enoughYarn', { n: stockCheck.total.toLocaleString(i18n.language) })
                      : t('ui.notEnoughYarn', { n: stockCheck.total.toLocaleString(i18n.language) })
                    }
                  </p>
                  {stockCheck.entries.length > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('ui.stashTotalAllYarns')}
                    </p>
                  )}
                  {!stockCheck.enough && (
                    <p className="text-xs text-amber-600 mt-1">
                      {t('ui.shortByMeters', { n: (estimatedMeters - stockCheck.total).toLocaleString(i18n.language) })}
                    </p>
                  )}
                </div>

                {/* Entrées du stash correspondantes */}
                {stockCheck.entries.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('ui.stockRefs', { count: stockCheck.entries.length })}
                    </p>
                    {stockCheck.entries.map(e => (
                      <div key={e.id} className="flex items-center gap-3 bg-white rounded-control px-3 py-2 border border-gray-200">
                        {e.color_hex && (
                          <span
                            className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200"
                            style={{ backgroundColor: e.color_hex }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{e.brand} — {e.yarn_name}</p>
                          <p className="text-xs text-gray-500">
                            {t('ui.ballsTimes', { count: availableSkeins(e), m: e.yardage_per_skein_m })}
                            {e.quantity_reserved > 0 && (
                              <> · {t('ui.ballsReservedForProjects', { count: e.quantity_reserved })}</>
                            )}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-primary-700 flex-shrink-0">
                          {Math.round(availableMeters(e)).toLocaleString(i18n.language)} m
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center">
                    {t('ui.noBallOfThisWeight')}
                  </p>
                )}

                {!isPro && (
                  <p className="text-xs text-gray-400 text-center pt-1">
                    {t('ui.stockLimitFree')}{' '}
                    <Link to="/subscription" className="text-primary-600 hover:underline font-medium">
                      {t('ui.upgradePro')}
                    </Link>{' '}
                    {t('ui.forUnlimitedStock')}
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
