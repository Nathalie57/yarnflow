/**
 * @file photoStyles.js
 * @brief Styles et saisons du studio photo IA — donnees partagees par Gallery et ProjectCounter.
 * @created 2026-08-03 by [AI:Claude]
 *
 * Les libelles ne sont PAS ici : ils vivent dans les traductions, sous
 * common:photoStyles.<key>.label / .desc et common:photoSeasons.<key>.*.
 * Seule la `key` est envoyee au backend (contexts: [key]) — ne jamais la traduire.
 *
 * `worn` : le style montre l'ouvrage porte par une personne, donc le choix du
 * genre du modele est propose. Remplace l'ancien test sur le texte du libelle
 * (`label.includes('Porté')`), qui cassait des qu'on traduisait l'interface.
 */

export const PHOTO_SEASONS = [
  { key: 'spring', icon: '🌸' },
  { key: 'summer', icon: '☀️' },
  { key: 'autumn', icon: '🍂' },
  { key: 'winter', icon: '❄️' },
]

export const PHOTO_STYLES_BY_CATEGORY = {
  wearable: [
    { key: 'wearable_c1', icon: '👤', tier: 'free', worn: true },
    { key: 'flatlay_c1', icon: '📸', tier: 'free' },
    { key: 'detail_c1', icon: '🔍', tier: 'free' },
    { key: 'wearable_c2', icon: '👤', tier: 'plus', worn: true },
    { key: 'wearable_c3', icon: '🌆', tier: 'plus', worn: true },
    { key: 'flatlay_c2', icon: '🏡', tier: 'plus' },
    { key: 'wearable_c4', icon: '🌼', tier: 'pro', worn: true },
    { key: 'wearable_c7', icon: '👗', tier: 'pro', worn: true },
    { key: 'wearable_c9', icon: '🏙️', tier: 'pro', worn: true },
  ],
  accessory: [
    { key: 'accessory_c1', icon: '📸', tier: 'free' },
    { key: 'accessory_c2', icon: '🌿', tier: 'free', worn: true },
    { key: 'accessory_c3', icon: '👤', tier: 'free', worn: true },
    { key: 'accessory_c4', icon: '🏡', tier: 'plus' },
    { key: 'accessory_c5', icon: '🏙️', tier: 'plus', worn: true },
    { key: 'accessory_c6', icon: '🏠', tier: 'plus' },
    { key: 'accessory_c7', icon: '💃', tier: 'pro', worn: true },
    { key: 'accessory_c8', icon: '💎', tier: 'pro' },
    { key: 'accessory_c9', icon: '🌸', tier: 'pro', worn: true },
  ],
  home_decor: [
    { key: 'home_c1', icon: '🏠', tier: 'free' },
    { key: 'home_c2', icon: '🌿', tier: 'free' },
    { key: 'home_c3', icon: '🪟', tier: 'free' },
    { key: 'home_c4', icon: '🏭', tier: 'plus' },
    { key: 'home_c5', icon: '🎨', tier: 'plus' },
    { key: 'home_c6', icon: '🛋️', tier: 'plus' },
    { key: 'home_c7', icon: '💎', tier: 'pro' },
    { key: 'home_c8', icon: '🧘', tier: 'pro' },
    { key: 'home_c9', icon: '🎨', tier: 'pro' },
  ],
  toy: [
    { key: 'toy_c1', icon: '🧸', tier: 'free' },
    { key: 'toy_c2', icon: '📖', tier: 'free' },
    { key: 'toy_c3', icon: '📸', tier: 'free' },
    { key: 'toy_c4', icon: '🧸', tier: 'plus' },
    { key: 'toy_c5', icon: '🌿', tier: 'plus' },
    { key: 'toy_c6', icon: '🎈', tier: 'plus' },
    { key: 'toy_c7', icon: '🏪', tier: 'pro' },
    { key: 'toy_c8', icon: '🦁', tier: 'pro' },
    { key: 'toy_c9', icon: '🎪', tier: 'pro' },
  ],
  baby_garment: [
    { key: 'baby_garment_c1', icon: '🛏️', tier: 'free', worn: true },
    { key: 'baby_garment_c2', icon: '🌸', tier: 'free' },
    { key: 'baby_garment_c3', icon: '🏠', tier: 'free' },
    { key: 'baby_garment_c4', icon: '🧸', tier: 'plus', worn: true },
    { key: 'baby_garment_c5', icon: '🌿', tier: 'plus' },
    { key: 'baby_garment_c6', icon: '🧺', tier: 'plus' },
    { key: 'baby_garment_c7', icon: '💝', tier: 'pro', worn: true },
    { key: 'baby_garment_c8', icon: '💎', tier: 'pro' },
    { key: 'baby_garment_c9', icon: '🌸', tier: 'pro', worn: true },
  ],
  child_garment: [
    { key: 'child_garment_c1', icon: '🌿', tier: 'free', worn: true },
    { key: 'child_garment_c2', icon: '📸', tier: 'free' },
    { key: 'child_garment_c3', icon: '🛏️', tier: 'free' },
    { key: 'child_garment_c4', icon: '🧸', tier: 'plus', worn: true },
    { key: 'child_garment_c5', icon: '🎨', tier: 'plus' },
    { key: 'child_garment_c6', icon: '🏙️', tier: 'plus', worn: true },
    { key: 'child_garment_c7', icon: '📸', tier: 'pro', worn: true },
    { key: 'child_garment_c8', icon: '💎', tier: 'pro' },
    { key: 'child_garment_c9', icon: '💝', tier: 'pro', worn: true },
  ],
}
