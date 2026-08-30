import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthProvider } from './contexts/AuthContext'
import { HintsProvider } from './contexts/HintsContext'
import { AiAssistantProvider } from './contexts/AiAssistantContext'
import PrivateRoute from './components/PrivateRoute'
import PWAPrompt from './components/PWAPrompt'
import ContextualHint from './components/ContextualHint'
import ErrorBoundary from './components/ErrorBoundary'
import CookieConsent from 'react-cookie-consent'

/**
 * [AI:Claude] 2026-08-05 — Decoupage du bundle.
 *
 * Toutes les pages etaient importees d'emblee : afficher la page d'accueil
 * faisait telecharger 2 233 Ko de JavaScript, soit l'application entiere —
 * compteur, studio photo, graphiques, editeur de grilles, administration.
 *
 * Ce n'est pas theorique : une campagne Facebook a produit 185 clics pour
 * 114 vues de page. 38 % des visiteurs, deja payes, partaient avant
 * l'affichage. Dans le navigateur integre de Facebook, sur mobile, plusieurs
 * secondes d'ecran blanc suffisent.
 *
 * Restent charges d'emblee : la page d'accueil, la connexion et l'inscription.
 * C'est le tunnel d'acquisition — y ajouter un aller-retour reseau au moment
 * ou la personne clique sur « S'inscrire » couterait plus qu'il ne rapporte.
 *
 * Tout le reste est differe, y compris Layout : il tire la navbar, la
 * navigation du bas et le tiroir d'assistant IA, dont un visiteur non connecte
 * n'a aucun usage.
 */
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'

const Layout = lazy(() => import('./components/Layout'))

