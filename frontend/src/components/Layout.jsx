import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import Onboarding from './Onboarding'

const Layout = () => {
  const [showOnboarding, setShowOnboarding] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onOpenOnboarding={() => setShowOnboarding(true)} />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />

      {/* Onboarding réutilisable depuis le bouton d'aide */}
      <Onboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        forceShow={true}
      />
    </div>
  )
}

export default Layout
