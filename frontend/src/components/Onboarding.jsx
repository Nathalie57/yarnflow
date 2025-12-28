/**
 * @file Onboarding.jsx
 * @brief Composant d'onboarding pour les nouveaux utilisateurs
 * @author YarnFlow Team
 * @created 2025-12-28
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * [AI:Claude] Composant Onboarding - Modal de bienvenue avec checklist
 *
 * Affiche un modal de bienvenue aux nouveaux utilisateurs avec une checklist
 * de 4 étapes pour découvrir les fonctionnalités principales.
 *
 * Tracking via localStorage :
 * - yarnflow_onboarding_seen : true/false
 * - yarnflow_onboarding_steps : { step1: true, step2: false, ... }
 */
const Onboarding = ({ isOpen, onClose, forceShow = false, onCreateProject = null }) => {
  const navigate = useNavigate()

  const [steps, setSteps] = useState({
    createProject: false,
    useCounter: false,
    tryAIStudio: false
  })

  // [AI:Claude] Charger la progression depuis localStorage
  useEffect(() => {
    const savedSteps = localStorage.getItem('yarnflow_onboarding_steps')
    if (savedSteps) {
      try {
        setSteps(JSON.parse(savedSteps))
      } catch (e) {
        console.error('[Onboarding] Erreur chargement progression:', e)
      }
    }
  }, [])

  // [AI:Claude] Sauvegarder la progression à chaque changement
  const toggleStep = (stepKey) => {
    const newSteps = { ...steps, [stepKey]: !steps[stepKey] }
    setSteps(newSteps)
    localStorage.setItem('yarnflow_onboarding_steps', JSON.stringify(newSteps))
  }

  // [AI:Claude] Marquer l'onboarding comme vu
  const handleStart = () => {
    localStorage.setItem('yarnflow_onboarding_seen', 'true')
    onClose()
    // Rediriger vers la création de projet
    navigate('/my-projects')
  }

  // [AI:Claude] Reporter à plus tard
  const handleSkip = () => {
    if (!forceShow) {
      localStorage.setItem('yarnflow_onboarding_seen', 'true')
    }
    onClose()
  }

  // [AI:Claude] Calculer la progression
  const completedSteps = Object.values(steps).filter(Boolean).length
  const totalSteps = Object.keys(steps).length
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">🧶 Bienvenue sur YarnFlow !</h2>
            {forceShow && (
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl"
                aria-label="Fermer"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-primary-100 text-lg">
            Découvrez les fonctionnalités principales en quelques étapes simples
          </p>
        </div>

        {/* Progress bar */}
        {completedSteps > 0 && (
          <div className="px-8 pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Votre progression
              </span>
              <span className="text-sm font-bold text-primary-600">
                {completedSteps}/{totalSteps} étapes
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-primary-600 to-primary-700 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="p-8 space-y-4">
          <p className="text-gray-600 mb-6">
            Cochez les étapes au fur et à mesure que vous les découvrez :
          </p>

          {/* Step 1 - Créer un projet */}
          <div
            className={`border-2 rounded-xl p-5 transition-all ${
              steps.createProject
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 mt-1 cursor-pointer"
                onClick={() => toggleStep('createProject')}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    steps.createProject
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {steps.createProject && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  1️⃣ Créer votre premier projet
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Cliquez sur le bouton <strong>"+ Nouveau Projet"</strong> en haut à droite du dashboard.
                  Choisissez entre tricot ou crochet, donnez un nom à votre création, et ajoutez
                  éventuellement une description et les détails techniques (laines, aiguilles...).
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleStep('createProject')
                    onClose()

                    // Si la fonction est fournie (depuis MyProjects), l'utiliser
                    if (onCreateProject) {
                      setTimeout(() => {
                        onCreateProject()
                      }, 100)
                    } else {
                      // Sinon, naviguer vers MyProjects avec un paramètre pour ouvrir le modal
                      navigate('/my-projects?openCreateModal=true')
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  ➕ Créer mon premier projet maintenant
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 - Utiliser le compteur */}
          <div
            className={`border-2 rounded-xl p-5 transition-all ${
              steps.useCounter
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 mt-1 cursor-pointer"
                onClick={() => toggleStep('useCounter')}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    steps.useCounter
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {steps.useCounter && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  2️⃣ Organiser avec des sections et utiliser le compteur
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Une fois dans un projet, cliquez sur <strong>"+ Nouvelle section"</strong> pour organiser
                  votre patron en parties (ex: Corps, Manches, Bordure). Chaque section a son propre compteur de rangs.
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Le <strong>compteur flottant</strong> se trouve en haut de la page du projet. Utilisez les boutons
                  +1 / -1 pour compter vos rangs. Le <strong>timer démarre automatiquement</strong> quand vous tricotez ! ⏱️
                </p>
                <div className="text-xs text-gray-500 bg-primary-50 p-2 rounded border border-primary-200">
                  💡 <strong>Astuce :</strong> Le compteur reste accessible même en scrollant, pour toujours avoir vos rangs sous les yeux
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 - AI Photo Studio */}
          <div
            className={`border-2 rounded-xl p-5 transition-all ${
              steps.tryAIStudio
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 mt-1 cursor-pointer"
                onClick={() => toggleStep('tryAIStudio')}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    steps.tryAIStudio
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {steps.tryAIStudio && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  3️⃣ Découvrir l'AI Photo Studio ✨
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Transformez vos photos de créations en <strong>visuels professionnels</strong> grâce à l'intelligence
                  artificielle ! Uploadez une photo de votre tricot/crochet, choisissez un style (Lifestyle, Studio,
                  Café...), et obtenez jusqu'à 5 variations magnifiques. Parfait pour <strong>Etsy, Instagram ou votre portfolio</strong> !
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleStep('tryAIStudio')
                    onClose()
                    navigate('/gallery')
                  }}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  📸 Essayer l'AI Photo Studio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 flex gap-3">
          {!forceShow && (
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Plus tard
            </button>
          )}
          <button
            onClick={handleStart}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 font-semibold shadow-lg transition-all"
          >
            {forceShow ? 'Fermer' : 'Commencer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
