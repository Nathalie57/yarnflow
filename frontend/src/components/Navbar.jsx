import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import api from '../services/api'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [showHelpMenuDesktop, setShowHelpMenuDesktop] = useState(false)
  const [streak, setStreak] = useState(0)

  // [AI:Claude] Rappel passif de la série en cours, visible sur toutes les
  // pages (contrairement à Stats qu'il faut aller consulter volontairement).
  // Layout garde Navbar monté en permanence entre les navigations : un seul
  // fetch au montage ne suffit pas, il restait figé des jours durant tant que
  // l'onglet n'était pas rechargé — on rafraîchit aussi quand l'onglet
  // redevient visible (typiquement en revenant le lendemain).
  useEffect(() => {
    if (!user) return

    const fetchStreak = () => {
      api.get('/projects/stats', { params: { period: 'all' } })
        .then(res => setStreak(res.data?.stats?.current_streak || 0))
        .catch(() => {})
    }

    fetchStreak()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchStreak()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    // [AI:Claude] Émis par ProjectCounter juste après l'ajout d'un rang, pour
    // ne pas attendre un changement de visibilité avant de voir la série bouger
    window.addEventListener('yf:row-added', fetchStreak)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('yf:row-added', fetchStreak)
    }
  }, [user])

  const StreakBadge = ({ className = '' }) => (
    streak > 0 ? (
      <span
        className={`inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 ${className}`}
        title={t('streak.badgeTitle', { count: streak })}
      >
        🔥 {streak}
      </span>
    ) : null
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/my-projects" className="text-xl font-bold text-primary-600 tracking-tight">
            YarnFlow
          </Link>

          {/* Help + Menu Burger buttons - Mobile uniquement */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Help Button - Mobile uniquement */}
            <div className="relative">
              <button
                onClick={() => setShowHelpMenu(!showHelpMenu)}
                className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 transition w-10 h-10 flex items-center justify-center"
                aria-label={t('help.buttonLabel')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </button>

            {/* Help Menu Dropdown */}
            {showHelpMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHelpMenu(false)}
                />
                <div className="absolute right-0 top-12 z-50 bg-white rounded-xl shadow-2xl border-2 border-primary-200 w-72 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
                    <h3 className="text-white font-bold text-lg">{t('help.title')}</h3>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/contact"
                      onClick={() => setShowHelpMenu(false)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
                    >
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                          {t('help.contactUs')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t('help.contactUsDesc')}
                        </p>
                      </div>
                    </Link>

                    <Link
                      to="/cgu"
                      onClick={() => setShowHelpMenu(false)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
                    >
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                          {t('help.legal')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t('help.legalDesc')}
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      {t('help.version')}
                    </p>
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Série en cours */}
            <StreakBadge />

            {/* Sélecteur de langue */}
            <LanguageSwitcher />

            {/* Avatar utilisateur - confirme visuellement qu'on est connecté, sans avoir à ouvrir le menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0"
              aria-label={t('userMenu.connected')}
              title={t('userMenu.loggedInAsName', { name: user?.first_name || user?.email || '' })}
            >
              {(user?.first_name || user?.email || '?').charAt(0).toUpperCase()}
            </button>

            {/* Mobile Menu Button - Mobile uniquement */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-800 hover:bg-gray-100 transition"
              aria-label={t('menu.toggle')}
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

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-6">

            {/* Help Button Desktop */}
            <div className="relative">
              <button
                onClick={() => setShowHelpMenuDesktop(!showHelpMenuDesktop)}
                className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 text-primary-700 transition w-10 h-10 flex items-center justify-center font-bold text-lg"
                aria-label={t('help.buttonLabel')}
                title={t('help.buttonTitle')}
              >
                ?
              </button>

              {/* Help Menu Dropdown Desktop */}
              {showHelpMenuDesktop && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHelpMenuDesktop(false)}
                  />
                  <div className="absolute left-0 top-12 z-50 bg-white rounded-xl shadow-2xl border-2 border-primary-200 w-72 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
                      <h3 className="text-white font-bold text-lg">{t('help.title')}</h3>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/contact"
                        onClick={() => setShowHelpMenuDesktop(false)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                            {t('help.contactUs')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {t('help.contactUsDesc')}
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/cgu"
                        onClick={() => setShowHelpMenuDesktop(false)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-primary-700">
                            {t('help.legal')}
                          </p>
                          <p className="text-xs text-gray-600">
                            {t('help.legalDesc')}
                          </p>
                        </div>
                      </Link>
                    </div>

                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        {t('help.version')}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* PROJETS */}
            <Link
              to="/my-projects"
              className={`text-sm transition-colors ${
                location.pathname === '/dashboard' || location.pathname === '/my-projects' || location.pathname.startsWith('/projects/')
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.projects')}
            </Link>

            {/* RESSOURCES */}
            <Link
              to="/bibliotheque"
              className={`text-sm transition-colors ${
                ['/bibliotheque', '/pattern-library', '/stash'].some(p => location.pathname === p) || location.pathname.startsWith('/pattern-library/')
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.resources')}
            </Link>

            {/* GALERIE PHOTOS IA */}
            <Link
              to="/gallery"
              className={`text-sm transition-colors ${
                location.pathname === '/gallery'
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.gallery')}
            </Link>

            {/* OUTILS */}
            <Link
              to="/tools"
              className={`text-sm transition-colors ${
                location.pathname === '/tools'
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.tools')}
            </Link>

            {/* STATISTIQUES */}
            <Link
              to="/stats"
              className={`text-sm transition-colors ${
                location.pathname === '/stats'
                  ? 'text-primary-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('nav.stats')}
            </Link>

            {isAdmin() && (
              <Link
                to="/admin"
                className={`transition font-medium ${
                  location.pathname === '/admin'
                    ? 'text-primary-600 font-semibold'
                    : 'text-primary-600 hover:text-primary-700'
                }`}
              >
                {t('nav.admin')}
              </Link>
            )}

            {/* Série en cours */}
            <StreakBadge />

            {/* Sélecteur de langue */}
            <LanguageSwitcher />

            {/* User menu Desktop */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition">
                <span className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(user?.first_name || user?.email || '?').charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{user?.first_name || user?.email}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {t('userMenu.profile')}
                </Link>
                <Link
                  to="/subscription"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {t('userMenu.subscription')}
                </Link>
                <Link
                  to="/contact"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {t('nav.contact')}
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  {t('userMenu.logout')}
                </button>
              </div>
            </div>
          </div>
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
              YarnFlow
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
            <div className="text-sm text-gray-600">{t('userMenu.loggedInAs')}</div>
            <div className="font-semibold text-primary-900 truncate">
              {user?.first_name || user?.email}
            </div>
          </div>

          {/* Mobile Menu Links */}
          <div className="p-4 space-y-1">
            <Link
              to="/my-projects"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                location.pathname === '/my-projects' || location.pathname.startsWith('/projects/')
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.myProjects')}
            </Link>

            <Link
              to="/bibliotheque"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                ['/bibliotheque', '/pattern-library', '/stash'].some(p => location.pathname === p) || location.pathname.startsWith('/pattern-library/')
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.resources')}
            </Link>

            <Link
              to="/gallery"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                location.pathname === '/gallery'
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.galleryLong')}
            </Link>

            <Link
              to="/tools"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                location.pathname === '/tools'
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.tools')}
            </Link>

            <Link
              to="/stats"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                location.pathname === '/stats'
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nav.statsLong')}
            </Link>

            {isAdmin() && (
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                  location.pathname === '/admin'
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('nav.admin')}
              </Link>
            )}

            <hr className="my-3 border-gray-100" />

            <Link
              to="/profile"
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('userMenu.profile')}
            </Link>

            <Link
              to="/subscription"
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('userMenu.subscription')}
            </Link>

            <Link
              to="/contact"
              onClick={closeMobileMenu}
              className="block px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('nav.contact')}
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
            >
              {t('userMenu.logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
