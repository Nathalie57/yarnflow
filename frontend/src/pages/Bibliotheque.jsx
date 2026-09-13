/**
 * @file Bibliotheque.jsx
 * @brief Page hub de la Bibliothèque — accès aux patrons, stock, et futures sections
 * @author Nathalie + AI Assistants
 * @created 2026-06-09
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SECTIONS = [
  {
    to: '/pattern-library',
    key: 'patterns',
    icon: (
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    to: '/stash',
    key: 'stash',
    icon: (
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    to: '/tools',
    key: 'tools',
    icon: (
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
  },
  {
    to: '/gallery',
    key: 'gallery',
    icon: (
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
]

const Bibliotheque = () => {
  const { t } = useTranslation('library')
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('ui.library')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('ui.libraryTagline')}</p>
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
                <p className="font-semibold text-gray-900">{t(`hub.${s.key}.title`)}</p>
                <p className="text-sm text-gray-500 mt-0.5 leading-snug">{t(`hub.${s.key}.description`)}</p>
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
