/**
 * @file Landing.jsx
 * @brief Landing page publique pour la waitlist YarnFlow
 * @author YarnFlow Team + AI Assistants
 * @created 2025-11-20
 * @version 0.13.0 - Minimal & Clean
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

  const totalSubscribers = 45 + subscribersCount

  return (
    <div className="min-h-screen bg-white">
      {/* Header simple */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🧶</span>
            <span className="text-xl font-bold text-gray-900">YarnFlow</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            L'app qui simplifie le tricot & crochet<br />
            <span className="text-purple-600">— et sublime vos créations.</span>
          </h1>

          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Trackez vos projets, progressez sans stress, transformez vos photos avec l'IA.
          </p>

          <p className="text-lg text-gray-700 mb-8">
            Déjà <strong className="text-purple-600">{totalSubscribers}</strong> passionné·es sur la waitlist ❤️
          </p>

          <div className="inline-flex flex-col gap-2 bg-purple-50 border-2 border-purple-200 rounded-xl px-6 py-4 mb-8">
            <p className="text-purple-900 font-bold">🚀 Beta fermée — lancement public bientôt</p>
            <p className="text-purple-700 text-sm">🎁 Offre Early Bird réservée aux inscrits</p>
          </div>
        </div>

        {/* Formulaire */}
        {!success ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-16">
            <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre prénom (optionnel)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {loading ? 'Inscription...' : '👉 Je rejoins la waitlist'}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Sans engagement · Notification prioritaire · Offre exclusive
              </p>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center mb-16">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Bienvenue dans l'aventure !
            </h3>
            <p className="text-green-700">
              Vous êtes inscrit·e à la waitlist YarnFlow.<br />
              On vous tient au courant très bientôt ! 💌
            </p>
          </div>
        )}

        {/* Pourquoi YarnFlow */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">💡 Pourquoi YarnFlow ?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Parce que vous méritez mieux que des post-its, des notes éparpillées et des photos ternes.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <h3 className="font-bold text-red-900 text-lg mb-3">Sans YarnFlow → chaos</h3>
              <p className="text-red-700 text-sm leading-relaxed">
                Rangs oubliés · patrons dispersés · photos ratées · progression impossible à suivre
              </p>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-green-900 text-lg mb-3">Avec YarnFlow → fluidité</h3>
              <ul className="text-green-700 text-sm space-y-1">
                <li>✓ Compteur intelligent</li>
                <li>✓ Stats temps réel</li>
                <li>✓ Bibliothèque patrons</li>
                <li>✓ AI Photo Studio</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ce que vous allez pouvoir faire */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">✨ Ce que vous allez pouvoir faire</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">🧶 Compter vos rangs intelligemment</h3>
              <p className="text-gray-600">Multi-sections · timer automatique · sauvegarde cloud</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">📚 Gérer vos patrons facilement</h3>
              <p className="text-gray-600">Tous vos PDF centralisés et liés à vos projets (Pro)</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">📸 Sublimer vos photos en un clic</h3>
              <p className="text-gray-600">9 styles professionnels · jusqu'à 5 photos à la fois</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Suivre votre progression</h3>
              <p className="text-gray-600">Rangs/heure · vitesse · historique · graphiques en temps réel</p>
            </div>
          </div>
        </div>

        {/* Témoignages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">💬 Ils testent déjà YarnFlow</h2>

          <div className="space-y-6">
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <p className="font-bold text-gray-900 mb-1">Claire M. – Tricot</p>
              <p className="text-gray-700 italic">"Enfin une app qui comprend le tricot. Le compteur est un bonheur."</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <p className="font-bold text-gray-900 mb-1">Julien L. – Crochet</p>
              <p className="text-gray-700 italic">"J'ai tout au même endroit. Je n'utilise plus rien d'autre."</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <p className="font-bold text-gray-900 mb-1">Élodie P. – Etsy</p>
              <p className="text-gray-700 italic">"L'IA améliore juste la photo. Pas l'ouvrage. Exactement ce qu'il faut."</p>
            </div>
          </div>
        </div>

        {/* Offre Early Bird */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🔥 Offre de lancement (waitlist uniquement)</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🥇</span>
                <div>
                  <p className="font-bold text-gray-900">Places 1-100 : 2,99€/mois pendant 12 mois</p>
                  <p className="text-gray-600 text-sm">(puis 4,99€/mois) — Accès PRO complet</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">🥈</span>
                <div>
                  <p className="font-bold text-gray-900">Places 101-200 : 10 crédits IA offerts</p>
                  <p className="text-gray-600 text-sm">+ Badge Membre Fondateur</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 border-t-2 border-orange-200 pt-4">
              Réservé aux inscrits waitlist. <strong>200 places au total.</strong>
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">🔧 Pricing</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* FREE */}
            <div className="border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">FREE</h3>
              <p className="text-gray-600 mb-4">Pour tester</p>
              <p className="text-3xl font-bold text-gray-900 mb-6">0€</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ 3 projets actifs</li>
                <li>✓ 5 photos IA/mois</li>
                <li>✓ Compteur & stats de base</li>
              </ul>
            </div>

            {/* PRO */}
            <div className="border-2 border-purple-500 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  Recommandé
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">PRO</h3>
              <p className="text-gray-600 mb-4">Pour les passionné·es</p>
              <p className="text-3xl font-bold text-purple-600 mb-6">4,99€<span className="text-lg text-gray-600">/mois</span></p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Projets illimités</li>
                <li>✓ 75 photos IA/mois</li>
                <li>✓ 9 styles photo pro</li>
                <li>✓ Stats avancées</li>
                <li>✓ Bibliothèque patrons</li>
                <li>✓ Support prioritaire</li>
              </ul>
            </div>
          </div>

          {/* PRO ANNUEL */}
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">PRO ANNUEL</h3>
                <p className="text-gray-600 text-sm">2 mois offerts · Meilleur prix</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">39,99€<span className="text-lg text-gray-600">/an</span></p>
                <p className="text-sm text-gray-500">soit 3,33€/mois</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center bg-purple-600 text-white rounded-xl p-12">
          <h2 className="text-3xl font-bold mb-4">🚀 Prêt·e à rejoindre l'aventure ?</h2>
          <p className="text-xl mb-8 opacity-90">Accès prioritaire + offre Early Bird garantie</p>

          {!success && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
            >
              👉 Je rejoins la waitlist
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🧶</span>
                <span className="text-lg font-bold">YarnFlow</span>
              </div>
              <p className="text-gray-400 text-sm">
                L'app tout-en-un pour tricot & crochet avec AI Photo Studio.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Liens rapides</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#waitlist" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-white transition">Rejoindre la waitlist</a></li>
                <li><a href="mailto:yarnflowapp@gmail.com" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Suivez-nous</h3>
              <div className="flex gap-4 text-xl">
                <a href="#" className="hover:text-purple-400 transition" aria-label="Instagram">📷</a>
                <a href="#" className="hover:text-pink-400 transition" aria-label="Pinterest">📌</a>
                <a href="#" className="hover:text-purple-400 transition" aria-label="TikTok">🎵</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p className="mb-3">&copy; 2025 YarnFlow. Tous droits réservés.</p>
            <div className="space-x-4">
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
