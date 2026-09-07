import { Component } from 'react'

/**
 * [AI:Claude] Error boundary local : si l'enfant plante, il disparaît silencieusement
 * (rien à afficher) plutôt que de casser toute la page comme le ErrorBoundary global.
 * À utiliser pour isoler un bloc non-critique fraîchement ajouté (ex: une carte de
 * fonctionnalité optionnelle) dont un bug ne doit pas empêcher le reste de la page
 * de fonctionner pour les utilisatrices qui ne l'utilisent pas.
 */
class SilentErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SilentErrorBoundary] Erreur capturée:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export default SilentErrorBoundary
