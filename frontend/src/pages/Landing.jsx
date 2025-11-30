/**
 * @file Landing.jsx
 * @brief Landing page publique pour la waitlist YarnFlow
 * @author YarnFlow Team
 * @created 2025-11-20
 * @version 0.14.0 - Design artisanal unique
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
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [subscribersCount, setSubscribersCount] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [currentNotification, setCurrentNotification] = useState('')

  // Analytics
  const { trackPageView, trackWaitlistSignup, trackOutboundLink } = useAnalytics()
  useScrollTracking() // Track scroll depth automatiquement

  useEffect(() => {
    fetchSubscribersCount()

    // Track page view
    trackPageView('Landing Page - Waitlist', '/')

    // Social proof notifications
    const names = [
      'Sarah', 'Julie', 'Claire', 'Marie', 'Sophie', 'Emma', 'Laura', 'Camille',
      'Léa', 'Chloé', 'Anaïs', 'Pauline', 'Manon', 'Lisa', 'Mathilde', 'Charlotte',
      'Lucie', 'Alice', 'Inès', 'Lou', 'Mila', 'Rose', 'Lina', 'Zoé', 'Léna',
      'Juliette', 'Nina', 'Ambre', 'Lola', 'Jade', 'Eva', 'Anna', 'Iris', 'Romane',
      'Margaux', 'Élise', 'Valentine', 'Margot', 'Louise', 'Océane', 'Ella', 'Elena',
      'Noémie', 'Maëlys', 'Capucine', 'Victoria', 'Adèle', 'Agathe', 'Victoire',
      'Clémence', 'Mélanie', 'Céline', 'Émilie', 'Audrey', 'Jessica', 'Nathalie',
      'Isabelle', 'Florence', 'Sandrine', 'Sylvie', 'Stéphanie', 'Valérie', 'Corinne',
      'Thomas', 'Lucas', 'Julien', 'Alexandre', 'Antoine', 'Nicolas', 'Pierre',
      'Maxime', 'Hugo', 'Louis', 'Raphaël', 'Arthur', 'Paul', 'Gabriel', 'Victor',
      'Nathan', 'Léo', 'Tom', 'Noah', 'Ethan', 'Jules', 'Adam', 'Simon', 'Baptiste'
    ]
    const activities = [
      'vient de rejoindre la waitlist',
      's\'est inscrit·e il y a quelques minutes',
      'a rejoint YarnFlow',
      'vient de s\'inscrire',
      's\'est inscrit·e à l\'instant'
    ]

    const showRandomNotification = () => {
      const randomName = names[Math.floor(Math.random() * names.length)]
      const randomActivity = activities[Math.floor(Math.random() * activities.length)]
      setCurrentNotification(`👋 ${randomName} ${randomActivity}`)
      setShowNotification(true)

      // Cache après 4 secondes
      setTimeout(() => {
        setShowNotification(false)
      }, 4000)
    }

    // Première notification après 8 secondes (laisse le temps de lire)
    const initialTimer = setTimeout(showRandomNotification, 8000)

    // Puis toutes les 20-30 secondes
    const interval = setInterval(() => {
      showRandomNotification()
    }, Math.random() * 10000 + 20000) // Entre 20 et 30 secondes

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [])

  const fetchSubscribersCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/waitlist/count`)
      setSubscribersCount(response.data.data.count)
    } catch (err) {
      console.error('Erreur chargement compteur:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await axios.post(`${API_URL}/waitlist/subscribe`, {
        email,
        name: name || null
      })

      setSuccess(true)

      // Track conversion dans Google Analytics
      trackWaitlistSignup(email)

      setEmail('')
      setName('')
      fetchSubscribersCount()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const totalSubscribers = 45 + subscribersCount

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header simple */}
      <header className="bg-white border-b-2 border-indigo-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🧶</span>
            <span className="text-2xl font-black text-gray-800 tracking-tight">YarnFlow</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <p className="text-xl text-indigo-600 font-bold mb-6">
            L'app créée par une crocheteuse… pour les crocheteuses et tricoteuses ❤️
          </p>

          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-12 leading-tight">
            Le tracker tricot & crochet <span className="text-indigo-600">avec IA Photo Studio</span>
          </h1>
        </div>

        {/* Message rassurant FREE */}
        <div className="max-w-md mx-auto mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400 p-6 rounded-lg text-center shadow-md">
            <h3 className="text-xl font-black text-blue-900 mb-2">✨ Commencez GRATUITEMENT</h3>
            <p className="text-base text-blue-800">
              <strong>Aucune carte bancaire requise</strong> · Plan FREE à vie · Passez au PRO quand vous voulez
            </p>
          </div>
        </div>

        {/* Formulaire */}
        {!success ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="bg-white border-2 border-gray-300 p-8 space-y-6 rounded-lg shadow-lg">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                required
                className="w-full px-4 py-4 border-2 border-gray-300 focus:border-indigo-400 focus:outline-none text-base rounded-lg"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre prénom (optionnel)"
                className="w-full px-4 py-4 border-2 border-gray-300 focus:border-indigo-400 focus:outline-none text-base rounded-lg"
              />

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-4 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-500 text-white py-4 font-bold text-base hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition border-b-4 border-indigo-700 active:border-b-0 active:mt-0.5 disabled:opacity-50 rounded-lg"
              >
                {loading ? 'Inscription...' : '🎁 Commencer gratuitement'}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                En créant votre compte, vous démarrez avec le <strong className="text-indigo-600">plan FREE</strong> :<br />
                3 projets • 3 photos IA/mois • Sans engagement • Sans CB
              </p>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto bg-green-50 border-l-4 border-green-500 p-12 text-center mb-8 rounded-lg">
            <div className="text-5xl mb-6">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Bienvenue dans l'aventure !
            </h3>
            <p className="text-base text-gray-700 leading-relaxed">
              Vous êtes inscrit·e à la waitlist YarnFlow.<br />
              On vous tient au courant très bientôt ! 💌
            </p>
          </div>
        )}

        {/* Badge Early Bird + Compteur */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 px-6 py-4 mb-4 rounded-lg shadow-lg">
            <p className="text-gray-900 font-bold text-base">
              🔥 <strong>Early Bird :</strong> 2,99€/mois · 12 mois · 200 places seulement
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Déjà <strong className="text-indigo-600 font-bold">{totalSubscribers}</strong> passionné·es inscrit·es
          </p>
        </div>

        {/* Pourquoi YarnFlow */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">💡 Pourquoi YarnFlow ?</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
              <p className="font-bold text-base text-gray-900 mb-4">❌ Avant</p>
              <p className="text-base text-gray-700">Notes éparpillées · Rangs oubliés · Patrons introuvables · Photos ternes</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
              <p className="font-bold text-base text-gray-900 mb-4">✓ Avec YarnFlow</p>
              <p className="text-base text-gray-700 font-bold">Tout devient simple. Tout reste au même endroit.</p>
            </div>
          </div>
        </div>

        {/* Avant / Après */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">✨ Avant / Après : vos ouvrages comme jamais</h2>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 p-8 rounded-lg">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Image AVANT */}
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-300">
                <img
                  src="/images/avant.jpg"
                  alt="Photo d'ouvrage en crochet avant amélioration - éclairage standard et fond naturel"
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback si l'image n'existe pas encore
                    e.target.style.display = 'none'
                    e.target.parentElement.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center')
                    e.target.parentElement.innerHTML = `
                      <div class="text-center p-6">
                        <p class="text-6xl mb-4">📸</p>
                        <p class="text-xl font-bold text-gray-700 mb-2">AVANT</p>
                        <p class="text-gray-600 text-sm">Photo terne, éclairage approximatif, fond hasard</p>
                      </div>
                    `
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-bold text-base">📸 AVANT</p>
                  <p className="text-white/90 text-sm">Photo standard</p>
                </div>
              </div>

              {/* Image APRÈS */}
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-indigo-500">
                <img
                  src="/images/apres.jpg"
                  alt="Photo d'ouvrage en crochet après amélioration IA YarnFlow - éclairage professionnel, fond cohérent et détails optimisés"
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback si l'image n'existe pas encore
                    e.target.style.display = 'none'
                    e.target.parentElement.classList.add('bg-gradient-to-br', 'from-indigo-100', 'to-purple-100', 'flex', 'items-center', 'justify-center')
                    e.target.parentElement.innerHTML = `
                      <div class="text-center p-6">
                        <p class="text-6xl mb-4">✨</p>
                        <p class="text-xl font-bold text-indigo-700 mb-2">APRÈS (YarnFlow AI Studio)</p>
                        <p class="text-indigo-700 text-sm font-bold">Éclairage cohérent · Fond propre · Détails visibles · Rendu pro</p>
                      </div>
                    `
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-900/70 to-transparent p-4">
                  <p className="text-white font-bold text-base">✨ APRÈS (YarnFlow AI Studio)</p>
                  <p className="text-white/90 text-sm">Éclairage cohérent · Fond propre · Rendu pro</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-indigo-400 p-6 rounded-lg">
              <p className="text-base text-gray-800 font-bold text-center">
                L'IA n'améliore pas votre ouvrage — elle montre enfin sa vraie beauté.
              </p>
            </div>
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">🧶 Ce que vous pouvez faire</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-l-4 border-indigo-500 p-6 rounded-lg">
              <h3 className="text-base font-bold text-gray-900 mb-2">✓ Compteur intelligent</h3>
              <p className="text-base text-gray-700">Multi-sections · Timer auto · Cloud</p>
            </div>

            <div className="bg-white border-l-4 border-green-500 p-6 rounded-lg">
              <h3 className="text-base font-bold text-gray-900 mb-2">✓ Stats automatiques</h3>
              <p className="text-base text-gray-700">Rangs/h · Vitesse · Historique · Graphiques</p>
            </div>

            <div className="bg-white border-l-4 border-purple-500 p-6 rounded-lg">
              <h3 className="text-base font-bold text-gray-900 mb-2">✓ Bibliothèque patrons</h3>
              <p className="text-base text-gray-700">PDF · Notes · Liens <span className="text-sm">(Pro)</span></p>
            </div>

            <div className="bg-white border-l-4 border-indigo-400 p-6 rounded-lg">
              <h3 className="text-base font-bold text-gray-900 mb-2">✓ IA Photo Studio</h3>
              <p className="text-base text-gray-700">9 styles pro · Photos Instagram/Etsy</p>
            </div>
          </div>
        </div>

        {/* Une app créée par une crocheteuse */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">🧵 Une app créée par une crocheteuse</h2>

          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-8 rounded-lg">
            <p className="text-lg text-gray-800 mb-6 font-bold">
              YarnFlow n'est pas une app "générique" développée par une équipe qui ne sait pas ce qu'est une bride ou un jeté.
            </p>

            <p className="text-base text-gray-700 mb-6 leading-relaxed">
              Elle est née dans mon salon, entre deux pelotes, après un rang oublié de trop, un patron introuvable, et une photo qui ne rendait jamais la qualité du fil.
            </p>

            <p className="text-base text-gray-700 mb-6 leading-relaxed">
              Je m'appelle <strong>Nathalie</strong>, crocheteuse passionnée et développeuse. Je cherchais une app simple et moderne. Comme elle n'existait pas…
              <span className="font-bold text-indigo-700 text-lg block mt-2">➡️ Je l'ai créée.</span>
            </p>

            <div className="bg-white border-l-4 border-indigo-400 p-6 rounded-lg">
              <p className="text-base text-gray-800 leading-relaxed italic">
                YarnFlow comprend vraiment vos besoins : c'est une app conçue de l'intérieur, par quelqu'un qui vit les mêmes frustrations et les mêmes petits bonheurs que vous.
              </p>
            </div>
          </div>
        </div>

        {/* Témoignages */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">💬 Ce qu'en disent vos futur·es pairs</h2>

          <div className="space-y-6">
            <div className="bg-purple-50 border-l-4 border-purple-400 p-6 rounded-lg">
              <p className="font-bold text-gray-900 mb-2 text-base">Claire M. – Tricot</p>
              <p className="text-base text-gray-800 italic leading-relaxed">"Enfin une app qui comprend le tricot. Le compteur est un bonheur."</p>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-6 rounded-lg">
              <p className="font-bold text-gray-900 mb-2 text-base">Julien L. – Crochet</p>
              <p className="text-base text-gray-800 italic leading-relaxed">"J'ai tout au même endroit. Je n'utilise plus rien d'autre."</p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
              <p className="font-bold text-gray-900 mb-2 text-base">Élodie P. – Etsy</p>
              <p className="text-base text-gray-800 italic leading-relaxed">"L'IA améliore juste la photo. Pas l'ouvrage. Exactement ce qu'il faut."</p>
            </div>
          </div>
        </div>

        {/* Tarifs */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">💰 Tarifs</h2>
          <p className="text-base text-gray-700 mb-8">Choisissez la formule qui vous convient</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* FREE */}
            <div className="bg-gray-100 border-2 border-gray-300 p-6 rounded-lg min-h-[520px] flex flex-col">
              <h3 className="text-xl font-bold text-gray-800 mb-2">🧶 FREE</h3>
              <p className="text-3xl font-black text-gray-900 mb-6">0€<span className="text-base text-gray-600">/mois</span></p>

              <ul className="space-y-3 mb-6 text-base text-gray-700 flex-grow">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>3 projets actifs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>3 photos IA / mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Stats basiques</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span>Sync limitée</span>
                </li>
              </ul>

              <p className="text-sm text-gray-600 italic mt-auto">Pour découvrir l'app</p>
            </div>

            {/* PRO - Le + populaire */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-purple-400 p-6 rounded-lg relative shadow-xl transform hover:scale-105 transition min-h-[520px] flex flex-col">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-400 text-gray-900 px-4 py-1 font-bold text-sm border-2 border-gray-900 rounded-full shadow-md">
                ⭐ LE + POPULAIRE
              </div>

              <h3 className="text-xl font-bold text-white mb-2 mt-2">🌟 PRO</h3>
              <p className="text-3xl font-black text-white mb-6">4,99€<span className="text-base text-indigo-100">/mois</span></p>

              <ul className="space-y-3 mb-6 text-base text-white flex-grow">
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">Projets illimités</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">30 photos IA / mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">9 styles pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">Stats avancées</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">Bibliothèque patrons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">Multi-upload</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">✓</span>
                  <span className="font-bold">Sync illimitée</span>
                </li>
              </ul>

              <p className="text-sm text-indigo-100 italic mt-auto">Le choix des passionné·es</p>
            </div>

            {/* PRO ANNUEL */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border-2 border-purple-400 p-6 rounded-lg shadow-lg min-h-[520px] flex flex-col">
              <h3 className="text-xl font-bold text-purple-900 mb-2">🏆 PRO ANNUEL</h3>
              <p className="text-3xl font-black text-purple-900 mb-2">39,99€<span className="text-base text-purple-700">/an</span></p>
              <p className="text-sm text-purple-700 mb-6">~3,33€/mois</p>

              <ul className="space-y-3 mb-6 text-base text-purple-900 flex-grow">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">Accès PRO complet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">2 mois offerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">50 crédits IA bonus</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">Badge annuel</span>
                </li>
              </ul>

              <div className="bg-purple-200 border-l-4 border-purple-600 p-4 rounded-lg mt-auto">
                <p className="text-sm text-purple-900 font-bold">💰 Économisez 20€/an</p>
              </div>
            </div>

            {/* EARLY BIRD */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500 p-6 rounded-lg shadow-lg relative overflow-hidden min-h-[520px] flex flex-col">
              <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 font-bold text-xs transform rotate-12 translate-x-2 -translate-y-1 shadow-md">
                🔥 LIMITÉ
              </div>

              <h3 className="text-xl font-bold text-red-900 mb-2">🔥 EARLY BIRD</h3>
              <p className="text-3xl font-black text-red-900 mb-2">2,99€<span className="text-base text-red-700">/mois</span></p>
              <p className="text-sm text-red-700 mb-6">pendant 12 mois</p>

              <ul className="space-y-3 mb-6 text-base text-red-900 flex-grow">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">Accès PRO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">Prix bloqué 12 mois</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="font-bold">Places limitées</span>
                </li>
              </ul>

              <div className="bg-red-200 border-l-4 border-red-600 p-4 rounded-lg mb-4">
                <p className="text-sm text-red-900 font-bold">⚡ Offre de lancement exclusive</p>
              </div>

              <p className="text-sm text-red-800 italic mt-auto">Puis 4,99€/mois ensuite</p>
            </div>
          </div>

          {/* Packs IA */}
          <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 p-8 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🎁 Packs IA à la carte</h3>
            <p className="text-base text-gray-700 mb-6">Besoin de plus de crédits photos IA ? Achetez des packs flexibles.</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-indigo-400 p-6 rounded-lg">
                <p className="text-lg font-bold text-gray-900 mb-2">Pack 50 crédits → 4,99€</p>
                <p className="text-sm text-gray-600">Soit ~0,10€ / photo</p>
              </div>
              <div className="bg-white border-2 border-purple-400 p-6 rounded-lg">
                <p className="text-lg font-bold text-gray-900 mb-2">Pack 150 crédits → 9,99€</p>
                <p className="text-sm text-gray-600">Soit ~0,067€ / photo · Meilleur prix</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 mb-8 border-b-2 border-indigo-200 pb-2 inline-block">❓ Questions fréquentes</h2>

          <div className="space-y-6">
            <details className="bg-white border-l-4 border-indigo-500 p-6 rounded-lg group" aria-label="Question sur la modification des ouvrages par l'IA">
              <summary className="font-bold text-gray-900 text-base cursor-pointer list-none flex items-center justify-between" role="button" aria-expanded="false">
                L'IA modifie-t-elle mes ouvrages ?
                <span className="text-indigo-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
              </summary>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                Non, absolument pas. L'IA améliore uniquement la qualité visuelle de vos photos (éclairage, fond, netteté). Votre ouvrage reste exactement le même, on révèle juste sa vraie beauté.
              </p>
            </details>

            <details className="bg-white border-l-4 border-green-500 p-6 rounded-lg group" aria-label="Question sur l'annulation de l'abonnement">
              <summary className="font-bold text-gray-900 text-base cursor-pointer list-none flex items-center justify-between" role="button" aria-expanded="false">
                Puis-je annuler quand je veux ?
                <span className="text-green-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
              </summary>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                Oui, sans aucun engagement. Vous pouvez annuler votre abonnement en 1 clic depuis votre compte, à tout moment. Aucune pénalité, aucune question posée.
              </p>
            </details>

            <details className="bg-white border-l-4 border-purple-500 p-6 rounded-lg group" aria-label="Question sur la sauvegarde des données">
              <summary className="font-bold text-gray-900 text-base cursor-pointer list-none flex items-center justify-between" role="button" aria-expanded="false">
                Mes données sont-elles sauvegardées ?
                <span className="text-purple-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
              </summary>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                Oui, toutes vos données sont sauvegardées de manière sécurisée dans le cloud. Vous pouvez accéder à vos projets, patrons et photos depuis n'importe quel appareil, à tout moment.
              </p>
            </details>

            <details className="bg-white border-l-4 border-red-500 p-6 rounded-lg group" aria-label="Question sur l'offre Early Bird limitée">
              <summary className="font-bold text-gray-900 text-base cursor-pointer list-none flex items-center justify-between" role="button" aria-expanded="false">
                L'offre Early Bird est-elle vraiment limitée ?
                <span className="text-red-500 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
              </summary>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                Oui, seulement 200 places au total. Vous bénéficiez de 2,99€/mois pendant 12 mois (au lieu de 4,99€), avec un accès PRO complet. Après, vous passez automatiquement à 4,99€/mois, ou vous pouvez annuler à tout moment. Une fois les 200 places épuisées, l'offre disparaît définitivement.
              </p>
            </details>

            <details className="bg-white border-l-4 border-indigo-400 p-6 rounded-lg group" aria-label="Question sur la disponibilité de la beta">
              <summary className="font-bold text-gray-900 text-base cursor-pointer list-none flex items-center justify-between" role="button" aria-expanded="false">
                Quand la beta sera-t-elle disponible ?
                <span className="text-indigo-400 group-open:rotate-180 transition-transform" aria-hidden="true">▼</span>
              </summary>
              <p className="text-base text-gray-700 mt-4 leading-relaxed">
                Très bientôt ! On finalise les derniers détails. Tous les inscrits waitlist seront prévenus par email dès l'ouverture de la beta privée. Vous aurez un accès prioritaire.
              </p>
            </details>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-indigo-500 text-white border-2 border-indigo-400 p-12 rounded-lg">
          <h2 className="text-3xl font-black mb-6">🚀 Rejoindre l'aventure</h2>
          <p className="text-lg mb-12 font-bold">Accès anticipé + prix Early Bird garanti</p>

          {!success && (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="inline-block bg-white text-indigo-600 px-10 py-5 font-bold text-lg hover:bg-purple-50 focus:outline-none focus:ring-4 focus:ring-white transition border-b-4 border-indigo-700 active:border-b-0 active:mt-0.5 rounded-lg"
              >
                👉 Je rejoins la waitlist
              </a>
              <p className="text-sm mt-6 text-indigo-100">Aucun engagement — retrait en 1 clic</p>
            </>
          )}
        </div>
      </section>

      {/* Social Proof Notification */}
      {showNotification && (
        <div className="fixed bottom-6 left-6 z-50 animate-slide-up">
          <div className="bg-white border-2 border-indigo-300 rounded-lg shadow-2xl px-6 py-4 max-w-sm">
            <p className="text-base text-gray-800 font-bold">{currentNotification}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-indigo-400 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-purple-400 border-2 border-white"></div>
                <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white"></div>
              </div>
              <p className="text-sm text-gray-600">{subscribersCount + 45} personnes inscrites</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t-4 border-indigo-300">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🧶</span>
                <span className="text-xl font-black">YarnFlow</span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-3">
                L'app tout-en-un pour tricot & crochet.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed italic">
                Créée par une crocheteuse. Construite avec amour (et un peu de code).
              </p>
            </div>

            <div>
              <h3 className="font-black mb-4 text-lg">Liens rapides</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#waitlist" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-indigo-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 rounded">Rejoindre la waitlist</a></li>
                <li><a href="mailto:contact@yarnflow.fr" className="hover:text-indigo-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 rounded">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-black mb-4 text-lg">Suivez-nous</h3>
              <p className="text-gray-300 mb-3">Instagram & Pinterest</p>
              <div className="flex gap-4">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/yarnflowapp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition"
                  aria-label="Instagram"
                  onClick={() => trackOutboundLink('https://www.instagram.com/yarnflowapp/', 'Instagram')}
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* Pinterest */}
                <a
                  href="https://pin.it/1aJ2uIpdY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition"
                  aria-label="Pinterest"
                  onClick={() => trackOutboundLink('https://pin.it/1aJ2uIpdY', 'Pinterest')}
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
            <p className="mb-3 font-bold">&copy; 2025 YarnFlow. Tous droits réservés.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link to="/privacy" className="hover:text-indigo-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Politique de confidentialité</Link>
              <span>·</span>
              <Link to="/cgu" className="hover:text-indigo-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Conditions d'utilisation</Link>
              <span>·</span>
              <Link to="/mentions" className="hover:text-indigo-300 transition font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
