import { Component } from 'react'
import { Link } from 'react-router-dom'

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ Une erreur s'est produite
            </h1>

            <p className="text-gray-700 mb-6">
              Désolé, quelque chose s'est mal passé. Essayez de rafraîchir la page.
            </p>

            <details className="mb-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                Détails techniques (pour le debug)
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
                🔄 Rafraîchir la page
              </button>

              <Link
                to="/my-projects"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                ← Retour aux projets
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
