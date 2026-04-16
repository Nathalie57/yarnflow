/**
 * @file NeedleConverter.jsx
 * @brief Outil : Convertisseur de tailles d'aiguilles et crochets (EU/US/UK)
 */

import { useState } from 'react'

const KNITTING_NEEDLES = [
  { mm: 1.5,  us: '000',  uk: '—'  },
  { mm: 1.75, us: '00',   uk: '—'  },
  { mm: 2.0,  us: '0',    uk: '14' },
  { mm: 2.25, us: '1',    uk: '13' },
  { mm: 2.5,  us: '—',   uk: '12' },
  { mm: 2.75, us: '2',    uk: '12' },
  { mm: 3.0,  us: '—',   uk: '11' },
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
  { mm: 12.0, us: '17',   uk: '—'  },
  { mm: 15.0, us: '19',   uk: '—'  },
  { mm: 19.0, us: '35',   uk: '—'  },
  { mm: 25.0, us: '50',   uk: '—'  },
]

const CROCHET_HOOKS = [
  { mm: 0.6,  us: '14 (acier)' },
  { mm: 0.75, us: '12 (acier)' },
  { mm: 1.0,  us: '11 (acier)' },
  { mm: 1.25, us: '9 (acier)'  },
  { mm: 1.5,  us: '7 (acier)'  },
  { mm: 1.75, us: '5 (acier)'  },
  { mm: 2.0,  us: 'B/1'   },
  { mm: 2.25, us: 'B/1'   },
  { mm: 2.5,  us: 'C/2'   },
  { mm: 2.75, us: 'C/2'   },
  { mm: 3.0,  us: 'D/3'   },
  { mm: 3.25, us: 'D/3'   },
  { mm: 3.5,  us: 'E/4'   },
  { mm: 3.75, us: 'F/5'   },
  { mm: 4.0,  us: 'G/6'   },
  { mm: 4.5,  us: '7'     },
  { mm: 5.0,  us: 'H/8'   },
  { mm: 5.5,  us: 'I/9'   },
  { mm: 6.0,  us: 'J/10'  },
  { mm: 6.5,  us: 'K/10½'},
  { mm: 7.0,  us: '—'     },
  { mm: 8.0,  us: 'L/11'  },
  { mm: 9.0,  us: 'M/13'  },
  { mm: 10.0, us: 'N/15'  },
  { mm: 12.0, us: 'O/16'  },
  { mm: 15.0, us: 'P/Q'   },
  { mm: 19.0, us: 'S'     },
]

export default function NeedleConverter() {
  const [type, setType] = useState('knitting') // knitting | crochet
  const [search, setSearch] = useState('')

  const data = type === 'knitting' ? KNITTING_NEEDLES : CROCHET_HOOKS

  const filtered = search.trim()
    ? data.filter(n =>
        String(n.mm).includes(search) ||
        n.us.toLowerCase().includes(search.toLowerCase()) ||
        (n.uk && n.uk.toLowerCase().includes(search.toLowerCase()))
      )
    : data

  const highlighted = search.trim()
    ? filtered[0]
    : null

  return (
    <div className="space-y-4">
      {/* Type */}
      <div className="flex gap-2">
        <button
          onClick={() => { setType('knitting'); setSearch('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            type === 'knitting' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Aiguilles à tricoter
        </button>
        <button
          onClick={() => { setType('crochet'); setSearch('') }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            type === 'crochet' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Crochets
        </button>
      </div>

      {/* Recherche */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Chercher par taille (ex: 4 ou G/6)"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      {/* Résultat mis en avant si recherche */}
      {highlighted && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-primary-700">{highlighted.mm} mm</div>
            <div className="text-xs text-gray-500 mt-1">EU / mm</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-700">{highlighted.us}</div>
            <div className="text-xs text-gray-500 mt-1">US</div>
          </div>
          {type === 'knitting' && (
            <div>
              <div className="text-2xl font-bold text-primary-700">{highlighted.uk}</div>
              <div className="text-xs text-gray-500 mt-1">UK</div>
            </div>
          )}
        </div>
      )}

      {/* Table complète */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">EU (mm)</th>
              <th className="px-4 py-2 text-left">US</th>
              {type === 'knitting' && <th className="px-4 py-2 text-left">UK</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(n => (
              <tr
                key={n.mm}
                className={`transition ${
                  highlighted?.mm === n.mm
                    ? 'bg-primary-50 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-2">{n.mm}</td>
                <td className="px-4 py-2">{n.us}</td>
                {type === 'knitting' && <td className="px-4 py-2">{n.uk}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
