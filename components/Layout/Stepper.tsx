import React from 'react';
import { STEPS_LABELS } from '../../constants';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS_LABELS.length - 1)) * 100}%` }}
        />

        {STEPS_LABELS.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-white border-2 border-green-500 text-green-600 scale-125' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-white border-2 border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`
                absolute top-10 text-xs font-medium w-24 text-center transition-colors
                ${isCurrent ? 'text-green-700 font-bold' : 'text-gray-400'}
                ${isCurrent || isCompleted ? 'opacity-100' : 'opacity-0 md:opacity-100'}
              `}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
