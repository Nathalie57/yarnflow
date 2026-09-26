/**
 * @file NeedleConverter.jsx
 * @brief Outil : Convertisseur de tailles d'aiguilles et crochets (EU/US/UK)
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const KNITTING_NEEDLES = [
  { mm: 1.5,  us: '000',  uk: '—'  },
  { mm: 1.75, us: '00',   uk: '—'  },
  { mm: 2.0,  us: '0',    uk: '14' },
  { mm: 2.25, us: '1',    uk: '13' },
  { mm: 2.5,  us: '1½',  uk: '—'  },
  { mm: 2.75, us: '2',    uk: '12' },
  { mm: 3.0,  us: '2½',  uk: '11' },
  { mm: 3.25, us: '3',    uk: '10' },
  { mm: 3.5,  us: '4',    uk: '—'  },
  { mm: 3.75, us: '5',    uk: '9'  },
  { mm: 4.0,  us: '6',    uk: '8'  },
  { mm: 4.5,  us: '7',    uk: '7'  },
  { mm: 5.0,  us: '8',    uk: '6'  },
  { mm: 5.5,  us: '9',    uk: '5'  },
  { mm: 6.0,  us: '10',   uk: '4'  },
  { mm: 6.5,  us: '10½', uk: '3'  },
  { mm: 7.0,  us: '—',   uk: '2'  },
  { mm: 7.5,  us: '—',   uk: '1'  },
  { mm: 8.0,  us: '11',   uk: '0'  },
  { mm: 9.0,  us: '13',   uk: '00' },
  { mm: 10.0, us: '15',   uk: '000'},
  // [AI:Claude] 2026-09-26 — 12 mm est courant en Europe mais sans équivalent US : le US 17 correspond à 12,75 mm
  { mm: 12.0,  us: '—',  uk: '—'  },
  { mm: 12.75, us: '17',  uk: '—'  },
  { mm: 15.0, us: '19',   uk: '—'  },
  { mm: 19.0, us: '35',   uk: '—'  },
  { mm: 25.0, us: '50',   uk: '—'  },
]

// [AI:Claude] 2026-09-26 — lettres US alignées sur le standard Craft Yarn Council ;
// les numéros des crochets acier varient selon les marques (0,6 mm n'a pas d'équivalent standard)
const CROCHET_HOOKS = [
  { mm: 0.6,  us: '—'              },
  { mm: 0.75, us: '14', steel: true },
  { mm: 1.0,  us: '12', steel: true },
  { mm: 1.25, us: '9',  steel: true },
  { mm: 1.5,  us: '8',  steel: true },
  { mm: 1.75, us: '5',  steel: true },
  { mm: 2.0,  us: '—'      },
  { mm: 2.25, us: 'B-1'    },
  { mm: 2.5,  us: '—'      },
  { mm: 2.75, us: 'C-2'    },
  { mm: 3.0,  us: '—'      },
  { mm: 3.25, us: 'D-3'    },
  { mm: 3.5,  us: 'E-4'    },
  { mm: 3.75, us: 'F-5'    },
  { mm: 4.0,  us: 'G-6'    },
  { mm: 4.5,  us: '7'      },
  { mm: 5.0,  us: 'H-8'    },
  { mm: 5.5,  us: 'I-9'    },
  { mm: 6.0,  us: 'J-10'   },
  { mm: 6.5,  us: 'K-10½' },
  { mm: 7.0,  us: '—'      },
  { mm: 8.0,  us: 'L-11'   },
  { mm: 9.0,  us: 'M/N-13' },
  { mm: 10.0, us: 'N/P-15' },
  { mm: 11.5, us: 'P-16'   },
  { mm: 12.0, us: '—'      },
  { mm: 15.0, us: 'Q'      },
  { mm: 16.0, us: 'Q'      },
  { mm: 19.0, us: 'S'      },
]

// Normalise une saisie ou une taille : espaces, virgule décimale, ½ → .5
function normalizeSize(str) {
  return String(str).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '.').replace(/½/g, '.5')
}

// [AI:Claude] 2026-09-26 — "G/6", "G-6" et "g6" doivent désigner la même taille ;
// une partie seule ("13", "M") retrouve aussi "M/N-13". Comparaison exacte, jamais de sous-chaîne.
function matchesSize(value, query) {
  if (!value || value === '—') return false
  const norm = normalizeSize(value)
  return norm.replace(/[/-]/g, '') === query.replace(/[/-]/g, '') ||
    norm.split(/[/-]/).includes(query)
}

/**
 * Recherche une taille : mm exact, puis US exact, puis UK exact.
 * Si rien d'exact et que la saisie est un nombre, renvoie la ligne mm la plus proche.
 */
