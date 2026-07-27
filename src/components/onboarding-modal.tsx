import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { onboardingSteps } from '../data/onboarding'

type OnboardingModalProps = {
  isOpen: boolean
  isPremium?: boolean
  onComplete: () => void
}

export function OnboardingModal({ isOpen, isPremium, onComplete }: OnboardingModalProps) {
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const steps = useMemo(
    () => onboardingSteps.filter((s) => !s.premiumOnly || !isPremium),
    [isPremium]
  )

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0)
      setTimeout(() => setShow(true), 10)
    } else {
      setShow(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const step = steps[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setStepIndex((i) => i + 1)
    }
  }

  const handleViewPremium = () => {
    onComplete()
    navigate('/profile')
  }

  const handleBack = () => {
    if (!isFirstStep) setStepIndex((i) => i - 1)
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-fade-in">
      <div
        className={`bg-white dark:bg-[#2d2d2d] rounded-2xl p-6 max-w-lg w-full shadow-2xl transform transition-all duration-300 max-h-[85vh] overflow-y-auto ${
          show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Skip */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onComplete}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            Pular
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center px-2 pb-2 min-h-[220px] justify-center">
          <div className="text-6xl mb-4">{step.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">{step.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 my-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === stepIndex ? 'w-6 bg-[#27AE60]' : 'w-2 bg-gray-300 dark:bg-[#404040]'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`flex items-center gap-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              isFirstStep
                ? 'opacity-0 pointer-events-none'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
            }`}
          >
            <ChevronLeft size={18} />
            Voltar
          </button>
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 bg-[#27AE60] hover:bg-[#229954] text-white font-bold px-6 py-2.5 rounded-lg transition-colors shadow-md"
          >
            {isLastStep ? 'Começar a treinar' : 'Próximo'}
            {!isLastStep && <ChevronRight size={18} />}
          </button>
        </div>

        {step.id === 'premium' && (
          <button
            onClick={handleViewPremium}
            className="w-full text-center mt-3 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Ver planos Premium 👑
          </button>
        )}
      </div>
    </div>
  )
}
