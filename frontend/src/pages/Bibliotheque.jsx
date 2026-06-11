/**
 * @file Bibliotheque.jsx
 * @brief Page hub de la Bibliothèque — accès aux patrons, stock, et futures sections
 * @author Nathalie + AI Assistants
 * @created 2026-06-09
 */

import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    to: '/pattern-library',
    title: 'Mes patrons',
    description: 'Tes patrons PDF, liens et textes, organisés et liés à tes projets.',
    icon: (
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    to: '/stash',
    title: 'Mon stock',
    description: 'Ton inventaire de pelotes — marque, coloris, métrages, quantités.',
    icon: (
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
]

const Bibliotheque = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bibliothèque</h1>
          <p className="mt-1 text-sm text-gray-500">Tes ressources de tricot et crochet</p>
        </div>

        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex items-center gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-5"
            >
              <div className="flex-shrink-0 w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center">
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{s.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{s.description}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Bibliotheque
