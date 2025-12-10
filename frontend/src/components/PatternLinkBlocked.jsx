/**
 * @file PatternLinkBlocked.jsx
 * @brief Message quand un lien externe ne peut pas être affiché
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

const PatternLinkBlocked = ({ url, onUploadClick }) => {
  const extractDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'ce site'
    }
  }

  const domain = extractDomain(url)

  return (
    <div className="border-2 border-gray-200 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-white">
      <div className="text-center max-w-2xl mx-auto">
        {/* Icône */}
        <div className="text-6xl mb-4">📄</div>

        {/* Message principal */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Patron sauvegardé sous forme de lien
        </h3>

        <p className="text-gray-600 mb-6">
          Pour des raisons de sécurité, <strong>{domain}</strong> ne peut pas être affiché directement dans l'application.
        </p>

        {/* Box conseil */}
        <div className="bg-white border-2 border-primary-200 rounded-lg p-6 mb-6 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">
                Pour garder le compteur visible pendant votre tricot :
              </h4>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Téléchargez le PDF du patron depuis {domain}</li>
                <li>Uploadez-le dans l'app avec le bouton ci-dessous</li>
                <li>Profitez du compteur + patron côte-à-côte ! ✨</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Bouton upload (principal) */}
          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="w-full px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-lg shadow-md"
            >
              📤 Uploader le PDF du patron
            </button>
          )}

          {/* Bouton lien (secondaire) */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            🔗 Ouvrir {domain} dans un nouvel onglet
          </a>
        </div>

        {/* Lien complet */}
        <p className="text-xs text-gray-500 mt-4 break-all">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline">
            {url}
          </a>
        </p>
      </div>
    </div>
  )
}

export default PatternLinkBlocked
