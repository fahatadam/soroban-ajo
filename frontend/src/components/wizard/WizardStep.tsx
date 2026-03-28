import React from 'react'

interface WizardStepProps {
  title: string
  description?: string
  children: React.ReactNode
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  isLastStep?: boolean
  isLoading?: boolean
  canProceed?: boolean
}

export const WizardStep: React.FC<WizardStepProps> = ({
  title,
  description,
  children,
  onNext,
  onBack,
  nextLabel = 'Next',
  isLastStep = false,
  isLoading = false,
  canProceed = true,
}) => (
  <div>
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h2>
      {description && <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p>}
    </div>

    <div className="space-y-5">{children}</div>

    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      {onNext && (
        <button
          type={isLastStep ? 'submit' : 'button'}
          onClick={isLastStep ? undefined : onNext}
          disabled={!canProceed || isLoading}
          className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {nextLabel}
        </button>
      )}
    </div>
  </div>
)
