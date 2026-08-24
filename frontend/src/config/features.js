/**
 * @file features.js
 * @brief Interrupteurs de fonctionnalites, a basculer a la main.
 * @created 2026-08-04 by [AI:Claude]
 */

/**
 * Ouvre l'anglais a tout le monde. Active le 2026-08-24 : captures d'ecran de
 * la landing traduites, messages d'erreur du backend externalises.
 */
export const LANGUAGE_SWITCHER_ENABLED = true

/**
 * Comptes autorises a basculer FR/EN meme quand l'interrupteur ci-dessus est
 * a `false`. Sert a tester l'anglais en production sans l'exposer.
 */
export const LANGUAGE_SWITCHER_USER_IDS = [7]

/**
 * Cette personne peut-elle changer de langue ?
 * Utilise a la fois pour afficher le selecteur et pour ramener en francais
 * quelqu'un qui aurait un choix anglais en memoire sans y avoir droit —
 * sans ce filet, elle resterait bloquee en anglais, faute de selecteur.
 */
export const canSwitchLanguage = (user) =>
  LANGUAGE_SWITCHER_ENABLED || LANGUAGE_SWITCHER_USER_IDS.includes(Number(user?.id))
