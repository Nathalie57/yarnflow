/**
 * @file hintsConfig.js
 * @brief Configuration des hints contextuels (astuces proactives)
 * @created 2026-02-26 by [AI:Claude]
 */

/**
 * Définition des hints disponibles
 * Chaque hint a un id unique, texte, icône, position, durée et priorité
 */
export const HINTS = {
  TIMER_WAKE_LOCK: {
    id: 'timer_wake_lock',
    text: 'Le timer garde votre écran allumé pendant que vous tricotez !',
    icon: '💡',
    position: 'bottom',
    priority: 1,
    duration: 5000
  }

  // Futurs hints à ajouter ici :
  // SECTIONS_SUGGESTION: { ... }
  // PHOTO_STUDIO_INTRO: { ... }
  // COUNTER_SHORTCUTS: { ... }
}

/**
 * Cooldown entre deux hints (en ms)
 * Évite de surcharger l'utilisateur
 */
export const HINT_COOLDOWN = 30000 // 30 secondes

/**
 * Nombre de fois qu'un hint est affiché avant de disparaître définitivement
 * L'InfoBubble "?" reste disponible pour revoir l'info
 */
export const HINT_MAX_VIEWS = 2

/**
 * Délai minimum entre deux affichages du même hint (en ms)
 */
export const HINT_MIN_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 jours

/**
 * Clé localStorage pour persister les hints vus
 */
export const HINTS_STORAGE_KEY = 'yarnflow_hints_seen'
