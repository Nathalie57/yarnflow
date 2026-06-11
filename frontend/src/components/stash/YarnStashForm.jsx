/**
 * @file YarnStashForm.jsx
 * @brief Formulaire d'ajout / modification d'une entrée dans le stock de laine
 */

import { useState, useEffect } from 'react'

const YARN_WEIGHT_OPTIONS = [
  { value: '',            label: 'Épaisseur (optionnel)' },
  { value: 'lace',        label: 'Lace' },
  { value: 'fingering',   label: 'Fingering' },
  { value: 'sport',       label: 'Sport' },
  { value: 'dk',          label: 'DK' },
  { value: 'worsted',     label: 'Worsted' },
  { value: 'aran',        label: 'Aran' },
  { value: 'bulky',       label: 'Bulky' },
  { value: 'super_bulky', label: 'Super Bulky' },
]

const EMPTY_FORM = {
  brand: '',
  yarn_name: '',
  color_name: '',
  dye_lot: '',
  composition: '',
  weight_per_skein_g: '',
  yardage_per_skein_m: '',
  quantity: 1,
  needle_size_mm: '',
  yarn_weight_category: '',
  color_hex: '',
  purchase_url: '',
  notes: '',
}

const YarnStashForm = ({ entry, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (entry) {
      setForm({
        brand:                entry.brand              || '',
        yarn_name:            entry.yarn_name          || '',
        color_name:           entry.color_name         || '',
        dye_lot:              entry.dye_lot            || '',
        composition:          entry.composition        || '',
        weight_per_skein_g:   entry.weight_per_skein_g ?? '',
        yardage_per_skein_m:  entry.yardage_per_skein_m ?? '',
        quantity:             entry.quantity           ?? 1,
        needle_size_mm:       entry.needle_size_mm     || '',
        yarn_weight_category: entry.yarn_weight_category || '',
        color_hex:            entry.color_hex          || '',
        purchase_url:         entry.purchase_url       || '',
        notes:                entry.notes              || '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [entry])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const setNum = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value === '' ? '' : Number(e.target.value) }))

  const totalWeight  = form.weight_per_skein_g  && form.quantity ? Math.round(parseFloat(form.weight_per_skein_g)  * parseInt(form.quantity) * 10) / 10 : 0
  const totalYardage = form.yardage_per_skein_m && form.quantity ? Math.round(parseFloat(form.yardage_per_skein_m) * parseInt(form.quantity) * 10) / 10 : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    // Convertir les numériques
    payload.weight_per_skein_g  = parseFloat(payload.weight_per_skein_g)
    payload.yardage_per_skein_m = parseFloat(payload.yardage_per_skein_m)
    payload.quantity            = parseInt(payload.quantity)
    payload.needle_size_mm      = payload.needle_size_mm !== '' ? parseFloat(payload.needle_size_mm) : null
    // Vider les optionnels vides → null
    ;['color_name','dye_lot','composition','yarn_weight_category','color_hex','purchase_url','notes'].forEach(k => {
      if (payload[k] === '') payload[k] = null
    })
    onSubmit(payload)
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-gray-300"
  const labelCls = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Marque + Gamme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Marque *</label>
          <input
            type="text" required
            className={inputCls}
            placeholder="Ex: Drops, Phildar, Fonty…"
            value={form.brand}
            onChange={set('brand')}
            maxLength={100}
          />
        </div>
        <div>
          <label className={labelCls}>Gamme *</label>
          <input
            type="text" required
            className={inputCls}
            placeholder="Ex: Merino Extra Fine"
            value={form.yarn_name}
            onChange={set('yarn_name')}
            maxLength={150}
          />
        </div>
      </div>

      {/* Coloris + Numéro de bain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nom du coloris</label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ex: Turquoise"
            value={form.color_name}
            onChange={set('color_name')}
            maxLength={100}
          />
        </div>
        <div>
          <label className={labelCls}>Numéro de bain</label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ex: 2024-A"
            value={form.dye_lot}
            onChange={set('dye_lot')}
            maxLength={50}
          />
        </div>
      </div>

      {/* Composition + Couleur hex */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Composition</label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ex: 100% Mérinos"
            value={form.composition}
            onChange={set('composition')}
            maxLength={200}
          />
        </div>
        <div>
          <label className={labelCls}>Couleur</label>
          <div className="flex gap-2">
            <input
              type="color"
              className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0"
              value={form.color_hex || '#e5e7eb'}
              onChange={(e) => setForm(f => ({ ...f, color_hex: e.target.value }))}
            />
            <input
              type="text"
              className={inputCls}
              placeholder="#hexcode"
              value={form.color_hex}
              onChange={set('color_hex')}
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Poids + Métrage + Quantité */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Poids/pelote (g) *</label>
          <input
            type="number" required min="0.1" step="0.1"
            className={inputCls}
            placeholder="50"
            value={form.weight_per_skein_g}
            onChange={setNum('weight_per_skein_g')}
          />
        </div>
        <div>
          <label className={labelCls}>Métrage/pelote (m) *</label>
          <input
            type="number" required min="1" step="0.1"
            className={inputCls}
            placeholder="190"
            value={form.yardage_per_skein_m}
            onChange={setNum('yardage_per_skein_m')}
          />
        </div>
        <div>
          <label className={labelCls}>Quantité *</label>
          <input
            type="number" required min="1" step="1"
            className={inputCls}
            placeholder="6"
            value={form.quantity}
            onChange={setNum('quantity')}
          />
        </div>
      </div>

      {/* Calcul automatique */}
      {(totalWeight > 0 || totalYardage > 0) && (
        <div className="bg-primary-50 rounded-xl p-3 text-sm text-primary-700 text-center font-medium">
          Total : <strong>{totalWeight} g</strong> · <strong>{totalYardage} m</strong>
        </div>
      )}

      {/* Épaisseur + Aiguille */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Épaisseur</label>
          <select
            className={inputCls}
            value={form.yarn_weight_category}
            onChange={set('yarn_weight_category')}
          >
            {YARN_WEIGHT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Aiguille recommandée (mm)</label>
          <input
            type="number" min="1" max="30" step="0.5"
            className={inputCls}
            placeholder="3.5"
            value={form.needle_size_mm}
            onChange={setNum('needle_size_mm')}
          />
        </div>
      </div>

      {/* Lien d'achat */}
      <div>
        <label className={labelCls}>Lien d'achat</label>
        <input
          type="url"
          className={inputCls}
          placeholder="Ex: https://www.laines-et-cie.fr/..."
          value={form.purchase_url}
          onChange={set('purchase_url')}
          maxLength={500}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes libres</label>
        <textarea
          rows={3}
          className={inputCls + ' resize-none'}
          placeholder="Impressions, projets envisagés, où ça a été acheté…"
          value={form.notes}
          onChange={set('notes')}
          maxLength={2000}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? 'Enregistrement…' : (entry ? 'Enregistrer' : 'Ajouter au stock')}
        </button>
      </div>
    </form>
  )
}

export default YarnStashForm
