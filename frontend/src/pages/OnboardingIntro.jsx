/**
 * @file OnboardingIntro.jsx
 * @brief Court tour illustré (4 écrans) montré une fois juste après l'inscription,
 * avant d'atterrir sur "Mes projets". But : donner le contexte de ce que YarnFlow
 * permet de faire avant de proposer d'importer un patron, plutôt que de découvrir
 * Smart Creation à froid. Toujours "Passer" possible dès le premier écran — jamais
 * bloquant, cohérent avec le reste de l'app.
 */

import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'

const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
  </svg>
)

const IconNeedles = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <line x1="5" y1="20" x2="17" y2="4" />
    <line x1="11" y1="20" x2="23" y2="4" />
    <circle cx="5" cy="20" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="11" cy="20" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

const IconMessage = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export default function OnboardingIntro() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(0)

  const slides = [
    { Icon: IconSparkle, warm: false, titleKey: 'onboardingIntro.smartTitle', descKey: 'onboardingIntro.smartDesc' },
    { Icon: IconNeedles, warm: true, titleKey: 'onboardingIntro.counterTitle', descKey: 'onboardingIntro.counterDesc' },
    { Icon: IconMessage, warm: false, titleKey: 'onboardingIntro.assistantTitle', descKey: 'onboardingIntro.assistantDesc' },
    { Icon: IconCamera, warm: true, titleKey: 'onboardingIntro.photoTitle', descKey: 'onboardingIntro.photoDesc' },
  ]

  const finish = () => {
    const params = searchParams.toString()
    navigate(`/my-projects${params ? `?${params}` : '?welcome=1'}`, { replace: true })
  }

  const isLast = step === slides.length - 1
  const { Icon, warm, titleKey, descKey } = slides[step]

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${warm ? 'bg-warm-700' : 'bg-primary-700'}`}>
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col px-6 py-8">
        <div className="flex items-center gap-3 mb-10">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-white/60 disabled:opacity-0 hover:text-white transition"
            aria-label={t('onboardingIntro.back')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 flex gap-1.5">
            {slides.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-white' : 'bg-white/25'}`} />
            ))}
          </div>
          <button onClick={finish} className="text-sm text-white/60 hover:text-white transition shrink-0">
            {t('onboardingIntro.skip')}
          </button>
        </div>

        {/* [AI:Claude] key={step} force le remontage à chaque écran, ce qui relance
            l'animation CSS déjà définie ailleurs dans l'app (index.css) — sans ça,
            le changement d'écran était instantané, sans aucune transition. */}
        <div key={step} className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
          <span className="relative w-20 h-20 flex items-center justify-center mb-8">
            <span className="absolute inset-0 rounded-full blur-2xl bg-white/30" />
            <span className={`relative w-20 h-20 rounded-2xl flex items-center justify-center p-5 bg-white shadow-sm ${warm ? 'text-warm-600' : 'text-primary-600'}`}>
              <Icon />
            </span>
          </span>
          <h1 className="text-2xl font-bold text-white mb-3">{t(titleKey)}</h1>
          <p className="text-white/80 leading-relaxed max-w-xs">
            <Trans
              i18nKey={descKey}
              ns="auth"
              components={[<strong key="0" className="text-white font-semibold" />]}
            />
          </p>
        </div>

        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className={`w-full px-6 py-3.5 bg-white hover:bg-white/90 rounded-xl font-semibold transition ${warm ? 'text-warm-700' : 'text-primary-700'}`}
        >
          {isLast ? t('onboardingIntro.start') : t('onboardingIntro.next')}
        </button>
      </div>
    </div>
  )
}
