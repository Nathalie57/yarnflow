/**
 * @file i18n/index.js
 * @brief Configuration i18next (FR par défaut, EN en second)
 * @author Nathalie + AI Assistants
 * @created 2026-08-02
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import frCommon from './locales/fr/common.json'
import enCommon from './locales/en/common.json'

export const LANGUAGE_STORAGE_KEY = 'yarnflow_lang'
export const SUPPORTED_LANGUAGES = ['fr', 'en']

// [AI:Claude] Import statique des namespaces : le volume de traductions reste
// petit à l'échelle d'un bundle Vite, pas besoin du backend HTTP d'i18next
// (qui ajouterait un chargement asynchrone et un risque de flash sans texte).
const resources = {
  fr: { common: frCommon },
  en: { common: enCommon },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: ['common'],

    detection: {
      // [AI:Claude] localStorage en premier : un choix explicite via le sélecteur
      // du Navbar doit toujours l'emporter sur la langue du navigateur aux
      // visites suivantes. La détection navigator ne sert qu'au tout premier accès.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },

    interpolation: {
      // React échappe déjà les valeurs interpolées
      escapeValue: false,
    },

    // [AI:Claude] Une clé manquante doit rester visible en dev (elle s'affiche
    // telle quelle, ex. "navbar.projects") — c'est le signal le moins cher pour
    // repérer une clé mal câblée pendant la migration progressive des pages.
    returnEmptyString: false,
  })

// [AI:Claude] index.html a lang="fr" en dur (statique, servi avant React) —
// on le réaligne sur la langue réelle après montage et à chaque changement.
const syncDocumentLang = (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }
}
syncDocumentLang(i18n.resolvedLanguage || 'fr')
i18n.on('languageChanged', syncDocumentLang)

export default i18n
