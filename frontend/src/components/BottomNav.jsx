/**
 * @file BottomNav.jsx
 * @brief Barre de navigation flottante en bas de l'écran (mobile uniquement)
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

import { Link, useLocation } from 'react-router-dom'

const BottomNav = ({ onOpenAi }) => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-3">

        {/* Outils */}
        <Link
          to="/tools"
          className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/tools') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">🧮</span>
          <span className="text-xs font-medium">Outils</span>
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
            NEW
          </span>
        </Link>

        {/* Projets */}
        <Link
          to="/my-projects"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/my-projects') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">📁</span>
          <span className="text-xs font-medium">Projets</span>
        </Link>

        {/* Assistant IA — bouton central surélevé */}
        <button
          onClick={onOpenAi}
          className="relative flex flex-col items-center -mt-6"
        >
          <div className="w-14 h-14 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-transform">
            🤖
          </div>
          <span className="text-[10px] font-medium text-primary-600 mt-1">Assistant</span>
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
            NEW
          </span>
        </button>

        {/* Bibliothèque */}
        <Link
          to="/pattern-library"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/pattern-library') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">📚</span>
          <span className="text-xs font-medium">Bibliothèque</span>
        </Link>

        {/* Galerie */}
        <Link
          to="/gallery"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/gallery') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">🖼️</span>
          <span className="text-xs font-medium">Galerie</span>
        </Link>

      </div>
    </div>
  )
}

export default BottomNav
