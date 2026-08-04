/**
 * @file features.js
 * @brief Interrupteurs de fonctionnalites, a basculer a la main.
 * @created 2026-08-04 by [AI:Claude]
 */

/**
 * Affiche le selecteur FR/EN et autorise la detection de la langue du
 * navigateur.
 *
 * A `false`, l'app est verrouillee en francais : le selecteur disparait
 * partout et la detection automatique est desactivee. C'est volontairement
 * le meme interrupteur pour les deux — masquer le selecteur sans couper la
 * detection enfermerait une utilisatrice au navigateur anglais dans une
 * version anglaise sans aucun moyen d'en sortir.
 *
 * Passer a `true` le jour ou l'anglais est pret : captures d'ecran de la
 * landing traduites, messages d'erreur du backend traduits.
 */
export const LANGUAGE_SWITCHER_ENABLED = false
