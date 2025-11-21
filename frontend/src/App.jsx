import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

// Pages
import Landing from './pages/Landing'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
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

// Pages légales
import CGU from './pages/CGU'
import Privacy from './pages/Privacy'
import Mentions from './pages/Mentions'

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

          {/* Pages légales */}
          <Route path="/cgu" element={<CGU />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/mentions" element={<Mentions />} />

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

            {/* Routes admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/options" element={<AdminOptions />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
