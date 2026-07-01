/**
 * @file Landing.jsx
 * @brief Landing page YarnFlow
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalytics, useScrollTracking } from '../hooks/useAnalytics'

const Landing = () => {
  const [openFAQ, setOpenFAQ] = useState(null)

  const { trackPageView, trackSubscriptionClick } = useAnalytics()
  useScrollTracking()

  useEffect(() => {
    trackPageView('Landing Page - v4', '/')
  }, [])

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
            <a href="#features" className="hover:text-primary-600 transition">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-primary-600 transition">Tarifs</a>
            <Link to="/contact" className="hover:text-primary-600 transition">Contact</Link>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/login" className="text-gray-700 hover:text-primary-600 font-medium transition text-sm">
              Connexion
            </Link>
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 sm:px-4 py-2 rounded-xl font-medium transition text-xs sm:text-sm shadow-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">Commencer — c'est gratuit</span>
              <span className="sm:hidden">C'est gratuit</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-14 pb-16 text-center">

        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-1.5 text-xs font-semibold text-primary-700 mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" />
          </svg>
          Créé par une crocheteuse passionnée
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Le carnet de tricot & crochet<br className="hidden md:block" /> que vous méritez vraiment
        </h1>

        <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
          Fini de jongler entre trois apps différentes et vos notes papier. YarnFlow gère vos projets du premier rang jusqu'à la photo finale — dans une seule app.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-base px-8 py-3.5 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
          >
            Créer mon compte gratuit
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <a
            href="https://play.google.com/store/apps/details?id=app.yarnflow.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 text-base px-6 py-3.5 rounded-xl font-medium transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.18 23.76c.3.17.65.19.97.07l11.65-6.73-2.55-2.55-10.07 9.21zM.44 1.6C.17 1.93 0 2.4 0 3.01v17.98c0 .61.17 1.08.44 1.41l.07.07 10.07-10.07v-.24L.51 1.53l-.07.07zM19.69 8.6l-2.88-1.66-2.86 2.86 2.86 2.86 2.9-1.67c.83-.48.83-1.26-.02-1.39zM3.18.24L13.25 9.45l-2.55 2.55L-.01.31C.32.19.67.21.97.07z"/>
            </svg>
            Disponible sur Google Play
          </a>
          <a
            href="#pricing"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 text-base px-8 py-3.5 rounded-xl font-medium transition"
          >
            Voir les tarifs
          </a>
        </div>

        <p className="text-sm text-gray-400">Aucune carte bancaire requise · Gratuit pour toujours</p>
      </section>

      {/* Différenciateur — 3 points forts */}
      <section className="bg-primary-50 border-y border-primary-100 py-10" id="features">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 text-center">

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 bg-white rounded-2xl border border-primary-200 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Projets complexes, enfin maîtrisés</p>
                <p className="text-sm text-gray-600">Sections, 2 compteurs simultanés, notes par section — même un pull avec manches raglan</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 bg-white rounded-2xl border border-primary-200 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Un patron PDF ou URL → un projet prêt</p>
                <p className="text-sm text-gray-600">L'IA lit votre patron, crée les sections et remplit les détails — en quelques secondes</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 p-4">
              <div className="w-12 h-12 bg-white rounded-2xl border border-primary-200 flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900 mb-1">Photos dignes de vos créations</p>
                <p className="text-sm text-gray-600">L'IA sublime vos photos — éclairage, fond, couleurs — sans toucher à votre ouvrage</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature detail — Compteur */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">

            {/* Screenshot compteur */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              <img src="/compteur.jpg" alt="Compteur de rangs YarnFlow" className="w-full object-cover" />
            </div>

            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Compteur de rangs</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                "Où j'en étais, déjà ?"<br />Plus jamais.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Un gros bouton, un rang compté. Interface pensée pour les doigts occupés, progression visible d'un coup d'œil. Et si votre projet a plusieurs sections — dos, devant, manches — chacune a son propre compteur.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  'Timer intégré pour mesurer votre temps de travail',
                  "Wake lock : l'écran reste allumé pendant que vous tricotez",
                  'Sections indépendantes par partie de projet',
                  '2 compteurs simultanés pour les projets complexes (PLUS & PRO)',
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

          {/* Feature detail — Photo IA */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Photo Studio IA</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                Vos créations méritent<br />de belles photos
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Une photo prise à la va-vite sur le canapé ? L'IA sublime l'éclairage, adoucit le fond et met votre ouvrage en valeur — sans le dénaturer. Parfait pour partager sur Instagram, vendre sur Etsy, ou simplement garder un beau souvenir de vos créations.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  '9 styles disponibles — Lifestyle, Studio, Scandinavian...',
                  'Votre ouvrage reste 100% authentique',
                  'Parfait pour Etsy, Instagram ou vos archives',
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
                <img src="/photo-avant.jpg" alt="Avant — photo brute" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-gray-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AVANT</div>
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-sm border border-primary-200 aspect-square">
                <img src="/photo-apres.jpg" alt="Après — rendu IA Lifestyle" className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-primary-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">APRÈS</div>
              </div>
            </div>
          </div>

          {/* Feature detail — Bibliothèque */}
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Screenshot projets */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative">
              <img src="/projets.jpg" alt="Mes projets YarnFlow" className="w-full object-cover object-top max-h-[480px]" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>


            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Bibliothèque & Organisation</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                Tous vos patrons,<br />tous vos projets — au même endroit
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                PDF Ravelry, liens Etsy, notes personnelles — tout dans une bibliothèque propre. Filtrez par catégorie, technique ou favoris et retrouvez n'importe quel patron en deux secondes.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                {[
                  'Patrons en PDF, URL ou texte libre',
                  'Détails techniques : laine, aiguilles, échantillon, dimensions',
                  'Notes globales par projet',
                  'Filtres par catégorie, technique et favoris',
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
              <img src="/patron.jpg" alt="Création intelligente YarnFlow — validation du patron extrait" className="w-full object-cover object-top max-h-[480px]" />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>

            <div>
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Création Intelligente</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">
                Importez un patron PDF ou une URL.<br />Le projet se crée tout seul.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Téléchargez votre patron en PDF ou collez une URL — l'IA lit le document, crée les sections, remplit les détails techniques et structure votre projet en quelques secondes. Personne d'autre ne fait ça.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600 mb-6">
                {[
                  "PDF ou URL — Ravelry, Etsy, blog, peu importe la source",
                  'Sections créées automatiquement (dos, devant, manches…)',
                  'Laine, aiguilles, tension extraits du patron',
                  '3 essais gratuits · 3 imports/mois en PLUS · 15 imports/mois en PRO',
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
                Unique sur le marché du tricot &amp; crochet
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Assistant IA */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-widest">Assistant IA</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">Un expert tricot & crochet disponible à tout moment</h2>
          <p className="text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto">
            Comment calculer les diminutions pour ma taille ? Quel point pour remplacer celui du patron ? L'assistant connaît votre projet et répond en contexte — pas des réponses génériques.
          </p>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-left max-w-lg mx-auto space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">M</div>
              <div className="bg-white rounded-xl rounded-tl-none border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
                J'ai raté 3 rangs sur mon dos, comment je rattrape sans détricoter tout ?
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-7 h-7 bg-primary-600 rounded-full flex-shrink-0 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <div className="bg-primary-50 rounded-xl rounded-tr-none border border-primary-100 px-4 py-2.5 text-sm text-gray-700">
                Pour rattraper 3 rangs sans détricoter, vous pouvez utiliser une aiguille auxiliaire…
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">5 questions / mois en FREE · 10 questions / mois en PLUS · 30 questions / mois en PRO</p>
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-primary-50 border-y border-primary-100 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Ce qu'en disent nos premières utilisatrices</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote: "J'avais essayé d'autres apps, mais c'est la première fois que je peux vraiment gérer mon pull avec les deux manches en même temps. Les sections changent tout.",
                name: "Marie-Claire",
              },
              {
                quote: "Les photos IA sont bluffantes. Je poste maintenant mes créations sur Instagram sans complexe — et les gens me demandent toujours quel photographe j'ai utilisé.",
                name: "Louisa",
              },
              {
                quote: "Je cherchais un carnet numérique sérieux depuis des années. YarnFlow c'est exactement ça — simple pour commencer, puissant quand on en a besoin.",
                name: "Sophie",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-primary-200 p-6 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <svg key={s} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">Simple et transparent</h2>
          <p className="text-center text-gray-600 mb-10 text-lg">
            FREE pour toujours. PLUS quand vos projets grandissent. PRO quand ils méritent tout.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">

            {/* FREE */}
            <div className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Free</p>
              <div className="text-4xl font-bold text-gray-900 mb-1">0€</div>
              <p className="text-sm text-gray-500 mb-6">L'essentiel pour suivre vos encours et découvrir la puissance de l'IA.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Projets &amp; patrons illimités (100 Mo pour les fichiers)
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  1 compteur de rangs actif par projet
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Timer intégré &amp; suivi du temps
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Notes par section
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium">3 Créations Intelligentes IA offertes</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  5 questions / mois à l'assistant IA
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Studio Photo : 2 crédits offerts
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  3 traductions de patron offertes
                </li>
              </ul>
              <Link to="/register" className="block w-full text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition text-sm">
                Créer mon compte gratuit
              </Link>
            </div>

            {/* PLUS */}
            <div className="bg-white border-2 border-primary-400 rounded-2xl p-7 shadow-md relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary-400 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">Nouveau</span>
              </div>
              <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-3 mt-2">Plus</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">2,49€</span>
                <span className="text-sm text-gray-500">/mois</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-1">Facturé 29,99€/an — économisez 17,89€</p>
              <p className="text-sm text-gray-500 mb-6">Pour les tricoteuses organisées qui veulent plus de confort.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Tout ce qu'inclut le plan FREE
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span className="font-medium text-gray-800">2 compteurs simultanés</span>
                </li>
                {/* <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">50 pelotes en stock</span></span>
                </li> */}
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">Création Intelligente — 3 imports / mois</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span>10 questions / mois à l'assistant IA</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span>Studio Photo : 5 crédits / mois</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium">3 traductions de patron / mois</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span>Statistiques avancées</span>
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('plus', 'annual', 'landing')}
                  className="block w-full text-center bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  Passer à PLUS (Annuel) — 29,99€/an
                </Link>
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('plus', 'monthly', 'landing')}
                  className="block w-full text-center text-gray-500 hover:text-gray-700 text-sm py-2 transition"
                >
                  Mensuel — 3,99€/mois
                </Link>
              </div>
              <p className="text-xs text-gray-400 text-center mt-1">Sans engagement · Résiliable à tout moment</p>
            </div>

            {/* PRO */}
            <div className="bg-white border-2 border-primary-600 rounded-2xl p-7 shadow-lg relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">Pour les passionnées</span>
              </div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3 mt-2">Pro</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900">4,99€</span>
                <span className="text-sm text-gray-500">/mois</span>
              </div>
              <p className="text-xs text-green-600 font-medium mb-1">Facturé 59,99€/an — économisez 23,89€</p>
              <p className="text-sm text-gray-500 mb-6">Pour les projets qui méritent tout.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Tout ce qu'inclut le plan PLUS
                </li>
                {/* <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">Stock illimité</span></span>
                </li> */}
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">Création Intelligente — 15 imports / mois</span><span className="block text-gray-500 text-xs mt-0.5">Déposez un PDF ou une photo, l'IA pré-remplit tout instantanément</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">Assistant IA tricot — 30 questions / mois</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">Studio Photo : 20 crédits / mois</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">15 traductions de patron / mois</span></span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <span><span className="font-medium text-gray-800">Statistiques avancées</span><span className="block text-gray-500 text-xs mt-0.5">Graphiques visuels, badges de progression et temps moyen par session</span></span>
                </li>
              </ul>
              <div className="space-y-2">
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('pro', 'annual', 'landing')}
                  className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition shadow-sm text-sm"
                >
                  Passer à PRO (Annuel)
                </Link>
                <Link
                  to="/register"
                  onClick={() => trackSubscriptionClick('pro', 'monthly', 'landing')}
                  className="block w-full text-center border-2 border-primary-600 text-primary-700 hover:bg-primary-50 font-semibold py-2.5 rounded-xl transition text-sm"
                >
                  Choisir le Mensuel (6,99€/mois)
                </Link>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">Sans engagement · Résiliable à tout moment</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-t border-gray-200 py-16">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Questions fréquentes</h2>
          <div className="space-y-3">
            {[
              {
                q: "C'est vraiment gratuit pour toujours ?",
                a: "Oui, sans limite de temps. Projets illimités, compteur de rangs, bibliothèque de patrons, détails techniques — sans jamais payer. Les fichiers uploadés (PDF, images) sont limités à 100 Mo en FREE ; patrons en URL ou en texte : illimités. PLUS et PRO se justifient quand vos projets grandissent."
              },
              {
                q: "Quelle est la différence entre FREE, PLUS et PRO concrètement ?",
                a: "FREE couvre l'usage quotidien : compter ses rangs, noter ses infos, notes par section, bibliothèque illimitée (100 Mo de fichiers), 20 photos, 2 essais création intelligente, 5 questions IA/mois, 2 crédits photo IA à vie. PLUS (3,99€/mois) ajoute : stockage fichiers illimité, 200 photos, 2 compteurs simultanés, 3 imports IA/mois, 10 questions IA/mois, 5 crédits photo/mois, statistiques avancées. PRO (6,99€/mois) débloque tout : 15 imports IA/mois, 30 questions IA/mois, 20 crédits photo/mois."
              },
              {
                q: "La création intelligente, c'est quoi exactement ?",
                a: "Vous importez un patron en PDF ou collez une URL — l'IA analyse le document, détecte les sections (dos, devant, manches...), extrait les détails techniques (laine, aiguilles, tension) et crée votre projet automatiquement. 3 essais gratuits offerts pour tous, puis 3 imports/mois en PLUS ou 15 imports/mois en PRO."
              },
              {
                q: "Ça marche sur quels appareils ?",
                a: "YarnFlow est une PWA — accessible sur tous les navigateurs (mobile, tablette, ordinateur). Vous pouvez l'installer sur votre téléphone comme une vraie app, avec l'icône sur l'écran d'accueil. Aucun téléchargement sur l'App Store requis."
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui, sans engagement. Vous annulez depuis votre profil, votre abonnement reste actif jusqu'à la fin de la période payée, puis vous repassez automatiquement en FREE. Vos données sont conservées."
              },
              {
                q: "Mes patrons et projets sont-ils en sécurité ?",
                a: "Vos données sont stockées en sécurité sur nos serveurs, ne sont jamais partagées ou vendues, et vous pouvez les supprimer à tout moment."
              },
            ].map((item, i) => (
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
            Votre prochain projet mérite mieux qu'un bout de papier
          </h2>
          <p className="text-lg mb-8 opacity-90 leading-relaxed">
            Rejoignez les passionné·es qui ont troqué les carnets froissés contre YarnFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-gray-100 text-base px-8 py-3.5 rounded-xl font-semibold transition shadow-lg"
            >
              Créer mon compte gratuit
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
              Google Play
            </a>
          </div>
          <p className="mt-4 text-sm opacity-70">
            Déjà inscrit·e ? <Link to="/login" className="underline hover:no-underline font-medium">Connexion</Link>
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
              <p className="text-sm">L'outil malin pour les passionné·es de tricot et crochet</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Légal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition">Politique de confidentialité</Link></li>
                <li><Link to="/cgu" className="hover:text-white transition">Conditions d'utilisation</Link></li>
                <li><Link to="/mentions-legales" className="hover:text-white transition">Mentions légales</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3 text-sm">App</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition">Créer un compte</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Connexion</Link></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-xs">
            <p>© 2026 YarnFlow — Tous droits réservés</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Landing
