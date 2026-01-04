/**
 * @file Landing.jsx
 * @brief Landing page personnelle YarnFlow v3.0
 * @author Nathalie
 * @version 3.0.0 - Ton personnel et chaleureux
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalytics, useScrollTracking } from '../hooks/useAnalytics'

const Landing = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [openFAQ, setOpenFAQ] = useState(null)

  const { trackPageView, trackSubscriptionClick, trackBillingPeriodChange } = useAnalytics()
  useScrollTracking()

  useEffect(() => {
    trackPageView('Landing Page - v3', '/')
  }, [])

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧶</span>
            <span className="font-bold text-xl text-gray-900">YarnFlow</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary-600 font-medium transition"
            >
              Contact
            </Link>
            <Link
              to="/login"
              className="text-gray-700 hover:text-primary-600 font-medium transition"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Section Héros */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Simplifiez votre tricot & crochet
        </h1>

        <p className="text-xl text-gray-700 mb-4 leading-relaxed max-w-3xl mx-auto">
          Salut, je suis <strong>Nathalie</strong>, crocheteuse et développeuse.
        </p>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
          J'ai créé YarnFlow pour vous offrir un outil simple et malin qui vous aide à
          compter vos rangs, organiser vos patrons, et sublimer vos photos.
        </p>

        <Link
          to="/register"
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transition shadow-lg hover:shadow-xl"
        >
          Commencez gratuitement
        </Link>

        <p className="text-sm text-gray-500 mt-3">
          Aucune carte bancaire requise
        </p>
      </section>

      {/* Section Fonctionnalités clés */}
      <section className="bg-warm-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ce que YarnFlow fait pour vous
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Compteur de rangs */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">🧵</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Compteur de rangs intelligent
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Plus jamais perdu·e : gérez plusieurs projets simultanément, timer automatique,
                progression en temps réel.
              </p>
            </div>

            {/* Bibliothèque */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Tous vos patrons au même endroit
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Importez vos PDF, ajoutez des liens, organisez facilement votre bibliothèque.
              </p>
            </div>

            {/* Photos IA */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Des photos qui mettent en valeur vos créations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Amélioration automatique de VOS photos (éclairage, fond, couleurs) —
                votre ouvrage reste inchangé.
              </p>
            </div>

            {/* Statistiques */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Suivi de progression
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Votre vitesse, votre historique, vos statistiques… sans aucune saisie manuelle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Pricing */}
      <section className="py-16" id="pricing">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Quand payez-vous ?
          </h2>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Commencez gratuitement, payez seulement si vous en avez besoin
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={() => {
                setBillingPeriod('monthly')
                trackBillingPeriodChange('monthly')
              }}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => {
                setBillingPeriod('annual')
                trackBillingPeriodChange('annual')
              }}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingPeriod === 'annual'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annuel
            </button>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Plan FREE */}
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">FREE</h3>
              <p className="text-3xl font-bold text-primary-600 mb-1">0€</p>
              <p className="text-sm text-gray-600 mb-6">Gratuit pour toujours</p>

              <div className="mb-6 p-4 bg-warm-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">Quand payez-vous ?</p>
                <p className="text-sm text-gray-700">
                  <strong>Jamais</strong>, gratuit pour toujours
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">3 projets actifs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">5 crédits photos/mois</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Compteur de rangs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Patrons illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Favoris ⭐</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 font-bold mr-3">✗</span>
                  <span className="text-gray-400">Tags personnalisés</span>
                </li>
              </ul>

              <Link
                to="/register"
                className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Plan PLUS */}
            <div className="bg-white border-2 border-primary-600 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                POPULAIRE
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">PLUS</h3>
              {billingPeriod === 'monthly' ? (
                <>
                  <p className="text-3xl font-bold text-primary-600 mb-1">2,99€<span className="text-lg font-normal">/mois</span></p>
                  <p className="text-sm text-gray-600 mb-6">Pour les passionné·es</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary-600 mb-1">29,99€<span className="text-lg font-normal">/an</span></p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="line-through opacity-60">35,88€</span> <span className="font-semibold text-green-600">-15%</span>
                  </p>
                  <p className="text-xs text-gray-600 mb-6">soit 2,50€/mois</p>
                </>
              )}

              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">Quand payez-vous ?</p>
                <p className="text-sm text-gray-700">
                  Après avoir utilisé <strong>3 projets actifs</strong> ou <strong>5 crédits photos/mois</strong>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>7 projets actifs</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>15 crédits photos/mois</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Compteur de rangs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Patrons illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Tags personnalisés ✅</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Filtrage multi-tags</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Support prioritaire</span>
                </li>
              </ul>

              <Link
                to="/register"
                onClick={() => trackSubscriptionClick('plus', billingPeriod, 'landing')}
                className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition"
              >
                Choisir PLUS
              </Link>
            </div>

            {/* Plan PRO */}
            <div className="bg-white border-2 border-gray-300 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">PRO</h3>
              {billingPeriod === 'monthly' ? (
                <>
                  <p className="text-3xl font-bold text-primary-600 mb-1">4,99€<span className="text-lg font-normal">/mois</span></p>
                  <p className="text-sm text-gray-600 mb-6">Pour les power users</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary-600 mb-1">49,99€<span className="text-lg font-normal">/an</span></p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="line-through opacity-60">59,88€</span> <span className="font-semibold text-green-600">-17%</span>
                  </p>
                  <p className="text-xs text-gray-600 mb-6">soit 4,16€/mois</p>
                </>
              )}

              <div className="mb-6 p-4 bg-warm-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 mb-1">Quand payez-vous ?</p>
                <p className="text-sm text-gray-700">
                  Après avoir utilisé <strong>7 projets actifs</strong> ou <strong>15 crédits photos/mois</strong>
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Projets illimités ∞</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>30 crédits photos/mois</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Compteur de rangs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Patrons illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Tags personnalisés ✅</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Filtrage multi-tags</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700">Support prioritaire</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700 font-semibold">Nouveautés en avant-première 🚀</span>
                </li>
              </ul>

              <Link
                to="/register"
                onClick={() => trackSubscriptionClick('pro', billingPeriod, 'landing')}
                className="block w-full text-center bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition"
              >
                Choisir PRO
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="bg-warm-50 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleFAQ(0)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900">C'est vraiment gratuit ?</span>
                <span className="text-2xl text-primary-600">{openFAQ === 0 ? '−' : '+'}</span>
              </button>
              {openFAQ === 0 && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  Oui, le plan FREE est gratuit pour toujours, sans limite de temps.
                  Vous pouvez utiliser les fonctionnalités essentielles (3 projets actifs,
                  compteur de rangs, 5 crédits photos/mois) sans jamais payer. Le passage
                  aux plans PLUS ou PRO se fait seulement après usage avancé.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleFAQ(1)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900">Ça marche sur quels appareils ?</span>
                <span className="text-2xl text-primary-600">{openFAQ === 1 ? '−' : '+'}</span>
              </button>
              {openFAQ === 1 && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  YarnFlow est accessible sur tous les navigateurs (mobile, tablette, ordinateur)
                  et fonctionne aussi hors ligne grâce à sa technologie PWA. Vous pouvez même
                  installer l'application sur votre téléphone comme une vraie app !
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleFAQ(2)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900">Puis-je changer de plan plus tard ?</span>
                <span className="text-2xl text-primary-600">{openFAQ === 2 ? '−' : '+'}</span>
              </button>
              {openFAQ === 2 && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  Bien sûr ! Passez facilement du plan FREE au plan PLUS ou PRO selon vos besoins,
                  sans engagement ni frais cachés. Vous pouvez aussi revenir au plan gratuit
                  à tout moment.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleFAQ(3)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-900">Mes données sont-elles sécurisées ?</span>
                <span className="text-2xl text-primary-600">{openFAQ === 3 ? '−' : '+'}</span>
              </button>
              {openFAQ === 3 && (
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  Oui, vos données sont stockées en toute sécurité, ne sont jamais partagées
                  et vous pouvez les exporter ou supprimer à tout moment. Votre vie privée
                  est notre priorité.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Appel à l'action final */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt·e à simplifier votre tricot et crochet ?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Rejoignez la communauté YarnFlow dès aujourd'hui, créez votre compte gratuitement
            et commencez à profiter d'un suivi intelligent et d'une organisation simplifiée.
          </p>

          <Link
            to="/register"
            className="inline-block bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-lg font-semibold transition shadow-lg"
          >
            Créer mon compte gratuit
          </Link>

          <p className="mt-6 text-sm opacity-75">
            Déjà inscrit·e ? <Link to="/login" className="underline hover:no-underline font-medium">Connectez-vous ici</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🧶</span>
                <span className="font-bold text-xl text-white">YarnFlow</span>
              </div>
              <p className="text-sm">
                L'outil malin pour tricoteur·ses et crocheteur·ses
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Légal</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition">Politique de confidentialité</Link></li>
                <li><Link to="/cgu" className="hover:text-white transition">Conditions d'utilisation</Link></li>
                <li><Link to="/mentions-legales" className="hover:text-white transition">Mentions légales</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-white transition">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">YarnFlow</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="hover:text-white transition">Créer un compte</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Connexion</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 YarnFlow — Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
