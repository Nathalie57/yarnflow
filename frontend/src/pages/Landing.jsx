/**
 * @file Landing.jsx
 * @brief Landing page YarnFlow
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAnalytics, useScrollTracking } from '../hooks/useAnalytics'
import { useTranslation, Trans } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useAuth } from '../contexts/AuthContext'

// [AI:Claude] Le même SVG de coche était copié à chaque <li> des listes de
// features/tarifs — factorisé ici pendant la migration i18n (les listes passent
// de <li> en dur à une boucle sur les tableaux de traduction).
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const Landing = () => {
  const { t, i18n } = useTranslation('landing')
  // [AI:Claude] 2026-08-24 — Les captures d'origine montrent l'interface en
  // francais (texte visible dedans, pas traduisible via i18n). En anglais, on
  // bascule vers les versions -en prises specifiquement pour la landing.
  const isEnglish = i18n.resolvedLanguage === 'en'
  const [openFAQ, setOpenFAQ] = useState(null)
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const { trackPageView, trackSubscriptionClick } = useAnalytics()
  useScrollTracking()

  useEffect(() => {
    trackPageView('Landing Page - v4', '/')
  }, [])

  // [AI:Claude] Session déjà valide → pas besoin de repasser par la landing,
  // direct sur l'app (qui reprend elle-même le dernier projet en cours)
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/my-projects', { replace: true })
    }
  }, [authLoading, user, navigate])

  const toggleFAQ = (index) => setOpenFAQ(openFAQ === index ? null : index)

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg md:text-xl text-gray-900">YarnFlow</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary-600 transition">{t('header.features')}</a>
            <a href="#pricing" className="hover:text-primary-600 transition">{t('header.pricing')}</a>
            <Link to="/contact" className="hover:text-primary-600 transition">{t('header.contact')}</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium transition text-sm">
              {t('header.login')}
            </Link>
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2 rounded-xl font-medium transition text-xs sm:text-sm shadow-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t('header.ctaLong')}</span>
              <span className="sm:hidden">{t('header.ctaShort')}</span>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-16">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">

          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 text-sm font-bold text-primary-700 mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" />
              </svg>
              {t('hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto md:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="flex justify-center md:justify-start mb-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-base px-8 py-3.5 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
              >
                {t('hero.cta')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <p className="text-sm text-gray-500 mb-4">{t('hero.reassurance')}</p>

            <div className="flex items-center justify-center md:justify-start text-sm text-gray-500">
              <a
                href="https://play.google.com/store/apps/details?id=app.yarnflow.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 underline underline-offset-2 transition"
              >
                {t('hero.googlePlay')}
              </a>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            {/* [AI:Claude] Bulles fabriquées en HTML/CSS plutôt qu'une capture d'écran :
                pas de dépendance à un asset externe, facile à traduire, et montre
                l'assistant (le nouveau positionnement) plutôt que le compteur dès le
                premier écran. Remplaçable par une vraie capture le jour où disponible. */}
            <div className="w-full max-w-sm bg-gray-50 rounded-[2rem] shadow-2xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">M</div>
                <div className="bg-white rounded-2xl rounded-tr-none border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
                  {t('hero.chatQuestion')}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex-shrink-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div className="bg-primary-50 rounded-2xl rounded-tl-none border border-primary-100 px-4 py-2.5 text-sm text-gray-700">
                  {t('hero.chatAnswer')}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* "Tu connais ce moment où..." — accroche du problème, avant la solution */}
      <section className="bg-primary-50 border-y border-primary-100 py-14" id="features">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('problem.title')}</h2>
          <ul className="space-y-2 mb-6">
            {t('problem.items', { returnObjects: true }).map((item, i) => (
              <li key={i} className="text-gray-600">{item}</li>
            ))}
          </ul>
          <p className="text-gray-700 font-medium mb-2">{t('problem.punchline')}</p>
          <p className="text-lg font-bold text-primary-700">{t('problem.solution')}</p>
        </div>
      </section>

      {/* Assistant IA — copilote, différenciateur principal */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('assistant.eyebrow')}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                <Trans i18nKey="assistant.title" ns="landing" components={[<br key="0" />]} />
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                {t('assistant.desc')}
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                {t('assistant.bullets', { returnObjects: true }).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary-200">
                {t('assistant.tagline')}
              </span>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">M</div>
                <div className="bg-white rounded-xl rounded-tl-none border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
                  {t('assistant.question')}
                </div>
              </div>
              <div className="flex items-start gap-3 flex-row-reverse">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex-shrink-0 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                </div>
                <div className="bg-primary-50 rounded-xl rounded-tr-none border border-primary-100 px-4 py-2.5 text-sm text-gray-700">
                  {t('assistant.answer')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Du patron à ton ouvrage — parcours narratif plutôt que liste de features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest block text-center">{t('flow.eyebrow')}</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-10 text-center">{t('flow.title')}</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {t('flow.steps', { returnObjects: true }).map((step, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="text-3xl font-bold text-primary-200 mb-2">{String(i + 1).padStart(2, '0')}</div>
                <p className="font-bold text-gray-900 mb-1">{step.title}</p>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traduction — preuve de compréhension, pas un outil isolé */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-primary-50 border border-primary-200 rounded-3xl p-8 md:p-10">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('translationBlock.eyebrow')}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3 max-w-2xl">
              {t('translationBlock.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-2xl">
              {t('translationBlock.desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Feature detail — Compteur */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">

            {/* Screenshot compteur */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <img src={isEnglish ? '/screenshots/compteur-en.png' : '/compteur.jpg'} alt={t('counter.screenshotAlt')} loading="lazy" decoding="async" className="w-full object-cover" />
            </div>

            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('counter.eyebrow')}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                <Trans i18nKey="counter.title" ns="landing" components={[<br key="0" />]} />
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                {t('counter.desc')}
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  ...t('counter.features', { returnObjects: true }),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Argument différenciant — sections + compteurs multiples */}
          <div className="bg-primary-50 border border-primary-200 rounded-3xl p-8 md:p-10 mb-20">
            <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('sections.eyebrow')}</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3">
              {t('sections.title')}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-2xl">
              {t('sections.desc')}
            </p>
            <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl">
              {[
                ...t('sections.parts', { returnObjects: true }),
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 bg-white rounded-xl border border-primary-200 px-3.5 py-2.5 text-sm font-medium text-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Feature detail — Photo IA */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('photoStudio.eyebrow')}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                <Trans i18nKey="photoStudio.title" ns="landing" components={[<br key="0" />]} />
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                {t('photoStudio.desc')}
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  ...t('photoStudio.features', { returnObjects: true }),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Avant/après réels */}
            <div className="order-1 md:order-2 grid grid-cols-2 gap-3">
              <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-square">
                <img src="/photo-avant.jpg" alt={t('photoStudio.beforeAlt')} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-gray-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t('photoStudio.before')}</div>
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-sm border border-primary-200 aspect-square">
                <img src="/photo-apres.jpg" alt={t('photoStudio.afterAlt')} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-primary-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{t('photoStudio.after')}</div>
              </div>
            </div>
          </div>

          {/* Feature detail — Bibliothèque */}
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Screenshot projets */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative">
              <img src={isEnglish ? '/screenshots/projets-en.png' : '/projets.jpg'} alt={t('library.screenshotAlt')} loading="lazy" decoding="async" className="w-full object-cover object-top max-h-[480px]" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>


            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('library.eyebrow')}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                <Trans i18nKey="library.title" ns="landing" components={[<br key="0" />]} />
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                {t('library.desc')}
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  ...t('library.features', { returnObjects: true }),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature detail — Création intelligente */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Screenshot étape validation */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 relative">
              <img src={isEnglish ? '/screenshots/patron-en.png' : '/patron.jpg'} alt={t('smartCreation.screenshotAlt')} loading="lazy" decoding="async" className="w-full object-cover object-top max-h-[480px]" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>

            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">{t('smartCreation.eyebrow')}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                <Trans i18nKey="smartCreation.title" ns="landing" components={[<br key="0" />]} />
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                {t('smartCreation.desc')}
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                {[
                  ...t('smartCreation.features', { returnObjects: true }),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary-200">
                {t('smartCreation.badge')}
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-primary-50 border-y border-primary-100 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{t('testimonials.title')}</h2>
          <p className="text-center text-sm text-gray-500 mb-10">{t('testimonials.subtitle')}</p>
          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {t('testimonials.items', { returnObjects: true }).map((quote, i) => (
              <div key={i} className="bg-white rounded-2xl border border-primary-200 p-6 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{quote}"</p>
                <p className="font-semibold text-gray-900 text-sm">{t('testimonials.authorFallback')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">{t('pricing.title')}</h2>
          <p className="text-center text-gray-600 mb-10 text-lg">
            {t('pricing.subtitle')}
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">

            {/* FREE */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t('pricing.free.name')}</p>
              <div className="text-4xl font-bold text-gray-900 mb-1">0€</div>
              <p className="text-sm text-gray-500 mb-6">{t('pricing.free.desc')}</p>
              <ul className="space-y-3 mb-8">
                {t('pricing.free.features', { returnObjects: true }).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block w-full text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition text-sm">
                {t('pricing.free.cta')}
              </Link>
            </div>

            {/* PLUS */}
            <div className="bg-white border-2 border-primary-400 rounded-2xl p-7 shadow-md relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary-400 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">{t('pricing.plus.badge')}</span>
              </div>
              <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-3 mt-2">{t('pricing.plus.name')}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">2,49€</span>
                <span className="text-sm text-gray-500">{t('pricing.perMonth')}</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-1">{t('pricing.plus.billing')}</p>
              <p className="text-sm text-gray-500 mb-6">{t('pricing.plus.desc')}</p>
              <ul className="space-y-3 mb-8">
                {t('pricing.plus.features', { returnObjects: true }).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('plus', 'annual', 'landing')}
                  className="block w-full text-center bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  {t('pricing.plus.ctaAnnual')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('plus', 'monthly', 'landing')}
                  className="block w-full text-center text-gray-500 hover:text-gray-700 text-sm py-2 transition"
                >
                  {t('pricing.plus.ctaMonthly')}
                </Link>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">{t('pricing.noCommitment')}</p>
            </div>

            {/* PRO */}
            <div className="bg-white border-2 border-primary-600 rounded-2xl p-7 shadow-lg relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">{t('pricing.pro.badge')}</span>
              </div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3 mt-2">{t('pricing.pro.name')}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">4,99€</span>
                <span className="text-sm text-gray-500">{t('pricing.perMonth')}</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-1">{t('pricing.pro.billing')}</p>
              <p className="text-sm text-gray-500 mb-6">{t('pricing.pro.desc')}</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {t('pricing.pro.includesPlus')}
                </li>
                {/* <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">{t('ui.unlimitedStash')}</span></span>
                </li> */}
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">{t('pricing.pro.smartCreation')}</span><span className="block text-gray-500 text-xs mt-0.5">{t('pricing.pro.smartCreationDesc')}</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">{t('pricing.pro.assistant')}</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">{t('pricing.pro.photoStudio')}</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">{t('pricing.pro.translations')}</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">{t('pricing.pro.stats')}</span><span className="block text-gray-500 text-xs mt-0.5">{t('pricing.pro.statsDesc')}</span></span>
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('pro', 'annual', 'landing')}
                  className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  {t('pricing.pro.ctaAnnual')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('pro', 'monthly', 'landing')}
                  className="block w-full text-center border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  {t('pricing.pro.ctaMonthly')}
                </Link>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">{t('pricing.noCommitment')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">{t('faq.title')}</h2>
          <div className="space-y-3">
            {t('faq.items', { returnObjects: true }).map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition gap-4"
                >
                  <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${openFAQ === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFAQ === i && (
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('finalCta.title')}
          </h2>
          <p className="text-lg mb-8 opacity-90 leading-relaxed">
            {t('finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-gray-100 text-base px-8 py-3.5 rounded-xl font-semibold transition shadow-lg"
            >
              {t('finalCta.cta')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="https://play.google.com/store/apps/details?id=app.yarnflow.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 text-base px-6 py-3.5 rounded-xl font-medium transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.65.19.97.07l11.65-6.73-2.55-2.55-10.07 9.21zM.44 1.6C.17 1.93 0 2.4 0 3.01v17.98c0 .61.17 1.08.44 1.41l.07.07 10.07-10.07v-.24L.51 1.53l-.07.07zM19.69 8.6l-2.88-1.66-2.86 2.86 2.86 2.86 2.9-1.67c.83-.48.83-1.26-.02-1.39zM3.18.24L13.25 9.45l-2.55 2.55L-.01.31C.32.19.67.21.97.07z"/>
              </svg>
              {t('finalCta.googlePlay')}
            </a>
          </div>
          <p className="mt-4 text-sm opacity-70">
{t('finalCta.alreadyMember')} <Link to="/login" className="underline hover:no-underline font-medium">{t('finalCta.login')}</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                <span className="font-bold text-lg text-white">YarnFlow</span>
              </div>
              <p className="text-sm">{t('footer.tagline')}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">{t('footer.legal')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition">{t('footer.privacy')}</Link></li>
                <li><Link to="/cgu" className="hover:text-white transition">{t('footer.terms')}</Link></li>
                <li><Link to="/mentions-legales" className="hover:text-white transition">{t('footer.legalNotice')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">{t('footer.support')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition">{t('footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">{t('footer.app')}</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition">{t('footer.register')}</Link></li>
                <li><Link to="/login" className="hover:text-white transition">{t('footer.login')}</Link></li>
                <li><a href="#pricing" className="hover:text-white transition">{t('footer.pricing')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Landing
