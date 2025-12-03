/**
 * @file Landing.jsx
 * @brief Landing page épurée et personnelle pour YarnFlow
 * @author Nathalie
 * @version 1.0.0 - Design simplifié et chaleureux
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAnalytics, useScrollTracking } from '../hooks/useAnalytics'

// Détection automatique de l'environnement
const getAPIUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (import.meta.env.PROD) return 'https://yarnflow.fr/api'
  return 'http://localhost:8000/api'
}

const API_URL = getAPIUrl()

const Landing = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Analytics
  const { trackPageView, trackWaitlistSignup } = useAnalytics()
  useScrollTracking()

  useEffect(() => {
    trackPageView('Landing Page - Beta', '/')

    // Animation du fil de laine au scroll
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      const yarnThread = document.getElementById('yarn-thread')
      if (yarnThread) {
        yarnThread.style.strokeDashoffset = `${1000 - (scrollPercent * 10)}`
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post(`${API_URL}/waitlist/subscribe`, {
        email
      })

      setSuccess(true)
      trackWaitlistSignup(email)
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Fil de laine décoratif */}
      <div className="fixed left-8 top-0 bottom-0 pointer-events-none hidden lg:block z-0" style={{ width: '60px' }}>
        <svg width="60" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Filtre pour texture de laine */}
            <filter id="yarn-texture">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
            </filter>

            {/* Dégradé pour effet 3D */}
            <linearGradient id="yarn-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#c86438', stopOpacity: 0.8 }} />
              <stop offset="50%" style={{ stopColor: '#dd7a4a', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#a8502d', stopOpacity: 0.8 }} />
            </linearGradient>
          </defs>

          {/* Pelote de laine en haut - plus réaliste */}
          <g filter="url(#yarn-texture)">
            <circle cx="30" cy="30" r="20" fill="#f2b899" stroke="#dd7a4a" strokeWidth="2"/>
            <ellipse cx="30" cy="30" rx="18" ry="15" fill="none" stroke="#e9956b" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7"/>
            <ellipse cx="30" cy="30" rx="14" ry="18" fill="none" stroke="#c86438" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.6"/>
            <circle cx="30" cy="30" r="10" fill="none" stroke="#dd7a4a" strokeWidth="1" strokeDasharray="2,1"/>
          </g>

          {/* Fil principal - base */}
          <path
            d="M 30 50 Q 15 100, 30 150 Q 45 200, 30 250 Q 15 300, 30 350 Q 45 400, 30 450 Q 15 500, 30 550 Q 45 600, 30 650 Q 15 700, 30 750 Q 45 800, 30 850 Q 15 900, 30 950 Q 45 1000, 30 1050"
            stroke="#a8502d"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            opacity="0.3"
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />

          {/* Fil principal - couleur principale */}
          <path
            id="yarn-thread"
            d="M 30 50 Q 15 100, 30 150 Q 45 200, 30 250 Q 15 300, 30 350 Q 45 400, 30 450 Q 15 500, 30 550 Q 45 600, 30 650 Q 15 700, 30 750 Q 45 800, 30 850 Q 15 900, 30 950 Q 45 1000, 30 1050"
            stroke="url(#yarn-gradient)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1000"
            strokeDashoffset="1000"
            filter="url(#yarn-texture)"
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />

          {/* Effet torsade - lignes parallèles */}
          <path
            d="M 30 50 Q 15 100, 30 150 Q 45 200, 30 250 Q 15 300, 30 350 Q 45 400, 30 450 Q 15 500, 30 550 Q 45 600, 30 650 Q 15 700, 30 750 Q 45 800, 30 850 Q 15 900, 30 950 Q 45 1000, 30 1050"
            stroke="#fceee5"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="8,12"
            strokeDashoffset="1000"
            opacity="0.6"
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />

          {/* Petites fibres qui dépassent */}
          <path
            d="M 30 50 Q 15 100, 30 150 Q 45 200, 30 250 Q 15 300, 30 350 Q 45 400, 30 450 Q 15 500, 30 550 Q 45 600, 30 650 Q 15 700, 30 750 Q 45 800, 30 850 Q 15 900, 30 950 Q 45 1000, 30 1050"
            stroke="#dd7a4a"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2,20"
            strokeDashoffset="1000"
            opacity="0.4"
            style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          />
        </svg>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-16 text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold text-primary-600 mb-6">
          YarnFlow
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
          Salut, je suis <strong className="text-primary-700">Nathalie</strong>, crocheteuse et développeuse.
        </p>
        <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
          J'ai créé YarnFlow parce que je voulais enfin un outil simple pour compter mes rangs, organiser mes patrons, et sublimer mes photos.
        </p>
        <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
          L'app est presque prête, et je cherche <strong className="text-primary-700">50–100 testeuses motivées</strong> pour l'essayer gratuitement et m'aider à l'améliorer.
        </p>

        {/* Box Beta Testeuse */}
        <div className="bg-primary-50 border-2 border-primary-500 rounded-3xl p-8 md:p-10 max-w-3xl mx-auto text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-700 mb-6 text-center">
            Rejoignez la waitlist
          </h2>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre email"
                required
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-lg text-lg focus:border-primary-500 focus:outline-none"
              />
            </div>
            {error && (
              <p className="text-red-600 mb-4 text-center">{error}</p>
            )}
            {success ? (
              <div className="bg-green-50 border-2 border-green-500 text-green-800 p-6 rounded-2xl text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-xl font-bold mb-2">C'est noté !</h3>
                <p className="text-sm">Vous recevrez un email dans quelques jours dès que l'app sera prête.</p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Inscription...' : 'Je rejoins la beta'}
              </button>
            )}
          </form>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-primary-700 mb-3">Ce que vous obtenez :</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Accès complet gratuit pendant la beta</li>
                <li>✓ Influence directe sur les prochaines fonctionnalités</li>
                <li>✓ Tarifs préférentiels au lancement</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-primary-700 mb-3">Ce que je vous demande :</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Tester sur vos vrais projets</li>
                <li>✓ Me donner vos retours honnêtes</li>
                <li>✓ Tolérer quelques bugs 😄</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center text-primary-700 mb-4">Ce que vous allez pouvoir tester</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
          {/* Feature 1 */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">🧵</div>
            <h3 className="text-xl font-bold text-primary-700 mb-3">Compteur de rangs intelligent</h3>
            <p className="text-gray-600">Plus jamais perdue : plusieurs projets à la fois, timer automatique, progression en temps réel.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-xl font-bold text-primary-700 mb-3">Tous vos patrons au même endroit</h3>
            <p className="text-gray-600">Importez vos PDF, ajoutez des liens, organisez votre bibliothèque facilement.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">📸</div>
            <h3 className="text-xl font-bold text-primary-700 mb-3">Des photos qui mettent en valeur vos créations</h3>
            <p className="text-gray-600">Amélioration automatique de VOS photos (éclairage, fond, couleurs) — l'ouvrage reste inchangé.</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-primary-700 mb-3">Suivi de progression</h3>
            <p className="text-gray-600">Votre vitesse, votre historique, vos statistiques… sans rien noter manuellement.</p>
          </div>
        </div>
      </section>

      {/* Avant/Après IA Photo - DÉSACTIVÉ temporairement */}
      {/* <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center text-primary-700 mb-4">✨ Avant / Après : vos ouvrages comme jamais</h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Transformez vos photos smartphone en images professionnelles en un clic
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src="/images/before-example.jpg"
              alt="Photo avant - prise au smartphone"
              className="w-full aspect-[4/3] object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.classList.add('bg-gradient-to-br', 'from-gray-200', 'to-gray-300', 'flex', 'items-center', 'justify-center', 'aspect-[4/3]')
                e.target.parentElement.innerHTML = '<div class="text-center p-8"><p class="text-2xl font-bold text-gray-500 mb-2">AVANT</p><p class="text-gray-500">Photo smartphone</p><p class="text-xs text-gray-400 mt-4">Importer : /public/images/before-example.jpg</p></div>'
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent p-6">
              <p className="text-white font-bold text-xl">AVANT</p>
              <p className="text-white/90 text-sm">Photo smartphone</p>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <img
              src="/images/after-example.jpg"
              alt="Photo après - retouchée par YarnFlow IA"
              className="w-full aspect-[4/3] object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.classList.add('bg-gradient-to-br', 'from-primary-100', 'to-primary-200', 'flex', 'items-center', 'justify-center', 'aspect-[4/3]')
                e.target.parentElement.innerHTML = '<div class="text-center p-8"><p class="text-2xl font-bold text-primary-700 mb-2">APRÈS</p><p class="text-primary-700">YarnFlow AI Studio</p><p class="text-xs text-primary-600 mt-4">Importer : /public/images/after-example.jpg</p></div>'
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-900/80 to-transparent p-6">
              <p className="text-white font-bold text-xl">APRÈS</p>
              <p className="text-white/90 text-sm">YarnFlow Studio</p>
            </div>
          </div>
        </div>
      </section> */}

      {/* FAQ - Version simplifiée */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-primary-700 mb-10">Questions fréquentes</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">C'est vraiment gratuit ?</h3>
            <p className="text-gray-600">Oui. Accès complet gratuit pendant toute la beta. Ensuite, vous pourrez rester sur la version gratuite ou passer à un plan payant (tarif préférentiel pour les testeuses).</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Ça marche sur quels appareils ?</h3>
            <p className="text-gray-600">Sur navigateur (mobile, tablette, ordinateur). Installable comme une vraie app (PWA).</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Je dois m'engager sur combien de temps ?</h3>
            <p className="text-gray-600">Aucun engagement. La beta dure 1-2 mois, mais vous arrêtez quand vous voulez.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="mb-4">© 2026 YarnFlow — Tous droits réservés</p>
          <p className="text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-primary-300 transition">Politique de confidentialité</Link>
            {' · '}
            <Link to="/cgu" className="hover:text-primary-300 transition">Conditions d'utilisation</Link>
            {' · '}
            <Link to="/mentions" className="hover:text-primary-300 transition">Mentions légales</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
