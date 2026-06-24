/**
 * @file PushNotificationModal.jsx
 * @brief Modal de demande de permission push, affiché après le premier projet créé
 */

import { useState } from 'react'
import { usePushNotifications } from '../hooks/usePushNotifications'

const STORAGE_KEY = 'yf_push_modal_shown'

const PushNotificationModal = ({ onClose }) => {
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
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">

        {/* Icône */}
        <div className="bg-primary-50 px-6 pt-8 pb-4 flex justify-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Ne perds jamais le fil
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Active les notifications pour retrouver tes projets en cours et recevoir des rappels utiles. On ne t'envoie que l'essentiel.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-60 text-sm"
            >
              {loading ? 'Activation...' : 'Activer les notifications'}
            </button>
            <button
              onClick={dismiss}
              className="w-full py-2.5 text-gray-400 hover:text-gray-600 transition text-sm"
            >
              Plus tard
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export { STORAGE_KEY as PUSH_MODAL_STORAGE_KEY }
export default PushNotificationModal
