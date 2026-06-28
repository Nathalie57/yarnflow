import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { HintsProvider } from './contexts/HintsContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import PWAPrompt from './components/PWAPrompt'
import ContextualHint from './components/ContextualHint'
import ErrorBoundary from './components/ErrorBoundary'
import CookieConsent from 'react-cookie-consent'

// Pages
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OAuthCallback from './pages/OAuthCallback'
import Subscription from './pages/Subscription'
import Profile from './pages/Profile'
import MyProjects from './pages/MyProjects'
import ProjectCounter from './pages/ProjectCounter'
import SmartProjectCreator from './pages/SmartProjectCreator'
import Stats from './pages/Stats'
import Gallery from './pages/Gallery'
import Tools from './pages/Tools'
import Bibliotheque from './pages/Bibliotheque'
import PatternLibrary from './pages/PatternLibrary'
import PatternLibraryDetail from './pages/PatternLibraryDetail'
import YarnStash from './pages/YarnStash'
import PaymentSuccess from './pages/PaymentSuccess'
import ImportPartnerPattern from './pages/ImportPartnerPattern'
import PatternTranslator from './pages/PatternTranslator'

// Pages légales
import CGU from './pages/CGU'
import Privacy from './pages/Privacy'
import Mentions from './pages/Mentions'
import Contact from './pages/Contact'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTemplates from './pages/admin/AdminTemplates'
import AdminPayments from './pages/admin/AdminPayments'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOptions from './pages/admin/AdminOptions'
import AdminPartnerPatterns from './pages/admin/AdminPartnerPatterns'

// [AI:Claude] Composant pour tracker automatiquement les changements de route
function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    // [AI:Claude] Tracker chaque changement de page dans GA4
    if (typeof window !== 'undefined' && window.gtag) {
      const pageTitle = document.title
      const pagePath = location.pathname + location.search

      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath
      })

      console.log('[Analytics] Page view tracked:', pagePath, pageTitle)
    }
  }, [location])

  return null
}

function App() {
  // [AI:Claude] Routes de l'application
  return (
    <BrowserRouter>
      <AuthProvider>
        <HintsProvider>
        <AnalyticsTracker />
        <ErrorBoundary>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
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
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/options" element={<AdminOptions />} />
            <Route path="/admin/partner-patterns" element={<AdminPartnerPatterns />} />
          </Route>
        </Routes>
        </ErrorBoundary>
        <PWAPrompt />
        <ContextualHint />

        <CookieConsent
          location="bottom"
          buttonText="Accepter"
          declineButtonText="Refuser"
          enableDeclineButton
          cookieName="yarnflow_cookie_consent"
          expires={365}
          onAccept={() => {
            if (window.gtag) {
              window.gtag('consent', 'update', { 'analytics_storage': 'granted' })
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
          Nous utilisons des cookies d'analyse pour améliorer l'application.{' '}
          <a href="/privacy" style={{ color: '#557055', textDecoration: 'underline' }}>
            Politique de confidentialité
          </a>
        </CookieConsent>
        </HintsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
