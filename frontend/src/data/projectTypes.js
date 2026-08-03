/**
 * @file projectTypes.js
 * @brief Types de projet — valeurs stockees en base et leur libelle affichable.
 * @created 2026-08-03 by [AI:Claude]
 *
 * Les valeurs (« Vêtements », « Maison/Déco »…) sont ecrites telles quelles dans
 * la colonne `type` des projets et dans `category` des patrons : elles font
 * partie des donnees et ne doivent JAMAIS etre traduites, sous peine de casser
 * les projets existants et la detection de categorie du studio photo.
 *
 * Seul l'affichage est traduit : projectTypeKey() donne la cle de traduction
 * correspondante, a resoudre avec t(`projectTypes.<cle>`, { ns: 'common' }).
 */

export const PROJECT_TYPE_VALUES = [
  'Vêtements',
  'Accessoires',
  'Jouets/Peluches',
  'Vêtements bébé',
  'Accessoires bébé',
  'Vêtements enfant',
  'Maison/Déco',
  'Autre',
]

const KEY_BY_VALUE = {
  'Vêtements': 'garments',
  'Accessoires': 'accessories',
  'Jouets/Peluches': 'toys',
  'Vêtements bébé': 'babyGarments',
  'Accessoires bébé': 'babyAccessories',
  'Vêtements enfant': 'childGarments',
  'Maison/Déco': 'home',
  'Autre': 'other',
  // valeur historique presente en base pour certains patrons
  'other': 'other',
}

/** Cle de traduction d'une valeur stockee, ou null si la valeur est inconnue. */
export const projectTypeKey = (value) => KEY_BY_VALUE[value] ?? null
