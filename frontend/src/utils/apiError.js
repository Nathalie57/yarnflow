/**
 * @file apiError.js
 * @brief Transforme une erreur axios en message affichable, dans la bonne langue.
 * @created 2026-08-04 by [AI:Claude]
 *
 * Le backend renvoie ses messages en français en dur (`'error' => 'Fichier trop
 * volumineux (max 10 MB)'`). Les 29 sites d'appel du frontend faisaient tous la
 * même chose :
 *
 *     setError(err.response?.data?.error || t('ui.uploadFailed'))
 *
 * autrement dit : le français du backend passe DEVANT le repli traduit. Une
 * anglophone recevait donc du français dès que le serveur avait quelque chose
 * à dire — c'est-à-dire presque toujours.
 *
 * Traduire les 145 messages distincts du backend serait disproportionné : 76
 * d'entre eux sont des garde-fous (« Accès non autorisé », « Projet
 * introuvable ») qu'une utilisatrice normale ne voit jamais. On procède donc
 * en deux temps :
 *
 *   1. `error_code` — les messages réellement actionnables (limites de plan,
 *      taille de fichier, format accepté) portent un code stable, traduit ici.
 *   2. le repli traduit — pour tout le reste, une anglophone voit le message
 *      générique de l'écran plutôt que du français.
 *
 * En français, le comportement est strictement identique à avant.
 */

import i18n from '../i18n'

/**
 * @param err      l'erreur axios interceptee
 * @param fallback message deja traduit, propre a l'ecran ("L'envoi a echoue")
 * @returns le message a afficher
 */
export const apiErrorMessage = (err, fallback) => {
  const data = err?.response?.data

  // 1. Code stable renvoye par le backend : c'est la seule source vraiment
  //    traduisible. `errors` vit dans le namespace common (defaultNS).
  const code = data?.error_code
  if (code) {
    const key = `errors.${code}`
    if (i18n.exists(key)) return i18n.t(key, data?.error_params || {})
  }

  // 2. Message libre du serveur. Il est en francais en dur : on ne l'affiche
  //    qu'a une francophone. Ailleurs, le repli de l'ecran est plus utile
  //    qu'une phrase dans une langue que la personne ne lit pas.
  const brut = data?.error || data?.message
  if (brut && i18n.resolvedLanguage === 'fr') return brut

  // 3. `err.message` est le message d'axios lui-meme ("Network Error") : utile
  //    quand le serveur n'a rien renvoye du tout, mais jamais traduit non plus.
  if (!brut && !fallback && err?.message) return err.message

  return fallback || i18n.t('errors.generic')
}

export default apiErrorMessage
