import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import AiAssistantDrawer from './AiAssistantDrawer'
import OnboardingModal from './OnboardingModal'

const Layout = () => {
  const [aiOpen, setAiOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('yf_onboarding_done')) {
      setShowOnboarding(true)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
      <BottomNav onOpenAi={() => setAiOpen(true)} />
      <AiAssistantDrawer open={aiOpen} onClose={() => setAiOpen(false)} />
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
    </div>
  )
}

export default Layout
