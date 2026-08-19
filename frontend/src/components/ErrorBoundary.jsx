import { Component } from 'react'
import { Link } from 'react-router-dom'
// [AI:Claude] Composant classe (obligatoire pour un ErrorBoundary React) :
// pas de hook possible ici, d'où le HOC withTranslation qui injecte t en prop.
import { withTranslation } from 'react-i18next'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ErrorBoundary] Erreur capturée:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // [AI:Claude] 2026-08-19 — Ce composant enveloppe TOUTES les routes : une
    // erreur ici casse l'app entiere, pas juste une page, et jusqu'ici rien
    // n'en gardait trace nulle part (console.error seul). Le bug i18n du
    // 18 aout a tourne au moins deux semaines avant d'etre decouvert, et
    // seulement parce qu'une utilisatrice a envoye une capture d'ecran — sans
    // visibilite sur combien d'autres sont simplement parties sans rien dire.
    //
    // Meme limite de consentement que le reste du suivi analytics (voir
    // apiError.js) : une personne qui plante des sa toute premiere page n'a
    // pas forcement encore accepte les cookies, donc cet evenement ne capture
    // pas tout. Mais pour qui a deja navigue un peu, c'est desormais visible
    // dans GA4 sans attendre qu'elle ecrive.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'app_error', {
        event_category: 'error',
        error_message: String(error?.message || error).slice(0, 150),
        page_path: window.location?.pathname || '(inconnu)',
      })
    }
  }

  render() {
    const { t } = this.props

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {t('errorBoundary.title')}
            </h1>

            <p className="text-gray-700 mb-6">
              {t('errorBoundary.description')}
            </p>

            <details className="mb-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                {t('errorBoundary.technicalDetails')}
              </summary>
              <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                {t('errorBoundary.refresh')}
              </button>

              <Link
                to="/my-projects"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                {t('errorBoundary.backToProjects')}
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default withTranslation()(ErrorBoundary)
