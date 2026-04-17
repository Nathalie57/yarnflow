import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { HintsProvider } from './contexts/HintsContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import PWAPrompt from './components/PWAPrompt'
import ContextualHint from './components/ContextualHint'
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
import Stats from './pages/Stats'
import Gallery from './pages/Gallery'
import Tools from './pages/Tools'
import PatternLibrary from './pages/PatternLibrary'
import PatternLibraryDetail from './pages/PatternLibraryDetail'
import PaymentSuccess from './pages/PaymentSuccess'

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
            <Route path="/stats" element={<Stats />} />
            <Route path="/tools" element={<Tools />} />

            {/* Routes galerie photos IA (v0.10.0) */}
            <Route path="/gallery" element={<Gallery />} />

            {/* Routes bibliothèque de patrons */}
            <Route path="/pattern-library" element={<PatternLibrary />} />
            <Route path="/pattern-library/:id" element={<PatternLibraryDetail />} />

            {/* Routes admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/options" element={<AdminOptions />} />
          </Route>
        </Routes>
        <PWAPrompt />
        <ContextualHint />

        {/* [AI:Claude] Bannière informative (mode cookieless = pas besoin de consentement) */}
        <CookieConsent
          location="bottom"
          buttonText="Compris"
          cookieName="yarnflow_privacy_notice"
          style={{
            background: '#1f2937',
            padding: '16px 20px',
            alignItems: 'center'
          }}
          buttonStyle={{
            background: '#8b5cf6',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '8px 20px',
            fontWeight: '600'
          }}
          expires={365}
        >
          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
            <strong>🔒 Respect de votre vie privée</strong>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9 }}>
              Nous utilisons un tracking 100% anonymisé (sans cookies personnels) pour améliorer l'application.
              <a href="/privacy" style={{ color: '#a78bfa', marginLeft: '4px', textDecoration: 'underline' }}>
                Politique de confidentialité
              </a>
            </p>
          </div>
        </CookieConsent>
        </HintsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
