/**
 * @file Step4Optional.jsx
 * @brief Étape 4 - Options facultatives (patron, détails techniques, tags, favori)
 * @created 2026-01-27 by [AI:Claude]
 */

import { useState } from 'react'
import TagInput from '../../TagInput'

const Step4Optional = ({
  // Patron
  patternType,
  setPatternType,
  patternFile,
  setPatternFile,
  patternUrl,
  patternText,
  selectedLibraryPattern,
  onOpenLibraryModal,
  onOpenUrlModal,
  onOpenTextModal,
  // Détails techniques
  showTechnicalDetails,
  setShowTechnicalDetails,
  technicalForm,
  setTechnicalForm,
  technique,
  // Tags & Favoris
  canUseTags,
  projectTags,
  onAddTag,
  onRemoveTag,
  popularTags,
  isFavorite,
  setIsFavorite,
  onShowUpgradePrompt,
  // Description
  description,
  setDescription
}) => {
  const [fileDragOver, setFileDragOver] = useState(false)

  const handleFileDrop = (e) => {
    e.preventDefault()
    setFileDragOver(false)
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const f = Array.from(e.dataTransfer.files).find(f => allowed.includes(f.type))
    if (f) { setPatternFile(f); setPatternType('file') }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Options supplémentaires
        </h3>
        <p className="text-sm text-gray-600">
          Ces informations sont facultatives et peuvent être ajoutées plus tard
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Ex: Bonnet décontracté pour l'hiver"
        />
      </div>

      {/* Favori */}
      <label className="flex items-center gap-3 cursor-pointer group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
        <input
          type="checkbox"
          checked={isFavorite}
          onChange={(e) => setIsFavorite(e.target.checked)}
          className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2"
        />
        <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition">
          ⭐ Marquer comme favori
        </span>
      </label>

      {/* Tags */}
      {canUseTags ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🏷️ Tags
          </label>
          <TagInput
            tags={projectTags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            suggestions={popularTags.map(t => t.tag_name)}
            placeholder="Ex: cadeau, bébé, urgent..."
          />
        </div>
      ) : (
        <div className="bg-sage/10 rounded-lg p-4 border border-sage/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏷️</span>
            <span className="font-medium text-gray-800">Tags - Disponible en PRO</span>
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Premium
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Organisez vos projets avec des étiquettes personnalisées
          </p>
          <button
            type="button"
            onClick={onShowUpgradePrompt}
            className="text-sm text-primary hover:underline font-medium"
          >
            En savoir plus →
          </button>
        </div>
      )}

      {/* Import de patron */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Patron (optionnel)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Option 1: Bibliothèque */}
          <button
            type="button"
            onClick={onOpenLibraryModal}
            className={`p-3 border-2 border-dashed rounded-lg hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center ${patternType === 'library' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-xs font-medium">Bibliothèque</span>
            {selectedLibraryPattern && (
              <span className="text-xs text-primary-600 mt-1 truncate max-w-full">
                ✓ {selectedLibraryPattern.name}
              </span>
            )}
          </button>

          {/* Option 2: Fichier */}
          <label
            onDragOver={(e) => { e.preventDefault(); setFileDragOver(true) }}
            onDragLeave={() => setFileDragOver(false)}
            onDrop={handleFileDrop}
            className={`p-3 border-2 border-dashed rounded-lg hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center cursor-pointer ${
              fileDragOver ? 'border-primary-400 bg-primary-50' :
              patternType === 'file' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs font-medium">Fichier</span>
            <span className="text-xs text-gray-400 mt-0.5">PDF ou image</span>
            {patternFile && (
              <span className="text-xs text-primary-600 mt-1 truncate max-w-full">
                ✓ {patternFile.name.length > 15 ? patternFile.name.substring(0, 15) + '…' : patternFile.name}
              </span>
            )}
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              multiple
              onChange={(e) => {
                const f = e.target.files[0]
                if (f) { setPatternFile(f); setPatternType('file') }
              }}
              className="hidden"
            />
          </label>

          {/* Option 3: URL */}
          <button
            type="button"
            onClick={onOpenUrlModal}
            className={`p-3 border-2 border-dashed rounded-lg hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center ${patternType === 'url' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <span className="text-xs font-medium">Lien web</span>
            {patternUrl && (
              <span className="text-xs text-primary-600 mt-1">✓ Lien ajouté</span>
            )}
          </button>

          {/* Option 4: Texte */}
          <button
            type="button"
            onClick={onOpenTextModal}
            className={`p-3 border-2 border-dashed rounded-lg hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center ${patternType === 'text' ? 'border-primary-600 bg-primary-50' : 'border-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-1 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span className="text-xs font-medium">Texte</span>
            {patternText && (
              <span className="text-xs text-primary-600 mt-1">✓ Texte ajouté</span>
            )}
          </button>
        </div>

        {/* Bouton effacer patron */}
        {patternType && (
          <button
            type="button"
            onClick={() => {
              setPatternType('')
              setPatternFile(null)
            }}
            className="mt-2 text-xs text-red-500 hover:text-red-700"
          >
            ✕ Effacer le patron
          </button>
        )}
      </div>

      {/* Détails techniques (accordéon) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-700">
            🔧 Détails techniques (laine, aiguilles, échantillon)
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showTechnicalDetails && (
          <div className="p-4 space-y-4">
            {/* Laine */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                🧶 {technique === 'tricot' ? 'Laine' : 'Fil'}
              </h4>
              {technicalForm.yarn.map((y, yIdx) => (
                <div key={yIdx} className="mb-2 p-2 bg-white rounded border border-purple-100">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={y.brand}
                      onChange={(e) => {
                        const newYarn = [...technicalForm.yarn]
                        newYarn[yIdx].brand = e.target.value
                        setTechnicalForm({ ...technicalForm, yarn: newYarn })
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                      placeholder="Marque"
                    />
                    <input
                      type="text"
                      value={y.name}
                      onChange={(e) => {
                        const newYarn = [...technicalForm.yarn]
                        newYarn[yIdx].name = e.target.value
                        setTechnicalForm({ ...technicalForm, yarn: newYarn })
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                      placeholder="Nom"
                    />
                  </div>
                  {technicalForm.yarn.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTechnicalForm({
                        ...technicalForm,
                        yarn: technicalForm.yarn.filter((_, i) => i !== yIdx)
                      })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ✕ Supprimer
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTechnicalForm({
                  ...technicalForm,
                  yarn: [...technicalForm.yarn, { brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }]
                })}
                className="text-xs text-purple-600 hover:text-purple-700"
              >
                + Ajouter
              </button>
            </div>

            {/* Aiguilles/Crochets */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                {technique === 'tricot' ? '🪡 Aiguilles' : '🪝 Crochets'}
              </h4>
              {technicalForm.needles.map((n, nIdx) => (
                <div key={nIdx} className="mb-2 p-2 bg-white rounded border border-blue-100">
                  <div className={`grid gap-2 ${technique === 'tricot' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                    {technique === 'tricot' && (
                      <input
                        type="text"
                        value={n.type}
                        onChange={(e) => {
                          const newNeedles = [...technicalForm.needles]
                          newNeedles[nIdx].type = e.target.value
                          setTechnicalForm({ ...technicalForm, needles: newNeedles })
                        }}
                        className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="Type"
                      />
                    )}
                    <input
                      type="text"
                      value={n.size}
                      onChange={(e) => {
                        const newNeedles = [...technicalForm.needles]
                        newNeedles[nIdx].size = e.target.value
                        setTechnicalForm({ ...technicalForm, needles: newNeedles })
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                      placeholder="Taille (mm)"
                    />
                    {technique === 'tricot' && (
                      <input
                        type="text"
                        value={n.length}
                        onChange={(e) => {
                          const newNeedles = [...technicalForm.needles]
                          newNeedles[nIdx].length = e.target.value
                          setTechnicalForm({ ...technicalForm, needles: newNeedles })
                        }}
                        className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                        placeholder="Longueur"
                      />
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTechnicalForm({
                  ...technicalForm,
                  needles: [...technicalForm.needles, { type: '', size: '', length: '' }]
                })}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                + Ajouter
              </button>
            </div>

            {/* Échantillon */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">📏 Échantillon</h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={technicalForm.gauge.stitches}
                  onChange={(e) => setTechnicalForm({
                    ...technicalForm,
                    gauge: { ...technicalForm.gauge, stitches: e.target.value }
                  })}
                  className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="Mailles"
                />
                <input
                  type="text"
                  value={technicalForm.gauge.rows}
                  onChange={(e) => setTechnicalForm({
                    ...technicalForm,
                    gauge: { ...technicalForm.gauge, rows: e.target.value }
                  })}
                  className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="Rangs"
                />
                <input
                  type="text"
                  value={technicalForm.gauge.dimensions}
                  onChange={(e) => setTechnicalForm({
                    ...technicalForm,
                    gauge: { ...technicalForm.gauge, dimensions: e.target.value }
                  })}
                  className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="10x10 cm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Step4Optional
