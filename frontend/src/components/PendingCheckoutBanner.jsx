import { useState, useEffect } from 'react'
import api from '../services/api'

const STORAGE_KEY = 'pending_checkout_dismissed_at'
const COOLDOWN_HOURS = 24

const shouldSkipFetch = () => {
  const dismissedAt = localStorage.getItem(STORAGE_KEY)
  if (!dismissedAt) return false
  const hoursSince = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60)
  return hoursSince < COOLDOWN_HOURS
}

// [AI:Claude] 2026-08-24 — Pendant de behavioral-triggers.php côté in-app : une
// adresse jetable ou jamais consultée ne verra jamais la relance par email, mais
// si la personne rouvre l'app, on peut la relancer directement ici.
const PendingCheckoutBanner = () => {
  const [checkout, setCheckout] = useState(null)

  useEffect(() => {
    if (shouldSkipFetch()) return
    api.get('/payments/pending-checkout')
      .then(res => {
        const data = res.data?.data
        if (data?.has_pending_checkout) setCheckout(data)
      })
      .catch(() => {})
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
    setCheckout(null)
  }

  if (!checkout) return null

  const planLabel = checkout.plan === 'pro' ? 'PRO' : 'PLUS'

  return (
    <div className="bg-primary-600 border-b border-primary-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-white font-medium">
              {checkout.discount_percent
                ? `Vous n'avez pas finalisé votre abonnement ${planLabel} — -${checkout.discount_percent}% avec le code ${checkout.promo_code}`
                : `Vous n'avez pas finalisé votre abonnement ${planLabel}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href="/subscription"
              className="px-4 py-1.5 bg-white text-primary-700 text-sm font-semibold rounded-lg hover:bg-primary-50 transition"
            >
              Reprendre
            </a>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-primary-100 text-sm hover:text-white transition"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingCheckoutBanner
