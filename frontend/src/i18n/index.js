/**
 * @file i18n/index.js
 * @brief Configuration i18next (FR par défaut, EN en second)
 * @author Nathalie + AI Assistants
 * @created 2026-08-02
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { LANGUAGE_SWITCHER_ENABLED } from '../config/features'

import frCommon from './locales/fr/common.json'
import enCommon from './locales/en/common.json'
import frAuth from './locales/fr/auth.json'
import enAuth from './locales/en/auth.json'
import frLanding from './locales/fr/landing.json'
import enLanding from './locales/en/landing.json'
import frPageTitles from './locales/fr/pageTitles.json'
import enPageTitles from './locales/en/pageTitles.json'
import frProjects from './locales/fr/projects.json'
import enProjects from './locales/en/projects.json'
import frCounter from './locales/fr/counter.json'
import enCounter from './locales/en/counter.json'
import frLibrary from './locales/fr/library.json'
import enLibrary from './locales/en/library.json'
import frTools from './locales/fr/tools.json'
import enTools from './locales/en/tools.json'
import frLegal from './locales/fr/legal.json'
import enLegal from './locales/en/legal.json'

export const LANGUAGE_STORAGE_KEY = 'yarnflow_lang'
export const SUPPORTED_LANGUAGES = ['fr', 'en']

// [AI:Claude] Import statique des namespaces : le volume de traductions reste
// petit à l'échelle d'un bundle Vite, pas besoin du backend HTTP d'i18next
// (qui ajouterait un chargement asynchrone et un risque de flash sans texte).
const resources = {
  fr: { common: frCommon, auth: frAuth, landing: frLanding, pageTitles: frPageTitles, projects: frProjects, counter: frCounter, library: frLibrary, tools: frTools, legal: frLegal },
  en: { common: enCommon, auth: enAuth, landing: enLanding, pageTitles: enPageTitles, projects: enProjects, counter: enCounter, library: enLibrary, tools: enTools, legal: enLegal },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: 'fr',
    defaultNS: 'common',
    ns: ['common', 'auth', 'landing', 'pageTitles', 'projects', 'counter', 'library', 'tools', 'legal'],

    detection: {
      // [AI:Claude] localStorage en premier : un choix explicite via le sélecteur
      // du Navbar doit toujours l'emporter sur la langue du navigateur aux
      // visites suivantes. La détection navigator ne sert qu'au tout premier accès.
      // [AI:Claude] Tant que l’anglais n’est pas ouvert a tous, on retire
      // 'navigator' : la langue du navigateur ne doit pas basculer l’app dans
      // une version que personne ne peut quitter, faute de selecteur visible.
      // Seul un choix explicite, memorise en localStorage, est respecte.
      order: LANGUAGE_SWITCHER_ENABLED ? ['localStorage', 'navigator'] : ['localStorage'],
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
