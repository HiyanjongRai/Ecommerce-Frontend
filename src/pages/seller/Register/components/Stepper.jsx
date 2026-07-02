import React from 'react';

const STEPS_CONFIG = [
  { step: 1, label: 'Account Details' },
  { step: 2, label: 'Business Info' },
  { step: 3, label: 'Verification' },
];

const Stepper = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full py-4 font-inter">
      <div className="flex items-center justify-between">
        {STEPS_CONFIG.map((item, idx) => {
          const isCompleted = item.step < currentStep;
          const isActive = item.step === currentStep;
          const isLast = idx === STEPS_CONFIG.length - 1;

          return (
            <React.Fragment key={item.step}>
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => onStepClick(item.step)}
                disabled={item.step > currentStep}
                className="flex flex-col items-center focus:outline-none group relative cursor-pointer"
                aria-label={`Step ${item.step}: ${item.label}`}
              >
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-reg-primary border-reg-primary text-white shadow-[0_4px_10px_rgba(22,163,74,0.2)]'
                      : isActive
                      ? 'bg-white border-reg-primary text-reg-primary ring-4 ring-reg-primary/10 shadow-sm scale-105'
                      : 'bg-white border-reg-border text-reg-placeholder group-hover:border-reg-text-sec group-hover:text-reg-text-sec'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    item.step
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={`text-[11px] md:text-xs font-semibold mt-2 whitespace-nowrap transition-colors duration-250 ${
                    isActive ? 'text-reg-accent font-bold' : isCompleted ? 'text-reg-primary' : 'text-reg-text-sec'
                  }`}
                >
                  {item.label}
                </span>
              </button>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 mx-2 md:mx-4 h-[2px] -translate-y-3 relative overflow-hidden bg-reg-border rounded-full">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-reg-primary transition-all duration-500"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
