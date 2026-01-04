/**
 * @file Landing.jsx
 * @brief Landing page épurée et personnelle pour YarnFlow
 * @author Nathalie
 * @version 2.0.0 - Page de lancement officiel
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAnalytics, useScrollTracking } from '../hooks/useAnalytics'

const Landing = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' ou 'annual'

  // Analytics
  const { trackPageView, trackSubscriptionClick, trackBillingPeriodChange } = useAnalytics()
  useScrollTracking()

  useEffect(() => {
    trackPageView('Landing Page - Launch', '/')
  }, [])

  return (
    <div className="min-h-screen bg-white relative">
      {/* Boutons connexion/inscription (en haut à droite) */}
      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <Link
          to="/contact"
          className="px-4 py-2 bg-white text-gray-700 hover:text-primary-600 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Contact
        </Link>
        <Link
          to="/login"
          className="px-4 py-2 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition shadow-sm"
        >
          Connexion
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm"
        >
          Créer un compte
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-16 text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold text-primary-600 mb-6">
          YarnFlow
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-6 leading-relaxed">
          Salut, je suis <strong className="text-primary-700">Nathalie</strong>, crocheteuse et développeuse.
        </p>
        <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto mb-10 leading-relaxed">
          J'ai créé YarnFlow parce que je voulais enfin un outil simple pour compter mes rangs, organiser mes patrons, et sublimer mes photos.
        </p>

        {/* CTA Principal */}
        <div className="mb-12">
          <Link
            to="/register"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold text-xl px-12 py-5 rounded-full shadow-lg transition transform hover:scale-105"
          >
            Commencer gratuitement
          </Link>
          <p className="text-sm text-gray-600 mt-3">Aucune carte bancaire requise</p>
        </div>

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

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8">
          {/* Plan FREE */}
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-8 text-left">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">FREE</h3>
            <p className="text-3xl font-bold text-primary-600 mb-1">0€</p>
            <p className="text-sm text-gray-600 mb-6">Gratuit pour toujours</p>

            <ul className="space-y-3 mb-8 min-h-[240px]">
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">3 projets actifs</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Patrons illimités</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Compteur de rangs</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Organisation simplifiée</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">5 crédits photos/mois</span>
              </li>
            </ul>

            <Link
              to="/register"
              className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* Plan PLUS */}
          <div className="bg-white border-2 border-primary-500 rounded-2xl p-8 text-left shadow-xl relative transform md:scale-105">
            <div className="absolute top-3 right-3 bg-warm-400 text-primary-900 text-xs font-bold px-3 py-1 rounded-full">
              POPULAIRE
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PLUS</h3>
            {billingPeriod === 'monthly' ? (
              <>
                <p className="text-3xl font-bold text-primary-600 mb-1">2,99€<span className="text-lg font-normal">/mois</span></p>
                <p className="text-sm text-gray-600 mb-6">Parfait pour la plupart des créateurs</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-primary-600 mb-1">29,99€<span className="text-lg font-normal">/an</span></p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="line-through opacity-60">35,88€</span> <span className="font-semibold text-green-600">-15%</span>
                </p>
                <p className="text-xs text-gray-600 mb-6">soit 2,49€/mois</p>
              </>
            )}

            <ul className="space-y-3 mb-8 min-h-[240px]">
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">7 projets actifs</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Patrons illimités</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Compteur de rangs</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Organisation premium</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">15 crédits photos/mois</span>
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
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-8 text-left">
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

            <ul className="space-y-3 mb-8 min-h-[240px]">
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Projets illimités</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Patrons illimités</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Compteur de rangs</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">Organisation premium</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700">30 crédits photos/mois</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700 font-semibold">Support prioritaire</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-3">✓</span>
                <span className="text-gray-700 font-semibold">Accès premium aux nouveautés</span>
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
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center text-primary-700 mb-4">Tout ce dont vous avez besoin</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
          {/* Feature 1 */}
          <div className="bg-gray-50 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-3">🧵</div>
            <h3 className="text-xl font-bold text-primary-700 mb-3">Compteur de rangs intelligent</h3>
            <p className="text-gray-600">Plus jamais perdu : plusieurs projets à la fois, timer automatique, progression en temps réel.</p>
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
            <p className="text-gray-600">Oui ! Le plan FREE est totalement gratuit et sans limite de temps. Vous avez accès aux fonctionnalités essentielles (3 projets actifs, compteur de rangs, 5 crédits photos/mois) sans jamais payer. Les plans PLUS (2,99€/mois) et PRO (4,99€/mois) débloquent des fonctionnalités avancées.</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Ça marche sur quels appareils ?</h3>
            <p className="text-gray-600">Sur tous les navigateurs (mobile, tablette, ordinateur). YarnFlow est une PWA installable : vous pouvez l'ajouter à votre écran d'accueil et l'utiliser comme une vraie app, même hors ligne pour certaines fonctionnalités.</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Puis-je changer de plan plus tard ?</h3>
            <p className="text-gray-600">Absolument ! Vous pouvez passer du plan FREE au plan PLUS ou PRO à tout moment, ou changer entre PLUS et PRO selon vos besoins. Aucun engagement, vous pouvez résilier quand vous voulez.</p>
          </div>

          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Mes données sont-elles sécurisées ?</h3>
            <p className="text-gray-600">Oui, toutes vos données sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers. Vous pouvez exporter ou supprimer vos données à tout moment.</p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à simplifier votre tricot/crochet ?</h2>
          <p className="text-xl mb-8 text-primary-100">Rejoignez la communauté YarnFlow dès aujourd'hui</p>
          <Link
            to="/register"
            className="inline-block bg-white hover:bg-gray-100 text-primary-600 font-bold text-xl px-12 py-5 rounded-full shadow-lg transition transform hover:scale-105"
          >
            Créer mon compte gratuit
          </Link>
          <p className="text-sm text-primary-100 mt-4">Déjà inscrit ? <Link to="/login" className="underline hover:text-white">Connectez-vous ici</Link></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="mb-4">© 2025 YarnFlow — Tous droits réservés</p>
          <p className="text-sm text-gray-400">
            <Link to="/privacy" className="hover:text-primary-300 transition">Politique de confidentialité</Link>
            {' · '}
            <Link to="/cgu" className="hover:text-primary-300 transition">Conditions d'utilisation</Link>
            {' · '}
            <Link to="/mentions" className="hover:text-primary-300 transition">Mentions légales</Link>
            {' · '}
            <Link to="/contact" className="hover:text-primary-300 transition">Contact</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
