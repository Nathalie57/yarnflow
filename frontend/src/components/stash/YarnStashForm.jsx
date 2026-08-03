/**
 * @file YarnStashForm.jsx
 * @brief Formulaire d'ajout / modification d'une entrée dans le stock de laine
 */

import { useState, useEffect, useRef } from 'react'
import { yarnStashAPI } from '../../services/api'
import { useTranslation } from 'react-i18next'

const YARN_WEIGHT_OPTIONS = [
  { value: '',            labelKey: 'weightOptional' },
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
  const { t } = useTranslation('tools')
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [extraPhotoFile, setExtraPhotoFile] = useState(null)
  const [extraPhotoPreview, setExtraPhotoPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState(null)
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const photoSlotRef = useRef('main') // 'main' | 'extra' — quelle photo cible le prochain choix de fichier

  useEffect(() => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setExtraPhotoFile(null)
    setExtraPhotoPreview(null)
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

  const openPhotoInput = (slot, ref) => {
    photoSlotRef.current = slot
    ref.current?.click()
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const slot = photoSlotRef.current
    // Fichiers de l'AUTRE slot (avant mise à jour du state courant) pour combiner les 2 photos au scan
    const otherFile = slot === 'extra' ? photoFile : extraPhotoFile

    if (slot === 'extra') {
      setExtraPhotoFile(file)
      setExtraPhotoPreview(URL.createObjectURL(file))
    } else {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
    setScanError(null)

    // Scan automatique uniquement pour une nouvelle entrée ou si les champs clés sont vides
    const isEmpty = !form.brand && !form.yarn_name
    if (!entry || isEmpty) {
      try {
        setScanning(true)
        const scanTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 30000)
        )
        const filesToScan = slot === 'extra' ? [otherFile, file].filter(Boolean) : [file, otherFile].filter(Boolean)
        const res = await Promise.race([yarnStashAPI.scanLabel(filesToScan), scanTimeout])
        const d = res.data.data
        setForm(f => ({
          ...f,
          brand:                d.brand              ?? f.brand,
          yarn_name:            d.yarn_name          ?? f.yarn_name,
          color_name:           d.color_name         ?? f.color_name,
          color_hex:            d.color_hex          ?? f.color_hex,
          dye_lot:              d.dye_lot            ?? f.dye_lot,
          composition:          d.composition        ?? f.composition,
          weight_per_skein_g:   d.weight_per_skein_g  != null ? d.weight_per_skein_g  : f.weight_per_skein_g,
          yardage_per_skein_m:  d.yardage_per_skein_m != null ? d.yardage_per_skein_m : f.yardage_per_skein_m,
          needle_size_mm:       d.needle_size_mm      != null ? d.needle_size_mm      : f.needle_size_mm,
          yarn_weight_category: d.yarn_weight_category ?? f.yarn_weight_category,
        }))
      } catch (err) {
        const msg = err?.message === 'timeout'
          ? t('ui.scanTooLong')
          : (err?.response?.data?.error || t('ui.scanImpossible'))
        setScanError(msg)
      } finally {
        setScanning(false)
      }
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setExtraPhotoFile(null)
    setExtraPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const removeExtraPhoto = () => {
    setExtraPhotoFile(null)
    setExtraPhotoPreview(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    payload.weight_per_skein_g  = parseFloat(payload.weight_per_skein_g)
    payload.yardage_per_skein_m = parseFloat(payload.yardage_per_skein_m)
    payload.quantity            = parseInt(payload.quantity)
    payload.needle_size_mm      = payload.needle_size_mm !== '' ? parseFloat(payload.needle_size_mm) : null
    ;['color_name','dye_lot','composition','yarn_weight_category','color_hex','purchase_url','notes'].forEach(k => {
      if (payload[k] === '') payload[k] = null
    })
    onSubmit(payload, photoFile)
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-gray-300"
  const labelCls = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo d'étiquette — en premier pour auto-remplir */}
      {!entry && (
        <div>
          {scanError && (
            <p className="mb-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{scanError}</p>
          )}
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt={t('ui.labelAlt')}
                className={`w-full h-40 object-cover rounded-xl border border-gray-200 transition-opacity ${scanning ? 'opacity-50' : ''}`}
              />
              {scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 rounded-xl">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium text-primary-700">{t('ui.readingLabel')}</span>
                </div>
              )}
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg shadow text-gray-500 hover:text-red-500 transition-colors"
                title={t('ui.deletePhoto')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openPhotoInput('main', fileInputRef)}
              className="w-full h-24 border-2 border-dashed border-primary-200 bg-primary-50/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-primary-400 hover:border-primary-400 hover:text-primary-600 transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
              <span className="text-xs font-medium">{t('ui.labelPhotoHint')}</span>
            </button>
          )}
          {!photoPreview && (
            <button
              type="button"
              onClick={() => openPhotoInput('main', galleryInputRef)}
              className="w-full mt-2 text-xs text-gray-400 hover:text-primary-600 transition-colors"
            >
              ou importer une photo existante
            </button>
          )}

          {/* 2e photo — l'étiquette est enroulée autour de la pelote, une seule vue ne suffit pas toujours */}
          {photoPreview && (
            extraPhotoPreview ? (
              <div className="relative inline-block mt-2">
                <img
                  src={extraPhotoPreview}
                  alt={t('ui.labelAltOther')}
                  className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeExtraPhoto}
                  className="absolute -top-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
                  title={t('ui.deleteThisPhoto')}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => openPhotoInput('extra', fileInputRef)}
                  className="text-primary-500 hover:text-primary-700 font-medium"
                >
                  + Ajouter une 2e photo (si l'étiquette ne tenait pas entièrement dans le cadre)
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={() => openPhotoInput('extra', galleryInputRef)}
                  className="text-gray-400 hover:text-primary-600"
                >
                  importer
                </button>
              </div>
            )
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {!photoPreview && (
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{t('ui.orFillManually')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}
        </div>
      )}

      {/* Marque + Gamme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Marque *</label>
          <input
            type="text" required
            className={inputCls}
            placeholder={t('ui.phYarnBrand')}
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
            placeholder={t('ui.phYarnName')}
            value={form.yarn_name}
            onChange={set('yarn_name')}
            maxLength={150}
          />
        </div>
      </div>

      {/* Coloris + Numéro de bain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t('ui.colorwayName')}</label>
          <input
            type="text"
            className={inputCls}
            placeholder={t('ui.phColorway')}
            value={form.color_name}
            onChange={set('color_name')}
            maxLength={100}
          />
        </div>
        <div>
          <label className={labelCls}>{t('ui.dyeLot')}</label>
          <input
            type="text"
            className={inputCls}
            placeholder={t('ui.phDyeLot')}
            value={form.dye_lot}
            onChange={set('dye_lot')}
            maxLength={50}
          />
        </div>
      </div>

      {/* Composition + Couleur hex */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t('ui.composition')}</label>
          <input
            type="text"
            className={inputCls}
            placeholder={t('ui.phComposition')}
            value={form.composition}
            onChange={set('composition')}
            maxLength={200}
          />
        </div>
        <div>
          <label className={labelCls}>{t('ui.color')}</label>
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
          <label className={labelCls}>{t('ui.yardagePerBall')}</label>
          <input
            type="number" required min="1" step="0.1"
            className={inputCls}
            placeholder="190"
            value={form.yardage_per_skein_m}
            onChange={setNum('yardage_per_skein_m')}
          />
        </div>
        <div>
          <label className={labelCls}>{t('ui.quantityRequired')}</label>
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
          <label className={labelCls}>{t('ui.weight')}</label>
          <select
            className={inputCls}
            value={form.yarn_weight_category}
            onChange={set('yarn_weight_category')}
          >
            {YARN_WEIGHT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.labelKey ? t(`ui.${o.labelKey}`) : o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('ui.recommendedNeedle')}</label>
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
        <label className={labelCls}>{t('ui.purchaseLink')}</label>
        <input
          type="url"
          className={inputCls}
          placeholder={t('ui.phPurchaseUrl')}
          value={form.purchase_url}
          onChange={set('purchase_url')}
          maxLength={500}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>{t('ui.freeNotes')}</label>
        <textarea
          rows={3}
          className={inputCls + ' resize-none'}
          placeholder={t('ui.phStashNotes')}
          value={form.notes}
          onChange={set('notes')}
          maxLength={2000}
        />
      </div>

      {/* Photo d'étiquette — mode édition uniquement (en création elle est en haut) */}
      {entry && (
        <div>
          <label className={labelCls}>{t('ui.labelPhoto')}</label>
          {scanError && (
            <p className="mb-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{scanError}</p>
          )}
          {photoPreview || entry.photo_url ? (
            <div className="relative">
              <img
                src={photoPreview || (import.meta.env.VITE_API_URL + entry.photo_url)}
                alt={t('ui.labelAlt')}
                className="w-full h-40 object-cover rounded-xl border border-gray-200"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg shadow text-gray-500 hover:text-red-500 transition-colors"
                title={t('ui.deletePhoto')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {!photoPreview && (
                <div className="absolute bottom-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openPhotoInput('main', galleryInputRef)}
                    className="bg-white/90 px-2.5 py-1 rounded-lg shadow text-xs text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {t('ui.gallery')}
                  </button>
                  <button
                    type="button"
                    onClick={() => openPhotoInput('main', fileInputRef)}
                    className="bg-white/90 px-2.5 py-1 rounded-lg shadow text-xs text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {t('ui.change')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openPhotoInput('main', fileInputRef)}
                className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-xs">{t('ui.addPhoto')}</span>
              </button>
              <button
                type="button"
                onClick={() => openPhotoInput('main', galleryInputRef)}
                className="w-full mt-2 text-xs text-gray-400 hover:text-primary-600 transition-colors"
              >
                ou importer une photo existante
              </button>
            </>
          )}

          {/* 2e photo — l'étiquette est enroulée autour de la pelote, une seule vue ne suffit pas toujours */}
          {photoPreview && (
            extraPhotoPreview ? (
              <div className="relative inline-block mt-2">
                <img
                  src={extraPhotoPreview}
                  alt={t('ui.labelAltOther')}
                  className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeExtraPhoto}
                  className="absolute -top-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow text-gray-500 hover:text-red-500 transition-colors"
                  title={t('ui.deleteThisPhoto')}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => openPhotoInput('extra', fileInputRef)}
                  className="text-primary-500 hover:text-primary-700 font-medium"
                >
                  + Ajouter une 2e photo (si l'étiquette ne tenait pas entièrement dans le cadre)
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={() => openPhotoInput('extra', galleryInputRef)}
                  className="text-gray-400 hover:text-primary-600"
                >
                  importer
                </button>
              </div>
            )
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {t('ui.cancel')}
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
