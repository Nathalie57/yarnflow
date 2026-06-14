import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userAPI, paymentsAPI } from '../services/api'
import { useAnalytics } from '../hooks/useAnalytics'

const Check = ({ className = 'text-primary-500' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 mt-0.5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const Dash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
  </svg>
)

const TWAMessage = () => (
  <div className="max-w-md mx-auto px-6 py-16 text-center space-y-6">
    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">Débloquer YarnFlow</h1>
    <p className="text-gray-600 leading-relaxed">
      Pour vous offrir YarnFlow au prix le plus juste sans intermédiaire, la gestion des abonnements se fait exclusivement sur notre site internet. Pour débloquer vos fonctionnalités, connectez-vous simplement à votre compte sur <span className="font-semibold text-primary-700">yarnflow.fr</span> depuis le navigateur de votre téléphone ou de votre ordinateur. Votre application se mettra à jour instantanément !
    </p>
    <button onClick={() => window.history.back()} className="text-sm text-gray-400 hover:text-gray-600 transition">
      Retour
    </button>
  </div>
)

const Subscription = () => {
  const { user, isTWA } = useAuth()
  const { trackSubscriptionClick, trackBeginCheckout, trackCreditsClick } = useAnalytics()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadSubscription()
  }, [])

  // Recharger l'abonnement quand la page revient au premier plan (retour du CCT Stripe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) loadSubscription()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (window.location.hash === '#credits') {
      setTimeout(() => {
        const creditsSection = document.getElementById('credits-packs')
        if (creditsSection) creditsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [])

  const handleManageSubscription = async () => {
    setProcessing(true)
    const win = window.open('', '_blank')
    try {
      const response = await paymentsAPI.createPortal()
      const { portal_url } = response.data.data
      if (win) win.location.href = portal_url
      else window.location.href = portal_url
      setProcessing(false)
    } catch (error) {
      if (win) win.close()
      console.error('Erreur portail:', error)
      alert('Impossible d\'ouvrir le portail de gestion. Réessayez.')
      setProcessing(false)
    }
  }

  const loadSubscription = async () => {
    try {
      const response = await userAPI.getSubscription()
      setSubscription(response.data.data.subscription)
    } catch (error) {
      console.error('Erreur chargement abonnement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribePlus = async () => {
    setProcessing(true)
    trackSubscriptionClick('plus', 'monthly', 'subscription')
    const win = window.open('', '_blank')
    try {
      const response = await paymentsAPI.checkoutSubscription({ type: 'plus' })
      const { checkout_url } = response.data.data
      trackBeginCheckout('subscription', 'plus', 3.99)
      localStorage.setItem('yf_pending_plan', 'plus')
      if (win) win.location.href = checkout_url
      else window.location.href = checkout_url
      setProcessing(false)
    } catch (error) {
      if (win) win.close()
      console.error('Erreur checkout plus:', error)
      alert(error.response?.data?.message || 'Erreur lors de la création du paiement')
      setProcessing(false)
    }
  }

  const handleSubscribe = async (type = 'pro_annual') => {
    setProcessing(true)
    const isAnnual = type === 'pro_annual'
    trackSubscriptionClick('pro', isAnnual ? 'annual' : 'monthly', 'subscription')
    const win = window.open('', '_blank')
    try {
      const amount = isAnnual ? 59.99 : 6.99
      const response = await paymentsAPI.checkoutSubscription({ type })
      const { checkout_url } = response.data.data
      trackBeginCheckout('subscription', type, amount)
      localStorage.setItem('yf_pending_plan', ['plus', 'plus_annual'].includes(type) ? 'plus' : 'pro')
      if (win) win.location.href = checkout_url
      else window.location.href = checkout_url
      setProcessing(false)
    } catch (error) {
      if (win) win.close()
      console.error('Erreur checkout:', error)
      alert(error.response?.data?.message || 'Erreur lors de la création du paiement')
      setProcessing(false)
    }
  }

  const handleBuyCredits = async (amount) => {
    setProcessing(true)
    trackCreditsClick(amount, 'subscription')
    const win = window.open('', '_blank')
    try {
      const response = await paymentsAPI.checkoutCredits({ pack: String(amount) })
      const { checkout_url } = response.data.data
      const price = amount === 50 ? 4.99 : 9.99
      trackBeginCheckout('credits', String(amount), price)
      if (win) win.location.href = checkout_url
      else window.location.href = checkout_url
      setProcessing(false)
    } catch (error) {
      if (win) win.close()
      console.error('Erreur checkout crédits:', error)
      alert(error.response?.data?.message || 'Erreur lors de la création du paiement')
      setProcessing(false)
    }
  }

  const isFree = !subscription || subscription.type === 'free' || !subscription.is_active
  const isPlus = subscription?.is_active && (
    subscription?.type === 'plus' || subscription?.type === 'plus_annual'
  )
  const isPro = subscription?.is_active && (
    subscription?.type === 'pro' ||
    subscription?.type === 'pro_annual' ||
    subscription?.type === 'early_bird' ||
    subscription?.type === 'monthly' ||
    subscription?.type === 'annual'
  )

  const plusPrice = '3,99€'

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <div className="skeleton h-10 w-64 rounded-xl mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-96 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (isTWA) return <TWAMessage />

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

      {/* Bouton retour */}
      <button onClick={() => window.history.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Choisissez votre plan</h1>
        <p className="text-gray-500">Commencez gratuitement. Passez à PRO quand vos projets le méritent.</p>

        <div className="flex items-center justify-center gap-2 flex-wrap mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Paiement sécurisé Stripe
          </span>
          <span>·</span>
          <span>Sans engagement</span>
          <span>·</span>
          <span>Résiliable à tout moment</span>
        </div>
      </div>

      {/* Abonnement PLUS actif */}
      {isPlus && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-primary-900 text-sm">Abonnement PLUS actif</p>
              {subscription?.expires_at && (
                <p className="text-xs text-primary-600">Renouvellement le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Pour passer au PRO, cliquez sur Gérer — les jours restants PLUS seront déduits automatiquement.</p>
            </div>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={processing}
            className="text-xs font-semibold text-primary-700 border border-primary-300 bg-white hover:bg-primary-50 rounded-lg px-3 py-1.5 transition disabled:opacity-60"
          >
            {processing ? 'Chargement…' : 'Gérer'}
          </button>
        </div>
      )}

      {/* Abonnement PRO actif */}
      {isPro && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-primary-900 text-sm">Abonnement PRO actif</p>
              {subscription?.expires_at && (
                <p className="text-xs text-primary-600">Renouvellement le {new Date(subscription.expires_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={processing}
            className="text-xs font-semibold text-primary-700 border border-primary-300 bg-white hover:bg-primary-50 rounded-lg px-3 py-1.5 transition disabled:opacity-60"
          >
            {processing ? 'Chargement…' : 'Gérer'}
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">

        {/* FREE */}
        <div className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col ${isFree ? 'border-gray-300' : 'border-gray-200'}`}>
          {isFree && (
            <div className="flex justify-center mb-3">
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">Plan actuel</span>
            </div>
          )}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Free</p>
            <div className="text-3xl font-bold text-gray-900 mb-1">0€</div>
            <p className="text-sm text-gray-500">L'essentiel pour découvrir YarnFlow.</p>
          </div>

          <ul className="space-y-2 mb-5 flex-1 text-sm text-gray-700">
            <li className="flex items-start gap-2"><Check /><span>Projets &amp; patrons illimités</span></li>
            <li className="flex items-start gap-2"><Check /><span>1 compteur par projet</span></li>
            <li className="flex items-start gap-2"><Check /><span>Stock — 10 références</span></li>
            <li className="flex items-start gap-2"><Check /><span>1 Création IA offerte</span></li>
            <li className="flex items-start gap-2"><Check /><span>3 questions IA / mois</span></li>
            <li className="flex items-start gap-2"><Check /><span>2 crédits Studio Photo / mois</span></li>
          </ul>

          <button disabled className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed">
            {isFree ? 'Plan actuel' : 'Gratuit'}
          </button>
        </div>

        {/* PLUS */}
        <div className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col ${isPlus ? 'border-primary-400' : 'border-gray-200'}`}>
          {isPlus && (
            <div className="flex justify-center mb-3">
              <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">Plan actuel</span>
            </div>
          )}
          <div className="mb-4">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Plus</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">{plusPrice}</span>
              <span className="text-sm text-gray-500">/mois</span>
            </div>
            <p className="text-sm text-gray-500">Le confort de gestion au quotidien.</p>
          </div>

          <ul className="space-y-2 mb-5 flex-1 text-sm text-gray-700">
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span>Tout le plan FREE</span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span><span className="font-medium">2 compteurs simultanés</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span><span className="font-medium">Stock — 50 références</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span>Notes privées par section</span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span>Tags pour organiser vos ouvrages</span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span><span className="font-medium">3 Créations IA / mois</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span>10 questions IA / mois</span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span>5 crédits Studio Photo / mois</span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-500" /><span>Statistiques avancées</span></li>
          </ul>

          <button
            onClick={isPro ? handleManageSubscription : handleSubscribePlus}
            disabled={processing || isPlus}
            className="w-full py-2.5 border-2 border-primary-500 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {processing ? 'Chargement…' : isPlus ? 'Plan actuel' : isPro ? 'Rétrograder vers PLUS' : `Passer à PLUS — ${plusPrice}/mois`}
          </button>
        </div>

        {/* PRO */}
        <div className="bg-white rounded-2xl border-2 border-primary-500 p-5 shadow-lg flex flex-col relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
              Pour les passionnées
            </span>
          </div>

          {isPro && (
            <div className="flex justify-center mb-3 mt-2">
              <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">Plan actuel</span>
            </div>
          )}

          <div className="mb-4 mt-2">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Pro</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">4,99€</span>
              <span className="text-sm text-gray-500">/mois</span>
            </div>
            <p className="text-xs text-green-600 font-medium mb-1">Facturé 59,99€/an — économisez 23,89€</p>
            <p className="text-sm text-gray-500">L'expérience ultime, sans limites.</p>
          </div>

          <ul className="space-y-2 mb-5 flex-1 text-sm text-gray-700">
            <li className="flex items-start gap-2"><Check className="text-primary-600" /><span>Tout le plan PLUS</span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-600" /><span><span className="font-medium">Stock illimité</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-600" /><span><span className="font-medium">15 Créations IA / mois</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-600" /><span><span className="font-medium">30 questions IA / mois</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-600" /><span><span className="font-medium">20 crédits Studio Photo / mois</span></span></li>
            <li className="flex items-start gap-2"><Check className="text-primary-600" /><span>Statistiques avancées</span></li>
          </ul>

          {isPro ? (
            <button disabled className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold opacity-60 cursor-not-allowed">
              Plan actuel
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => isPlus ? handleManageSubscription() : handleSubscribe('pro_annual')}
                disabled={processing}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? 'Chargement…' : 'Passer à PRO (Annuel)'}
              </button>
              <button
                onClick={() => isPlus ? handleManageSubscription() : handleSubscribe('pro')}
                disabled={processing}
                className="w-full py-2.5 border-2 border-primary-600 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? 'Chargement…' : 'Choisir le Mensuel (6,99€/mois)'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Packs de crédits photos */}
      <div id="credits-packs" className="scroll-mt-20">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Besoin de plus de photos IA ?</h2>
          <p className="text-sm text-gray-500">Crédits supplémentaires à la carte, sans abonnement, valables à vie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Pack 50 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">Pack 50 crédits</p>
                <p className="text-xs text-gray-500 mt-0.5">0,10€ par crédit</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-900">4,99€</span>
                <p className="text-xs text-gray-500">paiement unique</p>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              <li className="flex items-start gap-2"><Check /><span className="text-sm text-gray-700">50 photos IA</span></li>
              <li className="flex items-start gap-2"><Check /><span className="text-sm text-gray-700">Valables à vie</span></li>
              <li className="flex items-start gap-2"><Check /><span className="text-sm text-gray-700">Cumulables avec vos crédits mensuels</span></li>
            </ul>
            <button onClick={() => handleBuyCredits(50)} disabled={processing} className="w-full py-2.5 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-semibold transition disabled:opacity-60">
              {processing ? 'Chargement…' : 'Acheter 50 crédits'}
            </button>
          </div>

          {/* Pack 150 */}
          <div className="bg-white rounded-2xl border-2 border-primary-500 p-6 shadow-md relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Meilleur prix</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">Pack 150 crédits</p>
                <p className="text-xs text-green-600 font-medium mt-0.5">0,07€ par crédit — économisez 4,50€</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-gray-900">9,99€</span>
                <p className="text-xs text-gray-500">paiement unique</p>
              </div>
            </div>
            <ul className="space-y-2 mb-5">
              <li className="flex items-start gap-2"><Check /><span className="text-sm text-gray-700">150 photos IA</span></li>
              <li className="flex items-start gap-2"><Check /><span className="text-sm text-gray-700">Valables à vie</span></li>
              <li className="flex items-start gap-2"><Check /><span className="text-sm text-gray-700">Cumulables avec vos crédits mensuels</span></li>
            </ul>
            <button onClick={() => handleBuyCredits(150)} disabled={processing} className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60">
              {processing ? 'Chargement…' : 'Acheter 150 crédits'}
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-bold text-gray-900 text-lg">Questions fréquentes</h2>

        {[
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
            q: 'Paiement sécurisé',
            a: "Le paiement est géré par Stripe, leader mondial des paiements en ligne. Aucune donnée bancaire n'est stockée sur nos serveurs."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
            q: 'Annulation flexible',
            a: "Vous pouvez annuler à tout moment. Votre abonnement reste actif jusqu'à la fin de la période payée, puis vous repassez en FREE automatiquement."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
            q: 'Crédits photos IA',
            a: "Les crédits mensuels se réinitialisent chaque mois à votre date d'abonnement. Les crédits achetés à la carte sont cumulables et n'expirent jamais."
          },
          {
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
            q: 'Pas de frais cachés',
            a: 'Le prix affiché est le prix total TTC. Vous pouvez changer de plan à tout moment avec proratisation automatique.'
          }
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {item.icon}
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{item.q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Subscription
