/**
 * @file YarnStash.jsx
 * @brief Page principale du stock de laine (Phase 1 — saisie manuelle)
 * @author Nathalie + AI Assistants
 * @created 2026-06-09
 */

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { yarnStashAPI, stashAllocationAPI } from '../services/api'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import YarnStashStats from '../components/stash/YarnStashStats'
import YarnStashCard from '../components/stash/YarnStashCard'
import YarnStashForm from '../components/stash/YarnStashForm'

const YarnStash = () => {
  const { getSubscriptionPlan } = useAuth()
  const navigate = useNavigate()
  const plan = getSubscriptionPlan()
  const isPro = plan === 'pro'
  const isPlus = plan === 'plus'
  const stashLimit = isPro ? null : isPlus ? 50 : 10

  // Data
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState(null)
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Filtres / tri
  const [filterBrand, setFilterBrand] = useState('')
  const [filterWeight, setFilterWeight] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  // Modales
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [deletingEntry, setDeletingEntry] = useState(null)

  // Modale assignation à un projet
  const [assigningEntry, setAssigningEntry] = useState(null)
  const [activeProjects, setActiveProjects] = useState([])
  const [assignProjectId, setAssignProjectId] = useState('')
  const [assignQuantity, setAssignQuantity] = useState(1)
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState(null)

  // -----------------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------------

  const loadStash = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {}
      if (filterBrand) params.brand = filterBrand
      if (filterWeight) params.yarn_weight_category = filterWeight
      if (searchQuery) params.search = searchQuery
      if (sortBy) params.sort = sortBy

      const res = await yarnStashAPI.getAll(params)
      setEntries(res.data.entries || [])
      setStats(res.data.stats || null)
      setBrands(res.data.brands || [])
    } catch (err) {
      setError('Impossible de charger le stock. Réessaie.')
    } finally {
      setLoading(false)
    }
  }, [filterBrand, filterWeight, searchQuery, sortBy])

  useEffect(() => { loadStash() }, [loadStash])

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  const handleCreate = async (data, photoFile) => {
    try {
      setSaving(true)
      const res = await yarnStashAPI.create(data)
      if (photoFile && res.data.entry?.id) {
        await yarnStashAPI.uploadPhoto(res.data.entry.id, photoFile)
      }
      setShowAddModal(false)
      loadStash()
    } catch (err) {
      if (err.response?.data?.upgrade_required) {
        setShowAddModal(false)
        setError('upgrade_required')
      } else {
        setError(err.response?.data?.error || 'Erreur lors de l\'ajout.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data, photoFile) => {
    try {
      setSaving(true)
      await yarnStashAPI.update(editingEntry.id, data)
      if (photoFile) {
        await yarnStashAPI.uploadPhoto(editingEntry.id, photoFile)
      }
      setEditingEntry(null)
      loadStash()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la modification.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingEntry) return
    try {
      await yarnStashAPI.delete(deletingEntry.id)
      setDeletingEntry(null)
      loadStash()
    } catch (err) {
      setError('Impossible de supprimer cette entrée.')
    }
  }

  // -----------------------------------------------------------------------
  // Limite FREE
  // -----------------------------------------------------------------------

  const atLimit = !isPro && stashLimit !== null && (stats?.total_references ?? 0) >= stashLimit

  const handleAssignClick = async (entry) => {
    setAssigningEntry(entry)
    setAssignQuantity(1)
    setAssignProjectId('')
    setAssignError(null)
    try {
      const res = await api.get('/projects?status=in_progress&limit=50')
      setActiveProjects(res.data.projects || [])
    } catch {
      setActiveProjects([])
    }
  }

  const handleAssignConfirm = async () => {
    if (!assignProjectId) { setAssignError('Sélectionnez un projet.'); return }
    setAssignSaving(true)
    setAssignError(null)
    try {
      await stashAllocationAPI.create(assignProjectId, assigningEntry.id, assignQuantity)
      setAssigningEntry(null)
      loadStash()
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Erreur lors de la réservation.')
    } finally {
      setAssignSaving(false)
    }
  }

  const handleAddClick = () => {
    if (atLimit) {
      setError('upgrade_required')
      return
    }
    setShowAddModal(true)
  }

  // -----------------------------------------------------------------------
  // Rendu
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* ---- Retour ---- */}
        <Link to="/bibliotheque" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Ressources
        </Link>

        {/* ---- En-tête ---- */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mon Stock</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ton inventaire de pelotes</p>
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter
          </button>
        </div>

        {/* ---- Bandeau upgrade FREE ---- */}
        {!isPro && stashLimit !== null && stats && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <span className="text-sm text-amber-800">
              <span className="font-semibold">{stats.total_references}/{stashLimit}</span> références utilisées
            </span>
            {atLimit ? (
              <Link
                to="/subscription"
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                {isPlus ? 'Passer à Pro →' : 'Passer à Plus ou Pro →'}
              </Link>
            ) : (
              <span className="text-xs text-amber-600">{isPlus ? 'Plan Plus' : 'Plan Free'}</span>
            )}
          </div>
        )}

        {/* ---- Erreur générique ---- */}
        {error && error !== 'upgrade_required' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ---- Upgrade prompt ---- */}
        {error === 'upgrade_required' && (
          <div className="mb-4 bg-gradient-to-br from-primary-50 to-violet-50 border border-primary-200 rounded-xl p-5 text-center">
            <p className="font-semibold text-gray-800 mb-1">Votre placard déborde de pépites !</p>
            <p className="text-sm text-gray-600 mb-4">
              Passez à la version Pro pour débloquer le stock illimité, le futur scanner de code-barres
              et la liaison automatique avec vos projets.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white transition-colors"
              >
                Pas maintenant
              </button>
              <Link
                to="/subscription"
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                Voir les offres Pro
              </Link>
            </div>
          </div>
        )}

        {/* ---- Stats ---- */}
        {stats && !loading && <YarnStashStats stats={stats} />}

        {/* ---- Filtres & Tri ---- */}
        {entries.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <input
              type="text"
              placeholder="Rechercher…"
              className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 placeholder-gray-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {brands.length > 1 && (
              <select
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-600"
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
              >
                <option value="">Toutes les marques</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <select
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-600"
              value={filterWeight}
              onChange={(e) => setFilterWeight(e.target.value)}
            >
              <option value="">Toutes les épaisseurs</option>
              <option value="lace">Lace</option>
              <option value="fingering">Fingering</option>
              <option value="sport">Sport</option>
              <option value="dk">DK</option>
              <option value="worsted">Worsted</option>
              <option value="aran">Aran</option>
              <option value="bulky">Bulky</option>
              <option value="super_bulky">Super Bulky</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 text-gray-600"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Plus récent</option>
              <option value="date_asc">Plus ancien</option>
              <option value="brand_asc">Marque A→Z</option>
              <option value="quantity_desc">Quantité ↓</option>
            </select>
          </div>
        )}

        {/* ---- Liste ---- */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-3" />
            Chargement…
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-semibold text-gray-700 mb-2">Ton stock est vide</p>
            <p className="text-sm text-gray-400">Ajoute ta première pelote pour commencer l'inventaire.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map(e => (
              <YarnStashCard
                key={e.id}
                entry={e}
                onEdit={setEditingEntry}
                onDelete={setDeletingEntry}
                onAssign={handleAssignClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================
          Modal Ajout
      ==================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nouvelle pelote</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <YarnStashForm
                entry={null}
                onSubmit={handleCreate}
                onCancel={() => setShowAddModal(false)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          Modal Édition
      ==================================================================== */}
      {editingEntry && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Modifier la pelote</h2>
              <button onClick={() => setEditingEntry(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <YarnStashForm
                entry={editingEntry}
                onSubmit={handleUpdate}
                onCancel={() => setEditingEntry(null)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          Confirmation suppression
      ==================================================================== */}
      {/* ===================================================================
          Assignation à un projet
      ==================================================================== */}
      {assigningEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Utiliser pour un projet</h2>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{assigningEntry.brand} — {assigningEntry.yarn_name}</strong>
              {assigningEntry.color_name ? ` (${assigningEntry.color_name})` : ''}
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Projet</label>
                <select
                  value={assignProjectId}
                  onChange={e => setAssignProjectId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="">Sélectionner un projet…</option>
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {activeProjects.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Aucun projet en cours trouvé.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Quantité à réserver (disponible : {assigningEntry.quantity_available ?? assigningEntry.quantity})
                </label>
                <input
                  type="number"
                  min={1}
                  max={assigningEntry.quantity_available ?? assigningEntry.quantity}
                  value={assignQuantity}
                  onChange={e => setAssignQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            {assignError && <p className="text-xs text-red-500 mb-3">{assignError}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setAssigningEntry(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignConfirm}
                disabled={assignSaving}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {assignSaving ? 'Réservation…' : 'Réserver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center">
            <h2 className="font-semibold text-gray-900 mb-1">Supprimer cette entrée ?</h2>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{deletingEntry.brand} — {deletingEntry.yarn_name}</strong>
              {deletingEntry.color_name ? ` (${deletingEntry.color_name})` : ''}
              {' '}sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingEntry(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default YarnStash
