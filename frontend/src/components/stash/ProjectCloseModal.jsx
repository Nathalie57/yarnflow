/**
 * @file ProjectCloseModal.jsx
 * @brief Modal de clôture de projet avec gestion des restes de laine
 */

import { useState, useEffect } from 'react'
import { stashAllocationAPI } from '../../services/api'

const ProjectCloseModal = ({ projectId, onClose, onConfirmed }) => {
  const [allocations, setAllocations] = useState([])
  const [usage, setUsage]             = useState({})
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)

  useEffect(() => {
    stashAllocationAPI.list(projectId)
      .then(res => {
        const allocs = res.data.allocations || []
        setAllocations(allocs)
        const initialUsage = {}
        allocs.forEach(a => { initialUsage[a.stash_entry_id] = a.quantity_reserved })
        setUsage(initialUsage)
      })
      .catch(() => setError('Impossible de charger les allocations.'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleClose = async () => {
    try {
      setSaving(true)
      setError(null)
      const usageData = allocations.map(a => ({
        stash_entry_id: a.stash_entry_id,
        quantity_used:  parseFloat(usage[a.stash_entry_id] ?? a.quantity_reserved),
      }))
      const res = await stashAllocationAPI.closeProject(projectId, usageData)
      const remainders = res.data.remainders || []
      onConfirmed(remainders)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la clôture.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Clôturer le projet</h2>
          <p className="text-xs text-gray-400 mt-0.5">Indique combien de pelotes tu as réellement utilisées</p>
        </div>

        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : allocations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucune laine réservée pour ce projet.</p>
          ) : (
            <div className="space-y-3">
              {allocations.map(a => {
                const used      = parseFloat(usage[a.stash_entry_id] ?? a.quantity_reserved)
                const remainder = Math.max(0, a.quantity_reserved - used)
                return (
                  <div key={a.stash_entry_id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.brand} — {a.yarn_name}</p>
                        {a.color_name && <p className="text-xs text-gray-400">{a.color_name}</p>}
                      </div>
                      <span className="text-xs text-gray-400">{a.quantity_reserved} réservée{a.quantity_reserved > 1 ? 's' : ''}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500 flex-shrink-0">Utilisées :</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setUsage(u => ({ ...u, [a.stash_entry_id]: Math.max(0, (parseFloat(u[a.stash_entry_id]) || 0) - 0.5) }))}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white text-sm"
                        >−</button>
                        <input
                          type="number"
                          min="0"
                          max={a.quantity_reserved}
                          step="0.5"
                          value={usage[a.stash_entry_id] ?? a.quantity_reserved}
                          onChange={e => setUsage(u => ({ ...u, [a.stash_entry_id]: e.target.value }))}
                          className="w-14 text-center text-sm font-semibold border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary-400"
                        />
                        <button
                          onClick={() => setUsage(u => ({ ...u, [a.stash_entry_id]: Math.min(a.quantity_reserved, (parseFloat(u[a.stash_entry_id]) || 0) + 0.5) }))}
                          disabled={used >= a.quantity_reserved}
                          className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white disabled:opacity-30 text-sm"
                        >+</button>
                      </div>
                    </div>

                    {remainder > 0 && (
                      <p className="mt-2 text-xs text-primary-600 bg-primary-50 rounded-lg px-2.5 py-1.5">
                        {Math.floor(remainder)} pelote{Math.floor(remainder) > 1 ? 's' : ''} remise{Math.floor(remainder) > 1 ? 's' : ''} en stock
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >Annuler</button>
          <button
            onClick={handleClose}
            disabled={saving || loading}
            className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >{saving ? 'Clôture…' : 'Clôturer le projet'}</button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCloseModal
