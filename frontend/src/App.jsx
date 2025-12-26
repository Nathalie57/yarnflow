import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import PWAPrompt from './components/PWAPrompt'
import CookieConsent from 'react-cookie-consent'

// Pages
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OAuthCallback from './pages/OAuthCallback'
import Dashboard from './pages/Dashboard'
import Generator from './pages/Generator'
import MyPatterns from './pages/MyPatterns'
import PatternDetail from './pages/PatternDetail'
import Subscription from './pages/Subscription'
import Profile from './pages/Profile'
import MyProjects from './pages/MyProjects'
import ProjectCounter from './pages/ProjectCounter'
import Stats from './pages/Stats'
import Gallery from './pages/Gallery'
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

function App() {
  // [AI:Claude] Routes de l'application
  return (
    <BrowserRouter>
      <AuthProvider>
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
            {/* [AI:Claude] Redirection dashboard vers my-projects (nouveau tableau de bord unifié) */}
            <Route path="/dashboard" element={<Navigate to="/my-projects" replace />} />
            <Route path="/projects" element={<Navigate to="/my-projects" replace />} />

            <Route path="/generator" element={<Generator />} />
            <Route path="/my-patterns" element={<MyPatterns />} />
            <Route path="/patterns/:id" element={<PatternDetail />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/profile" element={<Profile />} />

            {/* Routes projets (YarnFlow - Dashboard unifié) */}
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/projects/:projectId" element={<ProjectCounter />} />
            <Route path="/projects/:projectId/counter" element={<ProjectCounter />} />
            <Route path="/stats" element={<Stats />} />

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

        {/* [AI:Claude] Cookie Banner RGPD pour Google Analytics */}
        <CookieConsent
          location="bottom"
          buttonText="J'accepte"
          declineButtonText="Refuser"
          enableDeclineButton
          cookieName="yarnflow_analytics_consent"
          style={{
            background: '#1f2937',
            padding: '20px',
            alignItems: 'center'
          }}
          buttonStyle={{
            background: '#8b5cf6',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '10px 24px',
            fontWeight: '600'
          }}
          declineButtonStyle={{
            background: 'transparent',
            color: '#9ca3af',
            fontSize: '14px',
            borderRadius: '8px',
            padding: '10px 24px',
            border: '1px solid #4b5563'
          }}
          expires={365}
          onAccept={() => {
            // [AI:Claude] Activer Google Analytics après consentement
            if (window.gtag) {
              window.gtag('consent', 'update', {
                analytics_storage: 'granted'
              })
              console.log('[Analytics] Cookies acceptés - Tracking activé')
            }
          }}
          onDecline={() => {
            // [AI:Claude] Désactiver Google Analytics si refusé
            if (window.gtag) {
              window.gtag('consent', 'update', {
                analytics_storage: 'denied'
              })
              console.log('[Analytics] Cookies refusés - Tracking désactivé')
            }
          }}
        >
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <strong>🍪 Cookies et confidentialité</strong>
            <p style={{ margin: '8px 0 0 0' }}>
              Nous utilisons des cookies pour analyser le trafic de notre site et améliorer votre expérience.
              Vos données sont anonymisées.
              <a href="/privacy" style={{ color: '#8b5cf6', marginLeft: '4px', textDecoration: 'underline' }}>
                En savoir plus
              </a>
            </p>
          </div>
        </CookieConsent>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
