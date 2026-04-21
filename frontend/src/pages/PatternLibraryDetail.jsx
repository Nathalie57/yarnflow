/**
 * @file PatternLibraryDetail.jsx
 * @brief Page de détails d'un patron de la bibliothèque
 * @author Nathalie + AI Assistants
 * @created 2025-12-25
 * @modified 2026-04-11 by [AI:Claude] - Refonte UX : layout 2 colonnes, liaison projets, nettoyage emojis
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import PDFViewer from '../components/PDFViewer'
import ImageLightbox from '../components/ImageLightbox'
import ProxyViewer from '../components/ProxyViewer'

const PatternLibraryDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [pattern, setPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [loadingFile, setLoadingFile] = useState(false)

  // Multi-fichiers
  const [additionalFiles, setAdditionalFiles] = useState([])
  const [additionalFileUrls, setAdditionalFileUrls] = useState({}) // { fileId: blobUrl }
  const [selectedFileId, setSelectedFileId] = useState(null) // null = fichier principal
  const [uploadingFile, setUploadingFile] = useState(false)
  const [showAddFilesModal, setShowAddFilesModal] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)

  // États modales
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showImageLightbox, setShowImageLightbox] = useState(false)
  const [showTextFullscreen, setShowTextFullscreen] = useState(false)
  const [showLinkProjectModal, setShowLinkProjectModal] = useState(false)

  // Liaison projet
  const [userProjects, setUserProjects] = useState([])
  const [linkedProjects, setLinkedProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [linkingProject, setLinkingProject] = useState(false)

  // Notes d'utilisation
  const [usageNotes, setUsageNotes] = useState([])
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteProjectId, setNewNoteProjectId] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  // Formulaire édition
  const [formData, setFormData] = useState({
    name: '', description: '', url: '', pattern_text: '',
    category: '', technique: '', difficulty: '', notes: ''
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [editType, setEditType] = useState('file')

  const isPro = user?.subscription_type && user.subscription_type !== 'free'

  const getCategoryLabel = (category) => {
    const translations = {
      'other': 'Autre', 'Vêtements': 'Vêtements', 'Accessoires': 'Accessoires',
      'Maison/Déco': 'Maison/Déco', 'Jouets/Peluches': 'Jouets/Peluches',
      'Accessoires bébé': 'Accessoires bébé'
    }
    return translations[category] || category
  }

  useEffect(() => {
    fetchPattern()
  }, [id])

  const fetchPattern = async (forceReloadFile = false) => {
    try {
      setLoading(true)
      const response = await api.get(`/pattern-library/${id}`)
      const p = response.data.pattern
      setPattern(p)

      if (p.source_type === 'file' && p.file_path) {
        if (forceReloadFile && fileUrl) {
          window.URL.revokeObjectURL(fileUrl)
          setFileUrl(null)
        }
        loadFile(id)
      }

      // Charger les projets liés si disponibles
      if (response.data.linked_projects) {
        setLinkedProjects(response.data.linked_projects)
      }

      // Charger les fichiers additionnels
      if (response.data.additional_files) {
        setAdditionalFiles(response.data.additional_files)
      }

      // Charger les notes d'utilisation + projets pour le sélecteur (PRO)
      if (isPro) {
        try {
          const [notesRes, projectsRes] = await Promise.all([
            api.get(`/pattern-library/${id}/notes`),
            api.get('/projects')
          ])
          setUsageNotes(notesRes.data.notes || [])
          setUserProjects(projectsRes.data.projects || [])
        } catch { /* non bloquant */ }
      }
    } catch (err) {
      console.error('Erreur chargement patron:', err)
      setError('Impossible de charger le patron')
    } finally {
      setLoading(false)
    }
  }

  const loadFile = async (patternId) => {
    try {
      setLoadingFile(true)
      const cacheBuster = `?t=${Date.now()}`
      const response = await api.get(`/pattern-library/${patternId}/file${cacheBuster}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      setFileUrl(url)
    } catch (err) {
      console.error('Erreur chargement fichier:', err)
    } finally {
      setLoadingFile(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      await api.put(`/pattern-library/${id}`, { is_favorite: !pattern.is_favorite })
      setPattern({ ...pattern, is_favorite: !pattern.is_favorite })
    } catch (err) {
      console.error('Erreur favori:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patron ?')) return
    try {
      await api.delete(`/pattern-library/${id}`)
      navigate('/pattern-library')
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleEdit = () => {
    setEditType(pattern.source_type)
    setFormData({
      name: pattern.name || '', description: pattern.description || '',
      url: pattern.url || '', pattern_text: pattern.pattern_text || '',
      category: pattern.category || '', technique: pattern.technique || '',
      difficulty: pattern.difficulty || '', notes: pattern.notes || ''
    })
    setFile(null)
    setValidationErrors({})
    setShowEditModal(true)
  }

  const openLinkProjectModal = async () => {
    setShowLinkProjectModal(true)
    setLoadingProjects(true)
    try {
      const response = await api.get('/projects')
      setUserProjects(response.data.projects || [])
    } catch (err) {
      console.error('Erreur chargement projets:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleLinkProject = async (projectId) => {
    setLinkingProject(projectId)
    try {
      await api.post(`/projects/${projectId}/pattern-from-library`, { pattern_library_id: id })
      // Mettre à jour le compteur de liaisons localement
      setPattern(prev => ({ ...prev, times_used: (prev.times_used || 0) + 1 }))
      setShowLinkProjectModal(false)
      // Recharger pour avoir les projets liés à jour
      fetchPattern()
    } catch (err) {
      console.error('Erreur liaison projet:', err)
      alert('Erreur lors de la liaison du projet')
    } finally {
      setLinkingProject(false)
    }
  }

  // Charger le blob d'un fichier additionnel
  const loadAdditionalFileBlob = async (fileId) => {
    if (additionalFileUrls[fileId]) return // déjà chargé
    try {
      const response = await api.get(`/pattern-library/${id}/files/${fileId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      setAdditionalFileUrls(prev => ({ ...prev, [fileId]: url }))
    } catch (err) {
      console.error('Erreur chargement fichier additionnel:', err)
    }
  }

  const handleSelectFile = (fileId) => {
    setSelectedFileId(fileId)
    if (fileId !== null) {
      loadAdditionalFileBlob(fileId)
    }
  }

  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const addPendingFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => ALLOWED_TYPES.includes(f.type))
    if (valid.length < newFiles.length) {
      alert('Certains fichiers ont été ignorés (formats acceptés : PDF, JPG, PNG, WEBP)')
    }
    setPendingFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    addPendingFiles(e.dataTransfer.files)
  }

  const handleUploadPendingFiles = async () => {
    if (!pendingFiles.length) return
    setUploadingFile(true)
    let lastFileId = null
    try {
      for (const file of pendingFiles) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await api.post(`/pattern-library/${id}/files`, fd, {
          headers: { 'Content-Type': undefined }
        })
        setAdditionalFiles(prev => [...prev, res.data.file])
        lastFileId = res.data.file.id
      }
      if (lastFileId) handleSelectFile(lastFileId)
      setShowAddFilesModal(false)
      setPendingFiles([])
    } catch (err) {
      console.error('Erreur ajout fichier:', err)
      alert(err.response?.data?.error || "Erreur lors de l'ajout du fichier")
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteAdditionalFile = async (fileId) => {
    if (!confirm('Supprimer ce fichier ?')) return
    try {
      await api.delete(`/pattern-library/${id}/files/${fileId}`)
      // Révoquer le blob
      if (additionalFileUrls[fileId]) {
        window.URL.revokeObjectURL(additionalFileUrls[fileId])
        setAdditionalFileUrls(prev => { const n = { ...prev }; delete n[fileId]; return n })
      }
      setAdditionalFiles(prev => prev.filter(f => f.id !== fileId))
      // Revenir au fichier principal si on supprime le fichier affiché
      if (selectedFileId === fileId) setSelectedFileId(null)
    } catch (err) {
      console.error('Erreur suppression fichier:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) return
    setSavingNote(true)
    try {
      const res = await api.post(`/pattern-library/${id}/notes`, {
        note: newNoteText.trim(),
        project_id: newNoteProjectId ? parseInt(newNoteProjectId) : null
      })
      setUsageNotes(prev => [res.data.note, ...prev])
      setNewNoteText('')
      setNewNoteProjectId('')
      setShowAddNote(false)
    } catch (err) {
      console.error('Erreur création note:', err)
      alert('Erreur lors de la création de la note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleUpdateNote = async (noteId) => {
    if (!editingNoteText.trim()) return
    setSavingNote(true)
    try {
      const res = await api.put(`/pattern-library/${id}/notes/${noteId}`, { note: editingNoteText.trim() })
      setUsageNotes(prev => prev.map(n => n.id === noteId ? res.data.note : n))
      setEditingNoteId(null)
      setEditingNoteText('')
    } catch (err) {
      console.error('Erreur mise à jour note:', err)
      alert('Erreur lors de la mise à jour')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Supprimer cette note ?')) return
    try {
      await api.delete(`/pattern-library/${id}/notes/${noteId}`)
      setUsageNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (err) {
      console.error('Erreur suppression note:', err)
      alert('Erreur lors de la suppression')
    }
  }

  const validateForm = () => {
    const errors = {}
    if (editType === 'file' && file) {
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) errors.file = `Fichier trop volumineux (max 10MB)`
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) errors.file = `Format non autorisé (PDF, JPG, PNG, WEBP)`
    } else if (editType === 'url') {
      if (!formData.url?.trim()) errors.url = 'URL obligatoire'
      else {
        try {
          new URL(formData.url)
          if (!formData.url.startsWith('http')) errors.url = "L'URL doit commencer par http:// ou https://"
        } catch { errors.url = "URL invalide" }
      }
    } else if (editType === 'text') {
      if (!formData.pattern_text?.trim()) errors.pattern_text = 'Texte obligatoire'
      else if (formData.pattern_text.trim().length < 10) errors.pattern_text = 'Au moins 10 caractères'
    }
    if (!formData.name?.trim()) errors.name = 'Nom obligatoire'
    else if (formData.name.trim().length < 2) errors.name = 'Au moins 2 caractères'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdatePattern = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setUploading(true)
    try {
      if (editType === 'file' && file) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('name', formData.name)
        if (formData.description) formDataUpload.append('description', formData.description)
        if (formData.category) formDataUpload.append('category', formData.category)
        if (formData.technique) formDataUpload.append('technique', formData.technique)
        if (formData.difficulty) formDataUpload.append('difficulty', formData.difficulty)
        if (formData.notes) formDataUpload.append('notes', formData.notes)
        formDataUpload.append('_method', 'PUT')
        await api.post(`/pattern-library/${id}`, formDataUpload, { headers: { 'Content-Type': undefined } })
      } else {
        const updateData = { name: formData.name, description: formData.description,
          category: formData.category, technique: formData.technique,
          difficulty: formData.difficulty, notes: formData.notes }
        if (editType === 'url') updateData.url = formData.url
        else if (editType === 'text') updateData.pattern_text = formData.pattern_text
        await api.put(`/pattern-library/${id}`, updateData)
      }
      await fetchPattern(editType === 'file' && file)
      setShowEditModal(false)
      setFile(null)
    } catch (err) {
      console.error('Erreur modification:', err)
      alert(err.response?.data?.message || 'Erreur lors de la modification')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    return () => { if (fileUrl) window.URL.revokeObjectURL(fileUrl) }
  }, [fileUrl])

  const filteredProjects = userProjects.filter(p =>
    p.name?.toLowerCase().includes(projectSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement du patron...</p>
        </div>
      </div>
    )
  }

  if (error || !pattern) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patron introuvable</h2>
          <p className="text-gray-600 mb-6">{error || "Ce patron n'existe pas ou a été supprimé"}</p>
          <Link to="/pattern-library" className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition inline-block">
            ← Retour à la bibliothèque
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

      {/* Breadcrumb */}
      <Link to="/pattern-library" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Bibliothèque de patrons
      </Link>

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Colonne principale : contenu du patron */}
        <div className="lg:col-span-2 space-y-4">

          {/* Titre + favori */}
          <div className="flex items-start gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex-1 min-w-0 break-words">
              {pattern.name}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition"
              title={pattern.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {pattern.is_favorite ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              )}
            </button>
          </div>

          {pattern.description && (
            <p className="text-gray-600 break-words">{pattern.description}</p>
          )}

          {/* Tags */}
          {(pattern.category || pattern.technique || pattern.difficulty) && (
            <div className="flex flex-wrap gap-2">
              {pattern.technique && (
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  {pattern.technique === 'tricot' ? 'Tricot' : 'Crochet'}
                </span>
              )}
              {pattern.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {getCategoryLabel(pattern.category)}
                </span>
              )}
              {pattern.difficulty && (
                <span className="px-3 py-1 bg-warm-100 text-primary-700 rounded-full text-sm">
                  {pattern.difficulty}
                </span>
              )}
            </div>
          )}

          {/* Contenu du patron */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

            {/* Barre de navigation multi-fichiers (uniquement si type = file) */}
            {pattern.source_type === 'file' && (additionalFiles.length > 0 || true) && (
              <div className="border-b border-gray-200 px-4 pt-3 pb-0 flex items-center gap-2 flex-wrap">
                {/* Fichier principal */}
                <button
                  onClick={() => handleSelectFile(null)}
                  className={`px-3 py-1.5 text-sm rounded-t-lg border-b-2 transition font-medium ${
                    selectedFileId === null
                      ? 'border-primary-600 text-primary-700 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {pattern.file_type === 'pdf' ? 'PDF principal' : 'Image principale'}
                </button>

                {/* Fichiers additionnels */}
                {additionalFiles.map((f, index) => (
                  <div key={f.id} className="relative group flex items-center">
                    <button
                      onClick={() => handleSelectFile(f.id)}
                      className={`px-3 py-1.5 text-sm rounded-t-lg border-b-2 transition font-medium pr-7 ${
                        selectedFileId === f.id
                          ? 'border-primary-600 text-primary-700 bg-primary-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {f.file_type === 'pdf' ? 'PDF' : 'Image'} {index + 2}
                    </button>
                    <button
                      onClick={() => handleDeleteAdditionalFile(f.id)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition hidden group-hover:flex items-center justify-center text-xs leading-none"
                      title="Supprimer ce fichier"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {/* Bouton ajouter des fichiers */}
                <div className="ml-auto pb-1.5">
                  <button
                    onClick={() => { setPendingFiles([]); setShowAddFilesModal(true) }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Ajouter des fichiers
                  </button>
                </div>
              </div>
            )}

            {/* Affichage fichier principal */}
            {pattern.source_type === 'file' && selectedFileId === null && (
              <>
                {pattern.file_type === 'pdf' && (
                  <div className="min-h-[500px]">
                    {fileUrl && !loadingFile && (
                      <div className="px-4 pt-4 pb-0 flex justify-end">
                        <button onClick={() => setShowFullscreen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                          </svg>
                          Plein écran
                        </button>
                      </div>
                    )}
                    {loadingFile ? (
                      <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                      </div>
                    ) : fileUrl ? (
                      <PDFViewer url={fileUrl} fileName={pattern.name} />
                    ) : (
                      <div className="text-center py-12 text-gray-500">Impossible de charger le PDF</div>
                    )}
                  </div>
                )}

                {pattern.file_type === 'image' && (
                  <div className="p-6">
                    {loadingFile ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                      </div>
                    ) : fileUrl ? (
                      <div className="flex items-center justify-center cursor-pointer" onClick={() => setShowImageLightbox(true)}>
                        <img src={fileUrl} alt={pattern.name} className="max-w-full max-h-[700px] object-contain shadow-md rounded-lg hover:opacity-90 transition" />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">Impossible de charger l'image</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Affichage fichier additionnel sélectionné */}
            {pattern.source_type === 'file' && selectedFileId !== null && (() => {
              const selFile = additionalFiles.find(f => f.id === selectedFileId)
              const selUrl = additionalFileUrls[selectedFileId]
              if (!selFile) return null
              return (
                <>
                  {selFile.file_type === 'pdf' && (
                    <div className="min-h-[500px]">
                      {selUrl ? <PDFViewer url={selUrl} fileName={selFile.file_name || 'fichier'} /> : (
                        <div className="flex items-center justify-center py-16">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                        </div>
                      )}
                    </div>
                  )}
                  {selFile.file_type === 'image' && (
                    <div className="p-6 flex items-center justify-center">
                      {selUrl ? (
                        <img src={selUrl} alt={selFile.file_name} className="max-w-full max-h-[700px] object-contain shadow-md rounded-lg" />
                      ) : (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}

            {/* URL */}
            {pattern.source_type === 'url' && pattern.url && (
              <ProxyViewer url={pattern.url} />
            )}

            {/* Texte */}
            {pattern.source_type === 'text' && pattern.pattern_text && (
              <div>
                <div className="px-4 pt-4 pb-0 flex justify-end">
                  <button onClick={() => setShowTextFullscreen(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    Plein écran
                  </button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-5">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm">{pattern.pattern_text}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* CTA principal : utiliser dans un projet */}
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-primary-800 mb-1">Utiliser ce patron</p>
            <p className="text-xs text-primary-600 mb-3">
              Liez ce patron à un de vos projets pour le retrouver facilement.
            </p>
            <button
              onClick={openLinkProjectModal}
              className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition text-sm"
            >
              Lier à un projet
            </button>
          </div>

          {/* Projets liés */}
          {(linkedProjects.length > 0 || pattern.times_used > 0) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                Projets liés
                <span className="ml-auto text-xs text-gray-500 font-normal">
                  {pattern.times_used || linkedProjects.length} projet{(pattern.times_used || linkedProjects.length) > 1 ? 's' : ''}
                </span>
              </h3>

              {linkedProjects.length > 0 ? (
                <div className="space-y-2">
                  {linkedProjects.map(project => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition group"
                    >
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700 group-hover:text-primary-600 transition flex-1 min-w-0 truncate">
                        {project.name}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Utilisé dans {pattern.times_used} projet{pattern.times_used > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          )}

          {/* Notes personnelles */}
          {pattern.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Notes personnelles</h3>
              <p className="text-sm text-amber-800 whitespace-pre-wrap">{pattern.notes}</p>
            </div>
          )}

          {/* Notes d'utilisation */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notes d'utilisation</h3>
                {!isPro && (
                  <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded">PRO</span>
                )}
              </div>
              {isPro && !showAddNote && (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Ajouter
                </button>
              )}
            </div>

            {!isPro ? (
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Notez vos adaptations pour chaque utilisation — aiguilles, modifications du patron, fil substitué…
                </p>
                <Link to="/subscription" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Passer à PRO — 3,99€/mois
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Formulaire d'ajout */}
                {showAddNote && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Aiguilles 4mm, modification rang 12, laine Drops Merino..."
                      rows={3}
                      autoFocus
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                      maxLength={2000}
                    />
                    {userProjects.length > 0 && (
                      <select
                        value={newNoteProjectId}
                        onChange={(e) => setNewNoteProjectId(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="">Projet (optionnel)</option>
                        {userProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setShowAddNote(false); setNewNoteText(''); setNewNoteProjectId('') }}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleCreateNote}
                        disabled={savingNote || !newNoteText.trim()}
                        className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                      >
                        {savingNote ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Liste des notes */}
                {usageNotes.length === 0 && !showAddNote && (
                  <p className="text-xs text-gray-400 italic">
                    Aucune note pour l'instant. Ajoutez vos adaptations, substitutions de laine, modifications…
                  </p>
                )}

                {usageNotes.map(note => (
                  <div key={note.id} className="border border-gray-100 rounded-lg p-3">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          rows={3}
                          autoFocus
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                          maxLength={2000}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditingNoteId(null); setEditingNoteText('') }}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={savingNote}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                          >
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {note.project_name && (
                          <p className="text-xs text-primary-600 font-medium mb-1">{note.project_name}</p>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(note.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <button
                            onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.note) }}
                            className="text-xs text-gray-400 hover:text-primary-600 transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-xs text-gray-400 hover:text-red-500 transition"
                          >
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions secondaires */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Modifier le patron
            </button>

            {pattern.source_type === 'file' && fileUrl && (
              <a
                href={fileUrl}
                download={pattern.file_name || pattern.name}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Télécharger le fichier
              </a>
            )}

            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Supprimer
            </button>
          </div>

          {/* Date discrète */}
          <p className="text-xs text-gray-400 text-center">
            Ajouté le {new Date(pattern.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Modale plein écran PDF */}
      {showFullscreen && fileUrl && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{pattern.name}</h2>
            <button
              onClick={() => setShowFullscreen(false)}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Fermer
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <PDFViewer url={fileUrl} fileName={pattern.name} />
          </div>
        </div>
      )}

      {/* Lightbox image */}
      {showImageLightbox && fileUrl && (
        <ImageLightbox src={fileUrl} alt={pattern.name} onClose={() => setShowImageLightbox(false)} />
      )}

      {/* Modale plein écran texte */}
      {showTextFullscreen && pattern.pattern_text && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{pattern.name}</h2>
            <button
              onClick={() => setShowTextFullscreen(false)}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Fermer
            </button>
          </div>
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-base">
                {pattern.pattern_text}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Modale liaison projet */}
      {showLinkProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Lier à un projet</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choisissez le projet dans lequel vous utilisez ce patron.
              </p>
            </div>

            <div className="p-6">
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-500"
                autoFocus
              />

              {loadingProjects ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-3">Aucun projet trouvé.</p>
                  <Link
                    to="/projects/new"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Créer un nouveau projet
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => handleLinkProject(project.id)}
                      disabled={linkingProject === project.id}
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition text-left"
                    >
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{project.name}</p>
                        {project.status && (
                          <p className="text-xs text-gray-500">{project.status === 'in_progress' ? 'En cours' : project.status}</p>
                        )}
                      </div>
                      {linkingProject === project.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowLinkProjectModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale ajout de fichiers */}
      {showAddFilesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Ajouter des fichiers</h2>
              <button onClick={() => setShowAddFilesModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-default ${
                  isDragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-400 mx-auto mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-600 mb-1">Glissez vos fichiers ici</p>
                <p className="text-xs text-gray-400 mb-3">PDF, JPG, PNG, WEBP</p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    onChange={(e) => addPendingFiles(e.target.files)}
                    className="hidden"
                  />
                  Parcourir
                </label>
              </div>

              {/* Liste des fichiers en attente */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {pendingFiles.length} fichier{pendingFiles.length > 1 ? 's' : ''} sélectionné{pendingFiles.length > 1 ? 's' : ''}
                  </p>
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                        {f.type === 'application/pdf' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{f.name}</p>
                        <p className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <button
                        onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddFilesModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleUploadPendingFiles}
                disabled={!pendingFiles.length || uploadingFile}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingFile ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    Upload en cours…
                  </>
                ) : (
                  `Uploader${pendingFiles.length > 0 ? ` (${pendingFiles.length})` : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'édition */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Modifier le patron</h2>
            </div>

            <form onSubmit={handleUpdatePattern} className="p-6">
              {/* Fichier */}
              {pattern.source_type === 'file' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remplacer le fichier (optionnel)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Fichier actuel : <strong>{pattern.file_name || 'Non disponible'}</strong>
                  </p>
                  <input
                    type="file"
                    id="edit-file-input"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => { setFile(e.target.files[0]); setValidationErrors({ ...validationErrors, file: '' }) }}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-file-input"
                    className={`flex items-center justify-center w-full px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition hover:border-primary-400 hover:bg-primary-50 ${validationErrors.file ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  >
                    <div className="text-center">
                      {file ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-primary-600 mx-auto mb-2">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                          </svg>
                          <p className="font-medium text-sm text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Cliquer pour changer</p>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mx-auto mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="font-medium text-sm text-gray-900">Choisir un nouveau fichier</p>
                          <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, WEBP (max 10MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                  {validationErrors.file && <p className="mt-2 text-sm text-red-600">{validationErrors.file}</p>}
                </div>
              )}

              {/* URL */}
              {editType === 'url' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL <span className="text-red-600">*</span></label>
                  <input type="url" value={formData.url}
                    onChange={(e) => { setFormData({ ...formData, url: e.target.value }); setValidationErrors({ ...validationErrors, url: '' }) }}
                    placeholder="https://..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${validationErrors.url ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {validationErrors.url && <p className="mt-1 text-sm text-red-600">{validationErrors.url}</p>}
                </div>
              )}

              {/* Texte */}
              {editType === 'text' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texte du patron <span className="text-red-600">*</span></label>
                  <textarea value={formData.pattern_text}
                    onChange={(e) => { setFormData({ ...formData, pattern_text: e.target.value }); setValidationErrors({ ...validationErrors, pattern_text: '' }) }}
                    rows={12}
                    className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 ${validationErrors.pattern_text ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {validationErrors.pattern_text && <p className="mt-1 text-sm text-red-600">{validationErrors.pattern_text}</p>}
                </div>
              )}

              {/* Nom */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom <span className="text-red-600">*</span></label>
                <input type="text" value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setValidationErrors({ ...validationErrors, name: '' }) }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${validationErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                />
                {validationErrors.name && <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>}
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Métadonnées */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">-- Sélectionner --</option>
                    <option value="Vêtements">Vêtements</option>
                    <option value="Accessoires">Accessoires</option>
                    <option value="Jouets/Peluches">Jouets/Peluches</option>
                    <option value="Vêtements bébé">Vêtements bébé</option>
                    <option value="Accessoires bébé">Accessoires bébé</option>
                    <option value="Vêtements enfant">Vêtements enfant</option>
                    <option value="Maison/Déco">Maison/Déco</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technique</label>
                  <select value={formData.technique} onChange={(e) => setFormData({ ...formData, technique: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">-- Sélectionner --</option>
                    <option value="tricot">Tricot</option>
                    <option value="crochet">Crochet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulté</label>
                  <select value={formData.difficulty} onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">-- Sélectionner --</option>
                    <option value="facile">Facile</option>
                    <option value="moyen">Moyen</option>
                    <option value="difficile">Difficile</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes personnelles</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button type="submit" disabled={uploading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50">
                  {uploading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatternLibraryDetail
