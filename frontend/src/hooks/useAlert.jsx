/**
 * @file useAlert.jsx
 * @brief Modales d'alerte et de confirmation partagées
 * @author Nathalie + AI Assistants
 * @created 2026-08-03
 *
 * [AI:Claude] MyProjects et ProjectCounter avaient chacun leur propre paire
 * showAlert/showConfirm + le JSX des modales dupliqué — avec des signatures
 * carrément incompatibles : (title, message, type) d'un côté,
 * (message, type, title) de l'autre. Unifié ici pendant la migration i18n,
 * puisque chaque site d'appel devait de toute façon être retouché.
 *
 * Signature unique en objet nommé : plus d'ordre d'arguments à retenir.
 *   const { showAlert, showConfirm, AlertModals } = useAlert()
 *   showAlert({ message: t('...'), type: 'success' })
 *   showConfirm({ message: t('...'), onConfirm: () => ... })
 * puis rendre <AlertModals /> une fois dans le composant.
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export const useAlert = () => {
  const { t } = useTranslation()
  const [alertData, setAlertData] = useState(null)
  const [confirmData, setConfirmData] = useState(null)

  const showAlert = useCallback(({ title, message, type = 'info' }) => {
    setAlertData({ title, message, type })
  }, [])

  const showConfirm = useCallback(({ title, message, onConfirm, confirmLabel }) => {
    setConfirmData({ title, message, onConfirm, confirmLabel })
  }, [])

  const defaultAlertTitle = (type) => {
    if (type === 'success') return t('alert.doneTitle')
    if (type === 'error') return t('alert.errorTitle')
    return t('alert.infoTitle')
  }

  const AlertModals = () => (
    <>
      {alertData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 sticky top-0 bg-white pb-3 border-b">
              {alertData.title || defaultAlertTitle(alertData.type)}
            </h3>
            <div className="text-gray-600 mb-6">
              {alertData.message}
            </div>
            <div className="flex justify-end sticky bottom-0 bg-white pt-3 border-t">
              <button
                onClick={() => setAlertData(null)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
              >
                {t('alert.ok')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {confirmData.title || t('alert.confirmTitle')}
            </h3>
            <p className="text-gray-600 mb-6">
              {confirmData.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmData(null)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                {t('alert.cancel')}
              </button>
              <button
                onClick={() => {
                  const cb = confirmData.onConfirm
                  setConfirmData(null)
                  if (cb) cb()
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition focus:outline-none focus:ring-4 focus:ring-primary-300"
              >
                {confirmData.confirmLabel || t('alert.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  // [AI:Claude] isAnyAlertOpen : certains écrans masquent leurs boutons flottants
  // quand une modale est ouverte (ex. le bouton Notes de ProjectCounter).
  return { showAlert, showConfirm, AlertModals, isAnyAlertOpen: alertData !== null || confirmData !== null }
}

export default useAlert
