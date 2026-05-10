import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [demoCounter, setDemoCounter] = useState(42)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-primary-50 to-primary-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">🧶 YarnFlow</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    to="/my-projects"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Mes projets
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Connexion
                  </Link>
                  {/* [AI:Claude] BETA - Redirection vers login */}
                  <Link
                    to="/login"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Connexion Beta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - DIFFÉRENCIATION VS COMPTE RANGS */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge différenciation */}
          <div className="inline-block bg-gradient-to-r from-primary-100 to-pink-100 text-primary-800 px-6 py-2 rounded-full font-semibold mb-6">
            🧶 De la première maille à tous vos réseaux
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
            Créez, trackez, photographiez,<br />partagez vos ouvrages
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto">
            La plateforme complète : <strong className="text-primary-600">Tracker de projets</strong> + <strong className="text-pink-600">Photos IA pro</strong> + Statistiques
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Suivez vos projets rang par rang avec le compteur intelligent, puis transformez vos ouvrages terminés
            en photos professionnelles prêtes pour Instagram, Etsy ou votre portfolio.
          </p>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {/* [AI:Claude] BETA - Redirection vers login pour non-connectés */}
            <Link
              to={user ? '/my-projects' : '/login'}
              className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all"
            >
              {user ? '🧶 Mes projets' : '🎉 Essayer gratuitement'}
            </Link>
            <a
              href="#features"
              className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 shadow-lg border-2 border-primary-600"
            >
              📊 Découvrir les fonctionnalités
            </a>
          </div>

          {/* Workflow complet en 4 étapes */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Votre parcours créatif de A à Z</h3>
              <p className="text-gray-600">De la première maille à tous vos réseaux</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Étape 1 - Créer */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🧶</span>
                </div>
                <h4 className="font-bold text-lg mb-2">1. Créez</h4>
                <p className="text-sm text-gray-600">
                  Démarrez votre projet tricot ou crochet
                </p>
              </div>

              {/* Étape 2 - Tracker */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all border-2 border-primary-300">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h4 className="font-bold text-lg mb-2">2. Trackez</h4>
                <p className="text-sm text-gray-600">
                  Comptez vos rangs, suivez votre temps, visualisez vos stats
                </p>
              </div>

              {/* Étape 3 - Photographier */}
              <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all border-2 border-pink-300">
                <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📸</span>
                </div>
                <h4 className="font-bold text-lg mb-2">3. Embellissez</h4>
                <p className="text-sm text-gray-600">
                  Transformez votre photo en image pro avec l'IA
                </p>
              </div>

              {/* Étape 4 - Partager */}
              <div className="bg-gradient-to-br from-pink-500 to-primary-500 text-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all">
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✨</span>
                </div>
                <h4 className="font-bold text-lg mb-2">4. Partagez !</h4>
                <p className="text-sm">
                  Instagram, Etsy, Facebook, Pinterest... Brillez partout !
                </p>
              </div>
            </div>

            {/* Avant/Après sous les étapes */}
            <div className="mt-12 bg-white rounded-2xl shadow-2xl p-8">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-2">✨ La magie de l'étape 3</h4>
                <p className="text-gray-600">Votre photo AVANT et APRÈS l'AI Photo Studio</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Avant */}
                <div className="text-center">
                  <div className="bg-gray-100 rounded-lg p-6 mb-3 h-48 flex items-center justify-center border-2 border-gray-300">
                    <div className="text-gray-400">
                      <div className="text-5xl mb-2">📱</div>
                      <p className="font-semibold">Photo smartphone simple</p>
                      <p className="text-sm">Lumière ordinaire, fond neutre</p>
                    </div>
                  </div>
                  <span className="inline-block bg-gray-200 text-gray-700 px-4 py-2 rounded-full font-semibold text-sm">
                    😐 Avant
                  </span>
                </div>

                {/* Après */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-pink-100 to-primary-100 rounded-lg p-6 mb-3 h-48 flex items-center justify-center border-2 border-pink-300 shadow-lg">
                    <div className="text-pink-600">
                      <div className="text-5xl mb-2">✨</div>
                      <p className="font-semibold">Photo IA professionnelle</p>
                      <p className="text-sm">Éclairage parfait, mise en scène lifestyle</p>
                    </div>
                  </div>
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-primary-500 text-white px-4 py-2 rounded-full font-semibold text-sm">
                    🤩 Après IA (5 styles au choix)
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  🎨 5 styles disponibles : Lifestyle • Studio • Scandinave • Nature • Café
                </p>
                {/* [AI:Claude] BETA - Redirection vers login */}
                {!user && (
                  <Link
                    to="/login"
                    className="inline-block bg-gradient-to-r from-primary-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-primary-700 hover:to-pink-700 shadow-lg"
                  >
                    🎉 Commencer gratuitement
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - TRACKER EN PRIORITÉ */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Pourquoi YarnFlow ?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 - TRACKER (suit le workflow) */}
            <div className="bg-primary-50 rounded-xl p-8 border-2 border-primary-200 relative">
              <div className="absolute -top-4 -right-4 bg-primary-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                🥇 ESSENTIEL
              </div>
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-4">Tracker universel</h3>
              <p className="text-gray-700 mb-4">
                Suivez <strong>TOUS</strong> vos projets (YouTube, Pinterest, livres, magazines).
                Ne perdez plus jamais le compte de vos rangs !
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>✅ Compteur géant interactif</li>
                <li>✅ Timer de session automatique</li>
                <li>✅ Historique détaillé avec photos</li>
                <li>✅ Statistiques motivantes</li>
              </ul>
            </div>

            {/* Feature 2 - AI PHOTO STUDIO (différenciateur unique) */}
            <div className="bg-pink-50 rounded-xl p-8 border-2 border-pink-200 relative">
              <div className="absolute -top-4 -right-4 bg-pink-600 text-white px-4 py-2 rounded-full font-bold text-sm">
                ⭐ UNIQUE
              </div>
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-2xl font-bold mb-4">AI Photo Studio</h3>
              <p className="text-gray-700 mb-4">
                Transformez vos photos en images <strong>Instagram-worthy</strong> avec l'IA !
                Parfait pour Etsy, réseaux sociaux, portfolio.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>✅ 5 styles pro (lifestyle, studio...)</li>
                <li>✅ Lumière et composition améliorées</li>
                <li>✅ 5 crédits photos gratuits/mois</li>
                <li>✅ Galerie cloud illimitée</li>
              </ul>
            </div>

            {/* Feature 3 - STATS */}
            <div className="bg-primary-100 rounded-xl p-8 border-2 border-primary-200">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-2xl font-bold mb-4">Statistiques</h3>
              <p className="text-gray-700 mb-4">
                Visualisez vos accomplissements et restez motivé avec des statistiques détaillées de progression.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>✅ Temps total tricot/crochet</li>
                <li>✅ Nombre de rangs/mailles</li>
                <li>✅ Vitesse moyenne (rangs/heure)</li>
                <li>✅ Projets complétés</li>
              </ul>
            </div>

            {/* Feature 4 - GÉNÉRATEUR BETA */}
            <div className="bg-orange-50 rounded-xl p-8 border-2 border-orange-200 relative">
              <div className="absolute -top-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm">
                🧪 BETA
              </div>
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-4">Générateur IA</h3>
              <p className="text-gray-700 mb-4">
                <span className="bg-orange-200 px-2 py-1 rounded text-sm font-semibold">
                  EN BETA
                </span>{' '}
                Créez des patrons tricot/crochet personnalisés avec l'IA. Feature bonus pour les abonnés.
              </p>
              <ul className="text-gray-600 space-y-2 text-sm">
                <li>⚠️ Qualité en cours d'amélioration</li>
                <li>✅ 30+ options de personnalisation</li>
                <li>✅ Export PDF professionnel</li>
                <li>✅ Retours utilisateurs pris en compte</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ce qui rend YarnFlow unique */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              ✨ Ce qui rend YarnFlow unique
            </h2>
            <p className="text-xl text-gray-600">
              Bien plus qu'un simple compteur : votre compagnon créatif complet
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* 1. Tracker universel */}
            <div className="bg-primary-50 rounded-xl p-8 border-2 border-primary-200">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3">Tracker universel</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Compteur de rangs géant interactif</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Timer automatique de sessions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Historique détaillé avec photos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Suivi de TOUS vos projets (YouTube, Pinterest, livres...)</span>
                </li>
              </ul>
            </div>

            {/* 2. Statistiques motivantes */}
            <div className="bg-primary-100 rounded-xl p-8 border-2 border-primary-200">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-xl font-bold mb-3">Stats Strava-style</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Temps total de tricot/crochet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Nombre de rangs et mailles</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Vitesse moyenne (rangs/heure)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Streaks et objectifs motivants</span>
                </li>
              </ul>
            </div>

            {/* 3. AI Photo Studio */}
            <div className="bg-pink-50 rounded-xl p-8 border-2 border-pink-200">
              <div className="text-5xl mb-4">📸</div>
              <h3 className="text-xl font-bold mb-3">AI Photo Studio</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Photos pro pour Instagram & Etsy</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>5 styles premium (lifestyle, studio...)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>5 crédits photos gratuits par mois</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Galerie cloud illimitée</span>
                </li>
              </ul>
            </div>

            {/* 4. Cloud synchronisé */}
            <div className="bg-green-50 rounded-xl p-8 border-2 border-green-200">
              <div className="text-5xl mb-4">☁️</div>
              <h3 className="text-xl font-bold mb-3">Multi-appareils</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Sync automatique dans le cloud</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Accessible sur PC, tablette, mobile</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Vos données toujours sauvegardées</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">✓</span>
                  <span>Accès depuis n'importe où</span>
                </li>
              </ul>
            </div>

            {/* 5. Communauté */}
            <div className="bg-yellow-50 rounded-xl p-8 border-2 border-yellow-200">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-3">Communauté (bientôt)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2 mt-1">🔜</span>
                  <span>Galerie publique des créations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2 mt-1">🔜</span>
                  <span>Partage de projets inspirants</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2 mt-1">🔜</span>
                  <span>Commentaires et encouragements</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-500 mr-2 mt-1">🔜</span>
                  <span>Défis communautaires</span>
                </li>
              </ul>
            </div>

            {/* 6. Générateur IA */}
            <div className="bg-orange-50 rounded-xl p-8 border-2 border-orange-200">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-xl font-bold mb-3">Générateur IA (BETA)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">🧪</span>
                  <span>Patrons personnalisés par IA</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">🧪</span>
                  <span>En cours d'amélioration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">🧪</span>
                  <span>Export PDF professionnel</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">🧪</span>
                  <span>Feature bonus abonnés</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center bg-gradient-to-r from-primary-50 to-pink-50 rounded-2xl p-8 border-2 border-primary-200">
            <h3 className="text-2xl font-bold text-primary-900 mb-4">
              🧶 YarnFlow = Votre workflow complet
            </h3>
            <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
              De la première maille jusqu'au partage sur Instagram, Etsy et Pinterest.
              Tracker, statistiques, photos IA, communauté... Tout ce dont vous avez besoin, en un seul endroit.
            </p>
            {/* [AI:Claude] BETA - Redirection vers login */}
            <Link
              to={user ? '/my-projects' : '/login'}
              className="inline-block bg-gradient-to-r from-primary-600 to-pink-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-primary-700 hover:to-pink-700 shadow-lg"
            >
              {user ? '🧶 Voir mes projets' : '🎉 Commencer gratuitement'}
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Tarifs transparents
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Résiliable à tout moment • Pas de frais cachés
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* FREE */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-2">FREE</h3>
              <div className="text-4xl font-bold mb-6">
                Gratuit
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>3 projets actifs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>5 crédits photos/mois</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Statistiques basiques</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Compteur de rangs</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Timer de session</span>
                </li>
              </ul>
              {/* [AI:Claude] BETA - Redirection vers login */}
              <Link
                to="/login"
                className="block w-full text-center bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* STANDARD */}
            <div className="bg-primary-600 text-white rounded-xl p-8 shadow-2xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full font-bold text-sm">
                ⭐ POPULAIRE
              </div>
              <h3 className="text-2xl font-bold mb-2">PRO</h3>
              <div className="text-4xl font-bold mb-6">
                4.99€<span className="text-lg">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span><strong>Projets illimités</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span><strong>30 crédits photos/mois</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Statistiques complètes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Export PDF projets</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Support prioritaire</span>
                </li>
              </ul>
              {/* [AI:Claude] BETA - Redirection vers login */}
              <Link
                to="/login"
                className="block w-full text-center bg-white text-primary-600 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Choisir PRO
              </Link>
            </div>

            {/* PREMIUM */}
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-primary-300">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <div className="text-4xl font-bold mb-6">
                9.99€<span className="text-lg">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>Projets illimités</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span><strong>120 images IA/mois</strong></span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Styles premium</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Téléchargement HD</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Édition IA (fond, couleur)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Support VIP</span>
                </li>
              </ul>
              {/* [AI:Claude] BETA - Redirection vers login */}
              <Link
                to="/login"
                className="block w-full text-center bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
              >
                Choisir Premium
              </Link>
            </div>
          </div>

          {/* Packs ponctuels */}
          <div className="mt-12 bg-gradient-to-r from-primary-50 to-pink-50 rounded-2xl p-8 border-2 border-primary-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-primary-900 mb-2">
                🎁 Besoin de plus d'images ce mois-ci ?
              </h3>
              <p className="text-gray-700">
                Achetez des packs ponctuels qui ne expirent jamais !
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition">
                <h4 className="font-bold text-lg mb-2">Pack 50</h4>
                <div className="text-3xl font-bold text-primary-600 mb-2">4.99€</div>
                <p className="text-gray-700 mb-2">50 crédits photos</p>
              </div>

              <div className="bg-white rounded-xl p-6 text-center shadow-xl border-2 border-primary-300 transform scale-105">
                <div className="bg-primary-500 text-white text-xs px-3 py-1 rounded-full inline-block mb-2">
                  MEILLEUR RAPPORT
                </div>
                <h4 className="font-bold text-lg mb-2">Pack 150</h4>
                <div className="text-3xl font-bold text-primary-600 mb-2">9.99€</div>
                <p className="text-gray-700 mb-2">150 crédits photos</p>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mt-6">
              💡 Les packs achetés ne expirent jamais et se cumulent avec vos crédits mensuels !
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 mb-4">
            🧶 YarnFlow - De la première maille à tous vos réseaux
          </p>
          <p className="text-gray-500 text-sm mb-2">
            Tracker de projets • AI Photo Studio • Statistiques • Communauté
          </p>
          <p className="text-sm text-gray-400 mb-2">
            <Link to="/privacy" className="hover:text-primary-300 transition">Politique de confidentialité</Link>
            {' · '}
            <Link to="/cgu" className="hover:text-primary-300 transition">Conditions d'utilisation</Link>
            {' · '}
            <Link to="/mentions" className="hover:text-primary-300 transition">Mentions légales</Link>
            {' · '}
            <Link to="/contact" className="hover:text-primary-300 transition">Contact</Link>
          </p>
          <p className="text-gray-600 text-xs">
            Créé par Nathalie avec Claude Code • v0.15.0 - YARNFLOW
          </p>
        </div>
      </footer>
    </div>
  )
}
