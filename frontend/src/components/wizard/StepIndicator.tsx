import React from 'react'

interface Step {
  id: number
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => (
  <div className="flex items-center w-full mb-8">
    {steps.map((step, i) => {
      const done = step.id < currentStep
      const active = step.id === currentStep
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                done
                  ? 'bg-blue-600 text-white'
                  : active
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                  : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
              }`}
            >
              {done ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.id
              )}
            </div>
            <span className={`mt-1 text-xs font-medium ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${done ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`} />
          )}
        </React.Fragment>
      )
    })}
  </div>
)