function findSize(data, search) {
  const q = normalizeSize(search)
  if (!q) return { row: null, nearest: false }
  const isNumber = /^(\d+\.?\d*|\.\d+)$/.test(q)
  const num = isNumber ? parseFloat(q) : NaN

  if (isNumber) {
    const byMm = data.find(n => Math.abs(n.mm - num) < 1e-9)
    if (byMm) return { row: byMm, nearest: false }
  }
  const byUs = data.find(n => matchesSize(n.us, q))
  if (byUs) return { row: byUs, nearest: false }
  const byUk = data.find(n => matchesSize(n.uk, q))
  if (byUk) return { row: byUk, nearest: false }

  if (isNumber) {
    const nearest = data.reduce((best, n) => (Math.abs(n.mm - num) < Math.abs(best.mm - num) ? n : best), data[0])
    return { row: nearest, nearest: true }
  }
  return { row: null, nearest: false }
}

export default function NeedleConverter() {
  const { t, i18n } = useTranslation('tools')
  const [type, setType] = useState('knitting') // knitting | crochet
  const [search, setSearch] = useState('')

  const data = type === 'knitting' ? KNITTING_NEEDLES : CROCHET_HOOKS

  const { row: highlighted, nearest } = findSize(data, search)

  // [AI:Claude] 2026-09-26 — Centre la ligne trouvée dans le tableau (qui défile seul, à hauteur
  // bornée) plutôt que de faire défiler la page : sur mobile, le champ de recherche resterait
  // sinon hors de l'écran pendant la saisie.
  const tableRef = useRef(null)
  const rowRefs = useRef({})
  const highlightedMm = highlighted?.mm
  useEffect(() => {
    const container = tableRef.current
    const row = highlightedMm != null ? rowRefs.current[highlightedMm] : null
    if (!container || !row) return
    container.scrollTo({ top: row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2, behavior: 'smooth' })
  }, [highlightedMm, type])

  // Séparateur décimal selon la langue (2,5 en FR, 2.5 en EN)
  const fmtMm = mm => mm.toLocaleString(i18n.language, { maximumFractionDigits: 2 })
  const fmtUs = n => (n.steel ? `${n.us} (${t('ui.steel')})` : n.us)

  return (
    <div className="space-y-4">
      {/* Type */}
      <div className="flex gap-2">
        <button
          onClick={() => { setType('knitting'); setSearch('') }}
          className={`flex-1 py-2 rounded-control text-sm font-medium transition ${
            type === 'knitting' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('ui.knittingNeedles')}
        </button>
        <button
          onClick={() => { setType('crochet'); setSearch('') }}
          className={`flex-1 py-2 rounded-control text-sm font-medium transition ${
            type === 'crochet' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('ui.hooks')}
        </button>
      </div>

      {/* Recherche */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('ui.phSearchSize')}
        className="w-full border border-gray-300 rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {/* Résultat mis en avant si recherche */}
      {highlighted && (
        <div className="space-y-2">
          {nearest && (
            <p className="text-xs text-gray-500">
              {t('ui.noExactSizeNearest', { size: fmtMm(highlighted.mm) })}
            </p>
          )}
          <div className="bg-primary-50 border border-primary-200 rounded-card p-4 flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-primary-700">{fmtMm(highlighted.mm)} mm</div>
              <div className="text-xs text-gray-500 mt-1">{t('ui.euSlashMm')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-700">{fmtUs(highlighted)}</div>
              <div className="text-xs text-gray-500 mt-1">US</div>
            </div>
            {type === 'knitting' && (
              <div>
                <div className="text-2xl font-bold text-primary-700">{highlighted.uk}</div>
                <div className="text-xs text-gray-500 mt-1">UK</div>
              </div>
            )}
          </div>
          {/* Pas de taille US standard (ex. crochet 2,5 mm, entre B-1 et C-2) : les marques
              étiquettent alors souvent avec la taille voisine. */}
          {highlighted.us === '—' && (
            <p className="text-xs text-gray-500">{t('ui.noStandardUsSize')}</p>
          )}
        </div>
      )}

      {/* Table complète */}
      <div ref={tableRef} className="relative rounded-card border border-gray-200 overflow-y-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">{t('ui.euMm')}</th>
              <th className="px-4 py-2 text-left">US</th>
              {type === 'knitting' && <th className="px-4 py-2 text-left">UK</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(n => (
              <tr
                key={n.mm}
                ref={el => { rowRefs.current[n.mm] = el }}
                className={`transition ${
                  highlighted?.mm === n.mm
                    ? 'bg-primary-50 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-2">{fmtMm(n.mm)}</td>
                <td className="px-4 py-2">{fmtUs(n)}</td>
                {type === 'knitting' && <td className="px-4 py-2">{n.uk}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
