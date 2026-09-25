/**
 * @file productEvents.js
 * @brief Jalons produit envoyés à analytics_events (POST /analytics/track-event)
 *
 * [AI:Claude] 2026-09-25 — Même appel best-effort que partout ailleurs dans l'app,
 * factorisé pour les murs payants : le dernier mur vu est gardé en sessionStorage pour
 * attribuer ensuite checkout_started à sa source, sans modifier chaque lien vers
 * /subscription.
 */

import api from '../services/api'

const LAST_PAYWALL_KEY = 'yf_last_paywall'
const PAYWALL_ATTRIBUTION_MS = 30 * 60 * 1000

export const trackProductEvent = (eventName, data = {}) => {
  api.post('/analytics/track-event', { event_name: eventName, ...data }).catch(() => {})
}

// current_plan est ajouté côté serveur (lu en base)
export const trackPaywallShown = ({ source, feature, reason, suggestedPlan = null }) => {
  trackProductEvent('paywall_shown', { source, feature, reason, suggested_plan: suggestedPlan })
  try {
    sessionStorage.setItem(LAST_PAYWALL_KEY, JSON.stringify({ source, at: Date.now() }))
  } catch { /* ignore */ }
}

export const getCheckoutSource = () => {
  try {
    const last = JSON.parse(sessionStorage.getItem(LAST_PAYWALL_KEY) || 'null')
    if (last?.source && Date.now() - last.at < PAYWALL_ATTRIBUTION_MS) return last.source
  } catch { /* ignore */ }
  return 'subscription_page'
}
