import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userAPI, paymentsAPI } from '../services/api'

const Subscription = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' ou 'annual'

  useEffect(() => {
    loadSubscription()
  }, [])

  // Scroll vers la section crédits si le hash #credits est présent
  useEffect(() => {
    if (window.location.hash === '#credits') {
      setTimeout(() => {
        const creditsSection = document.getElementById('credits-packs')
        if (creditsSection) {
          creditsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100) // Petit délai pour que la page soit bien chargée
    }
  }, [])

  const loadSubscription = async () => {
    try {
      const response = await userAPI.getSubscription()
      setSubscription(response.data.data)
    } catch (error) {
      console.error('Erreur chargement abonnement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planType) => {
    setProcessing(true)
    try {
      // Déterminer le type d'abonnement selon le plan et la période
      let subscriptionType = planType
      if (planType === 'plus' && billingPeriod === 'annual') {
        subscriptionType = 'plus_annual'
      } else if (planType === 'pro' && billingPeriod === 'annual') {
        subscriptionType = 'pro_annual'
      }

      const response = await paymentsAPI.checkoutSubscription({ type: subscriptionType })
      const { checkout_url } = response.data.data

      // Rediriger vers Stripe Checkout
      window.location.href = checkout_url
    } catch (error) {
      console.error('Erreur checkout:', error)
      alert(error.response?.data?.message || 'Erreur lors de la création du paiement')
      setProcessing(false)
    }
  }

  const handleBuyCredits = async (amount) => {
    setProcessing(true)
    try {
      // Le backend attend 'pack' au format string '50' ou '150'
      const response = await paymentsAPI.checkoutCredits({ pack: String(amount) })
      const { checkout_url } = response.data.data

      // Rediriger vers Stripe Checkout
      window.location.href = checkout_url
    } catch (error) {
      console.error('Erreur checkout crédits:', error)
      alert(error.response?.data?.message || 'Erreur lors de la création du paiement')
      setProcessing(false)
    }
  }

  const plans = [
    {
      type: 'free',
      name: 'FREE',
      price: '0€',
      period: '',
      features: [
        '3 projets actifs',
        'Patrons illimités',
        'Compteur de rangs',
        'Organisation simplifiée',
        '5 crédits photos/mois'
      ],
      limitations: [
        'Projets actifs limités à 3',
        'Crédits photos limités'
      ],
      current: !subscription || subscription.type === 'free' || !subscription.is_active
    },
    {
      type: 'plus',
      name: 'PLUS',
      price: billingPeriod === 'monthly' ? '2.99€' : '29.99€',
      period: billingPeriod === 'monthly' ? '/mois' : '/an',
      yearlyPrice: billingPeriod === 'annual' ? 'soit 2.49€/mois' : null,
      savings: billingPeriod === 'annual' ? 'Économisez 15% (5.89€/an)' : null,
      features: [
        '7 projets actifs',
        'Patrons illimités',
        'Compteur de rangs',
        'Organisation premium',
        '15 crédits photos/mois'
      ],
      popular: true,
      current: subscription?.is_active && (subscription?.type === 'plus' || subscription?.type === 'plus_annual')
    },
    {
      type: 'pro',
      name: 'PRO',
      price: billingPeriod === 'monthly' ? '4.99€' : '49.99€',
      period: billingPeriod === 'monthly' ? '/mois' : '/an',
      yearlyPrice: billingPeriod === 'annual' ? 'soit 4.16€/mois' : null,
      savings: billingPeriod === 'annual' ? 'Économisez 17% (9.89€/an)' : null,
      features: [
        'Projets illimités',
        'Patrons illimités',
        'Compteur de rangs',
        'Organisation premium',
        '30 crédits photos/mois',
        'Support prioritaire',
        'Accès premium aux nouveautés'
      ],
      current: subscription?.is_active && (subscription?.type === 'pro' || subscription?.type === 'pro_annual' || subscription?.type === 'monthly' || subscription?.type === 'annual')
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Lien retour discret */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-1"
        >
          ← Retour
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-center">Passer à la vitesse supérieure</h1>
      <p className="text-gray-600 text-center mb-8">
        Projets illimités, plus de crédits photos IA, et bien plus encore
      </p>

      {/* Toggle Mensuel/Annuel */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-6 py-2 rounded-lg font-medium transition ${
            billingPeriod === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBillingPeriod('annual')}
          className={`px-6 py-2 rounded-lg font-medium transition relative ${
            billingPeriod === 'annual'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Annuel
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            -27%
          </span>
        </button>
      </div>

      {/* Abonnement actuel */}
      {subscription && subscription.is_active && subscription.type !== 'free' && (
        <div className="card mb-8 bg-primary-50 border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">✅ Abonnement PRO actif</h2>
              <p className="text-gray-700">
                Projets illimités • 30 crédits photos/mois
              </p>
              {subscription.expires_at && (
                <p className="text-sm text-gray-600 mt-1">
                  Renouvellement le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-600">4.99€</div>
              <div className="text-sm text-gray-600">par mois</div>
            </div>
          </div>
        </div>
      )}

      {/* Message pour compte FREE */}
      {(!subscription || subscription.type === 'free' || !subscription.is_active) && (
        <div className="card mb-8 bg-gray-50 border-2 border-gray-200">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">📦 Plan FREE actuel</h2>
            <p className="text-gray-700">
              3 projets actifs • 5 crédits photos/mois • Stats de base
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Passez au plan PRO pour débloquer toutes les fonctionnalités 👇
            </p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.type}
            className={`card relative ${
              plan.popular
                ? 'border-2 border-primary-500 shadow-xl'
                : 'border border-gray-200'
            } ${plan.current ? 'bg-gray-50' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
            )}

            {plan.current && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Votre plan
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                )}
              </div>
              {plan.yearlyPrice && (
                <div className="text-sm text-gray-600 mb-1">
                  {plan.yearlyPrice}
                </div>
              )}
              {plan.savings && (
                <div className="text-green-600 font-medium text-sm">
                  {plan.savings}
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
              {plan.limitations && plan.limitations.map((limitation, index) => (
                <li key={`lim-${index}`} className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span className="text-sm text-gray-500">{limitation}</span>
                </li>
              ))}
            </ul>

            {plan.type === 'free' ? (
              <button
                disabled
                className="btn-secondary w-full opacity-50 cursor-not-allowed"
              >
                {plan.current ? 'Plan actuel' : 'Gratuit'}
              </button>
            ) : plan.current ? (
              <button
                disabled
                className="btn-secondary w-full"
              >
                Plan actuel
              </button>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.type)}
                disabled={processing}
                className="btn-primary w-full"
              >
                {processing ? 'Chargement...' : 'Souscrire'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Packs de crédits photos */}
      <div id="credits-packs" className="mb-8 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-2 text-center">📸 Besoin de plus de crédits photos ?</h2>
        <p className="text-gray-600 text-center mb-6">
          Achetez des crédits supplémentaires à tout moment, sans abonnement
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Pack 50 crédits */}
          <div className="card border border-gray-200">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">Pack 50 crédits</h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-3xl font-bold">4,99€</span>
              </div>
              <p className="text-sm text-gray-600">Paiement unique</p>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">50 crédits photos IA</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Valables à vie (pas d'expiration)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Cumulables avec vos crédits mensuels</span>
              </li>
            </ul>

            <button
              onClick={() => handleBuyCredits(50)}
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? 'Chargement...' : 'Acheter 50 crédits'}
            </button>
          </div>

          {/* Pack 150 crédits */}
          <div className="card border-2 border-primary-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Meilleur prix
              </span>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">Pack 150 crédits</h3>
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-3xl font-bold">9,99€</span>
              </div>
              <p className="text-sm text-green-600 font-medium">0,07€ par crédit (au lieu de 0,10€)</p>
              <p className="text-sm text-gray-600">Paiement unique</p>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">150 crédits photos IA</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Valables à vie (pas d'expiration)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700">Cumulables avec vos crédits mensuels</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-sm text-gray-700 font-bold">Économisez 4,50€ vs 3× Pack 50</span>
              </li>
            </ul>

            <button
              onClick={() => handleBuyCredits(150)}
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? 'Chargement...' : 'Acheter 150 crédits'}
            </button>
          </div>
        </div>
      </div>

      {/* FAQ simplifiée */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Questions fréquentes</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-1">🔒 Paiement sécurisé</h3>
            <p className="text-sm text-gray-600">
              Le paiement est géré par Stripe, leader mondial des paiements en ligne. Aucune donnée bancaire n'est stockée sur nos serveurs.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1">🔄 Annulation flexible</h3>
            <p className="text-sm text-gray-600">
              Vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée, puis vous repasserez au plan FREE automatiquement.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1">🎨 Crédits photos</h3>
            <p className="text-sm text-gray-600">
              Les crédits photos mensuels se réinitialisent automatiquement chaque mois à votre date d'abonnement. Plan FREE : 5 crédits/mois • Plan PLUS : 15 crédits/mois • Plan PRO : 30 crédits/mois.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1">💡 Pas de frais cachés</h3>
            <p className="text-sm text-gray-600">
              Le prix affiché est le prix total TTC. Vous pouvez changer de plan à tout moment avec proratisation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Subscription
