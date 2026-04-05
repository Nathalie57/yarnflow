/**
 * @file GaugeCalculator.jsx
 * @brief Outil : Calculateur d'échantillon
 *
 * Deux modes :
 *  1. "Combien de mailles/rangs pour X cm ?" — à partir de son propre échantillon
 *  2. "Mon échantillon diffère du patron" — adapter le nombre de mailles
 */

import { useState, useMemo } from 'react'
import SaveGaugeToProjectModal from './SaveGaugeToProjectModal'

export default function GaugeCalculator() {
  const [mode, setMode] = useState('simple') // simple | adapt
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Mode simple : mon échantillon → dimensions voulues → mailles/rangs
  const [myStsPer10, setMyStsPer10] = useState('')  // mailles pour 10cm
  const [myRowsPer10, setMyRowsPer10] = useState('') // rangs pour 10cm
  const [wantedWidthCm, setWantedWidthCm] = useState('')
  const [wantedHeightCm, setWantedHeightCm] = useState('')

  // Mode adaptation : échantillon patron vs mon échantillon
  const [patternStsPer10, setPatternStsPer10] = useState('')
  const [patternRows, setPatternRows] = useState('')    // mailles indiquées dans le patron
  const [myAdaptStsPer10, setMyAdaptStsPer10] = useState('')

  const simpleResult = useMemo(() => {
    const stsPer10 = parseFloat(myStsPer10)
    const rowsPer10 = parseFloat(myRowsPer10)
    const width = parseFloat(wantedWidthCm)
    const height = parseFloat(wantedHeightCm)

    const sts = width && stsPer10 ? Math.round((width / 10) * stsPer10) : null
    const rows = height && rowsPer10 ? Math.round((height / 10) * rowsPer10) : null

    return { sts, rows }
  }, [myStsPer10, myRowsPer10, wantedWidthCm, wantedHeightCm])

  const adaptResult = useMemo(() => {
    const pSts = parseFloat(patternStsPer10)
    const mySts = parseFloat(myAdaptStsPer10)
    const patRows = parseFloat(patternRows)
    if (!pSts || !mySts || !patRows) return null

    const adjusted = Math.round((patRows / pSts) * mySts)
    const diff = adjusted - patRows
    return { adjusted, diff, patRows }
  }, [patternStsPer10, myAdaptStsPer10, patternRows])

  return (
    <div className="space-y-5">
      {/* Mode */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('simple')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'simple' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Mes dimensions
        </button>
        <button
          onClick={() => setMode('adapt')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
            mode === 'adapt' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Adapter un patron
        </button>
      </div>

      {mode === 'simple' && (
        <>
          <div>
            <p className="text-xs text-gray-500 mb-3">Entrez votre échantillon (pour 10 cm)</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mailles / 10 cm</label>
                <input
                  type="number"
                  min="1"
                  value={myStsPer10}
                  onChange={e => setMyStsPer10(e.target.value)}
                  placeholder="ex: 20"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rangs / 10 cm</label>
                <input
                  type="number"
                  min="1"
                  value={myRowsPer10}
                  onChange={e => setMyRowsPer10(e.target.value)}
                  placeholder="ex: 28"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-3">Dimensions souhaitées</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Largeur (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={wantedWidthCm}
                  onChange={e => setWantedWidthCm(e.target.value)}
                  placeholder="ex: 50"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hauteur (cm)</label>
                <input
                  type="number"
                  min="1"
                  value={wantedHeightCm}
                  onChange={e => setWantedHeightCm(e.target.value)}
                  placeholder="ex: 60"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {(simpleResult.sts || simpleResult.rows) && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                {simpleResult.sts && (
                  <div>
                    <div className="text-3xl font-bold text-primary-700">{simpleResult.sts}</div>
                    <div className="text-sm text-primary-600 mt-1">mailles</div>
                    <div className="text-xs text-gray-500">pour {wantedWidthCm} cm</div>
                  </div>
                )}
                {simpleResult.rows && (
                  <div>
                    <div className="text-3xl font-bold text-primary-700">{simpleResult.rows}</div>
                    <div className="text-sm text-primary-600 mt-1">rangs</div>
                    <div className="text-xs text-gray-500">pour {wantedHeightCm} cm</div>
                  </div>
                )}
              </div>
              {myStsPer10 && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="w-full py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
                >
                  Enregistrer l'échantillon dans un projet →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {showSaveModal && (
        <SaveGaugeToProjectModal
          gauge={{ stitches: myStsPer10, rows: myRowsPer10 }}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {mode === 'adapt' && (
        <>
          <div>
            <p className="text-xs text-gray-500 mb-3">Échantillon indiqué dans le patron</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mailles / 10 cm (patron)</label>
                <input
                  type="number"
                  min="1"
                  value={patternStsPer10}
                  onChange={e => setPatternStsPer10(e.target.value)}
                  placeholder="ex: 20"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mailles indiquées</label>
                <input
                  type="number"
                  min="1"
                  value={patternRows}
                  onChange={e => setPatternRows(e.target.value)}
                  placeholder="ex: 100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-3">Mon propre échantillon</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes mailles / 10 cm</label>
              <input
                type="number"
                min="1"
                value={myAdaptStsPer10}
                onChange={e => setMyAdaptStsPer10(e.target.value)}
                placeholder="ex: 18"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {adaptResult && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 space-y-2">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-700">{adaptResult.adjusted}</div>
                <div className="text-sm text-primary-600 mt-1">mailles à monter</div>
              </div>
              <p className="text-sm text-primary-800 text-center pt-1">
                {adaptResult.diff === 0
                  ? 'Votre échantillon est identique au patron.'
                  : adaptResult.diff > 0
                    ? `Ajoutez ${adaptResult.diff} maille${adaptResult.diff > 1 ? 's' : ''} par rapport au patron.`
                    : `Retirez ${Math.abs(adaptResult.diff)} maille${Math.abs(adaptResult.diff) > 1 ? 's' : ''} par rapport au patron.`
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
