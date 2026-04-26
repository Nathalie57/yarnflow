import { Link, useLocation } from 'react-router-dom'

const BottomNav = ({ onOpenAi }) => {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">

        {/* Outils */}
        <Link to="/tools" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1">
          <div className={`p-1.5 rounded-xl transition-colors duration-150 ${isActive('/tools') ? 'bg-primary-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors duration-150 ${isActive('/tools') ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-150 ${isActive('/tools') ? 'text-primary-600' : 'text-gray-400'}`}>
            Outils
          </span>
        </Link>

        {/* Projets */}
        <Link to="/my-projects" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1">
          <div className={`p-1.5 rounded-xl transition-colors duration-150 ${isActive('/my-projects') ? 'bg-primary-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors duration-150 ${isActive('/my-projects') ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-150 ${isActive('/my-projects') ? 'text-primary-600' : 'text-gray-400'}`}>
            Projets
          </span>
        </Link>

        {/* Assistant IA */}
        <button
          onClick={onOpenAi}
          className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
        >
          <div className="p-1.5 rounded-xl transition-colors duration-150">
            <svg className="w-6 h-6 text-primary-600 transition-colors duration-150" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-primary-600">
            Assistant
          </span>
        </button>

        {/* Bibliothèque */}
        <Link to="/pattern-library" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1">
          <div className={`p-1.5 rounded-xl transition-colors duration-150 ${isActive('/pattern-library') ? 'bg-primary-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors duration-150 ${isActive('/pattern-library') ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-150 ${isActive('/pattern-library') ? 'text-primary-600' : 'text-gray-400'}`}>
            Biblio
          </span>
        </Link>

        {/* Galerie */}
        <Link to="/gallery" className="flex flex-col items-center gap-0.5 min-w-[56px] py-1">
          <div className={`p-1.5 rounded-xl transition-colors duration-150 ${isActive('/gallery') ? 'bg-primary-50' : ''}`}>
            <svg className={`w-6 h-6 transition-colors duration-150 ${isActive('/gallery') ? 'text-primary-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-150 ${isActive('/gallery') ? 'text-primary-600' : 'text-gray-400'}`}>
            Galerie
          </span>
        </Link>

      </div>
    </nav>
  )
}

export default BottomNav
