/**
 * @file CreateProjectWizard/index.jsx
 * @brief Wizard de création de projet multi-étapes
 * @created 2026-01-27 by [AI:Claude]
 */

import { useState, useEffect } from 'react'
import WizardProgress from './WizardProgress'
import WizardNavigation from './WizardNavigation'
import Step1Template from './steps/Step1Template'
import Step2BasicInfo from './steps/Step2BasicInfo'
import Step3Sections from './steps/Step3Sections'
import Step4Optional from './steps/Step4Optional'

const TOTAL_STEPS = 4

const CreateProjectWizard = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  submitLabel,
  // Tags & permissions
  canUseTags,
  popularTags,
  onShowUpgradePrompt,
  // Pattern modals
  onOpenLibraryModal,
  onOpenUrlModal,
  onOpenTextModal,
  // Pattern state (géré par le parent)
  patternType,
  setPatternType,
  patternFile,
  setPatternFile,
  patternUrl,
  patternText,
  selectedLibraryPattern
}) => {
  const [currentStep, setCurrentStep] = useState(1)

  // État du wizard
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    technique: 'crochet',
    type: '',
    counter_unit: 'rows'
  })
  const [sections, setSections] = useState([])
  const [description, setDescription] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [projectTags, setProjectTags] = useState([])
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [technicalForm, setTechnicalForm] = useState({
    yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
    needles: [{ type: '', size: '', length: '' }],
    gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' }
  })

  // Reset quand on ferme le wizard
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
      setSelectedCategory(null)
      setFormData({
        name: '',
        technique: 'crochet',
        type: '',
        counter_unit: 'rows'
      })
      setSections([])
      setDescription('')
      setIsFavorite(false)
      setProjectTags([])
      setShowTechnicalDetails(false)
      setTechnicalForm({
        yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
        needles: [{ type: '', size: '', length: '' }],
        gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' }
      })
    }
  }, [isOpen])

  // Quand on sélectionne une catégorie, pré-remplir le type
  const handleSelectCategory = (category) => {
    setSelectedCategory(category)
    setFormData(prev => ({ ...prev, type: category.value }))
    setSections([])
  }

  // Validation par étape
  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory !== null
      case 2:
        return formData.name.trim().length >= 2
      case 3:
        // Sections optionnelles, mais si présentes, doivent avoir un nom
        return sections.every(s => s.name.trim().length > 0)
      case 4:
        return true // Étape optionnelle
      default:
        return false
    }
  }

  // Navigation possible vers une étape
  const canNavigate = (step) => {
    if (step > currentStep) return false
    return true
  }

  // Handlers de navigation
  const handleNext = () => {
    if (canGoNext() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step) => {
    if (canNavigate(step)) {
      setCurrentStep(step)
    }
  }

  // Skip étape 4 = créer directement
  const handleSkip = () => {
    handleSubmit()
  }

  // Soumission finale
  const handleSubmit = () => {
    const projectData = {
      formData: {
        ...formData,
        description
      },
      sections,
      technicalForm,
      isFavorite,
      projectTags
    }

    onSubmit(projectData)
  }

  // Tags handlers
  const handleAddTag = (tag) => {
    if (!canUseTags) {
      onShowUpgradePrompt()
      return
    }
    if (!projectTags.includes(tag)) {
      setProjectTags([...projectTags, tag])
    }
  }

  const handleRemoveTag = (tag) => {
    setProjectTags(projectTags.filter(t => t !== tag))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">🧶 Nouveau projet</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <WizardProgress
            currentStep={currentStep}
            onStepClick={handleStepClick}
            canNavigate={canNavigate}
          />
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {currentStep === 1 && (
            <Step1Template
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {currentStep === 2 && (
            <Step2BasicInfo
              formData={formData}
              onFormChange={setFormData}
            />
          )}

          {currentStep === 3 && (
            <Step3Sections
              sections={sections}
              onSectionsChange={setSections}
              selectedCategory={selectedCategory}
              counterUnit={formData.counter_unit}
            />
          )}

          {currentStep === 4 && (
            <Step4Optional
              patternType={patternType}
              setPatternType={setPatternType}
              patternFile={patternFile}
              setPatternFile={setPatternFile}
              patternUrl={patternUrl}
              patternText={patternText}
              selectedLibraryPattern={selectedLibraryPattern}
              onOpenLibraryModal={onOpenLibraryModal}
              onOpenUrlModal={onOpenUrlModal}
              onOpenTextModal={onOpenTextModal}
              showTechnicalDetails={showTechnicalDetails}
              setShowTechnicalDetails={setShowTechnicalDetails}
              technicalForm={technicalForm}
              setTechnicalForm={setTechnicalForm}
              technique={formData.technique}
              canUseTags={canUseTags}
              projectTags={projectTags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              popularTags={popularTags}
              isFavorite={isFavorite}
              setIsFavorite={setIsFavorite}
              onShowUpgradePrompt={onShowUpgradePrompt}
              description={description}
              setDescription={setDescription}
            />
          )}
        </div>

        {/* Navigation */}
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
          onSubmit={handleSubmit}
          canGoNext={canGoNext()}
          isSubmitting={isSubmitting}
          submitLabel={submitLabel}
        />
      </div>
    </div>
  )
}

export default CreateProjectWizard
