import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import AiAssistantDrawer from './AiAssistantDrawer'
import PushNotificationBanner from './PushNotificationBanner'
import PendingCheckoutBanner from './PendingCheckoutBanner'
import { useAiAssistant } from '../contexts/AiAssistantContext'

const Layout = () => {
  const { open, openGeneral, close } = useAiAssistant()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <PendingCheckoutBanner />
      <PushNotificationBanner />
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
      <BottomNav onOpenAi={openGeneral} />
      <AiAssistantDrawer open={open} onClose={close} />
    </div>
  )
}

export default Layout
