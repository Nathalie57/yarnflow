/**
 * @file PushNotificationModal.jsx
 * @brief Modal de demande de permission push, affiché après le premier projet créé
 */

import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useTranslation } from 'react-i18next'
import FlowMascot from './FlowMascot'

const STORAGE_KEY = 'yf_push_modal_shown'

const PushNotificationModal = ({ onClose }) => {
  const { t } = useTranslation('tools')
  const { subscribe } = usePushNotifications()
  const [loading, setLoading] = useState(false)

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    // Évite que le banner réapparaisse dans les 21 jours
    localStorage.setItem('push_prompt_dismissed_at', Date.now().toString())
    onClose()
  }

  const handleActivate = async () => {
    setLoading(true)
    await subscribe()
    setLoading(false)
    dismiss()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-card w-full max-w-sm shadow-xl overflow-hidden">

        {/* Icône */}
        <div className="bg-flow-mint px-6 pt-8 pb-4 flex justify-center">
          <FlowMascot pose="content" size={80} />
        </div>

        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-lg font-semibold text-flow-ink mb-2">
            {t('ui.neverLoseTrack')}
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {t('ui.enableNotificationsDesc')}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-control font-semibold hover:bg-primary-700 transition disabled:opacity-60 text-sm"
            >
              {loading ? t('ui.turningOn') : t('ui.enableNotifs')}
            </button>
            <button
              onClick={dismiss}
              className="w-full py-2.5 text-gray-400 hover:text-gray-600 transition text-sm"
            >
              {t('ui.later')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export { STORAGE_KEY as PUSH_MODAL_STORAGE_KEY }
export default PushNotificationModal
