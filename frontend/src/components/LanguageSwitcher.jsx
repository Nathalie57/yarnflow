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

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { canSwitchLanguage } from '../config/features'

const LanguageSwitcher = ({ className = '' }) => {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const allowed = canSwitchLanguage(user)

  // [AI:Claude] Filet de sécurité : si un choix anglais traîne en localStorage
  // alors que la personne n'y a plus droit (test terminé, autre compte sur le
  // même navigateur), on la ramène en français. Sans ça elle resterait bloquée
  // en anglais, puisque le sélecteur ne s'affiche pas pour elle.
  useEffect(() => {
    if (!allowed && i18n.resolvedLanguage !== 'fr') i18n.changeLanguage('fr')
  }, [allowed, i18n])

  if (!allowed) return null

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
