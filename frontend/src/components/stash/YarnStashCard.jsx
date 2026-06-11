/**
 * @file YarnStashCard.jsx
 * @brief Carte pelote dans la liste du stock
 */

const WEIGHT_LABELS = {
  lace:     'Lace',
  fingering: 'Fingering',
  sport:    'Sport',
  dk:       'DK',
  worsted:  'Worsted',
  aran:     'Aran',
  bulky:    'Bulky',
  super_bulky: 'Super Bulky',
}

const YarnStashCard = ({ entry, onEdit, onDelete }) => {
  const totalWeight  = Math.round((entry.weight_per_skein_g  * entry.quantity) * 10) / 10
  const totalYardage = Math.round((entry.yardage_per_skein_m * entry.quantity) * 10) / 10

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex items-stretch">
        {/* Pastille couleur */}
        <div
          className="w-3 flex-shrink-0"
          style={{ backgroundColor: entry.color_hex || '#e5e7eb' }}
        />

        <div className="flex-1 p-4">
          {/* En-tête : marque + gamme */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide truncate">
                {entry.brand}
              </p>
              <h3 className="font-semibold text-gray-900 leading-tight truncate">
                {entry.yarn_name}
              </h3>
              {entry.color_name && (
                <p className="text-sm text-gray-500 truncate">{entry.color_name}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(entry)}
                className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                title="Modifier"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(entry)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Quantité + totaux */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
              </svg>
              {entry.quantity} {entry.quantity === 1 ? 'pelote' : 'pelotes'}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
              {totalWeight} g · {totalYardage} m
            </span>

            {entry.yarn_weight_category && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                {WEIGHT_LABELS[entry.yarn_weight_category] || entry.yarn_weight_category}
              </span>
            )}

            {entry.needle_size_mm && (
              <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-full">
                Aig. {entry.needle_size_mm} mm
              </span>
            )}

            {entry.composition && (
              <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs rounded-full truncate max-w-[160px]">
                {entry.composition}
              </span>
            )}
          </div>

          {entry.notes && (
            <p className="mt-2 text-xs text-gray-400 line-clamp-2 italic">{entry.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default YarnStashCard
