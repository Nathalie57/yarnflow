/**
 * @file Landing.jsx
 * @brief Landing page publique pour la waitlist YarnFlow
 * @author YarnFlow Team + AI Assistants
 * @created 2025-11-20
 * @version 0.12.0
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const Landing = () => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [subscribersCount, setSubscribersCount] = useState(0)

  // Charger le nombre d'inscrits
  useEffect(() => {
    fetchSubscribersCount()
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
      setEmail('')
      setName('')
      fetchSubscribersCount()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🧶</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                YarnFlow
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          {/* Badge "Beta fermée" */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
            </span>
            Beta fermée en cours • Lancement public bientôt
          </div>

          {/* Titre principal */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Trackez, progressez, partagez</span> vos créations tricot & crochet
          </h1>

          {/* Sous-titre */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Trackez vos projets comme un pro, sublimez vos photos avec l'IA,
            partagez vos créations avec une communauté passionnée.
          </p>

          {/* Compteur d'inscrits */}
          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-4">
              Déjà <span className="font-bold text-purple-600 text-2xl">{112 + subscribersCount}</span> passionné·es sur la liste d'attente ! ❤️
            </p>
          </div>

          {/* Formulaire d'inscription */}
          {!success ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-lg"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre prénom (optionnel)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? 'Inscription...' : '🚀 Rejoindre la waitlist'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  ✅ Soyez parmi les premiers notifiés du lancement<br />
                  🎁 Offre exclusive pour les early birds
                </p>
              </div>
            </form>
          ) : (
            <div className="max-w-md mx-auto bg-green-50 border-2 border-green-200 rounded-2xl p-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                Bienvenue dans l'aventure !
              </h3>
              <p className="text-green-700">
                Vous êtes inscrit·e à la waitlist YarnFlow. On vous tient au courant très bientôt ! 💌
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section Problème */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Vous en avez marre de...
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            YarnFlow résout vos problèmes quotidiens
          </p>

          {/* Tableau Problème → Solution */}
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Header */}
              <div className="bg-red-100 p-4 text-center border-b md:border-b-0 md:border-r border-red-200">
                <h3 className="text-lg font-bold text-red-900">❌ Problème</h3>
              </div>
              <div className="bg-green-100 p-4 text-center border-b md:border-b-0 border-green-200">
                <h3 className="text-lg font-bold text-green-900">✅ Solution YarnFlow</h3>
              </div>

              {/* Ligne 1 */}
              <div className="p-6 bg-red-50 border-b md:border-r border-red-100 flex items-center gap-3">
                <span className="text-3xl">😩</span>
                <div>
                  <p className="font-semibold text-red-900">Perdre le compte de vos rangs</p>
                  <p className="text-sm text-red-700">Recommencer à zéro après interruption</p>
                </div>
              </div>
              <div className="p-6 bg-green-50 border-b border-green-100 flex items-center gap-3">
                <span className="text-3xl">🧶</span>
                <div>
                  <p className="font-semibold text-green-900">Compteur intelligent multi-sections</p>
                  <p className="text-sm text-green-700">Sauvegarde automatique, reprise où vous étiez</p>
                </div>
              </div>

              {/* Ligne 2 */}
              <div className="p-6 bg-red-50 border-b md:border-r border-red-100 flex items-center gap-3">
                <span className="text-3xl">📱</span>
                <div>
                  <p className="font-semibold text-red-900">Jongler entre 10 apps différentes</p>
                  <p className="text-sm text-red-700">Compteur, timer, patrons, notes...</p>
                </div>
              </div>
              <div className="p-6 bg-green-50 border-b border-green-100 flex items-center gap-3">
                <span className="text-3xl">📚</span>
                <div>
                  <p className="font-semibold text-green-900">App tout-en-un centralisée</p>
                  <p className="text-sm text-green-700">Tout au même endroit, sync automatique</p>
                </div>
              </div>

              {/* Ligne 3 */}
              <div className="p-6 bg-red-50 border-b md:border-r border-red-100 flex items-center gap-3">
                <span className="text-3xl">📸</span>
                <div>
                  <p className="font-semibold text-red-900">Photos ternes sur Instagram</p>
                  <p className="text-sm text-red-700">Éclairage raté, rendu amateur</p>
                </div>
              </div>
              <div className="p-6 bg-green-50 border-b border-green-100 flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <div>
                  <p className="font-semibold text-green-900">AI Photo Studio avec 9 styles pro</p>
                  <p className="text-sm text-green-700">Sublimez vos créations en 1 clic</p>
                </div>
              </div>

              {/* Ligne 4 */}
              <div className="p-6 bg-red-50 md:border-r border-red-100 flex items-center gap-3">
                <span className="text-3xl">❓</span>
                <div>
                  <p className="font-semibold text-red-900">Ne jamais connaître votre progression</p>
                  <p className="text-sm text-red-700">Combien de temps ? Quelle vitesse ?</p>
                </div>
              </div>
              <div className="p-6 bg-green-50 flex items-center gap-3">
                <span className="text-3xl">📊</span>
                <div>
                  <p className="font-semibold text-green-900">Stats & graphiques en temps réel</p>
                  <p className="text-sm text-green-700">Rangs/heure, taux complétion, historique</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Solution */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Découvrez YarnFlow
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            L'app tout-en-un qui transforme votre passion en superpouvoir
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '🧶',
                title: 'Compteur intelligent',
                description: 'Multi-sections, timer automatique, sauvegarde cloud instantanée'
              },
              {
                icon: '📚',
                title: 'Bibliothèque de patrons',
                description: 'Tous vos patrons centralisés. Importez et liez-les à vos projets. (Pro)'
              },
              {
                icon: '📸',
                title: 'AI Photo Studio',
                description: '9 styles pro, jusqu\'à 5 photos simultanément, sublimez vos créations'
              },
              {
                icon: '📊',
                title: 'Stats & graphiques',
                description: 'Rangs/heure, temps total, progression, graphiques en temps réel'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Témoignages Beta */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Ce que disent nos beta testeurs
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Actuellement en test avec 50 passionné·es
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Claire M.',
                role: 'Beta testeuse • Tricot',
                text: 'J\'ai enfin un outil qui me comprend ! Le compteur de rangs est hyper intuitif et les photos IA sont vraiment bluffantes.',
                avatar: '👩‍🦰',
                badge: 'Beta'
              },
              {
                name: 'Julien L.',
                role: 'Beta testeur • Crochet',
                text: 'Fini les post-its partout ! YarnFlow centralise tout. Les stats détaillées me motivent vraiment à progresser.',
                avatar: '👨‍🦱',
                badge: 'Beta'
              },
              {
                name: 'Élodie P.',
                role: '120 ventes Etsy cette année',
                text: 'L\'IA rattrape mon éclairage raté et met en valeur mes créations. Mais elle ne triche pas : si ton ouvrage est raté, il restera raté. Elle améliore la photo, pas le tricot. Et c\'est exactement ce que je voulais.',
                avatar: '👩‍🦳',
                badge: 'Beta'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200 relative">
                {/* Badge Beta */}
                <div className="absolute -top-3 -right-3">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {testimonial.badge}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{testimonial.avatar}</span>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-xs text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 italic text-sm">"{testimonial.text}"</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block bg-blue-50 border-2 border-blue-200 rounded-xl px-6 py-3">
              <p className="text-blue-800">
                <span className="font-bold">🔥 La beta est complète</span> — Inscrivez-vous pour le lancement public !
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA intermédiaire */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Convaincu·e ? Rejoignez la waitlist ! 🚀
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Soyez parmi les premiers notifiés et profitez de l'offre Early Bird exclusive
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl transform hover:scale-105"
          >
            Je m'inscris maintenant ⬆️
          </a>
          <p className="mt-4 text-white/80 text-sm">
            ⏰ Offre Early Bird limitée aux inscrits waitlist uniquement
          </p>
        </div>
      </section>

      {/* Section Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Pricing simple, clair, honnête
          </h2>
          <p className="text-xl text-gray-600 text-center mb-8">
            Pas de surprise. Pas d'engagement. Juste ce dont vous avez vraiment besoin.
          </p>

          {/* Bandeau Early Bird */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="inline-block bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                  <span className="text-sm font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    🎁 OFFRE DE LANCEMENT • WAITLIST UNIQUEMENT
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white mb-3 drop-shadow-lg">
                  EARLY BIRD — 2.99€/mois
                </h3>
                <p className="text-white text-lg mb-4 font-semibold">
                  Prix bloqué pendant 12 mois • Puis 4.99€/mois • Accès complet PRO
                </p>
                <p className="text-white/90 text-sm">
                  ⏰ Économisez 24€ la première année • Réservé aux inscrits waitlist
                </p>
              </div>
            </div>
          </div>

          {/* 2 plans principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {[
              {
                name: 'FREE',
                price: '0€',
                period: '',
                subtitle: 'Pour découvrir YarnFlow',
                features: [
                  '3 projets actifs',
                  '5 photos IA/mois',
                  'Tracker & Compteur',
                  'Stats de base'
                ],
                notIncluded: ['Sync cloud', 'Styles IA avancés', 'Stats pro', 'Bibliothèque patrons'],
                popular: false,
                badge: null
              },
              {
                name: 'PRO',
                price: '4.99€',
                period: '/mois',
                subtitle: 'Pour les passionné·es',
                features: [
                  'Projets illimités',
                  '75 photos IA/mois',
                  '9 styles photo pro',
                  'Stats complètes + graphiques',
                  'Bibliothèque de patrons illimitée',
                  'Multi-upload (5 photos)',
                  'Support prioritaire'
                ],
                notIncluded: [],
                popular: true,
                badge: 'Recommandé'
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 shadow-lg ${
                  plan.popular ? 'ring-4 ring-purple-500 relative' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className={`${
                      plan.popular ? 'bg-purple-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    } text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.subtitle}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded && plan.notIncluded.length > 0 && plan.notIncluded.map((feature, i) => (
                    <li key={`not-${i}`} className="flex items-start gap-2 text-sm">
                      <span className="text-red-400 mt-0.5">✗</span>
                      <span className="text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Offre Annuelle */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold">PRO ANNUEL</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      Meilleure offre
                    </span>
                  </div>
                  <p className="text-gray-600">Accès complet PRO • 2 mois offerts • Économisez 20€/an</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-purple-600">39.99€<span className="text-lg text-gray-600">/an</span></div>
                  <p className="text-sm text-gray-500">soit 3.33€/mois</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt·e à révolutionner votre passion ?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Rejoignez la communauté YarnFlow dès aujourd'hui
          </p>

          {!success && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl"
            >
              Je rejoins la waitlist 🚀
            </a>
          )}

          <div className="mt-8 flex items-center justify-center gap-8 text-sm opacity-75">
            <span>✅ Sans engagement</span>
            <span>✅ Notification prioritaire</span>
            <span>✅ Offre exclusive</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🧶</span>
                <span className="text-xl font-bold">YarnFlow</span>
              </div>
              <p className="text-gray-400">
                Trackez, progressez, partagez vos créations tricot & crochet
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Liens rapides</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/login" className="hover:text-white transition">Connexion</Link></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Suivez-nous</h3>
              <div className="flex gap-4 text-2xl">
                <a href="#" className="hover:text-purple-400 transition">📷</a>
                <a href="#" className="hover:text-pink-400 transition">📌</a>
                <a href="#" className="hover:text-purple-400 transition">🎵</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 YarnFlow. Tous droits réservés.</p>
            <div className="mt-2 space-x-4">
              <Link to="/privacy" className="hover:text-white transition">Politique de confidentialité</Link>
              <Link to="/cgu" className="hover:text-white transition">Conditions d'utilisation</Link>
              <Link to="/mentions" className="hover:text-white transition">Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
