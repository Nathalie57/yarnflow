/**
 * @file StashAllocationPanel.jsx
 * @brief Panneau "Piocher dans mon stock" dans un projet — Phase 3 Stash
 */

import { useState, useEffect } from 'react'
import { yarnStashAPI, stashAllocationAPI } from '../../services/api'

const API_URL = import.meta.env.VITE_API_URL || ''

const StashAllocationPanel = ({ projectId, onClose }) => {
  const [allocations, setAllocations]   = useState([])
  const [stashEntries, setStashEntries] = useState([])
  const [loading, setLoading]           = useState(true)
  const [adding, setAdding]             = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [quantity, setQuantity]         = useState(1)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [allocRes, stashRes] = await Promise.all([
        stashAllocationAPI.list(projectId),
        yarnStashAPI.getAll({}),
      ])
      setAllocations(allocRes.data.allocations || [])
      setStashEntries(stashRes.data.entries || [])
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [projectId])

  const allocatedIds = new Set(allocations.map(a => a.stash_entry_id))
  const availableEntries = stashEntries.filter(e => !allocatedIds.has(e.id) && e.quantity_available > 0)

  const handleAdd = async () => {
    if (!selectedEntry) return
    try {
      setSaving(true)
      setError(null)
      await stashAllocationAPI.create(projectId, selectedEntry.id, quantity)
      setAdding(false)
      setSelectedEntry(null)
      setQuantity(1)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réservation.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (stashEntryId) => {
    try {
      await stashAllocationAPI.remove(projectId, stashEntryId)
      await loadData()
    } catch {
      setError('Impossible de supprimer la réservation.')
    }
  }

  const handleQuantityChange = async (stashEntryId, newQty) => {
    if (newQty < 1) return
    try {
      await stashAllocationAPI.update(projectId, stashEntryId, newQty)
      await loadData()
    } catch {
      setError('Impossible de mettre à jour la quantité.')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Piocher dans mon stock</h2>
          <p className="text-xs text-gray-400 mt-0.5">Réserve des pelotes pour ce projet</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {loading ? (
          <div className="text-center py-10 text-gray-400">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Chargement…
          </div>
        ) : (
          <>
            {/* Allocations existantes */}
            {allocations.length > 0 && (
              <div className="space-y-2">
                {allocations.map(a => (
                  <div key={a.stash_entry_id} className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                    {a.photo_url ? (
                      <img src={API_URL + a.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-primary-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.brand} — {a.yarn_name}</p>
                      {a.color_name && <p className="text-xs text-gray-500 truncate">{a.color_name}</p>}
                      <p className="text-xs text-primary-600 mt-0.5">
                        {Math.round(a.total_reserved_g)} g · {Math.round(a.total_reserved_m)} m
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleQuantityChange(a.stash_entry_id, a.quantity_reserved - 1)}
                        disabled={a.quantity_reserved <= 1}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-sm"
                      >−</button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-800">{a.quantity_reserved}</span>
                      <button
                        onClick={() => handleQuantityChange(a.stash_entry_id, a.quantity_reserved + 1)}
                        disabled={a.quantity_reserved >= a.stock_quantity}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 text-sm"
                      >+</button>
                    </div>
                    <button
                      onClick={() => handleRemove(a.stash_entry_id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bouton ajouter */}
            {!adding && availableEntries.length > 0 && (
              <button
                onClick={() => setAdding(true)}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Ajouter une laine
              </button>
            )}

            {/* Formulaire d'ajout */}
            {adding && (
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Choisir une laine du stock</p>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEntries.map(e => (
                    <button
                      key={e.id}
                      onClick={() => { setSelectedEntry(e); setQuantity(1) }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                        selectedEntry?.id === e.id
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {e.photo_url ? (
                        <img src={API_URL + e.photo_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex-shrink-0" style={{ backgroundColor: e.color_hex || '#e5e7eb' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{e.brand} — {e.yarn_name}</p>
                        <p className="text-xs text-gray-400">{e.quantity_available} disponible{e.quantity_available > 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedEntry && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-sm text-gray-600 flex-shrink-0">Quantité :</label>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                      <span className="w-8 text-center font-semibold text-gray-800">{quantity}</span>
                      <button onClick={() => setQuantity(q => Math.min(selectedEntry.quantity_available, q + 1))} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                    </div>
                    <span className="text-xs text-gray-400">/ {selectedEntry.quantity_available} dispo</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setAdding(false); setSelectedEntry(null) }}
                    className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                  >Annuler</button>
                  <button
                    onClick={handleAdd}
                    disabled={!selectedEntry || saving}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                  >{saving ? 'Réservation…' : 'Réserver'}</button>
                </div>
              </div>
            )}

            {allocations.length === 0 && !adding && availableEntries.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Ton stock est vide ou toutes les pelotes sont déjà réservées.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default StashAllocationPanel
