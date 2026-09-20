import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FlowMascot from './FlowMascot'

const STASH_NEW_KEY = 'yf_stash_new_seen'

const BottomNav = ({ onOpenAi }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const isProjectsActive = location.pathname === '/my-projects' || location.pathname.startsWith('/projects/')
  const isLibraryActive = ['/bibliotheque', '/pattern-library', '/stash', '/tools', '/gallery'].includes(location.pathname) || location.pathname.startsWith('/pattern-library/')

  const [showNew, setShowNew] = useState(() => !localStorage.getItem(STASH_NEW_KEY))
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (isLibraryActive && showNew) {
      localStorage.setItem(STASH_NEW_KEY, '1')
      setShowNew(false)
    }
  }, [isLibraryActive])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">

        {/* Projets */}
        <Link to="/my-projects" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1">
          <div className={`p-1.5 rounded-control transition-colors duration-150 ${isProjectsActive ? 'bg-primary-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors duration-150 ${isProjectsActive ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-150 ${isProjectsActive ? 'text-primary-600' : 'text-gray-400'}`}>
            {t('nav.projects')}
          </span>
        </Link>

        {/* Créer un projet — action principale, mise en avant visuellement */}
        <Link to="/my-projects?create=1" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 -mt-4">
          <div className="w-12 h-12 rounded-full bg-primary-600 shadow-lg shadow-primary-600/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-primary-600">
            {t('nav.create')}
          </span>
        </Link>

        {/* Assistant IA */}
        <button
          onClick={onOpenAi}
          className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
        >
          <div className="p-1 rounded-control transition-colors duration-150">
            <FlowMascot pose="content" size={34} />
          </div>
          <span className="text-[10px] font-medium text-primary-600">
            {t('nav.assistant')}
          </span>
        </button>

        {/* Ressources (bibliothèque, stock, outils, galerie) */}
        <Link to="/bibliotheque" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1 relative">
          <div className={`p-1.5 rounded-control transition-colors duration-150 relative ${isLibraryActive ? 'bg-primary-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors duration-150 ${isLibraryActive ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            {showNew && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-150 ${isLibraryActive ? 'text-primary-600' : 'text-gray-400'}`}>
            {t('nav.resources')}
          </span>
        </Link>

      </div>
    </nav>
  )
}

export default BottomNav
