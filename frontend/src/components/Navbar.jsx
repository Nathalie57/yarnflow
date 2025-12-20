import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/my-projects" className="text-2xl font-bold text-primary-600">
            🧶 YarnFlow
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-6">
            {/* PROJETS */}
            <Link
              to="/my-projects"
              className={`transition flex items-center gap-1 ${
                location.pathname === '/dashboard' || location.pathname === '/my-projects' || location.pathname.startsWith('/projects/')
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              🧶 Projets
            </Link>

            {/* BIBLIOTHÈQUE DE PATRONS */}
            <Link
              to="/pattern-library"
              className={`transition flex items-center gap-1 ${
                location.pathname === '/pattern-library'
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              📚 Patrons
            </Link>

            {/* GALERIE PHOTOS IA */}
            <Link
              to="/gallery"
              className={`transition flex items-center gap-1 ${
                location.pathname === '/gallery'
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              📸 Galerie
            </Link>

            {/* STATISTIQUES */}
            <Link
              to="/stats"
              className={`transition flex items-center gap-1 ${
                location.pathname === '/stats'
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              📈 Stats
            </Link>

            {/* ADMIN */}
            {isAdmin() && (
              <>
                <Link
                  to="/generator"
                  className={`transition flex items-center gap-1 ${
                    location.pathname === '/generator'
                      ? 'text-primary-600 font-semibold'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  🤖 Générer
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    ADMIN
                  </span>
                </Link>
                <Link
                  to="/admin"
                  className={`transition font-medium ${
                    location.pathname === '/admin'
                      ? 'text-primary-600 font-semibold'
                      : 'text-primary-600 hover:text-primary-700'
                  }`}
                >
                  Admin
                </Link>
              </>
            )}

            {/* User menu Desktop */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition">
                <span className="max-w-[120px] truncate">{user?.first_name || user?.email}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  ⚙️ Mon profil
                </Link>
                <Link
                  to="/subscription"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  💎 Abonnement
                </Link>
                <Link
                  to="/contact"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  📧 Contact
                </Link>
                <hr className="my-2" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  🚪 Déconnexion
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              // Close icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeMobileMenu}
      >
        <div
          className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="text-xl font-bold text-primary-600">
              🧶 YarnFlow
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 bg-primary-50 border-b">
            <div className="text-sm text-gray-600">Connecté en tant que</div>
            <div className="font-semibold text-primary-900 truncate">
              {user?.first_name || user?.email}
            </div>
          </div>

          {/* Mobile Menu Links */}
          <div className="p-4 space-y-2">
            <Link
              to="/my-projects"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg transition ${
                location.pathname === '/my-projects' || location.pathname.startsWith('/projects/')
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🧶 Mes Projets
            </Link>

            <Link
              to="/pattern-library"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg transition ${
                location.pathname === '/pattern-library'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📚 Bibliothèque Patrons
            </Link>

            <Link
              to="/gallery"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg transition ${
                location.pathname === '/gallery'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📸 Galerie Photos IA
            </Link>

            <Link
              to="/stats"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg transition ${
                location.pathname === '/stats'
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              📈 Statistiques
            </Link>

            {isAdmin() && (
              <>
                <Link
                  to="/generator"
                  onClick={closeMobileMenu}
                  className={`block px-4 py-3 rounded-lg transition ${
                    location.pathname === '/generator'
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🤖 Générer <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full ml-2">ADMIN</span>
                </Link>

                <Link
                  to="/admin"
                  onClick={closeMobileMenu}
                  className={`block px-4 py-3 rounded-lg transition ${
                    location.pathname === '/admin'
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  👑 Admin
                </Link>
              </>
            )}

            <hr className="my-4" />

            <Link
              to="/profile"
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              ⚙️ Mon profil
            </Link>

            <Link
              to="/subscription"
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              💎 Abonnement
            </Link>

            <Link
              to="/contact"
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              📧 Contact
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition font-medium"
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
