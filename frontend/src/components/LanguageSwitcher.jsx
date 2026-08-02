/**
 * @file LanguageSwitcher.jsx
 * @brief Sélecteur de langue FR/EN réutilisable
 * @author Nathalie + AI Assistants
 * @created 2026-08-02
 *
 * [AI:Claude] Extrait du Navbar pour être réutilisable sur les pages qui
 * n'utilisent pas Layout (login, inscription, mot de passe oublié...) —
 * sans ça, une utilisatrice anglophone arrivant directement sur /login
 * n'a aucun moyen de changer de langue.
 */

import { useTranslation } from 'react-i18next'

const LanguageSwitcher = ({ className = '' }) => {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage

  return (
    <div
      className={`inline-flex items-center rounded-full border border-gray-200 overflow-hidden text-xs font-semibold ${className}`}
      role="group"
      aria-label={t('language.switchLabel')}
    >
      {['fr', 'en'].map(lng => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={`px-2 py-0.5 transition ${
            current === lng
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t(`language.${lng}`)}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
