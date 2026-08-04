/**
 * @file upgradePlans.js
 * @brief Source unique pour les prix et le choix du plan a proposer.
 * @created 2026-08-04 by [AI:Claude]
 *
 * Avant, dix formulations de CTA cohabitaient dans l'app et plusieurs
 * annoncaient PRO alors que PLUS debloquait deja la fonctionnalite. Pire, les
 * popins affichaient le prix mensuel (6,99 €) tandis que la page Abonnement
 * affiche l'equivalent mensuel de l'annuel (4,99 €) : la meme offre paraissait
 * 40 % plus chere avant le clic qu'apres.
 *
 * Ici : un seul jeu de prix, une seule regle de choix du plan.
 */

export const PLAN_PRICES = {
  plus: { monthly: '3,99€', annual: '29,99€', monthlyEquiv: '2,49€', annualSaving: '17,89€' },
  pro: { monthly: '6,99€', annual: '59,99€', monthlyEquiv: '4,99€', annualSaving: '23,89€' },
}

/**
 * min        : plan minimal qui debloque la fonctionnalite
 * moreOnPro  : PRO en donne davantage (quota), donc un abonne PLUS peut encore monter
 *
 * Les notes par section ne figurent pas ici : elles sont incluses dans FREE.
 */
const FEATURES = {
  tags: { min: 'plus' },
  secondary_counter: { min: 'plus' },
  pattern_library: { min: 'plus' },
  chart_designer: { min: 'plus' },
  photo_credits: { min: 'plus', moreOnPro: true },
  ai_questions: { min: 'plus', moreOnPro: true },
  ai_creations: { min: 'plus', moreOnPro: true },
  translations: { min: 'plus', moreOnPro: true },
  stash: { min: 'plus', moreOnPro: true },
  advanced_stats: { min: 'pro' },
}

/**
 * Plan a proposer pour debloquer `feature`, selon l'abonnement en cours.
 * Renvoie 'plus', 'pro', ou null s'il n'y a plus rien a vendre.
 */
export const upgradeTarget = (feature, currentPlan = 'free') => {
  const f = FEATURES[feature]
  if (!f) return currentPlan === 'pro' ? null : 'pro'   // repli prudent
  if (currentPlan === 'pro') return null
  if (currentPlan === 'plus') return (f.moreOnPro || f.min === 'pro') ? 'pro' : null
  return f.min
}

/** Libelle affichable du plan, tel qu'il apparait sur la page Abonnement. */
export const planLabel = (plan) => (plan === 'pro' ? 'PRO' : 'PLUS')
