import React from 'react'

interface StepperProps {
  currentStep: number 
  totalSteps: number
}

function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNumber = i + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <React.Fragment key={stepNumber}>
            <div
              aria-current={isActive ? 'step' : undefined}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300
                ${isActive ? 'gradient-button border-brand-cyan text-white shadow-lg shadow-brand-cyan/20' : ''}
                ${isCompleted ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan' : ''}
                ${!isActive && !isCompleted ? 'border-white/20 text-gray-400' : ''}
              `}
            >
              {stepNumber}
            </div>

            {stepNumber < totalSteps && (
              <div className={`flex-1 h-px mx-3 transition-all duration-300 ${isCompleted ? 'bg-brand-cyan' : 'bg-white/20'} `} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default Stepper