import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          const isClickable = onStepClick && stepNumber <= currentStep;

          return (
            <div
              key={step.id || index}
              className="relative z-10 flex flex-col items-center"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(stepNumber)}
                className={cn(
                  'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all',
                  isCompleted &&
                    'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
                  isCurrent &&
                    'bg-emerald-600 text-white ring-4 ring-emerald-500/20 font-bold shadow-sm',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-white border-2 border-slate-300 text-slate-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4 text-white" /> : stepNumber}
              </button>

              <span
                className={cn(
                  'text-[10px] sm:text-xs font-semibold mt-1.5 text-center hidden md:block max-w-[90px] leading-tight',
                  isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
