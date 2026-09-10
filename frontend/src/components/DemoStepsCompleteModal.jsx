/**
 * @file DemoStepsCompleteModal.jsx
 * @brief Modale affichée une fois les 3 étapes d'exploration du projet démo terminées
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const DemoStepsCompleteModal = ({ onClose, onCreateProject }) => {
  const { t } = useTranslation('counter')
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black transition-opacity duration-300 ${show ? 'bg-opacity-50' : 'bg-opacity-0'}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('ui.demoStepsCompleteTitle')}</h2>
        <p className="text-gray-600 leading-relaxed mb-6">{t('ui.demoStepsCompleteDesc')}</p>

        <button
          onClick={onCreateProject}
          className="w-full px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition"
        >
          {t('ui.createRealProject')}
        </button>

        <button
          onClick={handleClose}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {t('ui.continueExploring')}
        </button>
      </div>
    </div>
  )
}

export default DemoStepsCompleteModal
