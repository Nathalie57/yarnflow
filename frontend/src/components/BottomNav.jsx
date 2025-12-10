/**
 * @file BottomNav.jsx
 * @brief Barre de navigation flottante en bas de l'écran (mobile uniquement)
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

import { Link, useLocation } from 'react-router-dom'

const BottomNav = () => {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {/* Projets */}
        <Link
          to="/my-projects"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/my-projects')
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">📁</span>
          <span className="text-xs font-medium">Projets</span>
        </Link>

        {/* Bibliothèque */}
        <Link
          to="/pattern-library"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/pattern-library')
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">📚</span>
          <span className="text-xs font-medium">Bibliothèque</span>
        </Link>

        {/* Galerie */}
        <Link
          to="/gallery"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
            isActive('/gallery')
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
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