// Pages
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const Subscription = lazy(() => import('./pages/Subscription'))
const Profile = lazy(() => import('./pages/Profile'))
const MyProjects = lazy(() => import('./pages/MyProjects'))
const ProjectCounter = lazy(() => import('./pages/ProjectCounter'))
const ProjectCharts = lazy(() => import('./pages/ProjectCharts'))
const ChartEditor = lazy(() => import('./pages/ChartEditor'))
const SmartProjectCreator = lazy(() => import('./pages/SmartProjectCreator'))
const Stats = lazy(() => import('./pages/Stats'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Tools = lazy(() => import('./pages/Tools'))
const Bibliotheque = lazy(() => import('./pages/Bibliotheque'))
const PatternLibrary = lazy(() => import('./pages/PatternLibrary'))
const PatternLibraryDetail = lazy(() => import('./pages/PatternLibraryDetail'))
const YarnStash = lazy(() => import('./pages/YarnStash'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const ImportPartnerPattern = lazy(() => import('./pages/ImportPartnerPattern'))
const PatternTranslator = lazy(() => import('./pages/PatternTranslator'))

// Pages légales
const CGU = lazy(() => import('./pages/CGU'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Mentions = lazy(() => import('./pages/Mentions'))
const Contact = lazy(() => import('./pages/Contact'))

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminTemplates = lazy(() => import('./pages/admin/AdminTemplates'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminPhotoFeedback = lazy(() => import('./pages/admin/AdminPhotoFeedback'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminOptions = lazy(() => import('./pages/admin/AdminOptions'))
const AdminPartnerPatterns = lazy(() => import('./pages/admin/AdminPartnerPatterns'))

/**
 * [AI:Claude] Ecran d'attente pendant le telechargement d'une page differee.
 * Volontairement muet : pas de texte, donc rien a traduire, et rien qui
 * ressemble a un message d'erreur si le reseau est lent. Le fond reprend celui
 * de l'app pour eviter un flash blanc entre deux pages.
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-primary-600 animate-spin" />
  </div>
)

// [AI:Claude] Titre par route — sans ça, la quasi-totalité des pages héritent
// du <title> statique d'index.html et GA4 ne voit plus qu'une seule "page"
// pour toute l'appli (constaté : 4k vues sous ce même titre générique).
// Correspondance exacte d'abord, puis préfixe pour les routes dynamiques
// (/projects/:id, /pattern-library/:id...).
//
// Ces tables ne stockent que des CLÉS de traduction, jamais le libellé final :
// résolu au rendu via t(), sinon le titre resterait figé dans la langue
// active au premier chargement du module.
const PAGE_TITLE_KEYS = {
  '/': 'landing',
  '/login': 'login',
  '/register': 'register',
  '/forgot-password': 'forgotPassword',
  '/reset-password': 'resetPassword',
  '/payment/success': 'paymentSuccess',
  '/cgu': 'cgu',
  '/privacy': 'privacy',
  '/mentions': 'legalNotice',
  '/contact': 'contact',
  '/subscription': 'subscription',
  '/profile': 'profile',
  '/my-projects': 'myProjects',
  '/smart-project-creator': 'smartProjectCreator',
  '/stats': 'stats',
  '/tools': 'tools',
  '/pattern-translator': 'patternTranslator',
  '/gallery': 'gallery',
  '/bibliotheque': 'resources',
  '/pattern-library': 'patternLibrary',
  '/stash': 'stash',
  '/admin': 'admin',
}
const PAGE_TITLE_KEY_PREFIXES = [
  [/^\/projects\/[^/]+\/charts\/[^/]+/, 'chartEditor'],
  [/^\/projects\/[^/]+\/charts/, 'projectCharts'],
  [/^\/projects\/[^/]+/, 'projectCounter'],
  [/^\/pattern-library\/[^/]+/, 'patternDetail'],
  [/^\/admin\//, 'admin'],
]

const getPageTitleKey = (pathname) => {
  if (PAGE_TITLE_KEYS[pathname]) return PAGE_TITLE_KEYS[pathname]
  const match = PAGE_TITLE_KEY_PREFIXES.find(([re]) => re.test(pathname))
  return match ? match[1] : null
}

// [AI:Claude] Composant pour tracker automatiquement les changements de route
function AnalyticsTracker() {
  const location = useLocation()
  const { t, i18n } = useTranslation('pageTitles')

  useEffect(() => {
    // [AI:Claude] Tracker chaque changement de page dans GA4
    if (typeof window !== 'undefined' && window.gtag) {
      const key = getPageTitleKey(location.pathname)
      // Route inconnue : on garde le titre courant plutôt que d'afficher une clé brute
      const pageTitle = key ? `${t(key)} — YarnFlow` : document.title
      document.title = pageTitle
      const pagePath = location.pathname + location.search

      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath
      })

      console.log('[Analytics] Page view tracked:', pagePath, pageTitle)
    }
    // i18n.language dans les deps : au changement de langue, le titre de la
    // page courante doit se retraduire sans attendre une navigation
  }, [location, i18n.language, t])

  return null
}

function App() {
  const { t } = useTranslation('common')
  // [AI:Claude] Routes de l'application
  return (
    <BrowserRouter>
      <AuthProvider>
        <HintsProvider>
        <AiAssistantProvider>
        <AnalyticsTracker />
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Routes OAuth callbacks */}
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          <Route path="/auth/facebook/callback" element={<OAuthCallback />} />

          {/* Route de confirmation de paiement */}
          <Route path="/payment/success" element={<PaymentSuccess />} />

          {/* Import partenaire via QR code */}
          <Route path="/import/:code" element={<ImportPartnerPattern />} />

          {/* Pages légales */}
          <Route path="/cgu" element={<CGU />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/mentions" element={<Mentions />} />
          <Route path="/contact" element={<Contact />} />

          {/* Routes protégées */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Navigate to="/my-projects" replace />} />
            <Route path="/projects" element={<Navigate to="/my-projects" replace />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/profile" element={<Profile />} />

            {/* Routes projets (YarnFlow - Dashboard unifié) */}
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/projects/:projectId" element={<ProjectCounter />} />
            <Route path="/projects/:projectId/counter" element={<ProjectCounter />} />
            <Route path="/projects/:projectId/charts" element={<ProjectCharts />} />
            <Route path="/projects/:projectId/charts/:chartId" element={<ChartEditor />} />
            <Route path="/smart-project-creator" element={<SmartProjectCreator />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/pattern-translator" element={<PatternTranslator />} />

            {/* Routes galerie photos IA (v0.10.0) */}
            <Route path="/gallery" element={<Gallery />} />

            {/* Hub bibliothèque */}
            <Route path="/bibliotheque" element={<Bibliotheque />} />
            <Route path="/pattern-library" element={<PatternLibrary />} />
            <Route path="/pattern-library/:id" element={<PatternLibraryDetail />} />
            <Route path="/stash" element={<YarnStash />} />

            {/* Routes admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/photo-feedback" element={<AdminPhotoFeedback />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/options" element={<AdminOptions />} />
            <Route path="/admin/partner-patterns" element={<AdminPartnerPatterns />} />
          </Route>
        </Routes>
        </Suspense>
        </ErrorBoundary>
        <PWAPrompt />
        <ContextualHint />

        <CookieConsent
          location="bottom"
          buttonText={t('cookie.accept')}
          declineButtonText={t('cookie.decline')}
          enableDeclineButton
          cookieName="yarnflow_cookie_consent"
          expires={365}
          onAccept={() => {
            if (window.gtag) {
              window.gtag('consent', 'update', { 'analytics_storage': 'granted' })
            }
            if (window.loadFacebookPixel) {
              window.loadFacebookPixel()
            }
          }}
          onDecline={() => {
            if (window.gtag) {
              window.gtag('consent', 'update', { 'analytics_storage': 'denied' })
            }
          }}
          style={{
            background: '#fff',
            color: '#374151',
            borderTop: '1px solid #e5e7eb',
            padding: '14px 20px',
            alignItems: 'center',
            fontSize: '13px',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.06)'
          }}
          buttonStyle={{
            background: '#557055',
            color: '#fff',
            fontSize: '13px',
            borderRadius: '8px',
            padding: '8px 18px',
            fontWeight: '600',
            margin: '0 0 0 8px'
          }}
          declineButtonStyle={{
            background: 'transparent',
            color: '#9ca3af',
            fontSize: '13px',
            borderRadius: '8px',
            padding: '8px 14px',
            fontWeight: '500',
            border: '1px solid #e5e7eb',
            margin: '0'
          }}
        >
          {t('cookie.message')}{' '}
          <a href="/privacy" style={{ color: '#557055', textDecoration: 'underline' }}>
            {t('cookie.privacyPolicy')}
          </a>
        </CookieConsent>
        </AiAssistantProvider>
        </HintsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
