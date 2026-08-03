/**
 * @file YarnStashStats.jsx
 * @brief Bandeau récap global du stock (références, pelotes, poids, métrages)
 */

import { useTranslation } from 'react-i18next'

const YarnStashStats = ({ stats }) => {
  const { t } = useTranslation('tools')
  if (!stats) return null

  const formatWeight = (g) => {
    if (g >= 1000) return `${(g / 1000).toFixed(2).replace('.', ',')} kg`
    return `${g} g`
  }

  const formatYardage = (m) => {
    if (m >= 1000) return `${(m / 1000).toFixed(2).replace('.', ',')} km`
    return `${m} m`
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-primary-600">{stats.total_references}</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.total_references === 1 ? 'référence' : 'références'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-primary-600">{stats.total_skeins}</div>
        <div className="text-xs text-gray-500 mt-1">
          {stats.total_skeins === 1 ? 'pelote' : 'pelotes'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-indigo-600">{formatWeight(stats.total_weight_g)}</div>
        <div className="text-xs text-gray-500 mt-1">{t('ui.ofWool')}</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-violet-600">{formatYardage(stats.total_yardage_m)}</div>
        <div className="text-xs text-gray-500 mt-1">{t('ui.ofYarn')}</div>
      </div>
    </div>
  )
}

export default YarnStashStats
