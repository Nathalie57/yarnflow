/**
 * @file YarnStashCard.jsx
 * @brief Carte pelote dans la liste du stock
 */

const API_URL = import.meta.env.VITE_API_URL || ''

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

const YarnStashCard = ({ entry, onEdit, onDelete, onAssign }) => {
  const totalWeight  = Math.round((entry.weight_per_skein_g  * entry.quantity) * 10) / 10
  const totalYardage = Math.round((entry.yardage_per_skein_m * entry.quantity) * 10) / 10

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex items-stretch">
        {/* Photo ou pastille couleur */}
        {entry.photo_url ? (
          <div className="w-16 flex-shrink-0 relative">
            <img
              src={API_URL + entry.photo_url}
              alt="Étiquette"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className="w-3 flex-shrink-0"
            style={{ backgroundColor: entry.color_hex || '#e5e7eb' }}
          />
        )}

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

          {entry.quantity_reserved > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>
                <strong>{entry.quantity_reserved}</strong> réservée{entry.quantity_reserved > 1 ? 's' : ''}
                {entry.reserved_by && <span className="text-amber-600"> · {entry.reserved_by}</span>}
                {entry.quantity_available !== undefined && (
                  <span className="text-amber-500"> ({entry.quantity_available} disponible{entry.quantity_available > 1 ? 's' : ''})</span>
                )}
              </span>
            </div>
          )}

          {entry.notes && (
            <p className="mt-2 text-xs text-gray-400 line-clamp-2 italic">{entry.notes}</p>
          )}

          {entry.purchase_url && (
            <a
              href={entry.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              Racheter
            </a>
          )}

          {onAssign && entry.quantity_available > 0 && (
            <button
              onClick={() => onAssign(entry)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-xs font-medium hover:bg-primary-100 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Utiliser pour un projet
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default YarnStashCard
